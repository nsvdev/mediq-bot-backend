const https = require('https');
const express = require('express');
const JWTUtill = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('request');
const request_promise = require("request-promise");
const needle = require('needle');
const app = express();
const UserController = require('./controllers/User');
const ProfileController = require('./controllers/Profile');
const FavouritesController = require('./controllers/Favourites');
const TherapyController = require('./controllers/Therapy');
const DraftTherapyController = require('./controllers/DraftTherapy');
const PostsController = require('./controllers/Posts');
const SearchHistoryController = require('./controllers/SearchHistory');
const DataProcessingPipeline = require('./controllers/Pipeline');
const db = require('./db');
const TeleBot = require('telebot');
const MediqBot = new TeleBot('5760958921:AAFXQqQ8WQ2TNUCHwRuDTMqb6KLz4TbPSiE'); //unsafe as fuck... 
const DIALOG = require('./Dialog.js');
const fs = require('fs');
const crypto = require("crypto");
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const storage = multer.memoryStorage()
const _upload = multer({ storage: storage })

const JWT_SECRET = "8e50157a367dadefec0a72e45850157a36c1adefec0a7692371d2b73b5182a550157a365850";

//Check auth middleware express

let bootCheck = async () => {
    try {
        let allUsers = await UserController.all();
        console.log('Total users count:', allUsers.length);

        let _allUsers = await UserController.getAll();
        console.log('Total users count (2):', _allUsers);


        // for (let U of allUsers) {
        //     try {
        //         console.log(U);
        //         MediqBot.sendMessage(U.tg_id, 'Привет! Это Бот MedIQ.\nМы открываем публичное тестирование приложения. Пожалуйста, чтобы все прошло хорошо - перерегистрируйтесь в боте. Просто отправьте мне следующую команду в этом чате :)');
        //         setTimeout(() =>{
        // for (let _user of allUsers) {
        //     MediqBot.sendMessage(_user.tg_id, '/magic (нажмите на слово "magic" слева.)');
        // }
        //         }, 1000);
        //     }catch(e) {
        //         console.log(e);
        //     }
        // }

        const allProcessors = await DataProcessingPipeline.allNotDone("oxytech_lungsandspine");
        // console.log('To process:', allProcessors);
        for (let processor of allProcessors) {

            XrayPipeline.addListener('lungs', processor.artifacts.lungs, processor._id);
            XrayPipeline.addListener('spine', processor.artifacts.spine, processor._id);

            // console.log(processor);
        }

        const processors = await DataProcessingPipeline.all();
        for (let pr of processors) {
            // console.log(pr);
        }

    } catch (e) {
        console.log(e);
    }
}

bootCheck();

const isAuth = async (req, res, next) => {
    // console.log('hit middleware')
    try {

        const token = req.get('Authorization');
        if (token.includes('Bearer')) {
            const sliced = token.slice(7);
            const verifiedJWT = JWTUtill.verify(sliced, JWT_SECRET);
            req.jwt = {
                verified: verifiedJWT,
                token: sliced
            }

            let isExisting = await UserController.checkExistance(req.jwt.verified._id);
            if (isExisting) {
                // console.log(verifiedJWT)
                next();
            } else {
                console.log("Used old token. User don't exist.");
                res.sendStatus(401);
            }
        } else {
            console.log('Non-bearer auth header is present.')
            res.sendStatus(401);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(401);
    }

}



app.use(express.json());
app.use(require('helmet')());
app.use(express.static('static'));
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://mediq-bot.vercel.app',
        'https://mediq-clfe72fcw-nsvdev.vercel.app',
        'https://mediq-a56euv6et-nsvdev.vercel.app',
        'https://mediq-bot-git-new-back-nsvdev.vercel.app',
        'https://mediq-541v9fvl6-nsvdev.vercel.app',
    ]
}));


