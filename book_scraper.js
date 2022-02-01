const axios = require('axios')
const fs = require('fs');
const assert = require("assert");

const FOLDER = './uploads/';

let url = "http://gutendex.com/books";
let page = 0;

async function scrap() {
    while (page < 60) {
        console.log("Downloading batch " + page)
        let query = page !== 0 ? '/?page=' + page : ''
        const res1 = await axios.get(url + query)
            .catch(error => {
                console.error(error)
            })

        for (let book of res1.data.results) {

            let bookTextUrl = book.formats["text/plain"] || book.formats['text/plain; charset=utf-8'];
            if(! bookTextUrl){
                continue;
            }
            const res2 = await axios.get(bookTextUrl)
                .catch(error => {
                    console.error(error)
            })

            if (res2.headers['content-type'] === 'application/zip') {
                // console.log('skipping .zip book')
            } else {
                fs.writeFile(FOLDER + book.id + '.txt', res2.data, err => {
                    if (err) {
                        console.error(err);
                    }
                })
            }
        }
        page++;
    }
    const length = fs.readdirSync(FOLDER).length
    assert(length > 1664)
    console.log("finished scraping books")
}

scrap();




