const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SearchHistory = new Schema({
    user_id: { type: Schema.ObjectId, require: true },
    history: []
});

module.exports = mongoose.model('SearchHistory', SearchHistory)