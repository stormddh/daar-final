const {getJacardScore} = require("./_recommender");
const {extractWordSet} = require("./_recommender");
const fs = require('fs');
const folder = '../data/recommender/'

// change with full doc list/api call/ db call whatever we'll have
let doc_paths = fs.readdirSync('../data/')
doc_paths = doc_paths
    .filter(p => p.endsWith('json'))
    .map(p => '../data/' + p)

console.log("finished preprocessing file names")

doc_wordset_mapping = {}

function generateContentBasedGraph(doc_paths){
    for(let i = 0; i < doc_paths.length; i++){
        const docId = doc_paths[i].split('.json')[0].split(/\\*\//)[doc_paths[i].split('.json')[0].split(/\\*\//).length - 1]
        doc_wordset_mapping[docId] = extractWordSet(doc_paths[i])
    }

    console.log("finished building word-sets for books")

    GEOMETRIC_GRAPH_THRESHOLD = 0.40 // tweak this if needd

    adjacency_list = {}

    let keys = Object.keys(doc_wordset_mapping);
    for(let i_out = 0; i_out < keys.length; i_out++){
        adjacency_list[keys[i_out]] = []
        for(let i_in = i_out + 1; i_in < keys.length; i_in++){
            const pairScore = getJacardScore(doc_wordset_mapping[keys[i_out]], doc_wordset_mapping[keys[i_in]])
            if(pairScore >= GEOMETRIC_GRAPH_THRESHOLD){
                adjacency_list[keys[i_out]] = [...adjacency_list[keys[i_out]], keys[i_in]]
            }
        }
    }
    fs.writeFileSync(folder + 'jaccard_graph_content.json', JSON.stringify(adjacency_list), err => console.log("error writin the graph file"))
}

function generateContentSubjectGraph(doc_paths){
    for(let i = 0; i < doc_paths.length; i++){
        const docId = doc_paths[i].split('.json')[0].split(/\\*\//)[doc_paths[i].split('.json')[0].split(/\\*\//).length - 1]
        doc_wordset_mapping[docId] = extractWordSet(doc_paths[i], true)
    }

    GEOMETRIC_GRAPH_THRESHOLD = 0.5 // tweak this if needd

    adjacency_list = {}

    let keys = Object.keys(doc_wordset_mapping);
    for(let i_out = 0; i_out < keys.length; i_out++){
        adjacency_list[keys[i_out]] = []
        for(let i_in = i_out + 1; i_in < keys.length; i_in++){
            const pairScore = getJacardScore(doc_wordset_mapping[keys[i_out]], doc_wordset_mapping[keys[i_in]])
            if(pairScore >= GEOMETRIC_GRAPH_THRESHOLD){
                adjacency_list[keys[i_out]] = [...adjacency_list[keys[i_out]], keys[i_in]]
            }
        }
    }
    fs.writeFileSync(folder + 'jaccard_graph_subject.json', JSON.stringify(adjacency_list), err => console.log("error writin the graph file"))
}

console.time()
generateContentBasedGraph(doc_paths)
console.timeEnd()

console.time()
generateContentSubjectGraph(doc_paths)
console.timeEnd()