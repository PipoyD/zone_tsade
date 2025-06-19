const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connecté à MongoDB");
}).catch((err) => {
  console.error("❌ Erreur de connexion MongoDB:", err);
});

// MODELE UTILISATEUR
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', userSchema);

// ROUTES
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ENREGISTREMENT
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Champs requis");

  const userExists = await User.findOne({ username });
  if (userExists) return res.status(409).send("Utilisateur existant");

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();
  res.status(201).send("Utilisateur enregistré");
});

// CONNEXION
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(401).send("Identifiants invalides");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).send("Identifiants invalides");

  res.redirect('/dashboard');
});

// LANCEMENT DU SERVEUR
app.listen(port, () => {
  console.log(`🚀 Serveur actif sur http://localhost:${port}`);
});

const bcrypt = require('bcrypt');

// Vérifie s'il y a déjà un admin
async function checkAdminExists() {
  const count = await User.countDocuments();
  return count > 0;
}

// ROUTE GET SETUP
app.get('/setup', async (req, res) => {
  if (await checkAdminExists()) {
    return res.redirect('/login.html'); // Empêche l'accès si un user existe
  }
  res.sendFile(path.join(__dirname, 'setup.html'));
});

// ROUTE POST SETUP
app.post('/setup', async (req, res) => {
  const { username, password } = req.body;
  if (await checkAdminExists()) {
    return res.status(403).send("Administrateur déjà créé");
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = new User({ username, password: hashed });
  await admin.save();
  console.log("✅ Administrateur créé");
  res.redirect('/login.html');
});
