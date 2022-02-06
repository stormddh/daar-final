# Recommender

## How it works
For each document a **set** of words is calcualted, e.g. ['hello', 'dog', 'crazy']
The docuemnt set of words does not contain stop words nor the Project Gutenberg 
intriduction.

Now that we have a set associated with each document we can calculate the Jaccard
Distance between each pair of documents (notice J(a, b) == J(b, a)). This will be a score 
between 0 and 1.

We use the Jacard score to induce a geometric graph on the documents.
In simple words two documents A and B are connected if J(A, B) > THRESHOLD

THRESHOLD has been set arbitrarily to 0.33; higher values will give quantitatively 
fewer results but perhaps more accurate.

Now that we have a graph associated with the collection of documents we treat 
the neighbours of a document as the recommendations.

## Set up
Generating the graph needs to be done offline because it's computationally intense.

Run ```node generate_graph.js```

This should create a .csv file in the ```/data``` folder that contains the 
adjecency list of the graph.

## Use it
To use this system and get the recommendatiosn you need to invoke the function 
```getRecommendations(bookId)``` in the file ```/recommender/get_recommendations.js```
and pass the document ID you are interested in.