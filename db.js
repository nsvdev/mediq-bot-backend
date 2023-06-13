const mongoose = require('mongoose');


const MONGO_USERNAME = 'mediq';
const MONGO_PASSWORD = '88c04f3886b20a299db4d536423f3a07fe0a9d52dede6b698dda31876d85a86eba415f6e21ce97e57a86003c90bb8fa20580f53f735016bfa111596aa25e50a0';
const MONGO_HOSTNAME = '127.0.0.1';
const MONGO_PORT = '27017';
const MONGO_DB = 'mediq-bot';

const MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

let connections = mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


module.exports = connections;