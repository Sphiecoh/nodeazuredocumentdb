
var DocumentDBClient = require('documentdb').DocumentClient;
var nconf = require('nconf');
 
// tell nconf which config file to use
nconf.env();
nconf.file({ file: 'server/config/config.json' });

var host = nconf.get("HOST");
var authKey = nconf.get("AUTH_KEY");
var databaseId = nconf.get("DATABASE");
var collectionId = nconf.get("COLLECTION");
 var client = new DocumentDBClient(host, { masterKey: authKey });
// query the provided collection for all non-complete items
var listItems = function (collection, callback) {
    client.queryDocuments(collection._self, 'SELECT * FROM root').toArray(function (err, docs) {
        if (err) {
            throw (err);
        }
 
        callback(docs);
    });
};
 
// if the database does not exist, then create it, else return the database object
var readOrCreateDatabase = function (callback) {
    client.queryDatabases('SELECT * FROM root r WHERE r.id="' + databaseId + '"').toArray(function (err, results) {
        if (err) {
            // some error occured, rethrow up
            throw (err);
        }
        if (!err && results.length === 0) {
            // no error occured, but there were no results returned 
            // indicating no database exists matching the query            
            client.createDatabase({ id: databaseId }, function (err, createdDatabase) {
                callback(createdDatabase);
            });
        } else {
            // we found a database
            callback(results[0]);
        }
    });
};
 
// if the collection does not exist for the database provided, create it, else return the collection object
var readOrCreateCollection = function (database, callback) {
    client.queryCollections(database._self, 'SELECT * FROM root r WHERE r.id="' + collectionId + '"').toArray(function (err, results) {
        if (err) {
            // some error occured, rethrow up
            throw (err);
        }           
        if (!err && results.length === 0) {
            // no error occured, but there were no results returned 
            //indicating no collection exists in the provided database matching the query
            client.createCollection(database._self, { id: collectionId }, function (err, createdCollection) {
                callback(createdCollection);
            });
        } else {
            // we found a collection
            callback(results[0]);
        }
    });
};
var getItem = function (collection, itemId, callback) {     
    client.queryDocuments(collection._self, 'SELECT * FROM root r WHERE r.id="' + itemId + '"').toArray(function (err, results) {
        if (err) {
            console.error(err);
            throw (err);
        }
 
        callback(results[0]);
    });
}

var updateItem = function (collection, itemId, callback) {
    //first fetch the document based on the id
    getItem(collection, itemId, function (doc) {
        //now replace the document with the updated one
        doc.status = "resolved";
        client.replaceDocument(doc._self, doc, function (err, replacedDoc) {
            if (err) {
                throw (err);
            }
 
            callback(replacedDoc);
        });
    });
}
 
 
exports.index = function(req, res) {
      readOrCreateDatabase(function (database) {
        readOrCreateCollection(database, function (collection) {
            listItems(collection, function (items) {
                res.json(items);
            });    
        });
    });
}

exports.findById = function(req,res)
{
    readOrCreateDatabase(function (params) {
        readOrCreateCollection(params, function(collection){
            getItem(collection,req.params.id,function(item){
                res.json(item);
            })
        })
    })
}

exports.updateDoc = function(req,res){}