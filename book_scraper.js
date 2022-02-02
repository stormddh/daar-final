const axios = require('axios')
const fs = require('fs');
const assert = require("assert");

const FOLDER = './data/';

let url = "http://gutendex.com/books";
let page = 0;

async function scrap() {
    while (page < 100) {
        console.log("Downloading batch " + page)
        let query = page !== 0 ? '/?page=' + page : ''
        const res1 = await axios.get(url + query)
            .catch(error => {
                console.error(error)
            })

        for (let book of res1.data.results) {

            let bookTextUrl = book.formats["text/plain"] || book.formats['text/plain; charset=utf-8'];
            if(!bookTextUrl){
                continue;
            }
            const res2 = await axios.get(bookTextUrl)
                .catch(error => {
                    console.error(error)
            })

            if (res2.headers['content-type'] === 'application/zip' ||
                res2.data.split(/\s+/).length < 10100 ||
                res2.data.split(/\s+/).length > 100000) {
                console.log('skipping .zip book or a book that is either too short/long')
            } else {
                book["content"] = res2.data;
                fs.writeFile(FOLDER + book.id + '.json', JSON.stringify(book), err => {
                    if (err) {
                        console.error(err);
                    }
                })
                console.log('downloaded one')
            }
        }
        // const length = fs.readdirSync(FOLDER).length;
        // if (length > 10) {
        //     break;
        // }
        page++;
    }
    console.log("finished scraping books")
}

scrap();




