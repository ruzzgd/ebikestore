import crypto from 'crypto';
import config from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

let encryptionKey = null;

const getDerivedKey = (salt) => {
  if (!config.encryption.key) {
    throw new Error('PII_ENCRYPTION_KEY is not defined in environment variables');
  }
  // Use scrypt to derive a 32-byte key from the environment key
  return crypto.scryptSync(config.encryption.key, salt, KEY_LENGTH);
};

export const encrypt = (text) => {
  if (!text) return text;
  
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getDerivedKey(salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Format: salt:iv:tag:encrypted
    return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('Failed to encrypt data');
  }
};

export const decrypt = (encryptedData) => {
  if (!encryptedData) return encryptedData;
  
  // If it's not encrypted (no colons), return as is (for backwards compatibility)
  if (!encryptedData.includes(':')) {
    return encryptedData;
  }
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) return encryptedData;
    
    const [saltHex, ivHex, tagHex, encryptedText] = parts;
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getDerivedKey(salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return encryptedData; // Return original on failure (might be plaintext that happened to have a colon, though unlikely to have 3 colons)
  }
};