MediqBot.on('/start', async (msg, props) => {

    try {
        let userExists = await UserController.tg.userExists(msg.from.id);
        console.log(userExists);
        if (userExists) {
            return MediqBot.sendMessage(msg.from.id, DIALOG.WTF_REGISTERED_USER_REAUTH);
        } else {
            const OTP = crypto.randomBytes(24).toString('hex');
            // console.log(msg);
            let { first_name, last_name, username, is_premium } = msg.from;
            if (is_premium === undefined) {
                // console.log("Premium is undefined!");
                is_premium = false;
            }
            let userPassport = await UserController.create({
                tg_id: msg.from.id, name_o: {
                    first_name, last_name, username, is_premium
                },
                otp: OTP,
                super: {
                    is_admin: msg.from.id === 1384522833 ? true : false
                }
            })

            let profilePassport = await ProfileController.create({
                user_id: userPassport._id,
                meta: {
                    fio: first_name + ' ' + last_name,
                    phone: '',
                    email: '',
                    sendNotifications: true,
                },
                physical: {
                    gender: 0, //0 - не указано, 1 - муж, 2 - жен  
                    birthdate: '2022-12-01', //формат: 2020-10-30,
                    weight: 0, //10 = 10kg
                    height: 0,
                },
                last_modified: + new Date()
            })
            console.log({ userPassport, profilePassport });
            MediqBot.sendMessage(msg.from.id, DIALOG.NEW_USER_REGISTERED);
            setTimeout(() => {
                MediqBot.sendMessage(msg.from.id, `Скопируйте следующий уникальный код и вставьте его в приложении:`);
                MediqBot.sendMessage(msg.from.id, OTP);
            }, 500)
            return true;
        }
    } catch (e) {
        console.log(e);
    }
});

MediqBot.on('/magic', async (msg, prpos) => {
    try {
        let userExists = await UserController.tg.userExists(msg.from.id);
        // console.log(userExists);
        if (userExists) {
            let deleted = await UserController.delete(msg.from.id);
            // console.log(deleted)
            MediqBot.sendMessage(msg.from.id, `Запись о вас (#${msg.from.id}, @${msg.from.username}) удалена.`);

            const OTP = crypto.randomBytes(24).toString('hex');
            // console.log(msg);
            let { first_name, last_name, username, is_premium } = msg.from;
            if (is_premium === undefined) {
                // console.log("Premium is undefined!");
                is_premium = false;
            }
            let userPassport = await UserController.create({
                tg_id: msg.from.id, name_o: {
                    first_name, last_name, username, is_premium
                },
                otp: OTP,
                super: {
                    is_admin: msg.from.id === 1384522833 ? true : false
                }
            })

            let profilePassport = await ProfileController.create({
                user_id: userPassport._id,
                meta: {
                    fio: first_name + ' ' + last_name,
                    phone: '',
                    email: '',
                    sendNotifications: true,
                },
                physical: {
                    gender: 0, //0 - не указано, 1 - муж, 2 - жен  
                    birthdate: '2022-12-01', //формат: 2020-10-30,
                    weight: 0, //10 = 10kg
                    height: 0,
                },
                last_modified: + new Date()
            })
            // console.log({ userPassport, profilePassport });
            MediqBot.sendMessage(msg.from.id, DIALOG.NEW_USER_REGISTERED);
            setTimeout(() => {
                MediqBot.sendMessage(msg.from.id, `Скопируйте следующий уникальный код и вставьте его в приложении:`);
                MediqBot.sendMessage(msg.from.id, OTP);
            }, 500)
            return true;

        }
    } catch (e) {
        console.log(e);
    }
})


MediqBot.on('/UNSAFE_deleteme', async (msg, props) => {
    try {
        let userExists = await UserController.tg.userExists(msg.from.id);
        console.log(userExists);
        if (userExists) {
            let deleted = await UserController.delete(msg.from.id);
            console.log(deleted)
            return MediqBot.sendMessage(msg.from.id, `Запись о вас (#${msg.from.id}, @${msg.from.username}) удалена.`);
        }
    } catch (e) {
        console.log(e);
    }
});

MediqBot.on('/admin_list', async (msg, props) => {
    try {
        let users = await UserController.list(msg.from.id);
        let messages = [];
        if (users.length > 100) {

        } else {
            for (let person of users) {
                console.log(person.name_o);
                messages.push(`${person.name_o.first_name} ${person.name_o.last_name} @${person.name_o.username}`);
            }
        }

        return MediqBot.sendMessage(msg.from.id, `Пользователи: \n ${messages.concat('\n')}`);
        console.log("USERS:", users);
    } catch (e) {
        console.log(e);
    }
});


