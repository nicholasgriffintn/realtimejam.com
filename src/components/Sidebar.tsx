import HOST_PRESET from '../lib/const';
import { useMeetingStore } from '../lib/meeting-store';
import ActiveSpeaker from './ActiveSpeaker';
import Grid from './Grid';
import {
  RtkParticipants,
  RtkPlugins,
  RtkPolls,
  RtkChat,
} from '@cloudflare/realtimekit-react-ui';
import { useRealtimeKitMeeting } from '@cloudflare/realtimekit-react';
import React, { memo } from 'react';

const Sidebar = memo(function Sidebar() {
  const { meeting } = useRealtimeKitMeeting();

  const isActiveMode = useMeetingStore((m) => m.isActiveSpeakerMode);
  const states = useMeetingStore((m) => m.states);
  const isMobile = useMeetingStore((m) => m.isMobile);

  let sidebar: React.ReactElement | null = null;

  switch (states.sidebar) {
    case 'participants':
      sidebar = <RtkParticipants meeting={meeting} className="pt-3" />;
      break;
    case 'plugins':
      sidebar = <RtkPlugins meeting={meeting} />;
      break;
    case 'polls':
      sidebar = <RtkPolls meeting={meeting} className="m-0" />;
      break;
    case 'chat':
      sidebar = <RtkChat meeting={meeting} />;
      break;
  }

  const isHost = meeting.self.presetName === HOST_PRESET;

  if (isHost && !sidebar) {
    return null;
  }

  if (!isHost && !sidebar && !isActiveMode) {
    return null;
  }

  if (!isHost && !sidebar && isMobile) {
    return null;
  }

  return (
    <aside className="flex-1 lg:flex-auto lg:w-full lg:max-w-sm -ml-2">
      <div className="size-full flex flex-col gap-2 p-2">
        {sidebar ? (
          <>
            {!isMobile && (
              <ActiveSpeaker className="h-auto w-full aspect-video" isSmall />
            )}

            <div className="flex-1 rounded-lg overflow-clip bg-zinc-900">
              {sidebar}
            </div>
          </>
        ) : (
          <Grid />
        )}
      </div>
    </aside>
  );
});

export default Sidebar;
