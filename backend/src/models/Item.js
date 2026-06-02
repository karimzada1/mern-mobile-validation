const mongoose = require('mongoose');

const mobileDetailsSchema = new mongoose.Schema(
  {
    countryCode: String,
    countryName: String,
    operatorName: String,
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    mobileNumber: { type: String, default: null },
    mobileDetails: { type: mobileDetailsSchema, default: null },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
