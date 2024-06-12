const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.port || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// const stripe = require('stripe')('sk_test_51PMVF107SE24j7VzraeMv0hxElC5mPcEZZR4kZTyqhrZmqIlqsiuXBLnw7Y6dQuUzBudHJl2LGhvDb7XQaaqkNpJ002UESASl0')

//express dot env
require('dotenv').config();
app.use(cors())
//middleware to read the data from frontend
app.use(express.json());



const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.ecpul2e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// console.log(process.env.STRIPE_SECRET_KEY)
const stripe = require('stripe')(`${process.env.STRIPE_SECRET_KEY}`)
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
    const enrollCollection = client.db('eduraDB').collection('enroll');
    const assignmentCollection = client.db('eduraDB').collection('assignment');
    const classCollection = client.db('eduraDB').collection('class');
    const submitAssignmetCollection = client.db('eduraDB').collection('submitAssignment');
    const reviewCollection = client.db('eduraDB').collection('review')


    //custom created middleware
    const verifyToken = (req,res,next) =>{
      // console.log(req.headers.authorization)
      if(!req.headers.authorization){
          return res.status(401).send({message: 'forbidden access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      if(!token){
        return res.status(401).send({message: 'forbidden access'});
      }
    
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(error, decoded)=>{
          
           if(error){
            return res.status(401).send({message:'unauthorized invalid token'})
           }
           req.decoded = decoded;
           next();
      })
      
    }
    


    


    //jwt token related api
    app.post('/jwt', async(req,res)=>{
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const user = req.body;
      const token = jwt.sign(user, secret, {expiresIn:'1h'})
      res.send(token);
    })








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
    app.post('/apply', verifyToken,async(req,res)=>{
        const teacher = req.body;
        const result = await teacherCollection.insertOne(teacher);
        res.send(result);
    })

    //get user info
    app.get('/teacher/:email', verifyToken,async(req,res)=>{
        const email = req.params.email
        // console.log(email)
        const query = {email:email}
        const result = await teacherCollection.findOne(query);
        // console.log(result)
        // console.log(result)
        res.send(result)
    })

     //get specific teacher info
     app.get('/user/:email', verifyToken,async(req,res)=>{
        const email = req.params.email
        // console.log(email)
        const query = {email:email}
        const result = await userCollection.findOne(query);
        // console.log(result)
        res.send(result)
    })

    //get all teacher info
    app.get('/allteachers', verifyToken,async(req,res)=>{
      const result = await teacherCollection.find().toArray();
      res.send(result);
    })

    //update the course request
    app.patch('/teacher/:id', verifyToken,async(req,res)=>{
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
    app.patch('/user/:email', verifyToken,async(req,res)=>{
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
    app.patch('/teacher/reject/:id', verifyToken,async(req,res)=>{
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
    app.patch('/teacher/review/:email', verifyToken,async(req,res)=>{
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
      // console.log(query);
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
    app.patch('/promote/:id', verifyToken,async(req,res)=>{
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
    app.post('/addCourse', verifyToken,async(req,res)=>{
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
    app.get('/teachersAllCourse/:email', verifyToken,async(req,res)=>{
      const email = req.params.email;
      // console.log(email)
      const query = {email:email}
      const result = await courseCollection.find(query).toArray();
      res.send(result);
    })

    //approve a teacher course
    app.patch('/approveCourse/:id', verifyToken,async(req,res)=>{
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
    app.patch('/rejectCourse/:id', verifyToken,async(req,res)=>{
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

    //api to get teachers specific course
    app.get('/progress/:id', verifyToken,async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await courseCollection.findOne(query);
      res.send(result);
    })

    //request a review for the course request
    app.patch('/reviewRequest/:id', verifyToken,async(req,res)=>{
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

    //api to load a course details
    app.get('/courseDetails/:id', async(req,res)=>{
      const id = req.params.id;
      // console.log(id);
      const query = {_id: new ObjectId(id)};
      const result = await courseCollection.findOne(query);
      res.send(result);
    })

    //api to update course
    app.patch('/update/:id', verifyToken,async(req,res)=>{
      const id = req.params.id;
      const data = req.body;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set:{
          category:data.category,
          coursePhoto:data.coursePhoto,
          description:data.description,
          price:data.price,
          title:data.title
        }
      }

      const result = await courseCollection.updateOne(filter,updateDoc);
      res.send(result);
    })

    //api to delete a specific
    app.delete('/deleteCourse/:id', verifyToken,async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) }; // Ensure ObjectId is imported from 'mongodb'
      try {
        const result = await courseCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while deleting the course' });
      }
    });
    //api to save enroll details
    app.post('/saveEnroll/', verifyToken,async(req,res)=>{
       const data = req.body;
       const result = await enrollCollection.insertOne(data);
       res.send(result);
    })

    //api to update enroll number
    app.patch('/updateInfo/:id', async(req,res)=>{
      const id = req.params.id;
      const data = req.body;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set:{
          totalEnroll:data.enroll
        }
      }
      const result = await courseCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    //api get specific user enroll course
    app.get('/myEnroll/:email', async(req,res)=>{
      const email = req.params.email;
      const query = {enrollEmail:email}
      const result = await enrollCollection.find(query).toArray();
      res.send(result);
    })

    //api to create assignment
    app.post('/addAssignment', verifyToken,async(req,res)=>{
      const data = req.body;
      const result = await assignmentCollection.insertOne(data);
      res.send(result);
    })

    //api to get All the assignment
    app.get('/getAssignment/:id', verifyToken,async(req,res)=>{
      const id = req.params.id;
      const query = {courseId: id}
      // console.log(id);
      const result = await assignmentCollection.find(query).toArray();
      res.send(result);
    })
    
    //api to save class
    app.post('/addClass', verifyToken,async(req,res)=>{
      const data = req.body;
      const result = await classCollection.insertOne(data);
      res.send(result);
    })

    //api to get all the class
    app.get('/getClass/:id', async(req,res)=>{
      const id = req.params.id;
    
      const query = {courseId:id}
      const result = await classCollection.find(query).toArray();
      res.send(result);
    })

    //api to load course all class
    app.get(`/getAllClass/:id`, verifyToken,async(req,res)=>{
          const id = req.params.id;
          const query = {courseId:id}
          const result = await classCollection.find(query).toArray();
          res.send(result);
    })

    //api to get single class video
    app.get('/getSingleClass/:id', async(req,res)=>{
      const id = req.params.id;
      // console.log(id);
      const query = {_id: new ObjectId(id)};
      const result = await classCollection.findOne(query);
      // console.log(result)
      res.send(result)
    })

    //api to submit assignment
    app.post('/submitAssignment', async(req,res)=>{
       const data = req.body;
       const result = await submitAssignmetCollection.insertOne(data);
       res.send(result);
    })



    //get all submitted assignment


    app.get('/getSubmittedAssignment/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {courseId: id};
      // console.log(query);
      const result = await submitAssignmetCollection.find(query).toArray();
      // console.log(result.length)
      res.send(result);
    })

    //get user all submitted assignment
    app.get('/getUserAssignment/:email', verifyToken,async(req,res)=>{
       const email = req.params.email;
       const query = {submitterEmail: email};
       const result = await submitAssignmetCollection.find(query).toArray();
       res.send(result);
    })

    //get all the paid order
    app.get('/getOrderCourse/:email', verifyToken,async(req,res)=>{
      const email = req.params.email;
      const query = {instructorEmail: email};
      const result = await enrollCollection.find(query).toArray();
      res.send(result);
    })

    //get all the course
    app.get('/getAllTheSiteCourse', async(req,res)=>{
      
      const result = await courseCollection.find().toArray();
      // console.log(result)
      res.send(result);

    })


    //get all the purchase data
    app.get('/getAllThePurchase', verifyToken,async(req,res)=>{
      const result = await enrollCollection.find().toArray();
      res.send(result);
    })

    //add review to the database
    app.post('/addReview',verifyToken,async(req,res)=>{
      const data = req.body;
      const result = await reviewCollection.insertOne(data);
      res.send(result);
    })

    //get specific course feedBack
    app.get(`/review/:id`, verifyToken,async(req,res)=>{
      const id = req.params.id;
      // console.log(id);
      const query = {courseId: id}
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    })

    //get the all the feedback
    app.get('/allFeedback', async(req,res)=>{
      const result = await reviewCollection.find().toArray();
      res.send(result);
    })


    //stripe api payment intent
    const calculateOrderAmount = (items) => {
      // Replace this constant with a calculation of the order's amount
      // Calculate the order total on the server to prevent
      // people from directly manipulating the amount on the client
      return items;
    };




    app.post('/create-payment-intent', verifyToken,async(req,res)=>{
       const {price} = req.body;
       const amount = parseInt(price * 100);
       const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(amount),
        currency: "usd",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        payment_method_types: ['card'],
        
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })


    })

    

    //get specific type assignment
    app.get('/filterAssignment/:type', async(req,res)=>{
      const type = req.params.type;
      const query = {assignmentTitle:type}
      const result = await submitAssignmetCollection.find(query).toArray();
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