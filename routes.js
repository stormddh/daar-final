require('dotenv').config();
const axios = require('axios');
const express = require('express');
const fs = require('fs');
const {tokenise, extractRelevantText, removeStopWords} = require("./recommender/_recommender");
const jaccardGraphContent = require('./data/recommender/jaccard_graph_content.json');
const jaccardGraphSubject = require('./data/recommender/jaccard_graph_subject.json');

const router = express.Router();

// Initiate the Elasticsearch JS client
const {Client} = require('@elastic/elasticsearch');
const elasticClient = new Client({
    node: process.env.ES,
});

// Ensure the ES cluster is running
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

// Delete existing index and setup a new one
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
                        languages: { type: 'text' },
                        subjects: { type: 'text' },
                    }
                }
            }
        }, { ignore: [400] })
        await read_books();
    }
    return true;
}

// Import book files into the ES using bulk operation
async function read_books() {
    const data_folder = './data/';
    const thingsToIndex = fs.readdirSync(data_folder)
        .filter(f => f.endsWith('.json'))
        .map(f => data_folder + f)
        .map(path => fs.readFileSync(path, 'utf8'))
        .map(rawFile => JSON.parse(rawFile))
        .map(json => (({id, title, content, formats, authors, languages, subjects}) => ({id, title, content, formats, authors, languages, subjects}))(json))
    let i = 0;
    const batchSize = 50;
    console.time();
    while(i < thingsToIndex.length) {
        let bulkBody = thingsToIndex
            .slice(i, i + batchSize)
            .reduce((old, current) => [...old, { index: { _index: 'book_index' } }, current], []);
        try {
            let apiResponse = await elasticClient.bulk({
                index: 'book_index',
                body: bulkBody,
                timeout: '30s',
            });
            // console.log(apiResponse)
        } catch (e){
            console.log("Bulk api problem");
            console.log(e);
        }
        i += batchSize;
        console.log("indexed " + i + ' documents');
    }
    console.timeEnd();
}

async function setupall() {
    const ok = await setup_index().catch(console.log);
}

setupall()

// Router API - GET /api/book?search=xxx&regex=True|False
router.get('/book', (req, res) => {
    let query = {};
    // setup query according to the type of search (normal or RegEx)
    if (req.query.search && req.query.regex === 'true') {
        query = {
            regexp: {
                title: {
                    value: req.query.search,
                    flags: "ALL",
                    case_insensitive: true,
                    rewrite: "constant_score",
                }
            }
        }
    } else if (req.query.search) {
        query = {
            multi_match: {
                query: req.query.search,
                // boosts title field and author
                fields: ['title^5', 'authors.name^10', 'content^0.5'],
            }
        }
    } else {
        return res.status(200).json({
            msg: 'No result',
        });
    }

    elasticClient.search({
        index: 'book_index',
        body: {
            query: query,
        }
    })
    .then(async resp => {
        let booksArray = resp.body.hits.hits;
        booksArray.forEach(book => delete book._source.content);
        await getRecommendationsArray(booksArray)
        return res.status(200).json({
            books: booksArray,
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

// Get recommended titles for results from pre-calculated Jaccard graph
async function getRecommendationsArray(books) {
    const data_folder = './data/';

    books.forEach(book => {
        book._source["recommendations"] = {"contentBased": []}, {"subjectBased": []};
        book._source.recommendations.contentBased = [];
        book._source.recommendations.subjectBased = [];

        if (jaccardGraphSubject[book._source.id]) {
            populateRecommendations(jaccardGraphSubject)
        }
        if (jaccardGraphContent[book._source.id]) {
            populateRecommendations(jaccardGraphContent)
        }

        function populateRecommendations(graph) {
            graph[book._source.id].forEach(e => {
                const recommendedBook = fs.readdirSync(data_folder)
                    .filter(f => f.endsWith(e + '.json'))
                    .map(f => data_folder + f)
                    .map(path => fs.readFileSync(path, 'utf8'))
                    .map(rawFile => JSON.parse(rawFile))
                    .map(json => (({title, formats, authors}) => ({title, formats, authors}))(json));
                if (recommendedBook[0]) {
                    if (graph === jaccardGraphContent) book._source.recommendations.contentBased.push(recommendedBook[0]);
                    if (graph === jaccardGraphSubject) book._source.recommendations.subjectBased.push(recommendedBook[0]);
                }
            })
        }
    })
}


module.exports = router;