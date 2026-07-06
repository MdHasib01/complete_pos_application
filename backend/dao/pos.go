package dao

import (
	"database/sql"
	"errors"

	itn "github.com/mdhasib01/go-rest-starter/itn"
	model "github.com/mdhasib01/go-rest-starter/model"
	"github.com/mdhasib01/go-rest-starter/pkg/logger"
)

// ---------- Auth ----------

// GetUserForLogin looks a user up by email OR username.
func GetUserForLogin(identifier string) (model.User, error) {
	var user model.User
	const query = `SELECT id, firstname, lastname, username, password, email,
						  id_role, COALESCE(isactive, false), COALESCE(isverified, false)
				   FROM users
				   WHERE email = $1 OR username = $1
				   LIMIT 1`

	err := DB.QueryRow(query, identifier).Scan(
		&user.Id, &user.Firstname, &user.Lastname, &user.Username, &user.Password,
		&user.Email, &user.IdRole, &user.IsActive, &user.IsVerified,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return model.User{}, model.NewError(itn.ErrorLoginFailed, 403)
	}
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return model.User{}, model.NewError(itn.ErrorLoginFailed, 500)
	}
	return user, nil
}

// GetAllPermissions returns every permission (used for SUPERADMIN who bypasses checks).
func GetAllPermissions() ([]model.Permission, error) {
	rows, err := DB.Query(`SELECT id, name, description FROM permission ORDER BY id`)
	if err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return nil, model.UnknownError
	}
	defer rows.Close()

	permissions := []model.Permission{}
	for rows.Next() {
		var p model.Permission
		if err := rows.Scan(&p.Id, &p.Name, &p.Description); err != nil {
			logger.GetLogger().LogErrors(err, nil)
			return nil, model.UnknownError
		}
		permissions = append(permissions, p)
	}
	return permissions, nil
}

func GetUserByID(id int) (model.User, error) {
	var user model.User
	const query = `SELECT id, firstname, lastname, username, email, id_role
				   FROM users WHERE id = $1`
	err := DB.QueryRow(query, id).Scan(&user.Id, &user.Firstname, &user.Lastname,
		&user.Username, &user.Email, &user.IdRole)
	if errors.Is(err, sql.ErrNoRows) {
		return model.User{}, model.NewError(itn.ErrorUserNotFound, 404)
	}
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return model.User{}, model.UnknownError
	}
	return user, nil
}

// ---------- Categories ----------

func GetCategories() ([]model.Category, error) {
	const query = `SELECT id, name, name_bn, created_at FROM categories ORDER BY created_at ASC`
	rows, err := DB.Query(query)
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return nil, model.UnknownError
	}
	defer rows.Close()

	categories := []model.Category{}
	for rows.Next() {
		var c model.Category
		if err := rows.Scan(&c.Id, &c.Name, &c.NameBn, &c.CreatedAt); err != nil {
			logger.GetLogger().LogErrors(err, nil)
			return nil, model.UnknownError
		}
		categories = append(categories, c)
	}
	return categories, nil
}

func CreateCategory(req model.CategoryRequest) (model.Category, error) {
	const query = `INSERT INTO categories (name, name_bn) VALUES ($1, $2)
				   RETURNING id, name, name_bn, created_at`
	var c model.Category
	err := DB.QueryRow(query, req.Name, req.NameBn).Scan(&c.Id, &c.Name, &c.NameBn, &c.CreatedAt)
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return model.Category{}, model.UnknownError
	}
	return c, nil
}

func UpdateCategory(id string, req model.CategoryRequest) (model.Category, error) {
	const query = `UPDATE categories SET name = $1, name_bn = $2 WHERE id = $3
				   RETURNING id, name, name_bn, created_at`
	var c model.Category
	err := DB.QueryRow(query, req.Name, req.NameBn, id).Scan(&c.Id, &c.Name, &c.NameBn, &c.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return model.Category{}, model.NewError(itn.ErrorInfoNotFound, 404)
	}
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return model.Category{}, model.UnknownError
	}
	return c, nil
}

func DeleteCategory(id string) error {
	res, err := DB.Exec(`DELETE FROM categories WHERE id = $1`, id)
	if err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return model.UnknownError
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return model.NewError(itn.ErrorInfoNotFound, 404)
	}
	return nil
}

// ---------- Products ----------

const productSelect = `SELECT p.id, p.name, p.name_bn, p.barcode, p.category_id, p.price,
							  p.stock, p.image_url, p.image_public_id, p.created_at,
							  c.id, c.name, c.name_bn, c.created_at
					   FROM products p
					   LEFT JOIN categories c ON c.id = p.category_id`

