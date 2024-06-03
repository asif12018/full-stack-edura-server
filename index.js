const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.port || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');

//express dot env
require('dotenv').config();
app.use(cors())
//middleware to read the data from frontend
app.use(express.json());



const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.ecpul2e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();

    //the data collection
    const userCollection = client.db('eduraDB').collection('user');
    const teacherCollection = client.db('eduraDB').collection('teacher')
    //sending the user data to the server
    app.post('/user', async(req,res)=>{
        const user = req.body;
        console.log('user data',user);
        //look if the data is availbe on server or not
        const query = {email:user.email}
        const isExist = await userCollection.findOne(query);
        if(isExist){
            return res.send({message:'user already exist'})
        }

        //sending the data to the server
        const result = await userCollection.insertOne(user)
        res.send(result);


    })

    //sending teacher request data to the database
    app.post('/apply', async(req,res)=>{
        const teacher = req.body;
        const result = await teacherCollection.insertOne(teacher);
        res.send(result);
    })

    //get user info
    app.get('/teacher/:email', async(req,res)=>{
        const email = req.params.email
        // console.log(email)
        const query = {email:email}
        const result = await teacherCollection.findOne(query);
        // console.log(result)
        // console.log(result)
        res.send(result)
    })

     //get teacher info
     app.get('/user/:email', async(req,res)=>{
        const email = req.params.email
        // console.log(email)
        const query = {email:email}
        const result = await userCollection.findOne(query);
        // console.log(result)
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





app.get('/', (req, res) => {
    res.send('edura server is running')
  })
  
  app.listen(port, () => {
    console.log(`edura Server is running on Port: ${port}`);
  })