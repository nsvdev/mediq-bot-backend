const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DraftTherapy = new Schema({
    //приходит ВСЯ модель на фронт. Но null если не заполнено.
    user_id: { type: Schema.ObjectId, require: true },
    drugs: [
        // {
        //     drug_id:,
        //     date-start: 02-12-2022,
        //     period: 1 (every), 2 (every second),
        //     forDays: 0-9999,
        //     times:  1-5,
        //     withmeal: 0 (до), 1 (во время), 2 (после), 3 (пофиг),
        //     notify: true / false
        // }    
    ],
    last_modified: { type: Number, require: true }
});

module.exports = mongoose.model('DraftTherapy', DraftTherapy)