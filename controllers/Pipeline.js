const DataProcessingPipeline = require('../models/Pipeline');


exports.add = async (user, processor, artifacts) => {
    try {
        let newProcessing = new DataProcessingPipeline({
            user_id: user,
            processor: processor,
            artifacts: artifacts,
            last_modified: + new Date()
        });
        let saved = await newProcessing.save();
        return {saved, newProcessing};
    } catch (e) {
        return e;
    }
}

exports.all = async () => {
    try {
        const data = await DataProcessingPipeline.find({}).lean();
        return data;
    } catch (e) {
        return e;
    }
}

exports.mine = async (user, processor) => {
    try {
        const data = await DataProcessingPipeline.find({ user_id: user, processor }).lean();
        return data;
    } catch (e) {
        return e;
    }
}

exports.mineSpecific = async (user, target) => {    
    try {
        const data = await DataProcessingPipeline.findOne({ user_id: user, _id: target }).lean();
        return data;
    } catch (e) {
        return e;
    }
}

exports.allNotDone = async (vendor) => {
    try {
        if (vendor === 'oxytech_lungsandspine') {
            const data = await DataProcessingPipeline.find({
                processor: vendor,
                $or: [
                    { 'artifacts.lungs.status': "CREATED" },
                    { 'artifacts.lungs.status': "IN_PROGRESS" },
                    { 'artifacts.spine.status': "CREATED" },
                    { 'artifacts.spine.status': "IN_PROGRESS" },
                ]
            }).lean();
            return data;
        } else {
            console.log(new Date(), 'unknown vendor requested', vendor);
            return false
        }
    } catch (e) {
        return e;
    }
}

exports.update = async (key, type, data) => {

    try {
        if (type === 'spine') {
            const upd = await DataProcessingPipeline.updateOne({ _id: key }, {
                '$set': {
                    'artifacts.spine': data
                }
            });
            return upd;
        } else if (type === 'lungs') {
            const upd = await DataProcessingPipeline.updateOne({ _id: key }, {
                '$set': {
                    'artifacts.lungs': data
                }
            });
            return upd;
        } else {
            return false
        }
    } catch (e) {
        return e;
    }
}