import { ajax as Ajax, Dom, Event, Loc, Runtime, Tag, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu, Popup } from 'main.popup';
import { Button } from 'ui.buttons';
import 'ui.icon.set';
import { Section, Row } from 'ui.section';
import { SettingsSection } from 'ui.form-elements.field';
import 'sidepanel';

export type VibeOptions = {
	title: string,
	pageTitle: string,
	moduleId: string,
	embedId: string,
	isMainVibe: boolean,
	icon: ?{
		set: string,
		code: string,
	},
	urlCreate: ?string,
	urlEdit: ?string,
	urlPublic: ?string,
	urlPartners: ?string,
	urlImport: ?string,
	urlExport: ?string,
	previewImg: ?string,
	isPageExists: ?boolean,
	isPublished: ?boolean,
	canEdit: ?boolean;
	limitCode: ?string;
	feedbackParams: ?{};
};

export class VibeSection extends EventEmitter
{
	static #iconDefaultSet = 'ui.icon-set.main';
	static #iconDefaultIcon = '--home';

	#title: string;
	#pageTitle: ?string;
	#moduleId: string;
	#embedId: string;

	#previewImg: ?string;
	#isMainVibe: boolean;
	#icon: ?{
		set: string,
		code: string,
	} = null;

	#isPageExists: boolean;
	#isPublished: boolean;
	#canEdit: boolean;
	#limitCode: string;

	#urlCreate: ?string;
	#urlEdit: ?string;
	#urlPublic: ?string;
	#urlPartners: ?string;
	#urlImport: ?string;
	#urlExport: ?string;

	#feedbackParams: ?{} = null;

	#buttonEdit: ?HTMLElement = null;
	#buttonPartners: ?HTMLElement = null;
	#buttonMarket: ?HTMLElement = null;
	#buttonWithdraw: ?HTMLElement = null;
	#buttonPublish: ?HTMLElement = null;
	#mainTemplate: ?HTMLElement = null;
	#secondaryTemplate: ?HTMLElement = null;

	#buttonMainSettings: ?HTMLElement = null;
	#buttonSecondarySettings: ?HTMLElement = null;

	#importPopup: ?Menu = null;
	#exportPopup: ?Menu = null;
	#popupShare: ?Popup = null;
	#popupWithdraw: ?Popup = null;

	constructor(options: VibeOptions)
	{
		super();
		this.setEventNamespace('BX.Landing.Vibe.IntranetSettings');

		this.#title = options.title || '';
		this.#pageTitle = options.pageTitle || this.#title;
		this.#moduleId = options.moduleId || null;
		this.#embedId = options.embedId || null;
		this.#isMainVibe = options.isMainVibe ?? false;
		this.#previewImg = options.previewImg || null;
		this.#icon = Type.isObject(options.icon) ? options.icon : null;

		this.#canEdit = options.canEdit ?? false;
		this.#limitCode = options.limitCode || 'limit_office_vibe';
		this.#isPageExists = options.isPageExists ?? false;
		this.#isPublished = options.isPublished ?? false;

		this.#urlCreate = options.urlCreate || null;
		this.#urlEdit = options.urlEdit || null;
		this.#urlPublic = options.urlPublic || null;
		this.#urlPartners = options.urlPartners || null;
		this.#urlImport = options.urlImport || null;
		this.#urlExport = options.urlExport || null;

		this.#feedbackParams = options.feedbackParams || null;
	}

	getType(): string
	{
		return 'welcome';
	}

	appendSections(contentNode: HTMLElement): void
	{
		const set = (this.#icon && this.#icon.set)
			? `ui.icon-set.${this.#icon.set}`
			: VibeSection.#iconDefaultSet
		;
		Runtime.loadExtension(set);
		const iconClass = (this.#icon && this.#icon.code) ?? VibeSection.#iconDefaultIcon;

		const section = new Section({
			title: this.#title,
			titleIconClasses: `ui-icon-set ${iconClass}`,
			canCollapse: !this.#isMainVibe,

			// todo: bannerCode, isEnable
		});

		const mainSection = new SettingsSection({
			parent: this,
			title: 'check',
			titleIconClasses: 'ui-icon-set --feed-bold',
			section,
		});

		const secondarySection = new SettingsSection({
			parent: this,
			section,
		});

		const content = Tag.render`
			<div>
				${this.#getMainTemplate()}		
			</div>
		`;
		mainSection.getSectionView().append(
			(new Row({
				content,
			})).render(),
		);

		if (this.#isPageExists)
		{
			const secondaryContent = Tag.render`
				<div>
					${this.#getSecondaryTemplate()}			
				</div>
			`;
			secondarySection.getSectionView().append(
				(new Row({
					content: secondaryContent,
				})).render(),
			);
		}

		this.#bindButtonEvents();
		this.#bindSliderCloseEvent();

		secondarySection.renderTo(contentNode);
		mainSection.renderTo(contentNode);
	}

	#getMainTemplate(): HTMLElement
	{
		if (!this.#mainTemplate)
		{
			this.#mainTemplate = Tag.render`
				<div class="intranet-settings__vibe-template">
					<div class="intranet-settings__vibe-icon-box">
						<div class="intranet-settings__vibe-icon"></div>
					</div>
					<div class="intranet-settings__vibe-content">
						<ul class="intranet-settings__vibe-list">
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_1')}
								</div>																																
							</li>
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_2')}
								</div>								
							</li>
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_3')}
								</div>
							</li>
						</ul>
						<div class="intranet-settings__vibe-button-box">
							${this.#getButtonCreate()}
							<div class="intranet-settings__vibe-button-box-right">
								${this.#getButtonPartners()}
								${this.#getButtonMainSettings()}
							</div>
						</div>
					</div>
				</div>
			`;
		}

		return this.#mainTemplate;
	}

	#getSecondaryTemplate(): HTMLElement
	{
		if (!this.#secondaryTemplate)
		{
			const previewImg = this.#previewImg
				? Tag.render`
					<img 
						src="${this.#previewImg}"
						class="intranet-settings__vibe-preview" 
					/>
				`
				: ''
			;
			this.#secondaryTemplate = Tag.render`
				<div class="intranet-settings__vibe-template --secondary-template">
					<div class="intranet-settings__vibe-preview-box">
						${previewImg}
					</div>
					<div class="intranet-settings__vibe-content">
						<div class="intranet-settings__vibe-title">
							${this.#pageTitle ?? ''}
						</div>
						<div class="intranet-settings__vibe-info-template">
							${this.#isPublished ? this.getInfoSuccessTemplate() : this.getInfoTemplate()}
						</div>					
						<div class="intranet-settings__vibe-button-box">
							${this.#getButtonEdit()}
							<div class="intranet-settings__vibe-button-box-right">
								${this.#isPublished ? this.#getButtonWithdraw() : this.#getButtonPublish()}
								${this.#getButtonSecondarySettings()}
							</div>
						</div>
					</div>
				</div>			
			`;
		}

		return this.#secondaryTemplate;
	}

	getInfoTemplate(): HTMLElement
	{
		this.infoTemplate = Tag.render`
			<div class="intranet-settings__vibe-info">
				<div class="intranet-settings__vibe-info-title">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_TITLE')}
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUBTITLE')}
					<div class="ui-icon-set --help intranet-settings__vibe-info-help"></div>
				</div>
			</div>
		`;

		Event.bind(this.infoTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseenter', (event) => {
			const width = this.infoTemplate.querySelector('.intranet-settings__vibe-info-help').offsetWidth;
			this.warningHintPopup = new Popup({
				angle: true,
				autoHide: true,
				content: Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_WARNING'),
				cacheable: false,
				animation: 'fading-slide',
				bindElement: event.target,
				offsetTop: 0,
				offsetLeft: parseInt(width / 2, 10),
				bindOptions: {
					position: 'top',
				},
				darkMode: true,
			});

			this.warningHintPopup.show();
		});
		Event.bind(this.infoTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseleave', () => {
			if (this.warningHintPopup)
			{
				setTimeout(() => {
					this.warningHintPopup.destroy();
					this.warningHintPopup = null;
				}, 300);
			}
		});

		return this.infoTemplate;
	}

	getInfoSuccessTemplate(): HTMLElement
	{
		this.infoSuccessTemplate = Tag.render`
			<div class="intranet-settings__vibe-info --success">
				<div class="intranet-settings__vibe-info-title">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_TITLE')}				
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_SUBTITLE')}
					<div class="ui-icon-set --help intranet-settings__vibe-info-help"></div>
				</div>
			</div>
		`;

		Event.bind(
			this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help'),
			'mouseenter',
			(event) => {
				const width = this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help').offsetWidth;
				this.successHintPopup = new Popup({
					angle: true,
					autoHide: true,
					content: Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_SUCCESS'),
					cacheable: false,
					animation: 'fading-slide',
					bindElement: event.target,
					offsetTop: 0,
					offsetLeft: parseInt(width / 2, 10),
					bindOptions: {
						position: 'top',
					},
					darkMode: true,
				});

				this.successHintPopup.show();
			},
		);
		Event.bind(this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseleave', () => {
			if (this.successHintPopup)
			{
				setTimeout(() => {
					this.successHintPopup.destroy();
					this.successHintPopup = null;
				}, 300);
			}
		});

		return this.infoSuccessTemplate;
	}

	#getButtonMainSettings(): HTMLElement
	{
		if (!this.#buttonMainSettings)
		{
			this.#buttonMainSettings = Tag.render`
				<button class="intranet-settings-btn-settings">
					<div class="ui-icon-set --more"></div>
				</button>
			`;
		}

		return this.#buttonMainSettings;
	}

	#getButtonSecondarySettings(): HTMLElement
	{
		if (!this.#buttonSecondarySettings)
		{
			this.#buttonSecondarySettings = Tag.render`
				<button class="intranet-settings-btn-settings">
					<div class="ui-icon-set --more"></div>
				</button>
			`;
		}

		return this.#buttonSecondarySettings;
	}

	#showImportPopup(): void
	{
		if (!this.#importPopup)
		{
			const htmlContent = this.#canEdit
				? Tag.render`<span>${Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP')}</span>`
				: Tag.render`
					<span class="intranet-settings-vibe-popup-item">
						${Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP')} ${this.renderLockElement()}
					</span>
				`
			;
			this.#importPopup = new Menu({
				angle: true,
				animation: 'fading-slide',
				bindElement: this.#buttonMainSettings,
				className: this.#canEdit ? '' : '--disabled',
				items: [
					{
						id: 'importPopup',
						html: htmlContent,
						onclick: this.#showImportSlider.bind(this),
					},
				],
				offsetLeft: 20,
				events: {
					onPopupClose: () => {},
					onPopupShow: () => {},
				},
			});
		}

		this.#importPopup?.show();
	}

	#showExportPopup(): void
	{
		if (!this.#exportPopup)
		{
			const htmlContent = this.#canEdit
				? Tag.render`<span>${Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')}</span>`
				: Tag.render`
					<span class="intranet-settings-vibe-popup-item --disabled">
						${Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')} ${this.renderLockElement()}
					</span>
				`
			;
			this.#exportPopup = new Menu({
				angle: true,
				animation: 'fading-slide',
				bindElement: this.#buttonSecondarySettings,
				className: this.#canEdit ? '' : '--disabled',
				items: [
					{
						id: 'exportPopup',
						html: htmlContent,
						onclick: this.#showExportSlider.bind(this),
					},
				],
				offsetLeft: 20,
				events: {
					onPopupClose: () => {},
					onPopupShow: () => {},
				},
			});
		}

		this.#exportPopup?.show();
	}

	#showImportSlider()
	{
		if (!this.#canEdit)
		{
			BX.UI.InfoHelper.show(this.#limitCode);

			return;
		}

		if (
			Type.isUndefined(BX.SidePanel)
			|| !this.#urlImport
		)
		{
			return;
		}

		const onOK = () => {
			BX.SidePanel.Instance.open(
				this.#urlImport,
				{
					width: 491,
					allowChangeHistory: false,
					cacheable: false,
					data: {
						rightBoundary: 0,
					},
				},
			);
		};

		if (!this.#isPageExists)
		{
			onOK();

			return;
		}

		BX.Runtime.loadExtension('ui.dialogs.messagebox').then(() => {
			const messageBox = new BX.UI.Dialogs.MessageBox({
				message: Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_MESSAGE'),
				title: Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_TITLE'),
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				okCaption: Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_OK_BUTTON'),
				cancelCaption: Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_CANCEL_BUTTON'),
				onOk: () => {
					onOK();

					return true;
				},
				onCancel: () => {
					return true;
				},
			});
			messageBox.show();
			if (messageBox.popupWindow && messageBox.popupWindow.popupContainer)
			{
				messageBox.popupWindow.popupContainer.classList.add('intranet-settings__vibe-popup');
			}
		});
	}

	#showExportSlider()
	{
		if (!this.#canEdit)
		{
			BX.UI.InfoHelper.show(this.#limitCode);

			return;
		}

		if (
			Type.isUndefined(BX.SidePanel)
			|| !this.#urlExport
		)
		{
			return;
		}

		BX.SidePanel.Instance.open(
			this.#urlExport,
			{
				width: 491,
				allowChangeHistory: false,
				cacheable: false,
				data: {
					rightBoundary: 0,
				},
			},
		);
	}

	#showSharePopup(): void
	{
		if (this.#popupShare)
		{
			this.#popupShare?.show();
		}
		else
		{
			this.#popupShare = new Popup({
				titleBar: Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_TITLE_MSGVER_1'),
				content: Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_CONTENT'),
				width: 350,
				closeIcon: true,
				closeByEsc: true,
				animation: 'fading-slide',
				buttons: [
					new Button({
						text: Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_BTN_CONFIRM'),
						color: Button.Color.PRIMARY,
						onclick: () => {
							const newTemplate = this.getInfoSuccessTemplate();
							const wrapper = this.#secondaryTemplate.querySelector(
								'.intranet-settings__vibe-info-template',
							);
							const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info:not(.--success)');

							Dom.replace(innerWrapper, newTemplate);

							Ajax.runAction('landing.vibe.publish', {
								data: {
									moduleId: this.#moduleId,
									embedId: this.#embedId,
								},
							})
								.then(() => {
									this.emit('publish');
									if (this.#urlPublic)
									{
										this.#isPublished = true;
									}
								});

							this.#popupShare.close();

							this.#sendAnalytic({ event: 'publish_page' });
						},
					}),
					new Button({
						text: Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
						color: Button.Color.LIGHT_BORDER,
						onclick: () => {
							this.#popupShare.close();
						},
					}),
				],
				events: {
					onClose: () => {},
				},
			});

			this.#popupShare?.show();
		}
	}

	#showWithdrawPopup(): void
	{
		if (this.#popupWithdraw)
		{
			this.#popupWithdraw?.show();
		}
		else
		{
			const title = this.#canEdit
				? Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_TITLE')
				: Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_TITLE_FREE')
			;
			const content = this.#canEdit
				? Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_CONTENT')
				: Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_CONTENT_FREE')
			;
			const okText = this.#canEdit
				? Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_BTN_CONFIRM')
				: Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_BTN_CONFIRM_FREE')
			;

			this.#popupWithdraw = new Popup({
				titleBar: title,
				content,
				width: 350,
				closeIcon: true,
				closeByEsc: true,
				animation: 'fading-slide',
				buttons: [
					new Button({
						text: okText,
						color: Button.Color.DANGER_DARK,
						onclick: () => {
							const newTemplate = this.getInfoTemplate();
							const wrapper = this.#secondaryTemplate.querySelector(
								'.intranet-settings__vibe-info-template',
							);
							const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info');

							Dom.replace(innerWrapper, newTemplate);
							Ajax.runAction('landing.vibe.withdraw', {
								data: {
									moduleId: this.#moduleId,
									embedId: this.#embedId,
								},
							})
								.then(() => {
									this.emit('withdraw');
									this.#isPublished = false;
								});

							this.#popupWithdraw.close();
							this.#sendAnalytic({ event: 'unpublish_page' });
						},
					}),
					new Button({
						text: Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
						color: Button.Color.LIGHT_BORDER,
						onclick: () => {
							this.#popupWithdraw.close();
						},
					}),
				],
				events: {
					onClose: () => {},
				},
			});

			this.#popupWithdraw?.show();
		}
	}

	#getButtonEdit(): ?HTMLElement
	{
		if (!this.#urlEdit)
		{
			return null;
		}

		if (!this.#buttonEdit)
		{
			const buttonEdit = Tag.render`
			
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT')}
				</button>
			`;
			const buttonEditLock = Tag.render`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue --disabled">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT')}
					${this.renderLockElement()}
				</button>
			`;
			this.#buttonEdit = this.#canEdit ? buttonEdit : buttonEditLock;
		}

		return this.#buttonEdit;
	}

	#getButtonPublish(): HTMLElement
	{
		if (!this.#buttonPublish)
		{
			const renderNode = Tag.render`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC')}
				</button>
			`;
			const renderNodeLock = Tag.render`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --disabled
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC')}
					${this.renderLockElement()}
				</button>
			`;
			this.#buttonPublish = this.#canEdit ? renderNode : renderNodeLock;
		}

		return this.#buttonPublish;
	}

	#getButtonWithdraw(): HTMLElement
	{
		if (!this.#buttonWithdraw)
		{
			this.#buttonWithdraw = Tag.render`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_UNPUBLIC')}
				</button>
			`;
		}

		return this.#buttonWithdraw;
	}

	#getButtonPartners(): ?HTMLElement
	{
		if (!this.#feedbackParams)
		{
			return null;
		}

		if (!this.#buttonPartners)
		{
			this.#buttonPartners = Tag.render`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-gray">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PARTNERS')}
				</button>
			`;
		}

		return this.#buttonPartners;
	}

	#getButtonCreate(): ?HTMLElement
	{
		if (!this.#urlCreate)
		{
			return null;
		}

		if (!this.#buttonMarket)
		{
			const buttonColor = this.#isPageExists ? '--light-blue' : 'ui-btn-primary';
			const renderNode = Tag.render`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${buttonColor}">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET')}
				</button>
			`;
			const renderNodeLock = Tag.render`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${buttonColor} --disabled">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET')}
					${this.renderLockElement()}
				</button>
			`;

			this.#buttonMarket = this.#canEdit ? renderNode : renderNodeLock;
		}

		return this.#buttonMarket;
	}

	#bindButtonEvents()
	{
		if (Type.isUndefined(BX.SidePanel))
		{
			return;
		}

		Event.bind(this.#getButtonMainSettings(), 'click', this.#showImportPopup.bind(this));
		Event.bind(this.#getButtonSecondarySettings(), 'click', this.#showExportPopup.bind(this));

		if (this.#getButtonCreate())
		{
			Event.bind(this.#getButtonCreate(), 'click', () => {
				if (this.#canEdit)
				{
					BX.SidePanel.Instance.open(this.#urlCreate);
				}
				else
				{
					BX.UI.InfoHelper.show(this.#limitCode);
				}

				this.#sendAnalytic({
					event: 'open_market',
					status: this.#canEdit ? 'success' : 'error_limit',
					p2: this.#getAnalyticContextParam(),
				});
			});
		}

		if (this.#getButtonEdit())
		{
			Event.bind(this.#getButtonEdit(), 'click', () => {
				if (this.#canEdit)
				{
					BX.SidePanel.Instance.open(
						this.#urlEdit,
						{
							customLeftBoundary: 66,
							events: {
								onCloseComplete: () => {
									if (this.#urlPublic)
									{
										window.top.location = this.#urlPublic;
									}
								},
							},
						},
					);
				}
				else
				{
					BX.UI.InfoHelper.show(this.#limitCode);
				}
				this.#sendAnalytic({
					event: 'open_editor',
					status: this.#canEdit ? 'success' : 'error_limit',
				});
			});
		}

		if (this.#getButtonPartners())
		{
			Event.bind(this.#getButtonPartners(), 'click', () => {
				// todo: need analitycs?

				Runtime.loadExtension('ui.feedback.form').then(() => {
					this.#feedbackParams.title = Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PARTNERS');
					BX.UI.Feedback.Form.open(this.#feedbackParams);
				});
			});
		}

		this.subscribe('publish', () => {
			Dom.replace(this.#getButtonPublish(), this.#getButtonWithdraw());
		});
		this.subscribe('withdraw', () => {
			Dom.replace(this.#getButtonWithdraw(), this.#getButtonPublish());
		});
		Event.bind(this.#getButtonPublish(), 'click', () => {
			if (!this.#canEdit)
			{
				BX.UI.InfoHelper.show(this.#limitCode);
				this.#sendAnalytic({
					event: 'publish_page',
					status: 'error_limit',
				});

				return;
			}

			this.#showSharePopup();
		});
		Event.bind(this.#getButtonWithdraw(), 'click', this.#showWithdrawPopup.bind(this));
	}

	#bindSliderCloseEvent()
	{
		const isPublishedBefore = this.#isPublished;

		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'SidePanel.Slider:onClose',
			() => {
				if (this.#isPublished !== isPublishedBefore)
				{
					const location = this.#isPublished
						? this.#urlPublic
						: '/'
					;
					window.top.location = location;
				}
			},
		);
	}

	renderLockElement(): HTMLElement
	{
		return Tag.render`<span class="intranet-settings-mp-icon ui-icon-set --lock"></span>`;
	}

	#getAnalyticContextParam(): []
	{
		return ['chapter', `${this.#moduleId}-${this.#embedId}`];
	}

	#sendAnalytic(data: Object): void
	{
		this.emit('sendAnalytic', data);
	}
}
