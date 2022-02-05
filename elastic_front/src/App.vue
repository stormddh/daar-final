<template>
  <div class="container">
    <div>
      <h2>Search the Library database:</h2>
      <p>To browse through the books in Library, type in a searched phrase or author and a list of adequate
        books will be shown. <br> F.ex "American", "La" (to get results in different languages), or "Odyssey"
      </p>
      <input class="form" type="text" v-model="query"/>
      <input class="search-button" type="submit" value="Search!" v-on:click="queryDatabase"/>
      <div>
        <div class="checkboxes">
          <input type="checkbox" id="RegEx" value="Enable RegEx" v-on:click="showAdvancedSearch = !showAdvancedSearch"/>
          <label for="RegEx">Enable RegEx Search</label>
  <!--          <input type="radio" id="Titles" value="Titles" v-on:click="showAdvancedSearch = !showAdvancedSearch"/>-->
  <!--          <label for="Titles">Search in titles   </label>-->
  <!--          <input type="radio" id="Content" value="Content" v-on:click="showAdvancedSearch = !showAdvancedSearch"/>-->
  <!--          <label for="Content">Search in content   </label>-->
        </div>
          <div v-if=showAdvancedSearch>
            <div>
              <h2>Advanced Search:</h2>
              <div>EXAMPLE REGEX QUERIES (for dev purp):
                <p>l.*y</p>
                <p>lov.*</p>
              </div>
            </div>
          </div>
      </div>
    </div>

    <h2 v-if="showQuery"> List of books for given query: {{query}}</h2>

    <div class="list-container">
      <div class="list-entry" v-for="book in books" :key="book">

        <div class="avatar" @hover="hover = true">
          <img  :src=getImg(book._source.formats) @click=getTxtUri(book._source.formats)
          style=" padding-top: 30px; margin-left:auto; margin-right:auto; display:block;">
          <span class="tooltiptext">Click to open the book in new tab !</span>
        </div>
        <div style="display: inline-block;">
          <h3>Accuracy: {{ book._score }}</h3>
          Title: <h3>{{ book._source.title}}</h3>
          Author: <h3>{{ book._source.authors.flatMap(a => a['name']).join(' ') }}</h3>
          Subject: <div>{{ book._source.subjects.join(' ') }}</div>
          <p>Language:</p>
          <img :alt= book._source.language
               :src=getFlagUrl(book._source.languages)
               style="height:30px; width:auto; max-width:500px;"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
// import FormData from 'form-data';

export default {
  name: 'App',
  components: {},
  data() {
    return {
      firstName: '',
      lastName: '',
      myFile: '',
      query: '',
      books: [],
      avatar: require('./assets/default-avatar.png'),
      showQuery: false,
        showAdvancedSearch: false,
        recommendations: {
          book: '',
          recommendations: []
        }
        // searchInTitles: false,
        // searchInContent: false
    }
  },
  methods: {
    getImg(uriArray) {
      const k = Object.keys(uriArray).find(uri => uri.includes("image"))
      let uri = uriArray[k].replace("small", "medium")
      return uri
    },
    getTxtUri(uriArray) {
      window.open(Object.values(uriArray).find(uri => uri.includes(".txt")))
    },
    getFlagUrl(languages){
      let flagUrl
      if (languages[0].toString() === "en"){
        flagUrl = "http://purecatamphetamine.github.io/country-flag-icons/3x2/GB.svg"
      } else flagUrl = "http://purecatamphetamine.github.io/country-flag-icons/3x2/" + languages[0].toString().toUpperCase() + ".svg"
      return flagUrl
    },
    queryDatabase() {
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
        this.showQuery = true;
        this.books = [];
        console.log(res.data)
        let json = JSON.parse(JSON.stringify(res.data.books));
        for (let entry in json) {
          this.books.push(json[entry])
        }
          this.recommendations = (JSON.parse(JSON.stringify(res.data.recommendations)))
          console.log(this.recommendations)
        console.log(res.data)
      })
      .catch(err => {
        console.log(err);
      });
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

.button {
  background-color: #118617; /* Green */
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
}

.search-button {
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
  /*.checkboxes{*/
  /*  column-count: 2;*/
  /*}*/
.avatar{
  /*max-width:8%;*/
  /*max-height:8%;*/

}

.avatar .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;
  position: absolute;
  z-index: 1;
}
.avatar:hover .tooltiptext {
  cursor: pointer;
  visibility: visible;
}
</style>
