import userRepository from '../features/users/userRepository.js';
import { hashPassword } from '../utils/crypto.js';
import { query, closePool } from '../db/connection.js';

const testUsers = [
  {
    name: 'Test Admin',
    email: 'admin@gmail.com',
    password: 'admin1234',
    role: 'admin',
    locationSearch: null
  },
  {
    name: 'Test Branch Staff',
    email: 'branchstaff@gmail.com',
    password: 'branchstaff1234',
    role: 'branch_staff',
    locationSearch: { type: 'branch', keyword: 'Bulan' }
  },
  {
    name: 'Test Warehouse Staff',
    email: 'warehousestaff@gmail.com',
    password: 'warehousestaff1234',
    role: 'warehouse_staff',
    locationSearch: { type: 'warehouse', keyword: 'Naga' }
  },
  {
    name: 'Test Customer One',
    email: 'customer1@gmail.com',
    password: 'customer1234',
    role: 'customer',
    locationSearch: null
  },
  {
    name: 'Test Customer Two',
    email: 'customer2@gmail.com',
    password: 'customer1234',
    role: 'customer',
    locationSearch: null
  }
];

export const seedTestUsers = async () => {
  console.log('[SEED] Starting test users seed process...');

  try {
    for (const userData of testUsers) {
      const email = userData.email.trim().toLowerCase();
      
      const existingUser = await userRepository.findUserByEmail(email);
      if (existingUser) {
        console.log(`[SEED] Skipped ${email} - already exists`);
        continue;
      }

      let locationId = null;
      if (userData.locationSearch) {
        const { type, keyword } = userData.locationSearch;
        const [rows] = await query(
          `SELECT id, name, type FROM locations WHERE type = ? AND name LIKE ? LIMIT 1`,
          [type, `%${keyword}%`]
        );
        
        if (rows.length === 0) {
          throw new Error(`Required location not found for type: ${type} and keyword: ${keyword}`);
        }
        locationId = rows[0].id;
        console.log(`[SEED] Found location '${rows[0].name}' (ID: ${locationId}) for user ${email}`);
      }

      const passwordHash = await hashPassword(userData.password);

      const userId = await userRepository.createUser({
        name: userData.name,
        email,
        passwordHash,
        role: userData.role,
        isActive: true,
        isEmailVerified: true,
        locationId
      });

      console.log(`[SEED] Created ${email} (ID: ${userId}, Role: ${userData.role})`);
    }
    console.log('[SEED] Test users seed completed successfully.');
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed test users:', error);
    throw error;
  }
};

if (process.argv[1] && process.argv[1].endsWith('seedTestUsers.js')) {
  seedTestUsers()
    .then(() => {
      closePool();
      process.exit(0);
    })
    .catch(() => {
      closePool();
      process.exit(1);
    });
}
