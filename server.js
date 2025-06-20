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

// MODELES
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const demandeSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  password: String,
  departement: String,
  photo: String,
  status: { type: String, default: "en_attente" }
});
const User = mongoose.model('User', userSchema);
const Demande = mongoose.model('Demande', demandeSchema);

// ROUTES
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});
app.get('/demandes', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'demandes.html'));
});

// ENREGISTREMENT => Crée une demande
app.post('/register', async (req, res) => {
  const { fullname, username, password, departement, photo } = req.body;
  if (!username || username.length < 8 || !password || password.length < 8 || !fullname || fullname.length < 5)
    return res.status(400).send("Champs invalides");

  const demandeExistante = await Demande.findOne({ username });
  if (demandeExistante) return res.status(409).send("Demande déjà soumise");

  await new Demande({ fullname, username, password, departement, photo }).save();
  res.status(201).send("Demande envoyée");
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

// API DEMANDES
app.get('/api/demandes', async (req, res) => {
  const demandes = await Demande.find({ status: "en_attente" });
  res.json(demandes);
});

app.post('/api/demandes/:id/accepter', async (req, res) => {
  const d = await Demande.findById(req.params.id);
  if (!d) return res.status(404).send("Introuvable");
  const hashed = await bcrypt.hash(d.password, 10);
  await new User({ username: d.username, password: hashed }).save();
  d.status = "acceptee";
  await d.save();
  res.sendStatus(200);
});

app.post('/api/demandes/:id/refuser', async (req, res) => {
  await Demande.findByIdAndUpdate(req.params.id, { status: "refusee" });
  res.sendStatus(200);
});

// LANCEMENT SERVEUR
app.listen(port, () => {
  console.log(`🚀 Serveur actif sur http://localhost:${port}`);
});
