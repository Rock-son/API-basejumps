'use strict'
var express = require("express"),
    path = require("path"),
    fs = require("fs"),
    timestamp = require("./timestamp/timestamp"),
    requestHeader = require("./request_header/requestHeader"),
    urlShortener = require("./url_shortener/urlShortener"),
    imageSearch = require("./image_search/imageSearch"),
    metadata = require("./file_metadata/metadata"),
    port = process.env.PORT || 3000,
    helmet = require("helmet"),
    csp = require("helmet-csp"),
    morgan = require('morgan'),
    accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'}), // writable stream - for MORGAN logging

    app = express();
    process.env.NODE_ENV = "production";

    // SECURITY middleware (Helmet, Helmet-csp)
    app.use(helmet({dnsPrefetchControl: {allow: true}}));

    app.use(csp({
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
    
    app.use(morgan('combined', {stream: accessLogStream}));
    app.use(express.static(path.join(__dirname, "./public/")));
    app.use("/timestamp", timestamp);
    app.use("/request-header", requestHeader);
    app.use("/url-shortener", urlShortener);
    app.use("/image-search", imageSearch);
    app.use("/metadata", metadata);

    // logging (Helmet-csp) CSP blocked requests
    app.post("/report-violation", function (req, res) {
        if (req.body) {
            console.log('CSP Violation: ', req.body)
        } else {
            console.log('CSP Violation: No data received!')
        }

        app.status(204).end()
        })

    app.listen(port, () => console.log("Listening on port " + port))