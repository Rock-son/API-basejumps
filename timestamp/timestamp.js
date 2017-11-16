var express = require("express"),
    path = require("path"),
    
    timestamp = express.Router();

    timestamp.use(express.static(path.join(__dirname, "public/")));

timestamp.get("/*", function(req, res) {

    var formattedString = (req.url.slice(1).replace(/\%20/g, "")),
        options = {year: 'numeric', month: 'long', day: 'numeric'};
    
    res.set({status: 200, 'content-type': 'text/plain' });
    
    if(new Date().setSeconds(formattedString)) {
        res.send(JSON.stringify({unix: formattedString, natural: new Date(formattedString * 1000).toLocaleDateString("en-us", options)}));        
    } else if (Date.parse(formattedString)) {
        res.send(JSON.stringify({unix: Date.parse(formattedString) / 1000, natural: new Date(formattedString).toLocaleDateString("en-us", options)}));
    } else {
        res.send(JSON.stringify({unix: null, natural: null}));
    }  
});

module.exports = timestamp;