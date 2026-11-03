import { Dom, Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize, type ButtonOptions } from 'ui.buttons';
import { Alert, AlertDesign } from 'ui.system.alert';
import { Input, InputDesign, InputSize, type InputOptions } from 'ui.system.input';
import { Line as SkeletonLine } from 'ui.system.skeleton';
import { Headline, Text as Typography } from 'ui.system.typography';

import {
	type AgentOperation,
	type AgentOperationCatalog,
	type AgentOperationImpact,
	type ConnectionSnapshot,
	PopupState,
	type RefusalDisplay,
	type RefusalText,
	RefusalTextSource,
} from '../../const/connection';
import { getToolSetTitle } from '../../lib/tool-set/tool-set';
import { formatValidity } from '../../lib/validity/validity';

import './popup.css';

const BLOCK_CLASS = 'biconnector-agent-connection';

const IRREVERSIBLE_IMPACT: AgentOperationImpact = 'destructive';

// The title of the window: it heads the content and names the window for a screen reader, so the key is read
// in two places.
const TITLE_KEY = 'BICONNECTOR_AGENT_CONNECTION_TITLE';

// Test markers of the popup. The end-to-end spec of the feature addresses these and never the classes of
// the layout, so a later transfer of the visual leaves it working.
const TestId = Object.freeze({
	Popup: 'biconnector-agent-connection-popup',
	Operations: 'biconnector-agent-connection-operations',
	ToolSetTitle: 'biconnector-agent-connection-tool-set-title',
	Operation: 'biconnector-agent-connection-operation',
	OperationWarning: 'biconnector-agent-connection-operation-warning',
	BoundaryWarning: 'biconnector-agent-connection-boundary-warning',
	SecretWarning: 'biconnector-agent-connection-secret-warning',
	CommandSecretWarning: 'biconnector-agent-connection-command-secret-warning',
	TerminalHint: 'biconnector-agent-connection-terminal-hint',
	CommandField: 'biconnector-agent-connection-command-field',
	Command: 'biconnector-agent-connection-command',
	Scope: 'biconnector-agent-connection-scope',
	IssuedAt: 'biconnector-agent-connection-issued-at',
	ExpiresAt: 'biconnector-agent-connection-expires-at',
	IssueButton: 'biconnector-agent-connection-issue-btn',
	ReissueButton: 'biconnector-agent-connection-reissue-btn',
	RetryButton: 'biconnector-agent-connection-retry-btn',
});

// Placeholder bars of the reading state as [width, height] in pixels: the skeleton primitive of the design
// system takes its geometry as numbers, not as classes.
const READING_BARS: Array<[number, number]> = [[240, 12], [300, 12], [180, 12]];
const READING_BAR_RADIUS = 4;

export type PopupHandlers = {
	onIssue: () => void,
	onReissue: () => void,
	onRetry: () => void,
};

/**
 * States of the popup this view draws. Reading the state at the opening carries nothing of its own; the list
 * before the issue carries the catalogue as it arrived from the server; the states of a connection carry the
 * snapshot of the last successful answer. Waiting for an issue and waiting for a reissue are the screens
 * they were started from with the button that started them switched off. The waiting for a reissue carries
 * no connection where the state it was started from did not assure one: the screen of the doubt stands
 * instead, and nothing on it says that the connection holds.
 *
 * The four refusal states carry the description chosen by the scenarios. An unknown result may have no
 * refusal yet because that signal can arrive later.
 */
export type PopupViewState =
	| { state: typeof PopupState.AwaitState }
	| { state: typeof PopupState.OperationsBeforeIssue, operations: AgentOperationCatalog }
	| { state: typeof PopupState.AwaitIssue, operations: AgentOperationCatalog }
	| { state: typeof PopupState.CommandIssued, command: string, expiresAt: string | null }
	| { state: typeof PopupState.ConnectionExists, connection: ConnectionSnapshot }
	| { state: typeof PopupState.ActiveConnection, connection: ConnectionSnapshot }
	| { state: typeof PopupState.AwaitReissue, connection: ConnectionSnapshot | null }
	| { state: typeof PopupState.GatewayRefusal, refusal: RefusalDisplay }
	| { state: typeof PopupState.AdapterRefusal, refusal: RefusalDisplay }
	| { state: typeof PopupState.TechnicalRefusal, refusal: RefusalDisplay }
	| { state: typeof PopupState.PreviousConnectionInDoubt, refusal: RefusalDisplay }
	| { state: typeof PopupState.UnknownResult, refusal: RefusalDisplay | null };

