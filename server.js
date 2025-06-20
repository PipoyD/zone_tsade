const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

require('dotenv').config();
const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'supersecretstring',
  resave: false,
  saveUninitialized: true
}));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// SCHEMAS
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', userSchema);

const demandeSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  password: String,
  departement: String,
  photo: String,
  date: { type: Date, default: Date.now }
});
const Demande = mongoose.model('Demande', demandeSchema);

// ROUTES
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.post('/register', async (req, res) => {
  const { fullname, username, password, departement, photo } = req.body;
  if (!fullname || !username || !password || !departement) return res.status(400).send("Champs requis");

  const demande = new Demande({ fullname, username, password, departement, photo });
  await demande.save();

  res.send(`<html><head><title>Confirmation</title></head><body><h1>Demande envoyée !</h1><p>Votre demande a été enregistrée avec le numéro #${demande._id}</p><a href="/">Retour</a></body></html>`);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).send("Identifiants invalides");
  req.session.user = user._id;
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

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

app.get('/demandes', async (req, res) => {
  const demandes = await Demande.find({});
  let html = `<html><head><meta charset="UTF-8"><title>Demandes</title><link rel="stylesheet" href="style.css"></head><body><div class="card"><h1>Demandes en attente</h1><ul style="list-style:none;padding:0;">`;

  demandes.forEach(d => {
    html += `
    <li style="margin-bottom:2rem;border:1px solid #333;padding:1rem;border-radius:8px;">
      <strong>Demande #${d._id}</strong><br>
      Nom : ${d.fullname}<br>
      Identifiant : ${d.username}<br>
      Département : ${d.departement}<br>
      ${d.photo ? `<img src="${d.photo}" alt="Photo" style="max-height:100px;margin-top:0.5rem;"><br>` : ''}
      <form method="POST" action="/accepter" style="display:inline;">
        <input type="hidden" name="id" value="${d._id}">
        <button type="submit" class="btn continue">Accepter</button>
      </form>
      <form method="POST" action="/refuser" style="display:inline;">
        <input type="hidden" name="id" value="${d._id}">
        <button type="submit" class="btn back">Refuser</button>
      </form>
    </li>`;
  });

  html += `</ul><a href="/dashboard" class="btn back">Retour</a></div></body></html>`;
  res.send(html);
});

app.post('/accepter', async (req, res) => {
  const demande = await Demande.findById(req.body.id);
  if (!demande) return res.status(404).send("Introuvable");

  const hashedPassword = await bcrypt.hash(demande.password, 10);
  await new User({ username: demande.username, password: hashedPassword }).save();
  await Demande.findByIdAndDelete(req.body.id);

  res.redirect('/demandes');
});

app.post('/refuser', async (req, res) => {
  await Demande.findByIdAndDelete(req.body.id);
  res.redirect('/demandes');
});

app.listen(port, () => {
  console.log(`🚀 Serveur actif sur http://localhost:${port}`);
});
