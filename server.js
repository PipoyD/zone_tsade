const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connecté à MongoDB"))
.catch(err => console.error("❌ Erreur MongoDB :", err));

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: { type: String, default: 'user' }
});

const User = mongoose.model('User', userSchema);

// Route GET pour formulaire d’inscription
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Route POST pour inscription
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).send('❌ Identifiant déjà utilisé.');

        const hashedPassword = await bcrypt.hash(password, 10);
        const isFirstUser = (await User.countDocuments()) === 0;

        const newUser = new User({
            username,
            password: hashedPassword,
            role: isFirstUser ? 'admin' : 'user'
        });

        await newUser.save();

        res.send(`✅ Utilisateur "${username}" créé. Rôle: ${newUser.role}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Erreur serveur.');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
});
