const {getJacardScore} = require("./recommender");
const {extractWordSet} = require("./recommender");
const fs = require('fs');

// change with full doc list/api call/ db call whatever we'll have
let doc_paths = fs.readdirSync('../data/')
doc_paths = doc_paths.map(p => '../data/' + p)

doc_wordset_mapping = {}

for(let i = 0; i < doc_paths.length; i++){
    const docId = doc_paths[i].split('.json')[0].split(/\\*\//)[doc_paths[i].split('.json')[0].split(/\\*\//).length - 1]
    doc_wordset_mapping[docId] = extractWordSet(doc_paths[i])
}

GEOMETRIC_GRAPH_THRESHOLD = 0.25 // tweak this if needd

edge_list = []

for(let a in doc_wordset_mapping){
    for(let b in doc_wordset_mapping){ // jacardScore(a,b) == jacardScore(b,a) so skip already computed
        console.log([a,b])
        if(a === b){
            continue;
        }
        const pairScore = getJacardScore(doc_wordset_mapping[a], doc_wordset_mapping[b])
        if(pairScore >= GEOMETRIC_GRAPH_THRESHOLD){
            edge_list.add([a, b])
        }
    }
}

console.log(5)