const getMessage = (key: string, replacements: Record<string, string> | null = null): string => {
	return Loc.getMessage(key, replacements) ?? '';
};

const compact = (nodes: Array<HTMLElement | null>): HTMLElement[] => {
	return nodes.filter((node: HTMLElement | null): node is HTMLElement => node !== null);
};

const markTestId = (node: HTMLElement, testId: string | null): HTMLElement => {
	if (testId !== null)
	{
		Dom.attr(node, 'data-testid', testId);
	}

	return node;
};

const renderNotice = (key: string, design: string, testId: string | null = null): HTMLElement => {
	return markTestId(new Alert({ design, content: getMessage(key) }).render(), testId);
};

const renderNote = (
	key: string,
	testId: string | null = null,
	replacements: Record<string, string> | null = null,
): HTMLElement => {
	return markTestId(
		Typography.render(getMessage(key, replacements), {
			size: 'xs',
			tag: 'div',
			className: `${BLOCK_CLASS}__note`,
		}),
		testId,
	);
};

// Title and warning of the record are server values and reach the DOM as text: the typography primitive
// writes them through textContent, which is the escaping of the view boundary.
const renderOperation = (operation: AgentOperation): HTMLElement => {
	const item: HTMLElement = Tag.render`
		<li class="${BLOCK_CLASS}__operation" data-testid="${TestId.Operation}">
			${Typography.render(operation.title, { size: 'sm', tag: 'div' })}
		</li>
	`;

	if (operation.impact === IRREVERSIBLE_IMPACT)
	{
		Dom.addClass(item, '--irreversible');
	}

	if (Type.isStringFilled(operation.warning))
	{
		Dom.append(
			markTestId(
				Typography.render(operation.warning, {
					size: 'xs',
					tag: 'div',
					className: `${BLOCK_CLASS}__warning`,
				}),
				TestId.OperationWarning,
			),
			item,
		);
	}

	return item;
};

// A set of the catalogue under the name the popup gives it. An unknown code of a set costs the group its
// caption and nothing more: the records of the set stay in the list where the provider put them.
const renderToolSet = (toolSetCode: string, operations: AgentOperation[]): HTMLElement => {
	const group: HTMLElement = Tag.render`
		<div class="${BLOCK_CLASS}__tool-set">
			<ul class="${BLOCK_CLASS}__tool-set-list">
				${operations.map((operation: AgentOperation): HTMLElement => renderOperation(operation))}
			</ul>
		</div>
	`;

	const title = getToolSetTitle(toolSetCode);
	if (title !== null)
	{
		Dom.prepend(
			markTestId(Typography.render(title, { size: 'sm', tag: 'div', accent: true }), TestId.ToolSetTitle),
			group,
		);
	}

	return group;
};

// The whole catalogue, in the grouping and the order of the provider: no selection, no shortening and no
// block to unfold - the irreversible records are in the list along with the rest. The grouping is the one
// the provider gave, and the popup adds the captions of the sets to it and nothing else.
const renderOperations = (catalog: AgentOperationCatalog): HTMLElement => {
	return Tag.render`
		<div
			class="${BLOCK_CLASS}__operations"
			tabindex="0"
			role="region"
			aria-label="${getMessage(TITLE_KEY)}"
			data-testid="${TestId.Operations}"
		>
			${Object.entries(catalog).map(([code, operations]: [string, AgentOperation[]]): HTMLElement => {
				return renderToolSet(code, operations);
			})}
		</div>
	`;
};

