import { ViewRoomState } from 'call.mapping';

// The room state decides which side icon the microphone button carries.
export function getMicrophoneSideIcon(roomState)
{
	switch (roomState)
	{
		case ViewRoomState.Speaker:
			return 'ellipsis';
		case ViewRoomState.NonSpeaker:
			return 'pointer';
		case ViewRoomState.None:
		default:
			return null;
	}
}
