<template>
  <div class="container">
    <div>
      <h2>Search in the library database:</h2>
      <p>To browse through the books in Gutenberg library, type in a searched phrase or author and a list of adequate
        books will be shown. <br> F.ex "American", "La" (to get results in different languages), or "Odyssey"
      </p>
      <div>
        <input class="form" type="text" v-model="query"/>
        <input class="search-button" type="submit" value="Search!" v-on:click="queryDatabase"/>
      </div>
      <div>
        <div class="checkboxes">
          <input type="checkbox" id="RegEx" value="Enable RegEx" v-on:click="showAdvancedSearch = !showAdvancedSearch"/>
          <label for="RegEx">Enable RegEx Search</label>
        </div>
          <div v-if=showAdvancedSearch>
            <div>
              <h2>Advanced Search:</h2>
              <div>EXAMPLE REGEX QUERIES - Title only:
                <p>l.*y</p>
                <p>lov.*</p>
              </div>
            </div>
          </div>
      </div>
    </div>

    <h2 v-if="showQuery"> List of books for given query: {{query}}</h2>
    <h2 v-else>No books found</h2>
    <div class="list-container" v-for="book in books" :key="book">
      <div class="list-entry">
        <div>
          <div class="avatar">
<!--            div for the thumbnail of the book as well as hyperlink to the book hosted on Gutenberg Project?-->
            <img  :src=getImg(book._source.formats) @click=getTxtUri(book._source.formats)
                  style=" padding-top: 30px; margin-left:auto; margin-right:auto; display:block;" @hover="hover = true">
            <span class="tooltiptext">Click to open the book in new tab !</span>
          </div>
          <input class="search-button" type="submit" value="Show recommendations" v-on:click="getRecommendations(book._id)"/>
<!--          the button intitiates the recommendations booleans array-->
        </div>
        <div style="display: inline-block;">
<!--          div with basic data about the book-->
          <h3>ES score: {{ book._score }}</h3>
          Title: <h3>{{ book._source.title}}</h3>
          Author: <h3>{{ book._source.authors.flatMap(a => a['name']).join(' ') }}</h3>
          Subject: <div>{{ book._source.subjects.join(' ') }}</div>
          <p>Language:</p>
          <img :alt= book._source.language
               :src=getFlagUrl(book._source.languages)
               style="height:30px; width:auto; max-width:500px;"/>
        </div>
      </div>
      <div class="recommendations" v-if="showRecommendations[book._id]">
<!--        div for listing the recommendations separately for contentBased and subjectBased recommendations-->
      <div v-if="book._source.recommendations.contentBased.length !== 0">
        <h3> Recommendations based on content:</h3>
        <div class="list-entry" >
          <div style="max-height: 20%" v-for="recommendation in book._source.recommendations.contentBased" :key="recommendation">
            <div v-if="recommendation.title">
              <div style="display: inline-block; cursor: pointer" @click=getTxtUri(recommendation.formats)>
                <div class="text-link" style="cursor: pointer; padding: 5px">
                  📚 {{ recommendation.title}} </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="book._source.recommendations.subjectBased.length !== 0">
        <h3> Recommendations based on subject:</h3>
        <div class="list-entry">
          <div style="max-height: 20%" v-for="recommendation in book._source.recommendations.subjectBased" :key="recommendation">
            <div v-if="recommendation.title">
              <div style="display: inline-block; cursor: pointer" @click=getTxtUri(recommendation.formats)>
                <div class="text-link" style="cursor: pointer; padding: 5px">
                  📚 {{ recommendation.title}}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
        <div v-else>
          <h3> No recommendations for this book :( </h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  components: {},
  data() {
    return { // declarations of the variables used through this Vue page
      firstName: '',
      lastName: '',
      myFile: '',
      query: '',
      books: [],
      avatar: require('./assets/default-avatar.png'),
      showQuery: false,
      showAdvancedSearch: false,
      showRecommendations: [],

    }
  },
  methods: {
    getImg(uriArray) { //get URI with link to thumbnail image hosted on Gutenberg servers
      const k = Object.keys(uriArray).find(uri => uri.includes("image"))
      let uri = uriArray[k].replace("small", "medium")
      return uri
    },
    getTxtUri(uriArray) { //open a new window in the browser and go to the .txt format of the book hosted on Gutenberg servers
      window.open(Object.values(uriArray).find(uri => uri.includes(".txt")))
    },
    getFlagUrl(languages){ //simple API call to retrieve flags in .svg format for the language of the book
      let flagUrl
      if (languages[0].toString() === "en"){
        flagUrl = "http://purecatamphetamine.github.io/country-flag-icons/3x2/GB.svg"
      } else flagUrl = "http://purecatamphetamine.github.io/country-flag-icons/3x2/" + languages[0].toString().toUpperCase() + ".svg"
      return flagUrl
    },
    getRecommendations(id){ //initiate the Booleans array for the recommendations and revert (false --> true) the one that triggered the function
      this.initiateBooleans()
      this.showRecommendations[id] = !this.showRecommendations[id]
    },

    queryDatabase() { //axios API call to backend, one function serves both the normal query as well as RegEx
      let requestOptions = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          search: this.query,
          regex: this.showAdvancedSearch,
        }
      };
      axios.get('/api/book', requestOptions
      ).then(res => {
        this.books = [];
        console.log(res.data)
        let json = JSON.parse(JSON.stringify(res.data.books));
        if (json.length != 0) {
          this.showQuery = true;
        } else {
          this.showQuery = false;
        }
        for (let entry in json) {
          this.books.push(json[entry])
        }
      })
      .catch(err => {
        console.log(err);
      });
    },
    initiateBooleans(){ //initiate boolean array with false values
      for (let book in this.books) this.showRecommendations[book._id] = false
    }
  }
}
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI',
  Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  box-sizing: border-box;
  margin-bottom: 5%;
}

