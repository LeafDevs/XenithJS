import * as fs from 'fs';
import * as crypto from 'crypto';
import * as zlib from 'zlib';

class ListFile {
    private filePath: string;
    private encryptionKey: Buffer;
    private algorithm = 'aes-256-cbc';

    constructor(filePath: string, key: string) {
        this.filePath = filePath;
        // Create a 32 byte key from the provided string
        this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
    }

    private encrypt(data: string): Buffer {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        return Buffer.concat([iv, encrypted]);
    }

    private decrypt(data: Buffer): string {
        const iv = data.slice(0, 16);
        const encryptedData = data.slice(16);
        const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
        return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8');
    }

    async write(data: any[]): Promise<void> {
        try {
            // Convert data to string
            const jsonString = JSON.stringify(data);
            
            // Compress the data
            const compressed = await new Promise<Buffer>((resolve, reject) => {
                zlib.deflate(jsonString, (err, buffer) => {
                    if (err) reject(err);
                    else resolve(buffer);
                });
            });

            // Encrypt the compressed data
            const encrypted = this.encrypt(compressed.toString('base64'));

            // Write to file
            await fs.promises.writeFile(this.filePath, encrypted);
        } catch (error) {
            throw new Error(`Failed to write to list file: ${error.message}`);
        }
    }

    async read(): Promise<any[]> {
        try {
            // Read the encrypted file
            const fileData = await fs.promises.readFile(this.filePath);
            
            // Decrypt the data
            const decrypted = this.decrypt(fileData);
            
            // Decompress the data
            const decompressed = await new Promise<string>((resolve, reject) => {
                zlib.inflate(Buffer.from(decrypted, 'base64'), (err, buffer) => {
                    if (err) reject(err);
                    else resolve(buffer.toString());
                });
            });

            // Parse and return the data
            return JSON.parse(decompressed);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return []; // Return empty array if file doesn't exist
            }
            throw new Error(`Failed to read list file: ${error.message}`);
        }
    }

    async append(item: any): Promise<void> {
        const currentData = await this.read();
        currentData.push(item);
        await this.write(currentData);
    }

    async remove(predicate: (item: any) => boolean): Promise<void> {
        const currentData = await this.read();
        const filteredData = currentData.filter(item => !predicate(item));
        await this.write(filteredData);
    }

    async clear(): Promise<void> {
        await this.write([]);
    }

    static async readFile(filePath: string, key: string): Promise<any[]> {
        const listFile = new ListFile(filePath, key);
        return await listFile.read();
    }


    static async add(filePath: string, key: string, item: any): Promise<void> {
        const listFile = new ListFile(filePath, key);
        await listFile.append(item);
    }

    static async remove(filePath: string, key: string, predicate: (item: any) => boolean): Promise<void> {
        const listFile = new ListFile(filePath, key);
        await listFile.remove(predicate);
    }

    static async clear(filePath: string, key: string): Promise<void> {
        const listFile = new ListFile(filePath, key);
        await listFile.clear();
    }
}

export default ListFile;
