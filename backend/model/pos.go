package model

import "github.com/mdhasib01/go-rest-starter/pkg/data"

// ---------- Domain entities ----------

type Category struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	NameBn    string `json:"name_bn"`
	CreatedAt string `json:"created_at"`
}

type Product struct {
	Id            string    `json:"id"`
	Name          string    `json:"name"`
	NameBn        string    `json:"name_bn"`
	Barcode       string    `json:"barcode"`
	CategoryId    *string   `json:"category_id"`
	Price         float64   `json:"price"`
	Stock         int       `json:"stock"`
	ImageUrl      *string   `json:"image_url"`
	ImagePublicId *string   `json:"image_public_id"`
	CreatedAt     string    `json:"created_at"`
	Category      *Category `json:"categories,omitempty"`
}

type Sale struct {
	Id            string     `json:"id"`
	InvoiceNumber string     `json:"invoice_number"`
	Total         float64    `json:"total"`
	PaymentMethod string     `json:"payment_method"`
	UserId        int        `json:"user_id"`
	CreatedAt     string     `json:"created_at"`
	Items         []SaleItem `json:"items,omitempty"`
}

type SaleItem struct {
	Id        string   `json:"id"`
	SaleId    string   `json:"sale_id"`
	ProductId *string  `json:"product_id"`
	Quantity  int      `json:"quantity"`
	Price     float64  `json:"price"`
	Subtotal  float64  `json:"subtotal"`
	Product   *Product `json:"products,omitempty"`
}

// ---------- Request / response DTOs ----------

type CategoryRequest struct {
	Name   string `json:"name"`
	NameBn string `json:"name_bn"`
}

type ProductRequest struct {
	Name          string  `json:"name"`
	NameBn        string  `json:"name_bn"`
	Barcode       string  `json:"barcode"`
	CategoryId    *string `json:"category_id"`
	Price         float64 `json:"price"`
	Stock         int     `json:"stock"`
	ImageUrl      *string `json:"image_url"`
	ImagePublicId *string `json:"image_public_id"`
}

// UploadImageRequest carries a base64 data URI (data:image/...;base64,....).
type UploadImageRequest struct {
	Image string `json:"image"`
}

type UploadImageResponse struct {
	PublicId string `json:"public_id"`
	Url      string `json:"url"`
}

type DeleteImageRequest struct {
	PublicId string `json:"public_id"`
}

type SaleItemRequest struct {
	ProductId string  `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

type SaleRequest struct {
	PaymentMethod string            `json:"payment_method"`
	Items         []SaleItemRequest `json:"items"`
}

// POSLoginRequest accepts either an email or a username in the Username field.
type POSLoginRequest struct {
	Email    string                `json:"email"`
	Username string                `json:"username"`
	Password data.HiddenJsonString `json:"password"`
}

type POSRegisterRequest struct {
	Name     string                `json:"name"`
	Email    string                `json:"email"`
	Password data.HiddenJsonString `json:"password"`
}

// POSUser is the trimmed user shape returned to the frontend.
type POSUser struct {
	Id     int    `json:"id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Role   string `json:"role"`
	IdRole int    `json:"id_role"`
}

// POSAuthResponse is returned by login / register / me.
type POSAuthResponse struct {
	Token       string   `json:"token,omitempty"`
	User        POSUser  `json:"user"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
}

type DashboardStats struct {
	TodaySales      float64 `json:"today_sales"`
	TotalProducts   int     `json:"total_products"`
	LowStock        int     `json:"low_stock"`
	TotalCategories int     `json:"total_categories"`
	RecentSales     []Sale  `json:"recent_sales"`
}
