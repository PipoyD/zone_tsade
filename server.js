const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cors = require('cors');

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

// Middlewares
app.use(express.static(__dirname));
app.use(express.json());
app.use(cors());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));

// MODELE UTILISATEUR
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Route de login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "Identifiant incorrect" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Mot de passe incorrect" });

  res.json({ success: true, role: user.role });
});

// Route pour créer un admin (exécuter UNE fois)
app.post('/api/create-admin', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hash, role: 'admin' });
    res.json({ message: "Admin créé", user });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la création", details: err.message });
  }
});

// Démarrage
app.listen(port, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
});
