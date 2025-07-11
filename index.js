const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yy3zscc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const jobCollection = client.db('soloSphere').collection('jobs')
    const bidCollection = client.db('soloSphere').collection('bids')

    // for get all jobs ----------
    app.get('/jobs', async(req, res)=>{
      const result = await jobCollection.find().toArray();
      res.send(result)
    })

    // for get single job from all jobs ----------
    app.get('/jobs/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await jobCollection.findOne(query)
      res.send(result)
    })

    // get all job data based on email from db ----------
    app.get('/job/:email', async(req, res)=>{
      const email = req.params.email
      const query = {'buyer.email' : email}
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })

    // save a job data in db ----------
    app.post('/job', async(req, res)=> {
      const jobData = req.body;
      const result = await jobCollection.insertOne(jobData)
      res.send(result)
    })

    // save a bid data in db ----------
    app.post('/bid', async(req, res)=>{
      const bidData = req.body;
      const result = await bidCollection.insertOne(bidData);
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=>{
    res.send("Server is running")
})

app.listen(port, ()=>{
    console.log(`Server is running on port - ${port}`);
})