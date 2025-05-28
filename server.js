require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');   
const app = express();

const User = require('./models/user');
const History = require('./models/history');

// Aktifkan CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Koneksi ke MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Terhubung ke MongoDB Atlas"))
  .catch(err => console.error("❌ Gagal koneksi ke MongoDB:", err));

// Route dasar
app.get('/', (req, res) => {
  res.send('Halo dari SadarKulit Backend!');
});

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validasi input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    // Cek jika email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat user baru
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Buat JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    // Cek user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Buat JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Middleware untuk proteksi route
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Users endpoint (protected)
app.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// History endpoint (protected)
app.post('/history', authMiddleware, async (req, res) => {
  try {
    const history = new History({
      ...req.body,
      userId: req.user._id
    });
    await history.save();
    res.status(201).json(history);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/history', authMiddleware, async (req, res) => {
  try {
    const histories = await History.find({ userId: req.user._id });
    res.json(histories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Jalankan server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});