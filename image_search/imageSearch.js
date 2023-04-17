'use strict'

const express = require("express"),
      https = require("https"),
      path = require("path"),
      google = require("googleapis"),
      customsearch = google.customsearch('v1'),
      MongoClient = require("mongodb").MongoClient,
      port = process.env.PORT || 3000,
      API_ID = process.env.API_ID,
      API_KEY = process.env.API_KEY,
      dbUrl = process.env.DBLINK,
      collection = "img_search",

      app = express.Router();


app.use(express.static(path.join(__dirname, "public")));


app.get('/favicon.ico', function(req, res) {
    res.status(204);
});

app.get("/imagesearch", async function(req, res) {
    
    const client = new MongoClient(dbUrl);
    await client.connect()

    const db = client.db("freeCodeCamp");
    db.collection(collection).find({}, {_id: 0, term: 1, "search-time": 1}).sort({_id: -1}).limit(10)
        .toArray(function(error, documents) {
            if (error) throw error;
            if (documents.length) {
                res.set({status: 200, 'content-type': 'application/json' });
                res.send(JSON.stringify(documents));
                client.close();
            } else {
                res.set({status: 200, 'content-type': 'application/json' });
                res.send(JSON.stringify({"info": "No data in Database yet!"}));
                client.close();
            }
        });
    });

app.get("/*", async function(req, res) {
    
    var SEARCH = req.params[0].split(/\s/).join("+"),
        offset = req.query.offset || 1,
        //template = "https://www.googleapis.com/customsearch/v1?q=" + SEARCH + "&cx=" + encodeURIComponent(API_ID) + "&start=" + NUM + "&num=10&key=" + API_KEY,
        jsonRes = "";

    const client = new MongoClient(dbUrl);
    await client.connect()

    const db = client.db("freeCodeCamp");
    // INSERT new search into database
    db.collection(collection).insert(
        {
            term: SEARCH.split(/\+/).join(" "),
            "search-time": new Date()
        }
    );
    client.close();

    // set GOOGLEAPIS parameters and make a search request
    customsearch.cse.list({ cx: API_ID, q: SEARCH, auth: API_KEY, num: "10", start: offset }, function (err, resp) {
        if (err) {
            res.set({status: 200, "content-type": "application/json"});
            res.send(err);            
        } else {
            // Got the response from custom search
            console.log('Result: ' + resp.searchInformation.formattedTotalResults);
            if (resp.items && resp.items.length > 0) {
                res.set({status: 200, "content-type": "application/json"});
                res.send(formatData(resp.items));
            }
        }
    });

/*
    // GET data from SEARCH - SAME AS ABOVE!
    https.request(post_obj, function(response) {
        response.setEncoding('utf8');
        response.on("error", function(e) {console.error("There was a problem making a search request: " + e);})
        response.on("data", function(d) {jsonRes += d;})
        response.on("end", function() {            
            res.set({status: 200, "content-type": "application/json"});
            res.send(formatData(jsonRes));
            });
});*/
    
});


function formatData(json) {

    var resultJSON = json,
        result = {};

    if (typeof resultJSON !== "object" || !resultJSON) {return {"error":"No search data was returned!"};}

    resultJSON.forEach(function(item, index) {

        var url = ((((item.pagemap || {})["cse_image"] || {})[0] || [])["src"] || "No url found") ||
                  ((((item.pagemap || {})["metatags"]  || {})[0] || [])["og:image"] || "No url found")
                  (item || {})["link"],
            snippet = item.title || item.snippet || "No snippet found",
            thumbnail = (((item.pagemap || {})["cse_thumbnail"] || {})[0] || [])["src"] || "No thumbnail found!";

        result = Object.assign({}, result, {
                    [index] : { url: url,
                                snippet: snippet,
                                thumbnail: thumbnail,
                                context: item.link
                    }
        });
    });

    return result;
}

module.exports = app;