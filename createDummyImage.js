const carbone = require('carbone');
const fs = require('fs');
const template = fs.readFileSync('./template.html').toString()
const builder = require('string-template');



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

const renderOptions = {
    convertTo: "pdf"
}

const createImage = async () => {

    const templateData = await createResume();
    // const preRenderOutputData = await generatePage(templateData);

    console.log(templateData)

    carbone.render("./template.html", templateData, renderOptions, function (err, rendered) {
        if (err) {
            console.log("error:")
            console.log(err)
            return //console.log(err);
        }
        console.log("rendered: ", rendered)
        // write the result
        fs.writeFileSync("./out.pdf", rendered);
        process.exit();
    })
};

createImage();