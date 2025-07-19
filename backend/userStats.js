// Utility to calculate meetings hosted and average rating for a user
import { ObjectId } from 'mongodb';

export async function getUserStats(db, email) {
  // Meetings hosted
  const meetingsHosted = await db.collection('meetings').countDocuments({ createdBy: email });

  // Get all meetings hosted by this user
  const hostedMeetings = await db.collection('meetings').find({ createdBy: email }).toArray();
  const meetingIds = hostedMeetings.map(m => m.meetingId || m.id);

  // Get all feedback for meetings hosted by this user
  const feedbacks = await db.collection('feedback').find({ meetingId: { $in: meetingIds } }).toArray();

  // Collect all rating answers
  let ratings = [];
  for (const fb of feedbacks) {
    for (const key in fb.responses) {
      const val = fb.responses[key];
      if (typeof val === 'number' && val >= 1 && val <= 5) {
        ratings.push(val);
      }
    }
  }
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

  return {
    meetingsHosted,
    avgRating: Math.round(avgRating * 100) / 100 // round to 2 decimals
  };
}
