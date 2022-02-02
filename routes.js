require('dotenv').config();
const axios = require('axios');
const express = require('express');
const fs = require('fs');

const router = express.Router();

const {Client} = require('@elastic/elasticsearch');
let import_books = [];
const elasticClient = new Client({
    node: process.env.ES,
});

elasticClient.ping(
    {
        requestTimeout: 30000,
    },
    function (error) {
        if (error) {
            console.error('Elasticsearch cluster is down!');
            console.error(error);
        } else {
            console.log('Everything is okay.');
        }
    }
);

async function setup_index () {
    // await elasticClient.indices.delete({index: "*"});
      await elasticClient.indices.create({
      index: 'book_index',
      body: {
        mappings: {
          properties: {
              author: { type: 'text' },
              formaturi: { type: 'keyword' },
              language: { type: 'text' },
              rights: { type: 'text' },
              subject: { type: 'text' },
              title: { type: 'text' },
              content: { type: 'text' },
          }
        }
      }
    }, { ignore: [400] })

}
setup_index().catch(console.log)

function read_books() {
    let book_list = [];
    const data_folder = './data/';
        fs.readdirSync(data_folder).forEach(function (filename) {
                    if (filename.endsWith('.json')) {
                        const data = require(data_folder + filename);
                        book_list.push(data);
                    }
                });
            import_books = book_list.slice()
            console.log("import_books length: " + import_books.length);

}

async function import_data () {

        console.log("Importing: " + import_books.length);
        // const experiment = fs.access('./data/books.json', fs.F_OK, (err) => {
        //         if (err) {
        //             console.log("books.json not found");
        //             const data = require('./data/data.json');
        //             Object.values(data).forEach(i => {
        //                 if (i["formaturi"].length > 0) {
        //                     let book_content_uri = i["formaturi"].find(uri => uri.includes(".txt"));
        //                     (book_content_uri) {
        //                         const response = axios.get(book_content_uri).catch(err => {
        //                             console.error("Error: ", book_content_uri);
        //                         })
        //                         if (response && response.data) {
        //                             i["content"] = response.data;
        //                         }
        //                     }
        //                 }
        //             });
        //             /*fs.writeFile('./data/books.json', JSON.stringify(data), err => {
        //                 if (err) {
        //                   console.error(err);
        //                   return
        //                 }
        //             })*/
        //         } else {
        //             return require('./data/books.json');
        //         }
        //     });
        const body = import_books.flatMap(doc => [{ index: { _index: 'book_index' } }, doc])
        const { body: bulkResponse } = await elasticClient.bulk({ refresh: true, body })

        if (bulkResponse.errors) {
            const erroredDocuments = []
            // The items array has the same order of the dataset we just indexed.
            // The presence of the `error` key indicates that the operation
            // that we did for the document has failed.
            bulkResponse.items.forEach((action, i) => {
                const operation = Object.keys(action)[0]
                if (action[operation].error) {
                    erroredDocuments.push({
                        // If the status is 429 it means that you can retry the document,
                        // otherwise it's very likely a mapping error, and you should
                        // fix the document before to try it again.
                        status: action[operation].status,
                        error: action[operation].error,
                        operation: body[i * 2],
                        document: body[i * 2 + 1]
                    })
                }
            })
            // console.log(erroredDocuments)
        }
        const { body: count } = await elasticClient.count({ index: 'book_index' });

}

read_books()

import_data().catch(console.log)

router.use((req, res, next) => {
    elasticClient.index({
        index: 'logs',
        body: {
            url: req.url,
            method: req.method,
        }
    })
    .then(res => {
        console.log('Logs indexed');
    })
    .catch(err => {
        console.log(err);
    })
    next();
});

router.get('/book/:file', (req, res) => {
    const file_name = req.params.file
    const book_path = "data/" + file_name

    if (fs.existsSync(book_path)) {
        res.contentType("application/pdf");
        fs.createReadStream(book_path).pipe(res);
    } else {
        res.status(500);
        res.send('File not found');
    }
});

router.get('/book', (req, res) => {
    if (req.query.search && req.query.search.includes("REGEX")) {
        let RegExQuery = req.query.search.replace('REGEX', '');
        console.log(req.query.search)
        console.log(RegExQuery)

        elasticClient.search({
            index: 'book_index',
            body: {
                query: {
                    regexp: {
                        title: {
                            value: RegExQuery,
                            flags: "ALL",
                            case_insensitive: true,
                            rewrite: "constant_score"
                        }
                    }
                }
            }
        })
        .then(resp => {
            console.log(resp.body.hits)
            return res.status(200).json({
                book: resp.body.hits.hits,
            });
        })
        .catch(err => {
            console.log(err.toString())

            return res.status(500).json({
                msg: 'SEARCH: Error',
                error: err,
            });
        });
    }
    else if (req.query.search) {
        elasticClient.search({
            index: 'book_index',
            body: {
                query: {
                    match: {
                        title: req.query.search,
                    }
                }
            }
        })
        .then(resp => {
            return res.status(200).json({
                book: resp.body.hits.hits,
            });
        })
        .catch(err => {
            return res.status(500).json({
                msg: 'SEARCH: Error',
                error: err,
            });
        });
    } else {
        return res.status(200).json({
            msg: 'No result',
        });
    }
});

module.exports = router;