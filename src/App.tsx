import Meeting from './components/Meeting';
import MeetingJoin from './components/MeetingJoin';
import { RtkSpinner } from '@cloudflare/realtimekit-react-ui';
import { RealtimeKitProvider, useRealtimeKitClient } from '@cloudflare/realtimekit-react';
import { useEffect, useState } from 'react';

function App() {
  const [meeting, initMeeting] = useRealtimeKitClient();
  const [isJoining, setIsJoining] = useState(false);
  const [hasAuthToken, setHasAuthToken] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const authToken = searchParams.get('authToken');
    const meetingId = searchParams.get('meetingId');

    if (authToken && meetingId) {
      setHasAuthToken(true);
      setIsJoining(true);
      
      // Notify our API that we're joining the meeting (to trigger agent if needed)
      fetch(`/api/meeting/join?meetingId=${meetingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }).catch(console.error);

      initMeeting({
        authToken,
        defaults: {
          audio: false,
          video: false,
        },
      }).then((meeting) => {
        setIsJoining(false);
        Object.assign(window, { meeting });
      }).catch((error) => {
        console.error('Failed to join meeting:', error);
        setIsJoining(false);
      });
    }
  }, [initMeeting]);

  const handleJoinMeeting = async (meetingId: string, authToken: string) => {
    setIsJoining(true);
    
    try {
      // Update URL with parameters
      const url = new URL(window.location.href);
      url.searchParams.set('meetingId', meetingId);
      url.searchParams.set('authToken', authToken);
      window.history.pushState({}, '', url.toString());

      // Notify our API
      await fetch(`/api/meeting/join?meetingId=${meetingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Initialize the meeting
      await initMeeting({
        authToken,
        defaults: {
          audio: false,
          video: false,
        },
      });
      
      setHasAuthToken(true);
      Object.assign(window, { meeting });
    } catch (error) {
      console.error('Failed to join meeting:', error);
      alert('Failed to join meeting. Please check your meeting ID and auth token.');
    } finally {
      setIsJoining(false);
    }
  };

  if (!hasAuthToken) {
    return <MeetingJoin onJoinMeeting={handleJoinMeeting} isJoining={isJoining} />;
  }

  return (
    <RealtimeKitProvider
      value={meeting}
      fallback={
        <div className="size-full flex flex-col gap-3 place-items-center justify-center">
          <RtkSpinner className="w-12 h-12 text-blue-600" />
          <p className="text-lg">{isJoining ? 'Joining meeting...' : 'Loading...'}</p>
        </div>
      }
    >
      <Meeting />
    </RealtimeKitProvider>
  );
}

export default App;
