// the type lives next to the capability of the browser and not with the panel: the interface of
// the recording and its machinery are loaded only once the microphone is pressed
export type VoiceRecord = {
	blob: Blob,
	// the length of the record in both units: the message of the chat carries the whole seconds, and
	// the minimum length a record may be sent at is checked against the milliseconds
	durationMs: number,
	durationSeconds: number,
	isTargetFormat: boolean,
};
