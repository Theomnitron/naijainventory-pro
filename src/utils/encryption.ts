import CryptoJS from 'crypto-js';

const FALLBACK_KEY = 'NaijaInventorySecret123';

export const encryptData = (text: string | number, key: string = FALLBACK_KEY): string => {
  return CryptoJS.AES.encrypt(text.toString(), key).toString();
};

export const decryptData = (cipher: string, key: string = FALLBACK_KEY): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (error) {
    console.error('Decryption failed:', error);
    return 'Decryption Error';
  }
};
