(function() {
	const DEFAULT_STORAGE_KEYS = [
		'im-ai-assistant-widget-copilotWidgetLastDialogId',
		'im-ai-marta-widget-copilotWidgetLastDialogId',
	];
	const INITIAL_PROMPT_APPLY_ATTEMPTS = 40;
	const INITIAL_PROMPT_APPLY_DELAY = 100;
	const WIDGET_READY_TIMEOUT = 20000;
	const WIDGET_READY_STABLE_DELAY = 150;
	const WIDGET_READY_SELECTORS = {
		header: '.bx-im-ai-assistant-chat-header__container',
		chatContent: '.bx-im-content-chat__container',
		messageList: '.bx-im-message-list__container',
		textarea: '.bx-im-content-chat__textarea_container, .bx-im-send-panel__container, textarea',
		dialogLoader: '.bx-im-dialog-loader__container',
	};
	const ERROR_CODE_DIALOG_UNAVAILABLE = 'dialog_unavailable';
	const ERROR_CODE_TRIGGER_UNAVAILABLE = 'trigger_unavailable';
	const ERROR_CODE_WIDGET_MOUNT_FAILED = 'widget_mount_failed';
	const ERROR_CODE_NETWORK = 'network';
	const NETWORK_ERROR_CODES = new Set([
		'network',
		'network_error',
		'transport_error',
		'ajax_error',
		'connection_error',
	]);
	const PAGE_CONTEXT_MODULE_ID = 'landing';
	const PAGE_CONTEXT_AI_SITE_KEY = 'ai_site';

	class WidgetPanel
	{
		constructor(options)
		{
			this.options = options || {};
			this.rootContainer = this.options.rootContainer || null;
			this.dialogId = typeof this.options.dialogId === 'string' ? this.options.dialogId.trim() : '';
			if (!/^chat\d+$/.test(this.dialogId))
			{
				this.dialogId = '';
			}
			this.triggerOptions = this.normalizeTriggerOptions(this.options.triggerOptions);
			this.onError = typeof this.options.onError === 'function' ? this.options.onError : null;
			this.imApplicationData = this.options.imApplicationData || {};
			this.chatMinimizedClass = this.options.chatMinimizedClass || 'landing-ai-assistant-panel--chat-minimized';
			this.logPrefix = this.options.logPrefix || 'Landing AI assistant panel';
			this.openText = this.options.openText || '';
			this.closeText = this.options.closeText || '';
			this.initialPrompt = typeof this.options.initialPrompt === 'string' ? this.options.initialPrompt.trim() : '';
			this.autoSendInitialPrompt = this.options.autoSendInitialPrompt === true;
			this.startMinimized = this.options.startMinimized === true;
			this.syncMainChatOpenState = this.options.syncMainChatOpenState === true;
			this.storageKeys = Array.isArray(this.options.storageKeys) ? this.options.storageKeys : DEFAULT_STORAGE_KEYS;
			this.bodyEnabledClass = this.options.bodyEnabledClass || 'landing-ai-assistant-panel-enabled';
			this.bodyChatOpenClass = this.options.bodyChatOpenClass || 'landing-ai-assistant-panel-chat-open';
			this.topPanelCompactClass = this.options.topPanelCompactClass || 'landing-ai-assistant-panel-top--compact';
			this.topPanelCompactButtonClass = this.options.topPanelCompactButtonClass || 'ui-btn-sm';
			this.chatLoadingClass = this.options.chatLoadingClass || 'landing-ai-assistant-panel__chat--loading';
			this.isInitialized = false;
			this.isInitialPromptApplied = false;
			this._messageFeedLiveRegionApplied = false;
			this._loadingAnnounced = false;
			this.widgetLoader = null;
			this.widgetLoaderContainer = null;
			this.aiChatPanel = null;
			this.topPanelSyncAttempts = 0;
		}

		init()
		{
			if (this.isInitialized || !this.rootContainer)
			{
				return this;
			}

			this.chatContainer = this.rootContainer.querySelector('.landing-ai-assistant-panel__chat');
			this.chatToggleButton = this.rootContainer.querySelector('.landing-ai-assistant-panel__toggle');
			this.widgetContainer = this.rootContainer.querySelector('.landing-ai-assistant-panel__widget');
			this.body = document.body;

			if (!this.chatContainer)
			{
				return this;
			}

			this.chatContainer.setAttribute('tabindex', '-1');
			this.chatContainer.setAttribute('role', 'region');
			this.chatContainer.setAttribute(
				'aria-label',
				BX.Landing.Loc.getMessage('LANDING_AI_ASSISTANT_PANEL_CHAT_LABEL'),
			);

			this.bindToggle();
			this.setMinimized(this.startMinimized, { skipSync: true });
			this.syncAiSitePageContext();

			if (this.widgetContainer)
			{
				this.showWidgetLoader();
				this.resolveDialogId()
					.then((dialogId) => {
						if (this.isTriggerMode() && dialogId === '')
						{
							return Promise.reject(this.createError(
								ERROR_CODE_DIALOG_UNAVAILABLE,
								'Dialog id is not available',
							));
						}

						this.dialogId = dialogId;
						if (!this.isTriggerMode())
						{
							this.resetDialogState();
						}

						return this.mountWidget();
					})
					.catch((error) => {
						this.handleError('failed to resolve ai-assistant dialog', error);
					})
				;
			}

			this.isInitialized = true;

			return this;
		}

		normalizeTriggerOptions(options)
		{
			if (!options || typeof options !== 'object' || options.enabled !== true)
			{
				return null;
			}

			const triggerCode = typeof options.triggerCode === 'string' ? options.triggerCode.trim() : '';
			const entityId = options.entityId !== undefined && options.entityId !== null
				? this.normalizeTriggerEntityId(options.entityId)
				: this.normalizeBindingEntityId(options.bindingId)
			;
			const context = options.context && typeof options.context === 'object' && !Array.isArray(options.context)
				? options.context
				: (
					options.triggerContext
					&& typeof options.triggerContext === 'object'
					&& !Array.isArray(options.triggerContext)
						? options.triggerContext
						: {}
				)
			;

			if (triggerCode === '' || entityId === '')
			{
				return null;
			}

			return {
				triggerCode,
				entityId,
				context,
				openChatAfterExecute: options.openChatAfterExecute === true,
			};
		}

		normalizeTriggerEntityId(entityId)
		{
			if (typeof entityId === 'number' && Number.isFinite(entityId) && entityId > 0)
			{
				return String(Math.floor(entityId));
			}

			if (typeof entityId === 'string' && entityId.trim() !== '')
			{
				return entityId.trim();
			}

			return '';
		}

		normalizeBindingEntityId(bindingId)
		{
			const normalizedBindingId = this.normalizePositiveInteger(bindingId);

			return normalizedBindingId > 0 ? String(normalizedBindingId) : '';
		}

		normalizePositiveInteger(value)
		{
			if (typeof value === 'number' && Number.isFinite(value) && value > 0)
			{
				return Math.floor(value);
			}

			if (typeof value === 'string')
			{
				const trimmedValue = value.trim();
				if (/^\d+$/.test(trimmedValue))
				{
					const integerValue = parseInt(trimmedValue, 10);

					return integerValue > 0 ? integerValue : 0;
				}
			}

			return 0;
		}

		normalizeString(value)
		{
			return typeof value === 'string' ? value.trim() : '';
		}

		getPageContext()
		{
			return BX?.UI?.PageContext?.PageContext || BX?.UI?.PageContext || null;
		}

		getTriggerContextData()
		{
			const contextData = this.triggerOptions?.context?.contextData;

			return contextData && typeof contextData === 'object' && !Array.isArray(contextData)
				? contextData
				: {}
			;
		}

		syncAiSitePageContext()
		{
			const PageContext = this.getPageContext();
			if (!PageContext?.set || !PageContext?.delete)
			{
				return;
			}

			if (!this.isTriggerMode())
			{
				PageContext.delete(PAGE_CONTEXT_MODULE_ID, PAGE_CONTEXT_AI_SITE_KEY);

				return;
			}

			const contextData = this.getTriggerContextData();
			const bindingId = this.normalizePositiveInteger(contextData.bindingId ?? this.triggerOptions.entityId);
			if (bindingId <= 0)
			{
				PageContext.delete(PAGE_CONTEXT_MODULE_ID, PAGE_CONTEXT_AI_SITE_KEY);

				return;
			}

			const aiSiteContext = {
				bindingId,
				entityId: this.triggerOptions.entityId,
				triggerCode: this.triggerOptions.triggerCode,
			};

			const module = this.normalizeString(contextData.module);
			if (module !== '')
			{
				aiSiteContext.module = module;
			}

			const surface = this.normalizeString(contextData.surface);
			if (surface !== '')
			{
				aiSiteContext.surface = surface;
			}

			if (aiSiteContext.surface === 'sites-ai')
			{
				aiSiteContext.section = '/sites/ai/';
			}

			const siteId = this.normalizePositiveInteger(contextData.siteId);
			if (siteId > 0)
			{
				aiSiteContext.siteId = siteId;
			}

			const pageId = this.normalizePositiveInteger(contextData.pageId);
			if (pageId > 0)
			{
				aiSiteContext.pageId = pageId;
			}

			if (aiSiteContext.surface === 'editor' && siteId > 0 && pageId > 0)
			{
				const siteTitle = this.normalizeString(contextData.siteTitle);
				if (siteTitle !== '')
				{
					aiSiteContext.siteTitle = siteTitle;
				}

				const pageTitle = this.normalizeString(contextData.pageTitle);
				if (pageTitle !== '')
				{
					aiSiteContext.pageTitle = pageTitle;
				}
			}

			PageContext.set(PAGE_CONTEXT_MODULE_ID, PAGE_CONTEXT_AI_SITE_KEY, aiSiteContext);
		}

		isTriggerMode()
		{
			return this.triggerOptions !== null;
		}

		resolveDialogId()
		{
			if (this.isTriggerMode())
			{
				return this.resolveTriggerDialogId();
			}

			return Promise.resolve(this.dialogId);
		}

		resolveTriggerDialogId()
		{
			return BX.Runtime.loadExtension('aiassistant.trigger')
				.then((triggerExports) => {
					const Trigger = triggerExports?.Trigger || BX.AiAssistant?.Trigger;
					if (!Trigger?.execute)
					{
						return Promise.reject(this.createError(
							ERROR_CODE_TRIGGER_UNAVAILABLE,
							'BX.AiAssistant.Trigger extension is not available',
						));
					}

					return Trigger.execute({
						triggerCode: this.triggerOptions.triggerCode,
						entityId: this.triggerOptions.entityId,
						context: this.triggerOptions.context,
						openChatAfterExecute: this.triggerOptions.openChatAfterExecute,
					});
				})
				.then((response) => {
					return this.normalizeTriggerDialogId(response);
				})
			;
		}

		normalizeTriggerDialogId(response)
		{
			const responseDialogId = this.normalizeDialogId(response?.data?.dialogId);
			if (responseDialogId !== '')
			{
				return responseDialogId;
			}

			const chatId = parseInt(response?.data?.chatId, 10) || 0;

			return chatId > 0 ? `chat${chatId}` : '';
		}

		normalizeDialogId(dialogId)
		{
			if (typeof dialogId !== 'string')
			{
				return '';
			}

			const normalizedDialogId = dialogId.trim();

			return /^chat\d+$/.test(normalizedDialogId) ? normalizedDialogId : '';
		}

		createError(code, message)
		{
			const error = new Error(message);
			error.code = code;

			return error;
		}

		getFirstAjaxError(error)
		{
			const errorLists = [
				error?.errors,
				error?.originalError?.errors,
				error?.originalError?.originalError?.errors,
				error?.data?.errors,
				error?.response?.errors,
			];
			const errorList = errorLists.find((errors) => {
				return Array.isArray(errors) && errors.length > 0;
			});

			return errorList?.[0] || null;
		}

		normalizeErrorCode(code, fallbackCode)
		{
			if (typeof code !== 'string' && typeof code !== 'number')
			{
				return fallbackCode;
			}

			const normalizedCode = String(code).trim();
			if (normalizedCode === '')
			{
				return fallbackCode;
			}

			const lowerCode = normalizedCode.toLowerCase();

			return NETWORK_ERROR_CODES.has(lowerCode) ? ERROR_CODE_NETWORK : normalizedCode;
		}

		isNetworkError(error)
		{
			if (!error || typeof error !== 'object')
			{
				return false;
			}

			const status = parseInt(error?.status ?? error?.xhr?.status ?? error?.response?.status, 10);
			if (status === 0)
			{
				return true;
			}

			const searchText = [
				error?.code,
				error?.name,
				error?.message,
				error?.statusText,
			]
				.filter((value) => typeof value === 'string' && value.trim() !== '')
				.join(' ')
				.toLowerCase()
			;

			if (
				searchText.includes('network')
				|| searchText.includes('failed to fetch')
				|| searchText.includes('load failed')
				|| searchText.includes('transport')
			)
			{
				return true;
			}

			return Boolean(error.originalError && error.originalError !== error && this.isNetworkError(error.originalError));
		}

		normalizeError(error, fallbackCode, fallbackMessage)
		{
			const firstAjaxError = this.getFirstAjaxError(error);
			const code = this.normalizeErrorCode(
				firstAjaxError?.code || error?.code || (this.isNetworkError(error) ? ERROR_CODE_NETWORK : fallbackCode),
				fallbackCode,
			);
			const message = firstAjaxError?.message || error?.message || fallbackMessage;

			return {
				code,
				message,
				originalError: error,
			};
		}

		handleError(message, error, fallbackCode = ERROR_CODE_DIALOG_UNAVAILABLE)
		{
			this.hideWidgetLoader();
			const normalizedError = this.normalizeError(error, fallbackCode, message);

			console.error(`${this.logPrefix}: ${message}`, normalizedError);

			if (this.onError)
			{
				this.onError(normalizedError);
			}
		}

		bindToggle()
		{
			if (!this.chatToggleButton)
			{
				return;
			}

			this.chatToggleButton.addEventListener('click', () => {
				this.setMinimized(!this.rootContainer.classList.contains(this.chatMinimizedClass));
			});
		}

		setMinimized(isMinimized, options)
		{
			if (
				this.isInitialized === true
				&& isMinimized === true
				&& this.chatContainer.contains(document.activeElement)
			)
			{
				if (this.chatToggleButton)
				{
					this.chatToggleButton.focus();
				}
				else if (this.rootContainer)
				{
					this.rootContainer.setAttribute('tabindex', '-1');
					this.rootContainer.focus();
				}
			}

			this.rootContainer.classList.toggle(this.chatMinimizedClass, isMinimized);
			BX.Landing.UI.A11y.setHidden(this.chatContainer, isMinimized);
			this.syncBodyState(isMinimized);
			this.syncTopPanelState(isMinimized);
			this.syncMainChatState(isMinimized, options);

			if (this.chatToggleButton)
			{
				this.chatToggleButton.textContent = isMinimized ? this.openText : this.closeText;
				this.chatToggleButton.setAttribute('aria-expanded', isMinimized ? 'false' : 'true');
			}

			if (this.isInitialized === true && isMinimized === false)
			{
				this.chatContainer.focus({ preventScroll: true });
			}
		}

		syncMainChatState(isMinimized, options)
		{
			if (
				this.syncMainChatOpenState !== true
				|| options?.skipSync === true
				|| !BX.userOptions?.save
			)
			{
				return;
			}

			BX.userOptions.save(
				'aiassistant',
				'marta_is_open',
				null,
				isMinimized ? 'N' : 'Y',
			);
		}

		syncBodyState(isMinimized)
		{
			if (!this.body)
			{
				return;
			}

			this.body.classList.add(this.bodyEnabledClass);
			this.body.classList.toggle(this.bodyChatOpenClass, isMinimized !== true);
		}

		syncTopPanelState(isMinimized)
		{
			const topPanel = document.querySelector('.landing-ui-panel-top');
			if (!topPanel)
			{
				this.scheduleTopPanelStateSync(isMinimized);
				return;
			}

			this.topPanelSyncAttempts = 0;
			topPanel.classList.toggle(this.topPanelCompactClass, isMinimized !== true);
			this.syncTopPanelButtonsState(topPanel, isMinimized);
		}

		scheduleTopPanelStateSync(isMinimized)
		{
			if (this.topPanelSyncAttempts >= 20)
			{
				return;
			}

			this.topPanelSyncAttempts += 1;
			setTimeout(() => {
				this.syncTopPanelState(isMinimized);
			}, 100);
		}

		syncTopPanelButtonsState(topPanel, isMinimized)
		{
			topPanel
				.querySelectorAll('.landing-ui-panel-top-menu-link-features')
				.forEach((button) => {
					if (topPanel.classList.contains('landing-ui-panel-top-ai'))
					{
						return;
					}

					button.classList.toggle(this.topPanelCompactButtonClass, isMinimized !== true);
				})
			;
		}

		resetDialogState()
		{
			this.storageKeys.forEach((storageKey) => {
				try
				{
					sessionStorage.removeItem(storageKey);
				}
				catch (error)
				{
					console.warn(this.logPrefix + ': failed to reset widget dialog state', storageKey, error);
				}
			});
		}

		getWidgetLoaderContainer()
		{
			if (!this.widgetLoaderContainer)
			{
				this.widgetLoaderContainer = document.createElement('div');
				this.widgetLoaderContainer.className = 'landing-ai-assistant-panel__loader';
			}

			return this.widgetLoaderContainer;
		}

		showWidgetLoader()
		{
			if (!this.chatContainer || !BX.Loader)
			{
				return;
			}

			const loaderContainer = this.getWidgetLoaderContainer();
			this.chatContainer.classList.add(this.chatLoadingClass);
			this.chatContainer.appendChild(loaderContainer);

			if (!this.widgetLoader)
			{
				this.widgetLoader = new BX.Loader({
					target: loaderContainer,
					size: 60,
				});
			}

			this.widgetLoader.show();
			this.announceLoadingStart();
		}

		isPanelVisible()
		{
			return this.rootContainer.classList.contains(this.chatMinimizedClass) !== true;
		}

		announceLoadingStart()
		{
			if (this._loadingAnnounced === true || this.isPanelVisible() !== true)
			{
				return;
			}

			this._loadingAnnounced = true;
			BX.Landing.UI.A11y.announce(
				BX.Landing.Loc.getMessage('LANDING_AI_ASSISTANT_WIDGET_LOADING'),
				'polite',
			);
		}

		announceLoadingReady()
		{
			if (this.isPanelVisible() !== true)
			{
				return;
			}

			BX.Landing.UI.A11y.announce(
				BX.Landing.Loc.getMessage('LANDING_AI_ASSISTANT_WIDGET_READY'),
				'polite',
			);
		}

		applyMessageFeedLiveRegion()
		{
			if (this._messageFeedLiveRegionApplied === true)
			{
				return;
			}

			const messageList = this.widgetContainer.querySelector(WIDGET_READY_SELECTORS.messageList);
			if (messageList === null)
			{
				return;
			}

			messageList.setAttribute('role', 'log');
			messageList.setAttribute('aria-live', 'polite');
			this._messageFeedLiveRegionApplied = true;
		}

		hideWidgetLoader()
		{
			if (this.chatContainer)
			{
				this.chatContainer.classList.remove(this.chatLoadingClass);
			}

			if (this.widgetLoader)
			{
				this.widgetLoader.hide();
			}

			if (this.widgetLoaderContainer?.parentNode)
			{
				this.widgetLoaderContainer.parentNode.removeChild(this.widgetLoaderContainer);
			}
		}

		mountWidget()
		{
			this.showWidgetLoader();

			return Promise.all([
				BX.Runtime.loadExtension('im.v2.application.core'),
				BX.Runtime.loadExtension('intranet.ai-chat-panel'),
			])
				.then(([coreExports, aiChatPanelExports]) => {
					if (Object.keys(this.imApplicationData).length > 0)
					{
						coreExports.Core.setApplicationData(this.imApplicationData);
					}

					const AiChatPanel = aiChatPanelExports?.AiChatPanel || BX.Intranet?.AiChatPanel;
					if (!AiChatPanel)
					{
						return Promise.reject(new Error('AiChatPanel extension is not available'));
					}

					const aiChatPanelOptions = {
						events: {
							onHideButtonClick: () => {
								this.setMinimized(true);
							},
							onError: (errors) => {
								console.error(errors);
							},
						},
					};
					if (this.dialogId !== '')
					{
						aiChatPanelOptions.dialogId = this.dialogId;
					}

					this.aiChatPanel = new AiChatPanel(aiChatPanelOptions);

					return this.aiChatPanel.preload();
				})
				.then(() => {
					return this.aiChatPanel.mount(this.widgetContainer);
				})
				.then(() => {
					return this.waitForWidgetReady();
				})
				.then(() => {
					this.applyMessageFeedLiveRegion();
				})
				.then(() => {
					return this.applyInitialPrompt();
				})
				.then(() => {
					this.announceLoadingReady();
					this.hideWidgetLoader();
				})
				.catch((error) => {
					this.handleError(
						'failed to mount ai-assistant widget',
						error,
						ERROR_CODE_WIDGET_MOUNT_FAILED,
					);
				});
		}

		waitForWidgetReady()
		{
			if (this.isWidgetReady())
			{
				return Promise.resolve();
			}

			return new Promise((resolve) => {
				let isResolved = false;
				let stableTimer = null;
				const finish = () => {
					if (isResolved)
					{
						return;
					}

					isResolved = true;
					clearTimeout(stableTimer);
					clearTimeout(timeoutTimer);
					observer.disconnect();
					resolve();
				};
				const scheduleFinish = () => {
					clearTimeout(stableTimer);
					stableTimer = setTimeout(() => {
						if (this.isWidgetReady())
						{
							finish();
						}
					}, WIDGET_READY_STABLE_DELAY);
				};
				const checkReady = () => {
					if (this.isWidgetReady())
					{
						scheduleFinish();
					}
				};
				const observer = new MutationObserver(checkReady);
				const timeoutTimer = setTimeout(finish, WIDGET_READY_TIMEOUT);

				observer.observe(this.widgetContainer, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ['class', 'style'],
				});

				checkReady();
			});
		}

		isWidgetReady()
		{
			if (!this.widgetContainer)
			{
				return false;
			}

			const hasHeader = Boolean(this.widgetContainer.querySelector(WIDGET_READY_SELECTORS.header));
			const hasChatContent = Boolean(this.widgetContainer.querySelector(WIDGET_READY_SELECTORS.chatContent));
			const hasMessageList = Boolean(this.widgetContainer.querySelector(WIDGET_READY_SELECTORS.messageList));
			const hasTextarea = Boolean(this.widgetContainer.querySelector(WIDGET_READY_SELECTORS.textarea));
			const hasDialogLoader = Boolean(this.widgetContainer.querySelector(WIDGET_READY_SELECTORS.dialogLoader));

			return hasHeader && hasChatContent && hasMessageList && hasTextarea && !hasDialogLoader;
		}

		applyInitialPrompt()
		{
			if (!this.initialPrompt || this.isInitialPromptApplied)
			{
				return Promise.resolve(false);
			}

			return Promise.all([
				BX.Runtime.loadExtension('im.v2.const'),
				BX.Runtime.loadExtension('im.v2.lib.feature'),
				this.autoSendInitialPrompt
					? BX.Runtime.loadExtension('im.v2.provider.service.sending')
				: Promise.resolve(),
			])
				.then(() => {
					return this.tryApplyInitialPrompt();
				})
				.catch((error) => {
					console.error(this.logPrefix + ': failed to load initial prompt dependencies', error);

					return false;
				});
		}

		tryApplyInitialPrompt(attempt = 0)
		{
			return new Promise((resolve) => {
				this.applyInitialPromptAttempt(attempt, resolve);
			});
		}

		applyInitialPromptAttempt(attempt, resolve)
		{
			const dialogId = this.getCurrentDialogId();
			const messengerConst = BX.Reflection?.getClass?.('BX.Messenger.v2.Const') || BX.Messenger?.v2?.Const;
			const eventType = messengerConst?.EventType;
			const eventEmitter = BX.Event?.EventEmitter;
			const isTextareaReady = Boolean(this.widgetContainer?.querySelector('textarea'));

			if (dialogId && eventType?.textarea?.insertText && eventEmitter && isTextareaReady)
			{
				eventEmitter.emit(eventType.textarea.insertText, {
					dialogId,
					text: this.initialPrompt,
					replace: true,
				});

				Promise.resolve(this.sendInitialPrompt(dialogId))
					.then(() => {
						this.isInitialPromptApplied = true;
						resolve(true);
					})
					.catch((error) => {
						console.error(this.logPrefix + ': failed to send initial prompt', error);
						resolve(false);
					});

				return;
			}

			if (attempt >= INITIAL_PROMPT_APPLY_ATTEMPTS)
			{
				resolve(false);

				return;
			}

			setTimeout(() => {
				this.applyInitialPromptAttempt(attempt + 1, resolve);
			}, INITIAL_PROMPT_APPLY_DELAY);
		}

		getCurrentDialogId()
		{
			if (this.isTriggerMode() && this.dialogId !== '')
			{
				return this.dialogId;
			}

			const messengerApplication = BX.Reflection?.getClass?.('BX.Messenger.v2.Application') || BX.Messenger?.v2?.Application;
			const store = messengerApplication?.Core?.getStore?.();
			const widgetDialogId = store?.state?.copilot?.widgetDialogId;
			if (typeof widgetDialogId === 'string' && widgetDialogId !== '')
			{
				return widgetDialogId;
			}

			if (this.dialogId !== '')
			{
				return this.dialogId;
			}

			return '';
		}

		sendInitialPrompt(dialogId)
		{
			if (!this.autoSendInitialPrompt)
			{
				return Promise.resolve();
			}

			const sendingService = BX.Messenger?.v2?.Service?.SendingService;
			if (!sendingService?.getInstance)
			{
				return Promise.resolve();
			}

			this.syncAiSitePageContext();

			return Promise.resolve(sendingService.getInstance().sendMessage({
				dialogId,
				text: this.initialPrompt,
			})).then(() => {
				this.clearInitialPrompt(dialogId);
			});
		}

		clearInitialPrompt(dialogId)
		{
			const messengerConst = BX.Reflection?.getClass?.('BX.Messenger.v2.Const') || BX.Messenger?.v2?.Const;
			const eventType = messengerConst?.EventType;
			const eventEmitter = BX.Event?.EventEmitter;

			if (!eventType?.textarea?.insertText || !eventEmitter)
			{
				return;
			}

			eventEmitter.emit(eventType.textarea.insertText, {
				dialogId,
				text: '',
				replace: true,
			});
		}

	}

	BX.namespace('BX.Landing.AiAssistant');
	BX.Landing.AiAssistant.WidgetPanel = WidgetPanel;
})();
