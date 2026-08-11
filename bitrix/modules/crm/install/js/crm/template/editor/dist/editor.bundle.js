/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, messageservice_template_editor, main_core, main_core_events, ui_designTokens, crm_entitySelector) {
	'use strict';

	class PreviewLoader {
		#entityTypeId = null;
		#entityId = null;
		#categoryId = null;
		#previewCache = new main_core.Cache.MemoryCache();
		#unsubscribe = null;
		constructor(params) {
			this.#entityTypeId = main_core.Text.toInteger(params.entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('PreviewLoader: entityTypeId must be a valid entity type ID');
			}
			this.#entityId = main_core.Text.toInteger(params.entityId);
			if (params.entityId <= 0) {
				throw new Error('PreviewLoader: entityId must be greater than 0');
			}
			this.#categoryId = main_core.Type.isNil(params.categoryId) ? null : main_core.Text.toInteger(params.categoryId);
			if (!main_core.Type.isNil(this.#categoryId) && this.#categoryId < 0) {
				throw new Error('PreviewLoader: categoryId must be a non-negative integer');
			}
			const internalHandler = event => {
				const [eventData] = event.getCompatData();
				if (eventData.entityTypeId === this.#entityTypeId && eventData.entityId === this.#entityId) {
					this.#previewCache.clear();
				}
			};
			main_core_events.EventEmitter.subscribe('onCrmEntityUpdate', internalHandler);
			const unsubscribeExternal = BX.Crm.EntityEvent.subscribeToItem(this.#entityTypeId, this.#entityId, () => {
				this.#previewCache.clear();
			});
			this.#unsubscribe = () => {
				main_core_events.EventEmitter.unsubscribe('onCrmEntityUpdate', internalHandler);
				unsubscribeExternal();
			};
		}
		loadPreview(template) {
			return this.#previewCache.remember(template, () => {
				return new Promise(resolve => {
					main_core.ajax.runAction('crm.activity.smsplaceholder.preview', {
						data: {
							entityTypeId: this.#entityTypeId,
							entityId: this.#entityId,
							message: template,
							entityCategoryId: this.#categoryId
						}
					}).then(resolve).catch(resolve);
				});
			});
		}
		destroy() {
			this.#unsubscribe?.();
			this.#unsubscribe = null;
			this.#previewCache = null;
			main_core.Runtime.destroy(this);
		}
	}

	class EventHandler {
		#entityTypeId = null;
		#entityId = null;
		#categoryId = null;
		#isReadOnly = false;
		#placeholdersDialogDefaultOptions = null;
		#dialogsCache = new Map();
		#previewLoader = null;
		constructor(params) {
			this.#assertValidParams(params);
			this.#entityTypeId = params.entityTypeId;
			this.#entityId = params.entityId;
			this.#categoryId = main_core.Type.isNumber(params.categoryId) ? params.categoryId : null;
			this.#isReadOnly = Boolean(params.isReadOnly ?? false);
			this.#prepareDialogOptions(params);
		}
		#prepareDialogOptions(params) {
			this.#placeholdersDialogDefaultOptions = {
				multiple: false,
				showAvatars: false,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				tagSelectorOptions: {
					textBoxWidth: '100%'
				}
			};
			if (!this.#isReadOnly && this.#canUsePlaceholderProvider(params.usePlaceholderProvider)) {
				this.#placeholdersDialogDefaultOptions.entities = [{
					id: 'placeholder',
					options: {
						entityTypeId: this.#entityTypeId,
						entityId: this.#entityId,
						categoryId: this.#categoryId ?? null
					}
				}];
			}
			if (main_core.Type.isPlainObject(params.dialogOptions)) {
				this.#placeholdersDialogDefaultOptions = {
					...this.#placeholdersDialogDefaultOptions,
					...params.dialogOptions
				};
			}
		}
		destroy() {
			main_core.Runtime.destroy(this);
		}
		#assertValidParams(params) {
			if (!main_core.Type.isPlainObject(params)) {
				throw new TypeError('BX.Crm.Template.Editor: The "params" argument must be object');
			}
			const isReadOnly = Boolean(params.isReadOnly ?? false);
			if (!isReadOnly && this.#canUsePlaceholderProvider(params.usePlaceholderProvider) && !BX.CrmEntityType.isDefined(params.entityTypeId)) {
				throw new TypeError('BX.Crm.Template.Editor: The "entityTypeId" argument is not correct');
			}
		}
		#canUsePlaceholderProvider(usePlaceholderProvider) {
			if (main_core.Type.isBoolean(usePlaceholderProvider)) {
				return usePlaceholderProvider;
			}
			return true;
		}
		onShowFieldsDialog(event) {
			const {
				placeholderId,
				filledPlaceholder,
				onShow,
				onHide,
				bindElement,
				updatePlaceholder
			} = event.getData();
			const dialogOptions = main_core.Runtime.clone(this.#placeholdersDialogDefaultOptions);
			if (filledPlaceholder) {
				dialogOptions.preselectedItems = [[filledPlaceholder.FIELD_ENTITY_TYPE, filledPlaceholder.FIELD_NAME]];
			}

			// eslint-disable-next-line no-param-reassign
			dialogOptions.events = {
				onShow,
				onHide,
				'Item:onSelect': dialogEvent => {
					const item = dialogEvent.getData().item;
					const filledPlaceholderNew = {
						PLACEHOLDER_ID: placeholderId,
						FIELD_NAME: item.id,
						TITLE: item.title.text,
						PARENT_TITLE: item.supertitle.text,
						FIELD_ENTITY_TYPE: item.entityId
					};
					updatePlaceholder(filledPlaceholderNew);
				}
			};
			dialogOptions.targetNode = bindElement;
			const dialog = this.#getDialog(placeholderId, dialogOptions);
			if (main_core.Type.isStringFilled(filledPlaceholder?.FIELD_VALUE)) {
				dialog.getSelectedItems().forEach(item => {
					item.deselect();
				});
			}
			dialog.show();
		}
		#getDialog(placeholderId, dialogOptions) {
			if (this.#dialogsCache.has(placeholderId)) {
				return this.#dialogsCache.get(placeholderId);
			}
			const dialog = new crm_entitySelector.Dialog(dialogOptions);
			this.#dialogsCache.set(placeholderId, dialog);
			return dialog;
		}
		onLoadPreview(event) {
			this.#previewLoader ??= new PreviewLoader({
				entityTypeId: this.#entityTypeId,
				entityId: this.#entityId,
				categoryId: this.#categoryId
			});
			const {
				template
			} = event.getData();
			return this.#previewLoader.loadPreview(template);
		}
	}

	class Editor extends main_core_events.EventEmitter {
		#eventHandler;
		#innerEditor;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Crm.Template.Editor');
			if (!main_core.Type.isDomNode(params.target)) {
				throw new Error('BX.Crm.Template.Editor: The "target" argument must be DOM node');
			}
			this.#eventHandler = new EventHandler(params);
			const isReadOnly = Boolean(params.isReadOnly ?? false);
			const canUsePreview = Boolean(params.canUsePreview ?? false) && params.entityId > 0;
			this.#innerEditor = new messageservice_template_editor.Editor({
				id: params.id,
				target: params.target,
				isReadOnly,
				canUseFieldsDialog: params.canUseFieldsDialog,
				canUseFieldValueInput: params.canUseFieldValueInput,
				canUsePreview,
				messages: {
					selectField: main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_SELECT_FIELD')
				},
				events: {
					onUpdatePlaceholder: event => this.emit('onUpdatePlaceholder', event.getData()),
					onShowFieldsDialog: event => {
						const proxyEvent = new main_core_events.BaseEvent({
							data: {
								...event.getData(),
								updatePlaceholder: this.#innerEditor.updatePlaceholder.bind(this.#innerEditor)
							}
						});
						return this.#eventHandler.onShowFieldsDialog(proxyEvent);
					},
					onLoadPreview: event => {
						this.emit('shown');
						return this.#eventHandler.onLoadPreview(event);
					}
				}
			});
			this.subscribeFromOptions(params.events ?? {});
		}
		setPlaceholders(placeholders) {
			this.#innerEditor.setPlaceholders(placeholders);
			return this;
		}
		setFilledPlaceholders(filledPlaceholders) {
			this.#innerEditor.setFilledPlaceholders(filledPlaceholders);
			return this;
		}

		// region Public methods
		setHeader(input) {
			this.#innerEditor.setHeader(input);
		}
		setBody(input) {
			this.#innerEditor.setBody(input);
		}
		setFooter(input) {
			this.#innerEditor.setFooter(input);
		}
		getData() {
			return this.#innerEditor.getData();
		}
		getRawData() {
			return this.#innerEditor.getRawData();
		}
		destroy() {
			this.#eventHandler.destroy();
			this.#eventHandler = null;
			this.#innerEditor.destroy();
			this.#innerEditor = null;
			this.unsubscribeAll();
			main_core.Runtime.destroy(this);
		}
		// endregion
	}

	exports.getPlainText = messageservice_template_editor.getPlainText;
	exports.Editor = Editor;
	exports.EventHandler = EventHandler;

})(this.BX.Crm.Template = this.BX.Crm.Template || {}, BX.MessageService.Template.Editor, BX, BX.Event, BX, BX.Crm.EntitySelectorEx);
//# sourceMappingURL=editor.bundle.js.map
