const fs = require('fs');

function getRecommendations(bookId){
    /**
     * Given a bookId it return the book IDs of those book that are recommended
     * @type {string}
     */
    const rawFile = fs.readFileSync('../data/recommender/jaccard_graph.json', 'utf8')
    return JSON.parse(rawFile)['' + bookId + '']
}