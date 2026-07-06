package controller

import (
	"strings"
	"time"

	config "github.com/mdhasib01/go-rest-starter/config"
	dao "github.com/mdhasib01/go-rest-starter/dao"
	itn "github.com/mdhasib01/go-rest-starter/itn"
	model "github.com/mdhasib01/go-rest-starter/model"
	"github.com/mdhasib01/go-rest-starter/pkg/cloudinary"
	"github.com/mdhasib01/go-rest-starter/pkg/data"
	"github.com/mdhasib01/go-rest-starter/pkg/logger"
	security "github.com/mdhasib01/go-rest-starter/security"
	utils "github.com/mdhasib01/go-rest-starter/utils"
)

func cld() *cloudinary.Client {
	return cloudinary.New(
		config.Param.CloudinaryCloudName,
		config.Param.CloudinaryAPIKey,
		config.Param.CloudinaryAPISecret,
	)
}

// destroyImage removes an asset from Cloudinary, best-effort (logs on failure).
func destroyImage(publicID string) {
	if strings.TrimSpace(publicID) == "" {
		return
	}
	if err := cld().Destroy(publicID); err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"public_id": publicID})
	}
}

// ---------- Auth ----------

func buildAuthResponse(user model.User, withToken bool) (model.POSAuthResponse, error) {
	role, err := dao.GetRole(user.IdRole)
	if err != nil {
		return model.POSAuthResponse{}, err
	}

	var permissions []model.Permission
	if user.IdRole == model.SUPERADMIN {
		permissions, err = dao.GetAllPermissions()
	} else {
		permissions, err = dao.GetRolePermissions(user.IdRole)
	}
	if err != nil {
		return model.POSAuthResponse{}, err
	}

	names := make([]string, 0, len(permissions))
	for _, p := range permissions {
		names = append(names, p.Name)
	}

	name := strings.TrimSpace(user.Firstname + " " + user.Lastname)
	if name == "" {
		name = user.Email
	}

	resp := model.POSAuthResponse{
		User: model.POSUser{
			Id:     user.Id,
			Email:  user.Email,
			Name:   name,
			Role:   role.Name,
			IdRole: user.IdRole,
		},
		Role:        role.Name,
		Permissions: names,
	}

	if withToken {
		session := model.Session{RoleId: user.IdRole, UserId: user.Id, IsValid: true}
		token, session := createToken(session)
		session.Token = token
		if err := dao.CreateSession(session); err != nil {
			return model.POSAuthResponse{}, err
		}
		resp.Token = token
	}

	return resp, nil
}

func POSLogin(req model.POSLoginRequest) (model.POSAuthResponse, error) {
	identifier := strings.ToLower(strings.TrimSpace(req.Email))
	if identifier == "" {
		identifier = strings.ToLower(strings.TrimSpace(req.Username))
	}
	if identifier == "" {
		return model.POSAuthResponse{}, model.NewError(itn.ErrorUsernameRequired, 400)
	}
	if utils.IsEmpty(string(req.Password)) {
		return model.POSAuthResponse{}, model.NewError(itn.ErrorPasswordRequired, 400)
	}

	user, err := dao.GetUserForLogin(identifier)
	if err != nil {
		return model.POSAuthResponse{}, err
	}

	if !user.IsActive {
		return model.POSAuthResponse{}, model.NewError(itn.ErrorLoginFailed, 403)
	}

	if security.VerifyPassword(string(user.Password), string(req.Password)) != nil {
		return model.POSAuthResponse{}, model.NewError(itn.ErrorLoginFailed, 403)
	}

	_ = dao.UpdateLastLogin(user.Id)

	return buildAuthResponse(user, true)
}

func POSRegister(req model.POSRegisterRequest) (model.POSAuthResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || !utils.IsEmail(email) {
		return model.POSAuthResponse{}, model.NewError(itn.ErrorEmailInvalid, 400)
	}
	if len(string(req.Password)) < 6 {
		return model.POSAuthResponse{}, model.NewError(itn.ErrorPasswordTooShort, 400)
	}

	if _, exists := dao.IsExistInDb(email, "users", "email"); exists {
		return model.POSAuthResponse{}, model.NewError(itn.ErrorEmailExists, 409)
	}

	hashed, err := security.Hash(string(req.Password))
	if err != nil {
		return model.POSAuthResponse{}, model.UnknownError
	}

	firstname := strings.TrimSpace(req.Name)
	if firstname == "" {
		firstname = strings.Split(email, "@")[0]
	}

	user := model.User{
		Firstname:  firstname,
		Email:      email,
		Username:   email,
		Password:   data.HiddenJsonString(string(hashed)),
		IdRole:     model.CASHIER,
		IsActive:   true,
		IsVerified: true,
		CreatedBy:  model.OUTBOUND_USER,
	}

	if err := dao.CreateUser(&user); err != nil {
		return model.POSAuthResponse{}, err
	}

	return buildAuthResponse(user, true)
}

func POSMe(session model.Session) (model.POSAuthResponse, error) {
	user, err := dao.GetUserByID(session.UserId)
	if err != nil {
		return model.POSAuthResponse{}, err
	}
	return buildAuthResponse(user, false)
}

func POSLogout(token string) error {
	_, err := dao.DisableSession(token)
	return err
}

// ---------- Categories ----------

func POSGetCategories() ([]model.Category, error) {
	return dao.GetCategories()
}

