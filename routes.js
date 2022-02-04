require('dotenv').config();
const axios = require('axios');
const express = require('express');
const fs = require('fs');
const {tokenise, extractRelevantText, removeStopWords} = require("./recommender/_recommender");

const router = express.Router();

const {Client} = require('@elastic/elasticsearch');
let import_books = [];
const elasticClient = new Client({
    node: process.env.ES,
});

elasticClient.ping({},
    {requestTimeout: '30000',},
    function (error) {
        if (error) {
            console.error('Elasticsearch cluster is down!');
            console.error(error);
        } else {
            console.log('Elasticsearch cluster is up');
        }
    }
);
async function fetchIndexObject(indexName) {
    const result = await elasticClient.indices.get(
        {index: indexName},
        {})
    return result
}

async function setup_index () {
    await elasticClient.indices.delete({index: "*", ignore_unavailable: true});
    const doesExistAlready = await elasticClient.indices.exists({index: 'book_index'});
    if(! doesExistAlready.body){
        await elasticClient.indices.create({
            index: 'book_index',
            body: {
                mappings: {
                    properties: {
                        id: { type: 'text'},
                        title: { type: 'text' },
                        content: { type: 'text' },
                        authors: { type: 'object' },
                        formats: { type: 'object' },
                        languages : {type: 'text'},
                        subjects: {type: 'text'},
                    }
                }
            }
        }, { ignore: [400] })
        await read_books()
    }
    return true
}

async function read_books() {

    const data_folder = './data/';

    const thingsToIndex = fs.readdirSync(data_folder)
        .filter(f => f.endsWith('.json'))
        .map(f => data_folder + f)
        .map(path => fs.readFileSync(path, 'utf8'))
        .map(rawFile => JSON.parse(rawFile))
        .map(json => (({title, content, formats, authors, languages, subjects}) => ({title, content, formats, authors, languages, subjects}))(json))
    let i = 0;
    const batchSize = 5;
    while(i < thingsToIndex.length){
        let bulkBody = thingsToIndex
            .slice(i, i+batchSize)
            .reduce((old, current) => [...old, { index: { _index: 'book_index' } }, current], []);
        try {
            let apiResponse = await elasticClient.bulk({
                index: 'book_index',
                body: bulkBody,
                timeout: '30s',
            });
            // console.log(apiResponse)
        } catch (e){
            console.log("Bulk api problem")
            console.log(e);
        }
        i += batchSize
        if(i % 50 == 0){
            console.log("indexed " + i + ' documents')
        }
    }

}

async function setupall(){
    const ok = await setup_index().catch(console.log)
}


setupall()

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
                    multi_match: {
                        query: req.query.search,
                        fields: ['title', 'content']
                    }
                }
            }
        })
        .then(resp => {
            return res.status(200).json({
                book: resp.body.hits.hits,
                recommendations: getRecommendationsArray(resp.body.hits.hits)
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

function getRecommendationsArray(books) {
    return "THOSE ARE THE RECOMMENDATIONS"
    // TODO: return map of reccommendations for each book. Look it up in the major graph json file and return array of arrays
}


module.exports = router;