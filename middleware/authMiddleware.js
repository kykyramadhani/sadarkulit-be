const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Mencapai authMiddleware');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('Tidak ada token yang diberikan');
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }
    console.log('Token:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token terverifikasi:', decoded);

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User tidak ditemukan untuk userId:', decoded.userId);
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    req.user = user;
    console.log('User terautentikasi:', user._id);
    next();
  } catch (error) {
    console.log('Error di authMiddleware:', error.message);
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

module.exports = authMiddleware;