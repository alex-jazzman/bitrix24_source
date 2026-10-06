import { Hardware } from '../../call_hardware';

// TODO: remove direct dependency on singletons, pass as parameters
export const isNoiseSuppressionInputTrackOff = () => {
	return Hardware.noiseSuppressionInputStream
		&& Hardware.noiseSuppressionInputStream.getAudioTracks().length > 0
		&& Hardware.noiseSuppressionInputStream.getAudioTracks()[0].readyState !== 'live';
};

type MediaConstraints = {
	audio: boolean | { deviceId: { exact: string } },
	video: boolean | {
		width?: { ideal: number },
		height?: { ideal: number },
		deviceId?: { exact: string },
	},
};

export const buildMediaConstraints = (
	options: { video?: boolean, audio?: boolean },
	fallbackMode: boolean,
	devices: {
		videoDeviceId?: string,
		audioDeviceId?: string,
		defaultVideoResolution?: { width: number, height: number },
	},
): MediaConstraints => {
	const constraints = {
		audio: false,
		video: false,
	};

	if (options.video)
	{
		constraints.video = {};
		if (!fallbackMode)
		{
			constraints.video.width = { ideal: devices.defaultVideoResolution?.width };
			constraints.video.height = { ideal: devices.defaultVideoResolution?.height };
			if (devices.videoDeviceId)
			{
				constraints.video.deviceId = { exact: devices.videoDeviceId };
			}
		}

		return constraints;
	}

	// Note: in fallback mode, audioDeviceId is intentionally ignored to use the default device.
	// This aligns call_api.js behavior with call-api-legacy.js
	if (devices.audioDeviceId && !fallbackMode)
	{
		constraints.audio = {
			deviceId: { exact: devices.audioDeviceId },
		};
	}
	else
	{
		constraints.audio = true;
	}

	return constraints;
};
