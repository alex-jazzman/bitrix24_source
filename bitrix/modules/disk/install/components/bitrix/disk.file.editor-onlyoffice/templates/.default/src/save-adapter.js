import { Loc, Type } from 'main.core';

/** Three product states of saving plus the neutral one, as the header of the document knows them. */
export type SaveState = 'neutral' | 'saving' | 'saved' | 'failed';

export type SaveStatus = {
	state: SaveState,
	// filled in only for 'failed'; the text is shown to the user
	errorMessage: ?string,
};

/**
 * Starts the save the editor runs on its own. OnlyOffice keeps saving entirely inside the document
 * server: the editor saves by itself and by its own button, and its public interface for the page
 * offers no save among its methods - a forced save is a call between the servers. So the shell has
 * nothing to pass here and the header renders no retry, which costs the user nothing: the editor
 * repeats a refused save on its own, and the repetition reaches the header as the next state of the
 * document. A request appears the day a save of this document becomes reachable from the page.
 */
export type SaveRequest = () => void;

/**
 * How the page tells the instruction of a failure. The indicator of the header holds one short line
 * and neither wraps nor shrinks it, so what to do about the failure goes to a notification instead.
 * `isFinal` marks the failure nothing follows: such an instruction waits for the user.
 */
export type SaveHintNotifier = (message: string, isFinal: boolean) => void;

/** Clock of the guard: the page leaves it to the timers of the window, a test replaces both. */
export type SaveTimers = {
	setTimeout: (handler: Function, timeout: number) => number,
	clearTimeout: (timer: number) => void,
};

export type SaveAdapterOptions = {
	requestSave: ?SaveRequest,
	timers: ?SaveTimers,
	showHint: ?SaveHintNotifier,
};

/** `onDocumentStateChange` of the editor: `data` is true while the changes are not collected yet. */
type DocumentStateChangeEvent = {
	data: ?boolean,
};

/** Payload of `onError` of the editor. */
type EditorError = {
	errorCode: ?number,
	errorDescription: ?string,
};

/** Payload of `onWarning` of the editor, already unpacked by the page. */
export type EditorWarning = {
	warningCode: ?number,
	warningDescription: ?string,
};

export type FailureReason = 'editor_failure' | 'save_unconfirmed';

/**
 * A failure worth a report to the portal, and the moment the editor takes it back. The text of the
 * editor travels here and only here: the header speaks the phrases of the portal. `isFinal` marks
 * the failure nothing follows; a removable one the editor takes back by saving again.
 */
export type FailureEvent = {
	kind: 'failure' | 'recovered',
	reason: FailureReason,
	isFinal: boolean,
	editorCode: ?number,
	editorMessage: ?string,
};

/** A save which stays unconfirmed this long is not coming: the normal one takes about a second. */
const GUARD_SECONDS = 30;

/** The editor stopped on its own error; nothing about this document follows it. */
const EDITOR_FAILURE_WARNING = -25;

/** The portal refused the save the editor offered; the editing goes on. */
const REFUSED_SAVE_WARNING = -331;

/** `DocumentInfo::CONTENT_STATUS_SAVE_REJECTED`: the portal refused the save which ended the session. */
const REJECTED_CONTENT_STATUS = 7;

/** `DocumentInfo::CONTENT_STATUS_INTERRUPTED`: the session ended without a final save. */
const INTERRUPTED_CONTENT_STATUS = 8;

/** The statuses which end the session: the editor has no save of this document left to confirm. */
const finalContentStatuses = new Set([REJECTED_CONTENT_STATUS, INTERRUPTED_CONTENT_STATUS]);

/** What the indicator of the header keeps, and what the notification tells once about the same failure. */
type SavePhrase = {
	state: string,
	hint: string,
};

