import productRepository from './productRepository.js';
import categoryRepository from '../categories/categoryRepository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors.js';

export const getProducts = async (options = {}) => {
  return await productRepository.listProducts(options);
};

export const getProductById = async (id) => {
  const product = await productRepository.findProductById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  const availabilityByLocation = await productRepository.listPublicAvailabilityByProduct(id);
  return { ...product, availability_by_location: availabilityByLocation };
};

export const validateProductInput = ({ sku, name, unitPrice }) => {
  if (!sku || !name || unitPrice === undefined) {
    throw new BadRequestError('Category, SKU, Name, and Unit Price are required');
  }

  const cleanSku = sku.trim().toUpperCase();
  if (cleanSku.length > 30) {
    throw new BadRequestError('SKU cannot exceed 30 characters');
  }
  const cleanName = name.trim();
  if (!cleanName) {
    throw new BadRequestError('Product name cannot be empty');
  }
  if (cleanName.length > 100) {
    throw new BadRequestError('Product name cannot exceed 100 characters');
  }

  const parsedPrice = parseFloat(unitPrice);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    throw new BadRequestError('Unit price must be a non-negative number');
  }

  return { cleanSku, cleanName, parsedPrice };
};

export const createProduct = async ({ categoryId, sku, name, description, unitPrice, imageKey }) => {
  if (!categoryId) {
    throw new BadRequestError('Category is required');
  }
  const { cleanSku, cleanName, parsedPrice } = validateProductInput({ sku, name, unitPrice });

  // Validate category exists
  const category = await categoryRepository.findCategoryById(parseInt(categoryId, 10));
  if (!category) {
    throw new NotFoundError('Selected product category does not exist');
  }

  // Check SKU uniqueness
  const existingSku = await productRepository.findProductBySku(cleanSku);
  if (existingSku) {
    throw new ConflictError(`Product SKU '${cleanSku}' already exists`);
  }

  const productId = await productRepository.createProduct({
    categoryId: category.id,
    sku: cleanSku,
    name: cleanName,
    description: description?.trim() || '',
    unitPrice: parsedPrice,
    imageKey: imageKey || null,
    isActive: true,
  });

  return await productRepository.findProductById(productId);
};

export const updateProduct = async (id, { categoryId, sku, name, description, unitPrice, imageKey, isActive }) => {
  const product = await productRepository.findProductById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const cleanSku = sku ? sku.trim().toUpperCase() : product.sku;
  if (cleanSku.length > 30) {
    throw new BadRequestError('SKU cannot exceed 30 characters');
  }
  if (cleanSku !== product.sku) {
    const existingSku = await productRepository.findProductBySku(cleanSku);
    if (existingSku && existingSku.id !== id) {
      throw new ConflictError(`SKU '${cleanSku}' is already assigned to another product`);
    }
  }

  const targetCategoryId = categoryId ? parseInt(categoryId, 10) : product.category_id;
  if (targetCategoryId !== product.category_id) {
    const category = await categoryRepository.findCategoryById(targetCategoryId);
    if (!category) {
      throw new NotFoundError('Selected product category does not exist');
    }
  }

  const parsedPrice = unitPrice !== undefined ? parseFloat(unitPrice) : parseFloat(product.unit_price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    throw new BadRequestError('Unit price must be a non-negative number');
  }

  const cleanName = name !== undefined ? name.trim() : product.name;
  if (!cleanName) {
    throw new BadRequestError('Product name cannot be empty');
  }
  if (cleanName.length > 100) {
    throw new BadRequestError('Product name cannot exceed 100 characters');
  }

  await productRepository.updateProduct(id, {
    categoryId: targetCategoryId,
    sku: cleanSku,
    name: cleanName,
    description: description !== undefined ? description.trim() : product.description,
    unitPrice: parsedPrice,
    imageKey: imageKey !== undefined ? imageKey : product.image_key,
    isActive: isActive !== undefined ? Boolean(isActive) : product.is_active,
  });

  return await productRepository.findProductById(id);
};

export const setProductActiveStatus = async (id, isActive) => {
  const product = await productRepository.findProductById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  await productRepository.updateProductActiveStatus(id, Boolean(isActive));
  return await productRepository.findProductById(id);
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  setProductActiveStatus,
};
