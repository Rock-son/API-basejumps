"use strict"
var express = require("express"),
    path = require("path"),
    fs = require("fs"),
    bodyParser = require("body-parser"),
    upload = require("multer")({dest: "file_metadata/uploads/", limits: 150000}),
    file = upload.single('fileUpload'), // name must be the same as "name" in the form field! - for security resons!!!
    port = process.env.PORT || 3000,

    
    app = express.Router();

    app.use(bodyParser.json({type: ['json', 'application/csp-report']}));
    app.use(express.static(path.join(__dirname, "public")));

    // REQUESTS
    app.post("/file-upload", file, function(req, res) {
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

module.exports = app;