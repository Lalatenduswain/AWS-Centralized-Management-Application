/**
 * Encryption Service
 *
 * Handles encryption and decryption of AWS credentials.
 * Uses AES-256-GCM encryption algorithm for strong security.
 *
 * SECURITY NOTES:
 * - The ENCRYPTION_KEY environment variable must be kept secret
 * - Each credential has a unique IV (initialization vector) for added security
 * - Never log or expose decrypted credentials
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// AES-256-GCM requires a 32-byte key
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment variable
 * The key must be exactly 32 characters
 */
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables');
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be exactly ${KEY_LENGTH} characters long`);
  }

  return Buffer.from(key, 'utf-8');
};

/**
 * Encrypt a string (AWS credential)
 * @param text - Plain text to encrypt
 * @returns Object containing encrypted text, IV, and auth tag
 */
export const encrypt = (text: string): { encrypted: string; iv: string } => {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Get the encryption key
    const key = getEncryptionKey();

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get the authentication tag for GCM mode
    const authTag = cipher.getAuthTag();

    // Combine encrypted text and auth tag
    const combined = encrypted + authTag.toString('hex');

    return {
      encrypted: combined,
      iv: iv.toString('hex'),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt an encrypted string
 * @param encrypted - Encrypted text (includes auth tag)
 * @param iv - Initialization vector used during encryption
 * @returns Decrypted plain text
 */
export const decrypt = (encrypted: string, iv: string): string => {
  try {
    // Get the encryption key
    const key = getEncryptionKey();

    // Convert IV from hex to buffer
    const ivBuffer = Buffer.from(iv, 'hex');

    // Extract auth tag from the end of encrypted text
    const authTagLength = AUTH_TAG_LENGTH * 2; // hex encoding doubles the length
    const encryptedText = encrypted.slice(0, -authTagLength);
    const authTag = Buffer.from(encrypted.slice(-authTagLength), 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Generate a random encryption key
 * Useful for initial setup - run this once and save the key to .env
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString('base64').slice(0, KEY_LENGTH);
};

/**
 * Encrypt AWS credentials for storage
 * @param accessKeyId - AWS Access Key ID
 * @param secretAccessKey - AWS Secret Access Key
 * @returns Encrypted credentials with IVs
 */
export const encryptAWSCredentials = (accessKeyId: string, secretAccessKey: string) => {
  const encryptedAccessKey = encrypt(accessKeyId);
  const encryptedSecretKey = encrypt(secretAccessKey);

  return {
    access_key_id_encrypted: encryptedAccessKey.encrypted,
    secret_access_key_encrypted: encryptedSecretKey.encrypted,
    // For simplicity, we'll use a single IV for both (in production, you might separate them)
    encryption_iv: encryptedAccessKey.iv,
    secret_key_iv: encryptedSecretKey.iv,
  };
};

/**
 * Decrypt AWS credentials from storage
 * @param encryptedAccessKey - Encrypted AWS Access Key ID
 * @param encryptedSecretKey - Encrypted AWS Secret Access Key
 * @param iv - Initialization vector for access key
 * @param secretIv - Initialization vector for secret key
 * @returns Decrypted credentials
 */
export const decryptAWSCredentials = (
  encryptedAccessKey: string,
  encryptedSecretKey: string,
  iv: string,
  secretIv?: string
) => {
  return {
    accessKeyId: decrypt(encryptedAccessKey, iv),
    secretAccessKey: decrypt(encryptedSecretKey, secretIv || iv),
  };
};
