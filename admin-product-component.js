// Simple Admin Product Management component for embedded app
function AdminProductManagement({ token }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    categoryId: '',
    description: '',
    color: '',
    image: '',
    pricing: {
      wholesaler: { pricePerBox: '', boxSize: 25 },
      florist: { pricePerStem: '', minQuantity: 1 }
    },
    availability: { inStock: true, stockQuantity: 100 },
    isNew: false,
    isActive: true
  })

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      categoryId: '',
      description: '',
      color: '',
      image: '',
      pricing: {
        wholesaler: { pricePerBox: '', boxSize: 25 },
        florist: { pricePerStem: '', minQuantity: 1 }
      },
      availability: { inStock: true, stockQuantity: 100 },
      isNew: false,
      isActive: true
    })
    setEditingProduct(null)
    setError('')
    setSuccess('')
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [page])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await Api.get('/admin/products', { page, limit: 10 }, token)
      if (response.success) {
        setProducts(response.products)
        setTotalPages(response.pagination.totalPages)
      }
    } catch (err) {
      setError('Failed to load products: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await Api.get('/admin/categories', {}, token)
      if (response.success) {
        setCategories(response.categories)
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      categoryId: product.categoryId,
      description: product.description,
      color: product.color,
      image: product.image,
      pricing: product.pricing,
      availability: product.availability,
      isNew: product.isNew || false,
      isActive: product.isActive !== false
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      
      if (!formData.name || !formData.category || !formData.description || !formData.color) {
        setError('Please fill in all required fields')
        return
      }
      
      if (!formData.pricing.wholesaler.pricePerBox || !formData.pricing.florist.pricePerStem) {
        setError('Please fill in both wholesaler and florist pricing')
        return
      }

      let response
      if (editingProduct) {
        response = await Api.put(`/admin/products/${editingProduct.id}`, formData, token)
      } else {
        response = await Api.post('/admin/products', formData, token)
      }
      
      if (response.success) {
        setSuccess(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
        setTimeout(() => {
          setShowForm(false)
          resetForm()
          loadProducts()
        }, 1500)
      }
    } catch (err) {
      setError(err.message || 'Failed to save product')
    }
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const response = await Api.delete(`/admin/products/${productId}`, {}, token)
      if (response.success) {
        setSuccess('Product deleted successfully!')
        loadProducts()
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product')
    }
  }

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    if (category) {
      setFormData(prev => ({
        ...prev,
        categoryId: categoryId,
        category: category.name
      }))
    }
  }

  if (loading) {
    return <div className="loading">Loading products...</div>
  }

  if (showForm) {
    return (
      <div className="admin-products">
        <div className="section-header">
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <button 
            className="btn-secondary" 
            onClick={() => { setShowForm(false); resetForm(); }}
          >
            ← Back to Products
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Color *</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
            />
          </div>

          <h3>Pricing Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Wholesaler Price per Box *</label>
              <input
                type="number"
                step="0.01"
                value={formData.pricing.wholesaler.pricePerBox}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pricing: {
                    ...prev.pricing,
                    wholesaler: { ...prev.pricing.wholesaler, pricePerBox: e.target.value }
                  }
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Box Size (stems)</label>
              <input
                type="number"
                value={formData.pricing.wholesaler.boxSize}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pricing: {
                    ...prev.pricing,
                    wholesaler: { ...prev.pricing.wholesaler, boxSize: e.target.value }
                  }
                }))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Florist Price per Stem *</label>
              <input
                type="number"
                step="0.01"
                value={formData.pricing.florist.pricePerStem}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pricing: {
                    ...prev.pricing,
                    florist: { ...prev.pricing.florist, pricePerStem: e.target.value }
                  }
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Min Quantity</label>
              <input
                type="number"
                value={formData.pricing.florist.minQuantity}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pricing: {
                    ...prev.pricing,
                    florist: { ...prev.pricing.florist, minQuantity: e.target.value }
                  }
                }))}
              />
            </div>
          </div>

          <h3>Availability & Status</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                value={formData.availability.stockQuantity}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  availability: { ...prev.availability, stockQuantity: e.target.value }
                }))}
              />
            </div>
            <div className="form-group checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={formData.availability.inStock}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, inStock: e.target.checked }
                  }))}
                />
                In Stock
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={(e) => setFormData(prev => ({ ...prev, isNew: e.target.checked }))}
                />
                Mark as New
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-products">
      <div className="section-header">
        <h2>Product Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add New Product
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Wholesaler Price</th>
              <th>Florist Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>
                  <div className="product-info">
                    <strong>{product.name}</strong>
                    <small>{product.color}</small>
                  </div>
                </td>
                <td>
                  <span className="category-badge">{product.category}</span>
                </td>
                <td>
                  <div>
                    <strong>${product.pricing.wholesaler.pricePerBox}/box</strong>
                    <small>({product.pricing.wholesaler.boxSize} stems)</small>
                  </div>
                </td>
                <td>
                  <strong>${product.pricing.florist.pricePerStem}/stem</strong>
                </td>
                <td>
                  <span className={`stock-badge ${product.availability.inStock ? 'in-stock' : 'out-stock'}`}>
                    {product.availability.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <small>{product.availability.stockQuantity} units</small>
                </td>
                <td>
                  <div className="status-badges">
                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {product.isNew && <span className="status-badge new">New</span>}
                  </div>
                </td>
                <td>
                  <div className="actions">
                    <button 
                      className="btn-small btn-secondary" 
                      onClick={() => handleEdit(product)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-small btn-danger" 
                      onClick={() => handleDelete(product.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            {page > 1 && (
              <button onClick={() => setPage(page - 1)}>← Previous</button>
            )}
            <span>Page {page} of {totalPages}</span>
            {page < totalPages && (
              <button onClick={() => setPage(page + 1)}>Next →</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}