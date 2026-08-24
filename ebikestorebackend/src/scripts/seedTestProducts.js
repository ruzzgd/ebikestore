import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from '../db/connection.js';
import { deleteImage, uploadImage } from '../providers/minioProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedAssetsDir = path.join(__dirname, 'seed-assets', 'products');
const refreshImageSkus = new Set(
  (process.env.SEED_REFRESH_PRODUCT_IMAGES || '')
    .split(',')
    .map((sku) => sku.trim().toUpperCase())
    .filter(Boolean)
);

const testProducts = [
  {
    category: 'E-Bikes',
    name: 'Fidelo Passenger E1',
    sku: 'EBIKE-CITY-E1',
    price: 34999.00,
    description: 'A covered four-seat electric passenger cart designed for neighborhood trips and practical daily transport.',
    imageFile: 'city-e1.jpg',
  },
  {
    category: 'E-Bikes',
    name: 'Fidelo Passenger E2',
    sku: 'EBIKE-URBAN-E2',
    price: 42999.00,
    description: 'A comfortable four-seat electric passenger cart with an open cabin, windshield, and full roof.',
    imageFile: 'urban-e2.jpg',
  },
  {
    category: 'E-Bikes',
    name: 'Fidelo Shuttle E3',
    sku: 'EBIKE-TRAIL-E3',
    price: 54999.00,
    description: 'A long-wheelbase six-seat electric shuttle suited to resorts, compounds, and group transport.',
    imageFile: 'trail-e3.jpg',
  },
  {
    category: 'E-Bikes',
    name: 'Fidelo Utility E4',
    sku: 'EBIKE-COMPACT-E4',
    price: 29999.00,
    description: 'A compact two-seat electric utility cart with a rear deck for light cargo and service work.',
    imageFile: 'compact-e4.jpg',
  },
  {
    category: 'E-Bikes',
    name: 'Fidelo All-Weather E5',
    sku: 'EBIKE-COMMUTER-E5',
    price: 38999.00,
    description: 'A covered four-seat electric passenger cart with clear weather curtains for added protection.',
    imageFile: 'commuter-e5.jpg',
  },
  {
    category: 'E-Bikes',
    name: 'Fidelo Cargo E6',
    sku: 'EBIKE-CARGO-E6',
    price: 59999.00,
    description: 'A covered electric cargo cart with a front cabin and enclosed rear box for local deliveries.',
    imageFile: 'cargo-e6.jpg',
  },
  {
    category: 'Accessories',
    name: 'Fidelo All-Weather Cart Cover',
    sku: 'ACC-HELMET-C1',
    price: 1899.00,
    description: 'A fitted weather cover with clear panels for supported Fidelo electric passenger carts.',
    imageFile: 'cart-cover.jpg',
  },
  {
    category: 'Accessories',
    name: 'Fidelo Portable Cart Charger',
    sku: 'ACC-LOCK-U1',
    price: 1299.00,
    description: 'A portable charger and cable assembly for supported Fidelo electric cart battery systems.',
    imageFile: 'charging-cable.jpg',
  },
  {
    category: 'Spare Parts',
    name: 'Fidelo 48V Replacement Battery',
    sku: 'PART-BATT-48V',
    price: 15999.00,
    description: 'A compatible 48-volt replacement battery pack for supported Fidelo electric cart models.',
    imageFile: 'battery-48v.jpg',
  },
  {
    category: 'Spare Parts',
    name: 'Fidelo Electric Cart Brake Service Kit',
    sku: 'PART-BRAKE-H1',
    price: 749.00,
    description: 'A replacement brake service kit for supported Fidelo electric cart brake assemblies.',
    imageFile: 'brake-pad-set.jpg',
  },
];

export const seedTestProducts = async () => {
  console.log('[SEED] Starting test products seed process...');

  try {
    // 1. Resolve every category used by the product fixtures.
    const requiredCategories = [...new Set(testProducts.map((product) => product.category))];
    const [catRows] = await query(
      `SELECT id, name FROM categories WHERE name IN (?, ?, ?)`,
      requiredCategories
    );

    const categoryIds = new Map(catRows.map((category) => [category.name, category.id]));
    const missingCategories = requiredCategories.filter((name) => !categoryIds.has(name));
    if (missingCategories.length > 0) {
      throw new Error(`Required categories not found: ${missingCategories.join(', ')}`);
    }
    console.log(`[SEED] Resolved product categories: ${requiredCategories.join(', ')}`);

    // 2. Process each product
    for (const prod of testProducts) {
      // Check for existing product by SKU
      const [existingRows] = await query(
        `SELECT id, image_key FROM products WHERE sku = ? LIMIT 1`,
        [prod.sku]
      );

      const shouldRefreshImage = existingRows.length > 0 && refreshImageSkus.has(prod.sku);
      if (existingRows.length > 0 && !shouldRefreshImage) {
        console.log(`[SEED] Skipped ${prod.sku} - already exists`);
        continue;
      }

      // Read local image file
      const imagePath = path.join(seedAssetsDir, prod.imageFile);
      let fileBuffer;
      try {
        fileBuffer = await fs.readFile(imagePath);
      } catch (err) {
        throw new Error(`Failed to read local seed image for ${prod.sku}: ${err.message}`);
      }

      // Reject HTML/error responses accidentally saved with a .jpg extension.
      if (fileBuffer.length < 3 || fileBuffer[0] !== 0xff || fileBuffer[1] !== 0xd8 || fileBuffer[2] !== 0xff) {
        throw new Error(`Seed image for ${prod.sku} is not a valid JPEG file`);
      }

      // Upload image to MinIO
      const mimeType = 'image/jpeg';
      const imageKey = await uploadImage(fileBuffer, mimeType, prod.imageFile);
      console.log(`[SEED] Uploaded image for ${prod.sku} -> ${imageKey}`);

      if (shouldRefreshImage) {
        await query(
          `UPDATE products
           SET category_id = ?, name = ?, description = ?, unit_price = ?, image_key = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [categoryIds.get(prod.category), prod.name, prod.description, prod.price, imageKey, existingRows[0].id]
        );
        await deleteImage(existingRows[0].image_key);
        console.log(`[SEED] Replaced image for ${prod.sku}`);
        continue;
      }

      // Insert product into DB
      const [insertResult] = await query(
        `INSERT INTO products (category_id, sku, name, description, unit_price, image_key, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [categoryIds.get(prod.category), prod.sku, prod.name, prod.description, prod.price, imageKey, true]
      );

      console.log(`[SEED] Created ${prod.sku} (ID: ${insertResult.insertId})`);
    }

    console.log('[SEED] Test products seed completed successfully.');
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed test products:', error);
    throw error;
  }
};

// Execute if run directly from command line
if (process.argv[1] && process.argv[1].endsWith('seedTestProducts.js')) {
  seedTestProducts()
    .then(() => {
      closePool();
      process.exit(0);
    })
    .catch(() => {
      closePool();
      process.exit(1);
    });
}
