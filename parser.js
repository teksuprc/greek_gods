
const path = require('path');

const fs = require('fs-extra');
const request = require('request-promise');
const { Client, ConnectionPool } = require('@elastic/elasticsearch');
const { of, from, EMPTY  } = require('rxjs');
const { map, delay, tap, filter, flatMap, concatMap, catchError } = require('rxjs/operators');


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

const basedir = path.resolve(__dirname);
const outputdir = path.join(basedir, 'data/output');
const outputdir1 = path.join(basedir, 'data/output1');
const outputdir2 = path.join(basedir, 'data/output2');
const default_port = 9200;

const colors = [
    [1.0, 0.0, 0.0, 1.0],
	[0.0, 1.0, 0.0, 1.0],
	[0.0, 0.0, 1.0, 1.0],
	[1.0, 1.0, 0.0, 1.0],
	[1.0, 0.0, 1.0, 1.0],
	[0.0, 1.0, 1.0, 1.0],
    [1.0, 0.5, 0.0, 1.0],
    [0.09, 0.79, 0.58, 1.0],
    [0.22, 0.22, 0.22, 1.0],
    [0.34, 0.0, 0.36, 1.0],
    [0.0, 0.6, 0.2, 1.0],
    [0.36, 0.20, 0.0, 1.0],
    [1.0, 0.8, 0.6, 1.0],
    [0.42,0.55,0.14,1.0],
	[0.85,0.694,0.05,1.0],	// marines = #cd9b1d goldenrod3 
	[0.0,0.0,0.501,1.0],	// navy = #000080 navy blue 
	[0.529,0.807,1.0,1.0],	// air force = #87ceff sky blue 
	[0.258,0.105,0.454,1.0],	// civil service = #461B7E purple monster  [0.274,0.105,0.494,1.0]
];

class Node {
    constructor(id, uid, n, c) {
        this.id = id;
        this.g = uid;
        this.n = n;
        this.s = 20;
        this.c = c;
        this.t = 'circle';
        this.vf = '';
        this.vt = '';
        this.dm = '';
    }
};

class Link {
    constructor(g, f, t) {
        this.g = id;
        this.f = this.fg = f;
        this.t = this.tg = t;
        this.l = 'OTHER';
        this.vf = '';
        this.vt = '';
        this.dm = '';
    }
};


let nodes = [];
let node_ctr = 0;
let links = [];
let link_ctr = 0;

let ctr = 1;
let total_doc_places = 0;
let total_meta_places = 0;
let total_norm_places = 0;
let total_doc_langs = 0;
let total_meta_langs = 0;
let total_norm_langs = 0;
let filename = '';


const getColor = function(type) {
    let color = colors[0];
    switch(type) {
        case 'fbgraph_comment':
            color = colors[0];
            break;
        case 'fbgraph_post':
            color = colors[1];
            break;
        case 'telegram_history':
            color = colors[2];
            break;
        case 'telegram_stream_message':
            color = colors[3];
            break;
        case 'tweet_traptor':
            color = colors[4];
            break;
        case 'vk_album':
            color = colors[5];
            break;
        case 'vk_comment':
            color = colors[6];
            break;
        case 'vk_group':
            color = colors[7];
            break;
        case 'vk_photo':
            color = colors[8];
            break;
        case 'vk_post':
            color = colors[9];
            break;
        case 'vk_user':
            color = colors[10];
            break;
        default:
            color = colors[0];
    }
    return color;
};

const buildDoc = function(data) {
    let doc = {};
    doc.uid = data.uid;
    doc.type = data.type;
    doc.system_timestamp = '' + data.system_timestamp;
    doc.doc = doc.meta = doc.norm = {};

    let total_places = 0;
    doc.doc = data.doc.geo_registration;
    doc.meta = data.meta.geo_registration;
    doc.norm = data.norm.geo_registration;
    doc.author = data.norm.author;

    if(doc.doc.places.length > 0)
        total_places += doc.doc.places.length;

    if(doc.meta.places.length > 0)
        total_places += doc.meta.places.length;

    if(doc.norm.places.length > 0)
        total_places += doc.norm.places.length;

    doc.total_places = total_places.length;

    switch(data.type) {
        case 'fbgraph_comment':
        case 'fbgraph_post':
            doc.doc.timestamp = data.doc.timestamp;
            break;
        case 'telegram_history':
        case 'telegram_stream_message':
        case 'vk_comment':
        case 'vk_photo':
        case 'vk_post':
            doc.doc.timestamp = data.doc.date;
            break;
        case 'tweet_traptor':
            doc.doc.timestamp = data.doc.timestamp_ms;
            break;
        case 'vk_album':
            doc.doc.timestamp = data.doc.created;
            break;
        case 'vk_group':
        case 'vk_user':
            doc.doc.timestamp = "null"
            break;
        default:
            doc.doc.timestamp = "null"
    }

    return doc;
};

const sendPut = async function(index, uid, data) {
    let opt = {
        method: 'PUT',
        uri: `http://localhost:${default_port}/${index}/_doc/${uid}`,
        body: data,
        json: true
    };
    request(opt).then(r => console.log('*')).catch(e => console.log(`request error - ${e}`));
};

const indexData = async function(index, uid, data) {  
    try {
        await client.index({
            index: index,
            id: uid,
            body: data
        });
    }
    catch(e) {
        console.log(`index error - ${e}`);
    }
};

const loadData_to_ESIndex = (j) => {
    console.log(`processing document: uid [${j.uid}] count [${ctr++}] filename [${filename}]`);
    let document = { uid: j.uid, system_timestamp: j.system_timestamp, type: j.type, filename: filename };

    indexData('document', j.uid, document);
    indexData('doc', j.uid, j.doc.geo_registration);
    indexData('meta', j.uid, j.meta.geo_registration);
    indexData('norm', j.uid, j.norm.geo_registration);
    indexData('user', j.uid, {"author": j.norm.author});
    return j;
};

