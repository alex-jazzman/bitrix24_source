import { Loc, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize, CancelButton, type ButtonOptions } from 'ui.buttons';
import { InfoHelper } from 'ui.info-helper';
import { Dialog, type DialogOptions } from 'ui.system.dialog';
import { Text as Typography } from 'ui.system.typography';

import {
	ConnectionOutcome,
	type ConnectionResponse,
	type ConnectionSnapshot,
	type ConnectionTransport,
	type PopupState,
	type Refusal,
	RefusalBranch,
	type RefusalDisplay,
	RefusalForm,
	type RefusalText,
	RefusalTextSource,
} from '../../const/connection';
import { connectionService } from '../../infrastructure/service/connection/connection';
import { classifyRefusal } from '../../lib/refusal/refusal';
import { getPopupState } from '../../model/popup-state/popup-state';
import { ChangingOperation, type PopupStateSignals, type RefusalSignal } from '../../model/popup-state/types';

// The state of the popup has changed and is to be read anew: the scenarios say that it happened and never
// draw anything themselves.
export type ConnectionStateListener = () => void;

// The standard window of the product opened by the code of the limit from the answer. It stays a parameter
// so that a test can watch it; the popup carries no code of a limit of its own and composes no offer.
export type TariffWindowOpener = (limitCode: string) => void;

// The refusal as the scenarios keep it: what the model of the states reads and what the view draws are one
// record, so the same fact is never held by two fields.
type AcceptedRefusal = RefusalSignal & RefusalDisplay;

const getMessage = (key: string): string => Loc.getMessage(key) ?? '';

// Test markers of the confirmation of the reissue: the end-to-end spec presses these and never a class of
// the dialog of the design system.
const CONFIRM_TEST_ID = 'biconnector-agent-connection-reissue-confirm-btn';
const CONFIRM_CANCEL_TEST_ID = 'biconnector-agent-connection-reissue-cancel-btn';

const readOutcome = (value: unknown): ConnectionOutcome | undefined => {
	return value === ConnectionOutcome.Issued || value === ConnectionOutcome.Exists ? value : undefined;
};

const readText = (value: unknown): string | null => (Type.isStringFilled(value) ? value : null);

const readTextList = (value: unknown): string[] => {
	return Type.isArray(value) ? value.filter((item: unknown): item is string => Type.isStringFilled(item)) : [];
};

const openTariffWindow: TariffWindowOpener = (limitCode: string): void => {
	InfoHelper.show(limitCode);
};

// Where the server has a text meant for a person, that text stands as it came; where it has none, a phrase
// of the popup stands instead. The reserve phrase covers the technical refusals alone and never takes the
// place of the requirement to sign in (AC-027, AC-031).
const getRefusalText = (refusal: Refusal): RefusalText | null => {
	if (refusal.form !== RefusalForm.Core)
	{
		return refusal.humanText === null
			? null
			: { source: RefusalTextSource.Server, value: refusal.humanText }
		;
	}

	const key = refusal.authRequired === true
		? 'BICONNECTOR_AGENT_CONNECTION_AUTH_REQUIRED'
		: 'BICONNECTOR_AGENT_CONNECTION_ERROR'
	;

	return { source: RefusalTextSource.Own, value: getMessage(key) };
};

// The offer to retry is built differently by the two operations, and the asymmetry belongs to the contract:
// the answer of the issue carries `retryable: false` even on the one branch that may be repeated, so there
// the branch itself is the only sign, while the answer of the reissue carries the sign (AC-029).
const isRetryOffered = (refusal: Refusal, operation: ChangingOperation): boolean => {
	if (operation === ChangingOperation.Issue)
	{
		return refusal.branch === RefusalBranch.IssueFailed;
	}

	return refusal.retryable === true;
};

/**
 * The refusal as the popup shows it. The decisions live here and not in the classification: which text
 * stands and whether a retry is offered.
 *
 * `operation` names the changing operation the refusal came on, and `null` says it came on the rereading of
 * the state. Such a refusal offers no retry: the signs of one travel in the answers of the issue and of the
 * reissue alone (AC-029).
 */
const describeRefusal = (refusal: Refusal, operation: ChangingOperation | null): AcceptedRefusal => {
	return {
		form: refusal.form,
		previousConnectionMayBeLost: refusal.previousConnectionMayBeLost,
		text: getRefusalText(refusal),
		canRetry: operation !== null && isRetryOffered(refusal, operation),
	};
};

/**
 * Scenarios of the popup: the reading of the state at the opening, the issue, the reissue and its
 * confirmation. This is the single owner of the state and of the secret - the transport remembers neither,
 * the view only reads them, and the closing of the popup wipes both. No browser storage, no cache and no
 * restoring after a reload.
 */
export class Connection
{
	#transport: ConnectionTransport;
	#onChange: ConnectionStateListener | null;
	#openTariffWindow: TariffWindowOpener;

	// Every opening has its own generation, and an answer of a foreign generation is dropped instead of
	// reaching the state. The promise of a request outlives the closing, and ALG-02 reads the command
	// before the outcome, so without this the answer that came after a closing would show the command at
	// the next opening - against AC-013 and AC-014.
	#opening: number = 0;

