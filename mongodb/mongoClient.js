
const MongoClient = require('mongodb');


const connectionUrl = 'mongodb://root:example@localhost:27017';

const dbName = "greekgod";
let db = null;
let client = null;


const connect = async () => {
    try {
        client = await MongoClient.connect(connectionUrl, {

        });
        db = client.db(dbName);
        return db;
    }
    catch(err) {
        console.error(`db connection error - ${err}`);
    }
};

const upsert = async (id, data, coll) => {
    try {
        let res = await coll.updateOne(
            {"_id": id},
            {$set: data},
            {upsert: true});
        return res;
    }
    catch(err) {
        console.error(`failed to insert - ${err}`);
    }
};

const insert = async (data, coll) => {
    try {
        let res = await coll.insertOne(data);
        return res;
    }
    catch(err) {
        console.error(`failed to insert - ${err}`);
    }
};

const close = () => {
    if(client)
        client.close();
}


module.exports = {
    connect: connect,
    insert: insert,
    upsert: upsert,
    close: close
};