var express = require("express"),
    MongoClient = require("mongodb").MongoClient,
    path = require("path"), 
    dbUrl = process.env.DBLINK,
    collection = "url_shortener",
    maxId = 1,

    app = express.Router();

// middleware
app.use(express.static(path.join(__dirname, "/public")));  //app.use(require('stylus').middleware(path.join(__dirname + '/public')))

// NEW URL
app.get('/new/*', async function(req, res) {
    var url = req.url.replace(/\/new\//, "");
    
    if (/^(?:https?\:\/\/[^\.]|www\.(?=[a-zA-Z0-9]))((\.)?[\w\-\w])+(\.[a-zA-Z0-9]{2,3}|\.[a-zA-Z0-9]{2,3}(?=\/)[\/\w\-\p{L}\p{M}]*[^\-\_\:]*)$/.test(url)) { // check validity of internet domain address
        //CONNECT
        const client = new MongoClient(dbUrl);
        await client.connect()
    
        const db = client.db("freeCodeCamp");
        db.collection(collection).find(
            {url: {$eq: url}},              // first parameter: find
            {url: 1, url_nr: 1, _id: 0}     // second parameter: return values
        
        ).toArray(function(error, documents) {
            if (error) throw error;
            if (documents.length) {
                res.set({status: 200, 'content-type': 'text/html' });
                res.send(JSON.stringify({"original_url": documents[0].url,
                                        "short_url":"<a href='https://fcc-api-basejumps-roky.herokuapp.com/url-shortener/" + documents[0].url_nr + "'>" + 
                                            "https://fcc-api-basejumps-roky.herokuapp.com/url-shortener/" + documents[0].url_nr +"</a>"}));
                client.close();
            } else {
            //OR INSERT if not found
                db.collection(collection).find().sort({url_nr:-1}).limit(1).toArray(function(err, data) {
                    if (error) throw error;
                    maxId = data.length ? data[0].url_nr : 1000;
                    maxId++;                
                    insertDB(client, db, collection, maxId, url, res);
                });
            }                
        });
    } else {
        res.set({status: 200, 'content-type': 'application/json' });
        res.send(JSON.stringify({"error":"Wrong url format, make sure you have a valid protocol and real site."}));
    }
});

// EXISTING SHORT URL
app.get('/:id', async function(req, res) {
       
    var url_nr = 0;
    //IF PASSED STRING IS A NUMBER
    if (url_nr = parseInt(req.params.id)) {
        const client = new MongoClient(dbUrl);
        await client.connect()
    
        const db = client.db("freeCodeCamp");
        db.collection(collection).find(
            {url_nr: {$eq: url_nr}},       // first parameter: find
            {url: 1, url_nr: 1, _id: 0}     // second parameter: return values
        ).toArray(function(error, documents) {
            if (error) throw error;
            if (documents.length) {
                res.redirect(documents[0].url);
                client.close();
            } else {
                res.set({status: 200, 'content-type': 'application/json' });
                res.end(JSON.stringify({"error":"This url is not in the database."}));
                client.close();
            }
        });
    } else {
        res.set({status: 200, 'content-type': 'application/json' });
        res.send(JSON.stringify({"error":"Wrong path!"}));
    }
});

function insertDB(client, db, collection, maxUrlNr, url, res) {

    //INSERT
    db.collection(collection).insert({
        url_nr: maxUrlNr < 1000 ? 1000 : +maxUrlNr,
        url: url,
        time: new Date()
    }, function(error, data) {
        if (error) throw error;
        res.set({status: 200, 'content-type': 'text/html' });
        res.send(JSON.stringify({"original_url": url,
                                "short_url":"<a href='https://fcc-api-basejumps-roky.herokuapp.com/url-shortener/" + maxUrlNr + "'>" + 
                                        "https://fcc-api-basejumps-roky.herokuapp.com/url-shortener/" + maxUrlNr +"</a>"}));
    });
    client.close();
}

module.exports = app;