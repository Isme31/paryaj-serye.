const express = require('express');
const router = express.Router();
// Enpòte modèl baz de done pou Match la
const { Match } = require('../models'); 
// Si w gen yon middleware pou verifye si moun nan se yon Admin
// const { requireAdmin } = require('../middleware/adminMiddleware');

/**
 * @route   GET /api/matches/live
 * @desc    Wè tout match ki disponib pou moun parye kounye a (Match ki poko kòmanse oswa k ap jwe)
 * @access  Public (Tout moun ka wè sa)
 */
router.get('/live', async (req, res) => {
    try {
        const liveMatches = await Match.findAll({
            where: { 
                status: 'open' // 'open' vle di match la disponib pou paryaj
            },
            order: [['matchTime', 'ASC']] // Montre match ki pi pre yo an premye
        });

        return res.status(200).json({ success: true, count: liveMatches.length, matches: liveMatches });
    } catch (error) {
        console.error("Erè lè n ap pran match yo:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

/**
 * @route   GET /api/matches/:id
 * @desc    Wè detay yon sèl match ak tout kòt li yo
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id);

        if (!match) {
            return res.status(404).json({ success: false, message: "Match sa a pa egziste." });
        }

        return res.status(200).json({ success: true, match });
    } catch (error) {
        console.error("Erè nan detay match la:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

/**
 * @route   POST /api/matches/create
 * @desc    Kreye yon nouvo match ak kòt li yo (Pou Admin)
 * @access  Private/Admin
 */
router.post('/create', async (req, res) => {
    const { homeTeam, awayTeam, league, matchTime, odds } = req.body;
    // odds dwe yon objè konsa: { homeWin: 1.85, draw: 3.40, awayWin: 4.20 }

    // 1. Validasyon senp
    if (!homeTeam || !awayTeam || !league || !matchTime || !odds) {
        return res.status(400).json({ success: false, message: "Tout enfòmasyon yo obligatwa pou kreye yon match." });
    }

    try {
        // 2. Anrejistre match la nan baz de done a
        const newMatch = await Match.create({
            homeTeam,
            awayTeam,
            league,
            matchTime, // Dat ak lè match la ap jwe
            odds, // Sere kòm JSON nan baz de done a
            status: 'open', // Li 'open' pou moun ka parye sou li otomatikman
            result: null // Poko gen rezilta
        });

        return res.status(201).json({
            success: true,
            message: "Match la kreye avèk siksè pou paryaj!",
            match: newMatch
        });
    } catch (error) {
        console.error("Erè lè Admin ap kreye match:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

/**
 * @route   PUT /api/matches/update-odds/:id
 * @desc    Modifye kòt yon match si yo chanje (Pou Admin)
 * @access  Private/Admin
 */
router.put('/update-odds/:id', async (req, res) => {
    const { odds, status } = req.body; // status ka 'open' oswa 'closed' (si match la kòmanse oswa bloke)

    try {
        const match = await Match.findByPk(req.params.id);
        if (!match) {
            return res.status(404).json({ success: false, message: "Match sa a pa egziste." });
        }

        // Mete enfòmasyon yo ajou si yo voye yo
        if (odds) match.odds = odds;
        if (status) match.status = status;

        await match.save();

        return res.status(200).json({ success: true, message: "Kòt match la mete ajou!", match });
    } catch (error) {
        console.error("Erè nan mizajou kòt:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

/**
 * @route   POST /api/matches/set-result/:id
 * @desc    Mete rezilta final yon match lè l fini (Pou Admin)
 * @access  Private/Admin
 */
router.post('/set-result/:id', async (req, res) => {
    const { homeScore, awayScore } = req.body;

    if (homeScore === undefined || awayScore === undefined) {
        return res.status(400).json({ success: false, message: "Ou dwe bay nòt pou tou de ekip yo." });
    }

    try {
        const match = await Match.findByPk(req.params.id);
        if (!match) {
            return res.status(404).json({ success: false, message: "Match sa a pa egziste." });
        }

        // Kalkile kisa ki fèt: Home (Ganyen lakay), Away (Ganyen deyò), oswa Draw (Nul)
        let finalOutcome = 'Draw';
        if (parseInt(homeScore) > parseInt(awayScore)) {
            finalOutcome = 'Home';
        } else if (parseInt(homeScore) < parseInt(awayScore)) {
            finalOutcome = 'Away';
        }

        // Mete match la ajou kòm 'finished'
        match.status = 'finished';
        match.result = {
            score: `${homeScore}-${awayScore}`,
            outcome: finalOutcome // 'Home', 'Away', oswa 'Draw'
        };

        await match.save();

        return res.status(200).json({ 
            success: true, 
            message: `Match la fini! Rezilta a se: ${finalOutcome}`, 
            match 
        });
    } catch (error) {
        console.error("Erè lè n ap mete rezilta match:", error);
        return res.status(500).json({ success: false, message: "Sèvè a gen yon pwoblèm teknik." });
    }
});

module.exports = router;
