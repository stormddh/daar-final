const fs = require('fs');

function getRecommendationsContent(bookId){
    /**
     * Given a bookId it return the book IDs of those book that are recommended
     * based on content matching
     * @type {string}
     */
    const rawFile = fs.readFileSync('../data/recommender/jaccard_graph_content.json', 'utf8')
    return JSON.parse(rawFile)['' + bookId + '']
}

function getRecommendationsSubject(bookId){
    /**
     * Given a bookId it return the book IDs of those book that are recommended
     * based on subject matching
     * @type {string}
     */
    const rawFile = fs.readFileSync('../data/recommender/jaccard_graph_subject.json', 'utf8')
    return JSON.parse(rawFile)['' + bookId + '']
}