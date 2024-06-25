const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    UserId: { type: String, required: true },
    ProId: { type: String, required: true },
    Username: { type: String, required: true },
    reviewText: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    verifiedBuyer: { type: Boolean, default: false } // Add a boolean field for verified buyer
});

module.exports = mongoose.model('Review', reviewSchema);