// The style comes from the caller: the issue and the reissue are the promoted action of the popup, as the
// visual of the section draws it, while the retry after a refusal keeps the plain primary - the branch of
// the visual draws no refusal at all, and a restoring action is not a promotion.
const renderAction = (
	key: string,
	onClick: () => void,
	disabled: boolean,
	testId: string,
	style: string,
): HTMLElement => {
	const options: Partial<ButtonOptions> = {
		text: getMessage(key),
		style,
		size: ButtonSize.MEDIUM,
		useAirDesign: true,
		disabled,
		dataset: { testid: testId },
		onclick: (): {} => {
			onClick();

			return {};
		},
	};

	return Tag.render`
		<div class="${BLOCK_CLASS}__actions">
			${new Button(options as ButtonOptions).render()}
		</div>
	`;
};

// While the reading is on its way the popup offers no issue at all: neither the button nor the list with a
// working button in its place (AC-036).
const renderReading = (): HTMLElement => {
	return Tag.render`
		<div class="${BLOCK_CLASS}__reading" aria-busy="true">
			${READING_BARS.map(([width, height]: [number, number]): HTMLElement => {
				return SkeletonLine(width, height, READING_BAR_RADIUS);
			})}
		</div>
	`;
};

// The scope of the access is either shown or plainly called unknown: silence in its place is not allowed,
// and an unknown scope stops neither the dates nor the reissue (AC-021).
const renderScope = (scopeNames: string[]): HTMLElement => {
	if (scopeNames.length === 0)
	{
		return renderNote('BICONNECTOR_AGENT_CONNECTION_SCOPE_UNKNOWN');
	}

	return Tag.render`
		<div class="${BLOCK_CLASS}__scope" data-testid="${TestId.Scope}">
			${Typography.render(getMessage('BICONNECTOR_AGENT_CONNECTION_SCOPE_TITLE'), {
				size: 'sm',
				tag: 'div',
				accent: true,
			})}
			<ul class="${BLOCK_CLASS}__scope-list">
				${scopeNames.map((name: string): HTMLElement => Tag.render`
					<li>${Typography.render(name, { size: 'sm', tag: 'span' })}</li>
				`)}
			</ul>
		</div>
	`;
};

// A date is drawn on a filled value alone, so the date of the issue never gets replaced by the date of the
// end; both are read in the timezone of the portal user. An empty result of the formatting counts
// as no date as well: the platform formatter answers with an empty string where the format of the culture is
// missing on the page, and a label with nothing beside it tells the person less than no label at all.
const renderDate = (key: string, value: string | null, testId: string | null = null): HTMLElement | null => {
	const date = formatValidity(value);

	return Type.isStringFilled(date) ? renderNote(key, testId, { '#DATE#': date }) : null;
};

// The copying and the visible confirmation of it are the ready copyable sign of the input of the design
// system: no copying code of ours and no confirmation of ours (AC-015). The secret therefore lives in the
// node of this field as well, and the closing of the popup destroys the node along with the rest.
//
// Two markers, because the field is two nodes: the value is read off the input the design system marks by
// `dataTestId`, and the button that copies it is a node of the design system without a marker of its own -
// it is reached inside the wrapper this function marks.
const renderCommandField = (command: string): HTMLElement => {
	const options: Partial<InputOptions> = {
		value: command,
		readonly: true,
		copyable: true,
		stretched: true,
		size: InputSize.Md,
		design: InputDesign.Grey,
		ariaLabel: getMessage('BICONNECTOR_AGENT_CONNECTION_TERMINAL_CLIENT_HINT'),
		dataTestId: TestId.Command,
	};

	return markTestId(new Input(options as InputOptions).render(), TestId.CommandField);
};

// The command is shown once, and the warning about the secret and the hint about the terminal client hang
// beside it the whole time it is on the screen. The hint leads the state, as the hint of every state does.
const renderCommand = (command: string, expiresAt: string | null): HTMLElement[] => {
	return compact([
		renderNote('BICONNECTOR_AGENT_CONNECTION_TERMINAL_CLIENT_HINT', TestId.TerminalHint),
		renderCommandField(command),
		renderNotice(
			'BICONNECTOR_AGENT_CONNECTION_COMMAND_SECRET_WARNING',
			AlertDesign.tintedWarning,
			TestId.CommandSecretWarning,
		),
		renderDate('BICONNECTOR_AGENT_CONNECTION_STATUS_CONNECTED_UNTIL', expiresAt, TestId.ExpiresAt),
	]);
};

