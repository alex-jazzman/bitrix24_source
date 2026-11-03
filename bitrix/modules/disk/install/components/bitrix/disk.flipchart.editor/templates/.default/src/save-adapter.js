import { Type } from 'main.core';

/** The states of saving as the header of the document knows them; the board reports one of them. */
export type SaveState = 'neutral' | 'autosave' | 'saving' | 'saved' | 'failed';

/** The board never reports a refusal of its own, so the status it publishes carries no message. */
export type SaveStatus = {
	state: SaveState,
};

/** The board saves by itself and says so from the moment it is opened. */
const AutosaveStatus: SaveStatus = Object.freeze({ state: 'autosave' });

/**
 * State of saving of a board, put into the states of the editor adapter contract.
 *
 * A board is saved entirely by the server. The platform of the board reports a change over the
 * webhook, and Disk downloads the board and writes a new version - right away when the board is
 * ready, and from the queue when it is not: half a minute later, up to ten times
 * (`BoardService::saveDocument()`). None of that result comes back to the browser: the module
 * notifies no participant of a written version, and the page of the board holds no channel of its
 * own, so a save could only ever be reported as still running and never as done.
 *
 * The header therefore shows the mode instead of the outcome: the board is autosaved, and the label
 * of it is put up at once and never taken back. Nothing here depends on whether the board was
 * touched, so there is no event of the board to listen to and nothing to publish afterwards.
 */
export default class SaveAdapter
{
	subscribeToSaveStatus(listener: Function): Function
	{
		if (Type.isFunction(listener))
		{
			listener(AutosaveStatus);
		}

		// the label never changes, so there is nothing to stop telling; the contract stays callable
		return () => {};
	}

	/**
	 * A save of a board cannot be reached from the page: it is started by the platform of the board
	 * and finished by the server, which repeats a save the board was not ready for by itself. The
	 * interface of the board offers the page no save either, and no refusal of a save ever reaches
	 * the page to be repeated. The header draws no retry.
	 */
	canRetrySave(): boolean
	{
		return false;
	}

	retrySave(): Promise<void>
	{
		// nothing to start, see canRetrySave(); the contract stays callable all the same
		return Promise.resolve();
	}
}
