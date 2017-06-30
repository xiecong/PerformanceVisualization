//The server file which query the mongodb and return the json objects to the front end.
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.argv[2] || 8888;
var MongoClient = require('mongodb').MongoClient;
var dburl = "mongodb://localhost:27017/codarvis";

http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);

    if (uri.substring(0, 10) == "/messages/"){
        var timestamps = uri.substring(10).split(":");
        query("messages",{timestamp:{$gte:parseInt(timestamps[0]),$lte:parseInt(timestamps[1])}},response);
    } else if (uri.substring(0, 8) == "/events/"){
        var timestamps = uri.substring(8).split(":");
        query("trace_events",{time:{$gte:parseInt(timestamps[0]),$lte:parseInt(timestamps[1])}},response);
    } else if (uri.substring(0, 10) == "/profiles/"){
        if(uri.substring(10) == "0"){
            query("timers",{},response);
        }else{
            query("counters",{},response);
        }
    } else {
        fs.exists(filename, function(exists) {
            if (!exists) {
                response.writeHead(404, {
                    "Content-Type": "text/plain"
                });
                response.write("404 Not Found\n");
                response.end();
                return;
            }
            if (fs.statSync(filename).isDirectory()) filename += '/index.html';
            fs.readFile(filename, "binary", function(err, file) {
                if (err) {
                    response.writeHead(500, {
                        "Content-Type": "text/plain"
                    });
                    response.write(err + "\n");
                    response.end();
                    return;
                }
                response.writeHead(200);
                response.write(file, "binary");
                response.end();
            });
        });
    }

}).listen(parseInt(port, 10));


function query(dbName, queryObj, response){
    MongoClient.connect(dburl, function(err, db) {
        if (err) throw err;
        db.collection(dbName).find(queryObj).toArray(function(err, result) {
            if (err) throw err;
            response.writeHead(200, {
                "Content-Type": "text/json"
            });
            //console.log(result);
            response.end(JSON.stringify(result));
            console.log("Get "+result.length+" documents from "+dbName);
            db.close();
        });
    });
}

console.log("Server running on http://localhost:" + port + "/");