const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    name_o: {
        first_name: { type: String, require: true },
        last_name: { type: String, require: true },
        username: {type: String, require: true},
        is_premium: {type: Boolean, require: true}
    },
    otp: {type: String, require: true},
    tg_id: {type: Number, require: true },
    super: {
        is_admin: {type: Boolean, require: true}
    }
});

module.exports = mongoose.model('User', User)