/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, main_core, ui_vue3) {
	'use strict';

	const CONTROLLER = 'mail.api.senderavatar';
	class SenderAvatarApiError extends Error {
		errors;
		cause;
		constructor(errors, cause) {
			super(errors[0]?.message ?? 'Request failed');
			this.name = 'SenderAvatarApiError';
			this.errors = errors;
			this.cause = cause;
		}
	}
	const defaultRunner$1 = (action, options) => {
		return main_core.ajax.runAction(action, options);
	};
	function createSenderAvatarApi(runner = defaultRunner$1) {
		async function run(action, data) {
			try {
				const response = await runner(`${CONTROLLER}.${action}`, {
					method: 'POST',
					data
				});
				if (response.status !== 'success' || response.errors?.length) {
					throw new SenderAvatarApiError(normalizeErrors(response.errors));
				}
				return response.data;
			} catch (error) {
				if (error instanceof SenderAvatarApiError) {
					throw error;
				}
				throw new SenderAvatarApiError(normalizeErrors(getErrors(error), error), error);
			}
		}
		return {
			get(messageId, accessToken) {
				return run('get', createIdentity(messageId, accessToken));
			},
			save(messageId, change, accessToken) {
				return run('save', {
					...createIdentity(messageId, accessToken),
					change: {
						...change
					}
				});
			}
		};
	}
	const senderAvatarApi = createSenderAvatarApi();
	function createIdentity(messageId, accessToken) {
		return accessToken ? {
			messageId,
			messageAccessToken: accessToken
		} : {
			messageId
		};
	}
	function getErrors(error) {
		if (main_core.Type.isObject(error) && 'errors' in error) {
			return error.errors;
		}
		return error;
	}
	function normalizeErrors(errors, cause) {
		if (Array.isArray(errors)) {
			const normalized = errors.map(error => normalizeError(error)).filter(error => error !== null);
			if (normalized.length > 0) {
				return normalized;
			}
		}
		const normalized = normalizeError(errors) ?? normalizeError(cause);
		return normalized ? [normalized] : [{
			message: 'Request failed'
		}];
	}
	function normalizeError(error) {
		if (error instanceof Error && error.message) {
			return {
				message: error.message
			};
		}
		if (main_core.Type.isStringFilled(error)) {
			return {
				message: error
			};
		}
		if (!main_core.Type.isObject(error) || !('message' in error) || !main_core.Type.isStringFilled(error.message)) {
			return null;
		}
		const normalized = {
			message: error.message
		};
		if ('code' in error && (main_core.Type.isString(error.code) || main_core.Type.isNumber(error.code))) {
			normalized.code = error.code;
		}
		if ('customData' in error) {
			normalized.customData = error.customData;
		}
		return normalized;
	}

	function createMessageViewState(bootstrap) {
		return ui_vue3.reactive(createMessageViewStateData(bootstrap));
	}
	function createMessageViewStateData(bootstrap) {
		const currentMessage = cloneCurrentMessage(bootstrap.currentMessage);
		return {
			screen: cloneScreen(bootstrap.screen),
			currentMessage,
			thread: cloneThread(bootstrap.thread),
			capabilities: {
				...bootstrap.capabilities
			},
			hosts: cloneHosts(bootstrap.hosts),
			domContracts: cloneDomContracts(bootstrap.domContracts),
			senderAvatar: createSenderAvatarState(currentMessage.id, currentMessage.sender.avatar.management ?? null),
			body: {
				status: bootstrap.hosts.messageBody.useAjax ? 'loading' : 'ready',
				error: null
			},
			attachments: {
				status: getInitialAttachmentStatus(bootstrap.hosts.attachments),
				error: null
			}
		};
	}
	function cloneScreen(screen) {
		return {
			...screen,
			paths: {
				...screen.paths
			},
			analytics: screen.analytics ? {
				...screen.analytics
			} : null
		};
	}
	function cloneCurrentMessage(message) {
		return {
			...message,
			sender: cloneAddress(message.sender),
			recipients: cloneRecipients(message.recipients),
			labels: {
				...message.labels
			},
			date: {
				...message.date
			},
			flags: {
				...message.flags
			},
			mailbox: message.mailbox ? {
				...message.mailbox
			} : null
		};
	}
	function cloneAddress(address) {
		return {
			...address,
			avatar: {
				...address.avatar,
				management: address.avatar.management ? normalizeSenderAvatarData(address.avatar.management) : address.avatar.management
			}
		};
	}
	function cloneRecipients(recipients) {
		return {
			to: recipients.to.map(address => cloneAddress(address)),
			cc: recipients.cc.map(address => cloneAddress(address)),
			bcc: recipients.bcc.map(address => cloneAddress(address)),
			replyTo: recipients.replyTo.map(address => cloneAddress(address))
		};
	}
	function cloneThread(thread) {
		return {
			...thread,
			before: {
				...thread.before
			},
			after: {
				...thread.after
			}
		};
	}
	function cloneHosts(hosts) {
		return {
			messageBody: {
				...hosts.messageBody
			},
			attachments: {
				...hosts.attachments
			},
			actions: {
				...hosts.actions
			},
			labels: {
				...hosts.labels
			},
			compose: {
				...hosts.compose
			},
			pageSwapper: {
				...hosts.pageSwapper
			},
			iCal: {
				...hosts.iCal
			}
		};
	}
	function cloneDomContracts(domContracts) {
		return {
			messageUidKey: domContracts.messageUidKey,
			ids: {
				...domContracts.ids
			},
			testIds: {
				...domContracts.testIds
			}
		};
	}
	function getInitialAttachmentStatus(host) {
		if (!host.enabled) {
			return 'idle';
		}
		return host.hasDeferredContent ? 'loading' : 'ready';
	}
	function createSenderAvatarState(messageId, confirmed = null) {
		const normalizedMessageId = normalizeSenderAvatarInteger(messageId) ?? 0;
		const normalizedConfirmed = confirmed ? normalizeSenderAvatarData(confirmed) : null;
		return {
			messageId: normalizedMessageId,
			confirmed: normalizedConfirmed?.messageId === normalizedMessageId ? normalizedConfirmed : null,
			intent: null,
			selection: null,
			status: 'idle',
			failure: null,
			error: '',
			requestId: 0
		};
	}
	function resetSenderAvatarForMessage(state, messageId, confirmed = null) {
		const normalizedMessageId = normalizeSenderAvatarInteger(messageId) ?? 0;
		const normalizedConfirmed = confirmed ? normalizeSenderAvatarData(confirmed) : null;
		Object.assign(state, {
			messageId: normalizedMessageId,
			confirmed: normalizedConfirmed?.messageId === normalizedMessageId ? normalizedConfirmed : null,
			intent: null,
			selection: null,
			status: 'idle',
			failure: null,
			error: '',
			requestId: state.requestId + 1
		});
	}
	function beginSenderAvatarRead(state, refresh = false) {
		const requestId = state.requestId + 1;
		Object.assign(state, {
			requestId,
			status: refresh ? 'refreshing' : 'loading',
			failure: null,
			error: ''
		});
		return requestId;
	}
	function acceptSenderAvatarRead(state, requestId, data) {
		if (state.requestId !== requestId || data.messageId !== state.messageId || state.confirmed && data.revision < state.confirmed.revision) {
			return false;
		}
		Object.assign(state, {
			confirmed: cloneSenderAvatarData(data),
			status: state.intent ? 'editing' : 'idle',
			failure: null,
			error: ''
		});
		return true;
	}
	function rejectSenderAvatarRead(state, requestId, message, failure = null) {
		if (state.requestId !== requestId) {
			return false;
		}
		Object.assign(state, {
			status: 'failed',
			failure,
			error: message
		});
		return true;
	}
	function openSenderAvatarEditor(state) {
		if (!state.confirmed?.canManage || !state.confirmed.uploader || state.confirmed.messageId !== state.messageId || state.status === 'loading' || state.status === 'saving' || state.status === 'refreshing') {
			return false;
		}
		Object.assign(state, {
			status: 'editing',
			failure: null,
			error: ''
		});
		return true;
	}
	function setSenderAvatarSelection(state, selection) {
		const confirmed = state.confirmed;
		if (!confirmed?.canManage || state.status !== 'editing') {
			return false;
		}
		const expectedRevision = state.intent?.expectedRevision ?? confirmed.revision;
		Object.assign(state, {
			selection: {
				...selection
			},
			intent: {
				operation: 'replace',
				expectedRevision,
				uploadToken: selection.status === 'complete' ? selection.uploadToken : null
			},
			failure: null,
			error: ''
		});
		return true;
	}
	function deleteSenderAvatar(state) {
		const confirmed = state.confirmed;
		if (!confirmed?.canManage || !confirmed.hasAvatar || state.status !== 'editing') {
			return false;
		}
		Object.assign(state, {
			selection: null,
			intent: {
				operation: 'delete',
				expectedRevision: state.intent?.expectedRevision ?? confirmed.revision
			},
			failure: null,
			error: ''
		});
		return true;
	}
	function resetSenderAvatarIntent(state) {
		Object.assign(state, {
			intent: null,
			selection: null,
			status: 'idle',
			failure: null,
			error: ''
		});
	}
	function beginSenderAvatarSave(state) {
		const intent = state.intent;
		if (!intent || !state.confirmed?.canManage || state.status !== 'editing' || intent.operation === 'replace' && !intent.uploadToken) {
			return null;
		}
		const requestId = state.requestId + 1;
		const change = intent.operation === 'delete' ? {
			operation: 'delete',
			expectedRevision: intent.expectedRevision
		} : {
			operation: 'replace',
			expectedRevision: intent.expectedRevision,
			uploadToken: intent.uploadToken
		};
		Object.assign(state, {
			requestId,
			status: 'saving',
			failure: null,
			error: ''
		});
		return {
			messageId: state.messageId,
			requestId,
			selectionId: state.selection?.id ?? null,
			change
		};
	}
	function acceptSenderAvatarSave(state, snapshot, data) {
		if (!isSenderAvatarSaveCurrent(state, snapshot) || data.messageId !== snapshot.messageId || !Number.isInteger(data.revision) || data.revision <= snapshot.change.expectedRevision || state.confirmed && data.revision <= state.confirmed.revision) {
			return false;
		}
		const intentIsCurrent = matchesSenderAvatarIntent(state, snapshot);
		Object.assign(state, {
			confirmed: cloneSenderAvatarData(data),
			intent: intentIsCurrent ? null : state.intent,
			selection: intentIsCurrent ? null : state.selection,
			status: intentIsCurrent ? 'idle' : 'editing',
			failure: null,
			error: ''
		});
		return true;
	}
	function rejectSenderAvatarSave(state, snapshot, message) {
		if (!isSenderAvatarSaveCurrent(state, snapshot) || !matchesSenderAvatarIntent(state, snapshot)) {
			return false;
		}
		Object.assign(state, {
			status: 'failed',
			failure: 'save',
			error: message
		});
		return true;
	}
	function requireSenderAvatarRefresh(state, snapshot) {
		if (!isSenderAvatarSaveCurrent(state, snapshot)) {
			return false;
		}
		Object.assign(state, {
			intent: null,
			status: 'refreshing',
			failure: null,
			error: '',
			requestId: state.requestId + 1
		});
		return true;
	}
	function isSenderAvatarSaveCurrent(state, snapshot) {
		return state.messageId === snapshot.messageId && state.requestId === snapshot.requestId;
	}
	function matchesSenderAvatarIntent(state, snapshot) {
		const intent = state.intent;
		const change = snapshot.change;
		return (state.selection?.id ?? null) === snapshot.selectionId && intent?.operation === change.operation && intent.expectedRevision === change.expectedRevision && (change.operation === 'delete' || intent.operation === 'replace' && intent.uploadToken === change.uploadToken);
	}
	function cloneSenderAvatarData(data) {
		return {
			...data,
			errorMessages: data.errorMessages ? {
				...data.errorMessages
			} : data.errorMessages,
			uploader: data.uploader ? {
				...data.uploader,
				controllerOptions: {
					...data.uploader.controllerOptions
				}
			} : null
		};
	}
	function normalizeSenderAvatarData(data) {
		const messageId = normalizeSenderAvatarInteger(data.messageId);
		const revision = normalizeSenderAvatarInteger(data.revision);
		if (messageId === null || messageId === 0 || revision === null) {
			return null;
		}
		return cloneSenderAvatarData({
			...data,
			messageId,
			revision
		});
	}
	function normalizeSenderAvatarInteger(value) {
		if (main_core.Type.isNumber(value)) {
			return Number.isSafeInteger(value) && value >= 0 ? value : null;
		}
		if (!main_core.Type.isString(value) || !/^(?:0|[1-9]\d*)$/.test(value)) {
			return null;
		}
		const normalized = Number(value);
		return Number.isSafeInteger(normalized) ? normalized : null;
	}

	const PrimaryActionNames = ['reply', 'replyAll', 'forward'];
	const MoreActionNames = ['assignLabels', 'discussInChat', 'unbind', 'markSpam', 'delete', 'crm', 'task', 'chat', 'calendar', 'feed', 'pull', 'iCal'];
	const RetryableActionNames = new Set(['markSpam', 'delete']);
	const LegacyHostAttribute$4 = 'data-mail-message-view-host';
	const ActionTestIds = {
		reply: 'mail-message-view-reply',
		replyAll: 'mail-message-view-reply-all',
		forward: 'mail-message-view-forward',
		more: 'mail-message-view-more',
		assignLabels: 'mail-message-view-labels',
		discussInChat: 'mail-message-view-discuss',
		unbind: 'mail-message-view-unbind',
		markSpam: 'mail-message-view-spam',
		delete: 'mail-message-view-delete'
	};
	const LegacyPrimaryActionClasses = {
		reply: 'mail-msg-view-control-reply',
		replyAll: 'mail-msg-view-control-replyall',
		forward: 'mail-msg-view-control-forward'
	};
	const TestId$2 = {
		root: 'mail-message-view-action-bar',
		menu: 'mail-message-view-action-menu'
	};
	function removeActionTestIds(root) {
		root.removeAttribute('data-testid');
		root.querySelectorAll('[data-testid]').forEach(element => element.removeAttribute('data-testid'));
	}
	function isRetryableActionName(action) {
		return RetryableActionNames.has(action);
	}
	function isActionBarActionIntent(payload) {
		if (!payload || payload.type !== 'invoke') {
			return Boolean(payload && payload.type === 'retry' && isRetryableActionName(payload.action));
		}
		if (payload.action === 'recipient') {
			return Boolean(payload.recipient);
		}
		if (payload.action === 'citation') {
			return Boolean(payload.citation);
		}
		return true;
	}
	function isMenuCloseReason(reason) {
		return reason === 'toggle' || reason === 'escape' || reason === 'outside' || reason === 'action';
	}
	function isActionMenuIntent(payload) {
		if (!payload) {
			return false;
		}
		if (payload.type === 'menu-open' || payload.type === 'menu-toggle') {
			return true;
		}
		return payload.type === 'menu-close' && isMenuCloseReason(payload.reason) && main_core.Type.isBoolean(payload.returnFocus);
	}
	const ActionBarComponent = {
		name: 'MailMessageViewActionBar',
		props: {
			state: {
				type: Object,
				required: true
			},
			labels: {
				type: Object,
				default: null
			},
			legacyActionAttributes: {
				type: Object,
				default: () => ({})
			}
		},
		emits: {
			action: payload => {
				return isActionBarActionIntent(payload);
			},
			menu: payload => {
				return isActionMenuIntent(payload);
			},
			outside: payload => {
				return Boolean(payload && payload.reason === 'outside' && main_core.Type.isBoolean(payload.returnFocus));
			},
			escape: payload => {
				return Boolean(payload && payload.reason === 'escape' && main_core.Type.isBoolean(payload.returnFocus));
			},
			'return-focus': payload => {
				return Boolean(payload && Number.isInteger(payload.token) && payload.target === 'more');
			}
		},
		setup() {
			return {
				TestId: TestId$2
			};
		},
		data() {
			return {
				outsideCloseRequested: false
			};
		},
		computed: {
			primaryActions() {
				return PrimaryActionNames.filter(action => this.state.visibility[action]);
			},
			moreActions() {
				return MoreActionNames.filter(action => this.state.visibility[action]);
			},
			recipients() {
				return [...this.state.context.recipients.to, ...this.state.context.recipients.cc, ...this.state.context.recipients.bcc, ...this.state.context.recipients.replyTo];
			},
			recipientActions() {
				return this.canShowRecipientActions ? this.recipients : [];
			},
			canShowRecipientActions() {
				return this.state.visibility.recipient && this.recipients.length > 0;
			},
			canShowCitationAction() {
				return this.state.visibility.citation && this.state.context.citation.available;
			},
			canShowMenu() {
				return this.labels !== null && this.state.visibility.more && (this.moreActions.length > 0 || this.canShowRecipientActions || this.canShowCitationAction);
			},
			menuId() {
				return `mail-message-view-action-menu-${this.state.context.messageId}`;
			}
		},
		watch: {
			'state.menu.focusReturnToken': function (token, previousToken) {
				if (token === previousToken || token <= 0) {
					return;
				}
				this.handleReturnFocus(token);
			},
			'state.menu.open': function (open, wasOpen) {
				if (open && !wasOpen) {
					this.outsideCloseRequested = false;
					void this.handleFocusFirstMenuItem();
				}
			}
		},
		mounted() {
			main_core.Event.bind(document, 'pointerdown', this.handleDocumentPointerDown);
		},
		beforeUnmount() {
			main_core.Event.unbind(document, 'pointerdown', this.handleDocumentPointerDown);
		},
		methods: {
			getHostAttribute(hostId) {
				return {
					[LegacyHostAttribute$4]: hostId
				};
			},
			getRecipientLabel(recipient) {
				return recipient.name || recipient.email;
			},
			getRequestStatus(action) {
				return isRetryableActionName(action) ? this.state.requests[action].status : 'idle';
			},
			getActionLabel(action) {
				if (!this.labels) {
					return '';
				}
				if (!isRetryableActionName(action)) {
					return this.labels.actions[action];
				}
				const request = this.state.requests[action];
				if (request.status === 'pending') {
					return this.labels.pending[action];
				}
				if (request.status === 'error' && request.canRetry) {
					return this.labels.retry[action];
				}
				if (request.status === 'error') {
					return this.labels.error[action];
				}
				return this.labels.actions[action];
			},
			getActionTestId(action) {
				return ActionTestIds[action] ?? null;
			},
			getLegacyPrimaryActionClass(action) {
				return LegacyPrimaryActionClasses[action] ?? '';
			},
			getLegacyActionAttributes(action) {
				return this.legacyActionAttributes[action] ?? {};
			},
			isActionDisabled(action) {
				return isRetryableActionName(action) && this.state.requests[action].status === 'pending';
			},
			handleAction(action) {
				if (isRetryableActionName(action) && this.state.requests[action].status === 'error') {
					this.$emit('action', {
						type: 'retry',
						action
					});
					return;
				}
				this.$emit('action', {
					type: 'invoke',
					action
				});
			},
			handleRecipient(recipient) {
				this.$emit('action', {
					type: 'invoke',
					action: 'recipient',
					recipient
				});
			},
			handleCitation(citation) {
				this.$emit('action', {
					type: 'invoke',
					action: 'citation',
					citation
				});
			},
			handleMenuToggle() {
				this.$emit('menu', {
					type: 'menu-toggle'
				});
			},
			handleOutside(event) {
				const root = this.$refs.root;
				const nextTarget = event.relatedTarget;
				if (!this.state.menu.open || nextTarget instanceof Node && root?.contains(nextTarget)) {
					return;
				}
				this.requestOutsideClose();
			},
			handleDocumentPointerDown(event) {
				const root = this.$refs.root;
				if (!this.state.menu.open || !(event.target instanceof Node) || root?.contains(event.target)) {
					return;
				}
				this.requestOutsideClose();
			},
			requestOutsideClose() {
				if (this.outsideCloseRequested) {
					return;
				}
				this.outsideCloseRequested = true;
				const intent = {
					reason: 'outside',
					returnFocus: false
				};
				this.$emit('outside', intent);
				this.$emit('menu', {
					type: 'menu-close',
					reason: intent.reason,
					returnFocus: intent.returnFocus
				});
			},
			handleEscape(event) {
				if (!this.state.menu.open) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				const intent = {
					reason: 'escape',
					returnFocus: true
				};
				this.$emit('escape', intent);
				this.$emit('menu', {
					type: 'menu-close',
					reason: intent.reason,
					returnFocus: intent.returnFocus
				});
			},
			async handleFocusFirstMenuItem() {
				await this.$nextTick();
				const menu = this.$refs.menu;
				const firstItem = menu?.querySelector('.mail-message-view-action-bar-menu-item:not(:disabled)');
				if (firstItem instanceof HTMLElement) {
					firstItem.focus();
				}
			},
			handleReturnFocus(token) {
				const moreButton = this.$refs.moreButton;
				moreButton?.focus();
				this.$emit('return-focus', {
					token,
					target: 'more'
				});
			}
		},
		template: `
		<div class="mail-message-view-action-bar-wrapper mail-msg-view-control-wrapper">
			<nav
				v-if="labels"
				ref="root"
				class="mail-message-view-action-bar mail-msg-view-control-block"
				:data-testid="TestId.root"
				@keydown.esc="handleEscape"
				@focusout="handleOutside"
			>
				<button
					v-for="action in primaryActions"
					:key="action"
					type="button"
					:class="['mail-message-view-action-bar-button', 'mail-msg-view-control', getLegacyPrimaryActionClass(action)]"
					:data-action="action"
					:data-testid="getActionTestId(action)"
					:disabled="isActionDisabled(action)"
					:aria-busy="getRequestStatus(action) === 'pending' ? 'true' : 'false'"
					@click="handleAction(action)"
				>{{ getActionLabel(action) }}</button>
				<div
					v-if="canShowMenu"
					class="mail-msg-view-control-more-wrapper"
				>
					<button
						ref="moreButton"
						type="button"
						class="mail-message-view-action-bar-button mail-message-view-action-bar-more mail-msg-view-control mail-msg-view-control-more"
						:aria-label="getActionLabel('more')"
						:aria-expanded="state.menu.open ? 'true' : 'false'"
						:aria-controls="menuId"
						data-action="more"
						:data-testid="getActionTestId('more')"
						@click="handleMenuToggle"
					>{{ getActionLabel('more') }}</button>
					<div
						v-if="state.menu.open"
						ref="menu"
						:id="menuId"
						class="mail-message-view-action-bar-menu mail-msg-view-control-more-menu"
						:data-testid="TestId.menu"
					>
						<button
							v-for="action in moreActions"
							:key="action"
							type="button"
							class="mail-message-view-action-bar-menu-item mail-msg-view-control"
							:data-action="action"
							:data-testid="getActionTestId(action)"
							v-bind="getLegacyActionAttributes(action)"
							:disabled="isActionDisabled(action)"
							:aria-busy="getRequestStatus(action) === 'pending' ? 'true' : 'false'"
							@click="handleAction(action)"
						>{{ getActionLabel(action) }}</button>
						<button
							v-if="canShowCitationAction"
							type="button"
							class="mail-message-view-action-bar-menu-item mail-msg-view-control"
							data-action="citation"
							@click="handleCitation(state.context.citation)"
						>{{ getActionLabel('citation') }}</button>
						<button
							v-for="recipient in recipientActions"
							:key="recipient.email"
							type="button"
							class="mail-message-view-action-bar-menu-item mail-msg-view-control"
							data-action="recipient"
							@click="handleRecipient(recipient)"
						>{{ getRecipientLabel(recipient) }}</button>
						<div
							v-for="binding in state.context.bindings"
							:key="binding.id"
							class="mail-message-view-host mail-message-view-action-bar-binding-host"
							v-bind="getHostAttribute(binding.id)"
						></div>
					</div>
				</div>
			</nav>
		</div>
	`
	};

	const LegacyHostAttribute$3 = 'data-mail-message-view-host';
	const TestId$1 = {
		root: 'mail-message-view-attachments',
		host: 'mail-message-view-attachments-host',
		status: 'mail-message-view-attachments-status',
		refresh: 'mail-message-view-refresh-attachments',
		archive: 'mail-message-view-download-archive',
		download: 'mail-message-view-download-attachments'
	};
	function firstFilledLabel(...labels) {
		const label = labels.find(value => main_core.Type.isString(value) && main_core.Type.isStringFilled(value.trim()));
		return main_core.Type.isString(label) ? label.trim() : null;
	}
	function labelOrFallback(label, fallback) {
		return firstFilledLabel(label) ?? fallback;
	}
	function createAttachmentsComponentLabels(sources) {
		const filesSource = firstFilledLabel(sources.files);
		if (!filesSource) {
			return null;
		}
		const files = filesSource.replace(/:\s*$/, '');
		if (files === '') {
			return null;
		}
		const refresh = labelOrFallback(sources.refresh, files);
		const archive = labelOrFallback(sources.archive, files);
		return {
			loading: labelOrFallback(sources.loading, files),
			empty: files,
			error: labelOrFallback(sources.error, files),
			refresh,
			retry: labelOrFallback(sources.retry, refresh),
			archive,
			download: labelOrFallback(sources.download, archive)
		};
	}
	function createInitialState(options) {
		const enabled = options.host.enabled;
		return {
			messageId: options.messageId,
			host: options.host,
			status: enabled ? getInitialVisibleStatus(options.host, options.hasInitialContent === true) : 'hidden',
			error: null,
			generation: 0,
			hasContent: enabled && options.hasInitialContent === true,
			canRefresh: enabled && options.canRefresh === true,
			canRetry: false,
			canArchive: enabled && options.canArchive === true,
			canDownload: enabled && options.canDownload === true
		};
	}
	function getInitialVisibleStatus(host, hasInitialContent) {
		if (host.hasDeferredContent) {
			return 'loading';
		}
		return hasInitialContent ? 'ready' : 'empty';
	}
	function cloneState(state) {
		return {
			...state,
			host: {
				...state.host
			},
			error: state.error ? {
				...state.error
			} : null
		};
	}
	class Attachments {
		#state;
		#loader;
		#onTrustedContent;
		#onChange;
		#isLoading = false;
		#destroyed = false;
		constructor(options) {
			this.#loader = options.loader;
			this.#onTrustedContent = options.onTrustedContent;
			this.#onChange = options.onChange;
			this.#state = createInitialState(options);
		}
		getState() {
			return this.#state;
		}
		getSnapshot() {
			return cloneState(this.#state);
		}
		refresh() {
			return this.#load('refresh');
		}
		retry() {
			if (!this.#state.canRetry) {
				return Promise.resolve({
					status: 'ignored',
					generation: this.#state.generation
				});
			}
			return this.#load('retry');
		}
		beginExternalLoad() {
			if (this.#destroyed || this.#state.status === 'hidden') {
				return;
			}
			this.#beginLoad();
		}
		acceptExternal(response) {
			if (this.#destroyed) {
				return {
					status: 'ignored',
					generation: this.#state.generation
				};
			}
			return this.#acceptResponse(response, this.#state.generation);
		}
		destroy() {
			this.#destroyed = true;
			this.#onTrustedContent = undefined;
			this.#onChange = undefined;
		}
		async #load(type) {
			if (this.#destroyed) {
				return {
					status: 'ignored',
					generation: this.#state.generation
				};
			}
			if (this.#state.status === 'hidden') {
				return {
					status: 'hidden',
					generation: this.#state.generation
				};
			}
			if (this.#isLoading) {
				return {
					status: 'busy',
					generation: this.#state.generation
				};
			}
			const generation = this.#beginLoad();
			const response = await this.#request({
				type,
				messageId: this.#state.messageId,
				generation
			});
			if (this.#destroyed || generation !== this.#state.generation) {
				return {
					status: 'ignored',
					generation
				};
			}
			return this.#acceptResponse(response, generation);
		}
		async #request(intent) {
			try {
				return await this.#loader(intent);
			} catch (error) {
				return {
					status: 'network',
					error
				};
			}
		}
		#beginLoad() {
			this.#state.generation += 1;
			this.#state.status = 'loading';
			this.#state.error = null;
			this.#state.canRetry = false;
			this.#isLoading = true;
			this.#notify();
			return this.#state.generation;
		}
		#acceptResponse(response, generation) {
			if (response.status === 'network') {
				this.#isLoading = false;
				this.#state.status = 'error';
				this.#state.error = {
					kind: 'network',
					cause: response.error,
					generation
				};
				this.#state.canRetry = true;
				this.#notify();
				return {
					status: 'error',
					error: this.#state.error,
					generation
				};
			}
			if (!main_core.Type.isString(response.attachmentsHtml)) {
				this.#isLoading = false;
				this.#state.status = 'empty';
				this.#state.hasContent = false;
				this.#state.error = null;
				this.#state.canRetry = false;
				this.#notify();
				return {
					status: 'empty',
					generation
				};
			}
			if (response.attachmentsHtml === '') {
				this.#isLoading = false;
				this.#state.status = 'empty';
				this.#state.hasContent = false;
				this.#state.error = null;
				this.#state.canRetry = false;
				this.#notify();
				return {
					status: 'empty',
					generation
				};
			}
			const content = {
				html: response.attachmentsHtml,
				source: 'componentAction'
			};
			this.#isLoading = false;
			this.#state.status = 'ready';
			this.#state.hasContent = true;
			this.#state.error = null;
			this.#state.canRetry = false;
			this.#onTrustedContent?.(content, this.getSnapshot());
			this.#notify();
			return {
				status: 'success',
				content,
				generation
			};
		}
		#notify() {
			this.#onChange?.(this.getSnapshot());
		}
	}
	function isAttachmentsState(state) {
		return Boolean(state && Number.isInteger(state.messageId) && state.host && main_core.Type.isNumber(state.generation));
	}
	function isAttachmentsRefreshIntent(payload) {
		return Boolean(payload && (payload.type === 'refresh' || payload.type === 'retry') && Number.isInteger(payload.messageId) && Number.isInteger(payload.generation));
	}
	function isAttachmentsArchiveIntent(payload) {
		return Boolean(payload && payload.type === 'archive' && Number.isInteger(payload.messageId) && Number.isInteger(payload.generation));
	}
	function isAttachmentsDownloadIntent(payload) {
		return Boolean(payload && payload.type === 'download' && Number.isInteger(payload.messageId) && Number.isInteger(payload.generation));
	}
	const AttachmentsComponent = {
		name: 'MailMessageViewAttachments',
		props: {
			state: {
				type: Object,
				required: true,
				validator: state => {
					return isAttachmentsState(state);
				}
			},
			labels: {
				type: Object,
				required: true
			}
		},
		emits: {
			refresh: payload => {
				return isAttachmentsRefreshIntent(payload);
			},
			archive: payload => {
				return isAttachmentsArchiveIntent(payload);
			},
			download: payload => {
				return isAttachmentsDownloadIntent(payload);
			}
		},
		setup() {
			return {
				TestId: TestId$1
			};
		},
		computed: {
			isVisible() {
				return this.state.status !== 'hidden';
			},
			contentHostId() {
				return this.state.host.ajaxContainerId;
			},
			statusId() {
				return `${this.state.host.id}-status`;
			},
			statusText() {
				if (this.state.status === 'loading') {
					return this.labels.loading;
				}
				if (this.state.status === 'empty') {
					return this.labels.empty;
				}
				if (this.state.status === 'error') {
					return this.labels.error;
				}
				return '';
			},
			hasStatus() {
				return this.statusText !== '';
			},
			hasControls() {
				return this.state.canRefresh || this.state.canRetry || this.state.canArchive || this.state.canDownload;
			}
		},
		methods: {
			getHostAttribute(hostId) {
				return {
					[LegacyHostAttribute$3]: hostId
				};
			},
			getRefreshIntent(type) {
				return {
					type,
					messageId: this.state.messageId,
					generation: this.state.generation
				};
			},
			handleRefresh() {
				this.$emit('refresh', this.getRefreshIntent('refresh'));
			},
			handleRetry() {
				this.$emit('refresh', this.getRefreshIntent('retry'));
			},
			handleArchive() {
				this.$emit('archive', {
					type: 'archive',
					messageId: this.state.messageId,
					generation: this.state.generation
				});
			},
			handleDownload() {
				this.$emit('download', {
					type: 'download',
					messageId: this.state.messageId,
					generation: this.state.generation
				});
			}
		},
		template: `
		<section
			v-if="isVisible"
			:id="state.host.id"
			class="mail-msg-view-file-block mail-msg-view-border-bottom mail-message-view-host"
			:class="'mail-message-view-host-' + state.status"
			:data-testid="TestId.root"
			:data-status="state.status"
			:aria-busy="state.status === 'loading' ? 'true' : 'false'"
			:aria-describedby="hasStatus ? statusId : null"
			v-bind="getHostAttribute(state.host.id)"
		>
			<div
				v-if="contentHostId"
				:id="contentHostId"
				class="mail-msg-view-file-inner mail-message-view-host"
				:data-testid="TestId.host"
				v-bind="getHostAttribute(contentHostId)"
			></div>
			<span
				v-if="hasStatus"
				:id="statusId"
				class="mail-message-view-attachments-status"
				:data-testid="TestId.status"
				:role="state.status === 'error' ? 'alert' : 'status'"
				aria-live="polite"
				aria-atomic="true"
			>
				<span
					v-if="state.status === 'loading'"
					class="mail-message-view-loading-spinner"
					aria-hidden="true"
				></span>
				{{ statusText }}
			</span>
			<div
				v-if="hasControls"
				class="mail-msg-view-file-toolbar"
			>
				<div class="mail-msg-view-file-secondary-actions">
					<button
						v-if="state.canRefresh"
						type="button"
						class="mail-msg-refresh-files-button"
						:data-testid="TestId.refresh"
						:disabled="state.status === 'loading'"
						@click="handleRefresh"
					>{{ labels.refresh }}</button>
					<button
						v-if="state.status === 'error' && state.canRetry"
						type="button"
						class="mail-msg-refresh-files-button"
						:disabled="state.status === 'loading'"
						@click="handleRetry"
					>{{ labels.retry }}</button>
				</div>
				<div class="mail-msg-view-file-archive-block">
					<button
						v-if="state.canArchive"
						type="button"
						class="mail-msg-view-file-archive-link"
						:data-testid="TestId.archive"
						@click="handleArchive"
					>{{ labels.archive }}</button>
					<button
						v-if="state.canDownload"
						type="button"
						class="mail-msg-view-file-archive-link"
						:data-testid="TestId.download"
						@click="handleDownload"
					>{{ labels.download }}</button>
				</div>
			</div>
		</section>
	`
	};

	const SEND_ERROR_ALERT_EXTENSION = 'ui.system.alert';
	async function loadSendErrorAlert() {
		try {
			const {
				AlertDesign,
				Vue
			} = await main_core.Runtime.loadExtension(SEND_ERROR_ALERT_EXTENSION);
			const alert = Vue?.Alert;
			const design = AlertDesign?.tintedAlert;
			if (!main_core.Type.isObject(alert) || !main_core.Type.isStringFilled(design)) {
				return null;
			}
			return {
				component: ui_vue3.markRaw(alert),
				design
			};
		} catch {
			return null;
		}
	}
	const SendErrorComponent = {
		name: 'MailMessageViewSendError',
		props: {
			text: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				status: 'loading',
				alert: null
			};
		},
		created() {
			void this.loadAlert();
		},
		methods: {
			async loadAlert() {
				const alert = await loadSendErrorAlert();
				this.alert = alert;
				this.status = alert ? 'ready' : 'fallback';
			}
		},
		template: `
		<component
			v-if="status === 'ready'"
			:is="alert.component"
			:design="alert.design"
		>{{ text }}</component>
		<div
			v-else-if="status === 'fallback'"
			class="ui-alert ui-alert-danger"
		>
			<span class="ui-alert-message">{{ text }}</span>
		</div>
	`
	};

	const LegacyHostAttribute$2 = 'data-mail-message-view-host';
	const TestId = {
		thread: 'mail-message-view-thread',
		item: 'mail-message-view-thread-item',
		loading: 'mail-message-view-thread-loading',
		loadOlder: 'mail-message-view-load-older',
		loadNewer: 'mail-message-view-load-newer',
		heading: 'mail-message-view-thread-heading',
		collapse: 'mail-message-view-collapse'
	};
	const ThreadComponent = {
		name: 'MailMessageViewThread',
		props: {
			sideState: {
				type: Object,
				required: true
			},
			labels: {
				type: Object,
				required: true
			}
		},
		emits: {
			'load-side': payload => {
				return payload?.side === 'before' || payload?.side === 'after';
			},
			'toggle-item': payload => {
				return Boolean(payload && Number.isInteger(payload.id) && (payload.side === 'before' || payload.side === 'after') && payload.rowHostId && payload.detailsHostId);
			},
			'retry-item': payload => {
				return Boolean(payload && Number.isInteger(payload.id) && (payload.side === 'before' || payload.side === 'after') && payload.detailsHostId);
			}
		},
		setup() {
			return {
				TestId
			};
		},
		computed: {
			items() {
				return this.sideState.items;
			},
			side() {
				return this.sideState.code;
			},
			shouldPlaceControlsBeforeItems() {
				return this.side === 'before';
			},
			separatorLabel() {
				return this.side === 'before' ? this.labels.beforeSeparator : this.labels.afterSeparator;
			},
			loadLabel() {
				return this.side === 'before' ? this.labels.loadBefore : this.labels.loadAfter;
			},
			loadingLabel() {
				return this.side === 'before' ? this.labels.loadingBefore : this.labels.loadingAfter;
			},
			errorLabel() {
				return this.side === 'before' ? this.labels.errorBefore : this.labels.errorAfter;
			},
			retryLabel() {
				return this.side === 'before' ? this.labels.retryBefore : this.labels.retryAfter;
			},
			loadButtonTestId() {
				return this.side === 'before' ? TestId.loadOlder : TestId.loadNewer;
			},
			sideContentHostId() {
				return `mail-message-view-thread-${this.side}-content`;
			},
			canLoadSide() {
				return this.sideState.hasMore && this.sideState.status === 'idle';
			},
			canRetrySide() {
				return this.sideState.status === 'error' && this.sideState.canRetry;
			},
			isSideLoading() {
				return this.sideState.status === 'loading';
			}
		},
		methods: {
			getHostAttribute(hostId) {
				return {
					[LegacyHostAttribute$2]: hostId
				};
			},
			handleLoadSide() {
				this.$emit('load-side', {
					side: this.side
				});
			},
			handleToggleItem(item) {
				this.$emit('toggle-item', {
					id: item.pair.id,
					side: item.side,
					rowHostId: item.pair.rowKey,
					detailsHostId: item.pair.detailsKey
				});
			},
			handleRetryItem(item) {
				this.$emit('retry-item', {
					id: item.pair.id,
					side: item.side,
					detailsHostId: item.pair.detailsKey
				});
			},
			getItemToggleLabel(item) {
				return item.expanded ? this.labels.collapseItem : this.labels.expandItem;
			},
			isItemLoading(item) {
				return item.detailsStatus === 'loading';
			},
			isItemError(item) {
				return item.detailsStatus === 'error';
			}
		},
		template: `
		<div
			class="mail-message-view-thread"
			:data-side="side"
			:data-testid="TestId.thread"
		>
			<div
				v-if="shouldPlaceControlsBeforeItems"
				class="mail-message-view-thread-separator"
			>
				<div
					class="mail-message-view-thread-separator-line"
					role="separator"
					:aria-label="separatorLabel"
				></div>
				<button
					v-if="canLoadSide"
					type="button"
					class="mail-message-view-thread-load"
					:data-testid="loadButtonTestId"
					@click="handleLoadSide"
				>{{ loadLabel }}</button>
				<span
					v-if="isSideLoading"
					class="mail-message-view-thread-state"
					:data-testid="TestId.loading"
					aria-live="polite"
				>{{ loadingLabel }}</span>
				<span
					v-if="sideState.status === 'error'"
					class="mail-message-view-thread-state"
					role="alert"
				>{{ errorLabel }}</span>
				<button
					v-if="canRetrySide"
					type="button"
					class="mail-message-view-thread-load"
					:data-testid="loadButtonTestId"
					@click="handleLoadSide"
				>{{ retryLabel }}</button>
			</div>
			<div :id="sideContentHostId" class="mail-message-view-thread-content">
				<article
					v-for="item in items"
					:key="item.pair.id"
					class="mail-message-view-thread-item"
					:data-testid="TestId.item"
					:data-id="item.pair.id"
					:data-message-id="item.pair.id"
				>
					<div class="mail-message-view-thread-row">
						<button
							type="button"
							class="mail-message-view-thread-heading"
							:data-testid="TestId.heading"
							:aria-label="getItemToggleLabel(item)"
							:aria-describedby="item.pair.rowKey"
							:aria-expanded="item.expanded ? 'true' : 'false'"
							:aria-controls="item.pair.detailsKey"
							:aria-busy="isItemLoading(item) ? 'true' : 'false'"
							@click="handleToggleItem(item)"
						></button>
						<button
							type="button"
							class="mail-message-view-thread-collapse"
							:data-testid="TestId.collapse"
							:aria-expanded="item.expanded ? 'true' : 'false'"
							:aria-controls="item.pair.detailsKey"
							:aria-busy="isItemLoading(item) ? 'true' : 'false'"
							@click="handleToggleItem(item)"
						>{{ getItemToggleLabel(item) }}</button>
						<div
							:id="item.pair.rowKey"
							class="mail-message-view-host mail-message-view-thread-row-host"
							aria-hidden="true"
							v-bind="getHostAttribute(item.pair.rowKey)"
						></div>
					</div>
					<div
						v-show="item.expanded"
						class="mail-message-view-thread-details"
						:aria-busy="isItemLoading(item) ? 'true' : 'false'"
						role="region"
						:aria-labelledby="item.pair.rowKey"
					>
						<div
							:id="item.pair.detailsKey"
							class="mail-message-view-host mail-message-view-thread-details-host"
							v-bind="getHostAttribute(item.pair.detailsKey)"
						></div>
						<span
							v-if="isItemLoading(item)"
							class="mail-message-view-thread-state"
							:data-testid="TestId.loading"
							aria-live="polite"
						>{{ labels.loadingItem }}</span>
						<span
							v-if="isItemError(item)"
							class="mail-message-view-thread-state"
							role="alert"
						>{{ labels.errorItem }}</span>
						<button
							v-if="isItemError(item) && item.canRetry"
							type="button"
							class="mail-message-view-thread-retry"
							@click="handleRetryItem(item)"
						>{{ labels.retryItem }}</button>
					</div>
				</article>
			</div>
			<div
				v-if="!shouldPlaceControlsBeforeItems"
				class="mail-message-view-thread-separator"
			>
				<div
					class="mail-message-view-thread-separator-line"
					role="separator"
					:aria-label="separatorLabel"
				></div>
				<button
					v-if="canLoadSide"
					type="button"
					class="mail-message-view-thread-load"
					:data-testid="loadButtonTestId"
					@click="handleLoadSide"
				>{{ loadLabel }}</button>
				<span
					v-if="isSideLoading"
					class="mail-message-view-thread-state"
					:data-testid="TestId.loading"
					aria-live="polite"
				>{{ loadingLabel }}</span>
				<span
					v-if="sideState.status === 'error'"
					class="mail-message-view-thread-state"
					role="alert"
				>{{ errorLabel }}</span>
				<button
					v-if="canRetrySide"
					type="button"
					class="mail-message-view-thread-load"
					:data-testid="loadButtonTestId"
					@click="handleLoadSide"
				>{{ retryLabel }}</button>
			</div>
		</div>
	`
	};

	const LegacyHostAttribute$1 = 'data-mail-message-view-host';
	const DarkThemeClass = 'bitrix24-dark-theme';
	const SenderAvatarVersionConflict = 'MAIL_SENDER_AVATAR_VERSION_CONFLICT';
	const SenderAvatarEditorExtension = 'mail.client.message-view.sender-avatar-editor';
	const surfaceContextObservers = new WeakMap();
	function loadSenderAvatarEditor() {
		return main_core.Runtime.loadExtension(SenderAvatarEditorExtension).then(exports => {
			return exports.SenderAvatarEditor;
		});
	}
	function prepareSenderAvatarRetry(state) {
		Object.assign(state.senderAvatar, {
			status: 'editing',
			failure: null,
			error: ''
		});
	}
	function applyConfirmedSenderAvatar(state, data) {
		Object.assign(state.currentMessage.sender.avatar, {
			image: data.url,
			management: {
				...data,
				uploader: data.uploader ? {
					...data.uploader,
					controllerOptions: {
						...data.uploader.controllerOptions
					}
				} : null
			}
		});
	}
	function getSenderAvatarMessageAccessToken(state) {
		const accessToken = state.currentMessage.sender.avatar.management?.uploader?.controllerOptions.messageAccessToken;
		return main_core.Type.isStringFilled(accessToken) ? accessToken : undefined;
	}
	function isSenderAvatarVersionConflict(error) {
		return error instanceof SenderAvatarApiError && error.errors.some(({
			code
		}) => code === SenderAvatarVersionConflict);
	}
	function getSenderAvatarErrorMessage(state, error) {
		if (error instanceof SenderAvatarApiError) {
			const errorMessages = state.senderAvatar.confirmed?.errorMessages ?? {};
			for (const item of error.errors) {
				const code = String(item.code ?? '');
				if (code && main_core.Type.isStringFilled(errorMessages[code])) {
					return errorMessages[code];
				}
				if (main_core.Type.isStringFilled(item.message)) {
					return item.message;
				}
			}
		}
		return error instanceof Error ? error.message : '';
	}
	function revokeSenderAvatarPreview(state, nextPreviewUrl = '') {
		const previewUrl = state.senderAvatar.selection?.previewUrl ?? '';
		if (previewUrl !== nextPreviewUrl && previewUrl.startsWith('blob:')) {
			URL.revokeObjectURL(previewUrl);
		}
	}
	function rearmSenderAvatarSelection(state) {
		const selection = state.senderAvatar.selection;
		if (selection && !state.senderAvatar.intent) {
			setSenderAvatarSelection(state.senderAvatar, selection);
		}
	}
	async function readCurrentSenderAvatar(state, messageId, requestId, message) {
		try {
			const data = await senderAvatarApi.get(messageId, getSenderAvatarMessageAccessToken(state));
			if (acceptSenderAvatarRead(state.senderAvatar, requestId, data)) {
				applyConfirmedSenderAvatar(state, data);
				Object.assign(state.senderAvatar, {
					status: 'editing'
				});
				rearmSenderAvatarSelection(state);
				Object.assign(state.senderAvatar, {
					error: message
				});
			}
		} catch (error) {
			rejectSenderAvatarRead(state.senderAvatar, requestId, getSenderAvatarErrorMessage(state, error), 'refresh');
		}
	}
	async function refreshSenderAvatarAfterConflict(state, snapshot, message) {
		if (!requireSenderAvatarRefresh(state.senderAvatar, snapshot)) {
			return;
		}
		await readCurrentSenderAvatar(state, snapshot.messageId, state.senderAvatar.requestId, message);
	}
	function getSurfaceContextClass() {
		return main_core.Dom.hasClass(document.documentElement, DarkThemeClass) || main_core.Dom.hasClass(document.body, DarkThemeClass) ? '--ui-context-content-dark' : '--ui-context-content-light';
	}
	function observeSurfaceContext(owner, listener) {
		disconnectSurfaceContext(owner);
		const observer = new MutationObserver(() => {
			listener(getSurfaceContextClass());
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['class']
		});
		surfaceContextObservers.set(owner, observer);
	}
	function disconnectSurfaceContext(owner) {
		surfaceContextObservers.get(owner)?.disconnect();
		surfaceContextObservers.delete(owner);
	}
	const MessageViewComponent = {
		name: 'MailMessageViewComponent',
		components: {
			ActionBarComponent,
			AttachmentsComponent,
			SendErrorComponent,
			ThreadComponent
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			threadState: {
				type: Object,
				default: null
			},
			threadLabels: {
				type: Object,
				default: null
			},
			actionsState: {
				type: Object,
				default: null
			},
			actionLabels: {
				type: Object,
				default: null
			},
			actionLegacyAttributes: {
				type: Object,
				default: () => ({})
			},
			attachmentsState: {
				type: Object,
				default: null
			},
			attachmentLabels: {
				type: Object,
				default: null
			},
			senderAvatarEditorLoader: {
				type: Function,
				default: loadSenderAvatarEditor
			}
		},
		emits: {
			action: payload => Boolean(payload),
			'action-menu': payload => Boolean(payload),
			mailto: payload => Boolean(payload?.email),
			'attachments-refresh': payload => Boolean(payload),
			'attachments-intent': payload => Boolean(payload),
			'load-side': payload => {
				return payload?.side === 'before' || payload?.side === 'after';
			},
			'toggle-item': payload => {
				return Boolean(payload && Number.isInteger(payload.id) && (payload.side === 'before' || payload.side === 'after') && payload.rowHostId && payload.detailsHostId);
			},
			'retry-item': payload => {
				return Boolean(payload && Number.isInteger(payload.id) && (payload.side === 'before' || payload.side === 'after') && payload.detailsHostId);
			}
		},
		data() {
			return {
				surfaceContextClass: getSurfaceContextClass(),
				expandedRecipientGroups: {},
				failedAvatarUrls: new Set(),
				senderAvatarEditor: null,
				senderAvatarEditorState: 'idle',
				disposed: false
			};
		},
		computed: {
			hasThread() {
				return Boolean(this.threadState && this.threadLabels);
			},
			recipientGroups() {
				return [{
					code: 'to',
					label: this.state.currentMessage.labels.to,
					items: this.state.currentMessage.recipients.to
				}, {
					code: 'cc',
					label: this.state.currentMessage.labels.cc,
					items: this.state.currentMessage.recipients.cc
				}, {
					code: 'bcc',
					label: this.state.currentMessage.labels.bcc,
					items: this.state.currentMessage.recipients.bcc
				}].filter(group => group.items.length > 0).map((group, index) => {
					const threshold = index === 0 ? 4 : 2;
					const visibleCount = group.items.length > threshold ? threshold - 1 : group.items.length;
					return {
						...group,
						visibleItems: group.items.slice(0, visibleCount),
						hiddenItems: group.items.slice(visibleCount)
					};
				});
			},
			deliveryDate() {
				return this.state.currentMessage.date.formatted;
			},
			shouldShowSenderEmail() {
				return this.shouldShowAddressEmail(this.state.currentMessage.sender);
			},
			senderAvatarLabels() {
				return this.state.currentMessage.labels.senderAvatar ?? null;
			},
			canManageSenderAvatar() {
				const management = this.state.currentMessage.sender.avatar.management;
				return this.state.currentMessage.direction === 'incoming' && !this.state.currentMessage.sender.isCurrentUser && management?.canManage === true && management.messageId === this.state.senderAvatar.messageId && Boolean(management.uploader) && Boolean(this.senderAvatarLabels);
			},
			senderAvatarEditorProps() {
				const labels = this.senderAvatarLabels;
				if (!this.canManageSenderAvatar || !labels) {
					return null;
				}
				return {
					avatar: this.state.senderAvatar,
					labels,
					disabled: this.state.senderAvatar.status === 'loading' || this.state.senderAvatar.status === 'refreshing',
					beginEditing: this.beginSenderAvatarEditing
				};
			},
			hasSenderAvatarEditorFailure() {
				return this.senderAvatarEditorState === 'failed' && this.senderAvatarEditorProps !== null;
			},
			hasAttachmentsHost() {
				return this.state.hosts.attachments.enabled;
			},
			hasQuickReplyHost() {
				return this.state.hosts.compose.enabled && this.state.capabilities.quickReply;
			}
		},
		watch: {
			canManageSenderAvatar() {
				void this.ensureSenderAvatarEditor();
			}
		},
		mounted() {
			observeSurfaceContext(this, contextClass => {
				this.surfaceContextClass = contextClass;
			});
			void this.ensureSenderAvatarEditor();
		},
		beforeUnmount() {
			this.disposed = true;
			disconnectSurfaceContext(this);
		},
		methods: {
			getAddressText(address) {
				return address.name || address.email;
			},
			shouldShowAddressEmail(address) {
				return Boolean(address.name && address.email && address.name !== address.email);
			},
			getAddressHref(address) {
				if (address.href && address.href.toLowerCase().startsWith('mailto:')) {
					return address.href;
				}
				return null;
			},
			getAvatarText(address) {
				const initials = address.avatar.initials || this.getAddressText(address).slice(0, 1);
				return initials.toUpperCase();
			},
			getAvatarImageUrl(address) {
				for (const candidate of [address.avatar.image, address.avatar.fallbackImage]) {
					const imageUrl = candidate ? this.getSafeExternalUrl(candidate) : null;
					if (imageUrl && !this.failedAvatarUrls.has(imageUrl)) {
						return imageUrl;
					}
				}
				return null;
			},
			handleAvatarImageError(address) {
				this.markAvatarImageFailed(this.getAvatarImageUrl(address));
			},
			markAvatarImageFailed(url) {
				const imageUrl = url ? this.getSafeExternalUrl(url) : null;
				if (imageUrl) {
					this.failedAvatarUrls.add(imageUrl);
				}
			},
			getAvatarStyle(address) {
				const color = address.avatar.color;
				return color && /^#[\da-f]{6}$/i.test(color) ? {
					backgroundColor: color
				} : {};
			},
			getRecipientListId(group) {
				return `mail-message-view-current-recipients-${this.state.currentMessage.id}-${group.code}`;
			},
			isRecipientGroupExpanded(group) {
				return this.expandedRecipientGroups[group.code] === true;
			},
			expandRecipientGroup(group) {
				this.expandedRecipientGroups[group.code] = true;
			},
			getRecipientMoreLabel(group) {
				return this.state.currentMessage.labels.moreRecipients.replace('#NUM#', String(group.hiddenItems.length));
			},
			getSyncMailboxLabelPart(index) {
				const [beforeLink, ...afterLink] = this.state.currentMessage.labels.syncMailbox.split('#LINK#');
				return index === 0 ? beforeLink : afterLink.join('#LINK#');
			},
			getHostStatusClass(status) {
				return `mail-message-view-host-${status}`;
			},
			getHostAttribute(hostId) {
				return {
					[LegacyHostAttribute$1]: hostId
				};
			},
			getSafeExternalUrl(url) {
				try {
					const parsedUrl = new URL(url, window.location.href);
					if (['http:', 'https:'].includes(parsedUrl.protocol)) {
						return parsedUrl.href;
					}
				} catch {
					return null;
				}
				return null;
			},
			handleThreadLoadSide(payload) {
				this.$emit('load-side', payload);
			},
			handleThreadToggleItem(payload) {
				this.$emit('toggle-item', payload);
			},
			handleThreadRetryItem(payload) {
				this.$emit('retry-item', payload);
			},
			handleAction(payload) {
				this.$emit('action', payload);
			},
			handleActionMenu(payload) {
				this.$emit('action-menu', payload);
			},
			handleMailto(address) {
				if (address.email) {
					this.$emit('mailto', {
						email: address.email
					});
				}
			},
			handleAttachmentsRefresh(payload) {
				this.$emit('attachments-refresh', payload);
			},
			handleAttachmentsIntent(payload) {
				this.$emit('attachments-intent', payload);
			},
			async ensureSenderAvatarEditor() {
				if (!this.canManageSenderAvatar || this.senderAvatarEditorState !== 'idle') {
					return;
				}
				this.senderAvatarEditorState = 'loading';
				const component = await this.senderAvatarEditorLoader().catch(() => null);
				if (this.disposed) {
					return;
				}
				if (!component) {
					this.senderAvatarEditorState = 'failed';
					return;
				}
				this.senderAvatarEditor = ui_vue3.markRaw(component);
				this.senderAvatarEditorState = 'ready';
			},
			beginSenderAvatarEditing() {
				return openSenderAvatarEditor(this.state.senderAvatar);
			},
			handleSenderAvatarSelect(selection) {
				const previousPreviewUrl = this.state.senderAvatar.selection?.previewUrl ?? '';
				if (setSenderAvatarSelection(this.state.senderAvatar, selection) && previousPreviewUrl !== selection.previewUrl && previousPreviewUrl.startsWith('blob:')) {
					URL.revokeObjectURL(previousPreviewUrl);
				}
			},
			handleSenderAvatarDelete() {
				const previewUrl = this.state.senderAvatar.selection?.previewUrl ?? '';
				if (deleteSenderAvatar(this.state.senderAvatar) && previewUrl.startsWith('blob:')) {
					URL.revokeObjectURL(previewUrl);
				}
			},
			handleSenderAvatarCancel() {
				revokeSenderAvatarPreview(this.state);
				resetSenderAvatarIntent(this.state.senderAvatar);
			},
			async handleSenderAvatarConfirm() {
				const snapshot = beginSenderAvatarSave(this.state.senderAvatar);
				if (!snapshot) {
					return;
				}
				try {
					const data = await senderAvatarApi.save(snapshot.messageId, snapshot.change, getSenderAvatarMessageAccessToken(this.state));
					const previewUrl = this.state.senderAvatar.selection?.previewUrl ?? '';
					if (acceptSenderAvatarSave(this.state.senderAvatar, snapshot, data)) {
						if (previewUrl.startsWith('blob:')) {
							URL.revokeObjectURL(previewUrl);
						}
						applyConfirmedSenderAvatar(this.state, data);
					}
				} catch (error) {
					if (isSenderAvatarVersionConflict(error)) {
						await refreshSenderAvatarAfterConflict(this.state, snapshot, getSenderAvatarErrorMessage(this.state, error));
						return;
					}
					const message = getSenderAvatarErrorMessage(this.state, error) || this.senderAvatarLabels?.uploaderError || '';
					rejectSenderAvatarSave(this.state.senderAvatar, snapshot, message);
				}
			},
			async handleSenderAvatarRetry() {
				if (this.state.senderAvatar.status !== 'failed') {
					return;
				}
				if (this.state.senderAvatar.failure === 'refresh') {
					const messageId = this.state.senderAvatar.messageId;
					const requestId = beginSenderAvatarRead(this.state.senderAvatar, true);
					await readCurrentSenderAvatar(this.state, messageId, requestId, '');
					return;
				}
				if (this.state.senderAvatar.failure !== 'save') {
					return;
				}
				prepareSenderAvatarRetry(this.state);
				await this.handleSenderAvatarConfirm();
			}
		},
		template: `
		<div
			class="mail-msg-view-shell mail-message-view-shell"
			:class="surfaceContextClass"
			:data-message-id="state.currentMessage.id"
			:data-uid-key="state.domContracts.messageUidKey"
		>
			<header class="mail-msg-view-page-header" :data-testid="state.domContracts.testIds.header">
				<h1
					:id="state.domContracts.ids.pageTitle"
					class="mail-msg-view-page-title"
					:data-testid="state.domContracts.testIds.title"
				>
					{{ state.screen.title }}
				</h1>
				<div class="mail-msg-view-page-actions">
					<div
						v-if="state.hosts.actions.enabled"
						:id="state.hosts.actions.id"
						class="mail-message-view-host mail-message-view-actions-host"
						v-bind="getHostAttribute(state.hosts.actions.id)"
					></div>
					<div
						:id="state.hosts.pageSwapper.id"
						class="mail-msg-header-page-swapper mail-message-view-host"
						:data-testid="state.domContracts.testIds.navigation"
						:data-host-enabled="state.hosts.pageSwapper.enabled ? 'true' : 'false'"
						v-bind="getHostAttribute(state.hosts.pageSwapper.id)"
					></div>
				</div>
			</header>
			<div class="mail-msg-view-scroll-area" :data-testid="state.domContracts.testIds.scrollArea">
				<div
					class="mail-msg-view-wrapper mail-msg-view-read"
					:id="state.domContracts.ids.root"
					tabindex="-1"
					data-read-redesign="true"
					:data-testid="state.domContracts.testIds.root"
					:data-message-id="state.currentMessage.id"
					:data-uid-key="state.domContracts.messageUidKey"
				>
					<div
						v-if="state.currentMessage.sendError"
						class="mail-message-view-send-error"
						role="alert"
						data-testid="mail-message-view-send-error"
					>
						<SendErrorComponent :text="state.currentMessage.sendError" />
					</div>
					<ThreadComponent
						v-if="hasThread"
						:side-state="threadState.before"
						:labels="threadLabels"
						@load-side="handleThreadLoadSide"
						@toggle-item="handleThreadToggleItem"
						@retry-item="handleThreadRetryItem"
					/>
					<div
						class="mail-msg-view-details"
						:id="state.domContracts.ids.currentDetails"
						:data-id="state.currentMessage.id"
					>
						<div class="mail-msg-view-border-bottom">
							<div class="mail-msg-view-header mail-message-view-current-card">
								<component
									:is="senderAvatarEditor"
									v-if="senderAvatarEditor && senderAvatarEditorProps"
									v-bind="senderAvatarEditorProps"
									@select="handleSenderAvatarSelect"
									@confirm="handleSenderAvatarConfirm"
									@delete="handleSenderAvatarDelete"
									@cancel="handleSenderAvatarCancel"
									@retry="handleSenderAvatarRetry"
									@image-error="markAvatarImageFailed"
								>
									<span
										class="mail-msg-view-header-userpic mail-message-view-avatar"
										:style="getAvatarStyle(state.currentMessage.sender)"
										data-testid="mail-message-view-sender-avatar"
										aria-hidden="true"
									>
										<img
											v-if="getAvatarImageUrl(state.currentMessage.sender)"
											class="mail-message-view-avatar-image"
											:src="getAvatarImageUrl(state.currentMessage.sender)"
											alt=""
											@error="handleAvatarImageError(state.currentMessage.sender)"
										>
										<template v-else>{{ getAvatarText(state.currentMessage.sender) }}</template>
									</span>
								</component>
								<span
									v-else
									class="mail-msg-view-header-userpic mail-message-view-avatar"
									:style="getAvatarStyle(state.currentMessage.sender)"
									data-testid="mail-message-view-sender-avatar"
									aria-hidden="true"
								>
									<img
										v-if="getAvatarImageUrl(state.currentMessage.sender)"
										class="mail-message-view-avatar-image"
										:src="getAvatarImageUrl(state.currentMessage.sender)"
										alt=""
										@error="handleAvatarImageError(state.currentMessage.sender)"
									>
									<template v-else>{{ getAvatarText(state.currentMessage.sender) }}</template>
								</span>
								<span class="mail-msg-view-header-info">
									<span class="mail-msg-view-sender-block">
										<span class="mail-msg-view-sender">
											<a
												v-if="getAddressHref(state.currentMessage.sender)"
												class="mail-msg-view-sender-name js-mailto-link"
												:href="getAddressHref(state.currentMessage.sender)"
												:aria-label="state.currentMessage.labels.sender + ': ' + getAddressText(state.currentMessage.sender)"
												:data-testid="state.domContracts.testIds.senderName"
												@click.prevent="handleMailto(state.currentMessage.sender)"
											>{{ getAddressText(state.currentMessage.sender) }}</a>
											<span
												v-else
												class="mail-msg-view-sender-name"
												:data-testid="state.domContracts.testIds.senderName"
											>{{ getAddressText(state.currentMessage.sender) }}</span>
											<a
												v-if="shouldShowSenderEmail && getAddressHref(state.currentMessage.sender)"
												class="mail-msg-view-sender-email js-mailto-link"
												:href="getAddressHref(state.currentMessage.sender)"
												:data-testid="state.domContracts.testIds.senderEmail"
												@click.prevent="handleMailto(state.currentMessage.sender)"
											>{{ state.currentMessage.sender.email }}</a>
										</span>
										<span class="mail-msg-view-date">
											{{ deliveryDate }}
											<span
												v-if="state.currentMessage.date.readConfirmedFormatted"
												class="mail-message-view-read-confirmed read-confirmed-datetime"
												data-testid="mail-message-view-read-confirmed"
											>, {{ state.currentMessage.date.readConfirmedFormatted }}</span>
										</span>
									</span>
									<div class="mail-msg-view-rcpt-wrapper">
										<span
											v-for="group in recipientGroups"
											:key="group.code"
											class="mail-message-view-recipient-group"
										>
											<span class="mail-msg-view-rcpt-list">{{ group.label }}:</span>
											<span
												v-for="(recipient, index) in group.visibleItems"
												:key="group.code + '-' + recipient.email + '-' + index"
												class="mail-msg-view-rcpt-block mail-msg-list-cell-flex"
												:data-testid="state.domContracts.testIds.recipient"
											>
												<span
													class="mail-message-view-recipient-avatar"
													:style="getAvatarStyle(recipient)"
													aria-hidden="true"
												>
													<img
														v-if="getAvatarImageUrl(recipient)"
														class="mail-message-view-avatar-image"
														:src="getAvatarImageUrl(recipient)"
														alt=""
														@error="handleAvatarImageError(recipient)"
													>
													<template v-else>{{ getAvatarText(recipient) }}</template>
												</span>
												<a
													v-if="getAddressHref(recipient)"
													class="mail-msg-view-rcpt-link js-mailto-link"
													:href="getAddressHref(recipient)"
													:title="recipient.title"
													:aria-label="group.label + ': ' + getAddressText(recipient)"
													:data-testid="state.domContracts.testIds.recipientEmail"
													@click.prevent="handleMailto(recipient)"
												>{{ getAddressText(recipient) }}</a>
												<span v-else class="mail-msg-view-rcpt">{{ getAddressText(recipient) }}</span>
											</span>
											<button
												v-if="group.hiddenItems.length > 0"
												type="button"
												class="mail-message-view-recipient-more"
												data-testid="mail-message-view-recipients-toggle"
												:aria-expanded="isRecipientGroupExpanded(group) ? 'true' : 'false'"
												:aria-controls="getRecipientListId(group)"
												@click="expandRecipientGroup(group)"
											>{{ getRecipientMoreLabel(group) }}</button>
											<span
												v-if="group.hiddenItems.length > 0"
												:id="getRecipientListId(group)"
												class="mail-message-view-recipient-hidden"
												:hidden="!isRecipientGroupExpanded(group)"
											>
												<span
													v-for="(recipient, index) in group.hiddenItems"
													:key="group.code + '-hidden-' + recipient.email + '-' + index"
													class="mail-msg-view-rcpt-block mail-msg-list-cell-flex"
													:data-testid="state.domContracts.testIds.recipient"
												>
													<span
														class="mail-message-view-recipient-avatar"
														:style="getAvatarStyle(recipient)"
														aria-hidden="true"
													>
														<img
															v-if="getAvatarImageUrl(recipient)"
															class="mail-message-view-avatar-image"
															:src="getAvatarImageUrl(recipient)"
															alt=""
															@error="handleAvatarImageError(recipient)"
														>
														<template v-else>{{ getAvatarText(recipient) }}</template>
													</span>
													<a
														v-if="getAddressHref(recipient)"
														class="mail-msg-view-rcpt-link js-mailto-link"
														:href="getAddressHref(recipient)"
														:title="recipient.title"
														:aria-label="group.label + ': ' + getAddressText(recipient)"
														:data-testid="state.domContracts.testIds.recipientEmail"
														@click.prevent="handleMailto(recipient)"
													>{{ getAddressText(recipient) }}</a>
													<span v-else class="mail-msg-view-rcpt">{{ getAddressText(recipient) }}</span>
												</span>
											</span>
										</span>
									</div>
									<div
										v-if="state.hosts.labels.enabled"
										:id="state.hosts.labels.id"
										class="mail-additional mail-msg-bind-chips mail-message-view-host"
										v-bind="getHostAttribute(state.hosts.labels.id)"
									></div>
								</span>
							</div>
							<div
								v-if="hasSenderAvatarEditorFailure"
								class="ui-alert ui-alert-warning mail-message-view-sender-avatar-error"
								role="alert"
								data-testid="mail-sender-avatar-error"
							>
								<span class="ui-alert-message">{{ senderAvatarLabels.uploaderError }}</span>
							</div>
							<ActionBarComponent
								v-if="state.hosts.actions.enabled && actionsState && actionLabels"
								v-show="state.body.status !== 'loading'"
								:state="actionsState"
								:labels="actionLabels"
								:legacy-action-attributes="actionLegacyAttributes"
								@action="handleAction"
								@menu="handleActionMenu"
							/>
							<div
								v-if="state.currentMessage.flags.isSyncError"
								class="mail-message-view-sync-warning"
							>
								<template v-if="state.currentMessage.mailbox && getSafeExternalUrl(state.currentMessage.mailbox.uri)">
									{{ getSyncMailboxLabelPart(0) }}
									<a
										:href="getSafeExternalUrl(state.currentMessage.mailbox.uri)"
										target="_blank"
										rel="noopener noreferrer"
										data-testid="mail-message-view-mailbox-link"
									>{{ state.currentMessage.mailbox.host }}</a>
									{{ getSyncMailboxLabelPart(1) }}
								</template>
								<template v-else>{{ state.currentMessage.labels.syncError }}</template>
							</div>
							<div
								:id="state.hosts.messageBody.id"
								class="mail-msg-view-body mail-message-view-host"
								:class="getHostStatusClass(state.body.status)"
								:data-testid="state.domContracts.testIds.body"
								:data-message-id="state.currentMessage.id"
								:data-message-body-title="state.hosts.messageBody.title"
								:data-message-body-title-template="state.hosts.messageBody.titleTemplate"
								:data-use-ajax="state.hosts.messageBody.useAjax ? '1' : '0'"
								:data-status="state.body.status"
								:aria-busy="state.body.status === 'loading' ? 'true' : 'false'"
								v-bind="getHostAttribute(state.hosts.messageBody.id)"
							></div>
							<div
								v-if="state.hosts.messageBody.warningWaitId"
								v-show="state.body.status === 'loading'"
								:id="state.hosts.messageBody.warningWaitId"
								class="ui-alert ui-alert-warning mail-message-view-host mail-message-view-warning-host"
								v-bind="getHostAttribute(state.hosts.messageBody.warningWaitId)"
							></div>
							<div
								v-if="state.hosts.messageBody.warningFailId"
								v-show="state.body.status === 'failed'"
								:id="state.hosts.messageBody.warningFailId"
								class="ui-alert ui-alert-default mail-message-view-host mail-message-view-warning-host"
								v-bind="getHostAttribute(state.hosts.messageBody.warningFailId)"
							></div>
						</div>
						<AttachmentsComponent
							v-if="hasAttachmentsHost && attachmentsState && attachmentLabels"
							:state="attachmentsState"
							:labels="attachmentLabels"
							@refresh="handleAttachmentsRefresh"
							@archive="handleAttachmentsIntent"
							@download="handleAttachmentsIntent"
						/>
						<div
							v-else-if="hasAttachmentsHost"
							:id="state.hosts.attachments.id"
							class="mail-msg-view-file-block mail-msg-view-border-bottom mail-message-view-host"
							:class="getHostStatusClass(state.attachments.status)"
							:data-testid="state.domContracts.testIds.attachment"
							:data-status="state.attachments.status"
							:aria-busy="state.attachments.status === 'loading' ? 'true' : 'false'"
							v-bind="getHostAttribute(state.hosts.attachments.id)"
						>
							<div
								class="mail-msg-view-file-inner"
								:id="state.hosts.attachments.ajaxContainerId"
								v-bind="state.hosts.attachments.ajaxContainerId
									? getHostAttribute(state.hosts.attachments.ajaxContainerId)
									: {}"
							></div>
						</div>
						<button
							v-if="hasQuickReplyHost"
							type="button"
							:id="state.hosts.compose.quickReplyButtonId"
							class="mail-msg-view-reply-panel mail-msg-view-border-bottom mail-message-view-host"
							:data-testid="state.domContracts.testIds.quickReply"
							v-bind="state.hosts.compose.quickReplyButtonId
								? getHostAttribute(state.hosts.compose.quickReplyButtonId)
								: {}"
						></button>
						<div
							v-if="state.hosts.compose.enabled"
							:id="state.hosts.compose.formId"
							class="mail-message-view-host mail-message-view-compose-host"
							v-bind="getHostAttribute(state.hosts.compose.formId)"
						></div>
						<div
							v-if="state.hosts.iCal.enabled"
							:id="state.hosts.iCal.id"
							class="mail-message-view-host mail-message-view-ical-host"
							v-bind="getHostAttribute(state.hosts.iCal.id)"
						></div>
					</div>
					<ThreadComponent
						v-if="hasThread"
						:side-state="threadState.after"
						:labels="threadLabels"
						@load-side="handleThreadLoadSide"
						@toggle-item="handleThreadToggleItem"
						@retry-item="handleThreadRetryItem"
					/>
				</div>
			</div>
		</div>
	`
	};

	const ActionNames$1 = ['reply', 'replyAll', 'forward', 'more', 'recipient', 'citation', 'assignLabels', 'discussInChat', 'unbind', 'markSpam', 'delete', 'crm', 'task', 'chat', 'calendar', 'feed', 'pull', 'iCal'];
	function createVisibility(visibility) {
		return Object.fromEntries(ActionNames$1.map(action => [action, visibility?.[action] === true]));
	}
	function createRequestState() {
		return {
			status: 'idle',
			error: null,
			canRetry: false
		};
	}
	class Actions {
		#state;
		#delegates;
		#onChange;
		#getErrorMessage;
		#lastRetryableIntents = new Map();
		#destroyed = false;
		constructor(options) {
			this.#delegates = options.delegates ?? {};
			this.#onChange = options.onChange;
			this.#getErrorMessage = options.getErrorMessage;
			this.#state = {
				visibility: createVisibility(options.visibility),
				context: {
					messageId: options.messageId,
					mailboxId: options.mailboxId,
					recipients: options.recipients,
					citation: options.citation,
					bindings: options.isCurrentMessage ? [...(options.bindings ?? [])] : []
				},
				menu: {
					open: false,
					closeReason: null,
					focusReturnToken: 0
				},
				requests: {
					markSpam: createRequestState(),
					delete: createRequestState()
				}
			};
		}
		getState() {
			return this.#state;
		}
		getSnapshot() {
			return {
				visibility: {
					...this.#state.visibility
				},
				context: {
					...this.#state.context,
					recipients: this.#state.context.recipients,
					citation: {
						...this.#state.context.citation
					},
					bindings: this.#state.context.bindings.map(binding => ({
						...binding
					}))
				},
				menu: {
					...this.#state.menu
				},
				requests: {
					markSpam: {
						...this.#state.requests.markSpam
					},
					delete: {
						...this.#state.requests.delete
					}
				}
			};
		}
		setVisibility(action, visible) {
			if (this.#destroyed || this.#state.visibility[action] === visible) {
				return;
			}
			this.#state = {
				...this.#state,
				visibility: {
					...this.#state.visibility,
					[action]: visible
				}
			};
			this.#notify();
		}
		async dispatch(intent) {
			if (this.#destroyed) {
				return {
					status: 'ignored'
				};
			}
			if (intent.type === 'menu-open') {
				this.#openMenu();
				return {
					status: 'success'
				};
			}
			if (intent.type === 'menu-toggle') {
				if (this.#state.menu.open) {
					this.#closeMenu('toggle', true);
				} else {
					this.#openMenu();
				}
				return {
					status: 'success'
				};
			}
			if (intent.type === 'menu-close') {
				this.#closeMenu(intent.reason, intent.returnFocus);
				return {
					status: 'success'
				};
			}
			if (intent.type === 'retry') {
				const retryIntent = this.#lastRetryableIntents.get(intent.action);
				if (!retryIntent || !this.#state.requests[intent.action].canRetry) {
					return {
						status: 'unavailable'
					};
				}
				return this.#invoke(retryIntent);
			}
			return this.#invoke(intent);
		}
		destroy() {
			this.#destroyed = true;
			this.#onChange = undefined;
			this.#lastRetryableIntents.clear();
		}
		async #invoke(intent) {
			const delegate = this.#delegates[intent.action];
			if (!delegate) {
				return {
					status: 'unavailable'
				};
			}
			if (intent.action === 'markSpam' || intent.action === 'delete') {
				return this.#invokeRetryable(intent.action, intent, delegate);
			}
			try {
				await delegate(intent, this.#state.context);
				this.#closeMenu('action', true);
				return {
					status: 'success'
				};
			} catch (error) {
				return {
					status: 'error',
					error
				};
			}
		}
		async #invokeRetryable(action, intent, delegate) {
			const request = this.#state.requests[action];
			if (request.status === 'pending') {
				return {
					status: 'busy'
				};
			}
			this.#lastRetryableIntents.set(action, intent);
			request.status = 'pending';
			request.error = null;
			request.canRetry = false;
			this.#notify();
			try {
				await delegate(intent, this.#state.context);
				if (this.#destroyed) {
					return {
						status: 'ignored'
					};
				}
				request.status = 'succeeded';
				this.#closeMenu('action', true);
				this.#notify();
				return {
					status: 'success'
				};
			} catch (error) {
				if (this.#destroyed) {
					return {
						status: 'ignored'
					};
				}
				request.status = 'error';
				request.error = this.#getErrorMessage?.(error) ?? null;
				request.canRetry = true;
				this.#notify();
				return {
					status: 'error',
					error
				};
			}
		}
		#openMenu() {
			this.#state.menu.open = true;
			this.#state.menu.closeReason = null;
			this.#notify();
		}
		#closeMenu(reason, returnFocus) {
			this.#state.menu.open = false;
			this.#state.menu.closeReason = reason;
			if (returnFocus) {
				this.#state.menu.focusReturnToken += 1;
			}
			this.#notify();
		}
		#notify() {
			this.#onChange?.(this.getSnapshot());
		}
	}

	class Thread {
		#api;
		#mailUfMessageToken;
		#state;
		#items = new Map();
		#hiddenIds = new Set();
		#deletedIds = new Set();
		#onChange;
		#destroyed = false;
		constructor(options) {
			this.#api = options.api;
			this.#mailUfMessageToken = options.mailUfMessageToken;
			this.#onChange = options.onChange;
			this.#state = {
				currentId: options.currentId,
				pageSize: options.pageSize,
				before: this.#createSide('before', options.before),
				after: this.#createSide('after', options.after),
				hiddenIds: this.#hiddenIds,
				deletedIds: this.#deletedIds
			};
			options.lifecycle?.registerCleanup(() => this.destroy());
		}
		getState() {
			return this.#state;
		}
		getSnapshot() {
			return {
				currentId: this.#state.currentId,
				pageSize: this.#state.pageSize,
				before: this.#cloneSide(this.#state.before),
				after: this.#cloneSide(this.#state.after),
				hiddenIds: new Set(this.#hiddenIds),
				deletedIds: new Set(this.#deletedIds)
			};
		}
		getChronology() {
			return [...this.#state.before.items.map(item => ({
				kind: 'message',
				item
			})), {
				kind: 'current',
				id: this.#state.currentId
			}, ...this.#state.after.items.map(item => ({
				kind: 'message',
				item
			}))];
		}
		seed(side, pairsInDisplayOrder) {
			return this.#commit(side, pairsInDisplayOrder, false, 0, 0);
		}
		commitServerPage(side, pairsInServerResponseOrder, anchorBefore, anchorAfter) {
			return this.#commit(side, pairsInServerResponseOrder, true, anchorBefore, anchorAfter);
		}
		async loadSide(side) {
			const state = this.#getSide(side);
			if (this.#destroyed) {
				return {
					status: 'ignored',
					generation: 0
				};
			}
			if (state.status === 'loading') {
				return {
					status: 'busy',
					side
				};
			}
			if (!state.hasMore) {
				return {
					status: 'exhausted',
					side
				};
			}
			state.status = 'loading';
			state.error = null;
			state.canRetry = false;
			this.#notify();
			const outcome = await this.#api.log({
				id: this.#state.currentId,
				log: `${side === 'before' ? 'b' : 'a'}${state.loadedCount}`,
				size: this.#state.pageSize,
				...(this.#mailUfMessageToken ? {
					mail_uf_message_token: this.#mailUfMessageToken
				} : {})
			});
			if (outcome.status === 'ignored' || this.#destroyed) {
				return outcome.status === 'ignored' ? outcome : {
					status: 'ignored',
					generation: 0
				};
			}
			if (outcome.status === 'error') {
				state.status = 'error';
				state.error = outcome;
				state.canRetry = true;
				this.#notify();
				return outcome;
			}
			state.status = 'idle';
			state.loadedCount += outcome.data.count;
			state.hasMore = outcome.data.count >= this.#state.pageSize;
			this.#notify();
			return {
				status: 'success',
				side,
				content: outcome.data.content,
				count: outcome.data.count
			};
		}
		retrySide(side) {
			return this.loadSide(side);
		}
		async loadItem(id) {
			const item = this.#items.get(id);
			if (!item) {
				return {
					status: 'missing',
					id
				};
			}
			if (this.#isFiltered(id)) {
				return {
					status: 'filtered',
					id
				};
			}
			if (item.detailsStatus === 'loading') {
				return {
					status: 'busy',
					id
				};
			}
			item.expanded = true;
			item.detailsStatus = 'loading';
			item.error = null;
			item.canRetry = false;
			this.#notify();
			const outcome = await this.#api.logItem({
				id,
				...(this.#mailUfMessageToken ? {
					mail_uf_message_token: this.#mailUfMessageToken
				} : {})
			});
			if (outcome.status === 'ignored' || this.#destroyed) {
				return outcome.status === 'ignored' ? outcome : {
					status: 'ignored',
					generation: 0
				};
			}
			const currentItem = this.#items.get(id);
			if (!currentItem || this.#isFiltered(id)) {
				return {
					status: 'filtered',
					id
				};
			}
			if (outcome.status === 'error') {
				currentItem.detailsStatus = 'error';
				currentItem.error = outcome;
				currentItem.canRetry = true;
				this.#notify();
				return outcome;
			}
			currentItem.detailsStatus = 'ready';
			currentItem.error = null;
			currentItem.canRetry = false;
			this.#notify();
			return {
				status: 'success',
				id,
				content: outcome.data.content
			};
		}
		retryItem(id) {
			return this.loadItem(id);
		}
		markItemLoadFailed(id, error) {
			const item = this.#items.get(id);
			if (this.#destroyed || !item || this.#isFiltered(id)) {
				return false;
			}
			item.expanded = true;
			item.detailsStatus = 'error';
			item.error = error;
			item.canRetry = true;
			this.#notify();
			return true;
		}
		toggleItem(id) {
			const item = this.#items.get(id);
			if (!item) {
				return 'missing';
			}
			if (item.expanded) {
				item.expanded = false;
				this.#notify();
				return 'collapsed';
			}
			item.expanded = true;
			this.#notify();
			return item.detailsStatus === 'ready' ? 'expanded' : 'load';
		}
		markHidden(id) {
			this.#hiddenIds.add(id);
			this.#removeItem(id);
			this.#notify();
		}
		markDeleted(id) {
			this.#deletedIds.add(id);
			this.#removeItem(id);
			this.#notify();
		}
		destroy() {
			this.#destroyed = true;
			this.#onChange = undefined;
		}
		#createSide(code, bootstrap) {
			return {
				code,
				hasMore: bootstrap.hasMore,
				loadedCount: bootstrap.loadedCount,
				status: 'idle',
				error: null,
				canRetry: false,
				items: []
			};
		}
		#commit(side, pairs, reverseServerPage, anchorBefore, anchorAfter) {
			const orderedPairs = reverseServerPage ? [...pairs].reverse() : [...pairs];
			const insertedItems = [];
			const ignoredIds = [];
			orderedPairs.forEach(pair => {
				if (pair.id === this.#state.currentId || this.#items.has(pair.id) || this.#isFiltered(pair.id)) {
					ignoredIds.push(pair.id);
					return;
				}
				const item = {
					pair,
					side,
					expanded: false,
					detailsStatus: 'empty',
					error: null,
					canRetry: false
				};
				this.#items.set(pair.id, item);
				insertedItems.push(item);
			});
			const state = this.#getSide(side);
			if (side === 'before' && reverseServerPage) {
				state.items.unshift(...insertedItems);
			} else {
				state.items.push(...insertedItems);
			}
			this.#notify();
			return {
				side,
				insertedIds: insertedItems.map(item => item.pair.id),
				ignoredIds,
				scrollAnchorDelta: anchorAfter - anchorBefore
			};
		}
		#getSide(side) {
			return side === 'before' ? this.#state.before : this.#state.after;
		}
		#isFiltered(id) {
			return this.#hiddenIds.has(id) || this.#deletedIds.has(id);
		}
		#removeItem(id) {
			const item = this.#items.get(id);
			if (!item) {
				return;
			}
			const side = this.#getSide(item.side);
			side.items = side.items.filter(candidate => candidate.pair.id !== id);
			this.#items.delete(id);
		}
		#cloneSide(side) {
			return {
				code: side.code,
				hasMore: side.hasMore,
				loadedCount: side.loadedCount,
				status: side.status,
				error: side.error,
				canRetry: side.canRetry,
				items: side.items.map(item => ({
					pair: {
						...item.pair
					},
					side: item.side,
					expanded: item.expanded,
					detailsStatus: item.detailsStatus,
					error: item.error,
					canRetry: item.canRetry
				}))
			};
		}
		#notify() {
			this.#onChange?.(this.getSnapshot());
		}
	}

	const ThreadSourceAttribute = 'data-mail-message-view-thread-source';
	const ThreadRowClass = 'mail-msg-view-log-item';
	const ThreadDetailsClass = 'mail-msg-view-details';
	class LegacyIsland {
		#screen;
		#host;
		#ownedNodes = new Set();
		#placements = new Map();
		#threadPairs = new Map();
		#destroyed = false;
		constructor(options) {
			this.#screen = options.screen;
			this.#host = options.host;
			this.#screen.registerCleanup(() => this.destroy());
		}
		static createTrustedComponentResponse(response) {
			if (!main_core.Type.isString(response.html)) {
				return null;
			}
			return {
				html: response.html,
				source: 'componentAction'
			};
		}
		takeTrustedThreadSource(container, side) {
			if (this.#destroyed) {
				return [];
			}
			const pairs = [];
			container.querySelectorAll(`[${ThreadSourceAttribute}="${side}"]`).forEach(source => {
				pairs.push(...this.#extractThreadPairs(source, side));
				main_core.Dom.remove(source);
			});
			return pairs;
		}
		createThreadPairsFromTrustedComponentResponse(response, side) {
			if (this.#destroyed || response.source !== 'componentAction') {
				return [];
			}
			const template = document.createElement('template');
			template.innerHTML = response.html;
			return this.#extractThreadPairs(template.content, side);
		}
		mountThreadPairs(pairs, container, capturedGeneration) {
			if (this.#destroyed) {
				return false;
			}
			return this.#screen.guardCompletion(capturedGeneration, () => {
				const placements = pairs.map(pair => {
					const rowHost = container.querySelector(`#${pair.rowKey}`);
					const detailsHost = container.querySelector(`#${pair.detailsKey}`);
					if (!main_core.Type.isElementNode(rowHost) || !main_core.Type.isElementNode(detailsHost)) {
						return null;
					}
					return {
						pair,
						rowHost: rowHost,
						detailsHost: detailsHost
					};
				});
				if (placements.includes(null)) {
					return;
				}
				placements.forEach(placement => {
					if (!placement) {
						return;
					}
					const {
						pair,
						rowHost,
						detailsHost
					} = placement;
					this.#replacePlacement(`row:${pair.side}:${pair.id}`, rowHost, [pair.row]);
					this.#replacePlacement(`details:${pair.side}:${pair.id}`, detailsHost, [pair.details]);
					this.#threadPairs.set(this.#getPairKey(pair.side, pair.id), pair);
				});
				this.#decorate(pairs.flatMap(pair => [pair.row, pair.details]));
			});
		}
		discardThreadPairs(pairs) {
			pairs.forEach(pair => {
				this.#cleanupPlacement(`content:${pair.side}:${pair.id}`);
				this.#cleanupPlacement(`row:${pair.side}:${pair.id}`);
				this.#cleanupPlacement(`details:${pair.side}:${pair.id}`);
				this.#removeOwnedNode(pair.row);
				this.#removeOwnedNode(pair.details);
				this.#threadPairs.delete(this.#getPairKey(pair.side, pair.id));
			});
		}
		setThreadPairExpanded(side, id, expanded) {
			const pair = this.#threadPairs.get(this.#getPairKey(side, id));
			if (!pair) {
				return;
			}
			pair.row.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			main_core.Dom.style(pair.details, 'display', expanded ? '' : 'none');
		}
		mountThreadDetails(response, side, id, capturedGeneration) {
			const pair = this.#threadPairs.get(this.#getPairKey(side, id));
			if (!pair || response.source !== 'componentAction') {
				return false;
			}
			const mounted = this.#mountTrustedHtmlToHost(response.html, pair.details, `content:${side}:${id}`, capturedGeneration, true);
			if (mounted) {
				pair.details.dataset.empty = '0';
				pair.details.removeAttribute('aria-busy');
			}
			return mounted;
		}
		mountTrustedComponentResponse(response, capturedGeneration) {
			if (response.source !== 'componentAction') {
				return false;
			}
			return this.mountTrustedHtml(response.html, capturedGeneration);
		}
		mountTrustedHtml(html, capturedGeneration) {
			return this.#mountTrustedHtmlToHost(html, this.#host, 'default', capturedGeneration);
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#cleanupNodes();
			this.#threadPairs.clear();
		}
		#extractThreadPairs(root, side) {
			const elements = [...root.childNodes].filter(node => main_core.Type.isElementNode(node));
			const pairs = [];
			for (let index = 0; index < elements.length; index += 1) {
				const row = elements[index];
				const details = elements[index + 1];
				if (!main_core.Dom.hasClass(row, ThreadRowClass) || !details || !main_core.Dom.hasClass(details, ThreadDetailsClass)) {
					continue;
				}
				const id = Number(row.dataset.id);
				if (!Number.isInteger(id) || id <= 0 || Number(details.dataset.id) !== id) {
					continue;
				}
				const pair = {
					id,
					side,
					rowKey: `mail-message-view-thread-${side}-row-${id}`,
					detailsKey: `mail-message-view-thread-${side}-details-${id}`,
					row,
					details
				};
				main_core.Dom.style(row, 'pointer-events', 'none');
				row.tabIndex = -1;
				main_core.Dom.clean(details);
				main_core.Dom.style(details, 'display', 'none');
				this.#ownedNodes.add(row);
				this.#ownedNodes.add(details);
				pairs.push(pair);
				index += 1;
			}
			return pairs;
		}
		#mountTrustedHtmlToHost(html, host, placementKey, capturedGeneration, isThreadDetails = false) {
			if (this.#destroyed) {
				return false;
			}
			const processed = this.#processTrustedHtml(html);
			return this.#screen.guardCompletion(capturedGeneration, () => {
				const nodes = this.#createNodesFromTrustedHtml(processed.HTML);
				if (isThreadDetails) {
					this.#removeLegacyThreadControls(nodes);
				}
				main_core.Dom.clean(host);
				this.#replacePlacement(placementKey, host, nodes);
				this.#decorate(nodes);
				if (isThreadDetails && processed.SCRIPT.length > 0) {
					window.BX?.ajax?.processScripts?.(processed.SCRIPT);
				}
			});
		}
		#processTrustedHtml(html) {
			const processed = window.BX?.processHTML?.(html);
			if (processed && main_core.Type.isString(processed.HTML) && main_core.Type.isArray(processed.SCRIPT)) {
				return processed;
			}
			const template = document.createElement('template');
			template.innerHTML = html;
			template.content.querySelectorAll('script').forEach(script => main_core.Dom.remove(script));
			return {
				HTML: template.innerHTML,
				SCRIPT: []
			};
		}
		#createNodesFromTrustedHtml(html) {
			const template = document.createElement('template');
			template.innerHTML = html;
			const nodes = [...template.content.childNodes];
			nodes.forEach(node => this.#ownedNodes.add(node));
			return nodes;
		}
		#removeLegacyThreadControls(nodes) {
			nodes.forEach(node => {
				if (!main_core.Type.isElementNode(node)) {
					return;
				}
				const element = node;
				main_core.Dom.removeClass(element, 'mail-msg-view-header-clickable');
				main_core.Dom.removeClass(element, 'mail-msg-view-item-open');
				element.querySelectorAll('.mail-msg-view-header-clickable').forEach(header => {
					main_core.Dom.removeClass(header, 'mail-msg-view-header-clickable');
					main_core.Dom.removeClass(header, 'mail-msg-view-item-open');
				});
				element.querySelectorAll('.mail-msg-view-collapse-btn').forEach(button => {
					main_core.Dom.remove(button);
				});
			});
		}
		#replacePlacement(key, host, nodes) {
			this.#cleanupPlacement(key);
			nodes.forEach(node => main_core.Dom.append(node, host));
			this.#placements.set(key, nodes);
		}
		#cleanupPlacement(key) {
			const nodes = this.#placements.get(key) ?? [];
			nodes.forEach(node => {
				if (node.parentNode) {
					main_core.Dom.remove(node);
				}
				this.#ownedNodes.delete(node);
			});
			this.#placements.delete(key);
		}
		#removeOwnedNode(node) {
			if (node.parentNode) {
				main_core.Dom.remove(node);
			}
			this.#ownedNodes.delete(node);
		}
		#cleanupNodes() {
			this.#ownedNodes.forEach(node => {
				if (node.parentNode) {
					main_core.Dom.remove(node);
				}
			});
			this.#ownedNodes.clear();
			this.#placements.clear();
		}
		#decorate(nodes) {
			window.BXMailView?.getView?.()?.decorateReadContent?.(nodes);
		}
		#getPairKey(side, id) {
			return `${side}:${id}`;
		}
	}

	class LegacyViewRegistry {
		#screen;
		#entries = new Map();
		constructor(screen) {
			this.#screen = screen;
		}
		register(id, cleanupActions) {
			this.release(id);
			if (!this.#screen.isAlive()) {
				this.#runCleanupActions(cleanupActions);
				return;
			}
			const key = String(id);
			let release = () => {};
			release = this.#screen.registerCleanup(() => {
				if (this.#entries.get(key) === release) {
					this.#entries.delete(key);
				}
				this.#runCleanupActions(cleanupActions);
			});
			this.#entries.set(key, release);
		}
		release(id) {
			this.#entries.get(String(id))?.();
		}
		destroy() {
			this.#runCleanupActions([...this.#entries.values()].reverse());
		}
		#runCleanupActions(cleanupActions) {
			let cleanupError = null;
			cleanupActions.forEach(cleanup => {
				try {
					cleanup();
				} catch (error) {
					cleanupError ??= error;
				}
			});
			if (cleanupError) {
				throw cleanupError;
			}
		}
	}

	function createOnceCleanup(cleanup) {
		let active = true;
		return () => {
			if (!active) {
				return;
			}
			active = false;
			cleanup();
		};
	}
	class PlatformIntegrationRegistry {
		#screen;
		#sliderEventEmitter;
		#entries = [];
		#destroyed = false;
		constructor(screen, sliderEventEmitter) {
			this.#screen = screen;
			this.#sliderEventEmitter = sliderEventEmitter ?? null;
			this.#screen.registerCleanup(() => this.destroy());
		}
		registerPageSwapper(pageSwapper, cleanup) {
			this.#screen.setPageSwapper(pageSwapper);
			return this.#register('pageSwapper', pageSwapper, () => {
				cleanup?.(pageSwapper);
				this.#cleanupPageSwapper(pageSwapper);
				if (this.#screen.pageSwapper === pageSwapper) {
					this.#screen.setPageSwapper(null);
				}
			});
		}
		registerSlider(slider, cleanup) {
			this.#screen.setSlider(slider);
			const isCurrentSliderEvent = event => {
				return event.getSlider() === slider && this.#screen.slider === slider;
			};
			const handleSliderCloseStart = event => {
				if (isCurrentSliderEvent(event)) {
					slider.setCacheable?.(false);
					this.#screen.destroy();
				}
			};
			const handleSliderDestroy = event => {
				if (isCurrentSliderEvent(event)) {
					this.#screen.destroy();
				}
			};
			this.#sliderEventEmitter?.subscribe(slider, 'SidePanel.Slider:onCloseStart', handleSliderCloseStart, {
				compatMode: true
			});
			this.#sliderEventEmitter?.subscribe(slider, 'SidePanel.Slider:onDestroy', handleSliderDestroy, {
				compatMode: true
			});
			return this.#register('custom', slider, () => {
				this.#sliderEventEmitter?.unsubscribe(slider, 'SidePanel.Slider:onCloseStart', handleSliderCloseStart);
				this.#sliderEventEmitter?.unsubscribe(slider, 'SidePanel.Slider:onDestroy', handleSliderDestroy);
				cleanup?.(slider);
				if (this.#screen.slider === slider) {
					this.#screen.setSlider(null);
				}
			});
		}
		registerSecretary(secretary) {
			return this.#registerDestroyable('secretary', secretary);
		}
		registerForm(form) {
			return this.#registerDestroyable('form', form);
		}
		registerLabels(labels) {
			return this.#registerDestroyable('labels', labels);
		}
		registerDiscuss(discuss) {
			return this.#registerDestroyable('discuss', discuss);
		}
		registerPopup(popup) {
			return this.#register('popup', popup, () => {
				popup.hide();
				popup.destroy?.();
			});
		}
		registerLoader(loader) {
			return this.#register('loader', loader, () => {
				loader.hide();
				loader.destroy?.();
			});
		}
		registerSubscription(emitter, eventName, handler) {
			emitter.subscribe(eventName, handler);
			return this.#register('subscription', emitter, () => {
				emitter.unsubscribe(eventName, handler);
			});
		}
		registerNativeEvent(target, eventName, listener) {
			return this.#registerBoundEvent(target, eventName, listener);
		}
		registerBitrixEvent(target, eventName, listener) {
			return this.registerNativeEvent(target, eventName, listener);
		}
		#registerBoundEvent(target, eventName, listener) {
			main_core.Event.bind(target, eventName, listener);
			return this.#register('event', target, () => {
				main_core.Event.unbind(target, eventName, listener);
			});
		}
		registerCustomEvent(eventBus, eventName, handler) {
			eventBus.addCustomEvent(eventName, handler);
			return this.#register('custom', eventBus, () => {
				eventBus.removeCustomEvent(eventName, handler);
			});
		}
		setGuardedTimeout(callback, delay) {
			const capturedGeneration = this.#screen.captureGeneration();
			const timerId = window.setTimeout(() => {
				this.#removeEntryByResource(timerId);
				this.#screen.guardCompletion(capturedGeneration, callback);
			}, delay);
			this.#register('timer', timerId, () => window.clearTimeout(timerId));
			return timerId;
		}
		setGuardedInterval(callback, delay) {
			const capturedGeneration = this.#screen.captureGeneration();
			const timerId = window.setInterval(() => {
				this.#screen.guardCompletion(capturedGeneration, callback);
			}, delay);
			this.#register('timer', timerId, () => window.clearInterval(timerId));
			return timerId;
		}
		registerTimer(timerId, clearTimer) {
			return this.#register('timer', timerId, () => clearTimer(timerId));
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			const entries = this.#entries.splice(0).reverse();
			let cleanupError = null;
			entries.forEach(entry => {
				try {
					entry.cleanup();
				} catch (error) {
					cleanupError ??= error;
				}
			});
			if (cleanupError) {
				throw cleanupError;
			}
		}
		#registerDestroyable(kind, resource) {
			return this.#register(kind, resource, () => {
				resource.destroy?.();
			});
		}
		#register(kind, resource, cleanup) {
			const cleanupOnce = createOnceCleanup(cleanup);
			const entry = {
				kind,
				resource,
				cleanup: cleanupOnce
			};
			if (this.#destroyed) {
				cleanupOnce();
				return () => {};
			}
			this.#entries.push(entry);
			return () => {
				const index = this.#entries.indexOf(entry);
				if (index >= 0) {
					this.#entries.splice(index, 1);
				}
				cleanupOnce();
			};
		}
		#removeEntryByResource(resource) {
			const index = this.#entries.findIndex(entry => entry.resource === resource);
			if (index >= 0) {
				this.#entries.splice(index, 1);
			}
		}
		#cleanupPageSwapper(pageSwapper) {
			pageSwapper.hideLoader?.();
			pageSwapper.loader?.hide();
			pageSwapper.loader?.destroy?.();
			const wrapper = pageSwapper.getWrapper?.();
			if (wrapper) {
				main_core.Dom.remove(wrapper);
			}
		}
	}

	const componentName = 'bitrix:mail.client.message.view';
	const defaultRunner = (component, action, options) => {
		return main_core.ajax.runComponentAction(component, action, options);
	};
	class ComponentApi {
		#screen;
		#runner;
		#destroyed = false;
		constructor(options) {
			this.#screen = options.screen;
			this.#runner = options.runner ?? defaultRunner;
			this.#screen.registerCleanup(() => this.destroy());
		}
		async log(payload) {
			return this.#request('log', payload, this.#mapLogResult);
		}
		async logItem(payload) {
			return this.#request('logitem', payload, this.#mapLogItemResult);
		}
		destroy() {
			this.#destroyed = true;
		}
		async #request(action, payload, mapResult) {
			const generation = this.#screen.captureGeneration();
			if (this.#destroyed || !this.#screen.isAlive()) {
				return {
					status: 'ignored',
					generation
				};
			}
			try {
				const response = await this.#runner(componentName, action, {
					mode: 'class',
					data: payload
				});
				const errors = response.errors ?? [];
				if (errors.length > 0 || response.status && response.status !== 'success') {
					return this.#guardOutcome(generation, {
						status: 'error',
						kind: 'application',
						errors,
						cause: response,
						generation
					});
				}
				const data = mapResult(response.data);
				if (data === null) {
					return this.#guardOutcome(generation, {
						status: 'error',
						kind: 'application',
						errors: [],
						cause: response,
						generation
					});
				}
				return this.#guardOutcome(generation, {
					status: 'success',
					data,
					generation
				});
			} catch (cause) {
				const errors = this.#getServerErrors(cause);
				return this.#guardOutcome(generation, {
					status: 'error',
					kind: errors.length > 0 ? 'application' : 'network',
					errors,
					cause,
					generation
				});
			}
		}
		#guardOutcome(generation, outcome) {
			let accepted = false;
			this.#screen.guardCompletion(generation, () => {
				accepted = !this.#destroyed;
			});
			return accepted ? outcome : {
				status: 'ignored',
				generation
			};
		}
		#mapLogResult = data => {
			if (!main_core.Type.isObject(data)) {
				return null;
			}
			const result = data;
			if (!main_core.Type.isString(result.html) || !main_core.Type.isNumber(result.count)) {
				return null;
			}
			return {
				content: {
					html: result.html,
					source: 'componentAction'
				},
				count: result.count
			};
		};
		#mapLogItemResult = data => {
			if (!main_core.Type.isString(data)) {
				return null;
			}
			return {
				content: {
					html: data,
					source: 'componentAction'
				}
			};
		};
		#getServerErrors(cause) {
			if (!main_core.Type.isObject(cause)) {
				return [];
			}
			const response = cause;
			return main_core.Type.isArray(response.errors) ? response.errors : [];
		}
	}

	const LegacySeedAttribute = 'data-mail-message-view-seed';
	const LegacyHostAttribute = 'data-mail-message-view-host';
	const LegacyActionAttributeNames = ['data-role', 'data-uid-key', 'data-label-ids', 'aria-haspopup', 'aria-expanded'];
	const ActionSelectors = {
		reply: '.js-msg-view-control-reply',
		replyAll: '.js-msg-view-control-replyall',
		forward: '.js-msg-view-control-forward',
		more: '.mail-msg-view-control-more',
		assignLabels: '[data-role="mail-label-assign"]',
		discussInChat: '.js-mail-discuss-in-chat',
		unbind: '.js-msg-view-control-skip',
		markSpam: '.js-msg-view-control-spam',
		delete: '.js-msg-view-control-delete'
	};
	const ActionNames = ['reply', 'replyAll', 'forward', 'more', 'recipient', 'citation', 'assignLabels', 'discussInChat', 'unbind', 'markSpam', 'delete', 'crm', 'task', 'chat', 'calendar', 'feed', 'pull', 'iCal'];
	function collectLegacySeeds(container) {
		const seeds = new Map();
		container.querySelectorAll(`[${LegacySeedAttribute}]`).forEach(node => {
			if (!main_core.Type.isElementNode(node)) {
				return;
			}
			const seed = node;
			const key = seed.getAttribute(LegacySeedAttribute);
			if (!main_core.Type.isStringFilled(key)) {
				return;
			}
			if (!seeds.has(key)) {
				seeds.set(key, []);
			}
			seeds.get(key)?.push(seed);
			main_core.Dom.remove(seed);
		});
		return seeds;
	}
	function mountLegacySeeds(container, seeds) {
		seeds.forEach((items, key) => {
			const host = container.querySelector(`[${LegacyHostAttribute}="${key}"]`);
			if (!main_core.Type.isElementNode(host)) {
				return;
			}
			items.forEach(seed => {
				while (seed.firstChild) {
					main_core.Dom.append(seed.firstChild, host);
				}
			});
		});
	}
	function findSeedElement(seeds, key, selector) {
		for (const seed of seeds.get(key) ?? []) {
			const element = seed.matches(selector) ? seed : seed.querySelector(selector);
			if (main_core.Type.isElementNode(element)) {
				return element;
			}
		}
		return null;
	}
	function createActionBarLabels(seeds, bootstrap) {
		const actions = Object.fromEntries(ActionNames.map(action => [action, '']));
		const visibleActions = {
			reply: bootstrap.capabilities.reply,
			replyAll: bootstrap.capabilities.replyAll,
			forward: bootstrap.capabilities.forward,
			more: bootstrap.capabilities.more,
			assignLabels: bootstrap.capabilities.assignLabels,
			discussInChat: bootstrap.capabilities.discussInChat,
			unbind: bootstrap.capabilities.unbind,
			markSpam: bootstrap.capabilities.markSpam,
			delete: bootstrap.capabilities.delete
		};
		for (const [action, visible] of Object.entries(visibleActions)) {
			if (!visible) {
				continue;
			}
			const selector = ActionSelectors[action];
			const label = selector ? findSeedElement(seeds, bootstrap.hosts.actions.id, selector)?.textContent?.trim() : '';
			if (!main_core.Type.isStringFilled(label)) {
				return null;
			}
			actions[action] = label;
		}
		return {
			actions,
			pending: {
				markSpam: actions.markSpam,
				delete: actions.delete
			},
			retry: {
				markSpam: actions.markSpam,
				delete: actions.delete
			},
			error: {
				markSpam: actions.markSpam,
				delete: actions.delete
			}
		};
	}
	function createActionBarLegacyAttributes(seeds, bootstrap) {
		const selector = ActionSelectors.assignLabels;
		const assignLabels = findSeedElement(seeds, bootstrap.hosts.actions.id, selector) ;
		if (!assignLabels) {
			return {};
		}
		const attributes = {};
		LegacyActionAttributeNames.forEach(name => {
			const value = assignLabels.getAttribute(name);
			if (value !== null) {
				attributes[name] = value;
			}
		});
		return {
			assignLabels: attributes
		};
	}
	function getLegacyErrorMessage(error) {
		if (error instanceof Error) {
			return error.message;
		}
		if (main_core.Type.isStringFilled(error)) {
			return error;
		}
		const errors = main_core.Type.isObject(error) ? error.errors : null;
		if (main_core.Type.isArray(errors)) {
			for (const item of errors) {
				const message = main_core.Type.isObject(item) ? item.message : null;
				if (main_core.Type.isStringFilled(message)) {
					return message;
				}
			}
		}
		return null;
	}
	function getSeedLabel(seeds, key, selector) {
		const label = findSeedElement(seeds, key, selector)?.textContent?.trim().replace(/:\s*$/, '');
		return main_core.Type.isStringFilled(label) ? label : null;
	}
	function createAttachmentLabels(seeds, bootstrap, threadLabels) {
		const seedKey = bootstrap.hosts.attachments.id;
		return createAttachmentsComponentLabels({
			files: getSeedLabel(seeds, seedKey, '.mail-msg-view-file-text') ?? threadLabels?.loadBefore,
			loading: threadLabels?.loadingBefore,
			error: threadLabels?.errorBefore,
			refresh: getSeedLabel(seeds, seedKey, '[data-testid="mail-message-view-refresh-attachments"]'),
			retry: threadLabels?.retryBefore,
			archive: getSeedLabel(seeds, seedKey, '[data-testid="mail-message-view-download-archive"]')
		});
	}
	function toThreadPair(pair) {
		return {
			id: pair.id,
			rowKey: pair.rowKey,
			detailsKey: pair.detailsKey
		};
	}
	function partitionInsertedPairs(pairs, insertedIds) {
		const remainingIds = [...insertedIds];
		const inserted = [];
		const discarded = [];
		pairs.forEach(pair => {
			const index = remainingIds.indexOf(pair.id);
			if (index === -1) {
				discarded.push(pair);
				return;
			}
			remainingIds.splice(index, 1);
			inserted.push(pair);
		});
		return {
			inserted,
			discarded
		};
	}
	const App = ui_vue3.defineComponent({
		name: 'MailMessageViewApp',
		components: {
			MessageViewComponent
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			threadView: {
				type: Object,
				required: true
			},
			threadLabels: {
				type: Object,
				default: null
			},
			actionsView: {
				type: Object,
				required: true
			},
			actionLabels: {
				type: Object,
				default: null
			},
			actionLegacyAttributes: {
				type: Object,
				default: () => ({})
			},
			attachmentsView: {
				type: Object,
				required: true
			},
			attachmentLabels: {
				type: Object,
				default: null
			},
			onAction: {
				type: Function,
				required: true
			},
			onActionMenu: {
				type: Function,
				required: true
			},
			onMailto: {
				type: Function,
				required: true
			},
			onAttachmentsRefresh: {
				type: Function,
				required: true
			},
			onAttachmentsIntent: {
				type: Function,
				required: true
			},
			onLoadSide: {
				type: Function,
				required: true
			},
			onToggleItem: {
				type: Function,
				required: true
			},
			onRetryItem: {
				type: Function,
				required: true
			}
		},
		template: `
		<MessageViewComponent
			:state="state"
			:thread-state="threadView.state"
			:thread-labels="threadLabels"
			:actions-state="actionsView.state"
			:action-labels="actionLabels"
			:action-legacy-attributes="actionLegacyAttributes"
			:attachments-state="attachmentsView.state"
			:attachment-labels="attachmentLabels"
			@action="onAction"
			@action-menu="onActionMenu"
			@mailto="onMailto"
			@attachments-refresh="onAttachmentsRefresh"
			@attachments-intent="onAttachmentsIntent"
			@load-side="onLoadSide"
			@toggle-item="onToggleItem"
			@retry-item="onRetryItem"
		/>
	`
	});
	class MessageViewScreenApplication {
		#options;
		#screen = null;
		#container = null;
		#app = null;
		#thread = null;
		#threadView = null;
		#island = null;
		#attachmentsIsland = null;
		#actions = null;
		#actionsView = null;
		#attachments = null;
		#attachmentsView = null;
		#integrations = null;
		#nestedLegacyViews = null;
		#state = null;
		#stateLifecycle;
		#connectedLegacyViews = new WeakSet();
		constructor(options, stateLifecycle = null) {
			this.#options = options;
			this.#stateLifecycle = stateLifecycle;
		}
		bindScreen(screen) {
			this.#screen = screen;
		}
		start() {
			const screen = this.#screen;
			if (this.#app || !screen) {
				return;
			}
			const container = document.getElementById(this.#options.containerId);
			if (!container) {
				return;
			}
			this.#container = container;
			const state = createMessageViewState(this.#options.bootstrap);
			this.#state = state;
			if (this.#stateLifecycle && !this.#stateLifecycle.bind(state)) {
				throw new TypeError('Message view lifecycle rejected an unrelated state');
			}
			this.#registerSenderAvatarImageFailure(screen, container);
			const legacySeeds = collectLegacySeeds(container);
			const actionLabels = createActionBarLabels(legacySeeds, this.#options.bootstrap);
			const actionLegacyAttributes = createActionBarLegacyAttributes(legacySeeds, this.#options.bootstrap);
			const attachmentLabels = createAttachmentLabels(legacySeeds, this.#options.bootstrap, this.#options.threadLabels);
			if (actionLabels) {
				const legacyControls = findSeedElement(legacySeeds, this.#options.bootstrap.hosts.actions.id, `#${this.#options.bootstrap.domContracts.ids.actions}`);
				if (legacyControls) {
					legacyControls.hidden = true;
					removeActionTestIds(legacyControls);
				}
			}
			const topWindow = window.top ?? window;
			const integrations = new PlatformIntegrationRegistry(screen, topWindow.BX?.Event?.EventEmitter);
			this.#integrations = integrations;
			this.#nestedLegacyViews = new LegacyViewRegistry(screen);
			const island = new LegacyIsland({
				screen,
				host: container
			});
			this.#island = island;
			const initialBefore = island.takeTrustedThreadSource(container, 'before');
			const initialAfter = island.takeTrustedThreadSource(container, 'after');
			const thread = this.#createThread(screen);
			this.#createActions(screen);
			this.#createAttachments(screen);
			const beforeCommit = thread.seed('before', initialBefore.map(pair => toThreadPair(pair)));
			const afterCommit = thread.seed('after', initialAfter.map(pair => toThreadPair(pair)));
			const beforePairs = partitionInsertedPairs(initialBefore, beforeCommit.insertedIds);
			const afterPairs = partitionInsertedPairs(initialAfter, afterCommit.insertedIds);
			island.discardThreadPairs([...beforePairs.discarded, ...afterPairs.discarded]);
			this.#threadView = ui_vue3.reactive({
				state: thread.getSnapshot()
			});
			this.#app = this.#createVueApplication(state, actionLabels, actionLegacyAttributes, attachmentLabels);
			this.#app.mount(container);
			mountLegacySeeds(container, legacySeeds);
			const legacyControls = document.getElementById(this.#options.bootstrap.domContracts.ids.actions);
			const currentDetails = document.getElementById(this.#options.bootstrap.domContracts.ids.currentDetails);
			if (legacyControls && currentDetails) {
				main_core.Dom.append(legacyControls, currentDetails);
			}
			island.mountThreadPairs([...beforePairs.inserted, ...afterPairs.inserted], container, screen.captureGeneration());
			this.#registerMenuListeners(integrations);
			this.#subscribeLegacyViews();
		}
		#createThread(screen) {
			const api = new ComponentApi({
				screen
			});
			const thread = new Thread({
				currentId: this.#options.bootstrap.thread.currentMessageId,
				pageSize: this.#options.bootstrap.thread.pageSize,
				before: this.#options.bootstrap.thread.before,
				after: this.#options.bootstrap.thread.after,
				api,
				mailUfMessageToken: this.#options.mailUfMessageToken,
				lifecycle: screen,
				onChange: snapshot => {
					if (this.#threadView) {
						this.#threadView.state = snapshot;
					}
				}
			});
			this.#thread = thread;
			return thread;
		}
		#createActions(screen) {
			const actions = new Actions({
				messageId: this.#options.bootstrap.currentMessage.id,
				mailboxId: this.#options.bootstrap.currentMessage.mailboxId,
				recipients: this.#options.bootstrap.currentMessage.recipients,
				citation: {
					formId: this.#options.bootstrap.hosts.compose.formId,
					quoteFieldName: this.#options.bootstrap.hosts.compose.quoteFieldName,
					available: false
				},
				isCurrentMessage: true,
				visibility: {
					reply: this.#options.bootstrap.capabilities.reply,
					replyAll: this.#options.bootstrap.capabilities.replyAll,
					forward: this.#options.bootstrap.capabilities.forward,
					more: this.#options.bootstrap.capabilities.more,
					assignLabels: this.#options.bootstrap.capabilities.assignLabels,
					discussInChat: this.#options.bootstrap.capabilities.discussInChat,
					unbind: this.#options.bootstrap.capabilities.unbind,
					markSpam: this.#options.bootstrap.capabilities.markSpam,
					delete: this.#options.bootstrap.capabilities.delete
				},
				delegates: this.#createActionDelegates(),
				getErrorMessage: getLegacyErrorMessage,
				onChange: snapshot => {
					if (this.#actionsView) {
						this.#actionsView.state = snapshot;
					}
				}
			});
			this.#actions = actions;
			screen.registerCleanup(() => actions.destroy());
			this.#actionsView = ui_vue3.reactive({
				state: actions.getSnapshot()
			});
		}
		#createAttachments(screen) {
			const attachments = new Attachments({
				messageId: this.#options.bootstrap.currentMessage.id,
				host: this.#options.bootstrap.hosts.attachments,
				loader: () => this.#loadAttachmentsWithLegacy(),
				hasInitialContent: this.#options.bootstrap.hosts.attachments.enabled && !this.#options.bootstrap.hosts.attachments.hasDeferredContent,
				onTrustedContent: content => {
					this.#mountAttachments(content);
				},
				onChange: snapshot => {
					if (this.#attachmentsView) {
						this.#attachmentsView.state = snapshot;
					}
				}
			});
			this.#attachments = attachments;
			screen.registerCleanup(() => attachments.destroy());
			this.#attachmentsView = ui_vue3.reactive({
				state: attachments.getSnapshot()
			});
		}
		#createVueApplication(state, actionLabels, actionLegacyAttributes, attachmentLabels) {
			return ui_vue3.BitrixVue.createApp(App, {
				state,
				threadView: this.#threadView,
				threadLabels: this.#options.threadLabels,
				actionsView: this.#actionsView,
				actionLabels,
				actionLegacyAttributes,
				attachmentsView: this.#attachmentsView,
				attachmentLabels,
				onAction: intent => {
					void this.#handleAction(intent);
				},
				onActionMenu: intent => {
					void this.#actions?.dispatch(intent);
				},
				onMailto: intent => {
					this.#handleMailto(intent);
				},
				onAttachmentsRefresh: intent => {
					void this.#handleAttachmentsRefresh(intent);
				},
				onAttachmentsIntent: intent => {
					this.#handleAttachmentsIntent(intent);
				},
				onLoadSide: intent => {
					void this.#loadSide(intent);
				},
				onToggleItem: intent => {
					void this.#toggleItem(intent);
				},
				onRetryItem: intent => {
					void this.#retryItem(intent);
				}
			});
		}
		destroy() {
			this.#nestedLegacyViews?.destroy();
			this.#app?.unmount();
			this.#stateLifecycle?.dispose();
			this.#app = null;
			this.#thread = null;
			this.#threadView = null;
			this.#island = null;
			this.#attachmentsIsland = null;
			this.#actions = null;
			this.#actionsView = null;
			this.#attachments = null;
			this.#attachmentsView = null;
			this.#integrations = null;
			this.#nestedLegacyViews = null;
			this.#state = null;
			this.#container = null;
		}
		#registerSenderAvatarImageFailure(screen, container) {
			const lifecycle = this.#stateLifecycle;
			if (!lifecycle) {
				return;
			}
			const handleImageFailure = event => {
				const image = event.target;
				if (!(image instanceof HTMLImageElement)) {
					return;
				}
				const isSenderImage = main_core.Dom.hasClass(image, 'mail-sender-avatar-editor__confirmed-image') || Boolean(image.closest('.mail-msg-view-header-userpic'));
				const url = image.getAttribute('src') ?? '';
				if (isSenderImage && url) {
					lifecycle.handleImageFailure(url);
				}
			};
			main_core.Event.bind(container, 'error', handleImageFailure, true);
			screen.registerCleanup(() => main_core.Event.unbind(container, 'error', handleImageFailure, true));
		}
		#createActionDelegates() {
			return {
				reply: () => this.#invokeLegacyControl('.js-msg-view-control-reply'),
				replyAll: () => this.#invokeLegacyControl('.js-msg-view-control-replyall'),
				forward: () => this.#invokeLegacyControl('.js-msg-view-control-forward'),
				assignLabels: () => Promise.resolve(),
				discussInChat: () => this.#invokeLegacyControl('.js-mail-discuss-in-chat'),
				unbind: () => this.#invokeLegacyControl('.js-msg-view-control-skip'),
				markSpam: () => this.#invokeLegacyAction('.js-msg-view-control-spam'),
				delete: () => this.#invokeLegacyAction('.js-msg-view-control-delete')
			};
		}
		#invokeLegacyControl(selector) {
			const controlBlock = document.getElementById(this.#options.bootstrap.domContracts.ids.actions);
			const control = controlBlock?.querySelector(selector);
			if (!(control instanceof HTMLElement)) {
				throw new TypeError(`Legacy message action is unavailable: ${selector}`);
			}
			control.click();
		}
		#invokeLegacyAction(selector) {
			const view = this.#getCurrentLegacyView();
			if (!view?.invokeActionForState) {
				throw new TypeError(`Legacy message action bridge is unavailable: ${selector}`);
			}
			return view.invokeActionForState(selector);
		}
		#handleMailto(intent) {
			this.#getCurrentLegacyView()?.openMailComposer?.(intent.email);
		}
		#getCurrentLegacyView() {
			return window.BXMailView?.getView?.(this.#options.bootstrap.currentMessage.id);
		}
		async #handleAction(intent) {
			if (intent.type === 'retry') {
				await this.#actions?.dispatch(intent);
				return;
			}
			await this.#actions?.dispatch(intent);
		}
		async #handleAttachmentsRefresh(intent) {
			const attachments = this.#attachments;
			if (!attachments || intent.messageId !== this.#options.bootstrap.currentMessage.id || intent.generation !== attachments.getState().generation) {
				return;
			}
			if (intent.type === 'retry') {
				await attachments.retry();
				return;
			}
			await attachments.refresh();
		}
		#handleAttachmentsIntent(intent) {
			if (intent.messageId !== this.#options.bootstrap.currentMessage.id) {
				return;
			}
			const selector = intent.type === 'archive' ? '[data-testid="mail-message-view-download-archive"]' : null;
			if (selector) {
				const control = this.#container?.querySelector(selector);
				if (control instanceof HTMLElement) {
					control.click();
				}
			}
		}
		#registerMenuListeners(integrations) {
			const handleOutsideClick = event => {
				if (!this.#actions?.getState().menu.open) {
					return;
				}
				const root = this.#container?.querySelector('[data-testid="mail-message-view-action-bar"]');
				if (event.target instanceof Node && root?.contains(event.target)) {
					return;
				}
				void this.#actions.dispatch({
					type: 'menu-close',
					reason: 'outside',
					returnFocus: false
				});
			};
			const handleEscape = event => {
				if (!(event instanceof KeyboardEvent) || event.key !== 'Escape' || !this.#actions?.getState().menu.open) {
					return;
				}
				event.preventDefault();
				void this.#actions.dispatch({
					type: 'menu-close',
					reason: 'escape',
					returnFocus: true
				});
			};
			integrations.registerNativeEvent(document, 'click', handleOutsideClick);
			integrations.registerNativeEvent(document, 'keydown', handleEscape);
		}
		#subscribeLegacyViews() {
			const screen = this.#screen;
			const facade = window.BXMailView;
			if (!screen || !facade) {
				return;
			}
			if (facade.subscribeViewReady) {
				const unsubscribe = facade.subscribeViewReady(view => this.#connectLegacyView(view));
				screen.registerCleanup(unsubscribe);
				return;
			}
			const currentView = facade.getView?.(this.#options.bootstrap.currentMessage.id);
			if (currentView) {
				this.#connectLegacyView(currentView);
			}
		}
		#connectLegacyView(view) {
			const screen = this.#screen;
			const integrations = this.#integrations;
			if (!screen || !integrations || this.#connectedLegacyViews.has(view)) {
				return;
			}
			this.#connectedLegacyViews.add(view);
			const generation = screen.captureGeneration();
			const isCurrent = String(view.id) === String(this.#options.bootstrap.currentMessage.id);
			const nestedViewId = !isCurrent && (main_core.Type.isString(view.id) || main_core.Type.isNumber(view.id)) ? view.id : null;
			const bridge = isCurrent ? this.#createCurrentLegacyBridge(generation) : {
				onAttachmentsLoading: () => {},
				onAttachmentsResponse: response => {
					return this.#acceptNestedAttachments(view, response, generation);
				}
			};
			view.setIntegrationBridge?.(bridge);
			const nestedCleanupActions = [];
			const clearBridge = () => view.setIntegrationBridge?.(null);
			if (nestedViewId === null) {
				screen.registerCleanup(clearBridge);
			} else {
				nestedCleanupActions.push(clearBridge);
			}
			if (isCurrent && view.slider) {
				integrations.registerSlider(view.slider);
			}
			const formId = view.options?.formId;
			const legacyWindow = window;
			const form = main_core.Type.isStringFilled(formId) ? legacyWindow.BXMainMailForm?.getForm?.(formId) : null;
			if (form) {
				const releaseForm = integrations.registerForm(form);
				if (nestedViewId !== null) {
					nestedCleanupActions.push(releaseForm);
				}
			}
			if (nestedViewId !== null) {
				nestedCleanupActions.push(() => view.destroy?.());
				this.#nestedLegacyViews?.register(nestedViewId, nestedCleanupActions);
			}
		}
		#createCurrentLegacyBridge(generation) {
			const screen = this.#screen;
			return {
				onCrmExcluded: () => {
					screen?.guardCompletion(generation, () => {
						this.#actions?.setVisibility('unbind', false);
					});
				},
				onBodyLoading: () => {
					screen?.guardCompletion(generation, () => {
						if (this.#state) {
							this.#state.body.status = 'loading';
							this.#state.body.error = null;
						}
					});
				},
				onBodyResponse: response => {
					screen?.guardCompletion(generation, () => {
						if (this.#state) {
							this.#state.body.status = response.status === 'success' ? 'ready' : 'failed';
							this.#state.body.error = response.status === 'network' ? getLegacyErrorMessage(response.error) : null;
						}
					});
				},
				onAttachmentsLoading: () => {
					screen?.guardCompletion(generation, () => this.#attachments?.beginExternalLoad());
				},
				onAttachmentsResponse: response => {
					let handled = false;
					screen?.guardCompletion(generation, () => {
						this.#attachments?.acceptExternal(response);
						handled = true;
					});
					return handled;
				}
			};
		}
		#acceptNestedAttachments(view, response, generation) {
			const screen = this.#screen;
			let handled = false;
			screen?.guardCompletion(generation, () => {
				handled = true;
				const hostId = view.options?.ajaxAttachmentElementId;
				const host = main_core.Type.isStringFilled(hostId) ? document.getElementById(hostId) : null;
				if (!host) {
					return;
				}
				if (response.status === 'network') {
					const messageId = Number(view.id);
					if (Number.isInteger(messageId)) {
						this.#thread?.markItemLoadFailed(messageId, {
							status: 'error',
							kind: 'network',
							errors: [],
							cause: response.error,
							generation
						});
					}
					return;
				}
				if (!main_core.Type.isString(response.attachmentsHtml) || response.attachmentsHtml === '') {
					return;
				}
				const island = new LegacyIsland({
					screen,
					host
				});
				island.mountTrustedComponentResponse({
					html: response.attachmentsHtml,
					source: 'componentAction'
				}, generation);
			});
			return handled;
		}
		async #loadAttachmentsWithLegacy() {
			const view = window.BXMailView?.getView?.(this.#options.bootstrap.currentMessage.id);
			if (view?.loadAttachmentsForState) {
				return view.loadAttachmentsForState();
			}
			return {
				status: 'network',
				error: new Error('Legacy attachments loader is unavailable')
			};
		}
		#mountAttachments(content) {
			const screen = this.#screen;
			const hostId = this.#options.bootstrap.hosts.attachments.ajaxContainerId;
			const host = hostId ? document.getElementById(hostId) : null;
			if (!screen || !host) {
				return;
			}
			this.#attachmentsIsland ??= new LegacyIsland({
				screen,
				host
			});
			const mounted = this.#attachmentsIsland.mountTrustedComponentResponse(content, screen.captureGeneration());
			if (mounted) {
				this.#getCurrentLegacyView()?.finalizeAttachmentsIntegration?.();
			}
		}
		async #loadSide(intent) {
			const thread = this.#thread;
			const island = this.#island;
			const container = this.#container;
			const screen = this.#screen;
			if (!thread || !island || !container || !screen) {
				return;
			}
			const generation = screen.captureGeneration();
			const result = await thread.loadSide(intent.side);
			if (result.status !== 'success') {
				return;
			}
			const pairs = island.createThreadPairsFromTrustedComponentResponse(result.content, intent.side);
			const anchor = container.querySelector(`#${this.#options.bootstrap.domContracts.ids.currentDetails}`);
			const scrollable = container.querySelector('.mail-msg-view-scroll-area');
			const anchorBefore = main_core.Type.isElementNode(anchor) ? anchor.getBoundingClientRect().top : 0;
			const commit = thread.commitServerPage(intent.side, pairs.map(pair => toThreadPair(pair)), anchorBefore, anchorBefore);
			const partitioned = partitionInsertedPairs(pairs, commit.insertedIds);
			island.discardThreadPairs(partitioned.discarded);
			await ui_vue3.nextTick();
			island.mountThreadPairs(partitioned.inserted, container, generation);
			await ui_vue3.nextTick();
			if (main_core.Type.isElementNode(anchor) && main_core.Type.isElementNode(scrollable)) {
				const anchorAfter = anchor.getBoundingClientRect().top;
				scrollable.scrollTop += anchorAfter - anchorBefore;
			}
		}
		async #toggleItem(intent) {
			const action = this.#thread?.toggleItem(intent.id);
			if (!action || action === 'missing') {
				return;
			}
			const expanded = action !== 'collapsed';
			this.#island?.setThreadPairExpanded(intent.side, intent.id, expanded);
			if (action === 'load') {
				await this.#loadItem(intent.id, intent.side, false);
			}
		}
		async #retryItem(intent) {
			this.#island?.setThreadPairExpanded(intent.side, intent.id, true);
			await this.#loadItem(intent.id, intent.side, true);
		}
		async #loadItem(id, side, retry) {
			const thread = this.#thread;
			const island = this.#island;
			const screen = this.#screen;
			if (!thread || !island || !screen) {
				return;
			}
			const generation = screen.captureGeneration();
			const result = retry ? await thread.retryItem(id) : await thread.loadItem(id);
			if (result.status !== 'success') {
				return;
			}
			await ui_vue3.nextTick();
			this.#nestedLegacyViews?.release(id);
			island.mountThreadDetails(result.content, side, id, generation);
		}
	}

	class ScreenFacade {
		#entry = null;
		attach(screen, generation) {
			const previousScreen = this.current();
			this.#entry = {
				screen,
				generation
			};
			if (previousScreen && previousScreen !== screen) {
				previousScreen.destroy();
			}
		}
		detachIfCurrent(screen) {
			if (this.#entry?.screen === screen) {
				this.#entry = null;
			}
		}
		current() {
			const entry = this.#entry;
			if (!entry || !entry.screen.isAlive() || entry.screen.getGeneration() !== entry.generation) {
				this.#entry = null;
				return null;
			}
			return entry.screen;
		}
		getView(messageId) {
			const screen = this.current();
			if (!screen || messageId !== undefined && String(screen.id) !== String(messageId)) {
				return undefined;
			}
			return screen;
		}
	}
	const messageViewFacade = new ScreenFacade();

	let lastGeneration = 0;
	function nextGeneration() {
		lastGeneration += 1;
		return lastGeneration;
	}
	function createCleanupEntry(action) {
		let cleanup = action;
		return {
			run: () => {
				if (!cleanup) {
					return;
				}
				const currentCleanup = cleanup;
				cleanup = null;
				currentCleanup();
			}
		};
	}
	class Screen {
		id;
		mailboxId;
		#application;
		#facade;
		#cleanupStack = [];
		#generation = 0;
		#alive = false;
		#started = false;
		#destroyed = false;
		#pageSwapper = null;
		#slider = null;
		constructor(options) {
			this.id = options.messageId;
			this.mailboxId = options.mailboxId;
			this.#application = options.application;
			this.#facade = options.facade ?? messageViewFacade;
		}
		get pageSwapper() {
			return this.#pageSwapper;
		}
		get slider() {
			return this.#slider;
		}
		start() {
			if (this.#started || this.#destroyed) {
				return;
			}
			this.#started = true;
			this.#generation = nextGeneration();
			this.#alive = true;
			try {
				this.#facade.attach(this, this.#generation);
				this.#application.start();
			} catch (error) {
				this.destroy();
				throw error;
			}
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#alive = false;
			this.#generation = nextGeneration();
			this.#facade.detachIfCurrent(this);
			const cleanupStack = this.#cleanupStack.splice(0).reverse();
			let cleanupError = null;
			cleanupStack.forEach(entry => {
				try {
					entry.run();
				} catch (error) {
					cleanupError ??= error;
				}
			});
			try {
				this.#application.destroy();
			} catch (error) {
				cleanupError ??= error;
			}
			this.#pageSwapper = null;
			this.#slider = null;
			if (cleanupError) {
				throw cleanupError;
			}
		}
		isAlive() {
			return this.#alive;
		}
		getGeneration() {
			return this.#generation;
		}
		captureGeneration() {
			return this.#generation;
		}
		registerCleanup(action) {
			const entry = createCleanupEntry(action);
			if (this.#destroyed) {
				entry.run();
				return () => {};
			}
			this.#cleanupStack.push(entry);
			return () => {
				const index = this.#cleanupStack.indexOf(entry);
				if (index >= 0) {
					this.#cleanupStack.splice(index, 1);
				}
				entry.run();
			};
		}
		guardCompletion = (capturedGeneration, completion) => {
			if (!this.#alive || capturedGeneration !== this.#generation || this.#facade.current() !== this) {
				return false;
			}
			completion();
			return true;
		};
		setPageSwapper(pageSwapper) {
			this.#pageSwapper = pageSwapper;
		}
		setSlider(slider) {
			this.#slider = slider;
		}
	}

	function createSenderAvatarScreenLifecycle(messageId) {
		const senderAvatarMessageId = normalizeSenderAvatarInteger(messageId) ?? 0;
		let state = null;
		const failedImageUrls = new Set();
		let disposed = false;
		return {
			bind(candidate) {
				if (disposed || candidate.currentMessage.id !== messageId || candidate.senderAvatar.messageId !== senderAvatarMessageId) {
					return false;
				}
				state = candidate;
				return true;
			},
			handleImageFailure(url) {
				if (!state || failedImageUrls.has(url)) {
					return false;
				}
				const confirmed = state.senderAvatar.confirmed;
				if (state.currentMessage.sender.avatar.image !== url && confirmed?.url !== url) {
					return false;
				}
				failedImageUrls.add(url);
				state.currentMessage.sender.avatar.image = null;
				if (confirmed?.url === url) {
					state.senderAvatar.confirmed = {
						...confirmed,
						url: null
					};
				}
				return true;
			},
			dispose() {
				if (disposed) {
					return;
				}
				disposed = true;
				const currentState = state;
				state = null;
				if (!currentState) {
					return;
				}
				const previewUrl = currentState.senderAvatar.selection?.previewUrl ?? '';
				resetSenderAvatarForMessage(currentState.senderAvatar, senderAvatarMessageId, currentState.senderAvatar.confirmed);
				if (previewUrl.startsWith('blob:')) {
					URL.revokeObjectURL(previewUrl);
				}
			}
		};
	}
	class MessageView {
		#options;
		#screen = null;
		constructor(options) {
			this.#options = options;
		}
		static getScreen(messageId) {
			return messageViewFacade.getView(messageId);
		}
		start() {
			if (this.#screen?.isAlive()) {
				return;
			}
			messageViewFacade.current()?.destroy();
			const senderAvatarLifecycle = createSenderAvatarScreenLifecycle(this.#options.bootstrap.currentMessage.id);
			const application = new MessageViewScreenApplication(this.#options, senderAvatarLifecycle);
			const screen = new Screen({
				messageId: this.#options.bootstrap.currentMessage.id,
				mailboxId: this.#options.bootstrap.currentMessage.mailboxId,
				application
			});
			application.bindScreen(screen);
			this.#screen = screen;
			screen.registerCleanup(() => {
				if (this.#screen === screen) {
					this.#screen = null;
				}
			});
			screen.start();
		}
		destroy() {
			const screen = this.#screen;
			this.#screen = null;
			screen?.destroy();
		}
	}

	exports.MessageView = MessageView;

})(this.BX.Mail.Client.MessageView = this.BX.Mail.Client.MessageView || {}, BX, BX.Vue3);
//# sourceMappingURL=message-view.bundle.js.map
