const fs = require('fs');

function extractWordSet(path, subjectBased=false){
    let doc = readFile(path);
    doc = extractRelevantText(doc, subjectBased)
    doc = tokenise(doc)
    doc = removeStopWords(doc)
    return new Set(doc);
}

function extractRelevantText(rawText, subjectBased){
    if(rawText[0] == '{' && ! subjectBased){ // proxy for JSON string
        rawText = JSON.parse(rawText)['content']
    }
    if(rawText[0] == '{' && subjectBased){ // proxy for JSON string
        return JSON.parse(rawText)['subjects'].join(' ')
    }
    const BEGIN = new RegExp('[\\*\\*\\*]*\s*START OF .* PROJECT.*[\\*\\*\\*]*');
    const END = new RegExp('[\\*\\*\\*]*\s*END OF .* PROJECT.*[\\*\\*\\*]*');
    if(rawText.split(BEGIN).length < 2){
        const BEGIN2 = new RegExp('\\*END\\*THE SMALL PRINT!')
        if(rawText.split(BEGIN2).length < 2){
            return ''
        }
        return rawText.split(BEGIN2)[1]
    }
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

module.exports = {extractWordSet, getJacardScore, extractWordSet, extractRelevantText, tokenise, removeStopWords}



