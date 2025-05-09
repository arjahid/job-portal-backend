const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://job-portal-2c7f7.web.app', // Update to match the frontend URL
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
const veryfyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send('unauthorized access');
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send('forbidden access');
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lsdr1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10, // Enable connection pooling for production
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // job related api
    const jobCollection = client.db("jobPortal").collection("job");
    const applicationCollection = client.db("jobPortal").collection("application");

    // ⁡⁣⁣⁢Auth related api⁡
    // app.post('/jwt', async (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    //   res
    //     .cookie('token', token, {
    //       httpOnly: true,
    //       secure: process.env.NODE_ENV === 'production', // Set secure cookies in production
    //     })
    //     .send({ success: true, token });
    // });

    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      let query = {};
      const sort = req.query?.sort;
      const search=req.query?.search;

      let sortQuery = {};

      if (email) {
        query = { hr_email: email };
      }

      if (sort === "true") {
        sortQuery = { "salaryRange.min": -1 }; // Sort by salaryRange.min in descending order
      }
      if(search){
        query.location={ $regex: search, $options: 'i' };
      }

      const cursor = jobCollection.find(query).sort(sortQuery); // Use sortQuery here
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });
    app.post('/jobs', async (req, res) => {
      const newjob = req.body;
      const result = await jobCollection.insertOne(newjob);
      res.send(result);
    });
    //  /⁣ Product coutn ⁡
    app.get('/job-count', async (req, res) => {
      const count = await jobCollection.estimatedDocumentCount();
      res.send({ count });
    });
    // application related api
    app.post('/job-application', async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });
    app.get('/job-application', async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant_email: email
      };
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`); // Fix logging message
});