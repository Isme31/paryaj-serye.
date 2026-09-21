const express = require('express');
const router = express.Router();
// Si w gen yon Middleware pou verifye si itilizatè a konekte (Auth Token)
const { requireAuth } = require('../middleware/authMiddleware'); 
// Enpòte modèl baz de done ou yo (egzanp: Wallet ak Payment ak Sequelize oswa Mongoose)
const { Wallet, Payment } = require('../models'); 

/**
 * @route   POST /api/payment/deposit
 * @desc    Fè yon demann depo lajan (MonCash, Natcash, oswa Kat)
 * @access  Private
 */
router.post('/deposit', requireAuth, async (req, res) => {
    const { amount, method, transactionId } = req.body;
    const userId = req.user.id; // Id itilizatè ki konekte a

    // 1. Validasyon senp
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Kantite lajan an pa valid." });
    }
    if (!method || !transactionId) {
        return res.status(400).json({ success: false, message: "Tout enfòmasyon yo obligatwa." });
    }

    try {
        // 2. Anrejistre tranzaksyon depo a nan istwa pèman yo
        const newDeposit = await Payment.create({
            userId,
            amount,
            type: 'deposit',
            method, // 'moncash', 'natcash', 'card', elatriye
            transactionId,
            status: 'pending' // 'pending' paske pafwa sa mande verifikasyon admin oswa API webhook
        });

        // 3. SI pèman an fèt otomatikman epi li lwen (egzanp: API webhook konfime l):
        // N ap mete sol bous (Wallet) itilizatè a ajou
        const userWallet = await Wallet.findOne({ where: { userId } });
        if (userWallet) {
            userWallet.balance += parseFloat(amount);
            await userWallet.save();
            
            // Chanje status pèman an an 'completed'
            newDeposit.status = 'completed';
            await newDeposit.save();
        }

        return res.status(200).json({
            success: true,
            message: "Depo a fèt avèk siksè!",
            balance: userWallet ? userWallet.balance : 0,
            transaction: newDeposit
        });

    } catch (error) {
        console.error("Erè nan depo:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm." });
    }
});

/**
 * @route   POST /api/payment/withdraw
 * @desc    Fè yon demann retrè lajan
 * @access  Private
 */
router.post('/withdraw', requireAuth, async (req, res) => {
    const { amount, method, accountNumber } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Kantite lajan an pa valid." });
    }

    try {
        // 1. Verifye si itilizatè a gen ase lajan nan bous li pou l retire
        const userWallet = await Wallet.findOne({ where: { userId } });
        
        if (!userWallet || userWallet.balance < amount) {
            return res.status(400).json({ success: false, message: "Lajan ki sou kont ou an pa ase pou retrè sa a." });
        }

        // 2. Soustrè lajan an nan bous la imedyatman (bloke lajan an)
        userWallet.balance -= parseFloat(amount);
        await userWallet.save();

        // 3. Anrejistre demand retrè a
        const newWithdrawal = await Payment.create({
            userId,
            amount,
            type: 'withdrawal',
            method, // 'moncash', 'natcash', oswa labank
            accountNumber, // Nimewo telefòn oswa nimewo kont pou voye lajan an
            status: 'pending' // Sa ap rete 'pending' jiskaske admin an valide l epi voye lajan an tout bon
        });

        return res.status(200).json({
            success: true,
            message: "Demann retrè ou a anrejistre, l ap valide talè konsa.",
            balance: userWallet.balance,
            transaction: newWithdrawal
        });

    } catch (error) {
        console.error("Erè nan retrè:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm." });
    }
});

/**
 * @route   GET /api/payment/history
 * @desc    Wè tout istwa pèman yon itilizatè (Depo ak Retrè)
 * @access  Private
 */
router.get('/history', requireAuth, async (req, res) => {
    try {
        const history = await Payment.findAll({ 
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']] // Montre dènye tranzaksyon yo an premye
        });

        return res.status(200).json({ success: true, history });
    } catch (error) {
        console.error("Erè nan istwa pèman:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm." });
    }
});

module.exports = router;