// A connection that holds carries no command: the way to a working one is a reissue and nothing else.
const renderConnected = (snapshot: ConnectionSnapshot, handlers: PopupHandlers, pending: boolean): HTMLElement[] => {
	return compact([
		renderNote('BICONNECTOR_AGENT_CONNECTION_HINT_CONNECTED'),
		renderScope(snapshot.scopeNames),
		renderDate('BICONNECTOR_AGENT_CONNECTION_STATUS_ISSUED_AT', snapshot.issuedAt, TestId.IssuedAt),
		renderDate('BICONNECTOR_AGENT_CONNECTION_STATUS_CONNECTED_UNTIL', snapshot.expiresAt, TestId.ExpiresAt),
		renderAction(
			'BICONNECTOR_AGENT_CONNECTION_BTN_REGENERATE',
			handlers.onReissue,
			pending,
			TestId.ReissueButton,
			AirButtonStyle.FILLED_BOOST,
		),
	]);
};

// Both sources are drawn at one typographic scale but reach the node by different doors. The ready server
// text is encoded by the common contract of the module already and goes in as prepared markup: encoding it
// a second time would show the person the entities instead of the words. A phrase of the popup goes in as
// text. The two never share one insertion.
const renderRefusalText = (text: RefusalText): HTMLElement => {
	const content = Typography.render('', { size: 'sm', tag: 'div' });

	if (text.source === RefusalTextSource.Server)
	{
		Dom.adjust(content, { html: text.value });
	}
	else
	{
		Dom.adjust(content, { text: text.value });
	}

	return new Alert({ design: AlertDesign.tintedAlert, content }).render();
};

// A refusal is told by the text that came with it and, where the contract allows it, by the button that
// repeats the same operation (AC-029). A tariff refusal never reaches this state at all: the scenarios open
// the standard window of the offer instead and leave the popup on the screen it stood on (AC-028).
const renderRefusal = (refusal: RefusalDisplay, handlers: PopupHandlers): HTMLElement[] => {
	return compact([
		refusal.text === null ? null : renderRefusalText(refusal.text),
		refusal.canRetry
			? renderAction(
				'BICONNECTOR_AGENT_CONNECTION_BTN_RETRY',
				handlers.onRetry,
				false,
				TestId.RetryButton,
				AirButtonStyle.FILLED,
			)
			: null,
	]);
};

// The result of the operation is unknown, and the popup says so in its own words: it claims neither that the
// operation failed nor that the previous connection still holds, promises no way back to the lost command
// and leads to a new reissue (AC-032...AC-034). A later refusal - one of the rereading of the state included
// - stands beside that message and never in its place (AC-038).
const renderUnknownResult = (
	refusal: RefusalDisplay | null,
	handlers: PopupHandlers,
	pending: boolean,
): HTMLElement[] => {
	const addition = refusal?.text ?? null;

	return compact([
		renderNotice('BICONNECTOR_AGENT_CONNECTION_UNKNOWN_RESULT', AlertDesign.tintedWarning),
		addition === null ? null : renderRefusalText(addition),
		renderAction(
			'BICONNECTOR_AGENT_CONNECTION_BTN_REGENERATE',
			handlers.onReissue,
			pending,
			TestId.ReissueButton,
			AirButtonStyle.FILLED_BOOST,
		),
	]);
};

const renderBeforeIssue = (
	catalog: AgentOperationCatalog,
	handlers: PopupHandlers,
	pending: boolean,
): HTMLElement[] => {
	return [
		renderNotice(
			'BICONNECTOR_AGENT_CONNECTION_BOUNDARY_WARNING',
			AlertDesign.tintedWarning,
			TestId.BoundaryWarning,
		),
		renderNotice('BICONNECTOR_AGENT_CONNECTION_SECRET_WARNING', AlertDesign.tinted, TestId.SecretWarning),
		renderOperations(catalog),
		renderAction(
			'BICONNECTOR_AGENT_CONNECTION_BTN_CONNECT',
			handlers.onIssue,
			pending,
			TestId.IssueButton,
			AirButtonStyle.FILLED_BOOST,
		),
	];
};

