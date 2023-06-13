const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataProcessingPipeline = new Schema({
    //приходит ВСЯ модель на фронт. Но null если не заполнено.
    user_id: { type: Schema.ObjectId, require: true },
    processor: { type: String, require: true },
    last_modified: { type: Number, require: true },
    artifacts: {}
});

module.exports = mongoose.model('DataProcessingPipeline', DataProcessingPipeline)