func scanProduct(scan func(dest ...interface{}) error) (model.Product, error) {
	var p model.Product
	var catID, catName, catNameBn, catCreated sql.NullString
	err := scan(
		&p.Id, &p.Name, &p.NameBn, &p.Barcode, &p.CategoryId, &p.Price,
		&p.Stock, &p.ImageUrl, &p.ImagePublicId, &p.CreatedAt,
		&catID, &catName, &catNameBn, &catCreated,
	)
	if err != nil {
		return model.Product{}, err
	}
	if catID.Valid {
		p.Category = &model.Category{
			Id:        catID.String,
			Name:      catName.String,
			NameBn:    catNameBn.String,
			CreatedAt: catCreated.String,
		}
	}
	return p, nil
}

func GetProducts(inStockOnly bool) ([]model.Product, error) {
	query := productSelect
	if inStockOnly {
		query += ` WHERE p.stock > 0`
	}
	query += ` ORDER BY p.created_at DESC`

	rows, err := DB.Query(query)
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return nil, model.UnknownError
	}
	defer rows.Close()

	products := []model.Product{}
	for rows.Next() {
		p, err := scanProduct(rows.Scan)
		if err != nil {
			logger.GetLogger().LogErrors(err, nil)
			return nil, model.UnknownError
		}
		products = append(products, p)
	}
	return products, nil
}

func GetProductByID(id string) (model.Product, error) {
	query := productSelect + ` WHERE p.id = $1`
	p, err := scanProduct(DB.QueryRow(query, id).Scan)
	if errors.Is(err, sql.ErrNoRows) {
		return model.Product{}, model.NewError(itn.ErrorInfoNotFound, 404)
	}
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return model.Product{}, model.UnknownError
	}
	return p, nil
}

func CreateProduct(req model.ProductRequest) (model.Product, error) {
	const query = `INSERT INTO products (name, name_bn, barcode, category_id, price, stock, image_url, image_public_id)
				   VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
	var id string
	err := DB.QueryRow(query, req.Name, req.NameBn, req.Barcode, req.CategoryId,
		req.Price, req.Stock, req.ImageUrl, req.ImagePublicId).Scan(&id)
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return model.Product{}, model.UnknownError
	}
	return GetProductByID(id)
}

func UpdateProduct(id string, req model.ProductRequest) (model.Product, error) {
	const query = `UPDATE products
				   SET name = $1, name_bn = $2, barcode = $3, category_id = $4,
					   price = $5, stock = $6, image_url = $7, image_public_id = $8
				   WHERE id = $9`
	res, err := DB.Exec(query, req.Name, req.NameBn, req.Barcode, req.CategoryId,
		req.Price, req.Stock, req.ImageUrl, req.ImagePublicId, id)
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return model.Product{}, model.UnknownError
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return model.Product{}, model.NewError(itn.ErrorInfoNotFound, 404)
	}
	return GetProductByID(id)
}

func DeleteProduct(id string) error {
	res, err := DB.Exec(`DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return model.UnknownError
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return model.NewError(itn.ErrorInfoNotFound, 404)
	}
	return nil
}

// ---------- Sales ----------

// CreateSale inserts the sale, its items and decrements stock in one transaction.
func CreateSale(userID int, req model.SaleRequest) (model.Sale, error) {
	tx, err := DB.Begin()
	if err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return model.Sale{}, model.UnknownError
	}
	defer tx.Rollback()

	var total float64
	for _, it := range req.Items {
		total += it.Price * float64(it.Quantity)
	}

	var sale model.Sale
	sale.UserId = userID
	sale.PaymentMethod = req.PaymentMethod
	sale.Total = total

	const saleQuery = `INSERT INTO sales (total, payment_method, user_id)
					   VALUES ($1, $2, $3)
					   RETURNING id, invoice_number, created_at`
	err = tx.QueryRow(saleQuery, total, req.PaymentMethod, userID).
		Scan(&sale.Id, &sale.InvoiceNumber, &sale.CreatedAt)
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": saleQuery})
		return model.Sale{}, model.UnknownError
	}

	const itemQuery = `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
					   VALUES ($1, $2, $3, $4, $5)`
	const stockQuery = `UPDATE products SET stock = stock - $1 WHERE id = $2`

	for _, it := range req.Items {
		subtotal := it.Price * float64(it.Quantity)
		if _, err = tx.Exec(itemQuery, sale.Id, it.ProductId, it.Quantity, it.Price, subtotal); err != nil {
			logger.GetLogger().LogErrors(err, map[string]interface{}{"query": itemQuery})
			return model.Sale{}, model.UnknownError
		}
		if _, err = tx.Exec(stockQuery, it.Quantity, it.ProductId); err != nil {
			logger.GetLogger().LogErrors(err, map[string]interface{}{"query": stockQuery})
			return model.Sale{}, model.UnknownError
		}
	}

	if err = tx.Commit(); err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return model.Sale{}, model.UnknownError
	}
	return sale, nil
}

