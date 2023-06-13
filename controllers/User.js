const UserModel = require('../models/User');

exports.list = async (tg_id) => {
    try {
        let user = await UserModel.findOne({ tg_id }).lean();
        if (user.super.is_admin) {
            let allUSers = await UserModel.find({}).lean();
            return allUSers;
        } else {
            return false;
        }
    } catch (e) {
        return e;
    }
}


exports.all = async () => {
    try {
        let allUSers = await UserModel.find({}).lean();
        return allUSers;
    } catch (e) {
        return e;
    }
}

exports.create = async (_bo) => {
    try {
        let newUser = new UserModel(_bo);
        let saved = await newUser.save();
        return saved;
    } catch (e) {
        return e;
    }
}

exports.grantAdmin = async (caller, target) => {
    try {
        let user = await UserModel.findOne({ tg_id }).lean();
        if (user.super.is_admin) {
            if (caller === target) { return false };
            let updated = await UserModel.findOneAndUpdate({ chat_id: caller }, { $set: { "super.is_admin": true } });
        } else {
            return false;
        }
    } catch (e) {
        return e;
    }
}

exports.delete = async (id) => {
    try {
        let deleted = await UserModel.deleteOne({ tg_id: id });
        return deleted;
    } catch (e) {
        return e;
    }
}

exports.deleteByMongoID = async (id) => {
    try {
        let deleted = await UserModel.deleteOne({ _id: id });
        return deleted;
    } catch (e) {
        return e;
    }
}

exports.verifyOTP = async (otp, tg_id) => {
    let user = await UserModel.findOne({ tg_id }).lean();
    if ('' + user.otp === '' + otp) {
        return user;
    } else {
        return false
    }
}

// TG
const TG_UserExists = async (tg_id) => {
    try {
        let user = await UserModel.find({ tg_id }).lean();
        return user.length === 1 ? user[0] : false;
    } catch (e) {
        console.log(`TG_UserExists`, e);
        return false;
    }
}

exports.checkExistance = async (id) => {
    try {
        let exist = await UserModel.findOne({ _id: id }).lean()
        if (exist) {
            return true
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

exports.getAll = async () => {
    try {
        const data = await UserModel.countDocuments({});
        console.log(data);
        return data;
    } catch (e) {
        console.log(e);
        return e;
    }
}

exports.tg = {
    userExists: TG_UserExists
}