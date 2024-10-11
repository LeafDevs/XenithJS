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

For more information on how to use Xenith.JS, please refer to the [official documentation](https://lesbians.monster/xenithjs).

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
