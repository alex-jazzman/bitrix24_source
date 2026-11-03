export const Capability = {
	nativeTarget: 'nativeTarget',
	clientEncode: 'clientEncode',
	serverConvert: 'serverConvert',
	unavailable: 'unavailable',
};

// m4a with AAC-LC: the mime type is what a recorder is asked for, the codec config - what an encoder is
// configured with. The aac bitstream format stays at its default - raw frames, what an mp4 container takes
export const TargetFormat = {
	mimeType: 'audio/mp4;codecs=mp4a.40.2',
	codecConfig: {
		codec: 'mp4a.40.2',
		sampleRate: 48000,
		numberOfChannels: 1,
		bitrate: 64000,
	},
};
