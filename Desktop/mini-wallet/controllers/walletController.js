const db = require('../config/db');
const logger = require('../config/logger');

// GET BALANCE - Mendapatkan saldo dan riwayat transaksi
const getBalance = async (req, res) => {
    try {
        console.log('📊 Get balance request from user:', req.user.id);
        
        const user = db.users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        // Ambil riwayat transaksi user
        const userTransactions = db.transactions.filter(t => 
            t.from_user_id === req.user.id || t.to_user_id === req.user.id
        );
        
        console.log(`✅ Balance: ${user.balance}, Transactions: ${userTransactions.length}`);
        
        res.json({
            success: true,
            message: 'Saldo berhasil diambil',
            data: {
                balance: user.balance,
                transactions: userTransactions.map(t => ({
                    id: t.id,
                    type: t.type,
                    amount: t.amount,
                    from_email: t.from_email,
                    to_email: t.to_email,
                    timestamp: t.timestamp
                }))
            }
        });
        
    } catch (error) {
        console.error('❌ Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// TOP UP - Menambah saldo user
const topUp = async (req, res) => {
    try {
        const { amount } = req.body;
        
        console.log('💰 Topup request:', { userId: req.user.id, amount });
        
        // Validasi amount
        if (!amount && amount !== 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount wajib diisi'
            });
        }
        
        if (isNaN(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Amount harus berupa angka'
            });
        }
        
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount harus lebih besar dari 0'
            });
        }
        
        const user = db.users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        // Update balance
        const oldBalance = user.balance;
        user.balance = user.balance + amount;
        
        // Catat transaksi
        const transaction = {
            id: db.transactionIdCounter++,
            type: 'TOPUP',
            amount: amount,
            from_user_id: user.id,
            from_email: user.email,
            to_user_id: user.id,
            to_email: user.email,
            timestamp: new Date().toISOString()
        };
        db.transactions.push(transaction);
        
        console.log(`✅ Topup success: ${user.email} balance ${oldBalance} -> ${user.balance}`);
        logger.info(`Topup - User: ${user.email}, Amount: ${amount}, New Balance: ${user.balance}`);
        
        res.json({
            success: true,
            message: 'Top up berhasil',
            data: {
                new_balance: user.balance,
                transaction: transaction
            }
        });
        
    } catch (error) {
        console.error('❌ Topup error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

// TRANSFER - Mengirim uang ke user lain
const transfer = async (req, res) => {
    try {
        const { target_email, amount } = req.body;
        
        console.log('💸 Transfer request:', { fromUser: req.user.id, target_email, amount });
        
        // Validasi target email
        if (!target_email) {
            return res.status(400).json({
                success: false,
                message: 'Email tujuan wajib diisi'
            });
        }
        
        // Validasi amount
        if (!amount && amount !== 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount wajib diisi'
            });
        }
        
        if (isNaN(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Amount harus berupa angka'
            });
        }
        
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount harus lebih besar dari 0'
            });
        }
        
        const fromUser = db.users.find(u => u.id === req.user.id);
        const toUser = db.users.find(u => u.email === target_email);
        
        // Validasi pengirim
        if (!fromUser) {
            return res.status(404).json({
                success: false,
                message: 'Pengirim tidak ditemukan'
            });
        }
        
        // Validasi penerima
        if (!toUser) {
            console.log(`❌ Target user not found: ${target_email}`);
            return res.status(404).json({
                success: false,
                message: 'User tujuan tidak ditemukan'
            });
        }
        
        // Cek transfer ke diri sendiri
        if (fromUser.id === toUser.id) {
            return res.status(400).json({
                success: false,
                message: 'Tidak dapat transfer ke diri sendiri'
            });
        }
        
        // Cek saldo cukup
        if (fromUser.balance < amount) {
            console.log(`❌ Insufficient balance: ${fromUser.email} has ${fromUser.balance}, need ${amount}`);
            return res.status(400).json({
                success: false,
                message: `Saldo tidak mencukupi. Saldo Anda: $${fromUser.balance}`
            });
        }
        
        // Proses transfer
        const oldFromBalance = fromUser.balance;
        const oldToBalance = toUser.balance;
        
        fromUser.balance = fromUser.balance - amount;
        toUser.balance = toUser.balance + amount;
        
        // Catat transaksi
        const transaction = {
            id: db.transactionIdCounter++,
            type: 'TRANSFER',
            amount: amount,
            from_user_id: fromUser.id,
            from_email: fromUser.email,
            to_user_id: toUser.id,
            to_email: toUser.email,
            timestamp: new Date().toISOString()
        };
        db.transactions.push(transaction);
        
        console.log(`✅ Transfer success: ${fromUser.email} (${oldFromBalance} -> ${fromUser.balance}) to ${toUser.email} (${oldToBalance} -> ${toUser.balance})`);
        logger.info(`Transfer - From: ${fromUser.email} To: ${toUser.email}, Amount: ${amount}`);
        
        res.json({
            success: true,
            message: 'Transfer berhasil',
            data: {
                from_balance: fromUser.balance,
                to_user: toUser.email,
                amount: amount,
                transaction: transaction
            }
        });
        
    } catch (error) {
        console.error('❌ Transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};

module.exports = { getBalance, topUp, transfer };