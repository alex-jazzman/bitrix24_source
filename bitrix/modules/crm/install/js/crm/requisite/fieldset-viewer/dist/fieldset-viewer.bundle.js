/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_core_events, main_popup, main_loader, ui_buttons, crm_field_listEditor) {
	'use strict';

	/**
	 * @namespace BX.Crm.Requisite
	 */
	class FieldsetViewer extends main_core_events.EventEmitter {
		cache = new main_core.Cache.MemoryCache();
		endpoint = 'crm.api.fieldset.load';
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Crm.Requisite.FieldsetViewer');
			this.subscribeFromOptions(options?.events || {});
			this.setOptions(options);
			main_core.Event.bind(options.bindElement, 'click', this.onBindElementClick.bind(this));
		}
		setData(data) {
			this.cache.set('data', data);
		}
		setEndpoint(endpoint) {
			this.endpoint = endpoint;
			return this;
		}
		getData() {
			return this.cache.get('data', {});
		}
		load() {
			return new Promise((resolve, reject) => {
				const {
					entityTypeId,
					entityId,
					fieldListEditorOptions,
					documentUid
				} = this.getOptions();
				const presetId = fieldListEditorOptions?.fieldsPanelOptions?.presetId ?? null;
				BX.ajax.runAction(this.endpoint, {
					json: {
						entityTypeId,
						entityId,
						presetId,
						documentUid
					}
				}).then(result => {
					resolve(result.data);
				}).catch(result => {
					reject(result.errors);
				});
			});
		}
		setOptions(options) {
			this.cache.set('options', {
				...options
			});
		}
		getOptions() {
			return this.cache.get('options');
		}
		getPopup() {
			return this.cache.remember('popup', () => {
				const options = this.getOptions();
				return new main_popup.Popup({
					bindElement: options.bindElement,
					autoHide: false,
					width: 570,
					height: 478,
					className: 'crm-requisite-fieldset-viewer',
					noAllPaddings: true,
					...(main_core.Type.isPlainObject(options?.popupOptions) ? options?.popupOptions : {}),
					events: {
						onClose: () => {
							this.emit('onClose', {
								changed: this.getIsChanged()
							});
							this.setIsChanged(false);
						}
					}
				});
			});
		}
		setIsChanged(value) {
			this.cache.set('isChanged', main_core.Text.toBoolean(value));
		}
		getIsChanged() {
			return this.cache.get('isChanged', false);
		}
		getLoader() {
			return this.cache.remember('loader', () => {
				return new main_loader.Loader();
			});
		}
		show() {
			const popup = this.getPopup();
			main_core.Dom.clean(popup.getContentContainer());
			void this.getLoader().show(popup.getContentContainer());
			this.load().then(result => {
				this.setData({
					...result
				});
				popup.setContent(this.createPopupContent(result));
			}).catch(errors => {
				this.emit('onFieldSetLoadError', {
					requestErrors: errors
				});
			});
			popup.show();
		}
		hide() {
			this.getPopup().close();
		}
		onBindElementClick(event) {
			event.preventDefault();
			this.show();
		}
		createPopupContent(data) {
			return main_core.Tag.render`
			<div class="crm-requisite-fieldset-viewer-content">
				${this.createBannerLayout(data)}
				${this.createListLayout(data)}
				${this.getFooterLayout()}
				${this.createCloseButton()}
			</div>
		`;
		}
		createBannerLayout(data) {
			const title = main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER_BANNER_TITLE').replace('{{requisite}}', ` <strong>${main_core.Text.encode(data?.title)}</strong>`);
			const description = (() => {
				let text = main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER_BANNER_DESCRIPTION');
				if (main_core.Type.isStringFilled(data?.more)) {
					text += `
					<a class="ui-link" href="${main_core.Text.encode(data?.more)}">
										${main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER_BANNER_MORE_LINK_LABEL')}
									</a>
				`;
				}
				return text;
			})();
			return main_core.Tag.render`
			<div class="crm-requisite-fieldset-viewer-banner">
				<div class="crm-requisite-fieldset-viewer-banner-text">
					<div class="crm-requisite-fieldset-viewer-banner-text-title">
						${title}
					</div>
					<div class="crm-requisite-fieldset-viewer-banner-text-description">
						${description}
					</div>
				</div>
			</div>
		`;
		}
		createListLayout(data) {
			return main_core.Tag.render`
			<div class="crm-requisite-fieldset-viewer-list">
				${this.createListContainer(data.fields)}
			</div>
		`;
		}
		createListContainer(fields) {
			return main_core.Tag.render`
			<div class="crm-requisite-fieldset-viewer-list-container">
				${fields.map(options => {
			return this.createListItem(options);
		})}
			</div>
		`;
		}
		createListItem(options) {
			const editButton = (() => {
				if (main_core.Type.isStringFilled(options?.editing?.url)) {
					// eslint-disable-next-line init-declarations
					let onEditButtonClick;
					if (options?.editing?.entityTypeId === 8) {
						const postData = {
							permissionToken: options?.editing?.permissionToken
						};
						onEditButtonClick = () => {
							BX.SidePanel.Instance.open(options?.editing?.url, {
								cacheable: false,
								requestMethod: 'post',
								requestParams: postData,
								events: {
									onClose: () => {
										this.show();
									}
								}
							});
							this.setIsChanged(true);
						};
					} else if (['COMPANY_PHONE', 'COMPANY_EMAIL'].includes(options?.name)) {
						onEditButtonClick = () => {
							// eslint-disable-next-line promise/catch-or-return
							main_core.Runtime.loadExtension('sign.v2.company-editor').then(exports$1 => {
								// eslint-disable-next-line no-shadow
								const {
									CompanyEditor,
									CompanyEditorMode,
									DocumentEntityTypeId,
									EditorTypeGuid
								} = exports$1;
								CompanyEditor.openSlider({
									mode: CompanyEditorMode.Edit,
									documentEntityId: options?.editing?.documentEntityId,
									companyId: options?.editing?.entityId,
									layoutTitle: main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER__SET_FORM_TITLE'),
									entityTypeId: options?.editing?.documentEntityTypeId,
									showOnlyCompany: true,
									guid: options?.editing?.documentEntityTypeId === DocumentEntityTypeId.B2b ? EditorTypeGuid.B2b : EditorTypeGuid.B2e,
									params: {
										enableSingleSectionCombining: 'Y'
									}
								}, {
									onCloseHandler: () => this.show()
								});
							}).catch(error => {
								console.error(error);
								console.log('you should update sign service');
								onEditButtonClick = () => {
									BX.SidePanel.Instance.open(options?.editing?.url, {
										cacheable: false,
										events: {
											onClose: () => {
												this.show();
											}
										}
									});
									this.setIsChanged(true);
								};
							});
						};
					} else {
						onEditButtonClick = () => {
							BX.SidePanel.Instance.open(options?.editing?.url, {
								cacheable: false,
								events: {
									onClose: () => {
										this.show();
									}
								}
							});
							this.setIsChanged(true);
						};
					}
					return main_core.Tag.render`
					<span 
						class="ui-btn ui-btn-link" 
						onclick="${onEditButtonClick}">
							${main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER_LIST_ITEM_VALUE_LINK_LABEL')}
					</span>
				`;
				}
				return '';
			})();
			const value = main_core.Type.isObject(options?.value) ? Object.values(options?.value)?.reduce((a, b) => {
				return `${a}, ${b}`;
			}) : options?.value;
			return main_core.Tag.render`
			<div class="crm-requisite-fieldset-viewer-list-item">
				<div class="crm-requisite-fieldset-viewer-list-item-left">
					<div class="crm-requisite-fieldset-viewer-list-item-label">${main_core.Text.encode(options?.label)}</div>
					<div class="crm-requisite-fieldset-viewer-list-item-value">${main_core.Text.encode(value)}</div>
				</div>
				<div class="crm-requisite-fieldset-viewer-list-item-right">
					${editButton}
				</div>
			</div>
		`;
		}
		createCloseButton() {
			return this.cache.remember('closeButton', () => {
				const onCloseClick = () => {
					this.hide();
				};
				return main_core.Tag.render`
				<div 
					class="crm-requisite-fieldset-viewer-close-button"
					onclick="${onCloseClick}"
				></div>
			`;
			});
		}
		getFieldListEditor() {
			return this.cache.remember('fieldListEditor', () => {
				const options = this.getOptions();
				return new crm_field_listEditor.ListEditor({
					setId: this.getData().id,
					title: main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER__SET_EDITOR_TITLE_MSGVER_1'),
					editable: {
						label: {
							label: main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER__SET_EDITOR_NAME_LABEL'),
							type: 'string'
						},
						required: {
							label: main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER__SET_EDITOR_REQUIRED_LABEL'),
							type: 'checkbox'
						}
					},
					autoSave: false,
					cacheable: false,
					events: {
						onSave: () => this.show()
					},
					fieldsPanelOptions: {
						hideVirtual: 1,
						...(main_core.Type.isPlainObject(options.fieldsPanelOptions) ? options.fieldsPanelOptions : {})
					},
					...(main_core.Type.isPlainObject(options.fieldListEditorOptions) ? options.fieldListEditorOptions : {})
				});
			});
		}
		getEditButton() {
			return this.cache.remember('editButton', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_REQUISITE_FIELDSET_VIEWER_EDIT_BUTTON_LABEL_MSGVER_1'),
					color: ui_buttons.Button.Color.LIGHT_BORDER,
					icon: ui_buttons.Button.Icon.EDIT,
					size: ui_buttons.Button.Size.SMALL,
					round: true,
					events: {
						click: this.onEditButtonClick.bind(this)
					}
				});
			});
		}
		onEditButtonClick() {
			this.getFieldListEditor().showSlider();
			this.setIsChanged(true);
		}
		getFooterLayout() {
			return this.cache.remember('footerLayout', () => {
				return main_core.Tag.render`
				<div class="crm-requisite-fieldset-viewer-footer">
					${this.getEditButton().render()}
				</div>
			`;
			});
		}
	}

	exports.FieldsetViewer = FieldsetViewer;

})(this.BX.Crm.Requisite = this.BX.Crm.Requisite || {}, BX, BX.Event, BX.Main, BX, BX.UI, BX.Crm.Field);
//# sourceMappingURL=fieldset-viewer.bundle.js.map