	// The last successful answer, the command included: the secret has no holder of its own.
	#response: ConnectionResponse['data'] = null;

	#pending: boolean = false;
	#stateReading: boolean = false;
	#stateReadPromise: Promise<ConnectionResponse> | null = null;

	// Which operation the last changing request was sent by. It outlives the request on purpose: the
	// branch of the refusal reads it already finished, and clearing it would turn the unknown result into
	// a plain refusal and would leave the offer to retry unable to tell the issue from the reissue.
	#pendingOperation: ChangingOperation | null = null;

	// The refusal reaches the state described by the classification and is turned into what the popup shows
	// of it here; the scenarios clear it at the opening, at the closing and before a changing request.
	#refusal: AcceptedRefusal | null = null;

	#unknownResult: boolean = false;

	// The server itself said that it could have lost the previous connection. The sign outlives the refusal
	// it came in, because the reissue started from such a refusal must not be drawn as a connection that
	// holds; only a new successful answer of the server takes the doubt away (AC-020).
	#previousConnectionMayBeLost: boolean = false;

	constructor(
		transport: ConnectionTransport | null,
		onChange: ConnectionStateListener | null = null,
		tariffWindow: TariffWindowOpener | null = null,
	)
	{
		this.#transport = transport ?? connectionService;
		this.#onChange = onChange;
		this.#openTariffWindow = tariffWindow ?? openTariffWindow;
	}

	// The state is read anew at every opening, and the opening starts with the signs of the refusal and of
	// the command cleared: ALG-02 reads the refusal before the reading, so a refusal of the previous
	// opening would otherwise stick and take the place of this waiting. The unknown result is not cleared -
	// it is sticky and only a successful issue or reissue drops it.
	open(): void
	{
		this.#reset();
		this.#stateReading = true;
		this.#notify();

		void this.#read(this.#opening);
	}

	close(): void
	{
		this.#reset();
		this.#notify();
	}

	// The changing request leaves only by an explicit press of a person (AC-004).
	issue(): void
	{
		void this.#change(ChangingOperation.Issue);
	}

