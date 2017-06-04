const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const engines = require('consolidate');
const cors = require('cors');
const app = express();
const Bing = require('node-bing-api')({
  accKey: "5f7c9feab4c74373a752bd80cae27560" //8ea3513505024748af075bec3c87d105 会过期
});
app.set('views', __dirname + '/views');
app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.use(cors());

app.get('/', (req, res, next) => {
  res.render('instruction');
});


app.get('/api/imagesearch/:seachval(*)', (req, res, next) => {
  let searchval = req.params.seachval;
  let offset = req.query.offset;
  console.log(offset);

  const url = 'mongodb://localhost:27017/searchrecord'
  MongoClient.connect(url, (err, db) => {
    if (err) {
      console.log(err)
    } else {
      console.log('successfully connect to searchrecord database')
      db.collection('record').insert({
        'term': searchval,
        'when': new Date().toLocaleString()
      });
    }
    db.close()
  });



  //use bing to search
  Bing.images(searchval, {
    top: 10, // Number of results (max 50)
    skip: offset // Skip first 3 result
  }, function(error, rez, body) {
    if (error) {
      console.log(error)
    } else {
      let output = [];
      for (let i = 0; i < 10; i++) {
        output.push({
          "url": body.value[i].contentUrl,
          "snippet": body.value[i].name,
          "thumbnail": body.value[i].thumbnailUrl,
          "context": body.value[i].hostPageUrl
        });
      }
      res.send(output);
    }
  });
});

app.get('/api/latest/imagesearch/', (req, res, next) => {
  const url = 'mongodb://localhost:27017/searchrecord';
  MongoClient.connect(url, (err, db) => {
    if (err) {
      console.log(err);
    } else {
      console.log('connect to db')
      db.collection("record").find({}).toArray((err, docs) => {
        if (err) {
          console.log(err)
        } else if (docs.length === 0) {
          res.send('Have not find any record')
        } else {
          let output = [];
          for (let i = 0; i < docs.length; i++) {
            output.push({
              "term": docs[i].term,
              "When": docs[i].when
            });
          }

          res.json(output.reverse());
        }
        db.close();
      });
    }
  });

});

const server = app.listen(3000, () => {
  console.log('server is listening to port %s', server.address().port)
});
