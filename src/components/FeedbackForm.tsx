import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { getMeetingData, saveFeedback } from '../lib/api';
// Helper to generate a unique submitter ID
function generateSubmitterId() {
  return 'submitter_' + Math.random().toString(36).substr(2, 9) + Date.now();
}
import { useAuth } from '../contexts/AuthContext';

interface FeedbackData {
  meetingObjectiveClarity: number;
  contentRelevance: number;
  overallEngagement: number;
  timeUtilization: number;
  focusTopicManagement: number;
  decisionQuality: number;
  overallSatisfaction: number;
  facilitatorEffectiveness: number;
  technicalSetup: number;
  agendaSharedInAdvance: boolean;
  unnecessaryAttendees: boolean;
  actionItemsAssigned: boolean;
  meetingRecorded: boolean;
  preparedBeforeMeeting: boolean;
  improvementAreas: string;
  futureSuggestions: string;
  valuableAspect: string;
  leastValuableAspect: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  meetingType: string;
}

export default function FeedbackForm() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ [key: string]: any }>({});

  // New state to track edit mode per question
  const [editMode, setEditMode] = React.useState<{ [key: string]: boolean }>({});
  // New state to track edit mode for question text per question
  const [editQuestionMode, setEditQuestionMode] = React.useState<{ [key: string]: boolean }>({});
  
  // Toggle edit mode for answer input
  const toggleEditMode = (field: keyof FeedbackData) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  // Toggle edit mode for question text
  const toggleEditQuestionMode = (field: keyof FeedbackData) => {
    setEditQuestionMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  // Helper component to render pencil icon
  const PencilIcon = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick} className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5h2M12 7v10m-7 4h14a2 2 0 002-2v-7a2 2 0 00-2-2h-3l-4-4-4 4H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
      </svg>
    </button>
  );

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMeetingData() {
      try {
        const meetingData = await getMeetingData(meetingId);
        if (meetingData) {
          setMeeting(meetingData);
          setQuestions(meetingData.feedbackQuestions || []);
        }
      } catch (error) {
        setMeeting(null);
        setQuestions([]);
        console.error('Error loading meeting data:', error);
      }
    }
    if (meetingId && meetingId !== 'unknown') {
      loadMeetingData();
    } else {
      setMeeting(null);
      setQuestions([]);
    }
  }, [meetingId]);

  const handleRatingChange = (field: string, rating: number) => {
    setFeedback(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTextChange = (field: string, value: string) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveFeedback({
        meetingId,
        userId: user?.id,
        submittedAt: new Date().toISOString(),
        submitterId: generateSubmitterId(),
        responses: feedback,
      });
      console.log('Feedback submitted:', feedback);

      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      alert(`Error submitting feedback: ${error?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ rating, onChange, label, field }: { rating: number; onChange: (rating: number) => void; label: string; field: keyof FeedbackData }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 flex items-center">
        <span>{label}</span>
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-colors"
          >
            {star <= rating ? (
              <StarIcon className="w-8 h-8 text-yellow-400 hover:text-yellow-500" />
            ) : (
              <StarOutlineIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    </div>
  );
  // <RatingStars rating={feedback[field]} onChange={rating => handleRatingChange(field, rating)} label={label} field={field} />

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">Your feedback has been submitted successfully.</p>
          <p className="text-sm text-gray-500">Your insights help us improve future meetings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Meeting Feedback Form</h1>
            <p className="text-blue-100 mb-4">Help us improve future meetings by providing detailed feedback</p>
            {meeting && (
              <div className="bg-white/20 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-lg">{meeting.title}</h3>
                <p className="text-blue-100">{meeting.date} at {meeting.time}</p>
                {meeting.description && (
                  <p className="text-blue-100 text-sm mt-2">{meeting.description}</p>
                )}
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {questions.length === 0 ? (
              <div className="text-center text-gray-500">No feedback questions found for this meeting.</div>
            ) : (
              questions.map(q => (
                <div key={q.id} className="mb-4 p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{q.text}</label>
                  {q.type === 'rating' && (
                    <div className="flex items-center space-x-1 mt-2">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(q.id, star)}
                          className="focus:outline-none"
                        >
                          {star <= (feedback[q.id] || 0) ? (
                            <StarIcon className="w-8 h-8 text-yellow-400 hover:text-yellow-500" />
                          ) : (
                            <StarOutlineIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                          )}
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({feedback[q.id] || 0}/5)</span>
                    </div>
                  )}
                  {q.type === 'boolean' && (
                    <div className="flex items-center mt-2 space-x-4">
                      <button
                        type="button"
                        onClick={() => handleBooleanChange(q.id, true)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${feedback[q.id] === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBooleanChange(q.id, false)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${feedback[q.id] === false ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                      >
                        No
                      </button>
                    </div>
                  )}
                  {q.type === 'text' && (
                    <textarea
                      rows={3}
                      value={feedback[q.id] || ''}
                      onChange={e => handleTextChange(q.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 mt-2"
                      placeholder="Your answer..."
                    />
                  )}
                </div>
              ))
            )}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-lg px-8 py-3 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}