const loadData = () => {
    fs.readdir(outputdir,(err, files) => {
        if(err) {
            console.log(`failed to read files from basedir [${basedir}] - ${err}`);
            return;
        }

        let ctr = 0;
        for(filename of files) {
            console.log(`processing file [${filename}]`);
            ctr++;

            // read the json
            const json_file = `${outputdir}/${filename}`;
            fs.readJson(json_file)
                .then(j => {
                    let document = {
                        uid: j.uid,
                        system_timestamp: j.system_timestamp,
                        type: j.type,
                        filename: filename,
                        row: ctr
                    };

                        console.log(`processing document [${j.uid}]`);
                        indexData('document', j.uid, document);
                        indexData('doc', j.uid, j.doc.geo_registration);
                        indexData('meta', j.uid, j.meta.geo_registration);
                        indexData('norm', j.uid, j.norm.geo_registration);
                        if(j.norm.author)
                            indexData('user', j.uid, {"author": j.norm.author});
            })
            .catch(err => {
                console.log(`failed to read json file: ${err}`);
            });
        }
    });
};

const get_places_stats = (j) => {
    console.log(`processing document: uid [${j.uid}] count [${ctr++}] filename [${filename}]`);
    total_doc_places += j.doc.geo_registration.places.length;
    total_meta_places += j.meta.geo_registration.places.length;
    total_norm_places += j.norm.geo_registration.places.length;

    let stat = {
        filename: filename,
        type: j.type,
        doc: {
            places: j.doc.geo_registration.places.length
        },
        meta: {
            places: j.meta.geo_registration.places.length
        },
        norm: {
            places: j.norm.geo_registration.places.length
        }
    };
    return stat;
};

const get_languages_stats = (j) => {
    console.log(`processing document: uid [${j.uid}] count [${ctr++}] filename [${filename}]`);
    total_doc_langs += j.doc.geo_registration.detected_languages.length;
    total_meta_langs += j.meta.geo_registration.detected_languages.length;
    total_norm_langs += j.norm.geo_registration.detected_languages.length;

    let stat = {
        filename: filename,
        type: j.type,
        doc: {
            langs: j.doc.geo_registration.detected_languages
        },
        meta: {
            langs: j.meta.geo_registration.detected_languages
        },
        norm: {
            langs: j.norm.geo_registration.detected_languages
        }
    };
    return stat;
};

const read_places_stats = () => {
    let statsfile = `${outputdir}/places_stats.json`;
    let stats = {};
    let wstream = fs.createWriteStream(statsfile, {encoding: 'utf-8'});
    wstream.write('{\n\t"stats": [\n');

    from(fs.readdir(outputdir1)).pipe(
        flatMap(files => files),
        concatMap(file => {
            filename = file;
            return from(fs.readJson(`${outputdir1}/${file}`)).pipe(delay(2));
        }),
        map(j => get_places_stats(j)),
        map(stat => wstream.write(`\t\t${JSON.stringify(stat)},\n`)),
        catchError(err => {
            console.log('**** error caught ****', err);
            return of(EMPTY)
        })
    )
    .subscribe(
        () => {},
        (err) => {console.log(err)},
        () => {
            console.log('complete');
            wstream.write('\t],\n');
            wstream.write(`"total_doc_places": ${total_doc_places},\n`);
            wstream.write(`"total_meta_places": ${total_meta_places},\n`);
            wstream.write(`"total_norm_places": ${total_norm_places}\n`);
            wstream.write('}');
            wstream.end();
        },
    );
};

const read_languages_stats = () => {
    let statsfile = `${outputdir}/langs_stats.json`;
    let stats = {};
    let wstream = fs.createWriteStream(statsfile, {encoding: 'utf-8'});
    wstream.write('{\n\t"stats": [\n');

    from(fs.readdir(outputdir1)).pipe(
        flatMap(files => files),
        concatMap(file => {
            filename = file;
            return from(fs.readJson(`${outputdir1}/${file}`)).pipe(delay(2));
        }),
        map(j => get_languages_stats(j)),
        map(stat => wstream.write(`\t\t${JSON.stringify(stat)},\n`)),
        catchError(err => {
            console.log('**** error caught ****', err);
            return of(EMPTY)
        })
    )
    .subscribe(
        () => {},
        (err) => {console.log(err)},
        () => {
            console.log('complete');
            wstream.write('\t],\n');
            wstream.write(`"total_doc_langs": ${total_doc_langs},\n`);
            wstream.write(`"total_meta_langs": ${total_meta_langs},\n`);
            wstream.write(`"total_norm_langs": ${total_norm_langs}\n`);
            wstream.write('}');
            wstream.end();
        },
    );
};


let obj_ctr = 1; // 10360
const read_large_json = () => {
    let wstream = fs.createWriteStream(`${outputdir}/apollo_example_data.jsonl`, {encoding: 'utf-8'});
    fs.readJson(path.join(basedir, 'data/samples/apollo_example_data.json'))
        .then(jlob => {
            for(let i of Object.keys(jlob)) {
                console.log(i);
                //fs.writeJsonSync(`${outputdir2}/apollo_example_data_${i}.json`, jlob[i]._source);
                wstream.write(`${JSON.stringify(jlob[i]._source)}\n`);
            }
            wstream.end();
        });
};

console.log('=======================================================================');
console.log('processing started');
console.log('=======================================================================');

//loadData2();
//read_places_stats();
//read_languages_stats();
read_large_json();

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
