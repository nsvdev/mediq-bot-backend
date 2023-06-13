const Profile = require('../models/Profile');

exports.create = async (_bo) => {
    try {
        let newProfile = new Profile(_bo);
        let saved = await newProfile.save();
        return saved;
    } catch (e) {
        return e;
    }
}

exports.delete = async (id) => {
    try {
        let deleted = await Profile.deleteOne({ user_id: id });
        return deleted;
    } catch (e) {
        return e;
    }
}

exports.deleteByMongoID = async (id) => {
    try {
        let deleted = await Profile.deleteOne({ _id: id });
        return deleted;
    } catch (e) {
        return e;
    }
}

exports.get = async (user_id) => {
    try {
        let got = await Profile.findOne({ user_id: user_id });
        return got;
    } catch (e) {
        return e;
    }
}

exports.updateMeta = async (user, updp) => {
    try {

        if (updp === undefined) { return 'updp is not defined for scope action'}
        const { fio, phone, email, sendNotifications } = updp;
        if (fio === undefined) { return 'fio parameter in undefined'}
        if (phone === undefined) { return 'phone parameter in undefined' }
        if (email === undefined) { return 'email parameter in undefined' }
        if (sendNotifications === undefined) { return 'sendNotifications parameter in undefined' }
        if (user === undefined) { return 'User is not defined for scope action' }

        const targetProfile = await Profile.findOne({ user_id: user }).lean();


        

        if (targetProfile === null) {
            return false;
        } else {

            const updatedMeta = await Profile.updateOne({ user_id: user }, {
                '$set': {
                    meta: {
                        fio, phone, email, sendNotifications
                    },
                    last_modified: + new Date()
                }
            });
            return updatedMeta;
        }
    } catch (e) {
        return e;
    }

}

exports.updatePhysical = async (user, updp) => {

    try {

        if (updp === undefined) { return 'updp is not defined for scope action' }
        const { gender, birthdate, weight, height } = updp;
        if (gender === undefined) { return 'gender parameter in undefined' }
        if (birthdate === undefined) { return 'birthdate parameter in undefined' }
        if (weight === undefined) { return 'weight parameter in undefined' }
        if (height === undefined) { return 'height parameter in undefined' }
        if (user === undefined) { return 'User is not defined for scope action' }

        const targetProfile = await Profile.findOne({ user_id: user }).lean();


        if (targetProfile === null) {
            return false;
        } else {

            const updatedPhysical = await Profile.updateOne({ user_id: user }, {
                '$set': {
                    physical: {
                        gender, birthdate, weight, height
                    },
                    last_modified: + new Date()
                }
            });
            return updatedPhysical;
        }
    } catch (e) {
        return e;
    }


}

