// server.js (PARYAJ SERYE BACKEND POU GITHUB / RENDER)
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const paymentRoutes = require('./routes/payment');
const sportsRoutes = require('./routes/sports');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);       
app.use('/api/wallet', walletRoutes);   
app.use('/api/payment', paymentRoutes); 
app.use('/api/sports', sportsRoutes);   
app.use('/api/admin', adminRoutes);     

// Render ap ba nou pò a otomatikman nan process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🔥  SISTÈM [ PARYAJ SERYE ] AP KOURI SOU PÒ ${PORT}  🔥`);
    console.log(`==================================================`);
});
