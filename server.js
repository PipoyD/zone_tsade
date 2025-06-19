const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

require('dotenv').config();
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'supersecretstring',
  resave: false,
  saveUninitialized: true
}));

// MongoDB connection
console.log("🔍 URI de connexion Mongo :", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur de connexion MongoDB:", err));

// MODELE UTILISATEUR
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', userSchema);

// ROUTES
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// DASHBOARD avec vérification de session
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ENREGISTREMENT
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || username.length < 8 || !password || password.length < 8)
    return res.status(400).send("Identifiants invalides");

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

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).send("Identifiants invalides");

  req.session.user = user._id;
  res.redirect('/dashboard');
});

// DECONNEXION
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// SETUP admin initial
app.get('/setup', async (req, res) => {
  const exists = await User.findOne({});
  if (exists) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'setup.html'));
});

app.post('/setup', async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({});
  if (exists) return res.status(403).send("⚠️ Admin déjà créé");

  const hashedPassword = await bcrypt.hash(password, 10);
  await new User({ username, password: hashedPassword }).save();
  res.redirect('/login.html');
});

// LANCEMENT SERVEUR
app.listen(port, () => {
  console.log(`🚀 Serveur actif sur http://localhost:${port}`);
});
