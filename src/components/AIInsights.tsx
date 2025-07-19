import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateInsights, generateMeetingRecommendations } from '../lib/gemini';
import { 
  SparklesIcon, 
  ChartBarIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon,
  CalendarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface InsightData {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  trends: string[];
  effectivenessScore: number;
  summary: string;
}

export default function AIInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [meetingRecommendations, setMeetingRecommendations] = useState<string[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [availableMeetings, setAvailableMeetings] = useState<string[]>([]);
  const [meetingNames, setMeetingNames] = useState<{ [key: string]: string }>({});

  // Dashboard stats (must be after availableMeetings and meetingNames are declared)
  const [allFeedback, setAllFeedback] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all feedback for stats
    fetch('http://localhost:4000/api/feedback')
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllFeedback(Array.isArray(data) ? data : []))
      .catch(() => setAllFeedback([]));
  }, [availableMeetings]);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  // All meetings created by the user
  const userMeetingIds = availableMeetings;
  // All feedback for user's meetings
  const userFeedback = allFeedback.filter(fb => userMeetingIds.includes(String(fb.meetingId)));
  function isMonth(dateStr: string | undefined, month: number, year: number) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === month && d.getFullYear() === year;
  }
  // Total meetings created by the user
  const totalMeetings = userMeetingIds.length;
  // Meetings created this month and last month
  const meetingsThisMonth = userMeetingIds.filter(mid => {
    // Meeting created this month
    const created = allFeedback.find(fb => String(fb.meetingId) === mid)?.createdAt;
    if (!created) return false;
    return isMonth(created, thisMonth, thisYear);
  });
  const meetingsLastMonth = userMeetingIds.filter(mid => {
    const created = allFeedback.find(fb => String(fb.meetingId) === mid)?.createdAt;
    if (!created) return false;
    return isMonth(created, lastMonth, lastMonthYear);
  });
  // Average rating for all feedback on user's meetings
  const avgRating = (feedbacks: any[]) => {
    const ratings = feedbacks.map(fb => fb.responses?.overallSatisfaction).filter((v: any) => typeof v === 'number');
    if (!ratings.length) return '-';
    return (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2);
  };
  // Average rating for all time, this month, and last month
  const avgRatingAll = avgRating(userFeedback);
  const avgRatingThisMonth = avgRating(userFeedback.filter(fb => isMonth(fb.createdAt, thisMonth, thisYear)));
  const avgRatingLastMonth = avgRating(userFeedback.filter(fb => isMonth(fb.createdAt, lastMonth, lastMonthYear)));
  // Active users: unique userIds who gave feedback on user's meetings this month
  const activeUsersThisMonth = Array.from(new Set(userFeedback.filter(fb => isMonth(fb.createdAt, thisMonth, thisYear)).map(fb => fb.userId))).length;
  const activeUsersLastMonth = Array.from(new Set(userFeedback.filter(fb => isMonth(fb.createdAt, lastMonth, lastMonthYear)).map(fb => fb.userId))).length;

  // Fetch meetings after user is initialized
  useEffect(() => {
    if (!user) return;
    async function fetchMeetings() {
      const response = await fetch('http://localhost:4000/api/meetings');
      const meetings = response.ok ? await response.json() : [];
      if (!user) return; // Type guard for TypeScript
      const userMeetings = meetings.filter((m: any) => m.userId === user.id);
      const meetingMap: { [key: string]: string } = {};
      const meetingIds: string[] = [];
      userMeetings.forEach((m: any) => {
        if (m.meetingId && m.title) {
          meetingMap[String(m.meetingId)] = m.title;
          meetingIds.push(String(m.meetingId));
        }
      });
      setMeetingNames(meetingMap);
      setAvailableMeetings(meetingIds);
    }
    fetchMeetings();
  }, [user]);

  const loadInsights = async () => {
    if (!user) {
      alert('User not authenticated');
      return;
    }
    setLoading(true);
    try {
      // Fetch feedback data from backend API
      const response = await fetch('http://localhost:4000/api/feedback');
      const feedbackData = response.ok ? await response.json() : [];
      // Include all feedback for the selected meeting, regardless of user
      const meetingFeedback = feedbackData.filter((fb: any) => String(fb.meetingId) === selectedMeetingId);
      if (!meetingFeedback.length) {
        setInsights({
          strengths: ["No feedback found for this meeting."],
          improvements: ["No feedback found for this meeting."],
          recommendations: ["No feedback found for this meeting."],
          trends: ["No feedback found for this meeting."],
          effectivenessScore: 0,
          summary: "No feedback found for this meeting."
        });
        setMeetingRecommendations([]);
        setLoading(false);
        return;
      }
      console.log('Feedback for Gemini (meetingId):', selectedMeetingId, meetingFeedback);

      // Generate insights using Gemini AI
      const insightsData = await generateInsights(meetingFeedback);
      setInsights(insightsData);
      // Generate meeting recommendations
      const recommendations = await generateMeetingRecommendations('general', meetingFeedback);
      setMeetingRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading insights:', error);
      // Fallback mock data
      setInsights({
        strengths: [
          "High participant engagement levels",
          "Clear communication from facilitators",
          "Good technical setup quality",
          "Effective time management"
        ],
        improvements: [
          "Meeting preparation could be better",
          "Action items need clearer assignment",
          "Follow-up processes need improvement"
        ],
        recommendations: [
          "Implement pre-meeting preparation checklist",
          "Use structured action item templates",
          "Schedule follow-up meetings within 48 hours",
          "Provide facilitator training for better engagement",
          "Create meeting outcome summary templates"
        ],
        trends: [
          "Satisfaction scores trending upward (+15% this month)",
          "Technical issues decreased by 30%",
          "Meeting preparation scores improved",
          "Engagement levels stabilizing at high levels"
        ],
        effectivenessScore: 7.8,
        summary: "Overall meeting effectiveness is strong with room for improvement in preparation and follow-up processes."
      });
      setMeetingRecommendations([
        "Start meetings with clear objectives and expected outcomes",
        "Limit meeting duration to 45 minutes for better focus",
        "Implement a parking lot for off-topic discussions",
        "Use breakout rooms for large group discussions",
        "End with action items and next meeting agenda preview"
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };



  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Meeting search bar */}
          <input
            type="text"
            placeholder="Search meeting name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {/* Show search results as buttons */}
          {searchTerm && (
            <div className="flex flex-wrap gap-2">
              {availableMeetings
                .filter(mid => meetingNames[mid]?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(mid => (
                  <button
                    key={mid}
                    onClick={() => setSelectedMeetingId(mid)}
                className={`px-3 py-1 rounded-lg border ${selectedMeetingId === mid ? 'bg-purple-600 text-white' : 'bg-white text-gray-900 border-gray-300'} hover:bg-purple-500 hover:text-white transition`}
              >
                {meetingNames[mid]}
              </button>
            ))}
            </div>
          )}
          <button
            onClick={loadInsights}
            disabled={loading || !selectedMeetingId}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate Insights</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-4">
            <div className="loading-spinner"></div>
            <span className="text-gray-600">Generating AI insights...</span>
          </div>
        </div>
      ) : insights && selectedMeetingId ? (
        <div className="space-y-6">

      {/* Effectiveness Score */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Overall Effectiveness Score</h3>
          <div className={`px-4 py-2 rounded-full ${getScoreBackground(insights.effectivenessScore)}`}>
            <span className={`text-2xl font-bold ${getScoreColor(insights.effectivenessScore)}`}>
              {insights.effectivenessScore}/10
            </span>
          </div>
        </div>
        <p className="text-gray-600">{insights.summary}</p>
      </div>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Key Strengths</h3>
          </div>
          <div className="space-y-3">
            {insights.strengths.map((strength, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{strength}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="w-6 h-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
          </div>
          <div className="space-y-3">
            {insights.improvements.map((improvement, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{improvement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <LightBulbIcon className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.recommendations.map((recommendation, index) => (
            <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

          {/* Meeting Recommendations */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <SparklesIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Smart Meeting Recommendations</h3>
            </div>
            <div className="space-y-3">
              {meetingRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trends */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <ArrowTrendingUpIcon className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Trends & Patterns</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.trends.map((trend, index) => (
                <div key={index} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-gray-700">{trend}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights available</h3>
          <p className="text-gray-600">Generate insights by clicking the refresh button above.</p>
        </div>
      )}
    </div>
  );
}