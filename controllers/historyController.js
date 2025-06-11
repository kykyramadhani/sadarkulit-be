const History = require('../models/history');

const createHistory = async (req, res) => {
  try {
    const { detectedDisease } = req.body;
    if (!detectedDisease) {
      return res.status(400).json({ message: 'detectedDisease wajib diisi' });
    }

    const history = new History({
      userId: req.user._id,
      detectedDisease,
    });

    await history.save();
    res.status(201).json(history);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const histories = await History.find({ userId: req.user._id }).sort({ dateChecked: -1 });
    res.json(histories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createHistory, getHistory }; 