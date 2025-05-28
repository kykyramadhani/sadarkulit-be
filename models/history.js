const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageURL: { type: String, required: true },
  detectedDisease: { type: String, required: true },
  dateChecked: { type: Date, default: Date.now },
  notes: { type: String }
});

module.exports = mongoose.model('History', historySchema);
