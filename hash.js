// hash.js
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'tonMotDePasseIci'; // Remplace par le mot de passe souhaité
  const hash = await bcrypt.hash(password, 10);
  console.log("Mot de passe haché :", hash);
}

generateHash();