	// The reissue passes a confirmation: it stops the agent that works by the previous command (AC-018).
	// The server hears nothing of that confirmation - the actions declare no parameter for it.
	reissue(): void
	{
		this.#confirmReissue(() => {
			void this.#change(ChangingOperation.Reissue);
		});
	}

	// Repeats the changing operation the refusal came on. The reissue passes its confirmation here as well:
	// a repeated reissue stops the agent that works by the previous command just the same (AC-018).
	retry(): void
	{
		if (this.#pendingOperation === ChangingOperation.Reissue)
		{
			this.reissue();

			return;
		}

		this.issue();
	}

	getState(): PopupState
	{
		return getPopupState(this.#getSignals());
	}

	// A changing request is on its way. The popup bans its own closing for that whole time (AC-012), so the
	// owner of the facade reads this sign before starting the scenario anew.
	isChanging(): boolean
	{
		return this.#pending;
	}

	// Whether the popup may still say that a connection of the person holds. A lost answer and a refusal
	// carrying the doubt of the server both take that right away, and a successful answer gives it back
	// (AC-020, AC-033).
	isConnectionAssured(): boolean
	{
		return !this.#unknownResult && !this.#previousConnectionMayBeLost;
	}

	// What the view draws of the refusal that stands now. In the state of the unknown result this is a later
	// refusal and an addition to it, not a replacement of it (AC-038).
	getRefusal(): RefusalDisplay | null
	{
		return this.#refusal;
	}

	// The command is read from the state and from nowhere else.
	getCommand(): string | null
	{
		return readText(this.#response?.command);
	}

	// What the view is allowed to draw of the last successful answer. The fields of the reading of the state
	// and of the issue differ, so an answer that carries none of them gives an empty snapshot rather than
	// a guess.
	getSnapshot(): ConnectionSnapshot
	{
		return {
			command: this.getCommand(),
			scopeNames: readTextList(this.#response?.scopeNames),
			issuedAt: readText(this.#response?.issuedAt),
			expiresAt: readText(this.#response?.expiresAt),
		};
	}

	async #read(opening: number): Promise<void>
	{
		const response = await this.#readState();

		if (opening !== this.#opening || !this.#stateReading)
		{
			return;
		}

		// A refusal of this reading raises no unknown result: the reading changes nothing on the server.
		this.#stateReading = false;

		const refusal = classifyRefusal(response);

		if (refusal === null)
		{
			// A successful reading is the answer to the doubt of the previous connection: what the server
			// says now of the connection stands above what a refusal said of it before.
			this.#response = response.data;
			this.#previousConnectionMayBeLost = false;
		}
		else
		{
			// A refusal of the rereading is shown by the state of the refusal of its form and has neither a
			// state nor a text of its own (AC-037). The code of the limit is not read here at all, so this
			// refusal opens no window of the tariff even when the tariff is what refused it (AC-028).
			this.#refusal = describeRefusal(refusal, null);
		}

		this.#notify();
	}

	#readState(): Promise<ConnectionResponse>
	{
		this.#stateReadPromise ??= this.#transport.getState()
			.finally(() => {
				this.#stateReadPromise = null;
			})
		;

		return this.#stateReadPromise;
	}

	async #change(operation: ChangingOperation): Promise<void>
	{
		// One press of a person gives exactly one changing request even on a quick second press: the guard
		// stands on the sign of the unfinished request, not on the state of the button (AC-011).
		if (this.#pending)
		{
			return;
		}

		const opening = this.#opening;

		this.#pending = true;
		this.#stateReading = false;
		this.#pendingOperation = operation;
		this.#refusal = null;
		this.#notify();

		const response = await this.#send(operation);

		if (opening !== this.#opening)
		{
			return;
		}

		this.#pending = false;
		this.#accept(response, operation);
		this.#notify();
	}

	#send(operation: ChangingOperation): Promise<ConnectionResponse>
	{
		return operation === ChangingOperation.Issue ? this.#transport.issue() : this.#transport.reissue();
	}

	// The outcome 'exists' is a success without a command and not a refusal: it shows as the state of a
	// connection that already holds, with an offer to reissue (AC-017).
	#accept(response: ConnectionResponse, operation: ChangingOperation): void
	{
		const refusal = classifyRefusal(response);

		if (refusal === null)
		{
			this.#response = response.data;
			this.#unknownResult = false;
			this.#previousConnectionMayBeLost = false;

			return;
		}

		// The sticky sign: raised when a changing request is refused without a server verdict and dropped
		// only by a successful answer of a new issue or reissue. No later refusal displaces it, a refusal
		// of the rereading of the state included (AC-038). Such a refusal gets no description of its own
		// either: the state of the unknown result says everything there is to say of it, and the reserve
		// phrase must not stand in its place (AC-027).
		if (refusal.noServerVerdict === true)
		{
			this.#unknownResult = true;

			return;
		}

		// A tariff refusal leads into the standard window of the offer and nowhere else (AC-028): the window
		// goes up and no refusal is recorded, so the popup stays on the screen it stood on before the
		// attempt - the list before the issue or the connection that holds. The person who closes the window
		// finds a screen that means something and may try again from it. The code of the limit is read here
		// and not in the rereading of the state, because the answers of the issue and of the reissue are the
		// only ones that carry it.
		const limitCode = refusal.limitCode ?? null;

		if (limitCode !== null)
		{
			this.#openTariffWindow(limitCode);

			return;
		}

		if (refusal.previousConnectionMayBeLost === true)
		{
			this.#previousConnectionMayBeLost = true;
		}

		this.#refusal = describeRefusal(refusal, operation);
	}

	#confirmReissue(onConfirm: () => void): void
	{
		// Asked from the unknown result, the confirmation adds that the previous connection could have been
		// replaced already (AC-035).
		const messageKey = this.#unknownResult
			? 'BICONNECTOR_AGENT_CONNECTION_REGENERATE_CONFIRM_UNKNOWN'
			: 'BICONNECTOR_AGENT_CONNECTION_REGENERATE_CONFIRM'
		;

		const confirmOptions: Partial<ButtonOptions> = {
			text: getMessage('BICONNECTOR_AGENT_CONNECTION_BTN_REGENERATE'),
			style: AirButtonStyle.FILLED,
			size: ButtonSize.LARGE,
			useAirDesign: true,
			dataset: { testid: CONFIRM_TEST_ID },
			onclick: (): {} => {
				dialog.hide();
				onConfirm();

				return {};
			},
		};

		const cancelOptions: Partial<ButtonOptions> = {
			style: AirButtonStyle.PLAIN,
			size: ButtonSize.LARGE,
			useAirDesign: true,
			dataset: { testid: CONFIRM_CANCEL_TEST_ID },
			onclick: (): {} => {
				dialog.hide();

				return {};
			},
		};

		const dialog = new Dialog({
			content: Typography.render(getMessage(messageKey), { size: 'md', tag: 'div' }),
			hasOverlay: true,
			centerButtons: [
				new Button(confirmOptions as ButtonOptions),
				new CancelButton(cancelOptions as ButtonOptions),
			],
		} as DialogOptions);

		dialog.show();
	}

	#getSignals(): PopupStateSignals
	{
		return {
			response: this.#response === null ? null : {
				outcome: readOutcome(this.#response.outcome),
				hasConnection: this.#response.hasConnection === true,
			},
			pending: this.#pending,
			pendingOperation: this.#pendingOperation,
			stateReading: this.#stateReading,
			command: this.getCommand(),
			refusal: this.#refusal,
			unknownResult: this.#unknownResult,
		};
	}

	// A new generation drops the answers of the previous one, and the state of the popup starts empty: the
	// command leaves the memory of the extension together with the answer it came in (AC-014).
	#reset(): void
	{
		this.#opening += 1;
		this.#response = null;
		this.#refusal = null;
		this.#pending = false;
		this.#stateReading = false;
	}

	#notify(): void
	{
		this.#onChange?.();
	}
}
