const TherapyModel = require('../models/Therapy');
const DraftTherapyModel = require('../models/DraftTherapy');

exports.get = async (user_id) => {
    try {
        const therapy = await TherapyModel.findOne({ user_id }).lean();
        return therapy;
    } catch (e) {
        return e;
    }
}

exports.exists = async (user_id, drug_id) => {
    try {
        const therapy = await TherapyModel.findOne({ user_id, 'drugs.drug_id': drug_id }).lean();
        // console.log('THER:', therapy);
        if (therapy === null) {
            return false
        } else {
            return true
        }
    } catch (e) {
        return e;
    }
}

exports.create = async (_bo) => {
    try {
        const newTherapy = new TherapyModel(_bo);
        const saved = await newTherapy.save();
        return saved;
    } catch (e) {
        return e;
    }
}

exports.flush = async (id) => {
    try {
        const flushed = await TherapyModel.updateOne({ user_id: id }, {'$set': {
            drugs: []
        }});
        return flushed;
    } catch (e) {
        return e;
    }
}

exports.add = async (user, drug) => {
    try {

        if (!('drug_id' in drug)) { return 'Parameter "Drug" is not set' }
        if (!('date_start' in drug)) { return 'Parameter "date_start" is not set'}
        if (!('period' in drug)) { return 'Parameter "period" is not set'}
        if (!('date_end' in drug)) { return 'Parameter "date_end" is not set'}
        if (!('times' in drug)) { return 'Parameter "times" is not set'}
        if (!('withmeal' in drug)) { return 'Parameter "withmeal" is not set' }
        // if (!('medicationTime' in drug)) { return 'Parameter "medicationTime" is not set' }
        if (!('rememberStart' in drug)) { return 'Parameter "rememberStart" is not set' }

        const initial = await TherapyModel.findOne({user_id: user}).lean();


        const draftInitial = await DraftTherapyModel.findOne({ user_id: user }).lean();


        if (draftInitial !== null) {
            
            let drugsAfterDel = draftInitial.drugs.filter((_drug) => {
                return _drug.drug_id !== drug.drug_id
            });
            console.log('AFTER DEL:', drugsAfterDel, drug.drug_id);
            // console.log(drug, initial.drugs, updDrugs);
            const updDel = await DraftTherapyModel.updateOne({ user_id: user }, {
                '$set': {
                    drugs: drugsAfterDel,
                }
            });

            console.log('UPD DEL:', updDel);
        }


        if (initial === null) {
            //create therapy;
            const newTherapy = new TherapyModel({
                user_id: user,
                drugs: [drug]
            });
            const saved = await newTherapy.save();
            return saved;

        }else{
            const added = await TherapyModel.updateOne({ user_id: user }, {
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


        const initial = await TherapyModel.findOne({ user_id: user }).lean();


        if (initial === null) {
            return false;
        } else {
            let updDrugs = initial.drugs.filter((_drug) => {
                return _drug.drug_id !== drug
            });

            console.log(drug, initial.drugs, updDrugs);
            const added = await TherapyModel.updateOne({ user_id: user }, {
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

