<template>
  <div class="container">
    <div>
      <h2>Search the Library database:</h2>
      <div>To browse through the books in Library, type in a searched phrase or author and a list of adequate
        books will be shown. F.ex "Victor Hugo" or "Odyssey"
      </div>
      <input class="form" type="text" v-model="query"/>
      <input class="search-button" type="submit" value="Search!" v-on:click="queryDatabase"/>
      <div>
        <input type="checkbox" id="RegEx" value="Enable RegEx" v-on:click="showAdvancedSearch = !showAdvancedSearch"/>
        <label for="RegEx">Enable RegEx Search</label>
          <div v-if=showAdvancedSearch>
            <div>
              <h2>Advanced Search:</h2>
              <div>On user input a string RegEx, the application
                returns : either a list of text documents whose index table contains a string S matching RegEx as regular expression (refer to Lecture 1 of UE DAAR for a formal definition of regular expressions); or a list of text documents
                containing a string S matching RegEx as regular expression
              </div>
            </div>
          </div>
      </div>
    </div>

    <b-tabs  content-class="mt-3" align="center">

    </b-tabs>

    <h2 v-if="showQuery"> List of books for given query: {{query}}</h2>

    <div class="list-container">
      <div class="list-entry" v-for="book in books" :key="book">
        <img class="avatar" :src="avatar">
        {{ book }}
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
    queryDatabase() {
      //todo  // here in the GET URL will come the this.query variable from the input form, f.ex "Java"
      if (this.showAdvancedSearch == true) this.query += "REGEX";
      axios.get('/api/book?search=' + this.query,
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
  max-width: 700px;
  margin: 30px auto;
  overflow: auto;
  text-align: center;
  min-height: 200px;
  padding: 60px;
  border-radius: 5px;
  box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.1);
}
.list-container {
  max-width: 700px;
  margin: 30px auto;
  overflow: auto;
  text-align: center;
  padding: 60px;
  border-radius: 5px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}
.list-entry {
  width: 50%;
  margin: 10px auto;
  overflow: auto;
  text-align: center;
  padding: 15px;
  border-radius: 2px;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
}
.avatar{
  max-width:8%;
  max-height:8%;

}
.upload {
  border: 1px solid #ccc;
  display: inline-block;
  cursor: pointer;
  font-size: 16px;
  align-content: center;
  width: 50%;
  padding: 12px 20px;
  margin: 8px 0;
  box-sizing: border-box;
  transition: width 0.4s ease-in-out;
  background-color: white;
  background-position: 10px 10px;
  background-repeat: no-repeat;
}
</style>
