# DAAR Project 2 - Elastic search
### Do Duc Huy, Patryk Fussek
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

in 'elastic_front' directory, first install the dependencies by `yarn install`, then run `yarn vue-cli-service serve` in terminal. Make sure that yarn is the package manager for this folder as well

**Run ES (docker)**:

0. Install docker and docker-compose
1. `cd docker`
2. `docker-compose up -d`
3. it might be necessary to change your system memory settings: `sysctl -w vm.max_map_count=262144`

### API
GET - get title
> http://localhost:3000/api/articles/\<title\>

POST
> http://localhost:3000/api/articles

GET - search article
> http://localhost:3000/api/articles?search=\<keyword\>
