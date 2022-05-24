const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const port = process.env.PORT || 5000


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB}:${process.env.PASS}@cluster0.fxktx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



const verifyJWT = (req,res,next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({message: 'UnAuthorized access'})
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({message:'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}



async function run() {
    try {
        await client.connect();
        const itemCollection = client.db('toolzz').collection('items')
        const userCollection = client.db('toolzz').collection('users')
        const reviewCollection = client.db('toolzz').collection('reviews')


        app.post('/addproduct', verifyJWT, async (req,res) => {
            const product = req.body;
            const result = await itemCollection.insertOne(product);
            res.send(result);
        })

        app.get('/product', async (req, res) => {
            const products = await itemCollection.find().toArray()
            res.send(products);
        })

        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await itemCollection.deleteOne(query)
            res.send(result)
        })


        // review section
        app.post('/review', async(req,res)=>{
            const data = req.body;
            const result = await reviewCollection.insertOne(data)
            res.send(result)
        })
        
        app.get('/review', async(req,res)=>{
            const result = await reviewCollection.find().toArray()
            res.send(result)
        } )


        // user section
        app.get('/user', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
            })


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({email:email},process.env.ACCESS_TOKEN,{expiresIn: '1h'})
            res.send({result,token});
        })







        
    } finally {
        
    }
}
run().catch(console.dir);



app.get('/', (req,res) => {
    res.send('hello from express');
})


app.listen(port,() => {
    console.log(`server running on port ${port}`)
})