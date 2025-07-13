const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors({
  origin : ['http://localhost:5173'],
  credentials : true
}));
app.use(express.json())
app.use(cookieParser())


// verify jwt middleWare -------------
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if(!token) return res.status(401).send({message : 'unauthorized access'})
    if(token){
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=> {
          if(err){
            // console.log(err);
            return  res.status(401).send({message : 'unauthorized access'})
          }
          // console.log(decoded);
          req.user = decoded;
          next()
        })
      }

  
}



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

    // Jwt related api ----------------------
    app.post('/jwt', async(req, res)=>{
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : '1h'
      })
      res.cookie('token', token, {
          httpOnly : true,
          secure : false
      }).send({success : true})
    })

    // remove jwt token on logout ----------------
    app.get('/logout', (req, res)=> {
      res.clearCookie('token',{
          httpOnly : true,
          secure : false,
          maxAge : 0,
      }).send({ success : true})
    })

    
    // for get all jobs ----------------
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
    app.get('/job/:email', verifyToken, async(req, res)=>{
      const tokenEmail = req.user.email;
      const email = req.params.email
      if(tokenEmail !== email){
         return res.status(403).send({message : 'forbidden access'})
      }

      const query = {'buyer.email' : email}
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })

    // delete posted job from db ----------
    app.delete('/job/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await jobCollection.deleteOne(query)
      res.send(result)
    })

    // update posted job from db ----------
    app.put('/job/:id', verifyToken, async(req, res)=>{
      const id = req.params.id
      const jobData = req.body;
      const query = {_id: new ObjectId(id)}
      const options = { upsert : true }
      const updateDoc = { 
        $set: {
          ...jobData,
        }
      }
      const result = await jobCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })

    // save a job data in db ----------
    app.post('/job', async(req, res)=> {
      const jobData = req.body;
      const result = await jobCollection.insertOne(jobData)
      res.send(result)
    })

     // get all bid data using email from db ----------
     app.get('/bids/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      const query = { email : email };
      const result = await bidCollection.find(query).toArray();
      res.send(result)
    })

     // get all bid request data using email from db ----------
     app.get('/bid-request/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      const query = { 'buyer.email' : email };
      const result = await bidCollection.find(query).toArray();
      res.send(result)
    })

    
    // save a bid data in db ----------
    app.post('/bid', verifyToken, async(req, res)=>{
      const bidData = req.body;
      // check if data already apply or not ------
      const query =  {
        email : bidData.email,
        job_id : bidData.job_id
      }
      const alreadyApplied = await bidCollection.findOne(query)
      if (alreadyApplied) {
        return res
          .status(400)
          .send('You have already placed a bid on this job.')
      }

      const result = await bidCollection.insertOne(bidData);
      res.send(result)
    })



    // update bid status in db ----------
    app.patch('/bids/:id', verifyToken, async(req, res)=> {
      const id = req.params.id;
      const status = req.body;
      const query = {_id : new ObjectId(id)}
      const updateDoc = {
        $set : status
      }
      const result = await bidCollection.updateOne(query, updateDoc )
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