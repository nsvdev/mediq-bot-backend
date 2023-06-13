const DraftTherapy = require('../models/DraftTherapy');

exports.get = async (user_id) => {
    try {
        const therapy = await DraftTherapy.findOne({ user_id }).lean();
        return therapy;
    } catch (e) {
        return e;
    }
}

exports.create = async (_bo) => {
    try {
        const newTherapy = new DraftTherapy(_bo);
        const saved = await newTherapy.save();
        return saved;
    } catch (e) {
        return e;
    }
}

exports.exists = async (user_id, drug_id) => {
    try {
        const therapy = await DraftTherapy.findOne({ user_id, 'drugs.drug_id': drug_id }).lean();
        if (therapy === null) {
            return false
        } else {
            return true
        }
    } catch (e) {
        return e;
    }
}

exports.flush = async (id) => {
    try {
        const flushed = await DraftTherapy.updateOne({ user_id: id }, {
            '$set': {
                drugs: []
            }
        });
        return flushed;
    } catch (e) {
        return e;
    }
}

exports.add = async (user, drug) => {
    try {

        if (!('drug_id' in drug)) { return 'Parameter "Drug" is not set' }
        const initial = await DraftTherapy.findOne({ user_id: user }).lean();


        if (initial === null) {
            //create therapy;
            const newTherapy = new DraftTherapy({
                user_id: user,
                drugs: [drug]
            });
            const saved = await newTherapy.save();
            return saved;

        } else {
            const added = await DraftTherapy.updateOne({ user_id: user }, {
                '$set': {
                    drugs: [...(initial.drugs === null ? [] : initial.drugs), drug],
                    last_modified: + new Date()
                }
            });
            return added;
        }
    } catch (e) {
        return e;
    }
}


exports.remove = async (user, drug) => {
    try {


        const initial = await DraftTherapy.findOne({ user_id: user }).lean();


        if (initial === null) {
            return false;
        } else {
            let updDrugs = initial.drugs.filter((_drug) => {
                return _drug.drug_id !== drug
            });

            console.log(drug, initial.drugs, updDrugs);
            const added = await DraftTherapy.updateOne({ user_id: user }, {
                '$set': {
                    drugs: updDrugs,
                }
            });
            return added;
        }
    } catch (e) {
        return e;
    }
}

