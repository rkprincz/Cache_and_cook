import { useEffect, useState } from 'react';

export function useDashboardStats(user: any) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetch('http://localhost:4000/api/meetings').then(r => r.ok ? r.json() : []),
      fetch('http://localhost:4000/api/feedback').then(r => r.ok ? r.json() : [])
    ]).then(([meetingsData, feedbackData]) => {
      setMeetings(Array.isArray(meetingsData) ? meetingsData.filter((m: any) => m.userId === user.id) : []);
      setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
      setLoading(false);
    }).catch(() => {
      setMeetings([]);
      setFeedback([]);
      setLoading(false);
    });
  }, [user]);

  // Stats logic
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const totalMeetings = meetings.length;
  // Removed meetingsThisMonth and meetingsLastMonth as per latest requirements

  const meetingIds = meetings.map(m => String(m.meetingId));
  const userFeedback = feedback.filter(fb => meetingIds.includes(String(fb.meetingId)));
  const avgRating = (feedbacks: any[]) => {
    const ratings = feedbacks.map(fb => fb.responses?.overallSatisfaction).filter((v: any) => typeof v === 'number');
    if (!ratings.length) return '-';
    return (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2);
  };
  const avgRatingAll = avgRating(userFeedback);
  return {
    loading,
    totalMeetings,
    avgRatingAll
  };
}
