const SearchHistory = require('../models/SearchHistory');

exports.add = async (user, drug) => {
    try {

        const { id, name, quality } = drug;
        console.log(`[${new Date()}] User ${user} поискал препарат: ${id} / ${name} / ${quality}`);
        if (id === undefined) { return 'one or more parameters are not set' }
        if (name === undefined) { return 'one or more parameters are not set' }
        if (quality === undefined) { return 'one or more parameters are not set' }


        let exists = await SearchHistory.findOne({ user_id: user }).lean();

        if (exists !== null) {
            const updated = await SearchHistory.updateOne({ user_id: user }, {
                $push: {
                    history: { id, name, quality, date: + new Date() }
                }
            });

            return updated;

        } else {
            let newHistoryEntry = { id, name, quality, date: + new Date() }
            let registerHistory = new SearchHistory({
                user_id: user,
                history: [newHistoryEntry]
            });
            let saved = await registerHistory.save();
            return [newHistoryEntry];
        }
    } catch (e) {
        return e;
    }
}

exports.hist = async (user, count) => {
    try {

        const _history = await SearchHistory.findOne({ user_id: user }).lean();
        if (_history === null) {return []};
        console.log(_history);
        const history = Array.from(_history.history);
        if (history.length > 0) {

            const retMap = new Map();
            for (let entry of history) {
                let mapEntry = retMap.get(""+entry.id);

                if (mapEntry === undefined) {
                    retMap.set(""+entry.id, {
                        ...entry,
                        qty: 1
                    });
                }else{
                    retMap.set(""+entry.id, {
                        ...mapEntry,
                        qty: mapEntry.qty + 1
                    });
                }
            }

            if (retMap.size >= count) {
                console.log("AA2", Array.from(retMap.values()));
                return Array.from(retMap.values()).reverse().slice(0, count-1);
            }else{
                console.log("AA", Array.from(retMap.values()));
                return Array.from(retMap.values()).reverse();
            }

        }else{
            return [];
        }
            
    } catch (e) {
        return e;
    }
}