func POSCreateCategory(req model.CategoryRequest) (model.Category, error) {
	if utils.IsEmpty(req.Name) {
		return model.Category{}, model.NewError(itn.ErrorNameIsRequired, 400)
	}
	if utils.IsEmpty(req.NameBn) {
		req.NameBn = req.Name
	}
	return dao.CreateCategory(req)
}

func POSUpdateCategory(id string, req model.CategoryRequest) (model.Category, error) {
	if utils.IsEmpty(req.Name) {
		return model.Category{}, model.NewError(itn.ErrorNameIsRequired, 400)
	}
	if utils.IsEmpty(req.NameBn) {
		req.NameBn = req.Name
	}
	return dao.UpdateCategory(id, req)
}

func POSDeleteCategory(id string) error {
	return dao.DeleteCategory(id)
}

// ---------- Products ----------

func POSGetProducts(inStockOnly bool) ([]model.Product, error) {
	return dao.GetProducts(inStockOnly)
}

func POSGetProduct(id string) (model.Product, error) {
	return dao.GetProductByID(id)
}

func validateProduct(req *model.ProductRequest) error {
	if utils.IsEmpty(req.Name) {
		return model.NewError(itn.ErrorNameIsRequired, 400)
	}
	if utils.IsEmpty(req.Barcode) {
		return model.NewError(itn.ErrorInvalidData, 400)
	}
	if req.Price < 0 || req.Stock < 0 {
		return model.NewError(itn.ErrorValueCannotBeNegative, 400)
	}
	if utils.IsEmpty(req.NameBn) {
		req.NameBn = req.Name
	}
	if req.CategoryId != nil && strings.TrimSpace(*req.CategoryId) == "" {
		req.CategoryId = nil
	}
	return nil
}

func POSCreateProduct(req model.ProductRequest) (model.Product, error) {
	if err := validateProduct(&req); err != nil {
		return model.Product{}, err
	}
	return dao.CreateProduct(req)
}

func POSUpdateProduct(id string, req model.ProductRequest) (model.Product, error) {
	if err := validateProduct(&req); err != nil {
		return model.Product{}, err
	}

	old, err := dao.GetProductByID(id)
	if err != nil {
		return model.Product{}, err
	}

	updated, err := dao.UpdateProduct(id, req)
	if err != nil {
		return model.Product{}, err
	}

	// If the image was replaced or removed, delete the previous Cloudinary asset.
	if old.ImagePublicId != nil && *old.ImagePublicId != "" {
		newID := ""
		if req.ImagePublicId != nil {
			newID = *req.ImagePublicId
		}
		if newID != *old.ImagePublicId {
			destroyImage(*old.ImagePublicId)
		}
	}

	return updated, nil
}

func POSDeleteProduct(id string) error {
	product, err := dao.GetProductByID(id)
	if err != nil {
		return err
	}

	if err := dao.DeleteProduct(id); err != nil {
		return err
	}

	// Product row gone — remove its image from Cloudinary too.
	if product.ImagePublicId != nil {
		destroyImage(*product.ImagePublicId)
	}
	return nil
}

// ---------- Image upload ----------

func POSUploadImage(dataURI string) (model.UploadImageResponse, error) {
	if strings.TrimSpace(dataURI) == "" {
		return model.UploadImageResponse{}, model.NewError(itn.ErrorInvalidData, 400)
	}

	client := cld()
	if !client.Enabled() {
		logger.GetLogger().LogErrors(model.NewError("cloudinary not configured", 500), nil)
		return model.UploadImageResponse{}, model.NewError(itn.ErrorUnknown, 500)
	}

	res, err := client.Upload(dataURI, "pos_products")
	if err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return model.UploadImageResponse{}, model.NewError(itn.ErrorUnknown, 502)
	}

	return model.UploadImageResponse{PublicId: res.PublicID, Url: res.URL}, nil
}

func POSDeleteImage(publicID string) error {
	if strings.TrimSpace(publicID) == "" {
		return model.NewError(itn.ErrorInvalidData, 400)
	}
	if err := cld().Destroy(publicID); err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return model.NewError(itn.ErrorUnknown, 502)
	}
	return nil
}

// ---------- Sales ----------

func POSCreateSale(userID int, req model.SaleRequest) (model.Sale, error) {
	if len(req.Items) == 0 {
		return model.Sale{}, model.NewError(itn.ErrorEmptyBody, 400)
	}
	if utils.IsEmpty(req.PaymentMethod) {
		req.PaymentMethod = "cash"
	}
	for _, it := range req.Items {
		if utils.IsEmpty(it.ProductId) || it.Quantity <= 0 {
			return model.Sale{}, model.NewError(itn.ErrorInvalidData, 400)
		}
	}
	return dao.CreateSale(userID, req)
}

func POSGetSales(date string) ([]model.Sale, error) {
	start, end := dayBounds(date)
	return dao.GetSales(start, end)
}

func POSGetSale(id string) (model.Sale, error) {
	return dao.GetSaleByID(id)
}

// ---------- Dashboard ----------

func POSDashboard() (model.DashboardStats, error) {
	start, end := dayBounds("")
	return dao.GetDashboardStats(start, end)
}

// dayBounds returns [startOfDay, startOfNextDay) in RFC3339 for the given
// YYYY-MM-DD date; an empty date means today (server local time).
func dayBounds(date string) (string, string) {
	var day time.Time
	if parsed, err := time.Parse("2006-01-02", date); err == nil {
		day = parsed
	} else {
		now := time.Now()
		day = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}
	start := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, time.Local)
	end := start.AddDate(0, 0, 1)
	return start.Format(time.RFC3339), end.Format(time.RFC3339)
}
