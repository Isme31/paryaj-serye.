// routes/wallet.js
const express = require('express');
const router = express.Router();

let jwèBous = {
    "user_123": { balans: 250.00, deviz: "HTG" }
};

// 1. Tcheke balans jwè a
router.get('/balance/:userId', (req, res) => {
    const { userId } = req.params;
    if (!jwèBous[userId]) return res.status(404).json({ error: "Jwè a pa egziste" });
    
    res.json({ userId, balans: jwèBous[userId].balans });
});

// 2. Dedwi kòb lè moun nan fè yon paryaj
router.post('/bet', (req, res) => {
    const { userId, kantiteParyaj } = req.body;
    
    if (!jwèBous[userId] || jwèBous[userId].balans < kantiteParyaj) {
        return res.status(400).json({ error: "Kòb nan bous la pa ase pou w parye" });
    }
    
    jwèBous[userId].balans -= kantiteParyaj;
    
    res.json({ 
        status: "Paryaj aksepte", 
        nouvoBalans: jwèBous[userId].balans 
    });
});

module.exports = router;
