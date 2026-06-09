const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'directeur', 'enseignant', 'comptable'],
    default: 'enseignant'
  },
  telephone: { type: String },
  photo: { type: String },
  actif: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});

userSchema.methods.comparerMotDePasse = async function (motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse);
};

module.exports = mongoose.model('User', userSchema);
