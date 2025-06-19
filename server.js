const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// Sert les fichiers statiques du dossier "public"
app.use(express.static(path.join(__dirname, 'register.html')));

// Lancement du serveur
app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
