const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8000;


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get('/', async (req, res) => {
    return res.status(200).json({"message": "Hello Worlds!"});
});


app.get('/keys', async (req, res) => {
    let keys = await redisClient.keysAsync('*');
    return res.status(200).json({"keys": keys});
});


app.get('/get/:key', async (req, res) => {
    const key = req.params.key;
    const data = await redisClient.getAsync(key);
    return res.status(200).json(JSON.parse(data));
});


app.put('/store', async (req, res) => {
    const id = req.body.uid;
    const value = req.body.value;
    try {
        let result = await redisClient.setAsync(id, JSON.stringify(value));

        if(result)
            return res.status(200).json({"message": "Success"});
        else
            return res.status(500).json({"error": "failed"});
    }
    catch(err) {
        console.log(`failed to store data - ${err}`);
    }
});


app.listen(port, () => {
    console.log(`server started and listening on port ${port}....`);
});