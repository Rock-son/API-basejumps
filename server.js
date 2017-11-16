'use strict'
var express = require("express"),
    path = require("path"),
    metadata = require("./file_metadata/metadata"),
    port = process.env.PORT || 3000,
    app = express();

    app.use(express.static(path.join(__dirname, "./public/")));
    app.use("/metadata", metadata);


    app.listen(port, () => console.log("Listening on port " + port))