/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_buttons, ui_system_alert, ui_system_input, ui_system_skeleton, ui_system_typography, main_date, ui_a11y, ui_system_popover, ui_infoHelper, ui_system_dialog, biconnector_errorMessage) {
	'use strict';

	const ConnectionAction = Object.freeze({
		GetState: 'biconnector.mcpconnection.getState',
		Issue: 'biconnector.mcpconnection.issue',
		Reissue: 'biconnector.mcpconnection.reissue'
	});
	const ConnectionOutcome = Object.freeze({
		Issued: 'issued',
		Exists: 'exists'
	});
	const RefusalBranch = Object.freeze({
		AuthRequired: 'BI_MCP_AUTH_REQUIRED',
		PortalDisabled: 'BI_MCP_PORTAL_DISABLED',
		AdminDisabled: 'BI_MCP_ADMIN_DISABLED',
		SubscriptionRequired: 'BI_MCP_SUBSCRIPTION_REQUIRED',
		NotEmployee: 'BI_MCP_NOT_EMPLOYEE',
		ScopesDisabled: 'BI_MCP_SCOPES_DISABLED',
		NotCreator: 'BI_MCP_NOT_CREATOR',
		ConstructorDisabled: 'BI_MCP_CONSTRUCTOR_DISABLED',
		ModuleUnavailable: 'BI_MCP_MODULE_UNAVAILABLE',
		UnsupportedDatabase: 'BI_MCP_UNSUPPORTED_DATABASE',
		IssueFailed: 'BI_MCP_ISSUE_FAILED',
		Unavailable: 'BI_MCP_UNAVAILABLE',
		ServerUrlMissing: 'BI_MCP_SERVER_URL_MISSING'
	});
	const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
	const AUTH_REQUIRED_ERROR_CODE = 'invalid_authentication';
	const RefusalForm = Object.freeze({
		Gateway: 'GATEWAY',
		Adapter: 'ADAPTER',
		Core: 'CORE'
	});
	const PopupState = Object.freeze({
		AwaitState: 'AWAIT_STATE',
		OperationsBeforeIssue: 'OPERATIONS_BEFORE_ISSUE',
		AwaitIssue: 'AWAIT_ISSUE',
		AwaitReissue: 'AWAIT_REISSUE',
		CommandIssued: 'COMMAND_ISSUED',
		ConnectionExists: 'CONNECTION_EXISTS',
		ActiveConnection: 'ACTIVE_CONNECTION',
		GatewayRefusal: 'GATEWAY_REFUSAL',
		AdapterRefusal: 'ADAPTER_REFUSAL',
		TechnicalRefusal: 'TECHNICAL_REFUSAL',
		PreviousConnectionInDoubt: 'PREVIOUS_CONNECTION_IN_DOUBT',
		UnknownResult: 'UNKNOWN_RESULT'
	});
	const TOOL_SET_TITLE_KEY = Object.freeze({
		bi_dashboards: 'BICONNECTOR_AGENT_CONNECTION_TOOL_SET_BI_DASHBOARDS',
		bi_charts: 'BICONNECTOR_AGENT_CONNECTION_TOOL_SET_BI_CHARTS',
		bi_datasets: 'BICONNECTOR_AGENT_CONNECTION_TOOL_SET_BI_DATASETS',
		bi_tables: 'BICONNECTOR_AGENT_CONNECTION_TOOL_SET_BI_TABLES'
	});
	const RefusalTextSource = Object.freeze({
		Server: 'SERVER',
		Own: 'OWN'
	});

	const getToolSetTitle = toolSetCode => {
		const key = TOOL_SET_TITLE_KEY[toolSetCode] ?? null;
		if (key === null) {
			return null;
		}
		const title = main_core.Loc.getMessage(key);
		return main_core.Type.isStringFilled(title) ? title : null;
	};

	const MILLISECONDS_PER_SECOND = 1000;
	const formatValidity = value => {
		if (!main_core.Type.isStringFilled(value)) {
			return null;
		}
		const milliseconds = Date.parse(value);
		if (Number.isNaN(milliseconds)) {
			return null;
		}
		const userDate = main_date.Timezone.UserTime.getDate(Math.floor(milliseconds / MILLISECONDS_PER_SECOND));
		return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATETIME'), userDate);
	};

	const BLOCK_CLASS = 'biconnector-agent-connection';
	const IRREVERSIBLE_IMPACT = 'destructive';
	const TITLE_KEY = 'BICONNECTOR_AGENT_CONNECTION_TITLE';
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
		RetryButton: 'biconnector-agent-connection-retry-btn'
	});
	const READING_BARS = [[240, 12], [300, 12], [180, 12]];
	const READING_BAR_RADIUS = 4;
	const getMessage$1 = (key, replacements = null) => {
		return main_core.Loc.getMessage(key, replacements) ?? '';
	};
	const compact = nodes => {
		return nodes.filter(node => node !== null);
	};
	const markTestId = (node, testId) => {
		if (testId !== null) {
			main_core.Dom.attr(node, 'data-testid', testId);
		}
		return node;
	};
	const renderNotice = (key, design, testId = null) => {
		return markTestId(new ui_system_alert.Alert({
			design,
			content: getMessage$1(key)
		}).render(), testId);
	};
	const renderNote = (key, testId = null, replacements = null) => {
		return markTestId(ui_system_typography.Text.render(getMessage$1(key, replacements), {
			size: 'xs',
			tag: 'div',
			className: `${BLOCK_CLASS}__note`
		}), testId);
	};
	const renderOperation = operation => {
		const item = main_core.Tag.render`
		<li class="${BLOCK_CLASS}__operation" data-testid="${TestId.Operation}">
			${ui_system_typography.Text.render(operation.title, {
		size: 'sm',
		tag: 'div'
	})}
		</li>
	`;
		if (operation.impact === IRREVERSIBLE_IMPACT) {
			main_core.Dom.addClass(item, '--irreversible');
		}
		if (main_core.Type.isStringFilled(operation.warning)) {
			main_core.Dom.append(markTestId(ui_system_typography.Text.render(operation.warning, {
				size: 'xs',
				tag: 'div',
				className: `${BLOCK_CLASS}__warning`
			}), TestId.OperationWarning), item);
		}
		return item;
	};
	const renderToolSet = (toolSetCode, operations) => {
		const group = main_core.Tag.render`
		<div class="${BLOCK_CLASS}__tool-set">
			<ul class="${BLOCK_CLASS}__tool-set-list">
				${operations.map(operation => renderOperation(operation))}
			</ul>
		</div>
	`;
		const title = getToolSetTitle(toolSetCode);
		if (title !== null) {
			main_core.Dom.prepend(markTestId(ui_system_typography.Text.render(title, {
				size: 'sm',
				tag: 'div',
				accent: true
			}), TestId.ToolSetTitle), group);
		}
		return group;
	};
	const renderOperations = catalog => {
		return main_core.Tag.render`
		<div
			class="${BLOCK_CLASS}__operations"
			tabindex="0"
			role="region"
			aria-label="${getMessage$1(TITLE_KEY)}"
			data-testid="${TestId.Operations}"
		>
			${Object.entries(catalog).map(([code, operations]) => {
		return renderToolSet(code, operations);
	})}
		</div>
	`;
	};
	const renderAction = (key, onClick, disabled, testId, style) => {
		const options = {
			text: getMessage$1(key),
			style,
			size: ui_buttons.ButtonSize.MEDIUM,
			useAirDesign: true,
			disabled,
			dataset: {
				testid: testId
			},
			onclick: () => {
				onClick();
				return {};
			}
		};
		return main_core.Tag.render`
		<div class="${BLOCK_CLASS}__actions">
			${new ui_buttons.Button(options).render()}
		</div>
	`;
	};
	const renderReading = () => {
		return main_core.Tag.render`
		<div class="${BLOCK_CLASS}__reading" aria-busy="true">
			${READING_BARS.map(([width, height]) => {
		return ui_system_skeleton.Line(width, height, READING_BAR_RADIUS);
	})}
		</div>
	`;
	};
	const renderScope = scopeNames => {
		if (scopeNames.length === 0) {
			return renderNote('BICONNECTOR_AGENT_CONNECTION_SCOPE_UNKNOWN');
		}
		return main_core.Tag.render`
		<div class="${BLOCK_CLASS}__scope" data-testid="${TestId.Scope}">
			${ui_system_typography.Text.render(getMessage$1('BICONNECTOR_AGENT_CONNECTION_SCOPE_TITLE'), {
		size: 'sm',
		tag: 'div',
		accent: true
	})}
			<ul class="${BLOCK_CLASS}__scope-list">
				${scopeNames.map(name => main_core.Tag.render`
					<li>${ui_system_typography.Text.render(name, {
		size: 'sm',
		tag: 'span'
	})}</li>
				`)}
			</ul>
		</div>
	`;
	};
	const renderDate = (key, value, testId = null) => {
		const date = formatValidity(value);
		return main_core.Type.isStringFilled(date) ? renderNote(key, testId, {
			'#DATE#': date
		}) : null;
	};
	const renderCommandField = command => {
		const options = {
			value: command,
			readonly: true,
			copyable: true,
			stretched: true,
			size: ui_system_input.InputSize.Md,
			design: ui_system_input.InputDesign.Grey,
			ariaLabel: getMessage$1('BICONNECTOR_AGENT_CONNECTION_TERMINAL_CLIENT_HINT'),
			dataTestId: TestId.Command
		};
		return markTestId(new ui_system_input.Input(options).render(), TestId.CommandField);
	};
	const renderCommand = (command, expiresAt) => {
		return compact([renderNote('BICONNECTOR_AGENT_CONNECTION_TERMINAL_CLIENT_HINT', TestId.TerminalHint), renderCommandField(command), renderNotice('BICONNECTOR_AGENT_CONNECTION_COMMAND_SECRET_WARNING', ui_system_alert.AlertDesign.tintedWarning, TestId.CommandSecretWarning), renderDate('BICONNECTOR_AGENT_CONNECTION_STATUS_CONNECTED_UNTIL', expiresAt, TestId.ExpiresAt)]);
	};
	const renderConnected = (snapshot, handlers, pending) => {
		return compact([renderNote('BICONNECTOR_AGENT_CONNECTION_HINT_CONNECTED'), renderScope(snapshot.scopeNames), renderDate('BICONNECTOR_AGENT_CONNECTION_STATUS_ISSUED_AT', snapshot.issuedAt, TestId.IssuedAt), renderDate('BICONNECTOR_AGENT_CONNECTION_STATUS_CONNECTED_UNTIL', snapshot.expiresAt, TestId.ExpiresAt), renderAction('BICONNECTOR_AGENT_CONNECTION_BTN_REGENERATE', handlers.onReissue, pending, TestId.ReissueButton, ui_buttons.AirButtonStyle.FILLED_BOOST)]);
	};
	const renderRefusalText = text => {
		const content = ui_system_typography.Text.render('', {
			size: 'sm',
			tag: 'div'
		});
		if (text.source === RefusalTextSource.Server) {
			main_core.Dom.adjust(content, {
				html: text.value
			});
		} else {
			main_core.Dom.adjust(content, {
				text: text.value
			});
		}
		return new ui_system_alert.Alert({
			design: ui_system_alert.AlertDesign.tintedAlert,
			content
		}).render();
	};
	const renderRefusal = (refusal, handlers) => {
		return compact([refusal.text === null ? null : renderRefusalText(refusal.text), refusal.canRetry ? renderAction('BICONNECTOR_AGENT_CONNECTION_BTN_RETRY', handlers.onRetry, false, TestId.RetryButton, ui_buttons.AirButtonStyle.FILLED) : null]);
	};
	const renderUnknownResult = (refusal, handlers, pending) => {
		const addition = refusal?.text ?? null;
		return compact([renderNotice('BICONNECTOR_AGENT_CONNECTION_UNKNOWN_RESULT', ui_system_alert.AlertDesign.tintedWarning), addition === null ? null : renderRefusalText(addition), renderAction('BICONNECTOR_AGENT_CONNECTION_BTN_REGENERATE', handlers.onReissue, pending, TestId.ReissueButton, ui_buttons.AirButtonStyle.FILLED_BOOST)]);
	};
	const renderBeforeIssue = (catalog, handlers, pending) => {
		return [renderNotice('BICONNECTOR_AGENT_CONNECTION_BOUNDARY_WARNING', ui_system_alert.AlertDesign.tintedWarning, TestId.BoundaryWarning), renderNotice('BICONNECTOR_AGENT_CONNECTION_SECRET_WARNING', ui_system_alert.AlertDesign.tinted, TestId.SecretWarning), renderOperations(catalog), renderAction('BICONNECTOR_AGENT_CONNECTION_BTN_CONNECT', handlers.onIssue, pending, TestId.IssueButton, ui_buttons.AirButtonStyle.FILLED_BOOST)];
	};
	const renderBody = (view, handlers) => {
		switch (view.state) {
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
			case PopupState.AwaitReissue:
				return view.connection === null ? renderUnknownResult(null, handlers, true) : renderConnected(view.connection, handlers, true);
			case PopupState.GatewayRefusal:
			case PopupState.AdapterRefusal:
			case PopupState.TechnicalRefusal:
			case PopupState.PreviousConnectionInDoubt:
				return renderRefusal(view.refusal, handlers);
			default:
				return renderUnknownResult(view.refusal, handlers, false);
		}
	};
	const renderPopup = (view, handlers) => {
		return main_core.Tag.render`
		<div class="${BLOCK_CLASS}__content">
			${ui_system_typography.Headline.render(getMessage$1(TITLE_KEY), {
		size: 'md'
	})}
			<div class="${BLOCK_CLASS}__body">${renderBody(view, handlers)}</div>
		</div>
	`;
	};
	class PopupView {
		#bubble = main_core.Tag.render`<div class="${BLOCK_CLASS}" data-testid="${TestId.Popup}"></div>`;
		#handlers;
		#state = null;
		constructor(handlers) {
			this.#handlers = handlers;
			main_core.Dom.attr(this.#bubble, {
				role: 'dialog',
				'aria-label': getMessage$1(TITLE_KEY)
			});
		}
		getBubble() {
			return this.#bubble;
		}
		setState(view) {
			if (view === this.#state) {
				return;
			}
			this.#state = view;
			main_core.Dom.clean(this.#bubble);
			main_core.Dom.append(renderPopup(view, this.#handlers), this.#bubble);
		}
		clear() {
			this.#state = null;
			main_core.Dom.clean(this.#bubble);
		}
	}

	const FOCUS_SETTLE_MS = 0;
	const FRAME_TAG = 'IFRAME';
	const isOnScreen = element => {
		return element !== null && element.isConnected && element.getClientRects().length > 0;
	};
	const layerZIndex = node => {
		for (let element = node; element !== null; element = element.parentElement) {
			const component = main_core.ZIndexManager.getComponent(element);
			if (component) {
				return component.getZIndex();
			}
		}
		return null;
	};
	const getHostDocument = () => {
		if (window === top) {
			return null;
		}
		try {
			const hostDocument = top?.document ?? null;
			return hostDocument === document ? null : hostDocument;
		} catch {
			return null;
		}
	};
	class Surface {
		#popover;
		#anchor;
		#bubble;
		#focusTrap;
		#closable = true;
		#hostDocument = null;
		#shouldApplyInitialFocus = false;
		constructor(options) {
			this.#anchor = options.anchor;
			this.#bubble = options.bubble;
			this.#focusTrap = new ui_a11y.FocusTrap(options.bubble, {
				initialFocus: ['first-tabbable', 'container'],
				restoreFocus: () => {
					return isOnScreen(this.#anchor) ? this.#anchor : null;
				},
				preventScroll: true
			});
			this.#popover = new ui_system_popover.Popover({
				content: options.bubble,
				target: options.anchor,
				designContext: ui_system_popover.PopoverDesignContext.ContentLight,
				positioning: {
					position: ui_system_popover.PopoverPosition.Bottom,
					alignment: ui_system_popover.PopoverAlignment.End,
					constrainSize: true
				},
				events: {
					onShow: () => this.#watchOutside(),
					onStateChange: this.#handlePopoverStateChange,
					onHide: () => {
						this.#unwatchOutside();
						options.onClose();
					}
				}
			});
		}
		show() {
			this.#popover.show();
		}
		isShown() {
			return this.#popover.isShown();
		}
		setClosable(closable) {
			this.#closable = closable;
			this.#popover.setCloseByClickOutside(closable);
			this.#popover.setCloseByEsc(closable);
		}
		destroy() {
			this.#popover.destroy();
			this.#focusTrap.destroy();
		}
		#watchOutside() {
			this.#shouldApplyInitialFocus = true;
			this.#focusTrap.activate({
				initialFocus: false
			});
			this.#applyInitialFocusWhenReady();
			this.#hostDocument = getHostDocument();
			if (this.#hostDocument !== null) {
				main_core.Event.bind(this.#hostDocument, 'mousedown', this.#handleHostPress, {
					capture: true
				});
			}
			main_core.Event.bind(window, 'blur', this.#handleWindowBlur);
		}
		#unwatchOutside() {
			this.#shouldApplyInitialFocus = false;
			this.#focusTrap.deactivate();
			if (this.#hostDocument !== null) {
				main_core.Event.unbind(this.#hostDocument, 'mousedown', this.#handleHostPress, {
					capture: true
				});
				this.#hostDocument = null;
			}
			main_core.Event.unbind(window, 'blur', this.#handleWindowBlur);
		}
		#handlePopoverStateChange = event => {
			const {
				state
			} = event.getData();
			this.#applyInitialFocusWhenReady(state.positioned);
		};
		#applyInitialFocusWhenReady(positioned = this.#popover.getState().positioned) {
			if (!this.#shouldApplyInitialFocus || !positioned) {
				return;
			}
			this.#shouldApplyInitialFocus = false;
			this.#focusTrap.applyInitialFocus();
		}
		#handleHostPress = event => {
			const target = event.target;
			if (!main_core.Type.isElementNode(target) || this.#bubble.contains(target) || this.#anchor.contains(target)) {
				return;
			}
			this.#closeFromOutside();
		};
		#handleWindowBlur = () => {
			setTimeout(() => {
				if (document.activeElement?.tagName === FRAME_TAG) {
					this.#closeFromOutside();
				}
			}, FOCUS_SETTLE_MS);
		};
		#closeFromOutside() {
			if (!this.#closable || !this.#popover.isShown() || this.#hasWindowAbove()) {
				return;
			}
			this.#popover.hide();
		}
		#hasWindowAbove() {
			const ownZIndex = layerZIndex(this.#bubble);
			const stack = main_core.ZIndexManager.getStack(document.body);
			if (ownZIndex === null || !stack) {
				return false;
			}
			return stack.getComponents().some(component => {
				return component.getZIndex() > ownZIndex && isOnScreen(component.getElement());
			});
		}
	}

	const REQUEST_TIMEOUT_SECONDS = 30;
	const buildNetworkErrorResponse = () => {
		return {
			status: 'error',
			data: null,
			errors: [{
				code: NETWORK_ERROR_CODE,
				message: 'Network error'
			}]
		};
	};
	const isConnectionResponse = value => {
		return main_core.Type.isPlainObject(value) && main_core.Type.isArray(value.errors);
	};
	class ConnectionService {
		getState() {
			return this.#run(ConnectionAction.GetState);
		}
		issue() {
			return this.#run(ConnectionAction.Issue);
		}
		reissue() {
			return this.#run(ConnectionAction.Reissue);
		}
		async #run(action) {
			try {
				return await main_core.ajax.runAction(action, {
					data: {},
					timeout: REQUEST_TIMEOUT_SECONDS
				});
			} catch (rejection) {
				return isConnectionResponse(rejection) ? rejection : buildNetworkErrorResponse();
			}
		}
	}
	const connectionService = new ConnectionService();

	const readLimitCode = customData => {
		if (!main_core.Type.isPlainObject(customData) || !main_core.Type.isStringFilled(customData.limitCode)) {
			return null;
		}
		return customData.limitCode;
	};
	const classifyRefusal = response => {
		const error = response.errors.at(0);
		if (!error) {
			return null;
		}
		if (error.code === NETWORK_ERROR_CODE) {
			return {
				form: RefusalForm.Core,
				noServerVerdict: true,
				humanText: null
			};
		}
		if (error.code === AUTH_REQUIRED_ERROR_CODE) {
			return {
				form: RefusalForm.Core,
				authRequired: true,
				humanText: null
			};
		}
		if ('branch' in error) {
			return {
				form: RefusalForm.Adapter,
				branch: error.code,
				retryable: error.retryable === true,
				previousConnectionMayBeLost: error.previousConnectionMayBeLost === true,
				humanText: biconnector_errorMessage.getUserFacingErrorHtml(error)
			};
		}
		if (error.userFacing === true) {
			return {
				form: RefusalForm.Gateway,
				code: error.code,
				limitCode: readLimitCode(error.customData),
				humanText: biconnector_errorMessage.getUserFacingErrorHtml(error)
			};
		}
		return {
			form: RefusalForm.Core,
			code: error.code,
			humanText: null
		};
	};

	const ChangingOperation = Object.freeze({
		Issue: 'ISSUE',
		Reissue: 'REISSUE'
	});

	const getRefusalState = refusal => {
		if (refusal.previousConnectionMayBeLost === true) {
			return PopupState.PreviousConnectionInDoubt;
		}
		if (refusal.form === RefusalForm.Gateway) {
			return PopupState.GatewayRefusal;
		}
		if (refusal.form === RefusalForm.Adapter) {
			return PopupState.AdapterRefusal;
		}
		return PopupState.TechnicalRefusal;
	};
	const getPopupState = signals => {
		const {
			response,
			pending,
			pendingOperation,
			stateReading,
			command,
			refusal,
			unknownResult
		} = signals;
		if (pending) {
			return pendingOperation === ChangingOperation.Issue ? PopupState.AwaitIssue : PopupState.AwaitReissue;
		}
		if (unknownResult) {
			return PopupState.UnknownResult;
		}
		if (refusal !== null) {
			return getRefusalState(refusal);
		}
		if (stateReading) {
			return PopupState.AwaitState;
		}
		if (command !== null) {
			return PopupState.CommandIssued;
		}
		if (response?.outcome === ConnectionOutcome.Exists) {
			return PopupState.ConnectionExists;
		}
		if (response?.hasConnection === true) {
			return PopupState.ActiveConnection;
		}
		return PopupState.OperationsBeforeIssue;
	};

	const getMessage = key => main_core.Loc.getMessage(key) ?? '';
	const CONFIRM_TEST_ID = 'biconnector-agent-connection-reissue-confirm-btn';
	const CONFIRM_CANCEL_TEST_ID = 'biconnector-agent-connection-reissue-cancel-btn';
	const readOutcome = value => {
		return value === ConnectionOutcome.Issued || value === ConnectionOutcome.Exists ? value : undefined;
	};
	const readText = value => main_core.Type.isStringFilled(value) ? value : null;
	const readTextList = value => {
		return main_core.Type.isArray(value) ? value.filter(item => main_core.Type.isStringFilled(item)) : [];
	};
	const openTariffWindow = limitCode => {
		ui_infoHelper.InfoHelper.show(limitCode);
	};
	const getRefusalText = refusal => {
		if (refusal.form !== RefusalForm.Core) {
			return refusal.humanText === null ? null : {
				source: RefusalTextSource.Server,
				value: refusal.humanText
			};
		}
		const key = refusal.authRequired === true ? 'BICONNECTOR_AGENT_CONNECTION_AUTH_REQUIRED' : 'BICONNECTOR_AGENT_CONNECTION_ERROR';
		return {
			source: RefusalTextSource.Own,
			value: getMessage(key)
		};
	};
	const isRetryOffered = (refusal, operation) => {
		if (operation === ChangingOperation.Issue) {
			return refusal.branch === RefusalBranch.IssueFailed;
		}
		return refusal.retryable === true;
	};
	const describeRefusal = (refusal, operation) => {
		return {
			form: refusal.form,
			previousConnectionMayBeLost: refusal.previousConnectionMayBeLost,
			text: getRefusalText(refusal),
			canRetry: operation !== null && isRetryOffered(refusal, operation)
		};
	};
	class Connection {
		#transport;
		#onChange;
		#openTariffWindow;
		#opening = 0;
		#response = null;
		#pending = false;
		#stateReading = false;
		#stateReadPromise = null;
		#pendingOperation = null;
		#refusal = null;
		#unknownResult = false;
		#previousConnectionMayBeLost = false;
		constructor(transport, onChange = null, tariffWindow = null) {
			this.#transport = transport ?? connectionService;
			this.#onChange = onChange;
			this.#openTariffWindow = tariffWindow ?? openTariffWindow;
		}
		open() {
			this.#reset();
			this.#stateReading = true;
			this.#notify();
			void this.#read(this.#opening);
		}
		close() {
			this.#reset();
			this.#notify();
		}
		issue() {
			void this.#change(ChangingOperation.Issue);
		}
		reissue() {
			this.#confirmReissue(() => {
				void this.#change(ChangingOperation.Reissue);
			});
		}
		retry() {
			if (this.#pendingOperation === ChangingOperation.Reissue) {
				this.reissue();
				return;
			}
			this.issue();
		}
		getState() {
			return getPopupState(this.#getSignals());
		}
		isChanging() {
			return this.#pending;
		}
		isConnectionAssured() {
			return !this.#unknownResult && !this.#previousConnectionMayBeLost;
		}
		getRefusal() {
			return this.#refusal;
		}
		getCommand() {
			return readText(this.#response?.command);
		}
		getSnapshot() {
			return {
				command: this.getCommand(),
				scopeNames: readTextList(this.#response?.scopeNames),
				issuedAt: readText(this.#response?.issuedAt),
				expiresAt: readText(this.#response?.expiresAt)
			};
		}
		async #read(opening) {
			const response = await this.#readState();
			if (opening !== this.#opening || !this.#stateReading) {
				return;
			}
			this.#stateReading = false;
			const refusal = classifyRefusal(response);
			if (refusal === null) {
				this.#response = response.data;
				this.#previousConnectionMayBeLost = false;
			} else {
				this.#refusal = describeRefusal(refusal, null);
			}
			this.#notify();
		}
		#readState() {
			this.#stateReadPromise ??= this.#transport.getState().finally(() => {
				this.#stateReadPromise = null;
			});
			return this.#stateReadPromise;
		}
		async #change(operation) {
			if (this.#pending) {
				return;
			}
			const opening = this.#opening;
			this.#pending = true;
			this.#stateReading = false;
			this.#pendingOperation = operation;
			this.#refusal = null;
			this.#notify();
			const response = await this.#send(operation);
			if (opening !== this.#opening) {
				return;
			}
			this.#pending = false;
			this.#accept(response, operation);
			this.#notify();
		}
		#send(operation) {
			return operation === ChangingOperation.Issue ? this.#transport.issue() : this.#transport.reissue();
		}
		#accept(response, operation) {
			const refusal = classifyRefusal(response);
			if (refusal === null) {
				this.#response = response.data;
				this.#unknownResult = false;
				this.#previousConnectionMayBeLost = false;
				return;
			}
			if (refusal.noServerVerdict === true) {
				this.#unknownResult = true;
				return;
			}
			const limitCode = refusal.limitCode ?? null;
			if (limitCode !== null) {
				this.#openTariffWindow(limitCode);
				return;
			}
			if (refusal.previousConnectionMayBeLost === true) {
				this.#previousConnectionMayBeLost = true;
			}
			this.#refusal = describeRefusal(refusal, operation);
		}
		#confirmReissue(onConfirm) {
			const messageKey = this.#unknownResult ? 'BICONNECTOR_AGENT_CONNECTION_REGENERATE_CONFIRM_UNKNOWN' : 'BICONNECTOR_AGENT_CONNECTION_REGENERATE_CONFIRM';
			const confirmOptions = {
				text: getMessage('BICONNECTOR_AGENT_CONNECTION_BTN_REGENERATE'),
				style: ui_buttons.AirButtonStyle.FILLED,
				size: ui_buttons.ButtonSize.LARGE,
				useAirDesign: true,
				dataset: {
					testid: CONFIRM_TEST_ID
				},
				onclick: () => {
					dialog.hide();
					onConfirm();
					return {};
				}
			};
			const cancelOptions = {
				style: ui_buttons.AirButtonStyle.PLAIN,
				size: ui_buttons.ButtonSize.LARGE,
				useAirDesign: true,
				dataset: {
					testid: CONFIRM_CANCEL_TEST_ID
				},
				onclick: () => {
					dialog.hide();
					return {};
				}
			};
			const dialog = new ui_system_dialog.Dialog({
				content: ui_system_typography.Text.render(getMessage(messageKey), {
					size: 'md',
					tag: 'div'
				}),
				hasOverlay: true,
				centerButtons: [new ui_buttons.Button(confirmOptions), new ui_buttons.CancelButton(cancelOptions)]
			});
			dialog.show();
		}
		#getSignals() {
			return {
				response: this.#response === null ? null : {
					outcome: readOutcome(this.#response.outcome),
					hasConnection: this.#response.hasConnection === true
				},
				pending: this.#pending,
				pendingOperation: this.#pendingOperation,
				stateReading: this.#stateReading,
				command: this.getCommand(),
				refusal: this.#refusal,
				unknownResult: this.#unknownResult
			};
		}
		#reset() {
			this.#opening += 1;
			this.#response = null;
			this.#refusal = null;
			this.#pending = false;
			this.#stateReading = false;
		}
		#notify() {
			this.#onChange?.();
		}
	}

	const EXTENSION_NAME = 'biconnector.ai-agent-connection';
	const readOperations = () => {
		const operations = main_core.Extension.getSettings(EXTENSION_NAME).get('operations');
		return main_core.Type.isPlainObject(operations) ? operations : {};
	};
	class AiAgentConnection {
		#anchor;
		#operations;
		#connection;
		#view = null;
		#surface = null;
		constructor(params) {
			this.#anchor = params.anchor;
			this.#operations = params.operations ?? readOperations();
			this.#connection = new Connection(params.transport ?? null, this.#handleStateChange);
		}
		show() {
			const connection = this.#connection;
			if (connection === null) {
				return;
			}
			const surface = this.#ensureSurface(this.#ensureView());
			if (surface.isShown() || connection.isChanging()) {
				return;
			}
			surface.show();
			connection.open();
		}
		destroy() {
			this.#surface?.destroy();
			this.#surface = null;
			this.#view = null;
			this.#connection = null;
		}
		#handleStateChange = () => {
			const connection = this.#connection;
			const view = this.#view;
			if (connection === null || view === null) {
				return;
			}
			if (this.#surface?.isShown() !== true) {
				view.clear();
				return;
			}
			const state = connection.getState();
			const viewState = this.#toViewState(state, connection.getSnapshot(), connection.getRefusal(), connection.isConnectionAssured());
			if (viewState !== null) {
				view.setState(viewState);
			}
			this.#surface.setClosable(state !== PopupState.AwaitIssue && state !== PopupState.AwaitReissue);
		};
		#toViewState(state, snapshot, refusal, connectionAssured) {
			switch (state) {
				case PopupState.AwaitState:
					return {
						state
					};
				case PopupState.OperationsBeforeIssue:
				case PopupState.AwaitIssue:
					return {
						state,
						operations: this.#operations
					};
				case PopupState.CommandIssued:
					return snapshot.command === null ? null : {
						state,
						command: snapshot.command,
						expiresAt: snapshot.expiresAt
					};
				case PopupState.ConnectionExists:
				case PopupState.ActiveConnection:
					return {
						state,
						connection: snapshot
					};
				case PopupState.AwaitReissue:
					return {
						state,
						connection: connectionAssured ? snapshot : null
					};
				case PopupState.GatewayRefusal:
				case PopupState.AdapterRefusal:
				case PopupState.TechnicalRefusal:
				case PopupState.PreviousConnectionInDoubt:
					return refusal === null ? null : {
						state,
						refusal
					};
				default:
					return {
						state: PopupState.UnknownResult,
						refusal
					};
			}
		}
		#ensureView() {
			this.#view ??= new PopupView({
				onIssue: () => this.#connection?.issue(),
				onReissue: () => this.#connection?.reissue(),
				onRetry: () => this.#connection?.retry()
			});
			return this.#view;
		}
		#ensureSurface(view) {
			this.#surface ??= new Surface({
				anchor: this.#anchor,
				bubble: view.getBubble(),
				onClose: () => this.#connection?.close()
			});
			return this.#surface;
		}
	}

	exports.AiAgentConnection = AiAgentConnection;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.UI, BX.UI.System.Alert, BX.UI.System.Input, BX.UI.System, BX.UI.System.Typography, BX.Main, BX.UI.Accessibility, BX.UI.System.Popover, BX.UI, BX.UI.System, BX.BIConnector);
//# sourceMappingURL=ai-agent-connection.bundle.js.map
