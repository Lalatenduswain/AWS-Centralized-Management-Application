/**
 * Setup Utility
 *
 * Helper script for initial setup tasks:
 * - Generate encryption key
 * - Create first admin user
 */

import bcrypt from 'bcrypt';
import { generateEncryptionKey } from '../services/encryption.service';
import { createUser } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate a new encryption key
 * Run this once during initial setup and save the key to your .env file
 */
export const generateNewEncryptionKey = () => {
  const key = generateEncryptionKey();
  console.log('========================================');
  console.log('Generated Encryption Key:');
  console.log(key);
  console.log('========================================');
  console.log('IMPORTANT: Save this key to your .env file as ENCRYPTION_KEY');
  console.log('Keep this key secure and never commit it to version control!');
  console.log('========================================');
  return key;
};

/**
 * Create the first admin user
 * Use this to create an initial user to login with
 */
export const createAdminUser = async (email: string, password: string) => {
  try {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await createUser({ email, password_hash });

    console.log('========================================');
    console.log('Admin user created successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log('========================================');
    console.log('You can now login with these credentials');
    console.log('========================================');

    return user;
  } catch (error: any) {
    console.error('Failed to create admin user:', error.message);
    throw error;
  }
};

// If this script is run directly
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'generate-key':
      generateNewEncryptionKey();
      process.exit(0);
      break;

    case 'create-admin':
      const email = process.argv[3];
      const password = process.argv[4];

      if (!email || !password) {
        console.error('Usage: npm run setup create-admin <email> <password>');
        process.exit(1);
      }

      createAdminUser(email, password)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    default:
      console.log('Available commands:');
      console.log('  npm run setup generate-key');
      console.log('  npm run setup create-admin <email> <password>');
      process.exit(0);
  }
}
