// The kind of video a card shows is known only to the card itself: screen sharing is told apart
// from a camera by the role the card was created with and by the kind of renderer it was given.
// Deciding by the track is not an option, because on the bare-track path screen sharing arrives as
// an equally bare track and would be turned off together with the camera.
//
// So the camera state gates the camera alone, in all three forms it reaches a card: a renderer, a
// bare track (which brings no renderer kind at all) and the preview next to screen sharing.
export function shouldShowVideo({ isScreenSharingCard, videoRendererKind, cameraState })
{
	if (isScreenSharingCard)
	{
		return true;
	}

	if (videoRendererKind === 'sharing')
	{
		return true;
	}

	// the state reaches the model straight out of a pull payload, uncoerced, so a truthy
	// non-boolean must not pass for a camera that is on
	return Boolean(cameraState);
}
