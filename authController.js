const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// REGISTER - Membuat akun baru
const register = async (req, res) => {
    console.log('📝 Register request received:', req.body);
    
    try {
        const { username, email, password } = req.body;
        
        // Validasi input
        if (!username || !email || !password) {
            console.log('❌ Validation failed: Missing fields');
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }
        
        // Cek email sudah terdaftar
        const existingUser = db.users.find(u => u.email === email);
        if (existingUser) {
            console.log('❌ Email already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed successfully');
        
        // Buat user baru - AMBIL NILAI userCounter SEMENTARA
        let currentId = db.userIdCounter;
        let newUserId = currentId;
        
        // Buat user baru
        const newUser = {
            id: newUserId,
            username: username,
            email: email,
            password: hashedPassword,
            balance: 0
        };
        
        // Tambahkan ke array users
        db.users.push(newUser);
        
        // INCREMENT userIdCounter - Cara yang benar untuk mengubah nilai
        db.userIdCounter = db.userIdCounter + 1;
        
        console.log('✅ User created successfully:', { id: newUser.id, email: newUser.email });
        console.log('📊 Total users now:', db.users.length);
        
        // Response sukses
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
        
    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
};

// LOGIN - Login user
const login = async (req, res) => {
    console.log('📝 Login request received:', req.body.email);
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        const user = db.users.find(u => u.email === email);
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '30m' }
        );
        
        console.log('✅ Login successful:', email);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
};

module.exports = { register, login };