import { type ConnectionOutcome, RefusalForm } from '../../const/connection';

// Which changing operation the request was sent by. The answer does not tell the issue from the reissue,
// so the sign travels beside it, and it must outlive the request: the branch of the refusal reads it on an
// already finished request, and clearing it in a `finally` breaks both the unknown result (AC-032) and the
// offer to retry (AC-029).
export const ChangingOperation = Object.freeze({
	Issue: 'ISSUE',
	Reissue: 'REISSUE',
});

export type ChangingOperation = typeof ChangingOperation[keyof typeof ChangingOperation];

// The vocabulary of the forms lives in the registry of the constants, where the classification of [P3.T1]
// reads it too: the model only reads the form and never names it twice.
export { RefusalForm };

// The refusal as the model reads it: the form and the single sign that outranks it. The rest of the
// description - branch, texts, repeatability, the code of the limit - is read by the view, not here.
// `previousConnectionMayBeLost` is optional because it exists in the form of the adapter alone.
export type RefusalSignal = {
	form: RefusalForm,
	previousConnectionMayBeLost?: boolean,
};

// The last successful answer as the model reads it: two fields pick the state and no more. The data of the
// answer itself - the command, the dates, the names of the scopes - is read from it after the state is
// chosen. Both fields are optional: the reading of the state carries `hasConnection` and the issue carries
// `outcome`, and neither answer carries the other field.
export type SuccessfulResponseSignal = {
	outcome?: ConnectionOutcome,
	hasConnection?: boolean,
};

// The seven signs the state of the popup is derived from.
export type PopupStateSignals = {
	response: SuccessfulResponseSignal | null,
	pending: boolean,
	pendingOperation: ChangingOperation | null,
	stateReading: boolean,
	command: string | null,
	refusal: RefusalSignal | null,
	unknownResult: boolean,
};