const Phrase = {
	notSavedToDisk: {
		state: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_NOT_SAVED_TO_DISK',
		hint: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_NOT_SAVED_TO_DISK_HINT',
	},
	interrupted: {
		state: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_INTERRUPTED',
		hint: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_INTERRUPTED_HINT',
	},
	editorFailure: {
		state: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_EDITOR_FAILURE',
		hint: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_EDITOR_FAILURE_HINT',
	},
	unconfirmed: {
		state: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_UNCONFIRMED',
		hint: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_UNCONFIRMED_HINT',
	},
};

/** Categories of a refused save of the portal, `Save\FailureCategory` of the module. */
const phraseByCategory = new Map([
	['download_failed', Phrase.notSavedToDisk],
	['incomplete_file', Phrase.notSavedToDisk],
	['write_failed', Phrase.notSavedToDisk],
	['session_interrupted', Phrase.interrupted],
]);

/**
 * State of saving of a document opened in OnlyOffice, told to the header in the three product states
 * of the editor adapter contract. The editor reports the beginning of a change and the moment it has
 * handed every change over to the document server - that moment is the save the header shows, the
 * same one the own indicator of the editor works by. The channel of the document confirms the write
 * to Disk afterwards and only repeats the state the header is already in.
 *
 * A save which never happens reaches the page three ways: as a warning of the editor, as an error of
 * the editor, or as nothing at all - and the last one is why the adapter keeps a guard of its own.
 */
