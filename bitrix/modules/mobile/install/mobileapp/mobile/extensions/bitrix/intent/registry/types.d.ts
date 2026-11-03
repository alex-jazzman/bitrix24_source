/** Action that opens the section of an intent code. */
declare type IntentAction = () => void;

/** One or several codes of a section paired with the action that opens it. */
declare type IntentActionEntry = {
	codes: string | string[],
	action: IntentAction,
};