// The button that started a changing request stays off until the answer comes (AC-011); the ban on closing
// the popup for that same time is the business of the surface and is switched from the outside.
const renderBody = (view: PopupViewState, handlers: PopupHandlers): HTMLElement[] => {
	switch (view.state)
	{
		case PopupState.AwaitState:
			return [renderReading()];

		case PopupState.OperationsBeforeIssue:
			return renderBeforeIssue(view.operations, handlers, false);

		case PopupState.AwaitIssue:
			return renderBeforeIssue(view.operations, handlers, true);

		case PopupState.CommandIssued:
			return renderCommand(view.command, view.expiresAt);

		case PopupState.ConnectionExists:
		case PopupState.ActiveConnection:
			return renderConnected(view.connection, handlers, false);

		// Started from the unknown result or from the doubt of the server, the waiting carries no connection:
		// the screen of the doubt stands with its button off, and the popup claims nothing of a connection it
		// cannot vouch for (AC-020, AC-033).
		case PopupState.AwaitReissue:
			return view.connection === null
				? renderUnknownResult(null, handlers, true)
				: renderConnected(view.connection, handlers, true)
			;

		// The refusal of the rereading of the state is drawn by the state of its form and by nothing of its
		// own, so the four states below serve both it and the refusal of a changing request.
		case PopupState.GatewayRefusal:
		case PopupState.AdapterRefusal:
		case PopupState.TechnicalRefusal:
		case PopupState.PreviousConnectionInDoubt:
			return renderRefusal(view.refusal, handlers);

		// UnknownResult, the last member of the union.
		default:
			return renderUnknownResult(view.refusal, handlers, false);
	}
};

/**
 * The view of the popup: a pure function of the state and of the handler set. It reaches no server, changes
 * no state of its own and decides nothing about the scenario - this is the seam the visual of the author of
 * the section is laid into.
 *
 * The title heads every state and the body carries the state itself, at a rhythm of its own: that is the
 * composition of the branch of the visual.
 */
export const renderPopup = (view: PopupViewState, handlers: PopupHandlers): HTMLElement => {
	return Tag.render`
		<div class="${BLOCK_CLASS}__content">
			${Headline.render(getMessage(TITLE_KEY), { size: 'md' })}
			<div class="${BLOCK_CLASS}__body">${renderBody(view, handlers)}</div>
		</div>
	`;
};

/**
 * Mounted view: it holds the bubble the surface is given once and redraws it on a change of the state. The
 * redrawing follows the state and nothing else - the same state handed in twice repaints nothing.
 */
export class PopupView
{
	#bubble: HTMLElement = Tag.render`<div class="${BLOCK_CLASS}" data-testid="${TestId.Popup}"></div>`;
	#handlers: PopupHandlers;
	#state: PopupViewState | null = null;

	constructor(handlers: PopupHandlers)
	{
		this.#handlers = handlers;
		// The engine of the popover builds no root of its own, so the role of the window and its name live on
		// the bubble; the name repeats the title the content heads with.
		Dom.attr(this.#bubble, { role: 'dialog', 'aria-label': getMessage(TITLE_KEY) });
	}

	getBubble(): HTMLElement
	{
		return this.#bubble;
	}

	setState(view: PopupViewState): void
	{
		if (view === this.#state)
		{
			return;
		}

		this.#state = view;
		Dom.clean(this.#bubble);
		Dom.append(renderPopup(view, this.#handlers), this.#bubble);
	}

	// The physical destruction of the drawn nodes, the field the command was copied from included. The rule
	// of who owns the secret lives in the scenarios; the emptying of the node lives here.
	clear(): void
	{
		this.#state = null;
		Dom.clean(this.#bubble);
	}
}
