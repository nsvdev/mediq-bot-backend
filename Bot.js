const redis = require('redis');
const fs = require('fs');

// const fetch = require('node-fetch');
// import fetch from 'node-fetch';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const request = require('request');
const express = require('express');
const app = express();
const template = fs.readFileSync('./template.html').toString()
const builder = require('string-template');

const TeleBot = require('telebot');
const MediqBot = new TeleBot('5650313010:AAH38LA8ipo9m-tHP2diS9TBEXaJBd-e3aE'); //unsafe as fuck... 


app.use(express.json());

const redis_client = redis.createClient({
    password: 'WtSzyH2gb/hUan5MLYCtJnKTMoAOnR22kJi8t55VJrdMom1PHhOBpQuQUOT9qNPrkdGCehjtNrabhS3i'
});

redis_client.on('error', (err) => console.log('Redis Client Error', err));



MediqBot.on(/^\/image (.+)$/, async (msg, props) => {
    console.log(msg);
    
    const text = props.match[1];

    MediqBot.sendAction(msg.from.id, "upload_photo");

    // console.log(msg);

    const response = await fetch('https://mediqlab.com/exapi/drugs', {
        method: 'post',
        body: JSON.stringify({
            template: text
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    const suggestedDrugs = await response.json();

    
    if (suggestedDrugs.length > 0) {
        console.log(`Запрос от @${msg.from.username}: "${text}" -> ${suggestedDrugs[0].nameRu}`);
        
        let drugUsageMethodics;
        let msrp;

        if (suggestedDrugs[0].package === undefined) {
            drugUsageMethodics = "Не определено";
            msrp = "Не определена";
        }else{
            drugUsageMethodics = suggestedDrugs[0].package.name;
            msrp = suggestedDrugs[0].package.price;
        }
        const dummyHtmldata = await generatePage({
            name: suggestedDrugs[0].nameRu,
            title: suggestedDrugs[0].nameRu,
            description: drugUsageMethodics,
            clinrec: suggestedDrugs[0].quality === "PROVED" ? "Препарат <u>обладает</u> доказанной эффективностью" : "<span style='color: red;'>НЕ ОБЛАДАЕТ доказанной эффективностью!</span>",
            msrp
        });
    
        const image = await nodeHtmlToImage({
            html: dummyHtmldata,
            type: 'jpeg',
            quality: 100,
            puppeteerArgs: { args: ['--no-sandbox'] }
        });
    
        return MediqBot.sendPhoto(msg.from.id, image, { replyToMessage: msg.message_id });
    }else{
        console.log(`Запрос от @${msg.from.username}: "${text}" -> -`);
        return MediqBot.sendMessage(msg.from.id, `Не нашел ${text}`, { replyToMessage: msg.message_id });
    }

});

MediqBot.start();


const nodeHtmlToImage = require('node-html-to-image');

const createResume = () => {
    return new Promise(async (resolve, reject) => {
        try {
            resolve({
                id: "id123123123",
                title: "this is my title"
            })
        } catch (e) {
            reject(e)
        }
    })
}

const generatePage = (pageTemplateData) => {
    return new Promise(async (resolve, reject) => {
        resolve(builder(template, pageTemplateData));
    })
}



app.get(`/dummy-image`, async function (req, res) {

    const dummyData = await createResume();
    const dummyHtmldata = await generatePage(dummyData);

    const image = await nodeHtmlToImage({
        html: dummyHtmldata,
        type: 'jpeg',
        content: {name: "Mike"},
        quality: 100,
        puppeteerArgs: { args: ['--no-sandbox'] }
    });
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(image, 'binary');
});

app.get(`/avatar.jpeg`, async function(req, res) {
    try {
        let pf = await MediqBot.getUserProfilePhotos(req.query.tg);
        let { photos } = pf;

        if (photos.length > 0) {
            let lastPhotoFile_id = photos[0][0].file_id;
            let photoCloudFile = await MediqBot.getFile(lastPhotoFile_id);
            // console.log(photoCloudFile.fileLink)
            console.log(new Date(), req.query.tg, photoCloudFile.fileLink)
            request.get(photoCloudFile.fileLink).pipe(res);


        }
    } catch (e) {
        console.log(new Date, req.query.tg, e);
        res.sendStatus(404);
    }
})

app.post('/__aUnsafe2910983GTFO/mediq/person/notify', async (req, res) => {
    console.log('got req')
    let data = await req.body;
    console.log(data)
});

let Boot = async () => {
   
    app.listen(3301, () => {
        console.log(`MedIQ image report creater listens on port 3333`);
    })

    await redis_client.connect();
    console.log(`[${new Date()}] Redis connected`)
    // await redis_client.HSET('key', 'field', 'value');
    // let data = await redis_client.HGETALL('key');    
    // console.log(data);
    
    
    
}

Boot();

process.on('SIGINT', async () => {
    await redis_client.disconnect();
    console.log('Disconnected from redis');
    process.exit();
});



// let getTGPhoto = async (tgID) => {
//     try {

//         let pf = await MediqBot.getUserProfilePhotos(tgID);
//         let {photos} = pf;

//         if (photos.length > 0) {
//             let lastPhotoFile_id = photos[0][0].file_id;
//             let photoCloudFile = await MediqBot.getFile(lastPhotoFile_id);
//             console.log(photoCloudFile.fileLink)
//             let image = await axios.get(photoCloudFile.fileLink, { responseType: 'arraybuffer' });
//             let returnedB64 = Buffer.from(image.data).toString('base64');
//             console.log(returnedB64)

//         }
//         // let file = await MediqBot.getFile(pf.photos[0][0].file_id)
//         // console.log(pf.photos);
//         // console.log('\n')
//         // console.log(file);
//     }catch(e) {
//         console.log(e)
//     }
// }
// getTGPhoto(238488685)