# DAAR Final project - Book search engine (choice A)
### Carlo Segat, Do Duc Huy, Patryk Fussek
### Fall semester 2021
---
### Setup

**Requirements**:
- nodejs
- express
- elasticsearch

**Install app**:
1. `git clone <this project>`
2. `yarn`

**Run backend**:

in root directory, first install the dependencies by `yarn install` and then run `yarn run dev` in terminal

**Run frontend**:

in 'elastic_front' directory, first install the dependencies by `yarn install`, then run `yarn vue-cli-service serve` in terminal. Make sure that yarn is the package manager for this folder as well. Then you can visit `localhost:8080/` to try the client application.

**Run ES (docker)**:

0. Install docker and docker-compose
1. `cd docker`
2. `docker-compose up -d`
3. it might be necessary to change your system memory settings: `sysctl -w vm.max_map_count=262144`

**Backend API**

GET - search for text or RegEx in the library
> http://localhost:3000/api/book

- parameters:
    - search = query_text [string]
    - regex = True | False [boolean]

**Download books from Guthenberg**

This command will download books and their metadata from [Gutendex](https://gutendex.com/).
At the moment the script browse through 100 pages of books which results in downloading around 1700 books.
There is also a filter which allows only book with the length of 10 100 and 100 000 words.

`node book_scraper.js`