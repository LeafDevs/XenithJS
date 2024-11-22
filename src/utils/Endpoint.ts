import { IncomingMessage, ServerResponse } from "http";
import http from 'http';
import crypto from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import { decryptMessage, encryptMessage, privateKey } from "../crypto";
import url from 'url';
import { table } from 'table';

// Use WeakMap to allow garbage collection of unused endpoints
const endpoints = new WeakMap<Endpoint, boolean>();
const endpointsList: Endpoint[] = [];

let encrypt = false;
let api = false;
// Use Set instead of array for O(1) lookups
const apiKeys = new Set<APIKey>();
let rateLimits: number = 1000;
let page404: string = path.join(__dirname + '/404.html');

/* 
This is the backend manager made by me. I call it XenithJS (xenith) for short.
With it you can register endpoints, and handle requests, responses and more.

This backend manager is built using Typescript and uses 0 External Libraries.
The Data Structure is built using eciesjs for encryption.
Users who use this can set the encryption to true, and all data sent to the server will be encrypted.

They can also set the API to true and all requests that specify an access level of "LIMIT" will need an API Key.
if its set to "NO_LIMIT" then no API keys are required. They can also set the rate limit of requests per minute.

Each API Key is a unique ID and can be stored however the user likes.

This backend again uses 0 external libraries and is built to be as light as possible.
*/

// APIKey class for managing API keys and rate limiting
class APIKey {
    key: string;
    user: string | null;
    limited: boolean;
    requestCount: number;
    lastRequestTime: number;
    userID: string | null;
    cleanupInterval: NodeJS.Timeout;
    bypass: boolean;


    
    constructor() {
        this.key = crypto.randomBytes(32).toString('hex');
        this.user = null;
        this.limited = false;
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
        this.userID = null;
        this.bypass = false;
        apiKeys.add(this);

        // Use single interval instead of creating new ones
        this.cleanupInterval = setInterval(() => {
            this.requestCount = 0;
            this.limited = false;
        }, 60000);
    }

    // Clean up resources when APIKey is no longer needed
    destroy() {
        clearInterval(this.cleanupInterval);
        apiKeys.delete(this);
    }

    canBypass(): boolean {
        return this.bypass;
    }

    setBypass(bypass: boolean): void {
        this.bypass = bypass;
    }

    static generate(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    static validate(key: string): boolean {
        return crypto.createHash('sha256').update(key).digest('hex') === key;
    }

    static find(key: string): APIKey | undefined {
        for (const apiKey of apiKeys) {
            if (apiKey.key === key) return apiKey;
        }
        return undefined;
    }

    static fromUserID(user: string): APIKey | undefined {
        for (const apiKey of apiKeys) {
            if (apiKey.user === user) return apiKey;
        }
        return undefined;
    }

    setKey(key: string): void {
        this.key = key;
    }

    belongsTo(user: string | null): void {
        this.user = user;
    }

    whoOwns(key: string): string | null {
        const apiKey = APIKey.find(key);
        return apiKey?.user ?? null;
    }

    isLimited(): boolean {
        return this.limited;
    }

    setLimited(isLimited: boolean): void {
        this.limited = isLimited;
    }

    canRequest(): boolean {
        const now = Date.now();
        const timePassed = now - this.lastRequestTime;

        if (timePassed > 60000) {
            this.requestCount = 0;
            this.lastRequestTime = now;
            this.limited = false;
        }

        if (this.requestCount < rateLimits) {
            this.requestCount++;
            return true;
        }
        
        this.limited = true;
        return false;
    }
}

interface User {
    name: string;
    email: string;
    phone: string;
    profilePicture: string;
    uniqueID: string;
    applications: never[];
}

// Endpoint class for managing API endpoints
class Endpoint {
    constructor(
        public path: string, 
        public method: string,
        public access: string,
        public handler: (req: IncomingMessage, res: CustomResponse) => void
    ) {
        this.register();
    }

    register(): void {
        endpoints.set(this, true);
        endpointsList.push(this);
    }

    static get(path: string, method: string): Endpoint | undefined {
        return endpointsList.find(endpoint => {
            const endpointSegments = endpoint.path.split('/');
            const requestSegments = path.split('/');

            if (endpointSegments.length !== requestSegments.length) return false;

            return endpointSegments.every((segment, i) => 
                segment.startsWith(':') || segment === requestSegments[i]
            ) && endpoint.method === method;
        });
    }

