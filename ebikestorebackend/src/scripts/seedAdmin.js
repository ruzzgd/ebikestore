import config from '../config/index.js';
import userRepository from '../features/users/userRepository.js';
import { hashPassword } from '../utils/crypto.js';
import { closePool } from '../db/connection.js';

export const seedAdmin = async () => {
  const name = config.adminSeed.name;
  const email = config.adminSeed.email.trim().toLowerCase();
  const password = config.adminSeed.password;

  if (!email || !password) {
    console.error('[SEED ADMIN ERROR] ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    return;
  }

  console.log(`[SEED ADMIN] Checking existing administrator account for email: ${email}...`);

  const existingUser = await userRepository.findUserByEmail(email);
  if (existingUser) {
    console.log(`[SEED ADMIN] Admin user '${email}' already exists. Skipping seed.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  const userId = await userRepository.createUser({
    name,
    email,
    passwordHash,
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
  });

  console.log(`[SEED ADMIN SUCCESS] Administrator user created successfully (ID: ${userId}, Email: ${email}).`);
};

// Execute if run directly from command line
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  seedAdmin()
    .then(() => {
      closePool();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SEED ADMIN ERROR] Execution failed:', err);
      closePool();
      process.exit(1);
    });
}
