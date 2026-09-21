require('dotenv').config(); // Pou chaje varyab anviwònman yo (.env)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Enpòte koneksyon baz de done a (Sequelize oswa Mongoose selon sa w ap itilize)
const { sequelize } = require('./models'); 

// Enpòte tout fichye rout yo
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const betRoutes = require('./routes/bets');
const matchRoutes = require('./routes/matches');

const app = express();

// ==========================================
// 1. MIDDLEWARES PRENSIPAL YO
// ==========================================
app.use(helmet()); // Pou sekirize header HTTP yo
app.use(cors()); // Pou pèmèt Frontend la konekte sou API a san pwoblèm CORS
app.use(express.json()); // Pou sèvè a ka li done ki vini an fòma JSON (req.body)
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. DEKLARASYON ROUT API YO
// ==========================================
app.use('/api/auth', authRoutes);         // Pou enskripsyon ak koneksyon
app.use('/api/payment', paymentRoutes);   // Pou depo ak retrè lajan
app.use('/api/bets', betRoutes);          // Pou mete paryaj ak wè biyè
app.use('/api/matches', matchRoutes);      // Pou wè ak jere match yo

// Rout tès pou verifye si sèvè a ap mache byen
app.get('/', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: "Byenveni sou API sit Paryaj ou a! Sèvè a ap fonksyone nòmalman." 
    });
});

// ==========================================
// 3. JESTYON ERÈ (404 Not Found)
// ==========================================
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Rout sa a pa egziste nan sistèm nan." });
});

// ==========================================
// 4. DEMARAGE SÈVÈ A AK BAZ DE DONE A
// ==========================================
const PORT = process.env.PORT || 5000;

// Fonksyon pou konekte baz de done a epi limen sèvè a
const startServer = async () => {
    try {
        // Verifye koneksyon ak baz de done a epi senkronize tab yo
        // Si w ap itilize MongoDB/Mongoose, ranplase sa ak: await mongoose.connect(process.env.MONGO_URI)
        await sequelize.authenticate();
        console.log('✅ Koneksyon ak baz de done a fèt avèk siksè.');
        
        // altènativ: await sequelize.sync({ force: false }) pou kreye tab yo si yo pa egziste
        await sequelize.sync(); 
        console.log('✅ Tout modèl yo senkronize ak baz de done a.');

        // Limen sèvè Node.js la
        app.listen(PORT, () => {
            console.log(`🚀 Sèvè a ap kouri sou pò ${PORT} -> http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Erè fatal: Sèvè a pa ka demare paske:', error.message);
        process.exit(1); // Kanpe pwosesis la si baz de done a pa mache
    }
};

startServer();
