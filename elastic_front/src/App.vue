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
        <input type="checkbox" id="RegEx" value="Enable RegEx" v-on:click="showAdvancedSearch = !showAdvancedSearch"/>
        <label for="RegEx">Enable RegEx Search</label>
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
          <img  :src=getImg(book._source.formaturi) @click=getTxtUri(book._source.formaturi)>
          <span class="tooltiptext">Click to open the book in new tab !</span>
        </div>
          <div>Accuracy: {{ book._score }}</div>
          Title: <h3>{{ book._source.title.toString() }}</h3>
          Author: <h3>{{ book._source.author.toString() }}</h3>
          Subject: <div>{{ book._source.subject.toString() }}</div>
          <p>Language:</p>
          <img :alt= book._source.language.toString()
              :src=getFlagUrl(book._source.language) style="max-width: 10%; height: auto;"/>
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
      showAdvancedSearch: false
    }
  },
  methods: {

                    // async handleFileUpload() {
                    //   if (this.$refs.file.files[0].size / 1024 / 1024 < 5) {
                    //     this.myFile = this.$refs.file.files[0];
                    //   } else {
                    //     alert('Maximum file size is 5 MB! Your file size is ' + (Math.round(this.$refs.file.files[0].size / 1024 / 1024 * 100) / 100) + "MB");
                    //     location.reload();
                    //   }
                    // },
                    // async submitApplication() {
                    //   if (this.myFile) {
                    //     var data = new FormData();
                    //     data.append('firstName', this.firstName);
                    //     data.append('lastName', this.lastName);
                    //     data.append('cvFile', this.myFile);
                    //
                    //     var config = {
                    //       method: 'post',
                    //       url: '/api/cv/',
                    //       data: data
                    //     };
                    //
                    //     axios(config)
                    //         .then(function (response) {
                    //           console.log(JSON.stringify(response.data));
                    //         })
                    //         .catch(function (error) {
                    //           console.log(error);
                    //         });
                    //   } else {
                    //     window.alert("Please select a file to upload !");
                    //   }
                    //
                    // },
    getImg(uriArray) {
      return uriArray.find(uri => uri.includes("medium.jpg"))
    },
    getTxtUri(uriArray) {
      window.open(uriArray.find(uri => uri.includes(".txt")))
    },
    getFlagUrl(language){
      let flagUrl
      if (language.toString() === "en"){
        flagUrl = "http://purecatamphetamine.github.io/country-flag-icons/3x2/GB.svg"
      } else flagUrl = "http://purecatamphetamine.github.io/country-flag-icons/3x2/" + language.toString().toUpperCase() + ".svg"
      return flagUrl
    },
    queryDatabase() {
      //todo  // here in the GET URL will come the this.query variable from the input form, f.ex "Java"
      let elasticQuery = this.query
      if (this.showAdvancedSearch == true) elasticQuery += "REGEX";
      axios.get('/api/book?search=' + elasticQuery,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
      ).then(res => {
        this.showQuery = true;
        this.books = [];
        let json = JSON.parse(JSON.stringify(res.data.book));
        for (let entry in json) {
          this.books.push(json[entry])
        }
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