    static getAll(): Endpoint[] {
        return endpointsList;
    }
}

// EndpointManager class for managing the overall API structure

class EndpointManager {
    private registeredEndpoints: string[][] = [];

    constructor() {
        console.log("EndpointManager Created.");        
    }

    // Register endpoints from a specific folder
    registerInPath(folder: string): void {
        const files = fs.readdirSync(folder).filter(file => file.endsWith('.ts'));
        files.forEach(file => {
            const fullPath = path.join(folder, file);
            const endpoints = require(fullPath);
            
            if (Array.isArray(endpoints)) {
                endpoints.forEach(endpoint => this.registerEndpoint(endpoint, file));
            } else {
                this.registerEndpoint(endpoints, file);
            }
        });
        this.logRegisteredEndpoints();
    }
    private registerEndpoint(endpoint: any, file: string): void {
        // Handle default export case
        if (endpoint.default) {
            endpoint = endpoint.default;
        }

        if (endpoint.path && endpoint.method && endpoint.execute) {
            this.register(new Endpoint(endpoint.path, endpoint.method, endpoint.access, endpoint.execute));
            this.registeredEndpoints.push([endpoint.path, endpoint.method, 'Success']);
            console.log(`Registered endpoint: ${endpoint.path} ${endpoint.method}`);
        } else {
            this.registeredEndpoints.push([file, 'N/A', 'Invalid']);
            console.warn(`Invalid endpoint in file: ${file}`);
        }
    }

    private logRegisteredEndpoints(): void {
        const output = table([
            ['Path', 'Method', 'Status'],
            ...this.registeredEndpoints
        ], {
            border: {
                topBody: '─',
                topJoin: '┬',
                topLeft: '┌',
                topRight: '┐',
                bottomBody: '─',
                bottomJoin: '┴',
                bottomLeft: '└',
                bottomRight: '┘',
                bodyLeft: '│',
                bodyRight: '│',
                bodyJoin: '│',
                joinBody: '─',
                joinLeft: '├',
                joinRight: '┤',
                joinJoin: '┼',
            },
            columns: [
                { alignment: 'left', width: 30 }, // Path
                { alignment: 'center', width: 10 }, // Method
                { alignment: 'right', width: 10 } // Status
            ]
        });
        console.log(output);
    }

    // Register multiple endpoints
    registerAll(endpoints: Endpoint[]): void {
        endpoints.forEach(endpoint => this.register(endpoint));
    }

    // Register a single endpoint
    register(endpoint: Endpoint): void {
        endpoint.register();
    }

    // Register a GET endpoint
    GET(path: string, callback: (req: IncomingMessage, res: CustomResponse) => void, access?: string): Endpoint | undefined {
        const newEndpoint = new Endpoint(path, "GET", access || "NO_LIMIT", callback);
        this.register(newEndpoint);
        return newEndpoint;
    }

    // Register a POST endpoint
    POST(path: string, callback: (req: IncomingMessage, res: CustomResponse) => void, access?: string): Endpoint | undefined {
        const newEndpoint = new Endpoint(path, "POST", access || "NO_LIMIT", callback);
        this.register(newEndpoint);
        return newEndpoint;
    }

    // Register a DELETE endpoint
    DELETE(path: string, callback: (req: IncomingMessage, res: CustomResponse) => void, access?: string): Endpoint | undefined {
        const newEndpoint = new Endpoint(path, "DELETE", access || "NO_LIMIT", callback);
        this.register(newEndpoint);
        return newEndpoint;
    }

    // Serve static images and register new files
    IMAGES(folder: string, route: string): void {
        const registerImageEndpoint = (file: string) => {
            this.GET(route + '/' + file, (req, res) => res.image(path.join(folder, file)));
        };

        // Register existing files
        fs.readdirSync(folder).forEach(file => {
            registerImageEndpoint(file);
        });

        // Watch for new files in the folder
        fs.watch(folder, (eventType, filename) => {
            if (eventType === 'rename' && filename) {
                registerImageEndpoint(filename);
                console.log(`Registered new image endpoint: ${route}/${filename}`);
            }
        });
    }

