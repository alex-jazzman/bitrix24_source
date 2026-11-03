// One entry point for the two halves of the mention support. They are kept apart on purpose:
// the detector belongs to an input field and dies with it, while the replacement map belongs to
// the draft and is shared - the upload caption borrows the map of the main field instead of
// keeping one of its own, so a mention inserted there still unfolds in the draft of the chat.
export { MentionDetector, MentionDetectorEvents } from './mention-detector';
export { MentionReplacementMap } from './mention-replacement-map';