// GetSales returns sales created within [from, to).
func GetSales(from, to string) ([]model.Sale, error) {
	const query = `SELECT id, invoice_number, total, payment_method,
						  COALESCE(user_id, 0), created_at
				   FROM sales
				   WHERE created_at >= $1 AND created_at < $2
				   ORDER BY created_at DESC`
	rows, err := DB.Query(query, from, to)
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": query})
		return nil, model.UnknownError
	}
	defer rows.Close()

	sales := []model.Sale{}
	for rows.Next() {
		var s model.Sale
		if err := rows.Scan(&s.Id, &s.InvoiceNumber, &s.Total, &s.PaymentMethod,
			&s.UserId, &s.CreatedAt); err != nil {
			logger.GetLogger().LogErrors(err, nil)
			return nil, model.UnknownError
		}
		sales = append(sales, s)
	}
	return sales, nil
}

func GetSaleByID(id string) (model.Sale, error) {
	const saleQuery = `SELECT id, invoice_number, total, payment_method,
							  COALESCE(user_id, 0), created_at
					   FROM sales WHERE id = $1`
	var s model.Sale
	err := DB.QueryRow(saleQuery, id).Scan(&s.Id, &s.InvoiceNumber, &s.Total,
		&s.PaymentMethod, &s.UserId, &s.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return model.Sale{}, model.NewError(itn.ErrorInfoNotFound, 404)
	}
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": saleQuery})
		return model.Sale{}, model.UnknownError
	}

	const itemQuery = `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.price, si.subtotal,
							  p.name, p.name_bn
					   FROM sale_items si
					   LEFT JOIN products p ON p.id = si.product_id
					   WHERE si.sale_id = $1`
	rows, err := DB.Query(itemQuery, id)
	if err != nil {
		logger.GetLogger().LogErrors(err, map[string]interface{}{"query": itemQuery})
		return model.Sale{}, model.UnknownError
	}
	defer rows.Close()

	s.Items = []model.SaleItem{}
	for rows.Next() {
		var it model.SaleItem
		var pName, pNameBn sql.NullString
		if err := rows.Scan(&it.Id, &it.SaleId, &it.ProductId, &it.Quantity,
			&it.Price, &it.Subtotal, &pName, &pNameBn); err != nil {
			logger.GetLogger().LogErrors(err, nil)
			return model.Sale{}, model.UnknownError
		}
		if pName.Valid {
			it.Product = &model.Product{Name: pName.String, NameBn: pNameBn.String}
		}
		s.Items = append(s.Items, it)
	}
	return s, nil
}

// ---------- Dashboard ----------

func GetDashboardStats(dayStart, dayEnd string) (model.DashboardStats, error) {
	var stats model.DashboardStats

	if err := DB.QueryRow(
		`SELECT COALESCE(SUM(total), 0) FROM sales WHERE created_at >= $1 AND created_at < $2`,
		dayStart, dayEnd,
	).Scan(&stats.TodaySales); err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return stats, model.UnknownError
	}

	if err := DB.QueryRow(`SELECT COUNT(*) FROM products`).Scan(&stats.TotalProducts); err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return stats, model.UnknownError
	}

	if err := DB.QueryRow(`SELECT COUNT(*) FROM products WHERE stock < 10`).Scan(&stats.LowStock); err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return stats, model.UnknownError
	}

	if err := DB.QueryRow(`SELECT COUNT(*) FROM categories`).Scan(&stats.TotalCategories); err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return stats, model.UnknownError
	}

	rows, err := DB.Query(
		`SELECT id, invoice_number, total, payment_method, COALESCE(user_id, 0), created_at
		 FROM sales WHERE created_at >= $1 AND created_at < $2
		 ORDER BY created_at DESC LIMIT 5`,
		dayStart, dayEnd,
	)
	if err != nil {
		logger.GetLogger().LogErrors(err, nil)
		return stats, model.UnknownError
	}
	defer rows.Close()

	stats.RecentSales = []model.Sale{}
	for rows.Next() {
		var s model.Sale
		if err := rows.Scan(&s.Id, &s.InvoiceNumber, &s.Total, &s.PaymentMethod,
			&s.UserId, &s.CreatedAt); err != nil {
			logger.GetLogger().LogErrors(err, nil)
			return stats, model.UnknownError
		}
		stats.RecentSales = append(stats.RecentSales, s)
	}
	return stats, nil
}
