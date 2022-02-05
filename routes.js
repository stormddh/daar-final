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
                        id: { type: 'integer' },
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
        .map(json => (({id, title, content, formats, authors, languages, subjects}) => ({id, title, content, formats, authors, languages, subjects}))(json))
    let i = 0;
    const batchSize = 10;
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

router.get('/book', (req, res) => {
    let query = {};
    if (req.query.search && req.query.regex) {
        query = {
            regexp: {
                title: {
                    value: req.query.search,
                    flags: "ALL",
                    case_insensitive: true,
                    rewrite: "constant_score"
                }
            }
        }
    } else if (req.query.search) {
        query = {
            multi_match: {
                query: req.query.search,
                fields: ['title', 'content']
            }
        }
    } else {
        return res.status(200).json({
            msg: 'No result',
        });
    }

    console.log(query);

    elasticClient.search({
        index: 'book_index',
        body: {
            query: query,
        }
    })
    .then(resp => {
        let booksArray = resp.body.hits.hits;
        booksArray.forEach(book => delete book._source.content);
        console.log(resp.body.hits);
        return res.status(200).json({
            books: booksArray,
            recommendations: getRecommendationsArray(booksArray)
        });
    })
    .catch(err => {
        console.log(err.toString());
        return res.status(500).json({
            msg: 'SEARCH: Error',
            error: err,
        });
    });
});

function getRecommendationsArray(books) {
    const graphFolder = './data/recommender';

    return "THOSE ARE THE RECOMMENDATIONS"
    // TODO: return map of reccommendations for each book. Look it up in the major graph json file and return array of arrays
}


module.exports = router;