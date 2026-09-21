const express = require('express');
const router = express.Router();
// Middleware pou verifye si itilizatè a konekte
const { requireAuth } = require('../middleware/authMiddleware'); 
// Enpòte modèl baz de done ou yo (Bet, Wallet, Match)
const { Bet, Wallet, Match } = require('../models'); 

/**
 * @route   POST /api/bets/place
 * @desc    Plase yon nouvo paryaj (Kreye yon biyè)
 * @access  Private (Moun konekte sèlman)
 */
router.post('/place', requireAuth, async (req, res) => {
    const { selections, totalOdds, stake } = req.body; 
    // selections dwe yon tablò konsa: [{ matchId: 1, option: 'Home', odds: 1.85 }]
    const userId = req.user.id;

    // 1. Validasyon sou done ki antre yo
    if (!stake || stake <= 0) {
        return res.status(400).json({ success: false, message: "Kantite lajan ou mise a pa valid." });
    }
    if (!selections || selections.length === 0) {
        return res.status(400).json({ success: false, message: "Ou dwe chwazi omwen yon match pou w parye." });
    }
    if (!totalOdds || totalOdds <= 1) {
        return res.status(400).json({ success: false, message: "Kòt total la pa valid." });
    }

    try {
        // 2. Verifye si itilizatè a gen bous ak ase lajan
        const userWallet = await Wallet.findOne({ where: { userId } });
        if (!userWallet || userWallet.balance < stake) {
            return res.status(400).json({ success: false, message: "Lajan sou bous ou a pa ase pou paryaj sa a." });
        }

        // 3. Kalkile benefis posib (Mise miltipliye pa Kòt la)
        const potentialWin = parseFloat(stake) * parseFloat(totalOdds);

        // 4. Kreye biyè a nan baz de done a
        const newBet = await Bet.create({
            userId,
            selections, // Sa ap sere kòm JSON nan baz de done w lan
            totalOdds,
            stake,
            potentialWin,
            status: 'pending' // Li rete 'pending' jiskaske match yo fini
        });

        // 5. Soustrè lajan an sou kont itilizatè a imedyatman
        userWallet.balance -= parseFloat(stake);
        await userWallet.save();

        return res.status(201).json({
            success: true,
            message: "Paryaj ou a fèt avèk siksè! Biyè ou anrejistre.",
            currentBalance: userWallet.balance,
            bet: newBet
        });

    } catch (error) {
        console.error("Erè lè moun lan ap parye:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

/**
 * @route   GET /api/bets/my-bets
 * @desc    Wè tout istwa paryaj (biyè) yon itilizatè
 * @access  Private
 */
router.get('/my-bets', requireAuth, async (req, res) => {
    try {
        const myBets = await Bet.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']] // Dènye biyè yo ap parèt an premye
        });

        return res.status(200).json({ success: true, count: myBets.length, bets: myBets });
    } catch (error) {
        console.error("Erè nan istwa paryaj:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

/**
 * @route   GET /api/bets/:id
 * @desc    Wè detay yon sèl biyè paryaj byen detaye
 * @access  Private
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const bet = await Bet.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!bet) {
            return res.status(404).json({ success: false, message: "Biyè sa a pa egziste nan sistèm nan." });
        }

        return res.status(200).json({ success: true, bet });
    } catch (error) {
        console.error("Erè nan detay biyè a:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

/**
 * @route   POST /api/bets/settle/:id
 * @desc    Mete rezilta yon biyè (Ganyen oswa Pèdi) epi peye si l ganyen (Pouvwa Admin oswa Sistèm Otomatik)
 * @access  Private/Admin (Ou ka ajoute middleware pou admin)
 */
router.post('/settle/:id', async (req, res) => {
    const betId = req.params.id;
    const { finalStatus } = req.body; // finalStatus dwe: 'won' oswa 'lost'

    if (!['won', 'lost'].includes(finalStatus)) {
        return res.status(400).json({ success: false, message: "Status la dwe 'won' oswa 'lost'." });
    }

    try {
        // Tcheke si biyè a egziste epi si l te nan eta 'pending' toujou
        const bet = await Bet.findByPk(betId);
        if (!bet) {
            return res.status(404).json({ success: false, message: "Biyè sa a pa egziste." });
        }
        if (bet.status !== 'pending') {
            return res.status(400).json({ success: false, message: "Biyè sa a te trete deja." });
        }

        // Chanje status biyè a
        bet.status = finalStatus;
        await bet.save();

        // Si itilizatè a GENYEN biyè a, n ap mete lajan an sou bous li otomatikman
        if (finalStatus === 'won') {
            const userWallet = await Wallet.findOne({ where: { userId: bet.userId } });
            if (userWallet) {
                userWallet.balance += parseFloat(bet.potentialWin);
                await userWallet.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: `Biyè a trete avèk siksè kòm: ${finalStatus.toUpperCase()}`,
            bet
        });

    } catch (error) {
        console.error("Erè nan kalkil rezilta biyè:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

module.exports = router;
