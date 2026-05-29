const { users, transactions, transactionIdCounter } = require('../config/db');
const logger = require('../config/logger');

const getBalance = async (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const userTransactions = transactions.filter(t => 
            t.from_user_id === req.user.id || t.to_user_id === req.user.id
        );
        
        logger.info(`Balance checked - User: ${user.email}, Balance: ${user.balance}`);
        
        res.json({
            success: true,
            message: 'Balance retrieved successfully',
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
        logger.error(`Get balance error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const topUp = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }
        
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const oldBalance = user.balance;
        user.balance += amount;
        
        const transaction = {
            id: transactionIdCounter++,
            type: 'TOPUP',
            amount: amount,
            from_user_id: user.id,
            from_email: user.email,
            to_user_id: user.id,
            to_email: user.email,
            timestamp: new Date().toISOString()
        };
        transactions.push(transaction);
        
        logger.info(`Wallet top-up - User: ${user.email}, Amount: ${amount}, Old Balance: ${oldBalance}, New Balance: ${user.balance}`);
        
        res.json({
            success: true,
            message: 'Top up successful',
            data: {
                new_balance: user.balance,
                transaction: transaction
            }
        });
    } catch (error) {
        logger.error(`Top up error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const transfer = async (req, res) => {
    try {
        const { target_email, amount } = req.body;
        
        if (!target_email || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Target email and valid amount are required'
            });
        }
        
        const fromUser = users.find(u => u.id === req.user.id);
        const toUser = users.find(u => u.email === target_email);
        
        if (!fromUser) {
            return res.status(404).json({
                success: false,
                message: 'Sender not found'
            });
        }
        
        if (!toUser) {
            logger.warn(`Transfer failed - Target user not found: ${target_email}`);
            return res.status(404).json({
                success: false,
                message: 'Target user not found'
            });
        }
        
        if (fromUser.balance < amount) {
            logger.warn(`Transfer failed - Insufficient balance: ${fromUser.email} attempted to transfer ${amount} but balance is ${fromUser.balance}`);
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }
        
        const oldFromBalance = fromUser.balance;
        const oldToBalance = toUser.balance;
        
        fromUser.balance -= amount;
        toUser.balance += amount;
        
        const transaction = {
            id: transactionIdCounter++,
            type: 'TRANSFER',
            amount: amount,
            from_user_id: fromUser.id,
            from_email: fromUser.email,
            to_user_id: toUser.id,
            to_email: toUser.email,
            timestamp: new Date().toISOString()
        };
        transactions.push(transaction);
        
        logger.info(`Transfer completed - From: ${fromUser.email} (${oldFromBalance} -> ${fromUser.balance}), To: ${toUser.email} (${oldToBalance} -> ${toUser.balance}), Amount: ${amount}`);
        
        res.json({
            success: true,
            message: 'Transfer successful',
            data: {
                from_balance: fromUser.balance,
                to_user: toUser.email,
                amount: amount,
                transaction: transaction
            }
        });
    } catch (error) {
        logger.error(`Transfer error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = { getBalance, topUp, transfer };