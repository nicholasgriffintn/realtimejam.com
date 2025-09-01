import { useState } from 'react';
import { RtkSpinner } from '@cloudflare/realtimekit-react-ui';

interface MeetingJoinProps {
  onJoinMeeting: (meetingId: string, authToken: string) => void;
  isJoining: boolean;
}

export default function MeetingJoin({ onJoinMeeting, isJoining }: MeetingJoinProps) {
  const [meetingId, setMeetingId] = useState('');
  const [authToken, setAuthToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingId.trim() && authToken.trim()) {
      onJoinMeeting(meetingId.trim(), authToken.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Realtime Chat App
          </h1>
          <p className="text-gray-400">
            Enter your meeting details to join with AI assistant
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="meetingId" className="block text-sm font-medium text-gray-300 mb-2">
              Meeting ID
            </label>
            <input
              type="text"
              id="meetingId"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meeting ID"
              required
              disabled={isJoining}
            />
          </div>

          <div>
            <label htmlFor="authToken" className="block text-sm font-medium text-gray-300 mb-2">
              Auth Token
            </label>
            <input
              type="password"
              id="authToken"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter auth token"
              required
              disabled={isJoining}
            />
          </div>

          <button
            type="submit"
            disabled={isJoining || !meetingId.trim() || !authToken.trim()}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isJoining ? (
              <>
                <RtkSpinner className="w-4 h-4 mr-2" />
                Joining Meeting...
              </>
            ) : (
              'Join Meeting'
            )}
          </button>
        </form>

        <div className="text-center">
          <div className="text-sm text-gray-400 space-y-2">
            <p>🤖 An AI assistant will automatically join if not already present</p>
            <p>💬 The assistant can help answer questions and facilitate discussions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
