const Post = require('../models/Post');

exports.create = async (text, title, active = true) => {
    try {
        let newPost = new Post({
            active, text, title,
            created: + new Date()
        });
        let saved = await newPost.save();
        return saved;
    } catch (e) {
        return e;
    }
}

exports.getFeed = async (user_id) => {
    try {
        if (user_id === undefined || user_id == null) {return false}

        let userFeed = await Post.find({'displayed.user_id': {$ne: user_id}, active: true}).lean();
        
        return userFeed.map((p) => {
            let {text, title, created, _id} = p;
            return {text, title, created, _id};
        });
    } catch (e) {
        return e;
    }
}

exports.watched = async (user_id, post_id) => {
    try {
        if (user_id === undefined || user_id == null) { return false }
        if (post_id === undefined || post_id == null) { return false }

        //fraud check.
        let targetPost = await Post.findOne({_id: post_id}).lean();
        let el = 0;


        for (let view of targetPost.displayed) {
            if (''+view.user_id === ''+user_id) {
                el = el + 1;
            } 
        }

        if (el > 0 ){
            return "Вы не можете просмотреть пост который уже видели.";
        }




        let updated = await Post.updateOne({_id: post_id}, {
            $push: { displayed: {
                user_id: user_id,
                when: + new Date()
            }}
        }); 


        console.log(`[${new Date()}]: User ${user_id} watched post ${post_id} (${targetPost.title})`);
        return updated;
    
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

