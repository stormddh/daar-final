require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const winston = require('winston');


const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "--" + file.originalname);
    }
});
const upload = multer({storage: storage});

const { format } = require('logform');
const { logstash, combine, timestamp } = format;

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({
            format: combine(timestamp(), logstash()),
            filename: './logs/combined.log'
        }),
        new winston.transports.Console({
            format: winston.format.cli(),
        })
    ],
});

const {Client} = require('@elastic/elasticsearch');
const elasticClient = new Client({
    node: process.env.ES,
});

elasticClient.ping(
    {
        requestTimeout: 30000,
    },
    function (error) {
        if (error) {
            console.error('Elasticsearch cluster is down!');
            console.error(error);
        } else {
            console.log('Everything is okay.');
        }
    }
);

async function setup_index () {
    await elasticClient.indices.create({
      index: 'cv_index',
      body: {
        mappings: {
          properties: {
            first_name: { type: 'keyword' },
            last_name: { type: 'keyword' },
            file_name: { type: 'text' },
            content: { type: 'text' },
          }
        }
      }
    }, { ignore: [400] })
}

setup_index().catch(console.log)

router.use((req, res, next) => {
    elasticClient.index({
        index: 'logs',
        body: {
            url: req.url,
            method: req.method,
        }
    })
    .then(res => {
        console.log('Logs indexed');
    })
    .catch(err => {
        console.log(err);
    })
    next();
});

router.get('/cv/:file', (req, res) => {
    const file_name = req.params.file
    const cv_path = "uploads/" + file_name

    if (fs.existsSync(cv_path)) {
        res.contentType("application/pdf");
        fs.createReadStream(cv_path).pipe(res);
    } else {
        res.status(500);
        elk_logging('File not found');
        res.send('File not found');
    }
});

router.get('/cv', (req, res) => {
    if (req.query.search) {
        elasticClient.search({
            index: 'cv_index',
            body: {
                query: {
                    match: {
                        content: req.query.search,
                    }
                }
            }
        })
        .then(resp => {
            return res.status(200).json({
                cv: resp.body.hits.hits,
            });
        })
        .catch(err => {
            return res.status(500).json({
                msg: 'SEARCH: Error',
                error: err,
            });
        });
    } else {
        return res.status(200).json({
            msg: 'No result',
        });
    }
});

const cleanUpDirectory = async (req) => {
    setTimeout(function () {
        const fs = require("fs");
        const pathToFile = req.file.path;

        fs.unlink(pathToFile, function (err) {
            if (err) {
                throw err;
            }
        })
    }, 100);
}

const elk_logging = (message) => {
    if (process.env.NODE_ENV == "development") {
        console.log(message);
    }
}

module.exports = router;