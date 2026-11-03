import { MediaStreamsKinds } from '../sdk/const';

export function isRepublishAllowed(mediaStreamKind, isCameraOn)
{
	if (mediaStreamKind === MediaStreamsKinds.Camera)
	{
		return Boolean(isCameraOn);
	}

	return true;
}
