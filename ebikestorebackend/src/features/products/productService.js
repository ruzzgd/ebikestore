import productRepository from './productRepository.js';
import categoryRepository from '../categories/categoryRepository.js';
import locationRepository from '../locations/locationRepository.js';
import inventoryRepository from '../inventory/inventoryRepository.js';
import stockMovementRepository from '../inventory/stockMovementRepository.js';
import userRepository from '../users/userRepository.js';
import { getPool } from '../../db/connection.js';
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

export const createProduct = async (
  { categoryId, sku, name, description, availableColors = '', unitPrice, imageKey, initialQuantity = 0, locationId = null },
  authUser = null
) => {
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

  const cleanColors = availableColors ? String(availableColors).trim() : null;
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO products (category_id, sku, name, description, available_colors, unit_price, image_key, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
      [category.id, cleanSku, cleanName, description?.trim() || '', cleanColors, parsedPrice, imageKey || null]
    );
    const productId = result.insertId;

    // Fetch all active locations to initialize inventory records so product immediately appears in inventory
    const [locations] = await connection.execute(
      `SELECT id, code, name, type FROM locations WHERE is_active = true`
    );

    // Determine target location for initial stock if initialQuantity > 0
    let targetLocationId = null;
    const initQty = parseInt(initialQuantity, 10) || 0;

    if (initQty > 0) {
      if (authUser?.location_id) {
        targetLocationId = authUser.location_id;
      } else if (locationId) {
        targetLocationId = parseInt(locationId, 10);
      } else if (locations.length > 0) {
        targetLocationId = locations[0].id;
      }
    }

    for (const loc of locations) {
      const isTarget = targetLocationId && loc.id === targetLocationId;
      const startingStock = isTarget ? initQty : 0;
      await connection.execute(
        `INSERT INTO inventory (product_id, location_id, quantity, low_stock_threshold)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE quantity = quantity`,
        [productId, loc.id, startingStock]
      );

      if (isTarget && startingStock > 0 && authUser?.userId) {
        await stockMovementRepository.createMovement(connection, {
          productId,
          locationId: loc.id,
          type: 'stock_in',
          quantity: startingStock,
          quantityBefore: 0,
          quantityAfter: startingStock,
          referenceType: 'initial_stock',
          referenceId: String(productId),
          note: 'Initial stock on product creation',
          performedByUserId: authUser.userId,
        });
      }
    }

    await connection.commit();
    return await productRepository.findProductById(productId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateProduct = async (id, { categoryId, sku, name, description, availableColors, unitPrice, imageKey, isActive }) => {
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
    availableColors: availableColors !== undefined ? (availableColors ? String(availableColors).trim() : null) : product.available_colors,
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
