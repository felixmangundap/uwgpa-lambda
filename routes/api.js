var express = require('express');
var router = express.Router();
const AWS = require('aws-sdk');
const fs = require('fs');
const bluebird = require('bluebird');
const moment = require('moment');
const multiparty = require('multiparty');

const { parsePdf } = require('../functions/parsePdf');

AWS.config.setPromisesDependency(bluebird);
const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});

const uploadFile = (buffer, key) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Body: buffer,
    ContentType: 'application/pdf',
    Key: `${key}.pdf`
  };
  return s3.putObject(params).promise();
};

/* POST transcript pdf */
router.post('/transcript', function(req, res, next) {
  const form = new multiparty.Form();
  form.parse(req, async (error, fields, files) => {
    if (error) throw new Error(error);
    try {
      const path = files.file[0].path;
      const buffer = fs.readFileSync(path);
      const key = moment().format('X');
      const data = await uploadFile(buffer, key);
      const payload = {
        key,
        data
      }
      return res.status(200).send(payload);
    } catch (error) {
      return res.status(400).send(error);
    }
  });
});

/* GET transcript data */
router.get('/transcript/:key', function(req, res, next) {
  const key = req.params.key;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `${key}.pdf`
  };

  s3.getObject(params, async function(err, data) {
    if (err){
      return res.status(400).send(err);
    }
    else{
      const transcript = await parsePdf(data.Body);
      s3.deleteObject(params, function(err, data) {
        if (err) {
          return res.status(400).send(err);
        }
        else {
          return res.status(200).send(transcript);
        }
      });
    }
  });
});

/* GET transcript data */
router.get('/test/:key', function(req, res, next) {
  const key = req.params.key;
  return res.status(200).send(`HELLO! ${key}`);
});

module.exports = router;
