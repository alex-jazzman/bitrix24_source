/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {};
(function (exports, messageservice_message_editor, crm_integration_analytics, main_core, main_core_events, ui_entitySelector, ui_iconSet_api_vue) {
	'use strict';

	/**
	 * @abstract
	 */
	class BaseContentProvider extends messageservice_message_editor.ContentProvider {
		getSendData() {
			return {};
		}
		resetSendData() {}
	}

	class CrmValuesContentProvider extends BaseContentProvider {
		#dialog = null;
		getMenuItems(ctx) {
			return [{
				title: main_core.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_CRM'),
				icon: ui_iconSet_api_vue.Outline.PROMPT_VAR,
				sectionCode: 'crmValues',
				onClick: () => {
					this.#showDialog(ctx);
				}
			}];
		}
		#showDialog(ctx) {
			this.#dialog ??= new ui_entitySelector.Dialog({
				targetNode: ctx.getBindElement(),
				multiple: false,
				showAvatars: false,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				entities: [{
					id: 'placeholder',
					dynamicLoad: true,
					dynamicSearch: false,
					searchable: true,
					options: this.getCustomData().placeholdersOptions
				}],
				events: {
					'Item:onSelect': event => {
						const {
							item: selectedItem
						} = event.getData();
						const displayText = selectedItem.getCustomData().get('text');
						ctx.insertPlaceholder(selectedItem.getId(), displayText);
						ctx.trackAction('crmValue');
						selectedItem.deselect();
					}
				}
			});
			this.#dialog.show();
		}
		destroy() {
			this.#dialog?.destroy();
			this.#dialog = null;
			super.destroy();
		}
	}

	class DocumentsContentProvider extends BaseContentProvider {
		#locator;
		constructor(serverData, locator) {
			super(serverData);
			this.#locator = locator;
		}
		getMenuItems(ctx) {
			return [{
				title: main_core.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_DOCUMENT'),
				icon: ui_iconSet_api_vue.Outline.FILE,
				onClick: async () => {
					ctx.setLoading(true);
					try {
						const documentService = this.#locator.getDocumentService();
						const document = await documentService.selectOrCreateDocument(ctx.getBindElement(), this.getCustomData());
						if (!main_core.Type.isNil(document)) {
							ctx.insertText(`${document.title} ${document.publicUrl}`);
							ctx.trackAction('document');
						}
					} finally {
						ctx.setLoading(false);
					}
				}
			}];
		}
	}

	class SalesCenterContentProvider extends BaseContentProvider {
		#locator;
		#source = null;
		#paymentId = null;
		#shipmentId = null;
		#compilationProductIds = [];
		constructor(serverData, locator) {
			super(serverData);
			this.#locator = locator;
		}
		getMenuItems(ctx) {
			return [{
				title: main_core.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_PAYMENT'),
				icon: ui_iconSet_api_vue.Outline.MONEY,
				isLocked: this.getCustomData().isLocked,
				onClick: async () => {
					if (this.getCustomData().isLocked) {
						this.#locator.getSalescenterService().showSalescenterDisabledSlider();
						return;
					}
					ctx.setLoading(true);
					try {
						const result = await this.#locator.getSalescenterService().openApplication(this.getCustomData());
						this.#processResult(ctx, result);
					} finally {
						ctx.setLoading(false);
					}
				}
			}];
		}
		#processResult(ctx, result) {
			if (main_core.Type.isStringFilled(result.source)) {
				this.#source = result.source;
			}
			const escape = this.#locator.getEscapeService();
			if (main_core.Type.isPlainObject(result.page)) {
				ctx.insertPlaceholderText(`${escape.decode(result.page.name)} ${result.page.url}`);
				ctx.trackAction('salescenterPage');
			} else if (main_core.Type.isPlainObject(result.payment)) {
				ctx.insertPlaceholderText(escape.decode(result.payment.name));
				if (!main_core.Type.isNil(result.payment.paymentId)) {
					this.#paymentId = result.payment.paymentId;
				}
				if (!main_core.Type.isNil(result.payment.shipmentId)) {
					this.#shipmentId = result.payment.shipmentId;
				}
				ctx.trackAction('salescenterPayment');
			} else if (main_core.Type.isPlainObject(result.compilation)) {
				ctx.insertPlaceholderText(escape.decode(result.compilation.name));
				if (main_core.Type.isArray(result.compilation.productIds)) {
					this.#compilationProductIds = result.compilation.productIds;
				}
				ctx.trackAction('salescenterCompilation');
			}
		}
		getSendData() {
			return {
				source: this.#source,
				paymentId: this.#paymentId,
				shipmentId: this.#shipmentId,
				compilationProductIds: this.#compilationProductIds
			};
		}
		resetSendData() {
			this.#source = null;
			this.#paymentId = null;
			this.#shipmentId = null;
			this.#compilationProductIds = [];
		}
	}

	class DocumentService {
		#logger;
		#menu = null;
		#menuCustomData = null;
		constructor({
			logger
		}) {
			this.#logger = logger;
		}
		async selectOrCreateDocument(bindElement, customData) {
			const menu = await this.#getMenu(customData);
			const result = await menu.show(bindElement);
			if (await this.#isDocument(result)) {
				return {
					title: result.getTitle(),
					publicUrl: await this.#getPublicUrl(result, customData)
				};
			}
			if (await this.#isTemplate(result)) {
				let document = null;
				try {
					document = await menu.createDocument(result);
				} catch (error) {
					this.#logger.error('Failed to create document from template', {
						template: result,
						error
					});
					throw error;
				}
				if (main_core.Type.isNil(document)) {
					return null;
				}
				return {
					title: document.getTitle(),
					publicUrl: await this.#getPublicUrl(document, customData)
				};
			}
			return null;
		}
		async #getMenu(customData) {
			if (this.#menu && this.#menuCustomData === customData) {
				return this.#menu;
			}
			const exports = await this.#loadExtension();
			const {
				moduleId,
				provider,
				value
			} = customData;

			/** @see BX.DocumentGenerator.Selector.Menu */
			this.#menu = new exports.Selector.Menu({
				moduleId,
				provider,
				value
			});
			this.#menuCustomData = customData;
			return this.#menu;
		}
		#getPublicUrl(document, customData) {
			return this.#getMenu(customData).then(menu => {
				return menu.getDocumentPublicUrl(document);
			}).catch(error => {
				this.#logger.error('Failed to get document public URL', {
					document,
					error
				});
				throw error;
			});
		}
		async #isDocument(object) {
			const exports = await this.#loadExtension();

			/** @see BX.DocumentGenerator.Selector.Document */
			return object instanceof exports.Selector.Document;
		}
		async #isTemplate(object) {
			const exports = await this.#loadExtension();

			/** @see BX.DocumentGenerator.Selector.Template */
			return object instanceof exports.Selector.Template;
		}
		#loadExtension() {
			return main_core.Runtime.loadExtension('documentgenerator.selector').catch(error => {
				this.#logger.error('Failed to load documentgenerator.selector', error);
				throw error;
			});
		}
	}

	const OPEN_ENTITY = '&#123;';
	const CLOSE_ENTITY = '&#125;';
	const BRACE_OR_TOKEN_RE = /{[^{}]*}|[{}]/g;
	class EscapeService {
		/**
		 * HTML-escapes literal braces so they can't be mistaken for placeholders on the backend.
		 *
		 * `knownCodes` are placeholder codes that reached the body through the field selector
		 * (template `FILLED_PLACEHOLDERS`); the matching `{code}` tokens are legitimate placeholders
		 * and must survive untouched. Everything else — hand-typed braces — gets escaped. This keeps
		 * the "known placeholder" decision entirely on the front end, without loading any list from the backend.
		 */
		encode(body, knownCodes = []) {
			if (!main_core.Type.isString(body)) {
				return '';
			}
			const preserved = this.#buildPreservedTokens(knownCodes);
			if (preserved.size === 0) {
				return this.#escapeBraces(body);
			}
			return body.replaceAll(BRACE_OR_TOKEN_RE, match => {
				return preserved.has(match) ? match : this.#escapeBraces(match);
			});
		}
		decode(body) {
			if (!main_core.Type.isString(body)) {
				return '';
			}
			return body.replaceAll(OPEN_ENTITY, '{').replaceAll(CLOSE_ENTITY, '}');
		}
		#escapeBraces(input) {
			return input.replaceAll('{', OPEN_ENTITY).replaceAll('}', CLOSE_ENTITY);
		}
		#buildPreservedTokens(knownCodes) {
			const tokens = new Set();
			if (!main_core.Type.isArrayFilled(knownCodes)) {
				return tokens;
			}
			knownCodes.forEach(code => {
				if (main_core.Type.isStringFilled(code)) {
					tokens.add(`{${code}}`);
				}
			});
			return tokens;
		}
	}

	class Logger {
		#prefix;
		constructor(params = {}) {
			this.#prefix = params.prefix || '';
		}
		error(...args) {
			this.#prepareArgs(args);
			console.error(...args);
		}
		warn(...args) {
			this.#prepareArgs(args);

			// eslint-disable-next-line no-console
			console.warn(...args);
		}
		#prepareArgs(args) {
			const [message] = args;
			if (main_core.Type.isString(message)) {
				// eslint-disable-next-line no-param-reassign
				args[0] = `${this.#prefix}${message}`;
			} else {
				args.unshift(this.#prefix);
			}
		}
	}
	const logger = new Logger({
		prefix: 'crm.messagesender.editor: '
	});

	class PlaceholderService {
		/**
		 * Codes of placeholders that reached the body through the field selector — a filled placeholder
		 * carrying a FIELD_NAME. Only these `{code}` tokens are legitimate placeholders that must survive
		 * brace escaping; hand-typed braces and manual FIELD_VALUE fills are escaped. Derived purely from
		 * front-end editor state, so no placeholder list is loaded from the backend.
		 */
		getKnownCodes(state) {
			const filledPlaceholders = state?.template?.FILLED_PLACEHOLDERS;
			if (!main_core.Type.isArrayFilled(filledPlaceholders)) {
				return [];
			}
			return filledPlaceholders.map(filledPlaceholder => filledPlaceholder.FIELD_NAME).filter(fieldName => main_core.Type.isStringFilled(fieldName));
		}
	}

	class SalescenterService {
		#logger;
		constructor({
			logger
		}) {
			this.#logger = logger;
		}
		showSalescenterDisabledSlider() {
			main_core.Runtime.loadExtension('salescenter.tool-availability-manager').then(({
				ToolAvailabilityManager
			}) => {
				/** @see BX.Salescenter.ToolAvailabilityManager.openSalescenterToolDisabledSlider */
				ToolAvailabilityManager.openSalescenterToolDisabledSlider();
			}).catch(error => {
				this.#logger.error('Failed to load salescenter.tool-availability-manager', error);
			});
		}
		openApplication(customData) {
			return main_core.Runtime.loadExtension('salescenter.manager').then(({
				Manager
			}) => {
				const {
					ownerTypeId,
					ownerId,
					mode,
					st,
					canSendMessage
				} = customData;

				/** @see BX.Salescenter.Manager.openApplication */
				return Manager.openApplication({
					disableSendButton: canSendMessage ? '' : 'y',
					context: 'sms',
					ownerTypeId,
					ownerId,
					mode,
					st
				});
			}).then(result => {
				if (result.get('action') === 'sendPage' && main_core.Type.isStringFilled(result.get('page')?.url)) {
					return {
						page: {
							name: String(result.get('page').name),
							url: String(result.get('page').url)
						}
					};
				}
				if (result.get('action') === 'sendPayment' && main_core.Type.isObject(result.get('order'))) {
					const order = result.get('order');
					return {
						source: 'order',
						payment: {
							name: String(order.title),
							paymentId: main_core.Type.isNil(order.paymentId) ? null : main_core.Text.toInteger(order.paymentId),
							shipmentId: main_core.Type.isNil(order.shipmentId) ? null : main_core.Text.toInteger(order.shipmentId)
						}
					};
				}
				if (result.get('action') === 'sendCompilation' && main_core.Type.isObject(result.get('compilation'))) {
					const compilation = result.get('compilation');
					let productIds = null;
					if (main_core.Type.isArray(compilation.productIds)) {
						productIds = compilation.productIds.map(id => main_core.Text.toInteger(id));
					}
					return {
						source: 'deal',
						compilation: {
							name: String(compilation.title),
							productIds
						}
					};
				}
				this.#logger.warn('Unknown salescenter action', result.get('action'));
				return {};
			}).catch(error => {
				this.#logger.error('Failed to open salescenter application', error);
				throw error;
			});
		}
	}

	class SendService {
		#entityTypeId;
		#entityId;
		#providerFactory;
		constructor({
			entityTypeId,
			entityId,
			providerFactory
		}) {
			this.#entityTypeId = entityTypeId;
			this.#entityId = entityId;
			this.#providerFactory = providerFactory;
		}
		sendMessage(state) {
			const params = this.#prepareParams(state);
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.activity.sms.send', {
					data: {
						ownerTypeId: this.#entityTypeId,
						ownerId: this.#entityId,
						params
					}
				}).then(result => {
					this.#resetProviderData();
					resolve(result);
				}).catch(reject);
			});
		}
		#prepareParams(state) {
			const {
				channel
			} = state;
			if (channel.backend.senderCode === 'bitrix24') {
				return this.#prepareNotificationParams(state);
			}
			if (channel.isTemplatesBased) {
				return this.#prepareTemplateParams(state);
			}
			return this.#prepareCustomTextParams(state);
		}
		#prepareNotificationParams(state) {
			return {
				...this.#prepareCommonParams(state),
				signedTemplate: state.notificationTemplate.signed
			};
		}
		#prepareTemplateParams(state) {
			const {
				template
			} = state;
			return {
				...this.#prepareCommonParams(state),
				body: state.message.body,
				template: template.ID,
				templateOriginalId: template.ORIGINAL_ID,
				isTemplateWithPlaceholders: main_core.Type.isPlainObject(template.PLACEHOLDERS),
				isReplacePlaceholders: true
			};
		}
		#prepareCustomTextParams(state) {
			return {
				...this.#prepareCommonParams(state),
				body: messageservice_message_editor.replaceCustomMessagePlaceholders(state.message.body, value => `{${value}}`),
				...this.#collectProviderData(),
				isReplacePlaceholders: true
			};
		}
		#collectProviderData() {
			let data = {};
			for (const provider of this.#providerFactory.getProviders()) {
				if (provider instanceof BaseContentProvider) {
					data = {
						...data,
						...provider.getSendData()
					};
				}
			}
			return data;
		}
		#resetProviderData() {
			for (const provider of this.#providerFactory.getProviders()) {
				if (provider instanceof BaseContentProvider) {
					provider.resetSendData();
				}
			}
		}
		#prepareCommonParams(state) {
			const {
				channel,
				from,
				to
			} = state;
			const addressSource = to.customData?.addressSource ?? {};
			return {
				senderId: channel.backend.id,
				from: from.id,
				to: to.value,
				entityTypeId: addressSource.entityTypeId,
				entityId: addressSource.entityId
			};
		}
	}

	/**
	 * One instance of this class per editor instance.
	 */
	class ServiceLocator {
		#context;
		#providerFactory;
		#services = new main_core.Cache.MemoryCache();
		constructor({
			context,
			providerFactory
		} = {}) {
			this.#context = context;
			this.#providerFactory = providerFactory ?? null;
		}
		setProviderFactory(providerFactory) {
			this.#providerFactory = providerFactory;
		}
		getSendService() {
			return this.#services.remember('sendService', () => {
				const customData = this.#context.customData ?? {};
				return new SendService({
					entityTypeId: customData.entityTypeId,
					entityId: customData.entityId,
					providerFactory: this.#providerFactory
				});
			});
		}
		getLogger() {
			return logger;
		}
		getDocumentService() {
			return this.#services.remember('documentService', () => {
				return new DocumentService({
					logger: this.getLogger()
				});
			});
		}
		getSalescenterService() {
			return this.#services.remember('salescenterService', () => {
				return new SalescenterService({
					logger: this.getLogger()
				});
			});
		}
		getEscapeService() {
			return this.#services.remember('escapeService', () => new EscapeService());
		}
		getPlaceholderService() {
			return this.#services.remember('placeholderService', () => new PlaceholderService());
		}
	}

	const SIMPLY_PROXIED_EVENTS = ['onSendSuccess', 'onCancel', 'onChannelChange', 'onFromChange', 'onToChange', 'onTemplateChange', 'onStateChange'];
	/**
	 * @memberOf BX.Crm.MessageSender
	 *
	 * @emits BX.Crm.MessageSender.Editor:onBeforeReload
	 * @emits BX.Crm.MessageSender.Editor:onSendSuccess
	 * @emits BX.Crm.MessageSender.Editor:onCancel
	 * @emits BX.Crm.MessageSender.Editor:onChannelChange
	 * @emits BX.Crm.MessageSender.Editor:onFromChange
	 * @emits BX.Crm.MessageSender.Editor:onToChange
	 * @emits BX.Crm.MessageSender.Editor:onMessageBodyChange
	 * @emits BX.Crm.MessageSender.Editor:onTemplateChange
	 * @emits BX.Crm.MessageSender.Editor:onStateChange
	 */
	class Editor extends main_core_events.EventEmitter {
		#options;
		#locator;
		#templateEventHandler;
		#innerEditor;
		#templatesCache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.setEventNamespace('BX.Crm.MessageSender.Editor');
			this.#options = options;
			this.#normalizeOptions(this.#options);
			this.#locator = new ServiceLocator({
				context: this.#options.context
			});
		}
		getOptions() {
			return this.#options;
		}

		/**
		 * Export current editor state.
		 */
		getState() {
			const state = this.#innerEditor?.getState();
			if (!state) {
				return null;
			}
			return {
				...state,
				message: {
					...state.message,
					body: this.#locator.getEscapeService().encode(state.message.body, this.#locator.getPlaceholderService().getKnownCodes(state))
				}
			};
		}

		/**
		 * WARNING! Don't modify the element, don't style.
		 * You can only use it for popup binding.
		 *
		 * Returns null if not rendered.
		 */
		getContainer() {
			return this.#innerEditor?.getContainer() ?? null;
		}

		/**
		 * WARNING! Don't modify the element, don't style.
		 * You can only use it for popup binding.
		 *
		 * Returns null if not rendered.
		 */
		getContentContainer() {
			return this.#innerEditor?.getContentContainer() ?? null;
		}
		setChannel(id) {
			this.#innerEditor?.setChannel(id);
			return this;
		}
		setFrom(id) {
			this.#innerEditor?.setFrom(id);
			return this;
		}
		setTo(toId) {
			this.#innerEditor?.setTo(String(toId));
			return this;
		}
		setMessageText(text) {
			this.#innerEditor?.setMessageText(this.#locator.getEscapeService().decode(text));
			return this;
		}
		setTemplate(templateOriginalId) {
			this.#innerEditor?.setTemplate(templateOriginalId);
			return this;
		}
		setFilledPlaceholder(filledPlaceholder) {
			this.#innerEditor?.setFilledPlaceholder(filledPlaceholder);
			return this;
		}
		setError(error) {
			this.#innerEditor?.setError(error);
			return this;
		}
		resetAlert() {
			this.#innerEditor?.resetAlert();
			return this;
		}
		async render() {
			const options = {
				...this.#mapOptions(),
				events: this.#getEvents()
			};
			this.#innerEditor = new messageservice_message_editor.Editor(options);
			const factory = this.#innerEditor.getProviderFactory();
			this.#registerResolvers(factory);
			this.#locator.setProviderFactory(factory);
			return this.#innerEditor.render();
		}
		#mapOptions() {
			const messageOption = this.#options.message ?? {};
			return {
				...this.#options,
				toList: this.#options.toList ?? [],
				analytics: {
					...this.#options.analytics,
					tool: 'crm',
					p1: crm_integration_analytics.getCrmMode()
				},
				messages: {
					template: {
						selectField: main_core.Loc.getMessage('CRM_MESSAGESENDER_TEMPLATE_EDITOR_SELECT_FIELD')
					}
				},
				message: {
					...messageOption,
					text: this.#locator.getEscapeService().decode(messageOption.text ?? '')
				}
			};
		}
		#getEvents() {
			const events = {
				onBeforeRender: async () => {
					await this.#load();
					this.#innerEditor.setOptions(this.#mapOptions());
				},
				onLoadPreview: async event => {
					const handler = await this.#getTemplateEventHandler();
					const {
						template,
						...restData
					} = event.getData();
					const convertedTemplate = messageservice_message_editor.replaceCustomMessagePlaceholders(this.#locator.getEscapeService().encode(template ?? '', this.#locator.getPlaceholderService().getKnownCodes(this.#innerEditor.getState())), value => `{${value}}`);
					const proxyEvent = new main_core_events.BaseEvent({
						data: {
							...restData,
							template: convertedTemplate
						}
					});
					return handler.onLoadPreview(proxyEvent);
				},
				'Template:onShowFieldsDialog': async event => {
					const handler = await this.#getTemplateEventHandler();
					return handler.onShowFieldsDialog(event);
				},
				'Template:onUpdatePlaceholder': event => {
					const {
						filledPlaceholder
					} = event.getData();
					const {
						template
					} = this.#innerEditor.getState();
					if (!template) {
						return;
					}
					if (main_core.Type.isNil(this.#options.context.customData.entityTypeId)) {
						return;
					}
					void main_core.ajax.runAction('crm.activity.smsplaceholder.createOrUpdatePlaceholder', {
						data: {
							placeholderId: filledPlaceholder.PLACEHOLDER_ID,
							fieldName: main_core.Type.isStringFilled(filledPlaceholder.FIELD_NAME) ? filledPlaceholder.FIELD_NAME : null,
							entityType: main_core.Type.isStringFilled(filledPlaceholder.FIELD_ENTITY_TYPE) ? filledPlaceholder.FIELD_ENTITY_TYPE : null,
							fieldValue: main_core.Type.isStringFilled(filledPlaceholder.FIELD_VALUE) ? filledPlaceholder.FIELD_VALUE : null,
							templateId: template.ORIGINAL_ID,
							entityTypeId: this.#options.context.customData.entityTypeId,
							entityCategoryId: this.#options.context.customData.categoryId
						}
					});
				},
				onLoadTemplates: event => {
					event.preventDefault();
					return this.#templatesCache.remember(this.#getTemplateCacheId(), () => {
						return new Promise((resolve, reject) => {
							main_core.ajax.runAction('crm.activity.sms.getTemplates', {
								data: {
									senderId: this.#innerEditor.getState().channel.backend.id,
									context: {
										entityTypeId: this.#options.context.customData.entityTypeId,
										entityId: this.#options.context.customData.entityId,
										entityCategoryId: this.#options.context.customData.categoryId
									}
								}
							}).then(resolve).catch(reject);
						});
					});
				},
				onSend: () => {
					return this.#locator.getSendService().sendMessage(this.getState());
				},
				onMessageBodyChange: event => {
					const {
						body,
						oldBody
					} = event.getData();
					const escape = this.#locator.getEscapeService();
					const knownCodes = this.#locator.getPlaceholderService().getKnownCodes(this.#innerEditor.getState());
					this.emit('onMessageBodyChange', {
						body: escape.encode(body ?? '', knownCodes),
						oldBody: escape.encode(oldBody ?? '', knownCodes)
					});
				},
				onBeforeAddChannelOpen: event => {
					event.preventDefault();
					void main_core.Runtime.loadExtension('crm.router').then(({
						Router
					}) => {
						return Router.Instance.openMessageSenderConnectionsSlider({
							c_section: this.#options.analytics?.c_section,
							c_sub_section: this.#options.analytics?.c_sub_section
						});
					}).then(() => {
						void this.reload();
					});
				}
			};
			for (const eventName of SIMPLY_PROXIED_EVENTS) {
				events[eventName] = event => {
					this.emit(eventName, event.getData());
				};
			}
			return events;
		}
		#getTemplateEventHandler() {
			if (this.#templateEventHandler) {
				return Promise.resolve(this.#templateEventHandler);
			}
			return main_core.Runtime.loadExtension('crm.template.editor').then(exports => {
				this.#templateEventHandler = new exports.EventHandler({
					...this.#options.context.customData
				});
				return this.#templateEventHandler;
			});
		}
		#load() {
			if (!this.#options.dynamicLoad) {
				return Promise.resolve();
			}
			return this.#actualizeOptions().then(() => {
				this.#options.dynamicLoad = false;
			});
		}
		#actualizeOptions() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.messagesender.editor.load', {
					json: {
						sceneId: this.#options.scene.id,
						customData: {
							entityTypeId: this.#options.context.customData.entityTypeId,
							entityId: this.#options.context.customData.entityId,
							categoryId: this.#options.context.customData.categoryId
						}
					}
				}).then(response => {
					const newOptions = response.data.editor;
					this.#normalizeOptions(newOptions);
					this.#mutateOptions(this.#options, newOptions);
					resolve();
				}).catch(reject);
			});
		}
		#mutateOptions(options, mutations) {
			const overrideKeys = new Set(['channels', 'toList', 'promoBanners', 'contentProviders', 'preferences']);
			for (const [key, value] of Object.entries(mutations)) {
				if (overrideKeys.has(key)) {
					// eslint-disable-next-line no-param-reassign
					options[key] = value;
				}
			}
		}
		#normalizeOptions(options) {
			// eslint-disable-next-line no-param-reassign
			options.channels ??= [];
			// eslint-disable-next-line no-param-reassign
			options.toList ??= [];

			// eslint-disable-next-line no-param-reassign
			options.context ??= {};
			// eslint-disable-next-line no-param-reassign
			options.context.customData ??= {};
		}

		/**
		 * Actualize editor options from the server.
		 * Editor state is not lost.
		 */
		reload() {
			const event = new main_core_events.BaseEvent();
			this.emit('onBeforeReload', event);
			if (event.isDefaultPrevented()) {
				return Promise.resolve();
			}
			this.#innerEditor?.setLoading(true);
			this.#templatesCache = new main_core.Cache.MemoryCache();
			return this.#actualizeOptions().then(() => {
				this.#innerEditor?.setOptions(this.#mapOptions());
			}).finally(() => {
				this.#innerEditor?.setLoading(false);
			});
		}
		#getTemplateCacheId() {
			const chan = this.getState()?.channel;
			if (main_core.Type.isNil(chan)) {
				return '';
			}
			const parts = [chan.backend.senderCode, chan.backend.id, this.#options.context.customData.entityTypeId, this.#options.context.customData.entityId, this.#options.context.customData.categoryId];
			return parts.filter(part => !main_core.Type.isNil(part)).join('_');
		}
		destroy() {
			this.#innerEditor?.destroy();
			this.#innerEditor = null;
			this.#templateEventHandler?.destroy();
			this.#templateEventHandler = null;
			this.unsubscribeAll();
			main_core.Runtime.destroy(this);
		}
		#registerResolvers(factory) {
			factory.registerResolver('crmValues', data => {
				return new CrmValuesContentProvider(data);
			});
			factory.registerResolver('salescenter', data => {
				return new SalesCenterContentProvider(data, this.#locator);
			});
			factory.registerResolver('documents', data => {
				return new DocumentsContentProvider(data, this.#locator);
			});
		}
	}

	exports.replaceCustomMessagePlaceholders = messageservice_message_editor.replaceCustomMessagePlaceholders;
	exports.Editor = Editor;

})(this.BX.Crm.MessageSender.Editor = this.BX.Crm.MessageSender.Editor || {}, BX.MessageService.Message.Editor, BX.Crm.Integration.Analytics, BX, BX.Event, BX.UI.EntitySelector, BX.UI.IconSet);
//# sourceMappingURL=editor.bundle.js.map
