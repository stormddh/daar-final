const axios = require('axios')
const fs = require('fs');

const FOLDER = './data/';

let url = "http://gutendex.com/books";
let page = 0;

async function scrap() {
    // Due to pagination, the script download book per page
    while (page < 100) {
        console.log("Downloading batch " + page);
        let query = page !== 0 ? '/?page=' + page : ''
        const res1 = await axios.get(url + query)
            .catch(error => {
                console.error(error);
            })

        for (let book of res1.data.results) {

            let bookTextUrl = book.formats["text/plain"] || book.formats['text/plain; charset=utf-8'];
            if(!bookTextUrl){
                continue;
            }
            const res2 = await axios.get(bookTextUrl)
                .catch(error => {
                    console.error(error);
            })
            // The books must contain at least 10100 words and the large books are also skipped to save some storage
            if (res2.headers['content-type'] === 'application/zip' ||
                res2.data.split(/\s+/).length < 10100 ||
                res2.data.split(/\s+/).length > 100000) {
                console.log('skipping .zip book or a book that is either too short/long')
            } else {
                // Downloaded data are in a json format which be saved as a single file
                book["content"] = res2.data;
                fs.writeFile(FOLDER + book.id + '.json', JSON.stringify(book), err => {
                    if (err) {
                        console.error(err);
                    }
                })
                console.log('Downloaded book: ' + book.id);
            }
            let length = fs.readdirSync(FOLDER).length;
            if (length % 100 == 0) {
                console.log("Downloaded " + length + " books");
            }
        }
        page++;
    }
    console.log("Finished scraping books");
}

scrap();




