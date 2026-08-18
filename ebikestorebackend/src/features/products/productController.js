import asyncHandler from '../../middleware/asyncHandler.js';
import productService from './productService.js';

export const normalizeProductListQuery = (query = {}) => ({
  activeOnly: query.activeOnly === 'true',
  categoryId: query.category ? parseInt(query.category, 10) : null,
  search: query.search || '',
  limit: parseInt(query.limit || '50', 10),
  offset: parseInt(query.offset || '0', 10),
});

export const getProducts = asyncHandler(async (req, res) => {
  const options = normalizeProductListQuery(req.query);
  options.activeOnly = options.activeOnly || req.user?.role !== 'admin';

  const products = await productService.getProducts(options);
  res.status(200).json({
    status: 'success',
    data: { products },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(parseInt(req.params.id, 10));
  
  // Public requests must not retrieve inactive products
  if (req.user?.role !== 'admin' && !product.is_active) {
    res.status(404).json({ status: 'fail', message: 'Product not found' });
    return;
  }

  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { categoryId, sku, name, description, unitPrice, imageKey } = req.body;
  const product = await productService.createProduct({ categoryId, sku, name, description, unitPrice, imageKey });
  res.status(201).json({
    status: 'success',
    data: { product },
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { categoryId, sku, name, description, unitPrice, imageKey, isActive } = req.body;
  const product = await productService.updateProduct(parseInt(req.params.id, 10), {
    categoryId,
    sku,
    name,
    description,
    unitPrice,
    imageKey,
    isActive,
  });
  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

export const updateProductActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const product = await productService.setProductActiveStatus(parseInt(req.params.id, 10), Boolean(isActive));
  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductActive,
};
