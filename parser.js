
const path = require('path');

const fs = require('fs-extra');
const request = require('request-promise');
const { of, from, EMPTY  } = require('rxjs');
const { map, delay, tap, filter, flatMap, concatMap, catchError } = require('rxjs/operators');

const mongo = require('./mongodb/mongoClient');


const basedir = path.resolve(__dirname);
const outputdir = path.join(basedir, 'data/output');
const outputdir1 = path.join(basedir, 'data/output1');
const outputdir2 = path.join(basedir, 'data/output2');
const apollodir = path.join(basedir, 'data/apollo');


const loadToDb = async (directory) => {
    try {
        let db = await mongo.connect();

        let documentsColl = db.collection('documents');
        let usersColl = db.collection('users');

        let filename = '';
 
        from(fs.readdir(directory)).pipe(
            flatMap(files => files),
            concatMap(file => {
                filename = file;
                console.log('reading file', file);
                return from(fs.readJson(`${directory}/${file}`)).pipe(delay(2));
            }),
            map(j => {
                let document = {system_timestamp: j.system_timestamp, type: j.type, filename: filename, author: j.norm.author };
                mongo.upsert(j.uid, document, documentsColl);
                //console.log('inserted document');
                return j;
            }),
            map(j => {
                let coll = db.collection('doc_' + j.type);
                mongo.upsert(j.uid, j.doc, coll);
                //console.log('inserted doc');
                return j;
            }),
            map(j => {
                let coll = db.collection('meta_' + j.type);
                mongo.upsert(j.uid, j.meta, coll);
                //console.log('inserted meta');
                return j;
            }),
            map(j => {
                let coll = db.collection('norm_' + j.type);
                mongo.upsert(j.uid, j.norm, coll);
                //console.log('inserted norm');
                return j;
            }),
            map(j => {
                let user = {author: j.norm.author};
                mongo.upsert(j.uid, user, usersColl);
                //console.log('inserted user');
                return j;
            }),
            catchError(err => {
                console.log('**** error caught ****', err);
                return of(EMPTY)
            })
        )
        .subscribe();
    }
    catch(err) {
        console.log(`failed to connect to mongodb - ${err}`);
    }
};


console.log('=======================================================================');
console.log('processing started');
console.log('=======================================================================');

loadToDb(apollodir);



/*
//const redisClient = require('./redis-client');
class MyConnectionPool extends ConnectionPool {
    markAlive(connection) {
        super.markAlive(connection);
    };
};

const client = new Client({
    node: 'http://localhost:9200',
    maxRetries: 5,
    requestTimeout:60000
});
*/

//loadData2();
//read_places_stats('apollo', apollodir);
//read_languages_stats('apollo', apollodir);
//read_large_json();

/*
Redis
----
redisClient.setAsync(j.uid, JSON.stringify(jdoc))
    .then((data) => {
        console.log('got data:', data);
        console.log(`saved document [${j.uid}] to redis`);    
    })
    .catch((err) => { 
        console.log(`error saving to database - ${err}`);
    });
*/