.search-button {
  position:inherit;
  padding: 9px 25px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
    margin: 8px 0;
    transition: width 0.4s ease-in-out;
    background-color: white;
    background-position: 10px 10px;
    background-repeat: no-repeat;
    border: 3px solid #797979;
    height: 60px;
    border-radius: 5px 5px 5px 5px;
    outline: none;
    color: #4c4c4c;
    cursor: pointer;

  }
  .search-button:hover {
    background-color: rgba(172, 172, 172, 0.6); /* Green */
    color: white;
  }
.form {
  font-size: 24px;
  width: 50%;
  padding: 12px 20px;
  margin: 8px 0;
  box-sizing: border-box;
  transition: width 0.4s ease-in-out;
  background-color: white;
  background-position: 10px 10px;
  background-repeat: no-repeat;
    border: 3px solid #797979;
    margin-right: 15px;
    height: 60px;
    border-radius: 5px 5px 5px 5px;
    outline: none;
    color: #4c4c4c;
}

.container {
  max-width: 1500px;
  margin: 30px auto;
  overflow: auto;
  text-align: center;
  min-height: 200px;
  padding: 60px;
  border-radius: 5px;
  box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.1);
}
.list-container {
  max-width: 1500px;
  margin: 30px auto;
  overflow: auto;
  text-align: center;
  padding: 60px;
  border-radius: 5px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);

}

.list-entry {
  width: 80%;
  margin: 10px auto;
  overflow: auto;
  text-align: center;
  padding: 15px;
  border-radius: 2px;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
  column-count: 2;
  flex-flow: column wrap;
}

.text-link.span {
  background: none repeat scroll 0 0 #F8F8F8;
  border: 5px solid #DFDFDF;
  color: #717171;
  font-size: 13px;
  height: 30px;
  letter-spacing: 1px;
  line-height: 30px;
  margin: 0 auto;
  position: relative;
  text-align: center;
  text-transform: uppercase;
  top: -80px;
  left:-30px;
  display:none;
  padding:0 20px;
}
.text-link:hover {
  font-weight: 900;
}


.avatar{
  cursor: pointer;
  position:relative; /* must have this */

}

.avatar .tooltiptext {
  visibility: hidden;
  position: relative;
  width: 140px;
  padding: 15px 10px;
  border-radius: 4px;
  text-align: center;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);

}
.avatar:hover .tooltiptext {
  cursor: pointer;
  visibility: visible;
}

* {
  box-sizing: border-box;
}

</style>
