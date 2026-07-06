package cloudinary

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

// Client is a minimal Cloudinary REST client (upload + destroy) built on the
// standard library, so no external SDK dependency is required.
type Client struct {
	CloudName string
	APIKey    string
	APISecret string
	http      *http.Client
}

func New(cloudName, apiKey, apiSecret string) *Client {
	return &Client{
		CloudName: cloudName,
		APIKey:    apiKey,
		APISecret: apiSecret,
		http:      &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c != nil && c.CloudName != "" && c.APIKey != "" && c.APISecret != ""
}

// sign builds Cloudinary's signature: the sorted "k=v&k=v" of the signed
// params with the api_secret appended, hashed with SHA-1 (hex encoded).
func (c *Client) sign(params map[string]string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var b strings.Builder
	for i, k := range keys {
		if i > 0 {
			b.WriteString("&")
		}
		b.WriteString(k + "=" + params[k])
	}
	b.WriteString(c.APISecret)

	sum := sha1.Sum([]byte(b.String()))
	return hex.EncodeToString(sum[:])
}

type UploadResult struct {
	PublicID  string `json:"public_id"`
	SecureURL string `json:"secure_url"`
	URL       string `json:"url"`
}

// Upload sends a base64 data URI (data:image/png;base64,....) to Cloudinary and
// returns the created asset's public_id and URL.
func (c *Client) Upload(dataURI, folder string) (UploadResult, error) {
	if !c.Enabled() {
		return UploadResult{}, fmt.Errorf("cloudinary is not configured")
	}

	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	signed := map[string]string{"timestamp": timestamp}
	if folder != "" {
		signed["folder"] = folder
	}
	signature := c.sign(signed)

	form := url.Values{}
	form.Set("file", dataURI)
	form.Set("api_key", c.APIKey)
	form.Set("timestamp", timestamp)
	if folder != "" {
		form.Set("folder", folder)
	}
	form.Set("signature", signature)

	endpoint := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", c.CloudName)
	resp, err := c.http.PostForm(endpoint, form)
	if err != nil {
		return UploadResult{}, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return UploadResult{}, fmt.Errorf("cloudinary upload failed (%d): %s", resp.StatusCode, string(body))
	}

	var result UploadResult
	if err := json.Unmarshal(body, &result); err != nil {
		return UploadResult{}, err
	}
	if result.URL == "" {
		result.URL = result.SecureURL
	}
	return result, nil
}

// Destroy deletes an asset from Cloudinary by public_id. A blank public_id or an
// unconfigured client is a no-op.
func (c *Client) Destroy(publicID string) error {
	if !c.Enabled() || strings.TrimSpace(publicID) == "" {
		return nil
	}

	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	signature := c.sign(map[string]string{
		"public_id": publicID,
		"timestamp": timestamp,
	})

	form := url.Values{}
	form.Set("public_id", publicID)
	form.Set("api_key", c.APIKey)
	form.Set("timestamp", timestamp)
	form.Set("signature", signature)

	endpoint := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/destroy", c.CloudName)
	resp, err := c.http.PostForm(endpoint, form)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("cloudinary destroy failed (%d): %s", resp.StatusCode, string(body))
	}

	var parsed struct {
		Result string `json:"result"`
	}
	_ = json.Unmarshal(body, &parsed)
	// "ok" = deleted, "not found" = already gone; both are acceptable outcomes.
	if parsed.Result != "" && parsed.Result != "ok" && parsed.Result != "not found" {
		return fmt.Errorf("cloudinary destroy returned: %s", parsed.Result)
	}
	return nil
}
