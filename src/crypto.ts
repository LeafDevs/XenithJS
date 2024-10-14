import { PrivateKey, decrypt, encrypt } from "eciesjs";

// This code uses ECIES to encrypt and decrypt messages.
// https://www.npmjs.com/package/eciesjs


const privateKey = new PrivateKey();

function encryptMessage(message: string, publicKey: string): string {
  const data = Buffer.from(message);
  const encrypted = encrypt(publicKey, data);
  return encrypted.toString('hex');
}

function decryptMessage(encryptedMessage: string, privateKey: PrivateKey): string {
  const encrypted = Buffer.from(encryptedMessage, 'hex');
  const decrypted = decrypt(privateKey.secret, encrypted);
  return Buffer.from(decrypted).toString();
}

export { encryptMessage, decryptMessage, privateKey };