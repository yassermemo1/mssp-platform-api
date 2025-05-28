import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * EncryptionService
 * Handles secure encryption and decryption of sensitive data using AES-256-GCM
 * Used primarily for storing external API credentials
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    // Get encryption key from environment variable
    const keyString = this.configService.get<string>('ENCRYPTION_KEY');
    
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Ensure key is 32 bytes for AES-256
    // In production, this should be a properly generated 256-bit key
    this.encryptionKey = crypto.createHash('sha256').update(keyString).digest();
  }

  /**
   * Encrypts sensitive data
   * @param plainText The data to encrypt
   * @returns Encrypted data with IV and auth tag in format: iv:authTag:encrypted
   */
  encrypt(plainText: string): string {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final()
      ]);
      
      // Get the auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine iv, authTag, and encrypted data
      // Format: base64(iv):base64(authTag):base64(encrypted)
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts encrypted data
   * @param encryptedData The encrypted data in format: iv:authTag:encrypted
   * @returns Decrypted plain text
   */
  decrypt(encryptedData: string): string {
    try {
      // Split the encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, authTagBase64, encryptedBase64] = parts;
      
      // Convert from base64
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      const encrypted = Buffer.from(encryptedBase64, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypts an object as JSON
   * @param data The object to encrypt
   * @returns Encrypted JSON string
   */
  encryptObject(data: Record<string, any>): string {
    return this.encrypt(JSON.stringify(data));
  }

  /**
   * Decrypts and parses encrypted JSON
   * @param encryptedData The encrypted JSON data
   * @returns Parsed object
   */
  decryptObject<T = Record<string, any>>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted) as T;
  }
} 