export default class SaveAdapter
{
	#listeners: Set<Function> = new Set();
	#failureListeners: Set<Function> = new Set();
	#status: ?SaveStatus = null;
	#requestSave: ?SaveRequest = null;
	#timers: SaveTimers = {
		setTimeout: (handler: Function, timeout: number) => setTimeout(handler, timeout),
		clearTimeout: (timer: number) => clearTimeout(timer),
	};

	#showHint: SaveHintNotifier = () => {};

	#guardTimer: ?number = null;
	/** The failure of the editor is final: no state of the document is believed after it. */
	#terminal: boolean = false;
	/**
	 * The session ended and the changes never reached Disk. The editor of this page goes on reporting
	 * states of the document, and none of them is evidence of a write any more: only the write itself.
	 */
	#endedWithoutSave: boolean = false;
	/** The instruction is told once per continuous failure; the state of it stays in the header. */
	#hintTold: boolean = false;
	/** The failure reported to the page, kept until the editor takes it back. */
	#failure: ?FailureEvent = null;

	constructor(options: SaveAdapterOptions = {})
	{
		if (Type.isFunction(options.requestSave))
		{
			this.#requestSave = options.requestSave;
		}

		if (Type.isFunction(options.timers?.setTimeout) && Type.isFunction(options.timers?.clearTimeout))
		{
			this.#timers = options.timers;
		}

		if (Type.isFunction(options.showHint))
		{
			this.#showHint = options.showHint;
		}
	}

	subscribeToSaveStatus(listener: Function): Function
	{
		if (!Type.isFunction(listener))
		{
			return () => {};
		}

		this.#listeners.add(listener);

		// a header mounted after the editor has already reported something starts from the truth
		if (this.#status !== null)
		{
			listener(this.#status);
		}

		return () => {
			this.#listeners.delete(listener);
		};
	}

	/**
	 * The page reports a failure to the portal once per continuous failure, so the events come in
	 * pairs: a failure, and the recovery which takes a removable one back.
	 */
	subscribeToFailure(listener: Function): Function
	{
		if (!Type.isFunction(listener))
		{
			return () => {};
		}

		this.#failureListeners.add(listener);

		return () => {
			this.#failureListeners.delete(listener);
		};
	}

	canRetrySave(): boolean
	{
		return this.#requestSave !== null;
	}

	async retrySave(): Promise<void>
	{
		if (this.#requestSave === null || this.#terminal)
		{
			return;
		}

		this.#publish({ state: 'saving' });

		try
		{
			// the request is only started here: its result comes back as the next status, not as a resolution
			this.#requestSave();
		}
		catch
		{
			// the attempt could not even be started, so the refusal has no explanation of its own
			this.#publish({ state: 'failed' });
		}
	}

	/**
	 * A document with changes the editing service has not collected yet is a document being saved, and
	 * a document whose changes it has collected is a saved one. This is the only source of the status
	 * inside the session: the channel of the document reports the save which ends the session, not the
	 * saves inside it, so waiting for it would leave the header in saving until the very end.
	 */
	handleDocumentStateChange(event: DocumentStateChangeEvent): void
	{
		if (this.#terminal || this.#endedWithoutSave)
		{
			return;
		}

		if (event?.data === true)
		{
			this.#publish({ state: 'saving' });

			return;
		}

		if (event?.data !== false)
		{
			return;
		}

		// the editor has confirmed the changes itself, which takes a removable failure back
		if (this.#failure !== null)
		{
			this.#publish({ state: 'saved' });
			this.#emitRecovered();

			return;
		}

		if (this.#hasUnconfirmedChanges())
		{
			this.#publish({ state: 'saved' });
		}
	}

	/** The channel of the document carries the write to Disk of the save which ended the session. */
	handleSaveConfirmed(): void
	{
		if (this.#terminal)
		{
			return;
		}

		// the write to Disk is the only thing which takes back a session ended without a save
		this.#endedWithoutSave = false;
		this.#publish({ state: 'saved' });
	}

	/**
	 * A version written inside the session. The editor of a living session claims its own saves, so
	 * such a write says nothing new to a page whose session goes on. To a page told the session ended
	 * without a save it says everything: the write is the very evidence that refusal waits for, and it
	 * takes the refusal back the way the write which ends the session does.
	 */
	handleIntermediateWrite(): void
	{
		if (this.#terminal || !this.#endedWithoutSave)
		{
			return;
		}

		this.#endedWithoutSave = false;
		this.#publish({ state: 'saved' });
		// the page saves again, so it may go back to telling the portal that the work goes on
		this.#emitRecovered();
	}

	/**
	 * The session ended on a save which never reached Disk. The channel tells the outcome of the whole
	 * session, so the refusal is published whatever the header shows now: the editor of this page may
	 * have handed its changes over long ago and be sitting in saved, and that is exactly the claim
	 * being taken back. The category names what went wrong on the portal side.
	 */
	handleSaveRejected(category: ?string = null, contentStatus: ?number = null): void
	{
		if (this.#terminal)
		{
			return;
		}

		const endsSession = finalContentStatuses.has(contentStatus);

		// the end of the session is the last word about this document, so its instruction is told even
		// when a failure before it has told one of its own - and once, however often it is reported
		if (endsSession && !this.#endedWithoutSave)
		{
			this.#hintTold = false;
		}

		this.#publishFailure(this.#phraseOfRefusal(category, contentStatus));

		// the editor of this page knows nothing of the end of the session: it goes on collecting the
		// changes of the user and calling them saves, and not one of them reaches Disk any more
		if (endsSession)
		{
			this.#endedWithoutSave = true;
		}
	}

	/**
	 * The editor reports a refused save and its own breakdown as warnings, and `onError` arrives in
	 * neither case. A breakdown of the editor (-25) is final: the session of this document is lost
	 * inside the editor and only a copy saved by hand carries the changes out.
	 */
	handleEditorWarning(warning: EditorWarning): void
	{
		if (!Type.isNumber(warning?.warningCode))
		{
			// eslint-disable-next-line no-console
			console.warn('disk.file.editor-onlyoffice: a warning of the editor without a code', warning);

			return;
		}

		if (this.#terminal)
		{
			return;
		}

		if (warning.warningCode === EDITOR_FAILURE_WARNING)
		{
			this.#terminal = true;
			// a copy saved by hand is all that is left of the changes, so this instruction is told again
			this.#hintTold = false;
			this.#publishFailure(Phrase.editorFailure);
			// the breakdown is reported even when a removable failure has already been reported
			this.#failure = null;
			this.#emitFailure('editor_failure', warning.warningCode, warning.warningDescription);

			return;
		}

		// the session has already ended without the changes reaching Disk; a refused save of the editor
		// neither adds to that nor is able to take it back
		if (this.#endedWithoutSave)
		{
			return;
		}

		if (warning.warningCode === REFUSED_SAVE_WARNING)
		{
			this.#publishFailure(Phrase.notSavedToDisk);
		}
	}

	/**
	 * Errors of opening arrive the same way as errors of saving, so a refusal is reported only while
	 * there are changes no save has confirmed yet. Such an error is not the end of the editing: the
	 * state is removable and the editor takes it back by confirming the changes.
	 */
	handleEditorError(error: EditorError): void
	{
		// a page whose session is over must not soften the refusal with a status which never updates
		if (this.#terminal || this.#endedWithoutSave || !this.#hasUnconfirmedChanges())
		{
			return;
		}

		this.#publishFailure(Phrase.unconfirmed);
		this.#emitFailure('editor_failure', error?.errorCode, error?.errorDescription);
	}

	#phraseOfRefusal(category: ?string, contentStatus: ?number): SavePhrase
	{
		const phrase = Type.isStringFilled(category) ? phraseByCategory.get(category) : undefined;

		if (phrase !== undefined)
		{
			return phrase;
		}

		if (contentStatus === INTERRUPTED_CONTENT_STATUS)
		{
			return Phrase.interrupted;
		}

		// a category the page does not know still means the changes are not on Disk
		return Phrase.notSavedToDisk;
	}

	#hasUnconfirmedChanges(): boolean
	{
		return this.#status?.state === 'saving' || this.#status?.state === 'failed';
	}

	/**
	 * Nothing has confirmed the save for too long and nothing has refused it either: the page says so
	 * itself rather than leaving the header in saving forever.
	 */
	#startGuard(): void
	{
		if (this.#terminal || this.#guardTimer !== null)
		{
			return;
		}

		this.#guardTimer = this.#timers.setTimeout(() => {
			this.#guardTimer = null;
			this.#publishFailure(Phrase.unconfirmed);
			this.#emitFailure('save_unconfirmed', null, null);
		}, GUARD_SECONDS * 1000);
	}

	#stopGuard(): void
	{
		if (this.#guardTimer === null)
		{
			return;
		}

		this.#timers.clearTimeout(this.#guardTimer);
		this.#guardTimer = null;
	}

	#publishFailure(phrase: SavePhrase): void
	{
		this.#publish({ state: 'failed', errorMessage: Loc.getMessage(phrase.state) });
		this.#tellHint(phrase);
	}

	/**
	 * What to do about a failure is longer than the one line of the indicator, so the page tells it
	 * once per continuous failure: a second notification about a state already shown is noise.
	 */
	#tellHint(phrase: SavePhrase): void
	{
		if (this.#hintTold)
		{
			return;
		}

		this.#hintTold = true;
		this.#showHint(Loc.getMessage(phrase.hint), this.#terminal);
	}

	#publish(status: SaveStatus): void
	{
		if (this.#status?.state === status.state && this.#status?.errorMessage === status.errorMessage)
		{
			return;
		}

		this.#status = status;

		if (status.state !== 'failed')
		{
			this.#hintTold = false;
		}

		if (status.state === 'saving')
		{
			this.#startGuard();
		}
		else
		{
			this.#stopGuard();
		}

		this.#listeners.forEach((listener) => listener(status));
	}

	#emitFailure(reason: FailureReason, editorCode: ?number, editorMessage: ?string): void
	{
		// one report per continuous failure: the page turns this event into a request to the portal
		if (this.#failure !== null)
		{
			return;
		}

		this.#failure = {
			kind: 'failure',
			reason,
			isFinal: this.#terminal,
			editorCode: Type.isNumber(editorCode) ? editorCode : null,
			editorMessage: Type.isStringFilled(editorMessage) ? editorMessage : null,
		};

		this.#failureListeners.forEach((listener) => listener(this.#failure));
	}

	#emitRecovered(): void
	{
		if (this.#failure === null)
		{
			return;
		}

		const recovered = { ...this.#failure, kind: 'recovered' };
		this.#failure = null;

		this.#failureListeners.forEach((listener) => listener(recovered));
	}
}
