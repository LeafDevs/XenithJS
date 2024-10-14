# Xenith.JS

Xenith.JS is a lightweight JavaScript library created by Leaf.
Its main purpose is to make it easier to create REST APIs.

## Installation

To install Xenith.JS, use npm:

```bash
npm install xenith
```

OR

```bash
git clone https://github.com/LeafDevs/XenithJS
```

## Usage

```javascript
const { EndpointManager } = require('xenith');

const endpointManager = new EndpointManager();

endpointManager.GET('/', (req, res) => {
    res.send('Hello World');
});

endpointManager.listen(3000);

```

## Documentation

Here are some examples of the different methods available in the EndpointManager:

### `GET(path: string, callback: (req: Request, res: CustomResponse) => void): Endpoint | undefined`
Registers a new GET endpoint with the specified path and callback function. The callback is executed when a GET request is made to the specified path.

### `POST(path: string, callback: (req: Request, res: CustomResponse) => void): Endpoint | undefined`
Registers a new POST endpoint with the specified path and callback function. The callback is executed when a POST request is made to the specified path.

### `DELETE(path: string, callback: (req: Request, res: CustomResponse) => void): Endpoint | undefined`
Registers a new DELETE endpoint with the specified path and callback function. The callback is executed when a DELETE request is made to the specified path.

### `registerInPath(folder: string): void`
Registers all endpoints defined in TypeScript files within the specified folder. It looks for files ending with `.ts` and expects each file to export an endpoint with a path, method, and execute function.

### `listen(port: number, callback?: () => void): void`
Starts the server and listens for incoming requests on the specified port. Optionally accepts a callback function that is executed once the server starts listening.

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
