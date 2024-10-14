import { IncomingMessage, ServerResponse } from "http";
import http from 'http';
import crypto from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import { decryptMessage, encryptMessage, privateKey } from "../crypto";
const endpoints: Endpoint[] = [];

class Endpoint {
    constructor(public path: string, public method: string, public handler: (req: Request, res: CustomResponse) => void) {
        this.register();
    }

    register(): void {
        endpoints.push(this);
    }

    static get(path: string, method: string): Endpoint | undefined {
        return endpoints.find(endpoint => endpoint.path === path && endpoint.method === method);
    }
    static getAll(): Endpoint[] {
        return endpoints;
    }
}

class EndpointManager {
    constructor() {
        console.log("EndpointManager Created.");        
    }

    registerInPath(folder: string): void {
        const files = fs.readdirSync(folder).filter(file => file.endsWith('.ts'));
        files.forEach(file => {
            const fullPath = path.join(folder, file);
            const endpoint = require(fullPath);
            
            if (endpoint.path && endpoint.method && endpoint.execute) {
                this.register(new Endpoint(endpoint.path, endpoint.method, endpoint.execute));
                console.log(`Registered endpoint: ${endpoint.path} ${endpoint.method}`);
            } else {
                console.warn(`Invalid endpoint in file: ${file}`);
            }
        });
    }

    registerAll(endpoints: Endpoint[]): void {
        endpoints.forEach(endpoint => this.register(endpoint));
    }

    register(endpoint: Endpoint): void {
        endpoint.register();
    }

    GET(path: string, callback: (req: Request, res: CustomResponse) => void): Endpoint | undefined {
        const newEndpoint = new Endpoint(path, "GET", callback);
        this.register(newEndpoint);
        return newEndpoint;
    }

    POST(path: string, callback: (req: Request, res: CustomResponse) => void): Endpoint | undefined {
        const newEndpoint = new Endpoint(path, "POST", callback);
        this.register(newEndpoint);
        return newEndpoint;
    }

    DELETE(path: string, callback: (req: Request, res: CustomResponse) => void): Endpoint | undefined {
        const newEndpoint = new Endpoint(path, "DELETE", callback);
        this.register(newEndpoint);
        return newEndpoint;
    }

    handleRequest(req: IncomingMessage, res: CustomResponse): void {
        const endpoint = Endpoint.get(req.url as string, req.method as string);
        if (endpoint) {
            if (req.method === 'POST') {
                let body = '';
                req.on('data', (chunk: Buffer) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    body = Data.encrypt(new Data(body));
                    const requestWithBody = { ...req, body };
                    endpoint.handler(requestWithBody as unknown as Request, res);
                });
            } else {
                endpoint.handler(req as unknown as Request, res);
            }
        } else {
            res.send('Not Found');
        }
    }

    listen(port: number, callback?: () => void): void {
        const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
            const customResponse = new CustomResponse(res);
            this.handleRequest(req, customResponse);
        });

        server.on('request', (req, res) => {
            res.setHeader("Content-Security-Policy", "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;");
            res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.setHeader("Access-Control-Allow-Credentials", "true");
        });
        
        server.listen(port, () => {
            console.log(`
                Powered By XenithJS
                Version 1.0.2
                https://lesbians.monster/xenithjs
            `);
            if (callback) {
                callback();
            } else {
                console.log(`Server listening on port http://localhost:${port}`);
            }
        });
    }
}

class Data {
    constructor(public json: {}) {
    }

    get(key: string): any {
        return this.json[key];
    }

    set(key: string, value: any): void {
        this.json[key] = value;
    }

    toJSON(): string {
        return JSON.stringify(this.json);
    }

    static fromJSON(json: string): Data {
        return new Data(JSON.parse(json));
    }

    static toBase64(data: Data): string {
        return Buffer.from(data.toJSON()).toString('base64');
    }

    static fromBase64(base64: string): Data {
        return Data.fromJSON(Buffer.from(base64, 'base64').toString());
    }

    static hash(data: Data): string {
        return crypto.createHash('sha256').update(data.toJSON()).digest('hex');
    }

    static encrypt(data: Data): string {
        return encryptMessage(data.toJSON(), privateKey.publicKey.toHex());
    }

    static decrypt(data: Data): string {
        return decryptMessage(data.toJSON(), privateKey);
    }
}

class Cookie { // Define data for cookie.
    constructor(
        public name: string,
        public value: string,
        public options: {
            expires?: Date;
            maxAge?: number;
            domain?: string;
            path?: string;
            secure?: boolean;
            httpOnly?: boolean;
            sameSite?: 'Strict' | 'Lax' | 'None';
        } = {}
    ) {}

    toString(): string {
        let cookieString = `${this.name}=${encodeURIComponent(this.value)}`;

        if (this.options.expires) {
            cookieString += `; Expires=${this.options.expires.toUTCString()}`;
        }
        if (this.options.maxAge !== undefined) {
            cookieString += `; Max-Age=${this.options.maxAge}`;
        }
        if (this.options.domain) {
            cookieString += `; Domain=${this.options.domain}`;
        }
        if (this.options.path) {
            cookieString += `; Path=${this.options.path}`;
        }
        if (this.options.secure) {
            cookieString += '; Secure';
        }
        if (this.options.httpOnly) {
            cookieString += '; HttpOnly';
        }
        if (this.options.sameSite) {
            cookieString += `; SameSite=${this.options.sameSite}`;
        }

        return cookieString;
    }

    static parse(cookieString: string): Cookie {
        const [nameValue, ...options] = cookieString.split(';').map(s => s.trim());
        const [name, value] = nameValue.split('=');
        const parsedOptions: Cookie['options'] = {};

        options.forEach(option => {
            const [key, val] = option.split('=');
            switch (key.toLowerCase()) {
                case 'expires':
                    parsedOptions.expires = new Date(val);
                    break;
                case 'max-age':
                    parsedOptions.maxAge = parseInt(val, 10);
                    break;
                case 'domain':
                    parsedOptions.domain = val;
                    break;
                case 'path':
                    parsedOptions.path = val;
                    break;
                case 'secure':
                    parsedOptions.secure = true;
                    break;
                case 'httponly':
                    parsedOptions.httpOnly = true;
                    break;
                case 'samesite':
                    parsedOptions.sameSite = val as 'Strict' | 'Lax' | 'None';
                    break;
            }
        });

        return new Cookie(name, decodeURIComponent(value), parsedOptions);
    }
}

class CustomResponse {
    constructor(private serverResponse: ServerResponse) {}

    send(data: string): void {
        this.serverResponse.writeHead(200, { 
            'Content-Type': 'text/plain',
            'Content-Security-Policy': "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;",
            'Access-Control-Allow-Origin': '*'
        });
        this.serverResponse.end(data);
    }

    html(filePath: string): void {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                this.serverResponse.writeHead(500, { 'Content-Type': 'text/plain' });
                this.serverResponse.end('Internal Server Error');
                return;
            }

            this.serverResponse.writeHead(200, { 
                'Content-Type': 'text/html',
                'Content-Security-Policy': "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;",
                'Access-Control-Allow-Origin': '*'
            });
            
            this.serverResponse.end(data);
        });
    }

    json(data: any): void {
        this.serverResponse.writeHead(200, { 
            'Content-Type': 'application/json',
            'Content-Security-Policy': "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;",
            'Access-Control-Allow-Origin': '*'
        });
        this.serverResponse.end(JSON.stringify(data));
    }
}

export { EndpointManager, Endpoint, endpoints, Data, Cookie, CustomResponse };
