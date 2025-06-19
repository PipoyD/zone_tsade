const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080; // important pour Railway

// Sert tous les fichiers statiques dans le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Redirige la racine vers register.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Lance le serveur
app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
