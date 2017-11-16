'use strict'
var express = require("express"),
    path = require("path"),
    metadata = require("./file_metadata/metadata"),
    imageSearch = require("./image_search/imageSearch"),
    requestHeader = require("./request_header/requestHeader"),
    timestamp = require("./timestamp/timestamp"),
    port = process.env.PORT || 3000,
    app = express();

    process.env.NODE_ENV = "production";

    app.use(express.static(path.join(__dirname, "./public/")));
    app.use("/metadata", metadata);
    app.use("/image-search", imageSearch);
    app.use("/request-header", requestHeader);
    app.use("/timestamp", timestamp);

    app.listen(port, () => console.log("Listening on port " + port))