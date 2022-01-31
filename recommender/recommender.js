const fs = require('fs');

function extractWordSet(path){
    let doc = readFile(path);
    doc = extractRelevantText(doc)
    doc = tokenise(doc)
    doc = removeStopWords(doc)
    return new Set(doc);
}

function extractRelevantText(rawText){
    const BEGIN = new RegExp('\\*\\*\\* START OF .* PROJECT.*\\*\\*\\*');
    const END = new RegExp('\\*\\*\\* END OF .* PROJECT.*\\*\\*\\*');
    return rawText.split(BEGIN)[1].split(END)[0]
}

function removeStopWords(rawTextAsList){
    const stopwordremove = require('remove-stopwords')
    return stopwordremove.removeStopwords(rawTextAsList)
}

function readFile(path){
    try {
        return fs.readFileSync(path, 'utf8')
    } catch (err) {
        console.error(err)
    }
}

function tokenise(doc){
    const natural = require('natural');
    const tokenizer = new natural.WordTokenizer();
    return tokenizer.tokenize(doc);
}

function union(a, b){
    return new Set([...a, ...b]);
}

function intersection(a, b){
    return new Set([...a].filter(x => b.has(x)));
}

function getJacardScore(a, b){
    return intersection(a, b).size / union(a, b).size
}

a = extractWordSet('../uploads/Winnie-the-Pooh by A. A. Milne.txt')
b = extractWordSet('../uploads/A Doll\'s House by Henrik Ibsen.txt')

// getJacardScore(a, b)
// console.log(doc)

module.exports = {extractWordSet, getJacardScore}