    // Handle incoming requests
    handleRequest(req: IncomingMessage, res: CustomResponse): void {
        const parsedUrl = url.parse(req.url as string, true);
        let path = parsedUrl.pathname as string;
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        const endpoint = Endpoint.get(path, req.method as string);
        
        if (endpoint) {
            // Extract path parameters
            const pathParams: Record<string, string> = {}; // Define pathParams with a specific type
            const endpointSegments = endpoint.path.split('/');
            const requestSegments = path.split('/');
            
            endpointSegments.forEach((segment, i) => {
                if (segment.startsWith(':')) {
                    const paramName = segment.slice(1); // Remove the : prefix
                    pathParams[paramName] = requestSegments[i];
                }
            });
            
            // Add path parameters to request object
            (req as any).params = pathParams;
            (req as any).query = parsedUrl.query;

            const apiKeyHeader = req.headers['authorization']?.split(' ')[1];
            let apiKey = apiKeyHeader ? APIKey.find(apiKeyHeader) || APIKey.fromUserID(apiKeyHeader) : undefined;
            if ((req.method === 'GET' || req.method === 'POST') && endpoint.access === "NO_LIMIT") {
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', (chunk: Buffer) => {
                        body += chunk.toString();
                    });
                    req.on('end', () => {
                        try {
                            const parsedBody = JSON.parse(body) || {code: 404, message: "Invalid request"};
                            if (!encrypt) {
                                (req as any).body = parsedBody;
                                endpoint.handler(req, res);
                            } else {
                                const decrypted = encryptMessage(new Data(parsedBody).toJSON(), privateKey.publicKey.toHex());
                                (req as any).body = {data: decrypted};
                                endpoint.handler(req, res);
                            }
                        } catch (e) {
                            const parsedBody = JSON.parse(body) || {code: 404, message: "Invalid request"};
                            if (!encrypt) {
                                (req as any).body = parsedBody;
                                endpoint.handler(req, res);
                            } else {
                                const decrypted = encryptMessage(new Data(parsedBody).toJSON(), privateKey.publicKey.toHex());
                                (req as any).body = {data: decrypted};
                                endpoint.handler(req, res);
                            }
                        }
                    });
                } else {
                    endpoint.handler(req, res);
                }
            } else if (apiKey) {
                // Skip rate limiting if API key can bypass
                if (!apiKey.canBypass()) {
                    apiKey.requestCount++;
                    if (apiKey.requestCount >= rateLimits) {
                        apiKey.limited = true;
                    }
                    if (apiKey.isLimited()) {
                        res.send('Rate limit exceeded or invalid API key', 429);
                        return;
                    }
                }

                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', (chunk: Buffer) => {
                        body += chunk.toString();
                    });
                    req.on('end', () => {
                        try {
                            const parsedBody = JSON.parse(body) || {code: 404, message: "Invalid request"};
                            if (!encrypt) {
                                (req as any).body = parsedBody;
                                endpoint.handler(req, res);
                            } else {
                                const decrypted = encryptMessage(new Data(parsedBody).toJSON(), privateKey.publicKey.toHex());
                                (req as any).body = {data: decrypted};
                                endpoint.handler(req, res);
                            }
                        } catch (e) {
                            let parsedBody;
                            try {
                                parsedBody = JSON.parse(body) || {code: 404, message: "Invalid request"};
                            } catch (e) {
                                parsedBody = {code: 404, message: "No Body Provided"};
                            }
                            if (!encrypt) {
                                (req as any).body = parsedBody;
                                endpoint.handler(req, res);
                            } else {
                                const decrypted = encryptMessage(new Data(parsedBody).toJSON(), privateKey.publicKey.toHex());
                                (req as any).body = {data: decrypted};
                                endpoint.handler(req, res);
                            }
                        }
                    });
                } else {
                    endpoint.handler(req, res);
                }
            } else {
                res.send('Rate limit exceeded or invalid API key', 429);
            }
        } else {
            res.html(page404);
        }
    }

    // Set various options for the server
    set(key: options, value: any): void {
        switch(key) {
            case options.encrypt:
                encrypt = value;
                break;
            case options.api:
                api = value;
                break;
            case options.rateLimit:
                rateLimits = value;
                break;
            case options.page404:
                page404 = value;
                break;
        }
    }

    // Start the server and listen on a specific port
    listen(port: number, callback?: () => void): void {
        const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
            const customResponse = new CustomResponse(res);
            this.handleRequest(req, customResponse);
        });

        server.on('request', (req, res) => {
            res.setHeader("Content-Security-Policy", "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src http://localhost:3000 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;");
            res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.setHeader("Access-Control-Allow-Credentials", "true");
        });
        
        server.listen(port, async () => {
            if(await isUpdated()) {
                console.log(`{UPDATER} XenithJS is up to date.`);
            } else { 
                console.log(`{UPDATER} XenithJS is out of date. Please update to the latest version using\n    npm i xenith@latest\n`);
            }

            if(api) {
                console.log(" ");
                console.log(`{DEBUG} API is enabled. API keys are being used.`);
                console.log(`{DEBUG} Rate Limit: ${rateLimits} requests per minute.`);
                console.log(" ");
            }
            if(encrypt) {
                console.log(`{DEBUG} Encrypt is enabled. Data is being encrypted.`);
                console.log(" ");
            }
            if (callback) {
                callback();
            } else {
                console.log(`Server listening on port http://localhost:${port}`);
            }
        });
    }
}

