import { useMeetingStore } from '../lib/meeting-store';
import { useActiveSpeaker } from '../lib/useActiveSpeaker';
import { RtkParticipantTile } from '@cloudflare/realtimekit-react-ui';
import { useRealtimeKitMeeting } from '@cloudflare/realtimekit-react';
import { HTMLAttributes, memo } from 'react';

const ActiveSpeaker = memo(function ActiveSpeaker(
  props: Omit<HTMLAttributes<HTMLRtkParticipantTileElement>, 'style'> & {
    isSmall?: true;
  }
) {
  const activeSpeaker = useActiveSpeaker();
  const { meeting } = useRealtimeKitMeeting();
  const size = useMeetingStore((s) => s.size);
  const states = useMeetingStore((s) => s.states);
  const isActiveMode = useMeetingStore((s) => s.isActiveSpeakerMode);

  if (!activeSpeaker || !isActiveMode) return null;

  return (
    <RtkParticipantTile
      participant={activeSpeaker}
      meeting={meeting}
      size={props.isSmall ? 'sm' : size}
      states={states}
      {...props}
    />
  );
});

export default ActiveSpeaker;
