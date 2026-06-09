const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-motDePasse');
      if (!req.user) return res.status(401).json({ message: 'Utilisateur non trouve' });
      next();
    } catch (error) {
      res.status(401).json({ message: 'Non autorise, token invalide' });
    }
  } else {
    res.status(401).json({ message: 'Non autorise, pas de token' });
  }
};

const autoriserRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acces refuse pour ce role' });
    }
    next();
  };
};

module.exports = { protect, autoriserRoles };
