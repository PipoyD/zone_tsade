const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Sert tous les fichiers statiques du dossier courant
app.use(express.static(__dirname));

// Route par défaut : envoie register.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Démarre le serveur
app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
