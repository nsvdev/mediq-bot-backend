const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Favourites = new Schema({
    //приходит ВСЯ модель на фронт. Но null если не заполнено.
    user_id: { type: Schema.ObjectId, require: true },
    drug_id: { type: String, require: true },
    last_modified: { type: Number, require: true }
});

module.exports = mongoose.model('Favourites', Favourites)