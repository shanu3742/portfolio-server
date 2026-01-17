const mongoose = require("mongoose");

const portfolioStatus = new mongoose.Schema({
  status: {
    type: String,
    default: "In-active",
  },
});

exports.PORTFOLIO_STATUS = mongoose.model("Status", portfolioStatus);
