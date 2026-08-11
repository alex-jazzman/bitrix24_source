/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ai_engine, main_core, main_core_events, main_popup, ai_ajaxErrorHandler, ui_iconSet_api_core, main_loader, ui_buttons) {
	'use strict';

	class BaseCommand {
		constructor(options) {
			this.copilotImageController = options.copilotImageController;
		}
		execute() {
			throw new Error('You must implement this method!');
		}
	}

	class CancelImageCommand extends BaseCommand {
		#inputField;
		#copilotContainer;
		constructor(options) {
			super(options);
			this.#copilotContainer = options.copilotContainer;
			this.#inputField = options.inputField;
		}
		execute() {
			this.copilotImageController.emit('cancel');
			this.copilotImageController.destroyAllMenus();
			this.copilotImageController.showImageConfigurator();
			this.#inputField.clearErrors();
			this.#inputField.clear();
			this.#inputField.enable();
			main_core.Dom.removeClass(this.#copilotContainer, '--error');
			// this.#selectedCommand = null;
			// this.#resultStack = [];
			this.#inputField.focus();
			this.copilotImageController.getAnalytics().sendEventCancel();
		}
	}

	class PlaceImageUnderCommand extends BaseCommand {
		execute() {
			this.copilotImageController.emit('place-under');
		}
	}

	class PlaceImageAboveCommand extends BaseCommand {
		execute() {
			this.copilotImageController.emit('place-above');
		}
	}

	class SaveImageCommand extends BaseCommand {
		execute() {
			this.copilotImageController.emit('save', new main_core_events.BaseEvent({
				data: {
					imageUrl: this.copilotImageController.getResultImageUrl()
				}
			}));
			this.copilotImageController.getAnalytics().sendEventSave();
		}
	}

	class RepeatImageCompletion extends BaseCommand {
		execute() {
			this.copilotImageController.completions();
		}
	}

	class ImageConfiguratorErrorMenuItems {
		static getMenuItems(options) {
			const copilotImageController = options.copilotImageController;
			const inputField = options.inputField;
			const copilotContainer = options.copilotContainer;
			return [{
				code: 'repeat',
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_REPEAT'),
				icon: 'left-semicircular-anticlockwise-arrow-1',
				notHighlight: true,
				command: new RepeatImageCompletion({
					copilotImageController
				})
			}, {
				code: 'cancel',
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_CANCEL'),
				icon: 'cross-45',
				notHighlight: true,
				command: new CancelImageCommand({
					copilotImageController,
					inputField,
					copilotContainer
				})
			}];
		}
	}

	class ImageConfiguratorResultMenuItems {
		static getMenuItems(options) {
			const copilotImageController = options?.copilotImageController;
			const inputField = options.inputField;
			const useAboveAndUnderTextMenuItems = options.useInsertAboveAndUnderMenuItems;
			return [{
				code: 'save',
				text: main_core.Loc.getMessage('AI_COPILOT_IMAGE_RESULT_MENU_SAVE'),
				icon: ui_iconSet_api_core.Main.CHECK,
				notHighlight: true,
				command: new SaveImageCommand({
					copilotImageController
				})
			}, useAboveAndUnderTextMenuItems ? {
				code: 'place_above',
				text: main_core.Loc.getMessage('AI_COPILOT_IMAGE_RESULT_MENU_PLACE_ABOVE_TEXT'),
				icon: ui_iconSet_api_core.Actions.ARROW_TOP,
				notHighlight: true,
				command: new PlaceImageAboveCommand({
					copilotImageController
				})
			} : null, useAboveAndUnderTextMenuItems ? {
				code: 'place_under',
				text: main_core.Loc.getMessage('AI_COPILOT_IMAGE_RESULT_MENU_PLACE_UNDER_TEXT'),
				icon: ui_iconSet_api_core.Actions.ARROW_DOWN,
				notHighlight: true,
				command: new PlaceImageUnderCommand({
					copilotImageController
				})
			} : null, {
				code: 'repeat',
				text: main_core.Loc.getMessage('AI_COPILOT_IMAGE_RESULT_MENU_REPEAT'),
				icon: ui_iconSet_api_core.Actions.LEFT_SEMICIRCULAR_ANTICLOCKWISE_ARROW_1,
				notHighlight: true,
				command: new RepeatImageCompletion({
					copilotImageController
				})
			}, {
				separator: true
			}, {
				code: 'cancel',
				text: main_core.Loc.getMessage('AI_COPILOT_IMAGE_RESULT_MENU_CANCEL'),
				icon: ui_iconSet_api_core.Actions.CROSS_45,
				notHighlight: true,
				command: new CancelImageCommand({
					copilotImageController,
					inputField
				})
			}].filter(item => Boolean(item));
		}
	}

	const ImageConfiguratorStylesEvents = Object.freeze({
		select: 'select'
	});
	class ImageConfiguratorStyles extends main_core_events.EventEmitter {
		#mainStylesCount = 0;
		#currentMainStylesCount = 9;
		#selectedStyle = null;
		#isExpanded = false;
		#styleList = null;
		#container = null;
		#styles;
		constructor(options) {
			super(options);
			this.#styles = options.styles;
			this.#mainStylesCount = this.#styles.length;
			this.#selectedStyle = this.#styles[0].code;
			this.setEventNamespace('AI.Copilot.ImageConfiguratorStyles');
		}
		getSelectedStyle() {
			return this.#selectedStyle;
		}
		render() {
			this.#container = main_core.Tag.render`
			<div class="ai__image-configurator-styles">
				${this.#renderHeader()}
				${this.#renderStylesList()}
			</div>
		`;
			requestAnimationFrame(() => {
				const styleListStyles = getComputedStyle(this.#styleList);
				const paddingTop = styleListStyles.getPropertyValue('padding-top');
				const paddingBottom = styleListStyles.getPropertyValue('padding-bottom');
				const padding = parseFloat(paddingTop) + parseFloat(paddingBottom);
				main_core.Dom.style(this.#styleList, 'height', `${this.#styleList.offsetHeight - padding + 4}px`);
			});
			return this.#container;
		}
		#renderHeader() {
			const expandListBtn = this.#isShowExpandBtn() ? this.#renderExpandListBtn() : null;
			return main_core.Tag.render`
			<header class="ai__image-configurator-styles_header">
				<div
					class="ai__image-configurator-styles_title"
					title="${main_core.Loc.getMessage('AI_COPILOT_IMAGE_POPULAR_STYLES')}"
				>
					${main_core.Loc.getMessage('AI_COPILOT_IMAGE_POPULAR_STYLES')}
				</div>
				${expandListBtn}
			</header>
		`;
		}
		#isShowExpandBtn() {
			return this.#mainStylesCount > this.#currentMainStylesCount;
		}
		#renderExpandListBtn() {
			const expandListBtn = main_core.Tag.render`
			<div
				class="ai__image-configurator-styles_all-styles"
				title="${main_core.Loc.getMessage('AI_COPILOT_IMAGE_ALL_STYLES')}"
			>
				${main_core.Loc.getMessage('AI_COPILOT_IMAGE_ALL_STYLES')}
			</div>
		`;
			main_core.Event.bind(expandListBtn, 'click', () => {
				this.#isExpanded = !this.#isExpanded;
				if (this.#isExpanded) {
					main_core.Dom.addClass(this.#styleList, '--expanded');
					this.#currentMainStylesCount = Object.values(this.#styles).length;
					this.#styleList.innerHTML = '';
					this.#styleList.append(...this.#renderStyleItems());
				} else {
					main_core.Dom.removeClass(this.#styleList, '--expanded');
				}
			});
			return expandListBtn;
		}
		#renderStylesList() {
			this.#styleList = main_core.Tag.render`
			<div class="ai__image-configurator-styles_list">
				${this.#renderStyleItems()}
			</div>
		`;
			return this.#styleList;
		}
		#renderStyleItems() {
			return this.#styles.slice(0, this.#currentMainStylesCount).map(styleItem => {
				return this.#renderStyleItem(styleItem);
			});
		}
		#renderStyleItem(style) {
			const radioButton = main_core.Tag.render`
			<input
				${style.code === this.#selectedStyle ? 'checked' : ''}
				id="${style.code}"
				name="ai__image-configurator-style"
				type="radio"
				class="ai__image-configurator-style_item-radio-btn"
			/>
		`;
			const item = main_core.Tag.render`
			<div
				title="${style.name}"
				class="ai__image-configurator-styles_item"
			>
				${radioButton}
				<label
					for="${style.code}"
					class="ai__image-configurator-styles_item-inner"
					style="background-image: url(${style.preview})"
				>
					<div class="ai__image-configurator-styles_item-title">${style.name}</div>
				</label>
			</div>
		`;
			main_core.Event.bind(radioButton, 'input', () => {
				this.#selectedStyle = style.code;
				this.emit(ImageConfiguratorStylesEvents.select, new main_core_events.BaseEvent({
					data: style.code
				}));
			});
			return item;
		}
	}

	const getParams = options => {
		return {
			format: {
				title: main_core.Loc.getMessage('AI_COPILOT_IMAGE_FORMAT_OPTION_TITLE'),
				icon: ui_iconSet_api_core.Editor.INCERT_IMAGE,
				options: getOptionsFromFormats(options.formats)
			},
			engine: {
				title: main_core.Loc.getMessage('AI_COPILOT_IMAGE_ENGINE_OPTION_TITLE'),
				icon: ui_iconSet_api_core.Main.ROBOT,
				options: getOptionsFromEngines(options.engines)
			}
		};
	};
	const getOptionsFromFormats = formats => {
		return formats.map(format => {
			return {
				title: format.name,
				value: format.code
			};
		});
	};
	const getOptionsFromEngines = engines => {
		return engines.map(engine => {
			return {
				title: engine.title,
				value: engine.code
			};
		});
	};

	class ImageConfiguratorParams extends main_core_events.EventEmitter {
		#container;
		#currentValues;
		#openOptionsMenu;
		#params = {};
		constructor(options) {
			super(options);
			this.#params = this.#initParams(options);
			const data = {
				format: this.#params.format.options[0].value,
				engine: this.#getSelectedEngineCodeFromEngines(options.engines)
			};
			const handler = {
				set: (target, property, value) => {
					Reflect.set(target, property, value);
					if (this.#container && (property === 'format' || property === 'engine')) {
						const option = this.#params[property].options.find(currentOption => currentOption.value === value);
						const optionElem = this.#container.querySelector(`#ai__copilot-image-params-item-${property}`);
						if (optionElem) {
							optionElem.innerText = option.title;
							main_core.Dom.attr(optionElem, 'title', option.title);
						}
					}
					return true;
				}
			};
			this.#currentValues = new Proxy(data, handler);
			this.setEventNamespace('AI.Copilot.ImageParams');
		}
		getCurrentValues() {
			return {
				...this.#currentValues
			};
		}
		#getSelectedEngineCodeFromEngines(engines) {
			const selectedEngine = engines.find(engine => engine.selected);
			return selectedEngine.code || engines?.[0]?.code;
		}
		isContainsTarget(target) {
			return this.#container?.contains(target) || this.#openOptionsMenu?.getPopupWindow()?.getPopupContainer()?.contains(target);
		}
		setFormats(formats) {
			this.#params.format = getParams({
				formats,
				engines: []
			}).format;
		}
		setSelectedEngine(engineCode) {
			this.#currentValues.engine = engineCode;
		}
		render() {
			this.#container = main_core.Tag.render`
			<div class="ai__copilot-image-params">
				${this.#renderParams(this.#params)}
			</div>
		`;
			return this.#container;
		}
		#renderParams(parameters) {
			return Object.entries(parameters).map(([parameterName, parameter]) => {
				return this.#renderParam(parameter, parameterName);
			});
		}
		#renderParam(options, parameterName) {
			const selectedOption = options.options.find(option => option.value === this.#currentValues[parameterName]);
			const icon = new ui_iconSet_api_core.Icon({
				size: 24,
				icon: options.icon,
				color: '#8E52EC'
			});
			const rightChevronIcon = new ui_iconSet_api_core.Icon({
				size: 16,
				icon: ui_iconSet_api_core.Actions.CHEVRON_RIGHT,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-base-50')
			});
			const param = main_core.Tag.render`
			<div class="ai__copilot-image-params-item">
				<div class="ai__copilot-image-params-item_title">
					<div class="ai__copilot-image-params-item_title-icon">
						${icon.render()}
					</div>
					<div
						class="ai__copilot-image-params-item_title-text"
						title="${options.title}"
					>
						${options.title}
					</div>
				</div>
				<div ref="value" class="ai__copilot-image-params-item_value">
					<div
						id="ai__copilot-image-params-item-${parameterName}"
						class="ai__copilot-image-params-item_value-text"
						title="${selectedOption.title}"
					>
						${selectedOption.title}
					</div>
					<div class="ai__copilot-image-params-item_value-arrow-icon">
						${rightChevronIcon.render()}
					</div>
				</div>
			</div>
		`;
			main_core.Event.bind(param.root, 'click', () => {
				if (this.#openOptionsMenu) {
					this.#openOptionsMenu.close();
				} else {
					this.#showOptionsMenu(param.value, this.#params[parameterName].options, parameterName);
				}
			});
			return param.root;
		}
		#showOptionsMenu(bindElement, options, parameterName) {
			this.#openOptionsMenu = new main_popup.Menu({
				...this.#getMenuOptions(bindElement, options, parameterName)
			});
			this.#openOptionsMenu.show();
		}
		#getMenuOptions(bindElement, imageConfiguratorParams, parameterName) {
			const position = main_core.Dom.getPosition(bindElement);
			return {
				bindElement: {
					top: position.top - 6,
					left: position.right + 18
				},
				cacheable: false,
				minWidth: 200,
				items: this.#getMenuItemsFromOptions(imageConfiguratorParams, parameterName),
				events: {
					onPopupAfterClose: () => {
						this.#openOptionsMenu = null;
					}
				}
			};
		}
		#getMenuItemsFromOptions(options, parameterName) {
			return options.map(option => {
				const isSelectedOption = option.value === this.#currentValues[parameterName];
				return {
					id: option.value,
					text: option.title,
					html: this.#getMenuItemHtml(option.title, isSelectedOption),
					onclick: this.#handleMenuItemClick(parameterName, option.value)
				};
			});
		}
		#getMenuItemHtml(title, isSelected) {
			const selectedIcon = new ui_iconSet_api_core.Icon({
				size: 18,
				icon: ui_iconSet_api_core.Main.CHECK,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-link-primary-base')
			});
			return main_core.Tag.render`
			<div class="ai__copilot-image-params-popup-item">
				<span class="ai__copilot-image-params-popup-item_title">${title}</span>
				${isSelected ? selectedIcon.render() : null}
			</div>
		`;
		}
		#handleMenuItemClick(parameterName, parameterValue) {
			return (e, menuItem) => {
				if (this.#currentValues[parameterName] !== parameterValue) {
					this.emit('change-parameter', {
						parameter: parameterName,
						value: parameterValue
					});
				}
				this.#currentValues[parameterName] = parameterValue;
				menuItem.getMenuWindow().close();
				this.#openOptionsMenu = null;
			};
		}
		#initParams(options) {
			const params = getParams({
				formats: Object.values(options.formats),
				engines: options.engines
			});
			const changeParamsHandler = {
				set: (target, property, value) => {
					Reflect.set(target, property, value);
					if (property === 'format') {
						this.#currentValues.format = this.#params.format.options[0].value;
					}
					return true;
				}
			};
			return new Proxy(params, changeParamsHandler);
		}
	}

	class ImageConfigurator extends main_core_events.EventEmitter {
		#container;
		#imageConfiguratorStyles;
		#imageConfiguratorParams;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.Copilot.ImageConfigurator');
			this.#imageConfiguratorStyles = new ImageConfiguratorStyles({
				styles: options?.styles ?? []
			});
			this.#imageConfiguratorParams = new ImageConfiguratorParams({
				formats: options?.formats ?? [],
				engines: options?.engines ?? []
			});
			this.#imageConfiguratorParams.subscribe('change-parameter', event => {
				const data = event.getData();
				this.emit('change-parameter', data);
			});
		}
		setFormats(formats) {
			this.#imageConfiguratorParams.setFormats(formats);
		}
		setSelectedEngine(engineCode) {
			this.#imageConfiguratorParams.setSelectedEngine(engineCode);
		}
		getParams() {
			return {
				style: this.#imageConfiguratorStyles.getSelectedStyle(),
				...this.#imageConfiguratorParams.getCurrentValues()
			};
		}
		isContainsTarget(target) {
			return this.#container?.contains(target) || this.#imageConfiguratorParams?.isContainsTarget(target);
		}
		render() {
			this.#container = main_core.Tag.render`
			<div class="ai__copilot-image-configurator">
				<div class="ai__copilot-image-configurator_styles">
					${this.#renderImageStyles()}
				</div>
				<div class="ai__copilot-image-configurator_params">
					${this.#renderImageParams()}
				</div>
			</div>
		`;
			return this.#container;
		}
		#renderImageStyles() {
			return this.#imageConfiguratorStyles.render();
		}
		#renderImageParams() {
			return this.#imageConfiguratorParams.render();
		}
	}

	const ImageConfiguratorPopupEvents = Object.freeze({
		completions: 'completions',
		back: 'back',
		selectEngine: 'selectEngine'
	});
	class ImageConfiguratorPopup extends main_core_events.EventEmitter {
		#bindElement = null;
		#popup = null;
		#popupOffset;
		#popupId;
		#imageConfigurator;
		#withoutBackBtn;
		#submitButton;
		#loader;
		#loaderOverlay;
		constructor(options) {
			super(options);
			this.#popupId = options.popupId || String(Math.random());
			this.#bindElement = options.bindElement;
			this.#popupOffset = options.popupOffset;
			this.#withoutBackBtn = options.withoutBackBtn === true;
			this.#imageConfigurator = new ImageConfigurator({
				formats: options.imageConfiguratorOptions.formats,
				styles: options.imageConfiguratorOptions.styles,
				engines: options.imageConfiguratorOptions.engines
			});
			this.#imageConfigurator.subscribe('change-parameter', event => {
				const data = event.getData();
				if (data.parameter === 'engine') {
					this.emit(ImageConfiguratorPopupEvents.selectEngine, data.value);
				}
			});
			this.#initSubmitButton();
			this.setEventNamespace('AI.Copilot:ImagePopup');
		}
		getPopupId() {
			return this.#popupId;
		}
		getPopup() {
			return this.#popup;
		}
		show() {
			if (this.#popup === null) {
				this.#createPopup();
			}
			this.#popup.show();
		}
		hide() {
			this.#popup?.close();
		}
		destroy() {
			this.#popup?.destroy();
			this.#popup = null;
		}
		isShown() {
			return this.#popup.isShown();
		}
		isContainsTarget(target) {
			return this.#popup?.getPopupContainer()?.contains(target) || this.#imageConfigurator?.isContainsTarget(target);
		}
		adjustPosition() {
			this.#popup?.adjustPosition({
				forceBindPosition: true
			});
		}
		getImageConfiguration() {
			return this.#imageConfigurator.getParams();
		}
		setFormats(formats) {
			this.#imageConfigurator.setFormats(formats);
		}
		setSelectedEngine(engineCode) {
			this.#imageConfigurator.setSelectedEngine(engineCode);
		}
		disableSubmitButton() {
			this.#submitButton.setDisabled(true);
		}
		enableSubmitButton() {
			this.#submitButton.setDisabled(false);
		}
		showLoader() {
			this.#loaderOverlay = main_core.Tag.render`
			<div class="ai__copilot-image-configurator-popup-loader-overlay"></div>
		`;
			main_core.Dom.append(this.#loaderOverlay, this.#popup?.getPopupContainer());
			this.#loader = new main_loader.Loader({
				size: 110,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-copilot-primary'),
				target: this.#loaderOverlay
			});
			this.#loader.show(this.#loaderOverlay);
		}
		hideLoader() {
			this.#loader.destroy();
			main_core.Dom.remove(this.#loaderOverlay);
			this.#loader = null;
			this.#loaderOverlay = null;
		}
		#createPopup() {
			this.#popup = new main_popup.Popup({
				id: this.#popupId,
				bindElement: this.#bindElement,
				cacheable: true,
				width: 278,
				padding: 0,
				content: this.#renderPopupContent()
			});
			this.#popup.setOffset({
				offsetTop: this.#popupOffset?.top,
				offsetLeft: this.#popupOffset?.left
			});
		}
		#renderPopupContent() {
			return main_core.Tag.render`
			<div class="ai__copilot-image-configurator-popup-content">
				<header class="ai__copilot-image-configurator-popup-content_header">
					${this.#renderBackBtnIfNeeded()}
					<div class="ai__copilot-image-configurator-popup-content_title">
						${main_core.Loc.getMessage('AI_COPILOT_IMAGE_POPUP_TITLE')}
					</div>
				</header>
				<div class="ai__copilot-image-configurator-popup-content_params">
					${this.#imageConfigurator.render()}
				</div>
				<div class="ai__copilot-image-configurator-popup-content_footer">
					${this.#submitButton.render()}
				</div>
			</div>
		`;
		}
		#renderBackBtnIfNeeded() {
			if (this.#withoutBackBtn) {
				return null;
			}
			const backBtnIcon = new ui_iconSet_api_core.Icon({
				size: 24,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-base-90'),
				icon: ui_iconSet_api_core.Actions.CHEVRON_LEFT
			});
			const backBtnIconElem = backBtnIcon.render();
			main_core.Event.bind(backBtnIconElem, 'click', () => {
				this.emit(ImageConfiguratorPopupEvents.back, new main_core_events.BaseEvent());
			});
			return main_core.Tag.render`
			<div class="ai__copilot-image-configurator-popup-content_back-btn">
				${backBtnIconElem}
			</div>
		`;
		}
		#initSubmitButton() {
			this.#submitButton = new ui_buttons.Button({
				color: ui_buttons.Button.Color.AI,
				text: main_core.Loc.getMessage('AI_COPILOT_IMAGE_POPUP_GENERATE_BTN'),
				round: true,
				noCaps: true,
				onclick: () => {
					this.emit(ImageConfiguratorPopupEvents.completions, new main_core_events.BaseEvent({
						data: this.#imageConfigurator.getParams()
					}));
				}
			});
		}
	}

	class CopilotImageController extends main_core_events.EventEmitter {
		#analytics;
		#copilotContainer;
		#inputField;
		#engine;
		#imageConfiguratorPopup;
		#errorMenu;
		#resultMenu;
		#resultImageUrl;
		#copilotInputEvents;
		#CopilotMenu;
		#popupWithoutBackBtn;
		#currentGenerateRequestId;
		#useInsertAboveAndUnderTextMenuItems;
		#formats = [];
		#styles = [];
		#engines = [];
		#inputFieldCancelLoadingEventHandler;
		#inputFieldSubmitEventHandler;
		#inputFieldAdjustHeightEventHandler;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.CopilotImage');
			this.#resultImageUrl = null;
			this.#inputField = options.inputField;
			this.#copilotContainer = options.copilotContainer;
			this.#engine = options.engine;
			this.#copilotInputEvents = options.copilotInputEvents;
			this.#CopilotMenu = options.copilotMenu;
			this.#popupWithoutBackBtn = options.popupWithoutBackBtn === true;
			this.#useInsertAboveAndUnderTextMenuItems = options.useInsertAboveAndUnderMenuItems;
			this.#analytics = options.analytics;
			this.#inputFieldSubmitEventHandler = this.#handleInputFieldSubmitEvent.bind(this);
			this.#inputFieldCancelLoadingEventHandler = this.#handleInputFieldCancelLoadingEvent.bind(this);
			this.#inputFieldAdjustHeightEventHandler = this.#handleInputFieldAdjustHeightEvent.bind(this);
		}
		setCopilotContainer(copilotContainer) {
			this.#copilotContainer = copilotContainer;
		}
		getResultImageUrl() {
			return this.#resultImageUrl;
		}
		isContainsTarget(target) {
			const isImageConfiguratorPopup = this.#imageConfiguratorPopup?.isContainsTarget(target);
			const isErrorMenu = this.#errorMenu?.contains(target);
			const isResultMenu = this.#resultMenu?.contains(target);
			return isImageConfiguratorPopup || isErrorMenu || isResultMenu;
		}
		async init() {
			const res = await this.#engine.getImageCopilotTooling();
			this.#formats = res.data.params.formats;
			this.#engines = res.data.engines;
			this.#styles = res.data.params.styles;
		}
		showImageConfigurator() {
			if (!this.#imageConfiguratorPopup) {
				this.#initImageConfiguratorPopup();
			}
			this.#imageConfiguratorPopup.show();
		}
		showMenu() {
			this.#resultMenu?.show();
			this.#errorMenu?.show();
			this.#imageConfiguratorPopup?.show();
		}
		#initImageConfiguratorPopup() {
			this.#imageConfiguratorPopup = new ImageConfiguratorPopup({
				bindElement: this.#copilotContainer,
				popupId: 'ai-image-configuration-popup',
				popupOffset: {
					top: 8
				},
				withoutBackBtn: this.#popupWithoutBackBtn,
				imageConfiguratorOptions: {
					styles: this.#styles,
					formats: this.#formats,
					engines: this.#engines
				}
			});
			if (!this.#inputField.getValue()) {
				this.#imageConfiguratorPopup.disableSubmitButton();
			}
			this.#imageConfiguratorPopup.subscribe(ImageConfiguratorPopupEvents.completions, e => {
				const {
					style,
					format,
					engine
				} = e.getData();
				this.#setPayload({
					style,
					format,
					engine
				});
				this.completions();
			});
			this.#imageConfiguratorPopup.subscribe(ImageConfiguratorPopupEvents.selectEngine, event => {
				const engineCode = event.getData();
				const oldSelectedEngineCode = this.#imageConfiguratorPopup.getImageConfiguration().engine;
				let isRequestComplete = false;
				setTimeout(() => {
					if (isRequestComplete === false) {
						this.#imageConfiguratorPopup.showLoader();
					}
				}, 300);
				this.#engine.getImageEngineParams(engineCode).then(res => {
					const data = res.data;
					this.#imageConfiguratorPopup.setFormats(data.formats);
				}).catch(error => {
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('AI_COPILOT_IMAGE_FETCH_NEW_ENGINE_PARAMS_ERROR')
					});
					this.#imageConfiguratorPopup.setSelectedEngine(oldSelectedEngineCode);
					console.error(error);
				}).finally(() => {
					isRequestComplete = true;
					this.#imageConfiguratorPopup.hideLoader();
				});
			});
			this.#imageConfiguratorPopup.subscribe(ImageConfiguratorPopupEvents.back, () => {
				this.#unsubscribeFromInputFieldEvents();
				this.emit('back');
			});
		}
		getAnalytics() {
			const usedTextInput = this.#inputField.usedTextInput();
			const usedVoiceRecord = this.#inputField.usedVoiceRecord();
			if (usedTextInput && usedVoiceRecord) {
				this.#analytics.setContextTypeFromTextAndAudio();
			} else if (usedTextInput) {
				this.#analytics.setContextTypeFromText();
			} else if (usedVoiceRecord) {
				this.#analytics.setContextTypeFromAudio();
			}
			this.#analytics.setCategoryImage();
			this.#analytics.setTypeImageNew();
			return this.#analytics;
		}
		start() {
			this.showImageConfigurator();
			this.#subscribeToInputFieldEvents();
		}
		finish() {
			this.#currentGenerateRequestId = -1;
			this.destroyAllMenus();
			this.#unsubscribeFromInputFieldEvents();
		}
		isShown() {
			return this.#imageConfiguratorPopup.isShown();
		}
		getOpenMenuPopup() {
			return this.#errorMenu?.getPopup() || this.#resultMenu?.getPopup() || this.#imageConfiguratorPopup?.getPopup() || null;
		}
		hideAllMenus() {
			this.#imageConfiguratorPopup?.hide();
			this.#resultMenu?.hide();
			this.#errorMenu?.hide();
		}
		destroyAllMenus() {
			this.#errorMenu?.close();
			this.#resultMenu?.close();
			this.#imageConfiguratorPopup?.destroy();
			this.#errorMenu = null;
			this.#resultMenu = null;
			this.#imageConfiguratorPopup = null;
		}
		adjustMenusPosition() {
			this.#imageConfiguratorPopup?.adjustPosition();
			this.#resultMenu?.adjustPosition();
			this.#errorMenu?.adjustPosition();
		}
		async completions() {
			this.destroyAllMenus();
			main_core.Dom.removeClass(this.#copilotContainer, '--error');
			this.#inputField.startGenerating();
			try {
				const id = Math.round(Math.random() * 10000);
				this.#currentGenerateRequestId = id;
				const res = await this.#engine.imageCompletions();
				if (this.#currentGenerateRequestId !== id) {
					return;
				}
				this.#resultImageUrl = JSON.parse(res.data.result)[0];
				this.#inputField.finishGenerating();
				this.#showResultMenu();
				this.emit('completion-result', new main_core_events.BaseEvent({
					data: {
						imageUrl: this.#resultImageUrl
					}
				}));
			} catch (error) {
				this.#inputField.finishGenerating();
				this.#handleCompletionsError(error);
			}
		}
		#subscribeToInputFieldEvents() {
			this.#inputField.subscribe(this.#copilotInputEvents.input, event => {
				const inputFieldValue = event.getData();
				if (inputFieldValue) {
					this.#imageConfiguratorPopup?.enableSubmitButton();
				} else {
					this.#imageConfiguratorPopup?.disableSubmitButton();
				}
			});
			this.#inputField.subscribe(this.#copilotInputEvents.cancelLoading, this.#inputFieldCancelLoadingEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.submit, this.#inputFieldSubmitEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.adjustHeight, this.#inputFieldAdjustHeightEventHandler);
		}
		#unsubscribeFromInputFieldEvents() {
			this.#inputField.unsubscribe(this.#copilotInputEvents.cancelLoading, this.#inputFieldCancelLoadingEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.submit, this.#inputFieldSubmitEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.adjustHeight, this.#inputFieldAdjustHeightEventHandler);
		}
		#handleCompletionsError(error) {
			const firstError = error?.errors?.[0];
			if (firstError && firstError?.code === 'LIMIT_IS_EXCEEDED_BAAS') {
				this.#inputField.disable();
			} else if (firstError && (firstError.code === 'LIMIT_IS_EXCEEDED_MONTHLY' || firstError.code === 'LIMIT_IS_EXCEEDED_DAILY' || firstError.code === 'SERVICE_IS_NOT_AVAILABLE_BY_TARIFF')) {
				this.emit('close');
			} else if (firstError) {
				main_core.Dom.addClass(this.#copilotContainer, '--error');
				this.#showErrorMenu();
				this.#inputField.setErrors([{
					code: firstError.code,
					message: firstError.message
				}]);
			} else {
				this.#inputField.setErrors([{
					code: -1,
					message: main_core.Loc.getMessage('AI_COPILOT_IMAGE_GENERATION_ERROR')
				}]);
			}
			ai_ajaxErrorHandler.AjaxErrorHandler.handleImageGenerateError({
				baasOptions: {
					bindElement: this.#inputField.getContainer().querySelector('.ai__copilot_input-field-baas-point'),
					context: this.#engine.getContextId(),
					useAngle: false
				},
				errorCode: firstError?.code,
				showSliderWithMsg: firstError?.customData?.showSliderWithMsg,
				sliderCode: firstError?.customData?.sliderCode,
				forceCodeRules: ['sliderCode', 'msgWithHtmlLink'],
				forceOption: firstError?.customData,
				bindElement: this.#inputField
			});
		}
		#setPayload(options) {
			const payload = new ai_engine.Text({
				prompt: this.#inputField.getValue(),
				engineCode: options.engine
			});
			payload.setMarkers({
				style: options.style,
				format: options.format
			});
			this.#engine.setPayload(payload);
			this.#engine.setAnalyticParameters({
				type: this.getAnalytics().getType(),
				c_sub_section: this.getAnalytics().getCSubSection(),
				c_section: this.getAnalytics().getCSection(),
				c_element: this.getAnalytics().getCElement()
			});
			this.getAnalytics().setP1('prompt', options.style).setP2('format', options.format);
		}
		#handleInputFieldSubmitEvent() {
			if (!this.#imageConfiguratorPopup?.isShown() || !this.#inputField.getValue()?.trim()) {
				return;
			}
			const {
				style,
				format,
				engine
			} = this.#imageConfiguratorPopup.getImageConfiguration();
			this.#setPayload({
				style,
				format,
				engine
			});
			this.completions();
		}
		#handleInputFieldCancelLoadingEvent() {
			this.#currentGenerateRequestId = -1;
			this.#inputField.finishGenerating();
			this.#inputField.focus();
			this.showImageConfigurator();
		}
		#handleInputFieldAdjustHeightEvent() {
			this.#resultMenu?.adjustPosition();
			this.#errorMenu?.adjustPosition();
			this.#imageConfiguratorPopup?.adjustPosition();
		}
		#showResultMenu() {
			if (!this.#resultMenu) {
				this.#initResultMenu();
			}
			this.#resultMenu.open();
		}
		#initResultMenu() {
			this.#resultMenu = new this.#CopilotMenu({
				bindElement: this.#copilotContainer,
				offsetTop: 8,
				offsetLeft: 0,
				items: ImageConfiguratorResultMenuItems.getMenuItems({
					copilotImageController: this,
					inputField: this.#inputField,
					useInsertAboveAndUnderMenuItems: this.#useInsertAboveAndUnderTextMenuItems
				}),
				keyboardControlOptions: {
					clearHighlightAfterType: false,
					canGoOutFromTop: false,
					highlightFirstItemAfterShow: true
				},
				cacheable: false
			});
			this.#resultMenu.setBindElement(this.#copilotContainer, {
				left: 0,
				top: 8
			});
		}
		#showErrorMenu() {
			if (!this.#errorMenu) {
				this.#initErrorMenu();
			}
			this.#errorMenu.setBindElement(this.#copilotContainer, {
				top: 8,
				left: 0
			});
			this.#errorMenu?.open();
		}
		#initErrorMenu() {
			this.#errorMenu = new this.#CopilotMenu({
				bindElement: this.#copilotContainer,
				offsetTop: 8,
				items: ImageConfiguratorErrorMenuItems.getMenuItems({
					copilotImageController: this,
					inputField: this.#inputField,
					copilotContainer: this.#copilotContainer
				}),
				keyboardControlOptions: {
					canGoOutFromTop: false,
					highlightFirstItemAfterShow: true,
					clearHighlightAfterType: false
				},
				cacheable: false
			});
		}
	}

	exports.CopilotImageController = CopilotImageController;

})(this.BX.AI = this.BX.AI || {}, BX.AI, BX, BX.Event, BX.Main, BX.AI, BX.UI.IconSet, BX, BX.UI);
//# sourceMappingURL=copilot-image-controller.bundle.js.map
