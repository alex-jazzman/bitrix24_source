import { ConnectionOutcome, PopupState } from '../../const/connection';
import { ChangingOperation, RefusalForm, type PopupStateSignals, type RefusalSignal } from './types';

const getRefusalState = (refusal: RefusalSignal): PopupState => {
	// The server said itself that it could have lost the previous connection: this stands before the form,
	// because the popup must not claim that the previous connection still holds (AC-020).
	if (refusal.previousConnectionMayBeLost === true)
	{
		return PopupState.PreviousConnectionInDoubt;
	}

	if (refusal.form === RefusalForm.Gateway)
	{
		return PopupState.GatewayRefusal;
	}

	if (refusal.form === RefusalForm.Adapter)
	{
		return PopupState.AdapterRefusal;
	}

	return PopupState.TechnicalRefusal;
};

/**
 * ALG-02: the state of the popup as a pure function of the seven signs. It knows nothing of the requests,
 * of the markup and of the windows, and it classifies no refusal - the refusal reaches it described.
 *
 * The order of the branches is a part of the rule, not a matter of taste, and every step of it below says
 * why it stands where it stands.
 */
export const getPopupState = (signals: PopupStateSignals): PopupState => {
	const { response, pending, pendingOperation, stateReading, command, refusal, unknownResult } = signals;

	if (pending)
	{
		return pendingOperation === ChangingOperation.Issue ? PopupState.AwaitIssue : PopupState.AwaitReissue;
	}

	// A sticky sign, and it stands before the refusal on purpose. It is raised when a changing request is
	// refused without a server verdict and it is dropped only by a successful answer of a new issue or
	// reissue; no later refusal displaces it. The popup rereads the state from here, and a refusal of that
	// rereading by another cause would take the place of the unknown result: a person with a dead command
	// would read "no rights in BI" and decide that the rights are the matter (AC-038).
	if (unknownResult)
	{
		return PopupState.UnknownResult;
	}

	if (refusal !== null)
	{
		return getRefusalState(refusal);
	}

	// After the sign of the refusal, not before it: on the way back from the unknown result the rereading
	// must not replace the state that leads to a new reissue (AC-034). The price of that order is that the
	// opening of the popup has to start with the signs of the refusal and of the command cleared ([P2.T2]),
	// otherwise a refusal of the previous opening sticks and takes the place of this waiting.
	if (stateReading)
	{
		return PopupState.AwaitState;
	}

	if (command !== null)
	{
		return PopupState.CommandIssued;
	}

	if (response?.outcome === ConnectionOutcome.Exists)
	{
		return PopupState.ConnectionExists;
	}

	if (response?.hasConnection === true)
	{
		return PopupState.ActiveConnection;
	}

	return PopupState.OperationsBeforeIssue;
};
