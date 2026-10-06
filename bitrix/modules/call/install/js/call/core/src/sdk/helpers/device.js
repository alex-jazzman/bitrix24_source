// True when a live track runs on a device different from the explicitly selected one.
export function deviceMismatch(track, audioDeviceId)
{
	if (audioDeviceId === '' || audioDeviceId === 'default')
	{
		return false;
	}

	const settings = track?.getSettings?.() ?? {};

	return Boolean(settings.deviceId) && settings.deviceId !== audioDeviceId;
}
