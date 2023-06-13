const Favourites = require('../models/Favourites');

exports.add = async (user, drug) => {
    try {
        let liked = new Favourites({
            drug_id: drug,
            user_id: user,
            last_modified: + new Date()
        });
        let saved = await liked.save();
        return saved;
    } catch (e) {
        return e;
    }
}

exports.remove = async (user, drug) => {
    try {
        let deleted = await Favourites.deleteOne({ drug_id: drug, user_id: user });
        return deleted;
    } catch (e) {
        return e;
    }
}

exports.isFav = async (user, drug) => {
    try {
        let got = await Favourites.findOne({ drug_id: drug, user_id: user });
        return got;
    } catch (e) {
        return e;
    }
}

exports.mylikes = async (user) => {
    try {
        let got = await Favourites.find({ user_id: user });
        return got;
    } catch (e) {
        return e;
    }
}