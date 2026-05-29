require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const logger = require('./config/logger');

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Morgan logger untuk HTTP requests
app.use(morgan('combined', {
    stream: {
        write: (message) => {
            logger.info(`HTTP Request: ${message.trim()}`);
        }
    }
}));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wallet', walletRoutes);

// Default route untuk frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Logs will be saved in logs/ folder`);
});