// Data class for handling JSON data
class Data {
    constructor(public json: {}) {
    }

    toJSON(): string {
        return JSON.stringify(this.json);
    }

    static fromJSON(json: string): Data {
        return new Data(JSON.parse(json));
    }

    static toJSON(data: Data): string {
        return data.toJSON();
    }

    static toBase64(data: Data): string {
        return Buffer.from(data.toJSON()).toString('base64');
    }

    static fromBase64(base64: string): Data {
        return Data.fromJSON(Buffer.from(base64, 'base64').toString());
    }

    static hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    static encrypt(data: Data): string {
        return encryptMessage(data.toJSON(), privateKey.publicKey.toHex());
    }

    static decrypt(data: Data): string {
        return decryptMessage(data.toJSON(), privateKey);
    }
}

// Cookie class for handling HTTP cookies
class Cookie {
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

    // Convert cookie to string format
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

    // Parse a cookie string into a Cookie object
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
    [x: string]: any;

    constructor(private serverResponse: ServerResponse) {}

    // Send a plain text response
    send(data: string, statusCode: number = 200): void {
        this.serverResponse.writeHead(statusCode, { 
            'Content-Type': 'text/plain',
            'Content-Security-Policy': "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;",
            'Access-Control-Allow-Origin': '*'
        });
        this.serverResponse.end(data);
    }

    // Send an HTML file as response
    html(filePath: string): void {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                this.logError('Error reading file:', err);
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

    image(filePath: string): void {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                this.logError('Error reading file:', err);
                this.serverResponse.writeHead(500, { 'Content-Type': 'text/plain' });
                this.serverResponse.end('Internal Server Error');
                return;
            }
            this.serverResponse.writeHead(200, { 
                'Content-Type': 'image/webp',
                'Access-Control-Allow-Origin': '*'
            });
            this.serverResponse.end(data);
        });
    }

    // Send a JSON response
    json(data: any): void {
        this.serverResponse.writeHead(200, { 
            'Content-Type': 'application/json',
            'Content-Security-Policy': "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;",
            'Access-Control-Allow-Origin': '*'
        });
        this.serverResponse.end(JSON.stringify(data));
    }

    // Set a custom header
    setHeader(key: string, value: string): CustomResponse {
        this.serverResponse.writeHead(this.serverResponse.statusCode || 200, {
            [key]: value,
            'Access-Control-Allow-Origin': '*'
        });
        return this;
    }

    // Redirect the user to a different site/page
    redirect(url: string, statusCode: number = 302): void {
        this.serverResponse.writeHead(statusCode, {
            'Location': url,
            'Access-Control-Allow-Origin': '*'
        });
        this.serverResponse.end();
    }

    // Log errors to a file
    private logError(message: string, error: any): void {
        const logMessage = `${new Date().toISOString()} - ${message} ${JSON.stringify(error)}\n`;
        fs.appendFile(path.join(__dirname, 'error.log'), logMessage, (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });
        console.log("Error Occurred Check Log File");
    }
}

// Check if the current version is up to date
let cachedUpdateStatus: boolean | null = null;

const isUpdated = async (): Promise<boolean> => {
    if (cachedUpdateStatus !== null) {
        return cachedUpdateStatus;
    }

    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;

    const latestVersion = await getLatestVersion();
    cachedUpdateStatus = currentVersion === latestVersion;
    return cachedUpdateStatus;
}

// Get the latest version from npm registry
const getLatestVersion = async (): Promise<string> => {
    const response = await fetch(`https://registry.npmjs.org/xenith`);
    const data = await response.json();
    return data['dist-tags'].latest;
};

enum APIKeyStatus {
    VALID,
    INVALID,
    EXPIRED,
    LIMITED
}

enum options {
    encrypt,
    api,
    rateLimit,
    page404
}

export { EndpointManager, Endpoint, endpoints, Data, Cookie, CustomResponse, APIKey, APIKeyStatus, options };
