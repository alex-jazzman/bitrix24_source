/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_core_events, ui_notification, ui_vue3, crm_integration_ui_bannerDispatcher, crm_tourManager, ui_tour, ui_analytics, ui_sidepanel, ui_buttons, crm_clientSelector, crm_integration_analytics, crm_messagesender, main_loader, main_popup, ui_entitySelector, ui_iconSet_actions, ui_iconSet_main, ui_iconSet_social, ui_iconSet_api_core, calendar_sharing_interface, calendar_sharing_analytics, crm_activity_todoEditorV2, ui_designTokens, crm_zoom) {
	'use strict';

	class Context {
		#entityTypeId = null;
		#entityId = null;
		#entityCategoryId = null;
		#isReadonly = false;
		#menuBarContainer = null;
		#extras = {};
		constructor(params) {
			this.#entityTypeId = params.entityTypeId;
			this.#entityId = params.entityId;
			this.#entityCategoryId = main_core.Type.isNumber(params.entityCategoryId) ? params.entityCategoryId : null;
			this.#isReadonly = params.isReadonly;
			this.#menuBarContainer = params.menuBarContainer;
			this.#extras = params.extras ?? {};
		}
		getEntityTypeId() {
			return this.#entityTypeId;
		}
		getEntityId() {
			return this.#entityId;
		}
		getEntityCategoryId() {
			return this.#entityCategoryId;
		}
		isReadonly() {
			return this.#isReadonly;
		}
		getMenuBarContainer() {
			return this.#menuBarContainer;
		}
		getExtras() {
			return this.#extras;
		}
	}

	class Item {
		static ON_FINISH_EDIT_EVENT = 'onFinishEdit';
		#context = null;
		#settings = {};
		#eventEmitter = null;
		#isVisible = false;
		#container = null;
		initialize(context, settings) {
			this.#context = context;
			this.#settings = settings;
			this.#eventEmitter = new main_core_events.EventEmitter();
			this.#eventEmitter.setEventNamespace('BX.Crm.Timeline.MenuBar');
			this.initializeSettings();
			if (!this.#context.isReadonly() && this.supportsLayout()) {
				this.#container = this.createLayout();
				main_core.Dom.prepend(this.#container, this.getMenuBarContainer());
				this.initializeLayout();
			}
			this.showTour();
		}
		getEntityTypeId() {
			return this.#context.getEntityTypeId();
		}
		getEntityId() {
			return this.#context.getEntityId();
		}
		getEntityCategoryId() {
			return this.#context.getEntityCategoryId();
		}
		getMenuBarContainer() {
			return this.#context.getMenuBarContainer();
		}
		getExtras() {
			return this.#context.getExtras();
		}
		getContainer() {
			return this.#container;
		}
		setContainer(container) {
			if (main_core.Type.isDomNode(container) && !this.#context.isReadonly() && this.supportsLayout()) {
				if (this.#container) {
					main_core.Dom.remove(this.#container);
				}
				this.#container = container;
				main_core.Dom.prepend(this.#container, this.getMenuBarContainer());
				this.initializeLayout();
			}
		}
		supportsLayout() {
			return true;
		}
		activate() {
			if (this.supportsLayout()) {
				this.setVisible(true);
			} else {
				this.showSlider();
			}
		}
		deactivate() {
			this.setVisible(false);
		}
		showSlider() {
			throw new Error('Method showSlider() must be overridden');
		}
		getSetting(setting, defaultValue = null) {
			return this.#settings?.[setting] ?? defaultValue;
		}
		setSettings(settings) {
			this.#settings = settings;
		}
		getSettings() {
			return this.#settings;
		}
		setVisible(visible) {
			visible = !!visible;
			if (this.#isVisible === visible) {
				return;
			}
			this.#isVisible = visible;
			const container = this.getContainer();
			if (!container) {
				return;
			}
			if (visible) {
				main_core.Dom.removeClass(container, '--hidden');
				this.onShow();
			} else {
				this.onHide();
				main_core.Dom.addClass(container, '--hidden');
			}
		}
		isVisible() {
			return this.#isVisible;
		}
		setFocused(isFocused) {
			const container = this.getContainer();
			if (!container) {
				return;
			}
			if (isFocused) {
				main_core.Dom.addClass(container, '--focus');
			} else {
				main_core.Dom.removeClass(container, '--focus');
			}
		}
		setLocked(isLocked) {
			const container = this.getContainer();
			if (!container) {
				return;
			}
			if (isLocked) {
				main_core.Dom.addClass(container, '--locked');
			} else {
				main_core.Dom.removeClass(container, '--locked');
			}
		}
		isLocked() {
			const container = this.getContainer();
			if (!container) {
				return false;
			}
			return main_core.Dom.hasClass(container, '--locked');
		}
		addFinishEditListener(callback) {
			this.#eventEmitter.subscribe(Item.ON_FINISH_EDIT_EVENT, callback);
		}
		emitFinishEditEvent() {
			this.#eventEmitter.emit(Item.ON_FINISH_EDIT_EVENT);
		}
		createLayout() {
			throw new Error('Method createLayout() must be overridden');
		}
		initializeSettings() {}
		initializeLayout() {}
		onShow() {}
		onHide() {}
		showTour() {}
		showNotify(content) {
			ui_notification.UI.Notification.Center.notify({
				content
			});
		}
	}

	const SPOTLIGHT_ID_PREFIX$1 = 'spotlight-crm-timeline-menubar';
	const SPOTLIGHT_TARGET_VERTEX = 'middle-center';
	const SPOTLIGHT_Z_INDEX = 200;
	const GUIDE_LINK_CLASS_NAME = 'crm-entity-stream-content-new-detail-guide-link';
	const GUIDE_POPUP_WIDTH = 400;
	const GUIDE_POPUP_POSITION = 'bottom';
	class BaseTour {
		#params = {};
		#spotlight = null;
		#guide = null;
		#guideBindElement = null;
		#targetElementRect = null;
		#observerTimeoutId = null;
		constructor(params) {
			if (!this.#assertValidParams(params)) {
				throw new TypeError('Invalid menu bar tour params');
			}
			this.#params = params;
			this.onWindowResize = main_core.Runtime.debounce(this.onWindowResize.bind(this), 100);
			main_core.Event.bind(window, 'resize', this.onWindowResize);
		}
		onWindowResize() {
			const target = this.#getGuideBindElement(true);
			this.#guide.getCurrentStep().setTarget(target);
			this.#guide.showNextStep();
			this.#spotlight.setTargetElement(target);
		}
		canShow() {
			return true;
		}
		show() {
			this.#spotlight = this.#getSpotlight();
			this.#spotlight.show();
			this.getGuide().showNextStep();
		}
		getGuide() {
			if (!this.#guide) {
				const guideCfg = {
					onEvents: true,
					steps: [{
						target: this.#getGuideBindElement(),
						title: this.#params.title,
						text: this.#params.text,
						position: GUIDE_POPUP_POSITION,
						rounded: true,
						events: {
							onClose: () => {
								this.saveUserOption(this.#params.userOptionName);
								this.#spotlight.close();
								if (this.#observerTimeoutId) {
									clearInterval(this.#observerTimeoutId);
									this.#observerTimeoutId = null;
								}
								main_core.Event.unbind(window, 'resize', this.onWindowResize);
							}
						}
					}]
				};
				if (this.#params.articleCode > 0) {
					guideCfg.steps[0].article = this.#params.articleCode;
					guideCfg.steps[0].linkTitle = this.#params.linkTitle ?? main_core.Loc.getMessage('CRM_TIMELINE_DETAILS');
				}
				const guide = new ui_tour.Guide(guideCfg);
				const guidePopup = guide.getPopup();
				guidePopup.setWidth(this.#params.guidePopupWidth ?? GUIDE_POPUP_WIDTH);
				const link = guidePopup.contentContainer.querySelector('.ui-tour-popup-link');
				main_core.Dom.addClass(link, GUIDE_LINK_CLASS_NAME);
				this.#targetElementRect = main_core.Dom.getPosition(this.#getGuideBindElement());
				this.#observerTimeoutId = setInterval(this.#handleTargetElementResize.bind(this), 1000);
				this.#guide = guide;
			}
			return this.#guide;
		}
		saveUserOption(optionName = null) {
			// eslint-disable-next-line no-console
			console.warn('Method save is not implemented');
		}
		#getSpotlight() {
			const spotlight = new BX.SpotLight({
				id: `${SPOTLIGHT_ID_PREFIX$1}-${this.#params.itemCode}-guide`,
				targetElement: this.#getGuideBindElement(),
				targetVertex: SPOTLIGHT_TARGET_VERTEX,
				zIndex: SPOTLIGHT_Z_INDEX,
				autoSave: 'no'
			});
			spotlight.bindEvents({
				onTargetEnter: () => {
					if (this.#params.stayShowedSpotlight !== true) {
						spotlight.close();
					}
				}
			});
			return spotlight;
		}
		#getGuideBindElement(force = false) {
			if (main_core.Type.isDomNode(this.#params.guideBindElement)) {
				this.#guideBindElement = this.#params.guideBindElement;
				return this.#guideBindElement;
			}
			if (!this.#guideBindElement || force) {
				this.#guideBindElement = document.querySelector(`[data-id="${this.#params.itemCode}"]`);
				const isVisible = Boolean(this.#guideBindElement.offsetWidth || this.#guideBindElement.offsetHeight || this.#guideBindElement.getClientRects().length > 0);
				if (!isVisible) {
					this.#guideBindElement = this.#guideBindElement.parentElement.nextElementSibling;
				}
			}
			return this.#guideBindElement;
		}
		#handleTargetElementResize() {
			const currentRect = main_core.Dom.getPosition(this.#getGuideBindElement());
			if (currentRect.left !== this.#targetElementRect.left || currentRect.right !== this.#targetElementRect.right || currentRect.top !== this.#targetElementRect.top || currentRect.bottom !== this.#targetElementRect.bottom) {
				this.#targetElementRect = main_core.Dom.getPosition(this.#guideBindElement);
				const targetElement = this.#guideBindElement;
				const isVisible = Boolean(targetElement.offsetWidth || targetElement.offsetHeight || targetElement.getClientRects().length > 0);
				const guidePopup = this.#guide.getPopup();
				if (isVisible) {
					main_core.Dom.removeClass(guidePopup.popupContainer, '--hidden');
					guidePopup.adjustPosition();
				} else {
					main_core.Dom.addClass(guidePopup.popupContainer, '--hidden');
				}
			}
		}
		#assertValidParams(params) {
			if (!main_core.Type.isPlainObject(params)) {
				console.error('"params" must be specified');
				return false;
			}
			if (!main_core.Type.isStringFilled(params.title)) {
				console.error('"title" must be specified');
				return false;
			}
			if (!main_core.Type.isStringFilled(params.text)) {
				console.error('"text" must be specified');
				return false;
			}
			return true;
		}
		getParams() {
			return this.#params;
		}
	}

	const UserOptions$1 = main_core.Reflection.namespace('BX.userOptions');
	class Options {
		static BOOKING_ADS_OPTION = 'booking_ads';
		static START_BANNER = 'start_banner';
		static BEFORE_FIRST_RESOURCE_AHA_OPTION_NAME = 'before_first_resource';
		static AFTER_FIRST_RESOURCE_AHA_OPTION_NAME = 'after_first_resource';
		saveUserOption(optionName) {
			this.#checkOption(optionName);
			UserOptions$1.save('crm', Options.BOOKING_ADS_OPTION, optionName, 1);
		}
		#checkOption(optionName) {
			if (![Options.START_BANNER, Options.BEFORE_FIRST_RESOURCE_AHA_OPTION_NAME, Options.AFTER_FIRST_RESOURCE_AHA_OPTION_NAME].includes(optionName)) {
				throw new Error(`User option with name: ${optionName} unsupported`);
			}
		}
	}

	let Tour$2 = class Tour extends BaseTour {
		/**
		 * @override
		 * */
		saveUserOption(optionName = null) {
			new Options().saveUserOption(optionName);
		}
	};

	function Resolvable() {
		let resolve;
		const promise = new Promise(res => {
			resolve = res;
		});
		promise.resolve = resolve;
		return promise;
	}

	class BannerAnalytics {
		static ANALYTICS_TOOL_BOOKING = 'booking';
		static ANALYTICS_CATEGORY_BOOKING = 'booking';
		static ANALYTICS_SECTION_CRM = 'crm';
		static sendShowPopup() {
			const options = {
				tool: BannerAnalytics.ANALYTICS_TOOL_BOOKING,
				category: BannerAnalytics.ANALYTICS_CATEGORY_BOOKING,
				event: 'show_popup',
				c_section: BannerAnalytics.ANALYTICS_SECTION_CRM
			};
			ui_analytics.sendData(options);
		}
		static sendClickEnable() {
			const options = {
				tool: BannerAnalytics.ANALYTICS_TOOL_BOOKING,
				category: BannerAnalytics.ANALYTICS_CATEGORY_BOOKING,
				event: 'click_enable',
				c_section: BannerAnalytics.ANALYTICS_SECTION_CRM
			};
			ui_analytics.sendData(options);
		}
	}

	class Booking extends Item {
		#bannerDispatcher;
		constructor() {
			super();
			this.#bannerDispatcher = new crm_integration_ui_bannerDispatcher.BannerDispatcher();
		}
		showSlider() {
			if (!this.#isFeatureEnabled()) {
				this.#showFeaturePromoter();
				return;
			}
			const entities = this.getSettings()?.entities;
			const embedEntities = JSON.stringify(entities);
			const url = `/booking/?embed=${embedEntities}`;
			if (BX.SidePanel) {
				BX.SidePanel.Instance.open(url, {
					customLeftBoundary: 0
				});
			} else {
				window.open(url);
			}
		}
		supportsLayout() {
			return false;
		}
		showTour() {
			this.#showBanner();
			this.#showAha();
		}
		#showBanner() {
			if (!this.#shouldShowBanner()) {
				return;
			}
			this.#bannerDispatcher.toQueue(async onDone => {
				const bannerClosed = this.#renderBannerComponent();
				this.#setBannerShown();
				await bannerClosed;
				onDone();
			}, crm_integration_ui_bannerDispatcher.Priority.CRITICAL);
		}
		async #renderBannerComponent() {
			const bannerClosed = new Resolvable();
			const app = await this.#createBannerComponent(bannerClosed.resolve);
			const content = main_core.Dom.create('div');
			main_core.Dom.append(content, document.body);
			app.mount(content);
			return bannerClosed;
		}
		async #createBannerComponent(onBannerClose) {
			const {
				PromoBanner
			} = await main_core.Runtime.loadExtension('booking.component.promo-banner');
			const app = ui_vue3.BitrixVue.createApp({
				components: {
					PromoBanner
				},
				data() {
					return {
						isBannerShown: true
					};
				},
				methods: {
					onClose() {
						this.isBannerShown = false;
						onBannerClose();
					},
					buttonClick() {
						BannerAnalytics.sendClickEnable();
					}
				},
				template: '<PromoBanner v-if="isBannerShown" type="crm" @buttonClick="buttonClick" @close="onClose" />'
			});
			app.mixin({
				methods: {
					loc(name, replacements) {
						return main_core.Loc.getMessage(name, replacements);
					}
				}
			});
			return app;
		}
		#shouldShowBanner() {
			return this.getSettings()?.shouldShowBanner || false;
		}
		#setBannerShown() {
			new Options().saveUserOption(Options.START_BANNER);
			BannerAnalytics.sendShowPopup();
		}
		#showAha() {
			if (!this.#shouldShowAha()) {
				return;
			}
			const ahaParams = this.#getAhaParams();
			if (!ahaParams) {
				return;
			}
			const guideBindElement = document.querySelector('.main-buttons-inner-container .main-buttons-item[data-id="booking"]');
			if (!guideBindElement) {
				return;
			}
			const tour = new Tour$2({
				...ahaParams,
				guideBindElement
			});
			tour.getGuide().getPopup().setAutoHide(true);
			crm_tourManager.TourManager.getInstance().registerWithLaunch(tour);
		}
		#shouldShowAha() {
			return Boolean(this.getSettings()?.ahaMoments.length);
		}
		#getAhaParams() {
			switch (this.getSettings()?.ahaMoments[0]) {
				case Options.BEFORE_FIRST_RESOURCE_AHA_OPTION_NAME:
					return this.#getBeforeFirstResourceAhaParams();
				case Options.AFTER_FIRST_RESOURCE_AHA_OPTION_NAME:
					return this.#getAfterFirstResourceAhaParams();
				default:
					return null;
			}
		}
		#getBeforeFirstResourceAhaParams() {
			return {
				itemCode: 'booking_before_first_resource',
				title: main_core.Loc.getMessage('CRM_TIMELINE_BOOKING_AHA_BEFORE_RESOURCE_TITLE'),
				text: main_core.Loc.getMessage('CRM_TIMELINE_BOOKING_AHA_BEFORE_RESOURCE_TEXT'),
				userOptionName: Options.BEFORE_FIRST_RESOURCE_AHA_OPTION_NAME,
				articleCode: 23712054
			};
		}
		#getAfterFirstResourceAhaParams() {
			return {
				itemCode: 'booking_after_first_resource',
				title: main_core.Loc.getMessage('CRM_TIMELINE_BOOKING_AHA_AFTER_RESOURCE_TITLE'),
				text: main_core.Loc.getMessage('CRM_TIMELINE_BOOKING_AHA_AFTER_RESOURCE_TEXT'),
				userOptionName: Options.AFTER_FIRST_RESOURCE_AHA_OPTION_NAME
			};
		}
		#getFeature() {
			return this.getSetting('feature') || null;
		}
		#isFeatureEnabled() {
			return Boolean(this.#getFeature()?.isEnabled);
		}
		#showFeaturePromoter() {
			const featureId = this.#getFeature()?.id;
			if (featureId) {
				main_core.Runtime.loadExtension('ui.info-helper').then(({
					FeaturePromotersRegistry
				}) => {
					FeaturePromotersRegistry.getPromoter({
						featureId
					}).show();
				}).catch(error => {
					console.error(error);
				});
			}
		}
	}

	class Call extends Item {
		showSlider() {
			const planner = new BX.Crm.Activity.Planner();
			planner.showEdit({
				'TYPE_ID': BX.CrmActivityType.call,
				'OWNER_TYPE_ID': this.getEntityTypeId(),
				'OWNER_ID': this.getEntityId()
			});
		}
		supportsLayout() {
			return false;
		}
	}

	/** @memberof BX.Crm.Timeline.MenuBar */

	class WithEditor extends Item {
		initializeLayout() {
			this._ownerTypeId = this.getEntityTypeId();
			this._ownerId = this.getEntityId();
			this._ownerCategoryId = this.getEntityCategoryId();
			this._ghostInput = null;
			this._saveButtonHandler = BX.delegate(this.onSaveButtonClick, this);
			this._cancelButtonHandler = BX.delegate(this.onCancelButtonClick, this);
			this._focusHandler = BX.delegate(this.onFocus, this);
			this._blurHandler = BX.delegate(this.onBlur, this);
			this._keyupHandler = BX.delegate(this.resizeForm, this);
			this._delayedKeyupHandler = BX.delegate(function () {
				setTimeout(this.resizeForm.bind(this), 0);
			}, this);
			this._hideButtonsOnBlur = true;
			this.bindInputHandlers();
			this.doInitialize();
		}
		doInitialize() {}
		bindInputHandlers() {
			BX.bind(this._input, "focus", this._focusHandler);
			BX.bind(this._input, "blur", this._blurHandler);
			BX.bind(this._input, "keyup", this._keyupHandler);
			BX.bind(this._input, "cut", this._delayedKeyupHandler);
			BX.bind(this._input, "paste", this._delayedKeyupHandler);
		}
		onFocus(e) {
			this.setFocused(true);
		}
		onBlur(e) {
			if (!this._hideButtonsOnBlur) {
				return;
			}
			if (this._input.value === "") {
				window.setTimeout(BX.delegate(function () {
					this.setFocused(false);
					this._input.style.minHeight = "";
				}, this), 200);
			}
		}
		onSaveButtonClick(e) {
			this.setLocked(true);
			const saveResult = this.save();
			if (saveResult instanceof BX.Promise || saveResult instanceof Promise) {
				saveResult.then(() => this.setLocked(false), () => this.setLocked(false)).catch(() => this.setLocked(false));
			} else {
				this.setLocked(false);
			}
		}
		onCancelButtonClick() {
			this.cancel();
			this.emitFinishEditEvent();
		}
		save() {}
		cancel() {}
		release() {
			if (this._ghostInput) {
				this._ghostInput = BX.remove(this._ghostInput);
			}
		}
		ensureGhostCreated() {
			if (this._ghostInput) {
				return this._ghostInput;
			}
			this._ghostInput = BX.create('div', {
				props: {
					className: 'crm-entity-stream-content-new-comment-textarea-shadow'
				},
				text: this._input.value
			});
			this._ghostInput.style.width = this._input.offsetWidth + 'px';
			document.body.appendChild(this._ghostInput);
			return this._ghostInput;
		}
		resizeForm() {
			const ghost = this.ensureGhostCreated();
			const computedStyle = getComputedStyle(this._input);
			const diff = parseInt(computedStyle.paddingBottom) + parseInt(computedStyle.paddingTop) + parseInt(computedStyle.borderTopWidth) + parseInt(computedStyle.borderBottomWidth) || 0;
			ghost.innerHTML = BX.util.htmlspecialchars(this._input.value.replace(/[\r\n]{1}/g, '<br>'));
			this._input.style.minHeight = ghost.scrollHeight + diff + 'px';
		}
	}

	/** @memberof BX.Crm.Timeline.MenuBar */
	class Comment extends WithEditor {
		createLayout() {
			this._saveButton = main_core.Tag.render`<button onclick="${this.onSaveButtonClick.bind(this)}" class="ui-btn ui-btn-xs ui-btn-primary ui-btn-round" >${main_core.Loc.getMessage('CRM_TIMELINE_SEND')}</button>`;
			this._cancelButton = main_core.Tag.render`<span onclick="${this.onCancelButtonClick.bind(this)}"  class="ui-btn ui-btn-xs ui-btn-link">${main_core.Loc.getMessage('CRM_TIMELINE_CANCEL_BTN')}</span>`;
			this._input = main_core.Tag.render`<textarea  rows="1" class="crm-entity-stream-content-new-comment-textarea" placeholder="${main_core.Loc.getMessage('CRM_TIMELINE_COMMENT_PLACEHOLDER')}"></textarea>`;
			return main_core.Tag.render`<div class="crm-entity-stream-content-new-detail --hidden">
					${this._input}
					<div class="crm-entity-stream-content-new-comment-btn-container">
						${this._saveButton}
						${this._cancelButton}
					</div>
				</div>`;
		}
		doInitialize() {
			this._postForm = null;
			this._editor = null;
			this._isRequestRunning = false;
			this._isLocked = false;
			BX.unbind(this._input, "blur", this._blurHandler);
			BX.unbind(this._input, "keyup", this._keyupHandler);
		}
		loadEditor() {
			this._editorName = 'CrmTimeLineComment0';
			if (this._postForm) return;
			BX.ajax.runAction("crm.api.timeline.loadEditor", {
				data: {
					name: this._editorName
				}
			}).then(this.onLoadEditorSuccess.bind(this));
		}
		onLoadEditorSuccess(result) {
			const html = BX.prop.getString(BX.prop.getObject(result, "data", {}), "html", '');
			BX.html(this._editorContainer, html).then(BX.delegate(this.showEditor, this)).then(BX.delegate(this.addEvents, this));
		}
		addEvents() {
			BX.addCustomEvent(this._editorContainer.firstElementChild, 'onFileIsAppended', BX.delegate(function (id, item) {
				BX.addClass(this._saveButton, 'ui-btn-disabled');
				BX.addClass(this._saveButton, 'ui-btn-clock');
				this._saveButton.removeEventListener("click", this._saveButtonHandler);
			}, this));
			BX.addCustomEvent(this._editorContainer.firstElementChild, 'onFileIsAdded', BX.delegate(function (file, controller, obj, blob) {
				BX.removeClass(this._saveButton, 'ui-btn-clock');
				BX.removeClass(this._saveButton, 'ui-btn-disabled');
				this._saveButton.addEventListener("click", this._saveButtonHandler);
			}, this));
		}
		showEditor() {
			if (LHEPostForm) {
				window.setTimeout(BX.delegate(function () {
					this._postForm = LHEPostForm.getHandler(this._editorName);
					this._editor = BXHtmlEditor.Get(this._editorName);
					BX.onCustomEvent(this._postForm.eventNode, 'OnShowLHE', [true]);
				}, this), 100);
			}
		}
		onFocus(e) {
			this._input.style.display = 'none';
			if (this._editor && this._postForm) {
				this._postForm.eventNode.style.display = 'block';
				this._editor.Focus();
			} else {
				if (!BX.type.isDomNode(this._editorContainer)) {
					this._editorContainer = BX.create("div", {
						attrs: {
							className: "crm-entity-stream-section-comment-editor"
						}
					});
					this._editorContainer.appendChild(BX.create("DIV", {
						attrs: {
							className: "crm-timeline-wait"
						}
					}));
					this.getContainer().appendChild(this._editorContainer);
				}
				window.setTimeout(BX.delegate(function () {
					this.loadEditor();
				}, this), 100);
			}
			this.setFocused(true);
		}
		save() {
			let text = '';
			const attachmentList = [];
			const attachmentAllowEditOptions = {};
			if (this._postForm) {
				text = this._postForm.oEditor.GetContent();
				this._postForm.eventNode.querySelectorAll('input[name="UF_CRM_COMMENT_FILES[]"]').forEach(input => attachmentList.push(input.value));
				if (main_core.Type.isArrayFilled(attachmentList)) {
					attachmentList.forEach(id => {
						const selectorName = `input[name="CRM_TIMELINE_DISK_ATTACHED_OBJECT_ALLOW_EDIT[${id}]"`;
						const selector = this._postForm.eventNode.querySelector(selectorName);
						if (selector) {
							attachmentAllowEditOptions[id] = selector.value;
						}
					});
				}
			} else {
				text = this._input.value;
			}
			if (text === '') {
				if (!this.emptyCommentMessage) {
					this.emptyCommentMessage = new BX.PopupWindow('timeline_empty_new_comment_' + this.getEntityId(), this._saveButton, {
						content: BX.message('CRM_TIMELINE_EMPTY_COMMENT_MESSAGE'),
						darkMode: true,
						autoHide: true,
						zIndex: 990,
						angle: {
							position: 'top',
							offset: 77
						},
						closeByEsc: true,
						bindOptions: {
							forceBindPosition: true
						}
					});
				}
				this.emptyCommentMessage.show();
				return;
			}
			if (this._isRequestRunning || this._isLocked) {
				return;
			}
			this._isRequestRunning = this._isLocked = true;
			const addedData = {
				fields: {
					ENTITY_ID: this.getEntityId(),
					ENTITY_TYPE_ID: this.getEntityTypeId(),
					COMMENT: text,
					ATTACHMENTS: attachmentList
				}
			};
			if (Object.keys(attachmentAllowEditOptions).length > 0) {
				addedData.CRM_TIMELINE_DISK_ATTACHED_OBJECT_ALLOW_EDIT = attachmentAllowEditOptions;
			}
			return main_core.ajax.runAction('crm.timeline.comment.add', {
				data: addedData
			}).then(result => {
				this.onSaveSuccess();
				return result;
			}).catch(result => {
				this.onSaveFailure();
				return result;
			});
		}
		cancel() {
			this._input.value = '';
			this._input.style.minHeight = '';
			if (BX.type.isDomNode(this._editorContainer)) this._postForm.eventNode.style.display = 'none';
			this._input.style.display = 'block';
			this.setFocused(false);
			this.release();
		}
		onSaveSuccess(data) {
			this._isRequestRunning = false;
			this._isLocked = false;
			this.release();
			if (this._postForm) {
				this._postForm.reinit('', {});
			}
			this.emitFinishEditEvent();
			this.cancel();
		}
		onSaveFailure() {
			this._isRequestRunning = this._isLocked = false;
		}
	}

	class Delivery extends Item {
		showSlider() {
			BX.CrmActivityEditor.getDefault().addDelivery({
				'ownerType': BX.CrmEntityType.resolveName(this.getEntityTypeId()),
				'ownerID': this.getEntityId(),
				"orderList": BX.CrmTimelineManager.getDefault().getOwnerInfo()['ORDER_LIST']
			});
		}
		supportsLayout() {
			return false;
		}
	}

	class EInvoiceApp extends Item {
		#einvoiceUrl;
		showSlider() {
			ui_sidepanel.SidePanel.Instance.open(this.#einvoiceUrl, {
				width: 575,
				allowChangeHistory: false
			});
		}
		supportsLayout() {
			return false;
		}
		initializeSettings() {
			this.#einvoiceUrl = this.getSetting('einvoiceUrl');
		}
	}

	class Email extends Item {
		showSlider() {
			const ownerInfo = BX.CrmTimelineManager.getDefault().getOwnerInfo();
			BX.CrmActivityEditor.getDefault().addEmail({
				'ownerType': BX.CrmEntityType.resolveName(this.getEntityTypeId()),
				'ownerID': this.getEntityId(),
				'ownerUrl': ownerInfo['SHOW_URL'],
				'ownerTitle': ownerInfo['TITLE'],
				'subject': ''
			});
		}
		supportsLayout() {
			return false;
		}
	}

	const ServicesConfig = new Map([['whatsapp', {
		id: 'whatsapp',
		connectorId: 'notifications',
		connectLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_WHATSAPP'),
		inviteLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_WHATSAPP'),
		soonLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SOON_WHATSAPP'),
		title: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_WHATSAPP'),
		region: '!ru',
		iconClass: ui_iconSet_api_core.Outline.WHATSAPP,
		checkServiceId: 'virtual_whatsapp'
	}], ['telegrambot', {
		id: 'telegrambot',
		connectorId: 'telegrambot',
		connectLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_TELEGRAM'),
		inviteLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_TELEGRAM'),
		title: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_TELEGRAM'),
		iconClass: ui_iconSet_api_core.Outline.TELEGRAM
	}], ['max', {
		id: 'max',
		connectorId: 'max',
		connectLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_MAX'),
		inviteLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_MAX'),
		title: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_MAX'),
		region: ['ru', 'by', 'az', 'am', 'kz', 'kg', 'md', 'tj', 'uz'],
		iconClass: ui_iconSet_api_core.Outline.MAX
	}], ['ru-whatsapp', {
		id: 'ru-whatsapp',
		connectorId: 'notifications',
		connectLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_WHATSAPP'),
		disabledLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_WHATSAPP'),
		inviteLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_WHATSAPP'),
		soonLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SOON_WHATSAPP'),
		disabledHint: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_WHATSAPP_DISABLED_HINT'),
		title: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_WHATSAPP'),
		region: 'ru',
		iconClass: ui_iconSet_api_core.Outline.WHATSAPP,
		checkServiceId: 'virtual_whatsapp',
		hideOnBox: true
	}],
	// [
	// 	'vkgroup',
	// 	{
	// 		id: 'vkgroup',
	// 		connectorId: '',
	// 		connectLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_VK'),
	// 		inviteLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_VK'),
	// 		soonLabel: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SOON_VK'),
	// 		title: Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_VK'),
	// 		region: 'ru',
	// 		iconClass: Social.VK,
	// 	},
	// ],
	['facebook', {
		id: 'facebook',
		connectorId: '',
		connectLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_FACEBOOK'),
		inviteLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_INVITE_FACEBOOK'),
		soonLabel: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SOON_FACEBOOK'),
		title: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SERVICE_FACEBOOK'),
		region: '!ru',
		iconClass: ui_iconSet_api_core.Social.FACEBOOK
	}]]);

	const MENU_ITEM_STUB_ID = 'stub';
	const ACTIVE_MENU_ITEM_CLASS = 'menu-popup-item-accept';
	const DEFAULT_MENU_ITEM_CLASS = 'menu-popup-item-none';
	const TOOLBAR_CONTAINER_CLASS = 'crm-entity-stream-content-gotochat-toolbar-container';
	const BUTTONS_CONTAINER_CLASS = 'crm-entity-stream-content-gotochat-buttons-container';
	const CLIENTS_SELECTOR_TITLE_CLASS = 'crm-entity-stream-content-gotochat-clients-selector-title';
	const HELP_ARTICLE_CODE = '18114500';

	/** @memberof BX.Crm.Timeline.MenuBar */
	class GoToChat extends Item {
		#context = null;
		selectedClient = null;
		settingsMenu = null;
		channels = [];
		communications = [];
		currentChannelId = null;
		fromPhoneId = null;
		toName = null;
		toPhoneId = null;
		openLineItems = null;
		hasClients = false;
		isFetchedConfig = false;
		isSending = false;
		#chatServiceButtons = new Map();
		#region = null;
		#isBox = null;
		#entityEditor = null;
		marketplaceUrl = '';
		#userSelectorDialog = null;
		#clientSelector = null;
		#services = {};
		initialize(context, settings) {
			super.initialize(context, settings);
			this.#context = context;
			this.onSelectClient = this.onSelectClient.bind(this);
			this.onSelectClientPhone = this.onSelectClientPhone.bind(this);
			this.onSelectSender = this.onSelectSender.bind(this);
			this.onSelectSenderPhone = this.onSelectSenderPhone.bind(this);
		}
		initializeLayout() {
			super.initializeLayout();
			this.#subscribeToReceiversChanges();
		}
		#subscribeToReceiversChanges() {
			main_core_events.EventEmitter.subscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', event => {
				const {
					item
				} = event.getData();
				if (this.getEntityTypeId() !== item?.entityTypeId || this.getEntityId() !== item?.entityId) {
					return;
				}
				this.#hideContent();
				this.#removeCurrentClient();
				this.#fetchConfig(true);
			});
		}
		initializeSettings() {
			this.#region = this.getSetting('region');
			this.#isBox = this.getSetting('isBox');
		}
		activate() {
			super.activate();
			this.#fetchConfig();
		}
		#fetchConfig(force = false) {
			if (this.isFetchedConfig && !force) {
				return;
			}
			this.isFetchedConfig = false;
			if (!this.#context.getEntityId()) {
				return;
			}
			const ajaxParameters = {
				entityTypeId: this.#context.getEntityTypeId(),
				entityId: this.#context.getEntityId()
			};
			main_core.ajax.runAction('crm.activity.gotochat.getConfig', {
				data: ajaxParameters
			}).then(({
				data
			}) => {
				this.isFetchedConfig = true;
				this.#prepareParams(data);
				this.#hideLoader();
				this.adjustLayout();
			}).catch(() => this.#showNotify(main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONFIG_ERROR')));
		}
		#prepareParams(data) {
			const {
				currentChannelId,
				channels,
				communications,
				openLineItems,
				marketplaceUrl,
				services,
				hasClients
			} = data;
			this.currentChannelId = currentChannelId;
			this.channels = channels;
			this.communications = communications;
			this.hasClients = hasClients;
			this.openLineItems = openLineItems;
			this.marketplaceUrl = marketplaceUrl;
			this.#services = services;
			this.#setCommunicationsParams();
			this.#setChannelDefaultPhoneId();
		}
		#setCommunicationsParams() {
			if (this.communications.length === 0) {
				this.toPhoneId = null;
				this.selectedClient = null;
				this.toName = null;
				return;
			}
			const communication = this.communications[0];
			if (Array.isArray(communication.phones) && communication.phones.length > 0) {
				this.toPhoneId = communication.phones[0].id;
			}
			this.selectedClient = {
				entityId: communication.entityId,
				entityTypeId: communication.entityTypeId
			};
			this.toName = communication.caption;
		}
		#setChannelDefaultPhoneId() {
			const channel = this.#getCurrentChannel();
			if (!channel || !Array.isArray(channel.fromList) || channel.fromList.length === 0) {
				return;
			}
			const {
				fromList
			} = channel;
			const defaultPhone = fromList.find(item => item.default);
			this.fromPhoneId = defaultPhone ? defaultPhone.id : fromList[0].id;
		}
		#getCurrentChannel() {
			const channel = this.channels.find(item => item.id === this.currentChannelId);
			return channel ?? null;
		}
		createLayout() {
			return main_core.Tag.render`<div class="crm-entity-stream-content-new-detail crm-entity-stream-content-new-detail-gotochat --hidden --skeleton">
			<div class="crm-entity-stream-content-new-detail-gotochat-container hidden">
				<div class="crm-entity-stream-content-gotochat-settings-container">
					<div class="crm-entity-stream-content-gotochat-clients-selector-container">
						<div class="${CLIENTS_SELECTOR_TITLE_CLASS}">
							${this.#getClientTitleHtmlElement()}
						</div>
						<div class="crm-entity-stream-content-gotochat-clients-selector-description">
							${main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CLIENT_SELECTOR_DESCRIPTION_MSGVER_2')}
						</div>
					</div>
					<div class="${TOOLBAR_CONTAINER_CLASS}">
						<button 
							class="ui-btn ui-btn-link ui-btn-xs ui-btn-icon-help"
							onclick="${this.#showHelp}"
						></button>
						<button
							class="ui-btn ui-btn-link ui-btn-xs ui-btn-icon-setting"
							onclick="${this.#showSettingsMenu.bind(this)}"
						></button>
					</div>
				</div>
				${this.#getServiceButtons()}
			</div>
		</div>`;
		}
		#getClientTitleHtmlElement() {
			const clientStart = '<span id="crm-gotochat-client-selector" class="crm-entity-stream-content-gotochat-user-selector-link">';
			const clientFinish = '</span>';
			const titleContainer = main_core.Tag.render`
			<span>
				${main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CLIENT_SELECTOR_TITLE', {
			'[client]': clientStart,
			'[/client]': clientFinish
		})}
			</span>
		`;
			main_core.Event.bind(titleContainer.childNodes[0], 'click', this.onToggleClientSelector.bind(this));
			return titleContainer;
		}
		onToggleClientSelector() {
			const id = 'client-selector-dialog';
			const {
				entityTypeId
			} = this.#getOwnerEntity();
			const context = `CRM_TIMELINE_GOTOCHAT-${entityTypeId}`;
			if (!this.#userSelectorDialog) {
				this.#userSelectorDialog = new ui_entitySelector.Dialog({
					id,
					context,
					targetNode: this.#getUserSelectorDialogTargetNode(),
					multiple: false,
					dropdownMode: false,
					showAvatars: true,
					enableSearch: true,
					width: 450,
					zIndex: 2500,
					entities: this.#getClientSelectorEntities(),
					events: {
						'Item:onSelect': this.onSelectClient
					}
				});
			}
			if (this.#userSelectorDialog.isOpen()) {
				this.#userSelectorDialog.hide();
			} else {
				this.#userSelectorDialog.setTargetNode(this.#getUserSelectorDialogTargetNode());
				this.#userSelectorDialog.show();
			}
		}
		#getUserSelectorDialogTargetNode() {
			return document.getElementById('crm-gotochat-client-selector');
		}
		#getClientSelectorEntities() {
			const contact = {
				id: 'contact',
				dynamicLoad: true,
				dynamicSearch: true,
				options: {
					showTab: true,
					showPhones: true,
					showMails: true
				}
			};
			const company = {
				id: 'company',
				dynamicLoad: true,
				dynamicSearch: true,
				options: {
					excludeMyCompany: true,
					showTab: true,
					showPhones: true,
					showMails: true
				}
			};
			const {
				entityTypeId
			} = this.#getOwnerEntity();
			if (entityTypeId === BX.CrmEntityType.enumeration.contact) {
				return [company];
			}
			if (entityTypeId === BX.CrmEntityType.enumeration.company) {
				return [contact];
			}
			return [contact, company];
		}
		async onSelectClient(event) {
			const {
				item
			} = event.getData();
			this.selectedClient = {
				entityId: item.id,
				entityTypeId: BX.CrmEntityType.resolveId(item.entityId)
			};
			const isBound = await this.#bindClient();
			if (isBound) {
				this.adjustLayout();
				BX.Crm.EntityEditor.getDefault().reload();
			}
		}
		async #bindClient() {
			const {
				entityId,
				entityTypeId
			} = this.#getOwnerEntity();
			const {
				entityId: clientId,
				entityTypeId: clientTypeId
			} = this.selectedClient;
			const ajaxParams = {
				entityId,
				entityTypeId,
				clientId,
				clientTypeId
			};
			return new Promise(resolve => {
				main_core.ajax.runAction('crm.activity.gotochat.bindClient', {
					data: ajaxParams
				}).then(({
					data
				}) => {
					if (!data) {
						resolve(false);
					}
					const {
						channels,
						communications,
						currentChannelId
					} = data;
					this.channels = channels;
					this.communications = communications;
					this.currentChannelId = currentChannelId;
					this.#setCommunicationsParams();
					this.#setChannelDefaultPhoneId();
					resolve(true);
				}).catch(data => {
					if (data.errors.length > 0) {
						this.#showNotify(data.errors[0].message);
						return;
					}
					this.#showNotify(main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_BIND_CLIENT_ERROR'));
				});
			});
		}
		#getOwnerEntity() {
			const context = this.#context;
			return {
				entityId: context.getEntityId(),
				entityTypeId: context.getEntityTypeId()
			};
		}

		// eslint-disable-next-line class-methods-use-this
		#showHelp() {
			top.BX.Helper.show(`redirect=detail&code=${HELP_ARTICLE_CODE}`);
		}
		#showSettingsMenu() {
			if (!this.selectedClient) {
				this.#showNotSelectedClientNotify();
				return;
			}
			if (!this.settingsMenu) {
				this.initSettingsMenu();
			}
			this.settingsMenu.show();
		}
		initSettingsMenu() {
			const menuId = 'crm-gotochat-channels-settings-menu';
			const items = this.#getSubmenuStubItems();
			this.settingsMenu = main_popup.MenuManager.create({
				id: menuId,
				bindElement: document.querySelector(`.${TOOLBAR_CONTAINER_CLASS}`),
				items: [{
					delimiter: true,
					text: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SETTINGS')
				}, {
					id: 'channelSubmenu',
					text: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SENDER_SELECTOR'),
					items,
					events: {
						onSubMenuShow: event => {
							this.#onSubMenuShow(event, this.getChannelsSubmenuItems());
						}
					}
				}, {
					id: 'phoneSubmenu',
					text: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_NUMBER_SELECTOR'),
					items,
					disabled: !main_core.Type.isArrayFilled(this.getPhoneSubMenuItems()),
					events: {
						onSubMenuShow: event => {
							this.#onSubMenuShow(event, this.getPhoneSubMenuItems());
						}
					}
				}, {
					delimiter: true,
					text: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECTOR_SETTINGS')
				}, {
					id: 'telegramBotSubmenu',
					text: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_TELEGRAMBOT_OPENLINE_SELECTOR'),
					items,
					disabled: !this.openLineItems.telegrambot?.selected,
					events: {
						onSubMenuShow: event => {
							this.#onSubMenuShow(event, this.getOpenLinesSubMenuItems('telegrambot'));
						}
					}
				}, ...(this.#isServiceSupportedInRegion(ServicesConfig.get('max')) ? [{
					id: 'maxSubmenu',
					text: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_MAX_OPENLINE_SELECTOR'),
					items,
					disabled: !this.openLineItems.max?.selected,
					events: {
						onSubMenuShow: event => {
							this.#onSubMenuShow(event, this.getOpenLinesSubMenuItems('max'));
						}
					}
				}] : [])]
			});
		}

		// eslint-disable-next-line class-methods-use-this
		#getSubmenuStubItems() {
			// needed for emitted the onSubMenuShow event
			return [{
				id: MENU_ITEM_STUB_ID
			}];
		}

		// eslint-disable-next-line class-methods-use-this
		#onSubMenuShow(event, items) {
			const target = event.getTarget();
			for (const itemOptionsToAdd of items) {
				target.getSubMenu()?.addMenuItem(itemOptionsToAdd);
			}
			target.getSubMenu()?.removeMenuItem(MENU_ITEM_STUB_ID);
		}
		onShowClientPhoneSelector() {
			const targetNode = document.getElementById('crm-gotochat-client-selector--selected');
			if (this.#clientSelector && this.#clientSelector.isOpen()) {
				this.#clientSelector.hide();
			} else {
				this.#clientSelector = crm_clientSelector.ClientSelector.createFromCommunications({
					targetNode,
					communications: this.communications,
					events: {
						onSelect: this.onSelectClientPhone
					}
				});
				this.#clientSelector.setSelected([this.toPhoneId]).show();
			}
		}
		onSelectClientPhone(event) {
			const {
				item: {
					id,
					customData
				}
			} = event.getData();
			this.selectedClient = {
				entityId: customData.get('entityId'),
				entityTypeId: customData.get('entityTypeId')
			};
			this.toName = this.getCurrentCommunication().caption;
			this.toPhoneId = id;
			this.adjustLayout();
		}
		getCurrentPhone() {
			const client = this.getCurrentCommunication();
			if (!client || !main_core.Type.isObjectLike(client.phones)) {
				return null;
			}
			return client.phones.find(phone => phone.id === this.toPhoneId);
		}
		getCurrentCommunication() {
			if (!this.selectedClient) {
				return null;
			}
			const {
				entityTypeId,
				entityId
			} = this.selectedClient;
			return this.communications.find(communication => {
				return Number(communication.entityTypeId) === Number(entityTypeId) && Number(communication.entityId) === Number(entityId);
			});
		}
		adjustLayout() {
			this.#adjustClientTitle();
			this.#adjustChatServiceButtons();
			this.#showContent();
		}
		#adjustClientTitle() {
			const client = this.getCurrentCommunication();
			if (!client) {
				this.#showContent();
				this.#showAddClientTitle();
				return;
			}
			const phone = this.getCurrentPhone();
			if (!phone) {
				/*
				now the situation of the absence of the client's phone
				has not been worked out by the product manager in any way
					@todo need handle this situation
				 */
				this.#showContent();
				this.#showAddClientTitle();
				return;
			}
			const clientElement = main_core.Tag.render`
			<span 
				id="crm-gotochat-client-selector--selected" 
				class="crm-entity-stream-content-gotochat-user-selector-link --selected" 
				onclick="${this.onShowClientPhoneSelector.bind(this)}"
			>
				<span 
					class="crm-entity-stream-content-gotochat-client-avatar"
					style="background-image: url('${this.getEntityAvatarPath(client.entityTypeName.toLowerCase())}');"
				>
				</span>
				${main_core.Text.encode(client.caption)}, ${main_core.Text.encode(phone.valueFormatted)}
				<span class="crm-entity-stream-content-gotochat-client-chevron"></span>
			</span>
		`;
			const titleContainer = main_core.Tag.render`
			<span>
				${main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SELECTED_CLIENT_TITLE_MSGVER_2')}
			</span>
		`;
			const titleElement = titleContainer.firstChild;
			const labelIndex = titleElement.textContent.indexOf('#CLIENT_NAME#');
			titleElement.nodeValue = titleElement.nodeValue.replace('#CLIENT_NAME#', '');
			main_core.Dom.insertBefore(clientElement, titleElement.splitText(labelIndex));
			const container = document.querySelector(`.${CLIENTS_SELECTOR_TITLE_CLASS}`);
			main_core.Dom.clean(container);
			main_core.Dom.append(titleContainer, container);
		}

		// eslint-disable-next-line class-methods-use-this
		#showContent() {
			main_core.Dom.removeClass(document.querySelector('.crm-entity-stream-content-new-detail-gotochat-container'), 'hidden');
			main_core.Dom.removeClass(document.querySelector('.crm-entity-stream-content-new-detail-gotochat'), '--skeleton');
		}
		#showAddClientTitle() {
			const container = document.querySelector(`.${CLIENTS_SELECTOR_TITLE_CLASS}`);
			main_core.Dom.clean(container);
			main_core.Dom.append(this.#getClientTitleHtmlElement(), container);
		}

		// eslint-disable-next-line class-methods-use-this
		#hideContent() {
			main_core.Dom.addClass(document.querySelector('.crm-entity-stream-content-new-detail-gotochat-container'), 'hidden');
			main_core.Dom.addClass(document.querySelector('.crm-entity-stream-content-new-detail-gotochat'), '--skeleton');
		}
		#removeCurrentClient() {
			this.selectedClient = null;
			this.fromPhoneId = null;
		}
		#adjustChatServiceButtons() {
			const oldContainer = document.querySelector(`.${BUTTONS_CONTAINER_CLASS}`);
			const newContainer = this.#getServiceButtons();
			main_core.Dom.replace(oldContainer, newContainer);
		}
		#getServiceButtons() {
			this.#fillChatServiceButtons();
			const wrappers = [...this.#chatServiceButtons.values()].map(button => {
				const wrapper = main_core.Tag.render`<div class="crm-entity-stream-content-gotochat-button"></div>`;
				wrapper.appendChild(button.render());
				return wrapper;
			});
			const buttonsContainer = main_core.Tag.render`
			<div class="${BUTTONS_CONTAINER_CLASS}">
				${wrappers}
			</div>
		`;
			BX.UI.Hint.init(buttonsContainer);
			return buttonsContainer;
		}
		#fillChatServiceButtons() {
			ServicesConfig.forEach(service => {
				if (!this.#isServiceSupportedInRegion(service)) {
					return;
				}
				if (service.hideOnBox === true && this.#isBox) {
					return;
				}
				const button = this.#createChatServiceButton(service);
				this.#chatServiceButtons.set(service.id, button);
			});
		}
		#isServiceSupportedInRegion(service) {
			if (!service.region || !this.#region) {
				return true;
			}
			if (Array.isArray(service.region)) {
				return service.region.includes(this.#region);
			}
			if (service.region !== this.#region && service.region[0] !== '!') {
				return false;
			}
			return service.region !== `!${this.#region}`;
		}
		#createChatServiceButton(service) {
			const isDisabled = !this.#isAvailableService(service.id);
			const isReady = !isDisabled && this.#isServiceSelected(service);
			let style;
			let text;
			if (isDisabled) {
				style = ui_buttons.Button.AirStyle.OUTLINE;
				text = service.disabledLabel || service.soonLabel;
			} else if (isReady) {
				style = ui_buttons.Button.AirStyle.FILLED;
				text = service.inviteLabel;
			} else {
				style = ui_buttons.Button.AirStyle.OUTLINE_ACCENT_2;
				text = service.connectLabel;
			}
			const dataset = {
				code: service.id
			};
			if (isDisabled && main_core.Type.isStringFilled(service.disabledHint)) {
				dataset.hint = service.disabledHint;
				dataset.hintNoIcon = 'Y';
				dataset.hintCenter = 'Y';
			}
			return new ui_buttons.Button({
				text,
				size: ui_buttons.Button.Size.EXTRA_LARGE,
				useAirDesign: true,
				style,
				icon: service.iconClass,
				round: true,
				wide: true,
				disabled: isDisabled,
				dataset,
				onclick: () => this.showRegistrarAndSend(service.id)
			});
		}
		#isServiceSelected(service) {
			const id = service.checkServiceId ?? service.id;
			return this.openLineItems?.[id]?.selected;
		}
		async showRegistrarAndSend(code) {
			if (this.isSending || !this.#isAvailableService(code)) {
				return;
			}
			if (this.#isEntityInEditorMode()) {
				await this.#showEditorInEditModePopup();
			}
			if (!this.selectedClient && !this.hasClients) {
				this.#showNotSelectedClientNotify();
				return;
			}
			if (!this.toPhoneId) {
				const content = main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CLIENT_HAVE_NO_PHONE');
				this.#showNotify(content);
				return;
			}
			this.showButtonLoader(code);
			const service = this.#getServiceConfigByCode(code);
			const isInvite = service ? this.#isServiceSelected(service) : false;
			const {
				entityTypeId
			} = this.#getOwnerEntity();
			const lineId = await crm_messagesender.ConditionChecker.checkAndGetLine({
				openLineCode: service.connectorId,
				senderType: this.getSenderType(),
				openLineItems: this.openLineItems,
				serviceId: service.id,
				entityTypeId
			});
			if (lineId === null) {
				this.#restoreButton(code);
			} else {
				if (!isInvite && service) {
					this.#sendClickAnalytics(service, false);
				}
				this.send(lineId, code);
			}
		}
		#getServiceConfigByCode(code) {
			return ServicesConfig.get(code) || null;
		}
		#sendClickAnalytics(service, isInvite) {
			const EventBuilder = isInvite ? crm_integration_analytics.Builder.Communication.Channel.InviteEvent : crm_integration_analytics.Builder.Communication.Channel.ConnectEvent;
			const analyticsData = new EventBuilder().setChannelId(service.id).setSubSection(crm_integration_analytics.Dictionary.SUB_SECTION_DETAILS).setSection(this.getExtras()?.analytics?.c_section).setElement(crm_integration_analytics.Dictionary.ELEMENT_GOTOCHAT).buildData();
			ui_analytics.sendData(analyticsData);
		}
		#isAvailableService(code) {
			return this.#services[code] ?? false;
		}
		#isEntityInEditorMode() {
			return this.#getEntityEditor().getMode() === BX.UI.EntityEditorMode.edit;
		}
		async #showEditorInEditModePopup() {
			const {
				entityTypeId
			} = this.#getOwnerEntity();
			const entityType = BX.CrmEntityType.resolveName(entityTypeId);
			const dynamicKey = `CRM_TIMELINE_GOTOCHAT_EDITOR_HAVE_UNSAVED_CHANGES_TEXT_${entityType}`;
			const message = main_core.Loc.hasMessage(dynamicKey) ? main_core.Loc.getMessage(dynamicKey) : main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_EDITOR_HAVE_UNSAVED_CHANGES_TEXT');
			return new Promise(resolve => {
				BX.UI.Dialogs.MessageBox.show({
					modal: true,
					message,
					buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
					okCaption: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_EDITOR_HAVE_UNSAVED_CHANGES_SAVE_AND_CONTINUE'),
					onOk: messageBox => {
						this.saveEntityEditor();
						messageBox.close();
						resolve();
					},
					cancelCaption: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_EDITOR_HAVE_UNSAVED_CHANGES_FORCE_CONTINUE'),
					onCancel: function (messageBox) {
						messageBox.close();
						resolve();
					}
				});
			});
		}
		saveEntityEditor() {
			this.#getEntityEditor().saveChanged();
		}
		#getEntityEditor() {
			if (!this.#entityEditor) {
				this.#entityEditor = BX.Crm.EntityEditor.getDefault();
			}
			return this.#entityEditor;
		}
		#showNotSelectedClientNotify() {
			const content = main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_NO_SELECTED_CLIENT');
			this.#showNotify(content);
		}

		// eslint-disable-next-line class-methods-use-this
		#showNotify(content) {
			BX.UI.Notification.Center.notify({
				content
			});
		}
		send(lineId, code) {
			this.isSending = true;
			const {
				entityTypeId: ownerTypeId,
				entityId: ownerId
			} = this.#getOwnerEntity();
			const senderType = this.getSenderType();
			const senderId = this.currentChannelId;
			const from = this.fromPhoneId;
			const to = this.toPhoneId;
			const service = this.#getServiceConfigByCode(code);
			const connectorId = service.connectorId;
			const ajaxParameters = {
				ownerTypeId,
				ownerId,
				params: {
					senderType,
					senderId,
					from,
					to,
					lineId,
					connectorId
				}
			};
			main_core.ajax.runAction('crm.activity.gotochat.send', {
				data: ajaxParameters
			}).then(() => {
				this.isSending = false;
				this.#setOpenLineItemIsSelected(code);
				this.#restoreButton(code);
				this.#sendClickAnalytics(service, true);
				this.#showNotify(main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SEND_SUCCESS'));
				this.emitFinishEditEvent();
			}).catch(data => {
				this.isSending = false;
				this.#restoreButton(code);
				if (data.errors.length > 0) {
					this.#showNotify(data.errors[0].message);
					return;
				}
				this.#showNotify(main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_SEND_ERROR'));
			});
		}
		#setOpenLineItemIsSelected(code) {
			const service = this.#getServiceById(code);
			this.openLineItems[service?.checkServiceId ?? code].selected = true;
		}
		#getServiceById(id) {
			return [...ServicesConfig.values()].find(item => item.id === id) ?? null;
		}
		#restoreButton(code) {
			const oldButton = this.#chatServiceButtons.get(code);
			const newButton = this.#createChatServiceButton(ServicesConfig.get(code));
			this.#chatServiceButtons.set(code, newButton);
			main_core.Dom.replace(oldButton.render(), newButton.render());
		}
		showButtonLoader(code) {
			const button = this.#chatServiceButtons.get(code);
			if (button) {
				button.setWaiting(true);
			}
		}
		getSenderType() {
			return this.currentChannelId === crm_messagesender.Types.bitrix24 ? crm_messagesender.Types.bitrix24 : crm_messagesender.Types.sms;
		}

		// eslint-disable-next-line class-methods-use-this
		getEntityAvatarPath(entityTypeName) {
			// eslint-disable-next-line no-param-reassign
			entityTypeName = entityTypeName.toLowerCase();
			const whiteList = ['contact', 'company', 'lead'];
			if (!whiteList.includes(entityTypeName)) {
				return '';
			}
			return `/bitrix/images/crm/entity_provider_icons/${entityTypeName}.svg`;
		}
		getChannelsSubmenuItems() {
			const items = [];
			this.channels.forEach(({
				id,
				shortName: text,
				canUse,
				fromList
			}) => {
				const className = id === this.currentChannelId ? ACTIVE_MENU_ITEM_CLASS : DEFAULT_MENU_ITEM_CLASS;
				items.push({
					id,
					text,
					className,
					disabled: !canUse || !main_core.Type.isArrayFilled(fromList),
					onclick: this.onSelectSender
				});
			});
			return [...items, {
				id: 'connectOtherSenderDelimiter',
				delimiter: true
			}, {
				id: 'connectOtherSender',
				text: main_core.Loc.getMessage('CRM_TIMELINE_GOTOCHAT_CONNECT_OTHER_SENDER_SERVICE'),
				className: DEFAULT_MENU_ITEM_CLASS,
				onclick: () => BX.SidePanel.Instance.open(this.marketplaceUrl)
			}];
		}
		onSelectSender(event, {
			id
		}) {
			this.currentChannelId = id;
			const channel = this.#getChannelById(id);
			this.fromPhoneId = channel.fromList[0].id;
			this.#refreshSettingsMenu();
		}
		getPhoneSubMenuItems() {
			const currentChannel = this.#getChannelById(this.currentChannelId);
			const items = [];
			if (currentChannel) {
				currentChannel.fromList.forEach(({
					id,
					name: text
				}) => {
					const className = id === this.fromPhoneId ? ACTIVE_MENU_ITEM_CLASS : DEFAULT_MENU_ITEM_CLASS;
					items.push({
						id,
						text,
						className,
						onclick: this.onSelectSenderPhone
					});
				});
			}
			return items;
		}
		getOpenLinesSubMenuItems(connectorCode) {
			const openLineItem = this.openLineItems?.[connectorCode] ?? {};
			const items = [];
			if (!openLineItem.list) {
				return items;
			}
			openLineItem.list.forEach(({
				id,
				name,
				selected
			}) => {
				const className = selected ? ACTIVE_MENU_ITEM_CLASS : DEFAULT_MENU_ITEM_CLASS;
				items.push({
					id,
					text: name,
					className,
					onclick: (event, menuItem) => this.onSelectOpenLineId(event, menuItem, connectorCode)
				});
			});
			return items;
		}
		#getChannelById(id) {
			return this.channels.find(channel => channel.id === id);
		}
		onSelectSenderPhone(event, {
			id
		}) {
			this.fromPhoneId = id;
			this.#refreshSettingsMenu();
		}
		onSelectOpenLineId(event, {
			id
		}, connectorCode) {
			const list = this.openLineItems?.[connectorCode]?.list ?? null;
			if (list === null) {
				return;
			}
			const selectedItem = list.find(item => item.selected);
			if (!selectedItem) {
				return;
			}
			if (selectedItem.id === id) {
				return;
			}

			// eslint-disable-next-line no-return-assign
			list.forEach(item => item.selected = false);
			list.find(item => item.id === id).selected = true;
			BX.userOptions.save('crm', 'gotochat-selected-openline-ids', connectorCode, id);
			this.#refreshSettingsMenu();
		}
		#refreshSettingsMenu() {
			this.settingsMenu.destroy();
			this.initSettingsMenu();
		}
		#getLoader() {
			if (!this.loader) {
				this.loader = new main_loader.Loader({
					color: '#2fc6f6',
					size: 36
				});
			}
			return this.loader;
		}
		onHide() {
			if (this.loader) {
				this.loader.destroy();
			}
		}
		#hideLoader() {
			if (this.loader) {
				void this.loader.hide();
			}
		}
	}

	/** @memberof BX.Crm.Timeline.MenuBar */

	class Market extends Item {
		showSlider() {
			BX.rest.Marketplace.open({
				PLACEMENT: this.getSetting('placement', '')
			});
			top.BX.addCustomEvent(top, 'Rest:AppLayout:ApplicationInstall', this.#fireUpdateEvent.bind(this));
		}
		supportsLayout() {
			return false;
		}
		#fireUpdateEvent() {
			const entityTypeId = this.getEntityTypeId();
			const entityId = this.getEntityId();
			setTimeout(function () {
				console.log('fireUpdate', entityId, entityTypeId);
				BX.Crm.EntityEvent.fire(BX.Crm.EntityEvent.names.invalidate, entityTypeId, entityId, '');
			}, 3000);
		}
	}

	class Meeting extends Item {
		showSlider() {
			const planner = new BX.Crm.Activity.Planner();
			planner.showEdit({
				'TYPE_ID': BX.CrmActivityType.meeting,
				'OWNER_TYPE_ID': this.getEntityTypeId(),
				'OWNER_ID': this.getEntityId()
			});
		}
		supportsLayout() {
			return false;
		}
	}

	class ButtonType {
		static PRIMARY = 'primary';
		static SECONDARY = 'secondary';
	}

	class ActionType {
		static LAYOUT_JS_EVENT = 'layoutEvent';
		static FOOTER_BUTTON_CLICK = 'footerButtonClick';
		static OPEN_REST_APP = 'openRestApp';
		static REDIRECT = 'redirect';
	}

	class EventType {
		static FOOTER_BUTTON_CLICK = 'footerButtonClick';
		static LAYOUT_EVENT = 'layoutEvent';
		static VALUE_CHANGED_EVENT = 'valueChangedEvent';
		static ITEM_ACTION = 'crm:activityplacement:item:action';
	}

	class Action {
		#type = null;
		#value = null;
		#sliderParams = null;
		constructor(params) {
			this.#type = params.type;
			this.#value = params.value ?? null;
			this.#sliderParams = params.sliderParams ?? null;
		}
		execute(vueComponent) {
			return new Promise((resolve, reject) => {
				if (this.isLayoutJsEvent()) {
					vueComponent.$Bitrix.eventEmitter.emit(EventType.ITEM_ACTION, {
						event: EventType.LAYOUT_EVENT,
						value: {
							id: vueComponent.$parent?.getIdByComponentInstance ? vueComponent.$parent?.getIdByComponentInstance(vueComponent) : null,
							value: this.#value
						}
					});
					resolve(true);
				} else if (this.isOpenRestApp()) {
					const params = {
						...(main_core.Type.isPlainObject(this.#value) ? this.#value : {
							value: `${this.#value}`
						})
					};
					const appId = vueComponent.$root.getAppId();
					if (main_core.Type.isStringFilled(this.#sliderParams?.title ?? null)) {
						params.bx24_title = this.#sliderParams.title;
					}
					if (main_core.Type.isNumber(this.#sliderParams?.width ?? null)) {
						params.bx24_width = this.#sliderParams.width;
					}
					if (main_core.Type.isNumber(this.#sliderParams?.leftBoundary ?? null)) {
						params.bx24_leftBoundary = this.#sliderParams.leftBoundary;
					}
					const labelParams = {};
					if (main_core.Type.isStringFilled(this.#sliderParams?.labelBgColor ?? null)) {
						labelParams.bgColor = this.#sliderParams.labelBgColor;
					}
					if (main_core.Type.isStringFilled(this.#sliderParams?.labelColor ?? null)) {
						labelParams.color = this.#sliderParams.labelColor;
					}
					if (main_core.Type.isStringFilled(this.#sliderParams?.labelText ?? null)) {
						labelParams.text = this.#sliderParams.labelText;
					}
					if (Object.keys(labelParams).length > 0) {
						params.bx24_label = labelParams;
					}
					if (BX.rest && BX.rest.AppLayout) {
						BX.rest.AppLayout.openApplication(appId, params);
					}
				} else if (this.isRedirect()) {
					const linkAttrs = {
						href: this.#value
					};

					// this magic allows auto opening internal links in slider if possible:
					const link = main_core.Dom.create('a', {
						attrs: linkAttrs,
						text: '',
						style: {
							display: 'none'
						}
					});
					main_core.Dom.append(link, document.body);
					link.click();
					setTimeout(() => main_core.Dom.remove(link), 10);
					resolve(this.#value);
				} else if (this.isFooterButtonClick()) {
					vueComponent.$Bitrix.eventEmitter.emit(EventType.ITEM_ACTION, {
						event: EventType.FOOTER_BUTTON_CLICK,
						value: this.#value
					});
					resolve(true);
				} else {
					reject(false);
				}
			});
		}
		isFooterButtonClick() {
			return this.#type === ActionType.FOOTER_BUTTON_CLICK;
		}
		isLayoutJsEvent() {
			return this.#type === ActionType.LAYOUT_JS_EVENT;
		}
		isOpenRestApp() {
			return this.#type === ActionType.OPEN_REST_APP;
		}
		isRedirect() {
			return this.#type === ActionType.REDIRECT;
		}
		getValue() {
			return this.#value;
		}
	}

	class ButtonState {
		static DEFAULT = '';
		static LOADING = 'loading';
		static DISABLED = 'disabled';
	}

	var Button = {
		props: {
			id: {
				type: String,
				required: false,
				default: ''
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			state: {
				type: String,
				required: false,
				default: ButtonState.DEFAULT
			},
			type: {
				type: String,
				required: false,
				default: ButtonType.SECONDARY
			},
			action: Object
		},
		computed: {
			buttonContainerRef() {
				return this.$refs.buttonContainer;
			},
			itemStateToButtonStateDict() {
				return {
					[ButtonState.LOADING]: ui_buttons.Button.State.WAITING,
					[ButtonState.DISABLED]: ui_buttons.Button.State.DISABLED
				};
			},
			itemTypeToButtonColorDict() {
				return {
					[ButtonType.PRIMARY]: ui_buttons.Button.Color.PRIMARY,
					[ButtonType.SECONDARY]: ui_buttons.Button.Color.LINK
				};
			},
			className() {
				return [ui_buttons.Button.BASE_CLASS, this.itemTypeToButtonColorDict[this.type] ?? ui_buttons.Button.Color.LINK, ui_buttons.Button.Size.EXTRA_SMALL, ui_buttons.Button.Style.ROUND, this.itemStateToButtonStateDict[this.state] ?? ''];
			}
		},
		methods: {
			executeAction() {
				if (this.action && ![ButtonState.LOADING, ButtonState.DISABLED].includes(this.state)) {
					const action = new Action(this.action);
					action.execute(this);
				}
			}
		},
		template: `
		<button :class="className" @click="executeAction">{{ title }}</button>
	`
	};

	const Layout = {
		components: {
			Button
		},
		props: {
			id: String,
			appId: String,
			onAction: Function
		},
		data() {
			return {
				layout: {},
				isLoading: true,
				primaryButtonParams: this.getButtonParams(ButtonType.PRIMARY, null, this.layout?.primaryButton),
				secondaryButtonParams: this.getButtonParams(ButtonType.SECONDARY, null, this.layout?.secondaryButton),
				primaryButtonAction: Object.freeze({
					type: ActionType.FOOTER_BUTTON_CLICK,
					value: ButtonType.PRIMARY
				}),
				secondaryButtonAction: Object.freeze({
					type: ActionType.FOOTER_BUTTON_CLICK,
					value: ButtonType.SECONDARY
				})
			};
		},
		created() {
			this.$Bitrix.eventEmitter.subscribe(EventType.ITEM_ACTION, this.onActionEvent);
		},
		mounted() {
			this.showLoader(true);
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe(EventType.ITEM_ACTION, this.onActionEvent);
		},
		watch: {
			layout(newLayout) {
				this.primaryButtonParams = this.getButtonParams(ButtonType.PRIMARY, this.primaryButtonParams, newLayout.primaryButton);
				this.secondaryButtonParams = this.getButtonParams(ButtonType.SECONDARY, this.secondaryButtonParams, newLayout.secondaryButton);
			}
		},
		methods: {
			setLayout(newLayout) {
				this.layout = newLayout;
				this.$Bitrix.eventEmitter.emit('layout:updated');
			},
			showLoader(showLoader) {
				if (showLoader) {
					if (!this.loader) {
						this.loader = new main_loader.Loader({
							size: 50
						});
					}
					this.loader.show(this.$refs.loader);
				} else if (this.loader) {
					this.loader.hide();
				}
				this.isLoading = showLoader;
			},
			setLayoutItemState(id, visible, properties, callback) {
				if (this.$refs.blocks.setLayoutItemState(id, visible, properties)) {
					this.$nextTick(callback({
						result: 'success'
					}));
				} else {
					this.$nextTick(callback({
						result: 'error',
						errors: ['item not found']
					}));
				}
			},
			setButtonState(id, state, callback) {
				switch (id) {
					case ButtonType.PRIMARY:
						this.primaryButtonParams = this.getButtonParams(ButtonType.PRIMARY, this.primaryButtonParams, state);
						break;
					case ButtonType.SECONDARY:
						this.secondaryButtonParams = this.getButtonParams(ButtonType.SECONDARY, this.secondaryButtonParams, state);
						break;
				}
				this.$nextTick(callback({
					result: 'success'
				}));
			},
			getButtonParams(buttonType, oldValue, newValue) {
				if (main_core.Type.isNull(newValue)) {
					return null;
				}
				return {
					...oldValue,
					...newValue,
					type: buttonType
				};
			},
			getAppId() {
				return this.appId;
			},
			onActionEvent(event) {
				const eventData = event.getData();
				this.onAction(main_core.Runtime.clone(eventData));
			}
		},
		computed: {
			hasPrimaryButton() {
				return Boolean(this.primaryButtonParams);
			},
			hasSecondaryButton() {
				return Boolean(this.secondaryButtonParams);
			}
		},
		template: `
		<div class="crm-entity-stream-restapp-loader" ref="loader" v-show="isLoading"></div>
		<BlocksCollection  
			v-show="!isLoading" 
			containerCssClass="crm-entity-stream-restapp-container"
			itemCssClass="crm-timeline__restapp-container_block"
			ref="blocks"
			:blocks="layout?.blocks ?? {}"></BlocksCollection>

		<div class="crm-entity-stream-restapp-btn-container" v-show="!isLoading && (hasPrimaryButton || hasSecondaryButton)">
			<Button v-if="hasPrimaryButton" v-bind="primaryButtonParams" :action="primaryButtonAction"></Button>
			<Button v-if="hasSecondaryButton" v-bind="secondaryButtonParams" :action="secondaryButtonAction"></Button>
		</div>
	`
	};

	class BlockType {
		static text = 'Text';
		static link = 'Link';
		static lineOfBlocks = 'LineOfTextBlocks';
		static withTitle = 'WithTitle';
		static section = 'Section';
		static list = 'List';
		static dropdownMenu = 'DropdownMenu';
		static input = 'Input';
		static select = 'Select';
		static textarea = 'Textarea';
	}

	class TextColor {
		static PRIMARY = 'primary';
		static WARNING = 'warning';
		static DANGER = 'danger';
		static SUCCESS = 'success';
		static BASE_50 = 'base-50';
		static BASE_60 = 'base-60';
		static BASE_70 = 'base-70';
		static BASE_90 = 'base-90';
	}

	class TextSize {
		static XS = 'xs';
		static SM = 'sm';
		static MD = 'md';
		static LG = 'lg';
		static XL = 'xl';
	}

	var Text = {
		inheritAttrs: false,
		props: {
			value: String | Number,
			title: {
				type: String,
				required: false,
				default: ''
			},
			color: {
				type: String,
				required: false,
				default: ''
			},
			bold: {
				type: Boolean,
				required: false,
				default: false
			},
			size: {
				type: String,
				required: false,
				default: 'md'
			},
			multiline: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		computed: {
			className() {
				return ['crm-timeline__text-block', this.colorClassname, this.boldClassname, this.sizeClassname];
			},
			colorClassname() {
				const upperCaseColorProp = this.color ? this.color.toUpperCase() : '';
				const color = TextColor[upperCaseColorProp] ?? '';
				return color ? `--color-${color}` : '';
			},
			boldClassname() {
				const weight = this.bold ? 'bold' : 'normal';
				return `--weight-${weight}`;
			},
			sizeClassname() {
				const upperCaseWeightProp = this.size ? this.size.toUpperCase() : '';
				const size = TextSize[upperCaseWeightProp] ?? TextSize.SM;
				return `--size-${size}`;
			},
			encodedText() {
				let text = main_core.Text.encode(this.value);
				if (this.multiline) {
					text = text.replace(/\n/g, '<br />');
				}
				return text;
			}
		},
		template: `
		<span
			:title="title"
			:class="className"
			v-html="encodedText"
		></span>`
	};

	var Link = {
		inheritAttrs: false,
		props: {
			text: String,
			action: Object,
			size: {
				type: String,
				required: false,
				default: 'md'
			},
			bold: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		computed: {
			href() {
				if (!this.action) {
					return null;
				}
				const action = new Action(this.action);
				if (action.isRedirect()) {
					return action.getValue();
				}
				return null;
			},
			linkAttrs() {
				if (!this.action) {
					return {};
				}
				const action = new Action(this.action);
				if (!action.isRedirect()) {
					return {};
				}
				return {
					href: action.getValue()
				};
			},
			className() {
				return ['crm-timeline__card_link', this.bold ? '--bold' : '', this.sizeClassname];
			},
			sizeClassname() {
				const upperCaseWeightProp = this.size ? this.size.toUpperCase() : '';
				const size = TextSize[upperCaseWeightProp] ?? TextSize.SM;
				return `--size-${size}`;
			}
		},
		methods: {
			executeAction() {
				if (this.action) {
					const action = new Action(this.action);
					action.execute(this);
				}
			}
		},
		template: `
			<a
				v-if="href"
				v-bind="linkAttrs"
				:class="className"
			>
			{{text}}
			</a>
			<span
				v-else
				@click="executeAction"
				:class="className"
			>
				{{text}}
			</span>
		`
	};

	class BlockWithTitleWidth {
		static SM = 'sm';
		static MD = 'md';
		static LG = 'lg';
	}

	var BaseBlocksCollection = {
		inheritAttrs: false,
		props: {
			blocks: Object
		},
		computed: {
			allowedTypes() {
				return Object.values(BlockType);
			},
			containerCssClass() {
				return '';
			},
			containerTagName() {
				return 'div';
			},
			itemCssClass() {
				return '';
			},
			itemTagName() {
				return 'div';
			},
			isInline() {
				return false;
			}
		},
		methods: {
			setLayoutItemState(id, visible, properties) {
				return this.$refs.blocks.setLayoutItemState(id, visible, properties);
			}
		},
		// language=Vue
		template: `
		<BlocksCollection 
			:containerCssClass="containerCssClass"
			:containerTagName="containerTagName"
			:itemCssClass="itemCssClass"
			:itemTagName="itemTagName"
			ref="blocks"
			:blocks="blocks ?? {}" 
			:inline="true"
			:allowedTypes="allowedTypes"
		></BlocksCollection>`
	};

	const LineOfTextBlocks = ui_vue3.BitrixVue.cloneComponent(BaseBlocksCollection, {
		computed: {
			allowedTypes() {
				return [BlockType.text, BlockType.link, BlockType.dropdownMenu];
			},
			containerCssClass() {
				return 'crm-timeline-block-line-of-texts';
			},
			containerTagName() {
				return 'span';
			},
			itemTagName() {
				return 'span';
			},
			isInline() {
				return true;
			}
		}
	});

	var WithTitle = {
		inheritAttrs: false,
		components: {
			Text,
			Link,
			LineOfTextBlocks
		},
		props: {
			id: String,
			title: String,
			inline: Boolean,
			titleWidth: {
				type: String,
				required: false,
				default: BlockWithTitleWidth.MD
			},
			block: Object
		},
		computed: {
			className() {
				return ['crm-timeline__card-container_info', '--word-wrap', this.widthClassname, this.inline ? '--inline' : ''];
			},
			widthClassname() {
				const width = BlockWithTitleWidth[this.titleWidth.toUpperCase()] ?? BlockWithTitleWidth.MD;
				return `--width-${width}`;
			},
			isValidBlock() {
				return [BlockType.text, BlockType.link, BlockType.lineOfBlocks].includes(this.rendererName);
			},
			rendererName() {
				return BlockType[this.block?.type] ?? null;
			}
		},
		methods: {
			isTitleCropped() {
				const titleElem = this.$refs.title;
				return titleElem.scrollWidth > titleElem.clientWidth;
			}
		},
		mounted() {
			this.$nextTick(() => {
				if (this.isTitleCropped()) {
					main_core.Dom.attr(this.$refs.title, 'title', this.title);
				}
			});
		},
		template: `
			<div :class="className" v-if="isValidBlock">
				<div ref="title" class="crm-timeline__card-container_info-title">{{ title }}</div>
				<div class="crm-timeline__card-container_info-value">
					<component :is="rendererName" v-bind="block.properties" :id="id"></component>
				</div>
			</div>
		`
	};

	const MenuId = 'restapp-dropdown-menu';
	var DropdownMenu = {
		inheritAttrs: false,
		props: {
			values: Object,
			id: String,
			selectedValue: {
				required: false,
				default: ''
			},
			size: {
				type: String,
				required: false,
				default: 'md'
			}
		},
		data() {
			return {
				currentSelectedValue: this.selectedValue
			};
		},
		beforeUnmount() {
			const menu = main_popup.MenuManager.getMenuById(MenuId);
			if (menu) {
				menu.destroy();
			}
		},
		computed: {
			className() {
				return ['crm-timeline-block-dropdownmenu', this.sizeClassname];
			},
			sizeClassname() {
				const upperCaseWeightProp = this.size ? this.size.toUpperCase() : '';
				const size = TextSize[upperCaseWeightProp] ?? TextSize.SM;
				return `--size-${size}`;
			},
			selectedValueCode() {
				let selectedValue = this.currentSelectedValue;
				if (!Object.hasOwn(this.values, selectedValue)) {
					const allValues = Object.keys(this.values);
					selectedValue = allValues.length > 0 ? allValues[0] : '';
				}
				return selectedValue;
			},
			selectedValueTitle() {
				return String(this.values[this.selectedValueCode] ?? '');
			},
			isValid() {
				return main_core.Type.isPlainObject(this.values) && Object.keys(this.values).length > 0;
			}
		},
		watch: {
			selectedValue(newSelectedValue) {
				this.currentSelectedValue = newSelectedValue;
			}
		},
		methods: {
			onMenuItemClick(valueId) {
				this.currentSelectedValue = valueId;
				main_popup.MenuManager.getCurrentMenu()?.close();
				this.$Bitrix.eventEmitter.emit(EventType.ITEM_ACTION, {
					event: EventType.VALUE_CHANGED_EVENT,
					value: {
						id: this.id,
						value: valueId
					}
				});
			},
			showMenu() {
				const menuItems = [];
				Object.keys(this.values).forEach(valueId => {
					menuItems.push({
						text: String(this.values[valueId]),
						value: valueId,
						onclick: () => {
							this.onMenuItemClick(valueId);
						}
					});
				});
				main_popup.MenuManager.show({
					id: MenuId,
					cacheable: false,
					bindElement: this.$el,
					items: menuItems
				});
			}
		},
		template: `
		<span v-if="isValid" :class="className" @click="showMenu"><span class="crm-timeline-block-dropdownmenu-content">{{selectedValueTitle}}</span><span class="crm-timeline-block-dropdownmenu-arrow"></span></span>`
	};

	var Input$1 = {
		emits: ['update:modelValue'],
		props: {
			modelValue: String,
			placeholder: String,
			disabled: Boolean
		},
		data() {
			return {
				currentValue: this.modelValue
			};
		},
		methods: {
			onChange() {
				this.$emit('update:modelValue', this.currentValue);
			}
		},
		watch: {
			modelValue(newValue) {
				this.currentValue = newValue;
			}
		},
		template: `
		<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
			<input :placeholder="placeholder" :disabled="disabled" v-model="currentValue" @input="onChange" type="text" class="ui-ctl-element" />
		</div>
	`
	};

	var Select$1 = {
		emits: ['update:modelValue'],
		props: {
			modelValue: String,
			values: Array,
			disabled: Boolean
		},
		data() {
			return {
				currentValue: this.getSelectedValue(this.modelValue)
			};
		},
		methods: {
			onChange() {
				this.$emit('update:modelValue', this.currentValue);
			},
			getSelectedValue(valueCandidate) {
				if (!main_core.Type.isArray(this.values)) {
					return '';
				}
				if (this.values.some(item => item.id === valueCandidate)) {
					return valueCandidate;
				}
				return this.values.length > 0 ? this.values[0].id : '';
			}
		},
		watch: {
			modelValue(newValue) {
				this.currentValue = this.getSelectedValue(newValue);
			}
		},
		template: `
		<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
			<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			<select :disabled="disabled" v-model="currentValue" @change="onChange" class="ui-ctl-element">
				<option :value="option.id" :key="option.id" :selected="option.id===currentValue" v-for="option in values">{{ option.value }}</option>
			</select>
		</div>
	`
	};

	var Textarea$1 = {
		emits: ['update:modelValue'],
		props: {
			modelValue: String,
			placeholder: String,
			disabled: Boolean
		},
		data() {
			return {
				currentValue: this.modelValue
			};
		},
		mounted() {
			this.adjustTextareaHeight();
		},
		methods: {
			onChange() {
				this.$emit('update:modelValue', this.currentValue);
				this.adjustTextareaHeight();
			},
			adjustTextareaHeight() {
				const textareaNode = this.$refs.textarea;
				this.$nextTick(() => {
					main_core.Dom.style(textareaNode, 'height', 0);
					let height = textareaNode.scrollHeight;
					if (height < 120) {
						height = 120;
					}
					if (height > 1000) {
						height = 1000;
					}
					height += 12;
					height += 'px';
					main_core.Dom.style(textareaNode, 'height', height);
					main_core.Dom.style(textareaNode.parentNode, 'height', height);
				});
			}
		},
		watch: {
			modelValue(newValue) {
				this.currentValue = newValue;
				this.$nextTick(() => {
					this.adjustTextareaHeight(this.$refs.textarea);
				});
			}
		},
		template: `
		<div class="ui-ctl ui-ctl-textarea ui-ctl-w100 ui-ctl-no-resize">
			<textarea ref="textarea" :placeholder="placeholder" :disabled="disabled" v-model="currentValue" @input="onChange" class="ui-ctl-element"></textarea>
		</div>
	`
	};

	var BaseInput = {
		inheritAttrs: false,
		components: {
			Input: Input$1,
			Select: Select$1,
			Textarea: Textarea$1
		},
		props: {
			id: String,
			title: String,
			errorText: String,
			value: String,
			disabled: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		data() {
			return {
				currentValue: this.getInitialValue()
			};
		},
		computed: {
			className() {
				return ['ui-ctl-container', 'ui-ctl-w100', this.hasError ? 'ui-ctl-warning' : ''];
			},
			hasTitle() {
				return Boolean(this.title);
			},
			hasError() {
				return Boolean(this.errorText);
			},
			componentName() {
				throw new Error('Must be overridden');
			},
			componentProps() {
				throw new Error('Must be overridden');
			}
		},
		watch: {
			value(newValue) {
				this.currentValue = newValue;
			}
		},
		methods: {
			getInitialValue() {
				return this.value;
			},
			onChange(newValue) {
				this.$Bitrix.eventEmitter.emit(EventType.ITEM_ACTION, {
					event: EventType.VALUE_CHANGED_EVENT,
					value: {
						id: this.id,
						value: newValue
					}
				});
			}
		},
		template: `
		<div :class="className">
			<div class="ui-ctl-top" v-if="hasTitle">
				<div class="ui-ctl-title">{{ title }}</div>
			</div>
			<component :is="componentName" v-bind="componentProps" :disabled="disabled" v-model="currentValue" @update:modelValue="onChange"></component>
			<div v-if="hasError" class="ui-ctl-bottom">{{ errorText }}</div>
		</div>
	`
	};

	const Input = ui_vue3.BitrixVue.cloneComponent(BaseInput, {
		props: {
			placeholder: String
		},
		computed: {
			componentName() {
				return 'Input';
			},
			componentProps() {
				return {
					placeholder: this.placeholder
				};
			}
		}
	});

	const Select = ui_vue3.BitrixVue.cloneComponent(BaseInput, {
		props: {
			selectedValue: String,
			values: Object
		},
		computed: {
			componentName() {
				return 'Select';
			},
			componentProps() {
				return {
					values: this.preparedValues
				};
			},
			preparedValues() {
				if (!main_core.Type.isPlainObject(this.values)) {
					return [];
				}
				const result = [];
				Object.keys(this.values).forEach(key => {
					result.push({
						id: key,
						value: String(this.values[key])
					});
				});
				return result;
			}
		},
		watch: {
			selectedValue(newValue) {
				this.currentValue = newValue;
			}
		},
		methods: {
			getInitialValue() {
				return `${this.selectedValue}`;
			}
		}
	});

	const Textarea = ui_vue3.BitrixVue.cloneComponent(BaseInput, {
		props: {
			placeholder: String
		},
		computed: {
			componentName() {
				return 'Textarea';
			},
			componentProps() {
				return {
					placeholder: this.placeholder
				};
			}
		}
	});

	const List = ui_vue3.BitrixVue.cloneComponent(BaseBlocksCollection, {
		computed: {
			allowedTypes() {
				return [BlockType.text, BlockType.link, BlockType.lineOfBlocks];
			},
			containerCssClass() {
				return 'crm-timeline-block-list';
			},
			itemCssClass() {
				return 'crm-timeline-block-list-item';
			}
		}
	});

	class SectionImageSize {
		static SM = 'sm';
		static MD = 'md';
		static LG = 'lg';
	}

	class SectionType {
		static default = 'default';
		static primary = 'primary';
		static warning = 'warning';
		static danger = 'danger';
		static success = 'success';
		static withBorder = 'with-border';
	}

	const Section = ui_vue3.BitrixVue.cloneComponent(BaseBlocksCollection, {
		props: {
			type: {
				type: String,
				required: false,
				default: SectionType.default
			},
			imageSrc: {
				type: String,
				required: false,
				default: ''
			},
			imageSize: {
				type: String,
				required: false,
				default: SectionImageSize.LG
			}
		},
		computed: {
			allowedTypes() {
				return Object.values(BlockType).filter(item => item !== BlockType.section);
			},
			className() {
				return ['crm-timeline-block-section', this.typeClassname];
			},
			imageClassName() {
				return ['crm-timeline-block-section-img', this.imageSizeClassname];
			},
			typeClassname() {
				const type = SectionType[this.type] ?? SectionType.default;
				return type ? `--type-${type}` : '';
			},
			imageSizeClassname() {
				const size = SectionImageSize[this.imageSize.toUpperCase()] ?? SectionImageSize.LG;
				return size ? `--size-${size}` : '';
			},
			imageUri() {
				if (!this.imageSrc) {
					return null;
				}
				const regex = /^(http|https):\/\//;
				if (!regex.test(this.imageSrc)) {
					return null;
				}
				return this.imageSrc;
			}
		},
		// language=Vue
		template: `
		<div :class="className">
			<div v-if="imageUri" :class="imageClassName">
				<img :src="imageUri" />
			</div>
		<BlocksCollection
			ref="blocks"
			containerCssClass="crm-timeline-block-section-blocks"
			itemCssClass="crm-timeline__restapp-container_block"
			:blocks="blocks ?? {}"
			:allowedTypes="allowedTypes"
		></BlocksCollection>
		</div>`
	});

	var BlocksCollection = {
		components: {
			Text,
			Link,
			LineOfTextBlocks,
			DropdownMenu,
			Input,
			Select,
			Textarea,
			List,
			WithTitle,
			Section
		},
		props: {
			containerTagName: {
				type: String,
				required: false,
				default: 'div'
			},
			containerCssClass: {
				type: String,
				required: false,
				default: ''
			},
			itemTagName: {
				type: String,
				required: false,
				default: 'div'
			},
			itemCssClass: {
				type: String,
				required: false,
				default: ''
			},
			inline: {
				type: Boolean,
				required: false,
				default: false
			},
			allowedTypes: {
				type: Array,
				required: false,
				default: Object.values(BlockType)
			},
			blocks: Object
		},
		data() {
			return {
				currentBlocks: this.blocks,
				blockRefs: {}
			};
		},
		beforeUpdate() {
			this.blockRefs = {};
		},
		updated() {
			this.setDataIdAttribute();
		},
		mounted() {
			this.setDataIdAttribute();
		},
		watch: {
			blocks(newBlocks) {
				this.currentBlocks = newBlocks;
			}
		},
		methods: {
			saveRef(ref, id) {
				this.blockRefs[id] = ref;
			},
			setDataIdAttribute() {
				if (!this.blockRefs || this.visibleBlocks.length === 0) {
					return;
				}
				this.visibleBlocks.forEach((block, index) => {
					const blockId = block.id;
					const node = this.blockRefs[blockId]?.$el;
					if (main_core.Type.isElementNode(node)) {
						node.setAttribute('data-id', blockId);
					}
				});
			},
			setLayoutItemState(id, visible, properties) {
				if (!Object.hasOwn(this.currentBlocks, id)) {
					return Object.keys(this.currentBlocks).reduce((result, blockId) => {
						if (this.blockRefs[blockId] && main_core.Type.isFunction(this.blockRefs[blockId].setLayoutItemState)) {
							return this.blockRefs[blockId].setLayoutItemState(id, visible, properties) || result;
						}
						return result;
					}, false);
				}
				if (main_core.Type.isPlainObject(properties)) {
					this.currentBlocks[id].properties = {
						...this.currentBlocks[id].properties,
						...properties
					};
				}
				if (main_core.Type.isBoolean(visible)) {
					this.currentBlocks[id].visible = visible;
				}
				return true;
			},
			getIdByComponentInstance(componentInstance) {
				const id = Object.keys(this.blockRefs).find(blockId => this.blockRefs[blockId] === componentInstance);
				return id || null;
			},
			getItemCssClassList(block) {
				const list = [];
				if (this.itemCssClass) {
					list.push(this.itemCssClass);
				}
				if (!block.visible) {
					list.push('--hidden');
				}
				if (block.id === this.firstVisibleBlockId) {
					list.push('--first-visible');
				}
				if (block.id === this.lastVisibleBlockId) {
					list.push('--last-visible');
				}
				return list;
			}
		},
		computed: {
			visibleBlocks() {
				if (!this.currentBlocks) {
					return [];
				}
				return Object.keys(this.currentBlocks).map(id => {
					const block = this.currentBlocks[id];
					const rendererName = BlockType[block.type] ?? null;
					const visible = !main_core.Type.isBoolean(block.visible) || block.visible;
					return {
						id,
						rendererName,
						...this.currentBlocks[id],
						visible
					};
				}).filter(item => this.allowedTypes.includes(item.rendererName));
			},
			firstVisibleBlockId() {
				const visibleBlocks = this.visibleBlocks.filter(item => item.visible);
				if (!visibleBlocks.length) {
					return null;
				}
				return visibleBlocks[0].id;
			},
			lastVisibleBlockId() {
				const visibleBlocks = this.visibleBlocks.filter(item => item.visible);
				if (!visibleBlocks.length) {
					return null;
				}
				return visibleBlocks[visibleBlocks.length - 1].id;
			}
		},
		// language=Vue
		template: `
		<component :is="containerTagName" :class="containerCssClass">
			<component :is="itemTagName"
				:class="getItemCssClassList(block)"
				v-for="(block) in visibleBlocks"
				:key="block.id"
			>
				<component :is="block.rendererName"
							 :id="block.id"
							 v-bind="block.properties"
							 :ref="(el) => this.saveRef(el, block.id)"
				/>
				<span v-if="inline">&nbsp;</span>
			</component>
		</component>`
	};

	const SPOTLIGHT_ID_PREFIX = 'rest_placement_spotlight';
	const MODULE_ID = 'crm';
	const USER_SEEN_OPTION = 'rest_placement_tour_viewed';
	const REST_PLACEMENT_SLIDER_WIDTH = 800;
	const CHECK_TARGET_CHANGE_INTERVAL = 1000;
	let Tour$1 = class Tour {
		#id;
		#title;
		#text;
		#isCanShowTour;
		#appContext;
		#isHidden = false;
		#currentTarget = null;
		#guide = null;
		#spotlight = null;
		#checkTargetChangeIntervalID = null;
		constructor(data) {
			this.#id = main_core.Type.isStringFilled(data.id) ? data.id : null;
			this.#title = main_core.Type.isStringFilled(data.title) ? data.title : '';
			this.#text = main_core.Type.isStringFilled(data.text) ? data.text : '';
			this.#isCanShowTour = main_core.Type.isBoolean(data.isCanShowTour) ? data.isCanShowTour : false;
			this.#appContext = main_core.Type.isPlainObject(data.appContext) ? data.appContext : {};
		}
		show() {
			this.#getSpotlight().show();
			this.getGuide().showNextStep();
			this.#prepareMoreDetailsLink();
			this.#bindEvents();
		}
		canShow() {
			let isValidStringFields = true;
			const stringFields = [this.#id, this.#title, this.#text];
			stringFields.forEach(field => {
				if (!main_core.Type.isStringFilled(field)) {
					isValidStringFields = false;
				}
			});
			return this.#isCanShowTour && isValidStringFields && main_core.Type.isDomNode(this.#getTarget());
		}
		getGuide() {
			if (!this.#guide) {
				this.#guide = new ui_tour.Guide({
					onEvents: true,
					steps: [{
						target: this.#getTarget(),
						title: main_core.Text.encode(this.#title),
						text: main_core.Text.encode(this.#text),
						position: 'bottom',
						rounded: true,
						link: '##',
						events: {
							onShow: event => {
								const {
									data
								} = event;
								let airClassList = 'crm-whats-new-slide-air';
								if (main_core.Type.isArrayFilled(data.guide.steps[0].buttons)) {
									airClassList += ' --with-buttons';
								}
								if (main_core.Type.isStringFilled(data.guide.steps[0].iconSrc)) {
									airClassList += ' --with-icon';
								}
								main_core.Dom.addClass(data.guide.getPopup().getPopupContainer(), airClassList);
							},
							onClose: () => {
								BX.userOptions.save(MODULE_ID, USER_SEEN_OPTION, this.#id, true);
								this.#getSpotlight().close();
								this.#unbindEvents();
							}
						}
					}]
				});
			}
			return this.#guide;
		}
		#bindEvents() {
			this.currentTarget = this.#getTarget();
			this.#checkTargetChangeIntervalID = setInterval(this.#onTargetChange.bind(this), CHECK_TARGET_CHANGE_INTERVAL);
		}
		#unbindEvents() {
			clearInterval(this.#checkTargetChangeIntervalID);
		}
		#onTargetChange() {
			const possibleNewTarget = this.#getTarget();
			const isTargetVisible = this.#isVisible(possibleNewTarget);
			const isTargetChange = this.#currentTarget !== possibleNewTarget;
			if (isTargetVisible) {
				this.#unHide();
			} else {
				this.#hide();
			}
			if (isTargetChange) {
				this.#rebindTarget(possibleNewTarget);
				this.#currentTarget = possibleNewTarget;
			}
		}
		#isVisible(element) {
			return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length > 0);
		}
		#hide() {
			if (this.#isHidden) {
				return;
			}
			const guidePopupContainer = this.getGuide().getPopup().getPopupContainer();
			main_core.Dom.addClass(guidePopupContainer, '--hidden');
			this.#isHidden = true;
		}
		#unHide() {
			if (!this.#isHidden) {
				return;
			}
			const guidePopup = this.getGuide().getPopup();
			main_core.Dom.removeClass(guidePopup.popupContainer, '--hidden');
			guidePopup.adjustPosition();
			this.#isHidden = false;
		}
		#rebindTarget(newTarget) {
			this.getGuide().getCurrentStep().setTarget(newTarget);
			this.getGuide().showNextStep();
			this.#prepareMoreDetailsLink();
			this.#getSpotlight().setTargetElement(newTarget);
		}
		#getSpotlight() {
			if (!this.#spotlight) {
				const id = `${SPOTLIGHT_ID_PREFIX}_${this.#id}`;
				this.#spotlight = new BX.SpotLight({
					id,
					targetElement: this.#getTarget(),
					autoSave: 'no',
					targetVertex: 'middle-center',
					zIndex: 200
				});
				this.#spotlight.bindEvents({
					onTargetEnter: () => {
						this.#spotlight.close();
					}
				});
			}
			return this.#spotlight;
		}
		#getTarget() {
			let target = document.querySelector(`[data-id="${this.#id}"]`);
			if (!this.#isVisible(target)) {
				target = target.parentElement.nextElementSibling;
			}
			return target;
		}
		#prepareMoreDetailsLink() {
			const moreDetailsLink = this.getGuide().getLink();
			moreDetailsLink.removeAttribute('href');
			moreDetailsLink.removeAttribute('target');
			main_core.Dom.style(moreDetailsLink, 'cursor', 'pointer');
			moreDetailsLink.onclick = this.#openAppPlacementSlider.bind(this);
		}
		#openAppPlacementSlider() {
			const {
				applicationId,
				placementOptions,
				additionalComponentParam,
				closeCallback
			} = this.#appContext;
			placementOptions.newUserNotification = 'Y';
			placementOptions.bx24_width = REST_PLACEMENT_SLIDER_WIDTH;
			BX.rest.AppLayout.openApplication(applicationId, placementOptions, additionalComponentParam, closeCallback);
		}
	};

	class Base extends Item {
		showTour() {
			const tour = new Tour$1({
				id: this.getSetting('id'),
				title: this.getSetting('newUserNotificationTitle'),
				text: this.getSetting('newUserNotificationText'),
				isCanShowTour: this.getSetting('isCanShowTour') && !BX.Crm.EntityEditor.getDefault().isNew(),
				appContext: {
					applicationId: this.getSetting('appId', ''),
					placementOptions: {
						entityTypeId: this.getEntityTypeId(),
						entityId: this.getEntityId()
					}
				}
			});
			crm_tourManager.TourManager.getInstance().registerWithLaunch(tour);
		}
	}

	class LayoutValidator {
		validate(layout) {
			return [];
		}
	}

	class PlacementInterfaceManager {
		#placementCode = null;
		#methodsList = [];
		#handlers = {};
		constructor(placementCode, methodsList) {
			this.#placementCode = placementCode;
			this.#methodsList = methodsList;
			this.#initializeInterface();
		}
		static Instances = {};
		static getInstance(placementCode, methodsList) {
			if (!Object.hasOwn(PlacementInterfaceManager.Instances, placementCode)) {
				PlacementInterfaceManager.Instances[placementCode] = new PlacementInterfaceManager(placementCode, methodsList);
			}
			return PlacementInterfaceManager.Instances[placementCode];
		}
		registerHandlers(placementId, handlers) {
			this.#handlers[placementId] = handlers;
		}
		#initializeInterface() {
			const PlacementInterface = BX.rest.AppLayout.initializePlacement(this.#placementCode);
			this.#methodsList.forEach(methodName => {
				PlacementInterface.prototype[methodName] = this.#interfaceCallback.bind(this, methodName);
			});
		}
		#interfaceCallback() {
			const methodName = arguments[0] ?? null;
			const placementId = arguments[3]?.params?.placementId ?? null;
			if (!methodName || !placementId) {
				return;
			}
			const placementHandlers = this.#handlers[placementId] ?? {};
			if (main_core.Type.isFunction(placementHandlers[methodName])) {
				placementHandlers[methodName](arguments[1] ?? null, arguments[2] ?? null);
			}
		}
	}

	const LAYOUT_EVENT_NAME = 'LayoutEvent';
	const PRIMARY_BTN_CLICK_EVENT_NAME = 'PrimaryButtonClickEvent';
	const SECONDARY_BTN_CLICK_EVENT_NAME = 'SecondaryButtonClickEvent';
	const VALUE_CHANGE_EVENT_NAME = 'ValueChangeEvent';
	const ENTITY_UPDATE_EVENT_NAME = 'entityUpdateEvent';
	class WithLayout extends Base {
		#layoutComponent = null;
		#layoutApp = null;
		#activated = false;
		#eventEmitter = null;
		constructor() {
			super();
			this.#eventEmitter = new main_core_events.EventEmitter();
			this.#eventEmitter.setEventNamespace('RestPlacement');
			main_core_events.EventEmitter.subscribe('onCrmEntityUpdate', () => {
				this.#eventEmitter.emit(ENTITY_UPDATE_EVENT_NAME, {});
			});
		}
		createLayout() {
			return main_core.Tag.render`<div class="crm-entity-stream-content-new-detail --hidden"></div>`;
		}
		initializeLayout() {
			super.initializeLayout();
			this.#layoutApp = ui_vue3.BitrixVue.createApp(Layout, {
				id: String(this.getSetting('placementId', '')),
				appId: this.getSetting('appId', ''),
				onAction: this.#onLayoutAppAction.bind(this)
			});
			this.#layoutApp.component('BlocksCollection', BlocksCollection);
			this.#layoutComponent = this.#layoutApp.mount(this.getContainer());
		}
		activate() {
			super.activate();
			if (!this.#activated) {
				this.#activated = true;
				this.#initializeInterface();
				this.#loadApp();
			}
		}
		#initializeInterface() {
			const placementInterfaceManager = PlacementInterfaceManager.getInstance(this.getSetting('placement', ''), ['setLayout', 'setLayoutItemState', 'bindLayoutEventCallback', 'bindValueChangeCallback', 'setPrimaryButtonState', 'setSecondaryButtonState', 'bindPrimaryButtonClickCallback', 'bindSecondaryButtonClickCallback', 'bindEntityUpdateCallback', 'finish', 'lock', 'unlock']);
			placementInterfaceManager.registerHandlers(this.getSetting('placementId', ''), {
				setLayout: this.#setLayout.bind(this),
				setLayoutItemState: this.#setLayoutItemState.bind(this),
				bindLayoutEventCallback: this.#bindEventCallback.bind(this, LAYOUT_EVENT_NAME),
				bindValueChangeCallback: this.#bindEventCallback.bind(this, VALUE_CHANGE_EVENT_NAME),
				setPrimaryButtonState: this.#setButtonState.bind(this, ButtonType.PRIMARY),
				setSecondaryButtonState: this.#setButtonState.bind(this, ButtonType.SECONDARY),
				bindPrimaryButtonClickCallback: this.#bindEventCallback.bind(this, PRIMARY_BTN_CLICK_EVENT_NAME),
				bindSecondaryButtonClickCallback: this.#bindEventCallback.bind(this, SECONDARY_BTN_CLICK_EVENT_NAME),
				bindEntityUpdateCallback: this.#bindEventCallback.bind(this, ENTITY_UPDATE_EVENT_NAME),
				finish: this.#finish.bind(this),
				lock: this.setLocked.bind(this, true),
				unlock: this.setLocked.bind(this, false)
			});
		}
		#setLayout(layout, callback) {
			const validator = new LayoutValidator();
			const errors = validator.validate(layout);
			if (errors.length > 0) {
				this.#executeCallback(callback, {
					result: 'error',
					errors
				});
			} else {
				this.#layoutComponent.showLoader(false);
				this.#layoutComponent.setLayout(layout);
				this.#executeCallback(callback, {
					result: 'success'
				});
			}
		}
		#setLayoutItemState(params, callback) {
			const id = params.id ?? null;
			let properties = params.properties ?? null;
			let visible = params.visible ?? null;
			if (!main_core.Type.isStringFilled(id)) {
				this.#executeCallback(callback, {
					result: 'error',
					errors: ['Wrong id']
				});
				return;
			}
			const isCorrectVisible = main_core.Type.isBoolean(visible);
			const isCorrectProps = main_core.Type.isPlainObject(properties);
			if (!isCorrectProps && !isCorrectVisible) {
				this.#executeCallback(callback, {
					result: 'error',
					errors: ['Wrong state']
				});
				return;
			}
			if (!isCorrectVisible) {
				visible = null;
			}
			if (!isCorrectProps) {
				properties = null;
			}
			this.#layoutComponent.setLayoutItemState(id, visible, properties, result => this.#executeCallback(callback, result));
		}
		#setButtonState(buttonId, params, callback) {
			if (!main_core.Type.isPlainObject(params) && !(main_core.Type.isArray(params) && params.length === 0) && !main_core.Type.isNull(params)) {
				this.#executeCallback(callback, {
					result: 'error',
					errors: ['Wrong params']
				});
				return;
			}
			let state = params;
			if (main_core.Type.isArray(params) && params.length === 0) {
				state = null;
			}
			this.#layoutComponent.setButtonState(buttonId, state, result => this.#executeCallback(callback, result));
		}
		#bindEventCallback(eventName, params, callback) {
			this.#eventEmitter.subscribe(eventName, this.#executeEventCallback.bind(this, params, callback));
		}
		#finish() {
			this.emitFinishEditEvent();
		}
		#executeEventCallback(params, callback, eventData) {
			const data = eventData.getData();
			if (main_core.Type.isStringFilled(params))
				// if need to call callback only for definite id
				{
					if ((data.id ?? '') === params) {
						this.#executeCallback(callback, data);
					}
					return;
				}
			this.#executeCallback(callback, data);
		}
		#onLayoutAppAction(eventData) {
			const event = eventData.event ?? null;
			const value = eventData.value ?? null;
			if (event === EventType.FOOTER_BUTTON_CLICK && value === ButtonType.PRIMARY) {
				this.#eventEmitter.emit(PRIMARY_BTN_CLICK_EVENT_NAME, {});
			}
			if (event === EventType.FOOTER_BUTTON_CLICK && value === ButtonType.SECONDARY) {
				this.#eventEmitter.emit(SECONDARY_BTN_CLICK_EVENT_NAME, {});
			}
			if (event === EventType.LAYOUT_EVENT) {
				this.#eventEmitter.emit(LAYOUT_EVENT_NAME, value);
			}
			if (event === EventType.VALUE_CHANGED_EVENT) {
				this.#eventEmitter.emit(VALUE_CHANGE_EVENT_NAME, value);
			}
		}
		#executeCallback(callback, data) {
			if (main_core.Type.isFunction(callback)) {
				callback(data);
			}
		}
		#loadApp() {
			main_core.ajax.runComponentAction('bitrix:app.layout', 'getComponent', {
				data: {
					placementId: this.getSetting('placementId', ''),
					placementOptions: {
						entityTypeId: this.getEntityTypeId(),
						entityId: this.getEntityId(),
						useBuiltInInterface: 'Y'
					}
				}
			}).then(response => {
				if (!(response && response.data && response.data.componentResult)) {
					return;
				}
				const componentResult = response.data.componentResult;
				this.appSid = componentResult.APP_SID;
				const iframeNode = main_core.Tag.render`<div style="display: none; overflow: hidden;"></div>`;
				main_core.Dom.append(iframeNode, document.body);
				main_core.Runtime.html(iframeNode, response.data.html);
			});
		}
	}

	class WithSlider extends Base {
		#interfaceInitialized = false;
		showSlider() {
			if (!this.#interfaceInitialized) {
				this.#interfaceInitialized = true;
				this.#initializeInterface();
			}
			const appId = this.getSetting('appId', '');
			BX.rest.AppLayout.openApplication(appId, {
				ID: this.getEntityId()
			}, {
				PLACEMENT: this.getSetting('placement', ''),
				PLACEMENT_ID: this.getSetting('placementId', '')
			});
		}
		supportsLayout() {
			return false;
		}
		#initializeInterface() {
			if (top.BX.rest?.AppLayout) {
				const PlacementInterface = top.BX.rest.AppLayout.initializePlacement(this.getSetting('placement', ''));
				if (!PlacementInterface.prototype.reloadData) {
					const entityTypeId = this.getEntityTypeId();
					const entityId = this.getEntityId();
					PlacementInterface.prototype.reloadData = function (params, cb) {
						BX.Crm.EntityEvent.fireUpdate(entityTypeId, entityId, '');
						cb();
					};
				}
			}
		}
	}

	const DataLoadStatus = Object.freeze({
		loaded: 'loaded',
		notLoaded: 'notLoaded',
		loading: 'loading'
	});

	/** @memberof BX.Crm.Timeline.MenuBar */
	class Sharing extends WithEditor {
		#layout;
		#settingsModel;

		/**
		 * @override
		 */
		initialize(context, settings) {
			this.#layout = {};
			this.dataLoadStatus = DataLoadStatus.notLoaded;
			super.initialize(context, settings);
			if (this.supportsLayout()) {
				this.#bindEvents();
			}
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('CalendarSharing:LinkCopied', ({
				data: {
					hash
				}
			}) => this.onLinkCopied(hash));
			main_core_events.EventEmitter.subscribe('CalendarSharing:RuleUpdated', () => this.onRuleUpdated());
			main_core_events.EventEmitter.subscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', this.onContactsChangedHandler.bind(this));
			main_core.Event.bind(window, 'beforeunload', () => this.#settingsModel?.save());
		}

		/**
		 * @override
		 */
		activate() {
			if (this.supportsLayout()) {
				super.activate();
				this.#sendOpenFormAnalytics();
			} else {
				BX.UI?.InfoHelper?.show('limit_crm_calendar_free_slots');
			}
		}
		#sendOpenFormAnalytics() {
			calendar_sharing_analytics.Analytics.sendPopupOpened(calendar_sharing_analytics.Analytics.contexts.crm);
		}

		/**
		 * @override
		 */
		deactivate() {
			super.deactivate();
			this.#layout.wrap?.reset();
			this.setLocked(false);
		}

		/**
		 * @override
		 */
		supportsLayout() {
			return this.getSetting('isAvailable') && this.getEntityId() > 0;
		}

		/**
		 * @override
		 */
		onShow() {
			super.onShow();
			if (this.dataLoadStatus !== DataLoadStatus.notLoaded) {
				return;
			}
			this.loadData().then(isSuccess => {
				if (isSuccess) {
					this.#render();
				}
			});
		}
		async loadData() {
			this.dataLoadStatus = DataLoadStatus.loading;
			const action = 'crm.api.timeline.calendar.sharing.getConfig';
			const data = {
				entityTypeId: this.getEntityTypeId(),
				entityId: this.getEntityId()
			};
			return BX.ajax.runAction(action, {
				data
			}).then(response => {
				if (response?.data?.config) {
					this.setConfig(response.data.config);
					this.dataLoadStatus = DataLoadStatus.loaded;
					return true;
				}
				return false;
			}, error => {
				console.error(error);
				return false;
			});
		}
		setConfig(config) {
			this.link = config.link;
			this.isResponsible = config.isResponsible;
			this.isNotificationsAvailable = config.isNotificationsAvailable;
			this.dealContacts = config.contacts;
			this.setCommunicationChannels(config.communicationChannels, config.selectedChannelId);
			this.#settingsModel = new calendar_sharing_interface.SettingsModel({
				context: 'crm',
				linkHash: this.link.hash,
				sharingUrl: this.link.url,
				userInfo: config.userInfo,
				rule: this.link.rule,
				calendarSettings: config.calendarSettings,
				collapsed: false
			});
		}

		/**
		 * @override
		 */
		save() {
			return this.#sendLinkAction();
		}

		/**
		 * @override
		 */
		createLayout() {
			this.#layout.menuBarItem = document.querySelector('.crm-entity-stream-section-menu [data-id=sharing]');
			this.#layout.root = main_core.Tag.render`
			<div class="crm-entity-stream-content-sharing crm-entity-stream-content-wait-detail --hidden">
				${this.#renderLoader()}
				<div class="crm-entity-stream-calendar-sharing-btn-container">
					${this.renderSendButton()}
					${this.renderCopyButton()}
					${this.renderCancelButton()}
				</div>
			</div>
		`;
			return this.#layout.root;
		}
		#renderLoader() {
			this.#layout.loader = main_core.Tag.render`
			<div class="crm-entity-stream-content-sharing-loader"></div>
		`;
			new main_loader.Loader().show(this.#layout.loader);
			return this.#layout.loader;
		}
		#render() {
			this.#layout.wrap = new calendar_sharing_interface.Layout({
				readOnly: !this.isResponsible,
				settingsModel: this.#settingsModel,
				externalIcon: this.createSettingsButton()
			});
			const wrapNode = this.#layout.wrap.render();
			this.#layout.loader.replaceWith(wrapNode);
			return wrapNode;
		}
		createSettingsButton() {
			this.#layout.settingsButton = main_core.Tag.render`
			<div class="crm-entity-stream-calendar-sharing-settings-icon"></div>
		`;
			this.updateSettingsButton();
			main_core.Event.bind(this.#layout.settingsButton, 'click', () => this.onSettingsButtonClick());
			return this.#layout.settingsButton;
		}
		updateSettingsButton() {
			if (this.hasContacts()) {
				this.#layout.settingsButton.style.display = '';
			} else {
				this.#layout.settingsButton.style.display = 'none';
			}
		}
		renderSendButton() {
			this.#layout.sendButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_SEND_BUTTON_MSGVER_2'),
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				color: ui_buttons.ButtonColor.PRIMARY,
				round: true,
				onclick: () => this.onSendButtonClick()
			}).render();
			this._saveButton = this.#layout.sendButton;
			return this.#layout.sendButton;
		}
		renderCopyButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_COPY_BUTTON'),
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				round: true,
				onclick: () => this.copyLink()
			}).render();
		}
		renderCancelButton() {
			const cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_TIMELINE_CANCEL_BTN'),
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				color: ui_buttons.ButtonColor.LINK,
				onclick: () => this.onCancelButtonClick()
			}).render();
			this._cancelButton = cancelButton;
			return cancelButton;
		}
		onSettingsButtonClick() {
			this.showSettingsPopup();
		}
		async onSendButtonClick() {
			if (!this.hasDealContacts()) {
				this.showWarningNoContact();
				return;
			}
			if (!this.isChannelAvailable(this.channel) && this.hasPhoneWithoutChannels()) {
				this.showWarningNoCommunicationChannels();
				return;
			}
			if (!this.isChannelAvailable(this.channel) && this.hasEmailWithoutChannels()) {
				this.connectMailbox();
				return;
			}
			if (this.isNotificationsAvailable && this.isChannelBitrix24(this.channel)) {
				const isApproved = await this.isBitrix24Approved();
				if (isApproved) {
					this.onSaveButtonClick();
					return;
				} else {
					this.showWarningNoCommunicationChannels();
					return;
				}
			}
			this.onSaveButtonClick();
		}
		onLinkCopied(linkHash) {
			void this.#sendLinkAction({
				isActionCopy: true,
				linkHash
			});
		}
		onRuleUpdated() {
			this.onRuleUpdatedAction();
		}
		showSettingsPopup() {
			if (this.settingsMenu) {
				this.settingsMenu.destroy();
			}
			this.settingsMenu = this.getSettingsMenu();
			this.settingsMenu.show();
		}
		isSettingsPopupShown() {
			return this.settingsMenu?.popupWindow.isShown();
		}
		getSettingsMenu() {
			return main_popup.MenuManager.create({
				id: 'crm-calendar-sharing-settings',
				bindElement: this.#layout.settingsButton,
				items: this.getSettingsMenuItems()
			});
		}
		getSettingsMenuItems() {
			const items = [this.getSharingReceiverItem()];
			if (this.hasChannels()) {
				items.push(this.getSharingChannelsItem());
			}
			if (this.isChannelAvailable(this.channel)) {
				items.push(this.getSharingSenderItem());
			}
			return items;
		}
		getSharingReceiverItem() {
			return {
				id: 'sharing_receiver',
				text: main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_RECEIVER'),
				items: this.contacts.map(contact => {
					return this.getContactMenuItem(contact);
				})
			};
		}
		getSharingChannelsItem() {
			return {
				id: 'sharing_channels',
				text: main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_COMMUNICATION_CHANNELS'),
				items: this.channels.filter(channel => channel.contacts.length > 0).map(channel => {
					return this.getChannelMenuItem(channel);
				})
			};
		}
		getSharingSenderItem() {
			return {
				id: 'sharing_sender',
				text: main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_SENDER'),
				items: this.currentFromList.map(from => {
					return this.getFromMenuItem(from);
				})
			};
		}
		getContactMenuItem(contact) {
			const isSelected = contact.entityId === this.contact.entityId && contact.entityTypeId === this.contact.entityTypeId && contact.value === this.contact.value;
			const itemHtml = main_core.Tag.render`
			<div class="crm-entity-stream-calendar-sharing-settings-check">
				<div>${main_core.Text.encode(`${contact.name} (${contact.value})`)}</div>
			</div>
		`;
			contact.check = main_core.Tag.render`
			<div class="crm-entity-stream-calendar-sharing-settings-check-icon ${isSelected ? '--show' : ''}"></div>
		`;
			itemHtml.append(contact.check);
			return {
				html: itemHtml,
				onclick: () => {
					main_core.Dom.removeClass(this.contact.check, '--show');
					main_core.Dom.addClass(contact.check, '--show');
					this.contact = contact;
				}
			};
		}
		getChannelMenuItem(channel) {
			const isSelected = channel.id === this.channel.id && this.isChannelAvailable(channel);
			const itemHtml = main_core.Tag.render`
			<div class="crm-entity-stream-calendar-sharing-settings-check">
				<div>${main_core.Text.encode(channel.name)}</div>
			</div>
		`;
			channel.check = main_core.Tag.render`
			<div class="crm-entity-stream-calendar-sharing-settings-check-icon ${isSelected ? '--show' : ''}"></div>
		`;
			itemHtml.append(channel.check);
			return {
				html: itemHtml,
				className: channel.fromList.length <= 0 ? 'crm-timeline-popup-menu-item-disabled menu-popup-no-icon' : '',
				onclick: () => {
					if (channel.fromList.length <= 0) {
						this.connectMailbox();
						return;
					}
					main_core.Dom.removeClass(this.channel.check, '--show');
					main_core.Dom.addClass(channel.check, '--show');
					this.setChannel(channel);
				}
			};
		}
		connectMailbox() {
			BX.SidePanel.Instance.open('/mail/');

			//TODO: replace this workaround with subscribing for onPullEvent-mail "mailbox_created"
			const onMailSliderClose = () => {
				const previous = BX.SidePanel.Instance.openSliders[BX.SidePanel.Instance.getOpenSlidersCount() - 2];
				if (previous.url.includes('/crm/')) {
					this.updateChannels();
					top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onClose', onMailSliderClose);
				}
			};
			top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onClose', onMailSliderClose);
		}
		updateChannels() {
			const data = {
				entityTypeId: this.getEntityTypeId(),
				entityId: this.getEntityId()
			};
			BX.ajax.runAction('crm.timeline.calendar.sharing.getConfig', {
				data
			}).then(response => {
				this.setCommunicationChannels(response.data.config.communicationChannels, this.channel.id);
			});
		}
		getFromMenuItem(from) {
			const isSelected = from.id === this.currentFrom.id;
			const itemHtml = main_core.Tag.render`
			<div class="crm-entity-stream-calendar-sharing-settings-check">
				<div>${main_core.Text.encode(from.name)}</div>
			</div>
		`;
			from.check = main_core.Tag.render`
			<div class="crm-entity-stream-calendar-sharing-settings-check-icon ${isSelected ? '--show' : ''}"></div>
		`;
			itemHtml.append(from.check);
			return {
				html: itemHtml,
				onclick: () => {
					main_core.Dom.removeClass(this.currentFrom.check, '--show');
					main_core.Dom.addClass(from.check, '--show');
					this.currentFrom = from;
				}
			};
		}
		showWarningNoCommunicationChannels() {
			let title;
			let text;
			if (this.isNotificationsAvailable) {
				title = main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_NO_COMMUNICATION_CHANNELS_WARNING_TITLE');
				text = `
				<div>${main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_NO_COMMUNICATION_CHANNELS_WARNING_TEXT_1')}</div>
				</br>
				<div>${main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_NO_COMMUNICATION_CHANNELS_WARNING_TEXT_2')}</div>
			`;
			} else {
				title = main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_NO_CUSTOM_COMMUNICATION_CHANNELS_WARNING_TITLE');
				text = `
				<div>${main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_NO_CUSTOM_COMMUNICATION_CHANNELS_WARNING_TITLE_1').replaceAll('/marketplace/', main_core.Loc.getMessage('MARKET_BASE_PATH'))}</div>
				</br>
				<div>${main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_NO_COMMUNICATION_CHANNELS_WARNING_TEXT_2')}</div>
			`;
			}
			const noCommunicationChannelsWarningGuide = this.getWarningGuide(title, text);
			noCommunicationChannelsWarningGuide.showNextStep();
			const guidePopup = noCommunicationChannelsWarningGuide.getPopup();
			const guideContentContainer = guidePopup.getContentContainer();
			const openConfigurationButton = guideContentContainer.querySelector('span[data-role=crm-timeline-calendar-sharing_open-configure-slots]');
			openConfigurationButton.addEventListener('click', () => {
				guidePopup.close();
			});
		}
		showWarningNoContact() {
			const title = main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_NO_CONTACT_WARNING_TITLE');
			const text = main_core.Loc.getMessage('CRM_TIMELINE_CALENDAR_SHARING_NO_CONTACT_WARNING_TEXT_V2');
			const noContactWarningGuide = this.getWarningGuide(title, text);
			noContactWarningGuide.showNextStep();
		}
		async #sendLinkAction({
			isActionCopy,
			linkHash
		} = {}) {
			const data = {
				ownerId: this.getEntityId(),
				ownerTypeId: this.getEntityTypeId(),
				ruleArray: this.#settingsModel.getRule().toArray(),
				memberIds: this.#settingsModel.getMemberIds()
			};
			let action;
			if (!isActionCopy && this.isChannelAvailable(this.channel)) {
				action = 'crm.api.timeline.calendar.sharing.sendLink';
				data.contactId = this.contact.entityId || null;
				data.contactTypeId = this.contact.entityTypeId || null;
				data.channelId = this.channel.id || null;
				data.senderId = this.currentFrom.id || null;
			} else {
				action = 'crm.api.timeline.calendar.sharing.onLinkCopied';
				data.linkHash = linkHash ?? this.link.hash;
			}
			return BX.ajax.runAction(action, {
				data
			}).then(response => {
				if (response.data) {
					this.emitFinishEditEvent();
					return true;
				}
				return false;
			}, error => {
				console.error(error);
				return false;
			});
		}
		async copyLink() {
			this.setLocked(true);
			const link = await this.#getSharingLink();
			this.#layout.wrap.copyLink(link.url, link.hash);
			this.#sendCopyAnalytics();
		}
		#sendCopyAnalytics() {
			const params = {
				peopleCount: this.#settingsModel.getMemberIds().length,
				ruleChanges: this.#settingsModel.getChanges()
			};
			const type = this.#settingsModel.getMemberIds().length === 1 ? calendar_sharing_analytics.Analytics.linkTypes.solo : calendar_sharing_analytics.Analytics.linkTypes.multiple;
			calendar_sharing_analytics.Analytics.sendLinkCopied(this.#settingsModel.getContext(), type, params);
		}
		async #getSharingLink() {
			if (this.#settingsModel.getMemberIds().length === 1) {
				return {
					url: this.#settingsModel.getSharingUrl(),
					hash: this.#settingsModel.getLinkHash()
				};
			}
			return await this.saveJointLink();
		}
		async saveJointLink() {
			const response = await BX.ajax.runAction('crm.api.timeline.calendar.sharing.generateJointSharingLink', {
				data: {
					memberIds: this.#settingsModel.getMemberIds(),
					entityId: this.getEntityId(),
					entityTypeId: this.getEntityTypeId()
				}
			});
			return response.data;
		}
		onRuleUpdatedAction() {
			return BX.ajax.runAction('crm.api.timeline.calendar.sharing.onRuleUpdated', {
				data: {
					linkHash: this.link.hash,
					ownerId: this.getEntityId(),
					ownerTypeId: this.getEntityTypeId()
				}
			}).then(response => {}, error => {
				console.error(error);
				return false;
			});
		}
		onContactsChangedHandler(event) {
			const {
				item,
				current
			} = event.getData();
			const isCurrentDeal = this.getEntityTypeId() === item?.entityTypeId && this.getEntityId() === item?.entityId;
			if (!isCurrentDeal || !main_core.Type.isArray(current) || !main_core.Type.isArray(this.channels)) {
				return;
			}
			const contacts = current.map(receiver => ({
				id: receiver.address.id,
				entityId: receiver.addressSource.entityId,
				entityTypeId: receiver.addressSource.entityTypeId,
				name: receiver.addressSourceData?.title,
				value: receiver.address.value,
				valueType: receiver.address.valueType,
				typeId: receiver.address.typeId
			}));
			this.dealContacts = contacts;
			const phoneContacts = contacts.filter(receiver => receiver.typeId === 'PHONE');
			const mailContacts = contacts.filter(receiver => receiver.typeId === 'EMAIL');
			this.channels.forEach(channel => {
				if (channel.typeId === 'PHONE') {
					channel.contacts = phoneContacts;
				}
				if (channel.typeId === 'EMAIL') {
					channel.contacts = mailContacts;
				}
			});
			this.setChannel(this.chooseChannel(this.channel?.id));
			this.updateSettingsButton();
			if (this.isSettingsPopupShown()) {
				this.showSettingsPopup();
			}
		}
		setContacts(contacts) {
			this.contacts = contacts.filter(contact => contact.entityId && contact.entityTypeId && contact.value && contact.name).sort((a, b) => a.entityId - b.entityId) // sort by id
			.sort((a, b) => a.entityTypeId - b.entityTypeId); // sort company last

			this.contact = contacts.find(contact => {
				return contact.entityTypeId === this.contact?.entityTypeId && contact.entityId === this.contact?.entityId;
			}) ?? this.contacts[0];
		}
		setCommunicationChannels(channels, selectedId) {
			this.channels = channels || [];
			this.setChannel(this.chooseChannel(selectedId));
		}
		chooseChannel(selectedId) {
			const activeChannels = this.channels.filter(channel => this.isChannelAvailable(channel));
			if (selectedId && main_core.Type.isArrayFilled(activeChannels)) {
				return activeChannels.find(channel => channel.id === selectedId) ?? activeChannels[0];
			}
			const availableChannels = this.channels.filter(channel => channel.contacts.length > 0);
			return availableChannels?.[0];
		}
		setChannel(channel) {
			if (!channel) {
				return;
			}
			this.channel = channel;
			this.setContacts(this.channel.contacts);
			if (this.channel && this.channel.fromList) {
				this.currentFromList = this.channel.fromList;
				this.currentFrom = this.channel.fromList[0];
			}
			if (this.settingsMenu) {
				for (const item of this.getSettingsMenuItems()) {
					this.settingsMenu.removeMenuItem(item.id);
					this.settingsMenu.addMenuItem(item);
				}
			}
		}
		hasContacts() {
			return main_core.Type.isArrayFilled(this.contacts);
		}
		hasDealContacts() {
			return main_core.Type.isArrayFilled(this.dealContacts);
		}
		hasChannels() {
			return main_core.Type.isArrayFilled(this.channels);
		}
		hasPhoneWithoutChannels() {
			if (!this.channel) {
				return true;
			}
			const phoneContacts = this.dealContacts.filter(contact => contact.typeId === 'PHONE');
			const phoneChannels = this.channels.filter(channel => channel.typeId === 'PHONE');
			const channelUnavailable = this.channel.typeId === 'PHONE' && !this.isChannelAvailable(this.channel);
			return main_core.Type.isArrayFilled(phoneContacts) && !main_core.Type.isArrayFilled(phoneChannels) || channelUnavailable;
		}
		hasEmailWithoutChannels() {
			if (!this.channel) {
				return true;
			}
			const mailContacts = this.dealContacts.filter(contact => contact.typeId === 'EMAIL');
			const mailChannels = this.channels.filter(channel => channel.typeId === 'EMAIL');
			const channelUnavailable = this.channel.typeId === 'EMAIL' && !this.isChannelAvailable(this.channel);
			return main_core.Type.isArrayFilled(mailContacts) && !main_core.Type.isArrayFilled(mailChannels) || channelUnavailable;
		}
		isChannelAvailable(channel) {
			return main_core.Type.isArrayFilled(channel?.fromList) && main_core.Type.isArrayFilled(channel?.contacts);
		}
		isChannelBitrix24(channel) {
			return channel.id === crm_messagesender.Types.bitrix24;
		}
		async isBitrix24Approved() {
			return await crm_messagesender.ConditionChecker.checkIsApproved({
				senderType: crm_messagesender.Types.bitrix24
			});
		}
		getWarningGuide(title, text) {
			const warningGuide = new ui_tour.Guide({
				simpleMode: true,
				onEvents: true,
				steps: [{
					target: this.#layout.sendButton,
					title,
					text,
					condition: {
						top: false,
						bottom: true,
						color: 'warning'
					}
				}]
			});
			const guidePopup = warningGuide.getPopup();
			main_core.Dom.addClass(guidePopup.popupContainer, 'crm-calendar-sharing-configure-slots-popup-ui-tour-animate');
			guidePopup.setWidth(430);
			const guideContent = guidePopup.getContentContainer().firstElementChild;
			const offsetFromCloseIcon = parseInt(getComputedStyle(guidePopup.closeIcon)['width']);
			const existingPadding = parseInt(getComputedStyle(guideContent)['paddingRight']);
			guidePopup.getContentContainer().style.paddingRight = offsetFromCloseIcon - existingPadding + 'px';
			guidePopup.setAutoHide(true);
			guidePopup.subscribe('onAfterShow', () => {
				setTimeout(() => {
					const arrowContainer = guidePopup.angle.element;
					const arrow = arrowContainer.firstElementChild;
					arrow.style.border = '2px solid var(--ui-color-text-warning, #ffa900)';
					if (guidePopup.getContentContainer().getBoundingClientRect().top > this.#layout.sendButton.getBoundingClientRect().top) {
						const condition = guidePopup.getContentContainer().querySelector('.ui-tour-popup-condition-bottom');
						condition.className = 'ui-tour-popup-condition-top';
						arrowContainer.style.top = '-20px';
					} else {
						arrowContainer.style.bottom = '-18px';
					}
				}, 0);
			});
			return warningGuide;
		}
	}

	/** @memberof BX.Crm.Timeline.MenuBar */
	class Message extends Item {
		#renderPromise = null;
		#editor = null;
		createLayout() {
			const container = main_core.Tag.render`<div class="crm-entity-stream-content-new-detail --hidden"></div>`;
			if (!this.#shouldRender()) {
				return container;
			}
			const skeleton = new BX.MessageService.Message.Editor.Skeleton.Skeleton({
				layout: this.getSetting('editor').layout
			});
			skeleton.renderTo(container);
			return container;
		}
		onShow() {
			super.onShow();
			void this.#renderEditor();
		}
		#renderEditor() {
			this.#renderPromise ??= this.#doRenderEditor();
			return this.#renderPromise;
		}
		async #doRenderEditor() {
			if (!this.#shouldRender()) {
				return;
			}
			const {
				Editor
			} = await main_core.Runtime.loadExtension('crm.messagesender.editor');

			/** @see BX.Crm.MessageSender.Editor */
			this.#editor = new Editor({
				...this.getSetting('editor'),
				renderTo: this.getContainer()
			});
			await this.#editor.render();
			this.#bindEvents();
		}
		#shouldRender() {
			return Boolean(this.getSetting('shouldRender'));
		}
		#isRendered() {
			if (!this.#renderPromise || !this.#editor) {
				return Promise.resolve(false);
			}

			// if both resolved, the first in the array always wins
			return Promise.race([this.#renderPromise, 'not yet resolved']).then(promiseResult => promiseResult !== 'not yet resolved');
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', event => {
				const {
					item
				} = event.getData();
				if (this.getEntityTypeId() !== item?.entityTypeId || this.getEntityId() !== item?.entityId) {
					return;
				}
				void this.#editor?.reload();
			});
			const hide = () => {
				setTimeout(() => this.emitFinishEditEvent(), 50);
			};
			this.#editor.subscribe('onSendSuccess', hide);
			this.#editor.subscribe('onCancel', hide);
		}

		/**
		 * @public
		 */
		async shouldConfirmStateChange(params) {
			if (!(await this.#isRendered())) {
				return false;
			}
			const {
				text,
				template
			} = params;
			const state = this.#editor?.getState() ?? {};
			const isCustomTextChannel = main_core.Type.isNil(state.notificationTemplate) && main_core.Type.isNil(state.template);
			const isWantCustomTextChannel = main_core.Type.isNil(template) && main_core.Type.isStringFilled(text);
			if (!isCustomTextChannel && isWantCustomTextChannel) {
				return true;
			}
			if (isCustomTextChannel && isWantCustomTextChannel) {
				return main_core.Type.isStringFilled(state.message.body.trim()) && state.message.body.trim() !== text.trim();
			}
			if (isCustomTextChannel && !isWantCustomTextChannel) {
				return main_core.Type.isStringFilled(state.message.body.trim());
			}
			if (!isCustomTextChannel && !isWantCustomTextChannel) {
				const templateId = template?.ORIGINAL_ID;
				const filledPlaceholders = template?.FILLED_PLACEHOLDERS ?? [];
				const currentTemplateId = state.template?.ORIGINAL_ID;
				const currentFilledPlaceholders = state.template?.FILLED_PLACEHOLDERS ?? [];
				return main_core.Type.isNumber(templateId) && templateId > 0 && main_core.Type.isNumber(currentTemplateId) && currentTemplateId > 0 && (templateId !== currentTemplateId || JSON.stringify(filledPlaceholders) !== JSON.stringify(currentFilledPlaceholders));
			}
			throw new Error('Unexpected state in BX.Crm.Timeline.MenuBar.Item.Message.#shouldConfirmStateChange');
		}

		/**
		 * @public
		 */
		async tryToResend(params) {
			await this.#renderEditor();
			await this.#setState(params);
			const editorState = this.#editor.getState();
			const analytics = this.getSetting('analytics', {});
			const {
				Builder,
				sendData
			} = await main_core.Runtime.loadExtension('crm.integration.analytics', 'ui.analytics');
			const eventData = Builder.Communication.Editor.ResendEvent.createDefault(editorState.channel?.id).setSection(analytics.c_section).setSubSection(analytics.c_sub_section).setTemplateId(editorState.template?.ORIGINAL_ID).buildData();
			sendData(eventData);
		}
		async #setState(params) {
			if (!(await this.#isRendered())) {
				return;
			}
			if (main_core.Type.isStringFilled(params?.backend?.senderCode) && main_core.Type.isStringFilled(params?.backend.id)) {
				const chan = this.#editor.getOptions().channels.find(candidate => {
					const isSameBackend = candidate.backend.senderCode === params.backend.senderCode && candidate.backend.id === params.backend.id;
					if (main_core.Type.isStringFilled(params?.fromId)) {
						return isSameBackend && candidate.fromList.some(from => from.id === params.fromId);
					}
					return isSameBackend;
				});
				if (chan) {
					this.#editor.setChannel(chan.id);
					if (main_core.Type.isStringFilled(params?.fromId)) {
						this.#editor.setFrom(params.fromId);
					}
				}
			}
			if (main_core.Type.isPlainObject(params?.client)) {
				const toList = this.#editor.getOptions().toList ?? [];
				const to = toList.find(candidate => {
					return candidate.customData?.addressSource?.entityTypeId === params.client.entityTypeId && candidate.customData?.addressSource?.entityId === params.client.entityId && candidate.value === params.client.value;
				});
				if (to) {
					this.#editor.setTo(to.id);
				}
			}
			if (main_core.Type.isStringFilled(params?.text)) {
				this.#editor.setMessageText(params.text);
			}
			if (main_core.Type.isPlainObject(params?.template)) {
				this.#editor.setTemplate(params.template.ORIGINAL_ID);
				for (const placeholder of params.template?.FILLED_PLACEHOLDERS ?? []) {
					this.#editor.setFilledPlaceholder(placeholder);
				}
			}
		}
	}

	class Task extends Item {
		showSlider() {
			BX.CrmActivityEditor.getDefault().addTask({
				'ownerType': BX.CrmEntityType.resolveName(this.getEntityTypeId()),
				'ownerID': this.getEntityId(),
				'fromTimeline': true
			});
		}
		supportsLayout() {
			return false;
		}
	}

	const UserOptions = main_core.Reflection.namespace('BX.userOptions');

	/** @memberof BX.Crm.Timeline.MenuBar.ToDo */
	class Tour extends BaseTour {
		canShow() {
			const {
				guideBindElement
			} = this.getParams();
			const mainSection = document.querySelector('[data-tab-id="main"]');
			if (!mainSection || main_core.Dom.style(mainSection, 'display') === 'none') {
				return false;
			}
			const style = window.getComputedStyle(guideBindElement);
			return document.contains(guideBindElement) && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && guideBindElement.offsetWidth > 0 && guideBindElement.offsetHeight > 0;
		}
		saveUserOption(optionName = null) {
			UserOptions.save('crm', 'todo', 'isTimelineTourViewedInWeb', 1);
		}
	}

	const ARTICLE_CODE = '21064046';

	/** @memberof BX.Crm.Timeline.MenuBar */
	class ToDo extends Item {
		#toDoEditor = null;
		#todoEditorContainer = null;
		#saveButton = null;
		#isTourViewed = false;
		initialize(context, settings) {
			super.initialize(context, settings);
		}
		createLayout() {
			this.#todoEditorContainer = main_core.Tag.render`<div></div>`;
			this.#saveButton = main_core.Tag.render`<button onclick="${this.onSaveButtonClick.bind(this)}" class="ui-btn ui-btn-xs ui-btn-primary ui-btn-round ui-btn-disabled" >${main_core.Loc.getMessage('CRM_TIMELINE_SAVE_BUTTON')}</button>`;
			return main_core.Tag.render`
			<div class="crm-entity-stream-content-new-detail crm-entity-stream-content-new-detail-todo --hidden">
				${this.#todoEditorContainer}
				<div class="crm-entity-stream-content-new-comment-btn-container">
					${this.#saveButton}
					<span onclick="${this.onCancelButtonClick.bind(this)}"  class="ui-btn ui-btn-xs ui-btn-link">${main_core.Loc.getMessage('CRM_TIMELINE_CANCEL_BTN')}</span>
				</div>
			</div>
		`;
		}
		initializeLayout() {
			main_core.Dom.removeClass(this.#saveButton, 'ui-btn-disabled');
			this.#createEditor();
		}
		initializeSettings() {
			this.#isTourViewed = this.getSetting('isTourViewed');
		}
		onSaveButtonClick() {
			if (this.isLocked() || main_core.Dom.hasClass(this.#saveButton, 'ui-btn-disabled')) {
				return;
			}
			this.setLocked(true);
			this.save().then(() => this.setLocked(false), () => this.setLocked(false)).catch(() => this.setLocked(false));
		}
		onCancelButtonClick() {
			this.cancel();
			this.emitFinishEditEvent();
		}
		#createEditor() {
			const params = {
				container: this.#todoEditorContainer,
				defaultDescription: '',
				ownerTypeId: this.getEntityTypeId(),
				ownerId: this.getEntityId(),
				currentUser: this.getSetting('currentUser'),
				pingSettings: this.getSetting('pingSettings'),
				copilotSettings: this.getSetting('copilotSettings'),
				colorSettings: this.getSetting('colorSettings'),
				actionMenuSettings: this.getSetting('actionMenuSettings'),
				events: {
					onCollapsingToggle: event => {
						const {
							isOpen
						} = event.getData();
						this.setFocused(isOpen);
					}
				}
			};
			params.calendarSettings = this.getSetting('calendarSettings');
			const extras = this.getExtras();
			if (main_core.Type.isPlainObject(extras.analytics)) {
				params.analytics = {
					section: extras.analytics.c_section,
					subSection: extras.analytics.c_sub_section
				};
			}
			this.#toDoEditor = new crm_activity_todoEditorV2.TodoEditorV2(params);
			this.#toDoEditor.show();
		}
		save() {
			if (main_core.Dom.hasClass(this.#saveButton, 'ui-btn-disabled')) {
				return false;
			}
			return this.#toDoEditor.save().then(response => {
				if (main_core.Type.isArray(response.errors) && response.errors.length > 0) {
					return false;
				}
				this.cancel(false);
				this.emitFinishEditEvent();
				return true;
			});
		}
		cancel(sendAnalytics = true) {
			this.#toDoEditor.cancel({
				sendAnalytics
			});
			this.setFocused(false);
		}
		bindInputHandlers() {
			// do nothing
		}
		setParentActivityId(activityId) {
			this.#toDoEditor.setParentActivityId(activityId);
		}
		setDeadLine(deadLine) {
			this.#toDoEditor.setDeadline(deadLine);
		}
		setDescription(description) {
			this.#toDoEditor.setDescription(description);
		}
		focus() {
			this.#toDoEditor.setFocused();
		}
		setVisible(visible) {
			super.setVisible(visible);
			if (visible) {
				this.showTour();
			}
		}
		showTour() {
			if (!this.isVisible()) {
				return;
			}
			const guideBindElementClass = '.crm-activity__todo-show-actions-popup-button';
			const guideBindElement = document.querySelector(guideBindElementClass);
			if (guideBindElement && !this.#isTourViewed && !BX.Crm.EntityEditor.getDefault().isNew()) {
				const tour = new Tour({
					itemCode: 'todo',
					title: main_core.Loc.getMessage('CRM_TIMELINE_TODO_GUIDE_TITLE'),
					text: main_core.Loc.getMessage('CRM_TIMELINE_TODO_GUIDE_TEXT'),
					articleCode: ARTICLE_CODE,
					userOptionName: 'isTimelineTourViewedInWeb',
					guideBindElement
				});
				setTimeout(() => {
					crm_tourManager.TourManager.getInstance().registerWithLaunch(tour);
				});
			}
		}
	}

	class Visit extends Item {
		showSlider() {
			const visitParameters = this.getSettings() ?? {};
			visitParameters['OWNER_TYPE'] = BX.CrmEntityType.resolveName(this.getEntityTypeId());
			visitParameters['OWNER_ID'] = this.getEntityId();
			BX.CrmActivityVisit.create(visitParameters).showEdit();
		}
		supportsLayout() {
			return false;
		}
	}

	const WaitingType = {
		undefined: 0,
		after: 1,
		before: 2,
		names: {
			after: 'after',
			before: 'before'
		},
		resolveTypeId(name) {
			if (name === this.names.after) {
				return this.after;
			} else if (name === this.names.before) {
				return this.before;
			}
			return this.undefined;
		}
	};

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	/** @memberof BX.Crm.Timeline.Tools */
	class WaitConfigurationDialog {
		_popup = null;
		_menuId = null;
		constructor() {
			this._id = '';
			this._settings = {};
			this._type = WaitingType.undefined;
			this._duration = 0;
			this._target = '';
			this._targetDates = [];
			this._container = null;
			this._durationInput = null;
			this._targetDateNode = null;
			this._popup = null;
		}
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings || {};
			this._type = BX.prop.getInteger(this._settings, 'type', WaitingType.after);
			this._duration = BX.prop.getInteger(this._settings, 'duration', 1);
			this._target = BX.prop.getString(this._settings, 'target', '');
			this._targetDates = BX.prop.getArray(this._settings, 'targetDates', []);
			this._menuId = `${this._id}_target_date_sel`;
		}
		getId() {
			return this._id;
		}
		getType() {
			return this._type;
		}
		setType(type) {
			this._type = type;
		}
		getDuration() {
			return this._duration;
		}
		setDuration(duration) {
			this._duration = duration;
		}
		getTarget() {
			return this._target;
		}
		setTarget(target) {
			this._target = target;
		}
		getMessage(name) {
			const messages = WaitConfigurationDialog.messages;
			return Object.prototype.hasOwnProperty.call(messages, name) ? messages[name] : name;
		}
		getTargetDateCaption() {
			return this._targetDates.find(targetDate => targetDate.name === this._target)?.caption ?? '';
		}
		isBeforeWaitingType() {
			return this.getType() === WaitingType.before;
		}
		open() {
			this._popup = new BX.PopupWindow(this._id, null,
			// this._configSelector,
			{
				autoHide: true,
				draggable: false,
				bindOptions: {
					forceBindPosition: false
				},
				closeByEsc: true,
				zIndex: 0,
				content: this.renderDialogContent(),
				events: {
					onPopupShow: this.onPopupShow.bind(this),
					onPopupClose: this.onPopupClose.bind(this),
					onPopupDestroy: this.onPopupDestroy.bind(this)
				},
				buttons: [new BX.PopupWindowButton({
					text: main_core.Loc.getMessage('CRM_TIMELINE_CHOOSE'),
					className: 'popup-window-button-accept',
					events: {
						click: this.onSaveButtonClick.bind(this)
					}
				}), new BX.PopupWindowButtonLink({
					text: main_core.Loc.getMessage('JS_CORE_WINDOW_CANCEL'),
					events: {
						click: this.onCancelButtonClick.bind(this)
					}
				})]
			});
			this._popup.show();
		}
		close() {
			if (this._popup) {
				this._popup.close();
			}
		}
		renderDialogContent() {
			const container = this.getContainer();
			container.innerHTML = '';
			const wrapper = main_core.Tag.render`<div class="crm-wait-popup-select-wrapper"></div>`;
			const contentTextNode = this.getContentTextNode();
			this.appendDurationInput(contentTextNode);
			this.appendTargetDateNode(contentTextNode);
			main_core.Dom.append(contentTextNode, wrapper);
			main_core.Dom.append(wrapper, container);
			return container;
		}
		getContainer() {
			if (!this._container) {
				this._container = main_core.Tag.render`<div class="crm-wait-popup-select-block"></div>`;
			}
			return this._container;
		}
		getContentTextNode() {
			const phraseCode = this.isBeforeWaitingType() ? 'CRM_TIMELINE_WAIT_CONFIG_DIALOG_BEFORE_CONTENT_TEXT' : 'CRM_TIMELINE_WAIT_CONFIG_DIALOG_AFTER_CONTENT_TEXT';

			// put a container so that in the future you can put the input there
			const replacement = {
				'#DAY_INPUT#': `<span class="crm-wait-duration-input-container" id="${this.getDurationInputContainerId()}"></span>`,
				'#TARGET_DATE#': this.isBeforeWaitingType() ? `<span class="crm-wait-target-date-container" id="${this.getTargetDateNodeContainerId()}"></span>` : null
			};
			return main_core.Tag.render`
			<span class="crm-wait-text-wrapper crm-wait-popup-settings-title">
				${main_core.Loc.getMessagePlural(phraseCode, this.getDuration(), replacement)}
			</span>
		`;
		}
		getDurationInputContainerId() {
			return `crm-wait-duration-input-container-${this.getId()}`;
		}
		getDurationInput() {
			if (!this._durationInput) {
				this._durationInput = main_core.Tag.render`
				<input type="text" class="crm-wait-popup-settings-input" value="${this.getDuration()}">
			`;
				this._durationInput.onkeyup = main_core.Runtime.debounce(this.onDurationChange.bind(this), 300);
			}
			return this._durationInput;
		}
		appendDurationInput(contentTextNode) {
			const containerId = this.getDurationInputContainerId();
			const container = contentTextNode.querySelector(`#${containerId}`);
			main_core.Dom.append(this.getDurationInput(), container);
		}
		onDurationChange() {
			let duration = parseInt(this.getDurationInput().value, 10);
			if (Number.isNaN(duration) || duration <= 0) {
				duration = 1;
			}
			this._duration = duration;
			this.renderDialogContent();
			this.getDurationInput().focus();
		}
		getTargetDateNodeContainerId() {
			return `crm-wait-configuration-dialog-target-date-container-${this.getId()}`;
		}
		getTargetDateNode() {
			if (!this._targetDateNode) {
				this._targetDateNode = main_core.Tag.render`
				<span class="crm-automation-popup-settings-link">
					${main_core.Text.encode(this.getTargetDateCaption(this._target))}
				</span>
			`;
				this._targetDateNode.onclick = this.toggleTargetMenu.bind(this);
			}
			return this._targetDateNode;
		}
		appendTargetDateNode(contentTextNode) {
			if (!this.isBeforeWaitingType()) {
				return;
			}
			const containerId = this.getTargetDateNodeContainerId();
			const container = contentTextNode.querySelector(`#${containerId}`);
			main_core.Dom.append(this.getTargetDateNode(), container);
		}
		toggleTargetMenu() {
			if (this.isTargetMenuOpened()) {
				this.closeTargetMenu();
			} else {
				this.openTargetMenu();
			}
		}
		isTargetMenuOpened() {
			return Boolean(BX.PopupMenu.getMenuById(this._menuId));
		}
		openTargetMenu() {
			const menuItems = [];
			let i = 0;
			const length = this._targetDates.length;
			for (; i < length; i++) {
				const info = this._targetDates[i];
				menuItems.push({
					text: info.caption,
					title: info.caption,
					value: info.name,
					onclick: this.onTargetSelect.bind(this)
				});
			}
			BX.PopupMenu.show(this._menuId, this._targetDateNode, menuItems, {
				zIndex: 200,
				autoHide: true,
				offsetLeft: main_core.Dom.getPosition(this.getTargetDateNode()).width / 2,
				angle: {
					position: 'top',
					offset: 0
				}
			});
		}
		closeTargetMenu() {
			BX.PopupMenu.destroy(this._menuId);
		}
		onPopupShow(e, item) {}
		onPopupClose() {
			if (this._popup) {
				this._popup.destroy();
			}
			this.closeTargetMenu();
		}
		onPopupDestroy() {
			if (this._popup) {
				this._popup = null;
			}
		}
		onSaveButtonClick(e) {
			this.onDurationChange();
			const callback = BX.prop.getFunction(this._settings, 'onSave', null);
			if (!callback) {
				return;
			}
			callback(this, {
				type: this.getType(),
				duration: this.getDuration(),
				target: this.isBeforeWaitingType() ? this.getTarget() : ''
			});
		}
		onCancelButtonClick(e) {
			const callback = BX.prop.getFunction(this._settings, 'onCancel', null);
			if (callback) {
				callback(this);
			}
		}
		onTargetSelect(e, item) {
			const fieldName = BX.prop.getString(item, 'value', '');
			if (fieldName !== '') {
				this._target = fieldName;
				this._targetDateNode.innerHTML = BX.util.htmlspecialchars(this.getTargetDateCaption(fieldName));
			}
			this.closeTargetMenu();
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
		}
		static create(id, settings) {
			const self = new WaitConfigurationDialog();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.MenuBar */
	class Wait extends WithEditor {
		#waitConfigContainer = null;
		createLayout() {
			this.#waitConfigContainer = main_core.Tag.render`<div class="crm-entity-stream-content-wait-conditions"></div>`;
			this._saveButton = main_core.Tag.render`<button onclick="${this.onSaveButtonClick.bind(this)}" class="ui-btn ui-btn-xs ui-btn-primary ui-btn-round" >${main_core.Loc.getMessage('CRM_TIMELINE_CREATE_WAITING')}</button>`;
			this._cancelButton = main_core.Tag.render`<span onclick="${this.onCancelButtonClick.bind(this)}"  class="ui-btn ui-btn-xs ui-btn-link">${main_core.Loc.getMessage('CRM_TIMELINE_CANCEL_BTN')}</span>`;
			this._input = main_core.Tag.render`<textarea rows="1" class="crm-entity-stream-content-wait-comment-textarea" placeholder="${main_core.Loc.getMessage('CRM_TIMELINE_WAIT_PLACEHOLDER')}"></textarea>`;
			return main_core.Tag.render`<div class="crm-entity-stream-content-wait-detail --focus --hidden">
			<div class="crm-entity-stream-content-wait-conditions-container">
				${this.#waitConfigContainer}
			</div>
			${this._input}
			<div class="crm-entity-stream-content-wait-comment-btn-container">
				${this._saveButton}
				${this._cancelButton}
			</div>
		</div>`;
		}
		doInitialize() {
			this._isRequestRunning = false;
			this._isLocked = false;
			this._hideButtonsOnBlur = false;
			//region Config
			this._type = WaitingType.after;
			this._duration = 1;
			this._target = "";
			this._configSelector = null;
			//endregion

			this._isMenuShown = false;
			this._menu = null;
			this._configDialog = null;
			this._serviceUrl = this.getSetting('serviceUrl', '');
			const config = this.getSetting('config', {});
			this._type = WaitingType.resolveTypeId(BX.prop.getString(config, 'type', WaitingType.names.after));
			this._duration = BX.prop.getInteger(config, 'duration', 1);
			this._target = BX.prop.getString(config, 'target', '');
			this._targetDates = this.getSetting('targetDates', []);
			this.layoutConfigurationSummary();
		}
		getDurationText(duration, enableNumber) {
			return Wait.Helper.getDurationText(duration, enableNumber);
		}
		getTargetDateCaption(name) {
			let i = 0;
			const length = this._targetDates.length;
			for (; i < length; i++) {
				const info = this._targetDates[i];
				if (info["name"] === name) {
					return info["caption"];
				}
			}
			return "";
		}
		onSelectorClick(e) {
			if (!this._isMenuShown) {
				this.openMenu();
			} else {
				this.closeMenu();
			}
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
		}
		openMenu() {
			if (this._isMenuShown) {
				return;
			}
			const handler = BX.delegate(this.onMenuItemClick, this);
			const menuItems = [{
				id: "day_1",
				text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_1D'),
				onclick: handler
			}, {
				id: "day_2",
				text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_2D'),
				onclick: handler
			}, {
				id: "day_3",
				text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_3D'),
				onclick: handler
			}, {
				id: "week_1",
				text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_1W'),
				onclick: handler
			}, {
				id: "week_2",
				text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_2W'),
				onclick: handler
			}, {
				id: "week_3",
				text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_3W'),
				onclick: handler
			}];
			const customMenu = {
				id: "custom",
				text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_CUSTOM'),
				items: []
			};
			customMenu["items"].push({
				id: "afterDays",
				text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_AFTER_CUSTOM_DAYS'),
				onclick: handler
			});
			if (this._targetDates.length > 0) {
				customMenu["items"].push({
					id: "beforeDate",
					text: main_core.Loc.getMessage('CRM_TIMELINE_WAIT_BEFORE_CUSTOM_DATE'),
					onclick: handler
				});
			}
			menuItems.push(customMenu);
			BX.PopupMenu.show(this._id, this._configSelector, menuItems, {
				offsetTop: 0,
				offsetLeft: 36,
				angle: {
					position: "top",
					offset: 0
				},
				events: {
					onPopupShow: BX.delegate(this.onMenuShow, this),
					onPopupClose: BX.delegate(this.onMenuClose, this),
					onPopupDestroy: BX.delegate(this.onMenuDestroy, this)
				}
			});
			this._menu = BX.PopupMenu.currentItem;
		}
		closeMenu() {
			if (!this._isMenuShown) {
				return;
			}
			if (this._menu) {
				this._menu.close();
			}
		}
		onMenuItemClick(e, item) {
			this.closeMenu();
			if (item.id === "afterDays" || item.id === "beforeDate") {
				this.openConfigDialog(item.id === "afterDays" ? WaitingType.after : WaitingType.before);
				return;
			}
			const params = {
				type: WaitingType.after
			};
			if (item.id === "day_1") {
				params["duration"] = 1;
			} else if (item.id === "day_2") {
				params["duration"] = 2;
			} else if (item.id === "day_3") {
				params["duration"] = 3;
			}
			if (item.id === "week_1") {
				params["duration"] = 7;
			} else if (item.id === "week_2") {
				params["duration"] = 14;
			} else if (item.id === "week_3") {
				params["duration"] = 21;
			}
			this.saveConfiguration(params);
		}
		openConfigDialog(type) {
			if (!this._configDialog) {
				this._configDialog = WaitConfigurationDialog.create("", {
					targetDates: this._targetDates,
					onSave: BX.delegate(this.onConfigDialogSave, this),
					onCancel: BX.delegate(this.onConfigDialogCancel, this)
				});
			}
			this._configDialog.setType(type);
			this._configDialog.setDuration(this._duration);
			let target = this._target;
			if (target === "" && this._targetDates.length > 0) {
				target = this._targetDates[0]["name"];
			}
			this._configDialog.setTarget(target);
			this._configDialog.open();
		}
		onConfigDialogSave(sender, params) {
			this.saveConfiguration(params);
			this._configDialog.close();
		}
		onConfigDialogCancel(sender) {
			this._configDialog.close();
		}
		onMenuShow() {
			this._isMenuShown = true;
		}
		onMenuClose() {
			if (this._menu && this._menu.popupWindow) {
				this._menu.popupWindow.destroy();
			}
		}
		onMenuDestroy() {
			this._isMenuShown = false;
			this._menu = null;
			if (typeof BX.PopupMenu.Data[this._id] !== "undefined") {
				delete BX.PopupMenu.Data[this._id];
			}
		}
		saveConfiguration(params) {
			//region Parse params
			this._type = BX.prop.getInteger(params, "type", WaitingType.after);
			this._duration = BX.prop.getInteger(params, "duration", 0);
			if (this._duration <= 0) {
				this._duration = 1;
			}
			this._target = this._type === WaitingType.before ? BX.prop.getString(params, "target", "") : "";
			//endregion
			//region Save settings
			const optionName = this.getSetting('optionName');
			BX.userOptions.save("crm.timeline.wait", optionName, "type", this._type === WaitingType.after ? "after" : "before");
			BX.userOptions.save("crm.timeline.wait", optionName, "duration", this._duration);
			BX.userOptions.save("crm.timeline.wait", optionName, "target", this._target);
			//endregion
			this.layoutConfigurationSummary();
		}
		getSummaryHtml() {
			if (this._type === WaitingType.before) {
				return main_core.Loc.getMessage('CRM_TIMELINE_WAIT_COMPLETION_TYPE_BEFORE').replace("#DURATION#", this.getDurationText(this._duration, true)).replace("#TARGET_DATE#", this.getTargetDateCaption(this._target));
			}
			return main_core.Loc.getMessage('CRM_TIMELINE_WAIT_COMPLETION_TYPE_AFTER').replace("#DURATION#", this.getDurationText(this._duration, true));
		}
		getSummaryText() {
			return BX.util.strip_tags(this.getSummaryHtml());
		}
		layoutConfigurationSummary() {
			this.#waitConfigContainer.innerHTML = this.getSummaryHtml();
			this._configSelector = this.#waitConfigContainer.querySelector("a");
			if (this._configSelector) {
				BX.bind(this._configSelector, 'click', this.onSelectorClick.bind(this));
			}
		}
		postpone(id, offset, callback) {
			BX.ajax({
				url: this._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "POSTPONE_WAIT",
					"DATA": {
						"ID": id,
						"OFFSET": offset
					}
				},
				onsuccess: callback
			});
		}
		complete(id, completed, callback) {
			BX.ajax({
				url: this._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "COMPLETE_WAIT",
					"DATA": {
						"ID": id,
						"COMPLETED": completed ? 'Y' : 'N'
					}
				},
				onsuccess: callback
			});
		}
		save() {
			if (this._isRequestRunning || this._isLocked) {
				return;
			}
			let description = this.getSummaryText();
			const comment = BX.util.trim(this._input.value);
			if (comment !== "") {
				description += "\n" + comment;
			}
			const data = {
				ID: 0,
				typeId: this._type,
				duration: this._duration,
				targetFieldName: this._target,
				subject: "",
				description: description,
				completed: 0,
				ownerType: BX.CrmEntityType.resolveName(this.getEntityTypeId()),
				ownerID: this.getEntityId()
			};
			BX.ajax({
				url: this._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "SAVE_WAIT",
					"DATA": data
				},
				onsuccess: BX.delegate(this.onSaveSuccess, this),
				onfailure: BX.delegate(this.onSaveFailure, this)
			});
			this._isRequestRunning = this._isLocked = true;
		}
		cancel() {
			this._input.value = "";
			this._input.style.minHeight = "";
			this.release();
		}
		onSaveSuccess(data) {
			this._isRequestRunning = this._isLocked = false;
			const error = BX.prop.getString(data, "ERROR", "");
			if (error !== "") {
				alert(error);
				return;
			}
			this._input.value = "";
			this._input.style.minHeight = "";
			this.emitFinishEditEvent();
			this.release();
		}
		onSaveFailure() {
			this._isRequestRunning = this._isLocked = false;
		}
		getMessage(name) {
			const m = Wait.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static WaitingType = WaitingType;
		static messages = {};
		static Helper = {
			getDurationText: function (duration, enableNumber) {
				enableNumber = !!enableNumber;
				let result = "";
				let type = "D";
				if (enableNumber) {
					if (duration % 7 === 0) {
						duration = duration / 7;
						type = "W";
					}
				}
				if (type === "W") {
					result = BX.Loc.getMessagePlural('CRM_TIMELINE_WAIT_WEEK', duration);
				} else {
					result = BX.Loc.getMessagePlural('CRM_TIMELINE_WAIT_DAY', duration);
				}
				if (enableNumber) {
					result = duration.toString() + " " + result;
				}
				return result;
			},
			getMessage: function (name) {
				return Wait.Helper.messages.hasOwnProperty(name) ? Wait.Helper.messages[name] : name;
			},
			messages: {}
		};
	}

	class Zoom extends Item {
		#editor = null;
		showSlider() {
			if (this.getSetting('isAvailable')) {
				BX.Crm.Zoom.onNotConnectedHandler(main_core.Loc.getMessage('USER_ID'));
			} else
				// not available
				{
					BX.Crm.Zoom.onNotAvailableHandler();
				}
		}
		supportsLayout() {
			return this.getSetting('isConnected') && this.getSetting('isAvailable');
		}
		createLayout() {
			return main_core.Tag.render`<div class="crm-entity-stream-content-new-detail ui-timeline-zoom-editor --focus --hidden"></div>`;
		}
		onFocus(e) {
			this.setFocused(true);
		}
		onShow() {
			if (!this.#editor) {
				this.#createEditor();
			}
		}
		#createEditor() {
			this.#editor = new crm_zoom.Zoom({
				ownerTypeId: this.getEntityTypeId(),
				ownerId: this.getEntityId(),
				container: this.getContainer(),
				onFinishEdit: this.#onFinishEdit.bind(this),
				onStartSave: () => this.setLocked(true),
				onFinishSave: () => this.setLocked(false)
			});
		}
		#onFinishEdit() {
			this.emitFinishEditEvent();
		}
	}

	class Factory {
		static createItem(id, context, settings) {
			let item = null;
			switch (id) {
				case 'todo':
					item = new ToDo();
					break;
				case 'comment':
					item = new Comment();
					break;
				case 'message':
					item = new Message();
					break;
				case 'gotochat':
					item = new GoToChat();
					break;
				case 'call':
					item = new Call();
					break;
				case 'email':
					item = new Email();
					break;
				case 'meeting':
					item = new Meeting();
					break;
				case 'task':
					item = new Task();
					break;
				case 'sharing':
					item = new Sharing();
					break;
				case 'wait':
					item = new Wait();
					break;
				case 'zoom':
					item = new Zoom();
					break;
				case 'delivery':
					item = new Delivery();
					break;
				case 'visit':
					item = new Visit();
					break;
				case 'activity_rest_applist':
					item = new Market();
					break;
				case 'einvoice_app_installer':
					item = new EInvoiceApp();
					break;
				case 'booking':
					item = new Booking();
					break;
				default:
					item = null;
			}
			if (!item && id.startsWith('activity_rest_')) {
				if (main_core.Type.isPlainObject(settings) && main_core.Type.isBoolean(settings.useBuiltInInterface) && settings.useBuiltInInterface) {
					item = new WithLayout();
				} else {
					item = new WithSlider();
				}
			}
			if (item) {
				item.initialize(context, settings);
			}
			return item;
		}
	}

	/** @memberof BX.Crm.Timeline.MenuBar */

	class MenuBar {
		#entityTypeId = null;
		#entityId = null;
		#entityCategoryId = null;
		#isReadonly = false;
		#container = null;
		#items = {};
		#extras = {};
		#selectedItemId = null;
		#menu = null;
		constructor(id, params) {
			this.#entityTypeId = params.entityTypeId;
			this.#entityId = params.entityId;
			this.#entityCategoryId = params.entityCategoryId;
			this.#isReadonly = params.isReadonly;
			this.#extras = params.extras ?? {};
			this.#container = document.getElementById(params.containerId);
			const menuId = params.menuId ?? (BX.CrmEntityType.resolveName(this.#entityTypeId) + '_menu').toLowerCase();
			this.#menu = BX.Main.interfaceButtonsManager.getById(menuId);
			const context = new Context({
				entityTypeId: this.#entityTypeId,
				entityId: this.#entityId,
				entityCategoryId: this.#entityCategoryId,
				isReadonly: this.#isReadonly,
				menuBarContainer: this.#container,
				extras: this.#extras
			});
			params.items.forEach(itemData => {
				const id = itemData.id;
				const item = Factory.createItem(id, context, itemData.settings ?? null);
				if (item) {
					item.addFinishEditListener(this.#onItemFinishEdit.bind(this));
					this.#items[id] = item;
				}
			});
			this.setActiveItemById(this.getFirstItemIdWithLayout());
		}
		getItemById(id) {
			return this.#items[id] ?? null;
		}
		getContainer() {
			return this.#container;
		}
		onMenuItemClick(selectedItemId) {
			if (this.#isReadonly) {
				return;
			}
			this.setActiveItemById(selectedItemId);
		}
		setActiveItemById(selectedItemId) {
			if (!selectedItemId || this.#selectedItemId === selectedItemId) {
				return false;
			}
			const menuBarItem = this.#items[selectedItemId];
			if (!menuBarItem) {
				return false;
			}
			menuBarItem.activate();
			if (!this.#isReadonly && menuBarItem.supportsLayout()) {
				Object.keys(this.#items).forEach(itemId => {
					if (itemId !== selectedItemId) {
						this.#items[itemId].deactivate();
					}
				});
				this.#selectMenuItem(selectedItemId);
				this.#selectedItemId = selectedItemId;
				return true;
			}
			return false;
		}
		scrollIntoView() {
			this.getContainer().scrollIntoView({
				behavior: 'smooth',
				block: 'end',
				inline: 'nearest'
			});
		}
		#onItemFinishEdit() {
			this.setActiveItemById(this.getFirstItemIdWithLayout());
		}
		getFirstItemIdWithLayout() {
			if (this.#isReadonly) {
				return null;
			}
			let firstId = null;
			this.#menu.getAllItems().forEach(function (itemElement) {
				if (firstId === null) {
					const id = itemElement.dataset.id;
					const item = this.#items[id];
					if (item && item.supportsLayout()) {
						firstId = id;
					}
				}
			}.bind(this));
			return firstId;
		}
		static create(id, params) {
			const self = new MenuBar(id, params);
			MenuBar.instances[id] = self;
			return self;
		}
		static getDefault() {
			return MenuBar.#defaultInstance;
		}
		static setDefault(instance) {
			MenuBar.#defaultInstance = instance;
		}
		static getById(id) {
			return MenuBar.instances[id] || null;
		}
		static #defaultInstance = null;
		static instances = {};
		#selectMenuItem(id) {
			const activeItem = this.#menu.getItemById(this.#selectedItemId);
			const currentDiv = this.#menu.getItemById(id);
			let wasActiveInMoreMenu = false;
			if (currentDiv && activeItem !== currentDiv) {
				wasActiveInMoreMenu = this.#menu.isActiveInMoreMenu();
				main_core.Dom.addClass(currentDiv, this.#menu.classes.itemActive);
				if (this.#menu.getItemData) {
					const currentDivData = this.#menu.getItemData(currentDiv);
					currentDivData['IS_ACTIVE'] = true;
					if (BX.type.isDomNode(activeItem)) {
						main_core.Dom.removeClass(activeItem, this.#menu.classes.itemActive);
						const activeItemData = this.#menu.getItemData(activeItem);
						activeItemData['IS_ACTIVE'] = false;
					}
				}
				const isActiveInMoreMenu = this.#menu.isActiveInMoreMenu();
				if (isActiveInMoreMenu || wasActiveInMoreMenu) {
					const submenu = this.#menu.getSubmenu();
					if (submenu) {
						submenu.getMenuItems().forEach(menuItem => {
							const container = menuItem.getContainer();
							if (isActiveInMoreMenu && container.title === currentDiv.title) {
								main_core.Dom.addClass(container, this.#menu.classes.itemActive);
							} else if (wasActiveInMoreMenu && container.title === activeItem.title) {
								main_core.Dom.removeClass(container, this.#menu.classes.itemActive);
							}
						});
					}
					if (isActiveInMoreMenu) {
						main_core.Dom.addClass(this.#menu.getMoreButton(), this.#menu.classes.itemActive);
					} else if (wasActiveInMoreMenu) {
						main_core.Dom.removeClass(this.#menu.getMoreButton(), this.#menu.classes.itemActive);
					}
				}
			}
			this.#menu.closeSubmenu();
		}
	}

	exports.Item = Item;
	exports.MenuBar = MenuBar;

})(this.BX.Crm.Timeline = this.BX.Crm.Timeline || {}, BX, BX.Event, BX.UI.Notification, BX.Vue3, BX.Crm.Integration.UI, BX.Crm, BX.UI.Tour, BX.UI.Analytics, BX, BX.UI, BX.Crm, BX.Crm.Integration.Analytics, BX.Crm.MessageSender, BX, BX.Main, BX.UI.EntitySelector, window, window, window, BX.UI.IconSet, BX.Calendar.Sharing, BX.Calendar.Sharing, BX.Crm.Activity, BX, BX.Crm);
//# sourceMappingURL=toolbar.bundle.js.map
