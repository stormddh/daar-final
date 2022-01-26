<template>
  <div class="container">
    <div>
      <h2>First Name</h2>
      <input class="form" type="text" v-model="firstName"/>
    </div>
    <div>
      <h2>Last Name</h2>
      <input class="form" type="text" v-model="lastName"/>
    </div>
    <div>
      <h2>CV file</h2>
      <input type="file" class="upload" id="file" accept=
          "application/msword, application/pdf" ref="file" v-on:change="handleFileUpload()"/>
    </div>
    <div>
      <h2>Submit</h2>
      <input class="button" type="submit" value="Submit!" v-on:click="submitApplication"/>
    </div>

    <div>
      <h2>Search the CV database:</h2>
      <div>To browse through the database of resumes, type in a desired skill or technology and a list of adequate
        applicants will be shown. F.ex "Java" or "Git"
      </div>
      <input class="form" type="text" v-model="query"/>
      <input class="search-button" type="submit" value="Search!" v-on:click="queryDatabase"/>
    </div>
    <h2 v-if="showQuery"> List of applicants for given query: {{query}}</h2>

    <div class="list-container">
      <div class="list-entry" v-for="applicant in applicants" :key="applicant">
        <img class="avatar" :src="avatar">
        {{ applicant._source.first_name }} {{ applicant._source.last_name }}
        <a :href="'/cv/' + applicant._source.file_name">PDF</a>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
import FormData from 'form-data';

export default {
  name: 'App',
  components: {},
  data() {
    return {
      firstName: '',
      lastName: '',
      myFile: '',
      query: '',
      applicants: [],
      avatar: require('./assets/default-avatar.png'),
      showQuery: false
    }
  },
  methods: {

    async handleFileUpload() {
      if (this.$refs.file.files[0].size / 1024 / 1024 < 5) {
        this.myFile = this.$refs.file.files[0];
      } else {
        alert('Maximum file size is 5 MB! Your file size is ' + (Math.round(this.$refs.file.files[0].size / 1024 / 1024 * 100) / 100) + "MB");
        location.reload();
      }
    },
    async submitApplication() {
      if (this.myFile) {
        var data = new FormData();
        data.append('firstName', this.firstName);
        data.append('lastName', this.lastName);
        data.append('cvFile', this.myFile);

        var config = {
          method: 'post',
          url: '/api/cv/',
          data: data
        };

        axios(config)
            .then(function (response) {
              console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
              console.log(error);
            });
      } else {
        window.alert("Please select a file to upload !");
      }

    },
    queryDatabase() {
      //todo  // here in the GET URL will come the this.query variable from the input form, f.ex "Java"
      axios.get('/api/cv?search=' + this.query,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
      ).then(res => {
        this.showQuery = true;
        this.applicants = [];
        let json = JSON.parse(JSON.stringify(res.data.cv));
        for (let entry in json) {
          this.applicants.push(json[entry])
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
