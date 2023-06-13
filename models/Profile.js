const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Profile = new Schema({
    //приходит ВСЯ модель на фронт. Но null если не заполнено.
    user_id: { type: Schema.ObjectId, require: true },
    meta: {
        fio: { type: String, require: true },
        phone: { type: String, require: true },
        email: { type: String, require: true },
        sendNotifications: { type: Boolean, require: true },
    },
    physical: {
        gender: { type: Number, require: true }, //0 - не указано, 1 - муж, 2 - жен  
        birthdate: { type: String, require: true }, //формат: 2020-10-30,
        weight: { type: Number, require: true }, //10 = 10kg
        height: { type: Number, require: true },
    },
    last_modified: { type: Number, require: true }
});

module.exports = mongoose.model('Profile', Profile)