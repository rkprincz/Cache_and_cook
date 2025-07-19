
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API to get a single meeting by id or meetingId
app.get('/api/meetings/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Try to find by meetingId or id
    const meeting = await db.collection('meetings').findOne({ $or: [ { meetingId: id }, { id } ] });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

const uri = 'mongodb+srv://rohithramanagdg:Cache_And_Cook@cluster0.zwossjq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('Cache_and_cook');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
}

connectDB();

// API to get user profile by email
app.get('/api/profile/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Get up-to-date stats
    const { getUserStats } = await import('./userStats.js');
    const stats = await getUserStats(db, email);
    res.json({ ...user, ...stats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const profile = { ...req.body };
    console.log('Received profile POST:', profile);

    if (!profile.email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Remove _id if present to avoid MongoDB immutable field error
    if (profile._id) {
      delete profile._id;
    }

    const result = await db.collection('users').updateOne(
      { email: profile.email },
      { $set: profile },
      { upsert: true }
    );

    const updatedProfile = await db.collection('users').findOne({ email: profile.email });

    res.json({ message: 'Profile saved', result, profile: updatedProfile });
  } catch (err) {
    console.error('Error in /api/profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// API to create a meeting
// API to create a meeting (store userId, meetingId)
app.post('/api/meetings', async (req, res) => {
  try {
    const meeting = req.body;
    if (!meeting.id || !meeting.createdBy) {
      return res.status(400).json({ message: 'Meeting ID and createdBy (userId) are required' });
    }
    // Store meeting with userId and meetingId
    const result = await db.collection('meetings').insertOne({
      ...meeting,
      userId: meeting.createdBy, // for clarity
      meetingId: meeting.id
    });
    res.json({ message: 'Meeting created', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to get meetings
app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await db.collection('meetings').find({}).toArray();
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to create feedback
// API to create feedback (store meetingId, userId, responses)
app.post('/api/feedback', async (req, res) => {
  try {
    const feedback = req.body;
    if (!feedback.meetingId || !feedback.userId || !feedback.responses) {
      return res.status(400).json({ message: 'meetingId, userId, and responses are required' });
    }
    // Store feedback under meetingId and userId
    const result = await db.collection('feedback').insertOne({
      meetingId: feedback.meetingId,
      userId: feedback.userId,
      responses: feedback.responses,
      createdAt: new Date()
    });
    res.json({ message: 'Feedback saved', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to get feedback
app.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await db.collection('feedback').find({}).toArray();
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to create AI insight
app.post('/api/ai-insights', async (req, res) => {
  try {
    const insight = req.body;
    const result = await db.collection('ai_insights').insertOne(insight);
    res.json({ message: 'AI Insight saved', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to get AI insights
app.get('/api/ai-insights', async (req, res) => {
  try {
    const insights = await db.collection('ai_insights').find({}).toArray();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
