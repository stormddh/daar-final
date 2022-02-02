const {getJacardScore} = require("./_recommender");
const {extractWordSet} = require("./_recommender");
const fs = require('fs');
const folder = '../data/recommender/'


// change with full doc list/api call/ db call whatever we'll have
let doc_paths = fs.readdirSync('../data/')
doc_paths = doc_paths
    .filter(p => p.endsWith('json'))
    .map(p => '../data/' + p)

doc_wordset_mapping = {}

for(let i = 0; i < doc_paths.length; i++){
    const docId = doc_paths[i].split('.json')[0].split(/\\*\//)[doc_paths[i].split('.json')[0].split(/\\*\//).length - 1]
    doc_wordset_mapping[docId] = extractWordSet(doc_paths[i])
}

GEOMETRIC_GRAPH_THRESHOLD = 0.33 // tweak this if needd

adjacendy_list = {}

for(let a in doc_wordset_mapping){
    adjacendy_list[a] = []
    for(let b in doc_wordset_mapping){
        if(a === b){ continue; }
        const pairScore = getJacardScore(doc_wordset_mapping[a], doc_wordset_mapping[b])
        if(pairScore >= GEOMETRIC_GRAPH_THRESHOLD){
            adjacendy_list[a] = [...adjacendy_list[a], b]
        }
    }
}

fs.writeFileSync(folder + 'jaccard_graph.json', JSON.stringify(adjacendy_list), err => console.log("error writin the graph file"))

console.log('saved the Jacard graph as an adjecency list in ' + folder)