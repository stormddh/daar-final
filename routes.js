require('dotenv').config();
const axios = require('axios');
const express = require('express');
const fs = require('fs');

const router = express.Router();

const {Client} = require('@elastic/elasticsearch');
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
    await elasticClient.indices.delete({index: "*"});
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

async function import_data () {
    const experiment = fs.access('./uploads/books.json', fs.F_OK, (err) => {
            if (err) {
                console.log("books.json not found");
                const data = require('./uploads/data.json');
                Object.values(data).forEach(i => {
                    if (i["formaturi"].length > 0) {
                        let book_content_uri = i["formaturi"].find(uri => uri.includes(".txt"));
                        if (book_content_uri) {
                            const response = axios.get(book_content_uri).catch(err => {
                                console.error("Error: ", book_content_uri);
                            })
                            if (response && response.data) {
                                i["content"] = response.data;
                            }
                        }
                    }
                });
                /*fs.writeFile('./uploads/books.json', JSON.stringify(data), err => {
                    if (err) {
                      console.error(err);
                      return
                    }
                })*/
            } else {
                return require('./uploads/books.json');
            }
        });
    const data = require('./uploads/data.json');
    const body = Object.values(data).flatMap(doc => [{ index: { _index: 'book_index' } }, doc])
    // console.log(body)
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
        console.log(erroredDocuments)
    }
    const { body: count } = await elasticClient.count({ index: 'book_index' });
}
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
    const book_path = "uploads/" + file_name

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
                        value: RegExQuery,
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