const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const faqSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  translations: {
    hi: {
      question: String,
      answer: String,
    },
    bn: {
      question: String,
      answer: String,
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Faq", faqSchema);
