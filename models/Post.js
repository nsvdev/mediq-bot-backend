const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Post = new Schema({
    displayed: [], //array of users that seen the notification post
    active: { type: Boolean, require: true, default: true },
    text: {type: String, require: true},
    title: {type: String, require: true},
    created: {type: Number, require: true}
});

module.exports = mongoose.model('Post', Post)