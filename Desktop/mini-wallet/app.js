const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// DATABASE SEDERHANA
const users = [];
let userId = 1;

// REGISTER
app.post('/api/v1/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Register request:", { username, email });
    
    if (!username || !email || !password) {
        return res.json({ success: false, message: 'Semua field harus diisi' });
    }
    
    if (users.find(u => u.email === email)) {
        return res.json({ success: false, message: 'Email sudah terdaftar' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    users.push({
        id: userId++,
        username,
        email,
        password: hashed,
        balance: 0
    });
    
    console.log("User registered:", email);
    res.json({ success: true, message: 'Register berhasil' });
});

// LOGIN
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Login request:", email);
    
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.json({ success: false, message: 'Email atau password salah' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return res.json({ success: false, message: 'Email atau password salah' });
    }
    
    const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        'rahasia123',
        { expiresIn: '30m' }
    );
    
    console.log("User logged in:", email);
    res.json({
        success: true,
        message: 'Login berhasil',
        data: {
            token,
            user: { id: user.id, username: user.username, email: user.email }
        }
    });
});

// MIDDLEWARE
function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }
    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'rahasia123');
        req.user = decoded;
        next();
    } catch(err) {
        return res.status(401).json({ success: false, message: 'Token tidak valid' });
    }
}

// BALANCE
app.get('/api/v1/wallet/balance', auth, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    res.json({
        success: true,
        data: { balance: user ? user.balance : 0, transactions: [] }
    });
});

// TOPUP
app.post('/api/v1/wallet/topup', auth, (req, res) => {
    const { amount } = req.body;
    const user = users.find(u => u.id === req.user.id);
    
    if (!amount || amount <= 0) {
        return res.json({ success: false, message: 'Jumlah harus lebih dari 0' });
    }
    
    user.balance += amount;
    console.log(`${user.email} topup ${amount}, new balance: ${user.balance}`);
    
    res.json({ success: true, message: 'Top up berhasil', data: { new_balance: user.balance } });
});

// TRANSFER
app.post('/api/v1/wallet/transfer', auth, (req, res) => {
    const { target_email, amount } = req.body;
    const fromUser = users.find(u => u.id === req.user.id);
    const toUser = users.find(u => u.email === target_email);
    
    if (!toUser) {
        return res.json({ success: false, message: 'User tujuan tidak ditemukan' });
    }
    if (fromUser.balance < amount) {
        return res.json({ success: false, message: 'Saldo tidak mencukupi' });
    }
    
    fromUser.balance -= amount;
    toUser.balance += amount;
    
    console.log(`${fromUser.email} transfer ${amount} to ${toUser.email}`);
    res.json({ success: true, message: 'Transfer berhasil', data: { from_balance: fromUser.balance } });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Register & Login di http://localhost:${PORT}`);
});