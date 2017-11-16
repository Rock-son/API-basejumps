"use strict"
var express = require("express"),
    path = require("path"),
    fs = require("fs"),
    helmet = require("helmet"),
    csp = require("helmet-csp"),
    morgan = require('morgan'),
    bodyParser = require("body-parser"),
    accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'}), // writable stream - for MORGAN logging
    upload = require("multer")({dest: "uploads/", limits: 150000}),
    file = upload.single('fileUpload'), // name must be the same as "name" in the form field! - for security resons!!!
    port = process.env.PORT || 3000;

    
var metadata = express.Router();

// SECURITY middleware (Helmet, Helmet-csp)
metadata.use(helmet({dnsPrefetchControl: {allow: true}}));

metadata.use(csp({
  directives: {
    defaultSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com/'],
    styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com/'],
    imgSrc: ['img.com', 'data:'],
    sandbox: ['allow-forms', 'allow-scripts'],
    reportUri: '/report-violation' // set up a POST route for notifying / logging data to server
  },
  //report only will not block request (for debugging purposes)
    reportOnly: function (req, res) {
        if (req.query.cspmode === 'debug') {
            return true
        } else {
            return false
        }
    }
}));
// logging CSP blocked requests
metadata.use(bodyParser.json({type: ['json', 'application/csp-report']}));

// STATIC AND LOGGING middleware
metadata.use(express.static(path.join(__dirname, "public")));
metadata.use(morgan('combined', {stream: accessLogStream}));

// REQUESTS
metadata.post("/file-upload", file, function(req, res) {
    if (req.file) {
        var tmp_path = req.file.path,
            target_path = path.join(__dirname, "uploads", req.file.originalname),
            readStream = fs.createReadStream(tmp_path),
            dest = fs.createWriteStream(target_path);
        
        readStream.pipe(dest);
        readStream.on("error", function(err) {res.send({"error": err})});
        readStream.on("end", function() {
            var stats = fs.statSync(target_path);
            fs.unlinkSync(tmp_path);
            fs.unlinkSync(target_path);

            res.set({status: 200, "content-type":"application/json"});
            res.send({"size": stats.size })
           
        });
    } else {
        res.send("Error uploading file! Please try again.");
    }    
});

metadata.post("/report-violation", function (req, res) {
  if (req.body) {
    console.log('CSP Violation: ', req.body)
  } else {
    console.log('CSP Violation: No data received!')
  }

  metadata.status(204).end()
})

module.exports = metadata;