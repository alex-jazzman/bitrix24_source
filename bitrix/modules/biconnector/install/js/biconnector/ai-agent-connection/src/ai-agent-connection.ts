import { Extension, Type } from 'main.core';

import { PopupView, type PopupViewState } from './component/popup/popup';
import { Surface } from './component/surface/surface';
import {
	PopupState,
	type AgentOperationCatalog,
	type ConnectionSnapshot,
	type ConnectionTransport,
	type RefusalDisplay,
} from './const/connection';
import { Connection } from './feature/connection/connection';

export type AiAgentConnectionParams = {
	anchor: HTMLElement,
	// The catalogue of the operations. The extension reads it from its own settings, and a caller hands one
	// in only where those settings cannot be read - a test.
	operations?: AgentOperationCatalog | null,
	transport?: ConnectionTransport | null,
};

const EXTENSION_NAME = 'biconnector.ai-agent-connection';

// The server builds the catalogue while it serves this extension, and the header of the report asks for the
// extension at the press of the action: the page of the report carries neither the catalogue nor the cost of
// building it. The records come from the same provider as before, so the contract of the catalogue stands.
const readOperations = (): AgentOperationCatalog => {
	const operations: unknown = Extension.getSettings(EXTENSION_NAME).get('operations');

	return Type.isPlainObject(operations) ? operations as AgentOperationCatalog : {};
};

/**
 * The facade of the extension: it joins the scenarios, the view and the surface and holds no state of its
 * own. The state of the popup and the secret belong to the scenarios, the markup to the view, the placement
 * and the ban on closing to the surface; the facade only carries the changes of the one to the others.
 */
export class AiAgentConnection
{
	#anchor: HTMLElement;
	#operations: AgentOperationCatalog;
	#connection: Connection | null;
	#view: PopupView | null = null;
	#surface: Surface | null = null;

	constructor(params: AiAgentConnectionParams)
	{
		this.#anchor = params.anchor;
		this.#operations = params.operations ?? readOperations();
		this.#connection = new Connection(params.transport ?? null, this.#handleStateChange);
	}

	// The state is reread at every opening, and the rereading is a scenario: the popup goes up first so that
	// the waiting for the answer is seen inside it.
	show(): void
	{
		const connection = this.#connection;
		if (connection === null)
		{
			return;
		}

		const surface = this.#ensureSurface(this.#ensureView());

		// A popup already on the screen is not opened a second time. While a changing request is unfinished
		// the popup may not be closed at all (AC-012), so the action in the header is the only live element
		// left, and a press of it would otherwise start the scenario anew: the answer of the request already
		// sent would be dropped by the generation and the command issued on the server lost with it.
		if (surface.isShown() || connection.isChanging())
		{
			return;
		}

		surface.show();
		connection.open();
	}

	// A destroyed facade is inert: the header owner raises a new one instead of reusing this. Destroying the
	// surface takes the popup off the screen, and the closing wipes the state and the drawn nodes with it.
	destroy(): void
	{
		this.#surface?.destroy();
		this.#surface = null;
		this.#view = null;
		this.#connection = null;
	}

	#handleStateChange = (): void => {
		const connection = this.#connection;
		const view = this.#view;
		if (connection === null || view === null)
		{
			return;
		}

		// A closed popup shows nothing at all: the nodes die together with the state they were drawn from,
		// the field the command was copied from included.
		if (this.#surface?.isShown() !== true)
		{
			view.clear();

			return;
		}

		const state = connection.getState();
		const viewState = this.#toViewState(
			state,
			connection.getSnapshot(),
			connection.getRefusal(),
			connection.isConnectionAssured(),
		);
		if (viewState !== null)
		{
			view.setState(viewState);
		}

		// The ban on closing follows the unfinished changing request, and the surface reads no sign of the
		// scenario itself (AC-012).
		this.#surface.setClosable(state !== PopupState.AwaitIssue && state !== PopupState.AwaitReissue);
	};

	// Every state of the model gets its payload here; where the payload the state needs is missing, nothing
	// is painted and the popup keeps what it already shows.
	#toViewState(
		state: PopupState,
		snapshot: ConnectionSnapshot,
		refusal: RefusalDisplay | null,
		connectionAssured: boolean,
	): PopupViewState | null
	{
		switch (state)
		{
			case PopupState.AwaitState:
				return { state };

			case PopupState.OperationsBeforeIssue:
			case PopupState.AwaitIssue:
				return { state, operations: this.#operations };

			case PopupState.CommandIssued:
				return snapshot.command === null
					? null
					: { state, command: snapshot.command, expiresAt: snapshot.expiresAt }
				;

			case PopupState.ConnectionExists:
			case PopupState.ActiveConnection:
				return { state, connection: snapshot };

			// The waiting for the reissue keeps the screen it was started from. Started where the connection
			// was not assured - the unknown result or the doubt the server itself raised - it carries no
			// connection to draw: for that whole time the popup must not say that the connection holds
			// (AC-020, AC-033).
			case PopupState.AwaitReissue:
				return { state, connection: connectionAssured ? snapshot : null };

			case PopupState.GatewayRefusal:
			case PopupState.AdapterRefusal:
			case PopupState.TechnicalRefusal:
			case PopupState.PreviousConnectionInDoubt:
				return refusal === null ? null : { state, refusal };

			// UnknownResult, the last member of the union: the refusal beside it is a later one and an
			// addition to it, so more often than not there is none.
			default:
				return { state: PopupState.UnknownResult, refusal };
		}
	}

	#ensureView(): PopupView
	{
		this.#view ??= new PopupView({
			onIssue: (): void => this.#connection?.issue(),
			onReissue: (): void => this.#connection?.reissue(),
			onRetry: (): void => this.#connection?.retry(),
		});

		return this.#view;
	}

	#ensureSurface(view: PopupView): Surface
	{
		this.#surface ??= new Surface({
			anchor: this.#anchor,
			bubble: view.getBubble(),
			onClose: (): void => this.#connection?.close(),
		});

		return this.#surface;
	}
}
