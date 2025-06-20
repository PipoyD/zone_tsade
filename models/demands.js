const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  password: String,
  division: String,
  photoUrl: String, // Si tu enregistres les photos, sinon ignore
  statut: { type: String, default: 'en attente' } // "acceptée", "refusée"
});

module.exports = mongoose.model('Demande', demandeSchema);
