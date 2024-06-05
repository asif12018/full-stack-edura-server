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
    const teacherCollection = client.db('eduraDB').collection('teacher');
    const courseCollection = client.db('eduraDB').collection('course');
    //sending the user data to the server
    app.post('/user', async(req,res)=>{
        const user = req.body;
        // console.log('user data',user);
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

     //get specific teacher info
     app.get('/user/:email', async(req,res)=>{
        const email = req.params.email
        // console.log(email)
        const query = {email:email}
        const result = await userCollection.findOne(query);
        // console.log(result)
        res.send(result)
    })

    //get all teacher info
    app.get('/allteachers', async(req,res)=>{
      const result = await teacherCollection.find().toArray();
      res.send(result);
    })

    //update the course request
    app.patch('/teacher/:id', async(req,res)=>{
       const id = req.params.id;
       const filter = {_id: new ObjectId(id)}
       const updateDoc = {
         $set:{
            isApproved:'yes'
         }
       }

       const result = await teacherCollection.updateOne(filter, updateDoc);
       res.send(result);
    })

    //making the user to teacher
    app.patch('/user/:email', async(req,res)=>{
      const email = req.params.email;
      const filter = {email:email}
      const updateDoc = {
        $set:{
          role:'teacher'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    //rejecting the course request
    app.patch('/teacher/reject/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set:{
          isApproved:'reject'
        }
      }
      const result = await teacherCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    //request the another review of the course
    app.patch('/teacher/review/:email', async(req,res)=>{
      const email = req.params.email;
      const filter = {email:email};
      const updateDoc = {
        $set:{
          isApproved:'no'
        }
      }
      const result = await teacherCollection.updateOne(filter,updateDoc);
      res.send(result);
    })

    //all users info
    app.get('/allUser', async (req, res) => {
      const query = req.query.keyword;
      console.log(query);
      let filter = {};
  
      if (query && query.length > 0) {
          // Using regex for partial matches (case insensitive)
          filter = { email: { $regex: query, $options: 'i' } };
      }
  
      try {
          const result = await userCollection.find(filter).toArray();
          res.send(result);
      } catch (error) {
          console.error('Error fetching users:', error);
          res.status(500).send('Error fetching users');
      }
  });
  

    //make a user admin
    app.patch('/promote/:id', async(req,res)=>{
      const id = req.params.id;
      // console.log(id)
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set:{
          role:'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    //api to react auto search to complete
    app.get('/search', async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    //api to add course to the database
    app.post('/addCourse', async(req,res)=>{
       const course = req.body;
       const result = await courseCollection.insertOne(course);
       res.send(result);
    })

    //api to load all the courses
    app.get('/allCourse', async(req,res)=>{
       const result = await courseCollection.find().toArray();
       res.send(result);
    })
    

    //api to get specific user all courses
    app.get('/teachersAllCourse/:email', async(req,res)=>{
      const email = req.params.email;
      // console.log(email)
      const query = {email:email}
      const result = await courseCollection.find(query).toArray();
      res.send(result);
    })

    //approve a teacher course
    app.patch('/approveCourse/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set:{
            isApproved:'yes'
        }
      }
      const result = await courseCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    //reject a teacher course
    app.patch('/rejectCourse/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set:{
            isApproved:'reject'
        }
      }
      const result = await courseCollection.updateOne(filter, updateDoc);
      res.send(result)

    })

    //request a review for the course request
    app.patch('/reviewRequest/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set:{
            isApproved:'no'
        }
      }
      const result = await courseCollection.updateOne(filter, updateDoc);
      res.send(result)

    })

    //api to load all available course
    app.get('/allAvailableCourse', async(req,res)=>{
      const query = {isApproved:'yes'}
      const result = await courseCollection.find(query).toArray();
      res.send(result);
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