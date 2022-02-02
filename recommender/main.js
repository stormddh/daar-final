const {getJacardScore} = require("./recommender");
const {extractWordSet} = require("./recommender");
const fs = require('fs');

// change with full doc list/api call/ db call whatever we'll have
let doc_paths = fs.readdirSync('../uploads/')
doc_paths = doc_paths.map(p => '../uploads/' + p)

doc_wordset_mapping = {}

for(let i = 0; i < doc_paths.length; i++){
    doc_wordset_mapping[i] = extractWordSet(doc_paths[i])
}

GEOMETRIC_GRAPH_THRESHOLD = 0.5 // tweak this if needd

edge_list = []

for(let a = 0; a < doc_paths.length; a++){
    for(let b = a; b < doc_paths.length; b++){ // jacardScore(a,b) == jacardScore(b,a) so skip already computed
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