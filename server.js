// test build
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  maxPoolSize: 10
})
  .then(() => console.log('✅ Terhubung ke MongoDB Atlas'))
  .catch(err => console.error('❌ Gagal koneksi ke MongoDB:', err));

app.get('/', (req, res) => {
  res.send('Halo dari SadarKulit Backend!');
});

// Gunakan routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/history', historyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});