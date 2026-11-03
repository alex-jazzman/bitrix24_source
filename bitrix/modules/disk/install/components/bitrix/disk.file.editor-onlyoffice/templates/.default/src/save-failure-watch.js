import { ajax as Ajax, Type } from 'main.core';
import type SaveAdapter from './save-adapter';
import type { FailureEvent } from './save-adapter';

/** `disk.api.onlyoffice.reportEditorFailure`: the log of the portal, not a claim to the user. */
const REPORT_ACTION = 'disk.api.onlyoffice.reportEditorFailure';

export type SaveFailureWatchOptions = {
	adapter: SaveAdapter,
	sessionId: number,
	documentSessionHash: string,
	// the page stops holding the session alive on a failure nothing follows, and resumes when a
	// removable one is over
	onFailure: ?Function,
	onRecovered: ?Function,
};

/**
 * What the page does with a failure of saving the adapter has found: it reports the failure to the
 * log, and a failure nothing follows also stops it telling the portal that the work on the document
 * goes on. A removable failure leaves that signal alone: the editor saves again on its own, while a
 * page gone silent meanwhile is an idle session the portal interrupts for everyone editing the
 * document. The session itself stays open - the co-authors go on editing the same document - so
 * nothing here touches it.
 *
 * The watch knows the page only by the two calls it was given, which is what keeps it free of the
 * editor shell and of every extension that shell loads.
 */
export default class SaveFailureWatch
{
	#sessionId: number = 0;
	#documentSessionHash: string = '';
	#onFailure: Function = () => {};
	#onRecovered: Function = () => {};
	#unsubscribe: ?Function = null;

	constructor(options: SaveFailureWatchOptions)
	{
		this.#sessionId = options.sessionId;
		this.#documentSessionHash = options.documentSessionHash;

		if (Type.isFunction(options.onFailure))
		{
			this.#onFailure = options.onFailure;
		}

		if (Type.isFunction(options.onRecovered))
		{
			this.#onRecovered = options.onRecovered;
		}

		this.#unsubscribe = options.adapter.subscribeToFailure(this.#handleFailure.bind(this));
	}

	destroy(): void
	{
		if (this.#unsubscribe === null)
		{
			return;
		}

		this.#unsubscribe();
		this.#unsubscribe = null;
	}

	#handleFailure(event: FailureEvent): void
	{
		if (event.kind === 'recovered')
		{
			this.#onRecovered();

			return;
		}

		// a page which will never save again must not tell the portal that the work on the document
		// goes on; a page which still may save must go on telling it, or the session is interrupted
		if (event.isFinal)
		{
			this.#onFailure();
		}

		// the log of the portal keeps every failure, removable or not
		this.#report(event);
	}

	#report(failure: FailureEvent): void
	{
		Ajax.runAction(REPORT_ACTION, {
			mode: 'ajax',
			json: {
				sessionId: this.#sessionId,
				documentSessionHash: this.#documentSessionHash,
				reason: failure.reason,
				editorCode: failure.editorCode,
				editorMessage: failure.editorMessage,
			},
		}).catch(() => {
			// the failure itself is already told by the header; a report nobody took changes nothing here
		});
	}
}
