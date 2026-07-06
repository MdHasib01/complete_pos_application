package rest

import (
	"net/http"
	"strings"

	controller "github.com/mdhasib01/go-rest-starter/controller"
	model "github.com/mdhasib01/go-rest-starter/model"

	"github.com/gorilla/mux"
)

// POS permission ids (must match dao/migrations/000002_pos.up.sql).
const (
	ViewProductsPermission     = 20
	ManageProductsPermission   = 21
	ViewCategoriesPermission   = 22
	ManageCategoriesPermission = 23
	CreateSalePermission       = 24
	ViewSalesPermission        = 25
	ViewDashboardPermission    = 26
)

// ---------- Auth ----------

// POSLoginHandler godoc
// @Summary POS login
// @Tags pos-auth
// @Accept json
// @Produce json
// @Param body body model.POSLoginRequest true "credentials"
// @Success 200 {object} model.POSAuthResponse
// @Router /pos/login [post]
func POSLoginHandler(w http.ResponseWriter, r *http.Request) {
	var req model.POSLoginRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSLogin(req)
	JSON(w, res, err)
}

// POSRegisterHandler godoc
// @Summary POS register
// @Tags pos-auth
// @Accept json
// @Produce json
// @Param body body model.POSRegisterRequest true "registration"
// @Success 200 {object} model.POSAuthResponse
// @Router /pos/register [post]
func POSRegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req model.POSRegisterRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSRegister(req)
	JSON(w, res, err)
}

// POSMeHandler godoc
// @Summary current POS user
// @Tags pos-auth
// @Produce json
// @Security Bearer
// @Success 200 {object} model.POSAuthResponse
// @Router /pos/me [get]
func POSMeHandler(w http.ResponseWriter, r *http.Request) {
	session, err := isAuthorized(r, 0)
	if err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSMe(session)
	JSON(w, res, err)
}

// POSLogoutHandler godoc
// @Summary POS logout
// @Tags pos-auth
// @Produce json
// @Security Bearer
// @Success 200 {boolean} boolean
// @Router /pos/logout [put]
func POSLogoutHandler(w http.ResponseWriter, r *http.Request) {
	token := strings.Replace(r.Header.Get("Authorization"), "Bearer ", "", 1)
	err := controller.POSLogout(token)
	JSON(w, true, err)
}

// ---------- Categories ----------

func GetCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ViewCategoriesPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSGetCategories()
	JSON(w, res, err)
}

func CreateCategoryHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ManageCategoriesPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	var req model.CategoryRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSCreateCategory(req)
	JSON(w, res, err)
}

func UpdateCategoryHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ManageCategoriesPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	var req model.CategoryRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSUpdateCategory(mux.Vars(r)["id"], req)
	JSON(w, res, err)
}

func DeleteCategoryHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ManageCategoriesPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	err := controller.POSDeleteCategory(mux.Vars(r)["id"])
	JSON(w, true, err)
}

// ---------- Products ----------

func GetProductsHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ViewProductsPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	inStock := r.URL.Query().Get("in_stock") == "true"
	res, err := controller.POSGetProducts(inStock)
	JSON(w, res, err)
}

func GetProductHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ViewProductsPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSGetProduct(mux.Vars(r)["id"])
	JSON(w, res, err)
}

func CreateProductHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ManageProductsPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	var req model.ProductRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSCreateProduct(req)
	JSON(w, res, err)
}

func UpdateProductHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ManageProductsPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	var req model.ProductRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSUpdateProduct(mux.Vars(r)["id"], req)
	JSON(w, res, err)
}

func DeleteProductHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ManageProductsPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	err := controller.POSDeleteProduct(mux.Vars(r)["id"])
	JSON(w, true, err)
}

// ---------- Image upload ----------

// UploadImageHandler godoc
// @Summary upload a product image to Cloudinary
// @Tags pos-uploads
// @Accept json
// @Produce json
// @Security Bearer
// @Param body body model.UploadImageRequest true "base64 data URI"
// @Success 200 {object} model.UploadImageResponse
// @Router /uploads/image [post]
func UploadImageHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ManageProductsPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	var req model.UploadImageRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSUploadImage(req.Image)
	JSON(w, res, err)
}

// DeleteImageHandler godoc
// @Summary delete a product image from Cloudinary
// @Tags pos-uploads
// @Accept json
// @Produce json
// @Security Bearer
// @Param body body model.DeleteImageRequest true "public_id"
// @Success 200 {boolean} boolean
// @Router /uploads/image [delete]
func DeleteImageHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ManageProductsPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	var req model.DeleteImageRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	err := controller.POSDeleteImage(req.PublicId)
	JSON(w, true, err)
}

// ---------- Sales ----------

func CreateSaleHandler(w http.ResponseWriter, r *http.Request) {
	session, err := isAuthorized(r, CreateSalePermission)
	if err != nil {
		JSON(w, nil, err)
		return
	}
	var req model.SaleRequest
	if err := readRequestBody(r, &req); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSCreateSale(session.UserId, req)
	JSON(w, res, err)
}

func GetSalesHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ViewSalesPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSGetSales(r.URL.Query().Get("date"))
	JSON(w, res, err)
}

func GetSaleHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ViewSalesPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSGetSale(mux.Vars(r)["id"])
	JSON(w, res, err)
}

// ---------- Dashboard ----------

func GetDashboardHandler(w http.ResponseWriter, r *http.Request) {
	if _, err := isAuthorized(r, ViewDashboardPermission); err != nil {
		JSON(w, nil, err)
		return
	}
	res, err := controller.POSDashboard()
	JSON(w, res, err)
}
