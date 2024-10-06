const express = require('express');
const app = express();
const PORT = process.env.PORT || 5173;

// Middleware to parse JSON
app.use(express.json());

// Example route for testing
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
