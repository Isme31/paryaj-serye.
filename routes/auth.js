// routes/auth.js
const express = require('express');
const router = express.Router();

let itilizatèYo = {
    "admin@paryaj.com": { id: "user_000", non: "Admin Prensipal", modpas: "admin123", rol: "admin" },
    "jwè1@gmail.com": { id: "user_123", non: "Jean Pierre", modpas: "parye2026", rol: "jwè" }
};

// 1. ENSKRIPSYON
router.post('/register', (req, res) => {
    const { non, email, modpas } = req.body;
    if (!non || !email || !modpas) return res.status(400).json({ error: "Tanpri ranpli tout chan yo" });
    if (itilizatèYo[email]) return res.status(400).json({ error: "Imel sa a gen yon kont sou sit la deja" });

    const nouvoId = "user_" + Math.floor(1000 + Math.random() * 9000);
    itilizatèYo[email] = { id: nouvoId, non, modpas, rol: "jwè" };
    res.json({ status: "Kont ou an kreye avèk siksè!", user: { id: nouvoId, non, email, rol: "jwè" } });
});

// 2. KONEKSYON
router.post('/login', (req, res) => {
    const { email, modpas } = req.body;
    const user = itilizatèYo[email];
    if (!user || user.modpas !== modpas) return res.status(401).json({ error: "Imel oswa modpas la pa bon" });
    res.json({ status: "Ou konekte avèk siksè!", user: { id: user.id, non: user.non, email, rol: user.rol } });
});

module.exports = router;
