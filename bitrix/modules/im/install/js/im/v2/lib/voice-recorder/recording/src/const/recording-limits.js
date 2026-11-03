// a record shorter than this is committed with a duration of zero seconds, and the player of such a
// message plays nothing: neither the stop nor the send of the panel turns a recording into a record
// before it holds that much, and a release of the hold below it leaves the recording running
export const MIN_RECORDING_MS = 800;
