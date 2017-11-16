var express = require("express"),
    path = require("path"),
    
    requestHeader = express.Router();

requestHeader.get("/", function(req, res) {
    
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        language = /^.*?(\,)/.exec(req.headers["accept-language"])[0].replace(/\,/, ""),
        os = /\((.*)\)/.exec(req.headers["user-agent"])[0].replace(/\(/, "").replace(/\)/, "");

    res.set({status: 200, 'content-type': 'text/plain' });
    res.send(JSON.stringify({ip: ip, language: language, software: os}));    
});

module.exports = requestHeader;