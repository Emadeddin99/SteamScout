const express = require('express');
const path = require('path');
require('dotenv').config();

// Import the deals API handler
const dealsHandler = require('./api/deals.js');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(path.join(__dirname)));

// API routes
app.get('/api/deals', async (req, res) => {
    // Mock req object for Vercel compatibility
    const mockReq = {
        method: 'GET',
        query: req.query
    };

    // Mock res object
    const mockRes = {
        setHeader: (name, value) => res.setHeader(name, value),
        status: (code) => {
            res.status(code);
            return mockRes;
        },
        json: (data) => res.json(data),
        end: () => res.end()
    };

    await dealsHandler(mockReq, mockRes);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});