app.post('/login', async (req, res) => {
    try {

        let { otp, tg_id } = req.body
        console.log(req.body);
        let verified = await UserController.verifyOTP(otp, tg_id);
        if (verified) {
            let JWT = JWTUtill.sign(verified, JWT_SECRET);
            // console.log(verified);
            res.send({ user: verified, jwt: JWT });
        } else {
            console.log(`OTP ${otp} for TG_ID ${tg_id} is not valid!`);
            res.sendStatus(401);
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(500);
    }
});

app.get('/me', isAuth, async (req, res) => {
    try {
        let transformed = {
            ...req.jwt.verified,
            name_o: { ...req.jwt.verified.name_o, display: req.jwt.verified.name_o.first_name + ' ' + req.jwt.verified.name_o.last_name }
        }

        console.log(transformed._id)

        let targetProfile = await ProfileController.get(transformed._id);

        transformed = {
            ...transformed,
            profile: targetProfile
        }

        res.send(transformed);
    } catch (e) {
        console.log(e)
        res.sendStatus(401);
    }
})

app.post('/me/meta', isAuth, async (req, res) => {

    try {

        let { fio, phone, email, sendNotifications } = req.body

        if (fio === undefined) { res.sendStatus(400); }
        if (phone === undefined) { res.sendStatus(400); }
        if (email === undefined) { res.sendStatus(400); }
        if (sendNotifications === undefined) { res.sendStatus(400); }

        let updated = await ProfileController.updateMeta(req.jwt.verified._id, {
            fio, phone, email, sendNotifications
        })

        res.send(updated);

    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }


})

app.post('/me/physical', isAuth, async (req, res) => {

    try {

        // let { fio, phone, email, sendNotifications } = req.body
        const { gender, birthdate, weight, height } = req.body;

        if (gender === undefined) { res.sendStatus(400); }
        if (birthdate === undefined) { res.sendStatus(400); }
        if (weight === undefined) { res.sendStatus(400); }
        if (height === undefined) { res.sendStatus(400); }

        let updated = await ProfileController.updatePhysical(req.jwt.verified._id, {
            gender, birthdate, weight, height
        })

        res.send(updated);

    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }


})

app.get('/likes', isAuth, async (req, res) => {
    try {
        let likes = await FavouritesController.mylikes(req.jwt.verified._id);
        console.log('Likes:', likes)
        res.send(likes.map((l) => l.drug_id));
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.get('/likes/like', isAuth, async (req, res) => {
    try {
        let drugId = req.query.drugId;
        let isLiked = await FavouritesController.isFav(req.jwt.verified._id, drugId);
        console.log(isLiked)
        let likeStatus = false;
        if (isLiked === null) {
            await FavouritesController.add(req.jwt.verified._id, drugId);
            likeStatus = true;
        } else {
            await FavouritesController.remove(req.jwt.verified._id, drugId);
            likeStatus = false;
        }
        res.send({ isLikedNow: likeStatus });
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.get('/likes/is_like', isAuth, async (req, res) => {
    try {
        let drugId = req.query.drugId;
        let isLiked = await FavouritesController.isFav(req.jwt.verified._id, drugId);
        res.send(isLiked === null ? false : true);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})


app.get('/therapy', isAuth, async (req, res) => {
    try {
        let therapy = await TherapyController.get(req.jwt.verified._id);
        console.log('Therapy:', therapy, req.jwt.verified)
        res.send(therapy === null ? { drugs: [], last_modified: + new Date() } : therapy);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.get('/draft-therapy', isAuth, async (req, res) => {
    try {
        let therapy = await DraftTherapyController.get(req.jwt.verified._id);
        console.log('DRAFT THERAPY:', therapy)
        res.send(therapy === null ? { drugs: [] } : therapy);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})



app.post('/therapy/add-drug', isAuth, async (req, res) => {
    try {
        console.log(`Add drug POST`, req.body);
        //medicationTime убрали 23.01.23
        let { drug_id, date_start, period, date_end, times, withmeal, rememberStart } = req.body;
        // if (!('drug_id' in drug)) { return 'Parameter "Drug" is not set' }
        // if (!('date_start' in drug)) { return 'Parameter "date_start" is not set' }
        // if (!('period' in drug)) { return 'Parameter "period" is not set' }
        // if (!('forDays' in drug)) { return 'Parameter "forDays" is not set' }
        // if (!('times' in drug)) { return 'Parameter "times" is not set' }
        // if (!('withmeal' in drug)) { return 'Parameter "withmeal" is not set' }

        // if (!('medicationTime' in drug)) { return 'Parameter "medicationTime" is not set' }
        // if (!('rememberStart' in drug)) { return 'Parameter "rememberStart" is not set' }


        //medicationTime убрали 23.01.23
        let added = await TherapyController.add(req.jwt.verified._id, {
            drug_id, date_start, period, date_end, times, withmeal, rememberStart
        });
        console.log('Added:', added)
        res.send(added);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.post('/draft-therapy/add-drug', isAuth, async (req, res) => {
    try {

        // if (!('drug_id' in drug)) { return 'Parameter "Drug" is not set' }
        // if (!('date_start' in drug)) { return 'Parameter "date_start" is not set' }
        // if (!('period' in drug)) { return 'Parameter "period" is not set' }
        // if (!('forDays' in drug)) { return 'Parameter "forDays" is not set' }
        // if (!('times' in drug)) { return 'Parameter "times" is not set' }
        // if (!('withmeal' in drug)) { return 'Parameter "withmeal" is not set' }

        let { drug_id } = req.body;

        let added = await DraftTherapyController.add(req.jwt.verified._id, {
            drug_id
        });
        console.log('Added:', added)
        res.send(added);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})


app.get('/therapy/remove-drug', isAuth, async (req, res) => {
    try {
        let removed = await TherapyController.remove(req.jwt.verified._id, req.query.drugId);
        console.log('removed:', removed)
        res.send(removed);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.get('/draft-therapy/remove-drug', isAuth, async (req, res) => {
    try {
        let removed = await DraftTherapyController.remove(req.jwt.verified._id, req.query.drugId);
        console.log('removed:', removed)
        res.send(removed);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.get('/therapy/short', isAuth, async (req, res) => {
    try {
        let therapy = await TherapyController.get(req.jwt.verified._id);
        console.log('Likes:', therapy)
        res.send(therapy === null ? [] : therapy.drugs.map((_d) => _d.drug_id));
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.get('/universal-therapy/is_in_therapy', isAuth, async (req, res) => {
    try {
        let therapy = await TherapyController.exists(req.jwt.verified._id, req.query.drugId);
        let draftTherapy = await DraftTherapyController.exists(req.jwt.verified._id, req.query.drugId);
        console.log({ therapy, draftTherapy });
        res.send({ therapy, draftTherapy });
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})



//posts
app.get('/news-feed', isAuth, async (req, res) => {
    try {
        let feed = await PostsController.getFeed(req.jwt.verified._id);
        res.send(feed);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.post('/news-feed/create', isAuth, async (req, res) => {
    try {

        let { text, title, active } = req.body;
        if (text === undefined || title === undefined || active === undefined) {
            res.send("One or more parameters are not set.");
        } else {
            let newPost = await PostsController.create(text, title, active);
            console.log(newPost)
            res.send(newPost);
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.get('/news-feed/watched', isAuth, async (req, res) => {
    try {
        let { id } = req.query;
        if (id === undefined) {
            res.send("One or more parameters are not set.");
        } else {
            let viewCounted = await PostsController.watched(req.jwt.verified._id, id);
            res.send(viewCounted);
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})



//search history
app.get('/search-history/register', isAuth, async (req, res) => {
    try {

        const { id, name, quality } = req.query;

        let added = await SearchHistoryController.add(req.jwt.verified._id, {
            id, name, quality
        });
        console.log(added);
        res.send(true);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})

app.get('/search-history/last-top', isAuth, async (req, res) => {
    try {
        let last_top = await SearchHistoryController.hist(req.jwt.verified._id, 4);
        console.log("last_top", last_top);
        res.send(last_top);
    } catch (e) {
        console.log(e)
        res.sendStatus(400);
    }
})






//old backend proxy
app.use('/med-service', isAuth, (req, res) => {
    if (req.method === 'GET') {
        console.log(`[${new Date()}] OLD BACKEND:`, req.method, req.url);
        request(`https://mediqlab.com/remapi${req.url}`, (error, response, body) => {
            if (error) {
                console.error(error);
                return res.sendStatus(500);
            }
            res.send(body);
        });
    } else if (req.method === 'POST') {
        if (req.body !== undefined) {
            console.log(`[${new Date()}] OLD BACKEND:`, req.method, req.url, req.body);
            if (Object.keys(req.body).length > 0) {
                needle.post(`https://mediqlab.com/remapi${req.url}`, req.body, { json: true },
                    function (err, resp, body) {
                        if (err) {
                            console.error(err);
                            return res.sendStatus(500);
                        }
                        res.send(body);
                    });
            }
        }
    }
});

const XrayPipeline = {
    q: new Map(),
    listeners: new Map(),
    getRid: () => {
        return uuidv4();
    },
    add: (rid, data) => {
        if (XrayPipeline.q.get(rid) !== undefined) {
            const prev = XrayPipeline.q.get(rid);
            XrayPipeline.q.set(rid, [...prev, data]);
        } else {
            XrayPipeline.q.set(rid, [data]);
        }
    },
    addListener: (type, listenerProto, key) => {
        if (XrayPipeline.listeners.get(listenerProto.id) === undefined) {
            const listener = setInterval(() => {
                console.log(`Listener ticking ${listenerProto.id} | type`);
                const lrOptionsScope = {
                    'method': 'GET',
                    'url': `https://oxytech.io/api/image/${listenerProto.id}/`,
                    'headers': {
                        'Authorization': 'Token 85d2fb0ee3097dfcc84c36b2ad2a0e7ac917af51'
                    },
                    formData: {

                    }
                };
                request(lrOptionsScope, async (error, response) => {
                    if (error) {
                        console.log(error);
                        console.log("listener error");
                    } else {
                        const data = JSON.parse(response.body);
                        // console.log(data)
                        if (data.processing_status === 'COMPLETED') {
                            console.log('FOUND DONE LISTENER')
                            console.log(data);
                            await DataProcessingPipeline.update(key, type, data);
                            clearInterval(XrayPipeline.listeners.get(listenerProto.id))
                        } else if (data.processing_status === 'ERROR') {
                            await DataProcessingPipeline.update(key, type, data);
                            clearInterval(XrayPipeline.listeners.get(listenerProto.id))
                        }
                    }
                });
            }, 3000);

            XrayPipeline.listeners.set(listenerProto.id, listener);
        }
    },
    getImage: (uid, res) => {
        const options = {
            'method': 'GET',
            'url': `https://oxytech.io/api/storage/preview/${uid}/`,
            'headers': {
                'Authorization': 'Token 691ce5789ce8efa25317034f6d8fd240468c792f' //HARDCODE
            },
            encoding: null
        };

        request(options, async (error, response) => {
            if (error) {
                console.log(error);
                console.log("listener error");
                res.send('error');
            } else {
                console.log(response.rawHeaders)
                res.set('Cross-Origin-Resource-Policy', 'cross-origin')
                res.set('Content-Disposition', response.rawHeaders[response.rawHeaders.indexOf('Content-Disposition') + 1]);
                res.set('Content-Length', response.rawHeaders[response.rawHeaders.indexOf('Content-Length') + 1]);
                res.set('Content-Type', response.rawHeaders[response.rawHeaders.indexOf('Content-Type') + 1]);
                res.send(response.body);
            }
        });

    },
    apis: {
        lung: {
            upload: async (fileName, fileBody) => {
                try {

                    const Roptions = {
                        'method': 'POST',
                        'url': 'https://oxytech.io/api/external/lung_xr_processing_v1_0/upload/',
                        'headers': {
                            'Authorization': 'Token 85d2fb0ee3097dfcc84c36b2ad2a0e7ac917af51'
                        },
                        formData: {
                            'file': {
                                'value': fileBody,
                                'options': {
                                    'filename': fileName,
                                    'contentType': null
                                }
                            }
                        }
                    };

                    const data = await request_promise(Roptions);
                    return JSON.parse(data);


                } catch (e) {
                    return e;
                }
            }
        },
        spine: {
            upload: async (fileName, fileBody) => {
                try {

                    const Roptions = {
                        'method': 'POST',
                        'url': 'https://oxytech.io/api/external/spine_xr_frontal_processing_v1_0/upload/',
                        'headers': {
                            'Authorization': 'Token 85d2fb0ee3097dfcc84c36b2ad2a0e7ac917af51'
                        },
                        formData: {
                            'file': {
                                'value': fileBody,
                                'options': {
                                    'filename': fileName,
                                    'contentType': null
                                }
                            }
                        }
                    };

                    const data = await request_promise(Roptions);
                    return JSON.parse(data);


                } catch (e) {
                    return e;
                }
            }
        }
    }

}



app.post('/services/pipelines/xray', isAuth, _upload.single('file'), async (req, res) => {
    try {
        console.log(req.jwt.verified._id);

        console.log(req.file, req.body);


        const lung_done = await XrayPipeline.apis.lung.upload(req.file.originalname, req.file.buffer)
        const spine_done = await XrayPipeline.apis.spine.upload(req.file.originalname, req.file.buffer)
        console.log('DONE [lungs]:')
        console.log(lung_done);
        console.log('DONE [spine]:')
        console.log(spine_done);

        const processingPipelineEntryCreated = await DataProcessingPipeline.add(req.jwt.verified._id, 'oxytech_lungsandspine', {
            lungs: lung_done,
            spine: spine_done
        });

        console.log(processingPipelineEntryCreated);

        console.log([
            ['lungs', lung_done, processingPipelineEntryCreated.saved._id],
            ['spine', spine_done, processingPipelineEntryCreated.saved._id]
        ])
        XrayPipeline.addListener('lungs', lung_done, processingPipelineEntryCreated.saved._id);
        XrayPipeline.addListener('spine', spine_done, processingPipelineEntryCreated.saved._id);




        const request_id = XrayPipeline.getRid();
        XrayPipeline.add(req.jwt.verified._id, {
            rid: request_id,
            file: req.file,
            processing: {
                lungs: lung_done,
                spine: spine_done
            }
        })
        console.log(XrayPipeline.q);
        res.send({ pid: processingPipelineEntryCreated.saved._id, pipelines: ['lungs', 'spine'] });
    } catch (e) {
        console.log(e);
    }
})

const prepareReadable = (input) => {
    const out = {
        lungs: [],
        spine: [],
        lungs_status: input.lungs.processing_status,
        spine_status: input.spine.processing_status
    }

    // console.log(input)

    if (input.lungs.processing_status !== 'ERROR') {
        // console.log("ENTRY")
        // console.log(input.lungs);
        if (input.lungs.processing_set !== undefined) {
            for (let entry of input.lungs.processing_set) {
                if ([
                    'lung_xr_mediastinal_widening_binary_classification',
                    'lung_xr_hydrothorax_binary_classification',
                    'lung_xr_aortic_atherosclerosis_binary_classification',
                    'lung_xr_pneumothorax_binary_segmentation_stack',
                    'lung_xr_emphysema_binary_classification',
                    'lung_xr_cardiomegaly_calculations',
                    'lung_xr_pneumonia_binary_classification',
                    'lung_xr_abnormal_binary_classification'
                ].includes(entry.model)) {
                    out.lungs.push({
                        label: {
                            'lung_xr_mediastinal_widening_binary_classification': 'Расширение средостерения',
                            'lung_xr_hydrothorax_binary_classification': 'Гидроторакс',
                            'lung_xr_aortic_atherosclerosis_binary_classification': 'Атерослеклероз аорты',
                            'lung_xr_pneumothorax_binary_segmentation_stack': 'Пневмоторакс',
                            'lung_xr_emphysema_binary_classification': 'Эмфизема',
                            'lung_xr_cardiomegaly_calculations': 'Кардиомегалия',
                            'lung_xr_pneumonia_binary_classification': 'Пневмония',
                            'lung_xr_abnormal_binary_classification': 'Паталогии'
                        }[entry.model],
                        risk: entry.result.risk,
                        probability: entry.result.probability,
                        id: input.lungs.id,
                        status: "COMPLETED"
                    })
                } else {
                    console.log('PUSHING')
                    console.log(entry);
                    out.lungs.push(entry);
                }
            }
        }

    }

    // if (input.spine.processing_status !== 'ERROR') {
    //     for (let entry of input.spine.processing_set) {
    //         if ([
    //             'lung_xr_mediastinal_widening_binary_classification',
    //             'lung_xr_hydrothorax_binary_classification',
    //             'lung_xr_aortic_atherosclerosis_binary_classification',
    //             'lung_xr_pneumothorax_binary_segmentation_stack',
    //             'lung_xr_emphysema_binary_classification',
    //             'lung_xr_cardiomegaly_calculations',
    //             'lung_xr_pneumonia_binary_classification',
    //             'lung_xr_abnormal_binary_classification'
    //         ].includes(entry.model)) {
    //             out.lungs.push({
    //                 label: {
    //                     'lung_xr_mediastinal_widening_binary_classification': 'Расширение средостерения',
    //                     'lung_xr_hydrothorax_binary_classification': 'Гидроторакс',
    //                     'lung_xr_aortic_atherosclerosis_binary_classification': 'Атерослеклероз аорты',
    //                     'lung_xr_pneumothorax_binary_segmentation_stack': 'Пневмоторакс',
    //                     'lung_xr_emphysema_binary_classification': 'Эмфизема',
    //                     'lung_xr_cardiomegaly_calculations': 'Кардиомегалия',
    //                     'lung_xr_pneumonia_binary_classification': 'Пневмония',
    //                     'lung_xr_abnormal_binary_classification': 'Паталогии'
    //                 }[entry.model],
    //                 risk: entry.result.risk,
    //                 probability: entry.result.probability
    //             })
    //         } else {
    //             out.push(entry);
    //         }
    //     }
    // }

    return out



}

app.get('/services/pipelines/mine', isAuth, async (req, res) => {
    try {


        const allPipelines = await DataProcessingPipeline.mine(req.jwt.verified._id, 'oxytech_lungsandspine');
        const out = [];

        for (const processor of allPipelines) {
            out.push({ id: processor._id, artifacts: prepareReadable(processor.artifacts), last_modified: processor.last_modified })
        }
        res.send(out);
    } catch (e) {
        console.log(e);
    }
})

app.get('/services/pipelines/mine/:id', isAuth, async (req, res) => {
    try {
        const specificPipeline = await DataProcessingPipeline.mineSpecific(req.jwt.verified._id, req.params.id);
        // const image_lungs = await XrayPipeline.getImage(specificPipeline.artifacts.lungs.id)
        // const image_spine = await XrayPipeline.getImage(specificPipeline.artifacts.spine.id)
        // console.log('\name')
        // console.log(image_lungs)
        console.log(specificPipeline, specificPipeline.last_modified);
        const readableOutput = prepareReadable(specificPipeline.artifacts);
        res.send({ ...readableOutput, last_modified: specificPipeline.last_modified });
    } catch (e) {
        console.log(e);
        res.send(e);
    }
})


app.get('/services/image-api/:id', async (req, res) => {
    try {
        XrayPipeline.getImage(req.params.id, res);
    } catch (e) {
        console.log(e);
        res.send(e);
    }
})





// express.listen(8080);

https.createServer({
    cert: fs.readFileSync('/etc/letsencrypt/live/mediq.nosov.tech/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/mediq.nosov.tech/privkey.pem')
}, app).listen(443);

app.listen(80, () => {
    console.log('API listening on port 3301');
    MediqBot.start();
});



// const userSchema = new mongoose.Schema({
//     name: String,
//     age: Number
// });

// const User = mongoose.model('User', userSchema);


// // Create a new user
// app.post('/users', async (req, res) => {
//     const user = new User(req.body);
//     try {
//         await user.save();
//         res.send(user);
//     } catch (error) {
//         res.sendStatus(500);
//     }
// });

// // Get a single user by ID
// app.get('/users/:id', async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id);
//         if (!user) {
//             return res.sendStatus(404);
//         }
//         res.send(user);
//     } catch (error) {
//         res.sendStatus(500);
//     }
// });

// // Get all users
// app.get('/users', async (req, res) => {
//     try {
//         const users = await User.find();
//         res.send(users);
//     } catch (error) {
//         res.sendStatus(500);
//     }
// });

