const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize app
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

  const newUser = new User({ username, password });
  await newUser.save();
  res.status(201).send("Utilisateur enregistré");
});

// CONNEXION
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (!user) {
    return res.status(401).send("Identifiants invalides");
  }

  res.redirect('/dashboard');
});

// LANCEMENT DU SERVEUR
app.listen(port, () => {
  console.log(`🚀 Serveur actif sur http://localhost:${port}`);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    res.redirect('/dashboard.html'); // ✅ Redirection après succès
  } else {
    res.status(401).send('Identifiants invalides');
  }
});
