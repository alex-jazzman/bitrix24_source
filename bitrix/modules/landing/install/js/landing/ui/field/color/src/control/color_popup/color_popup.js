import { Event, Tag, Text, Type, Loc } from 'main.core';
import { Popup, PopupManager } from 'main.popup';
import { BaseEvent } from 'main.core.events';
import BaseControl from '../base_control/base_control';
import { PageObject } from 'landing.pageobject';

import Hex from '../hex/hex';
import ColorValue from '../../color_value';
import Spectrum from '../spectrum/spectrum';
import PresetCollection from '../../layout/preset/preset_collection';
import Recent from '../../layout/recent/recent';
import Favourite from '../../layout/favourite/favourite';
import isHex from '../../internal/is-hex';

import './css/color_popup.css';

export default class ColorPopup extends BaseControl
{
	static TABS = {
		RECENT: 'recent',
		SPECTRUM: 'spectrum',
		PRESET: 'preset',
	};

	static ANALYTICS = {
		CATEGORY_DESIGN: 'design_slider',
		COLOR_TYPE_GRADIENT: 'gradient',
		COLOR_TYPE_SOLID: 'solid',
		EVENTS: {
			OPEN_POPUP: 'open_color_popup',
			CHANGE_TAB: 'change_color_tab',
			SELECT_COLOR: 'select_color',
			ADD_MY_COLOR: 'add_my_color',
		},
		TYPE_COLORS: {
			RECENT: 'recent',
			SPECTRUM: 'spectrum',
			PRESET: 'preset',
			MY: 'my',
			HEX: 'hex',
		},
	};

	static HEX_DEFAULT_TEXT: string = '#hex';

	constructor(options)
	{
		super();

		//todo: check for inline twice call

		this.options = options;
		this.hexPreview = options.hexPreview;
		this.isHexPreviewMode = options.hexPreviewMode;

		this.isNeedCalcPopupOffset = options.isNeedCalcPopupOffset;
		this.isNeedResetPopupWhenOpen = options.isNeedResetPopupWhenOpen;

		this.popupId = `colorpopup_${Text.getRandom()}`;
		this.popupTargetContainer = options.contentRoot;
		this.activeTab = ColorPopup.TABS.RECENT;

		if (this.hexPreview)
		{
			this.bindElement = this.hexPreview.getLayout();
			this.hexPreview.subscribe('onValidInput', this.onHexPreviewValidInput.bind(this));
		}

		if (this.options.bindElement)
		{
			this.bindElement = this.options.bindElement;
		}

		if (this.options.bindElement)
		{
			this.targetContainer = this.options.targetContainer;
		}

		this.tabButtons = {};
		this.tabContents = {};

		this.init();
		this.initAnalytics(options.analytics);
	}

	init()
	{
		this.hex = new Hex();
		this.hex.subscribe('onChange', this.onHexChange.bind(this));

		this.recent = new Recent();
		this.recent.subscribe('onChange', this.onRecentChange.bind(this));

		this.spectrum = new Spectrum(this.options);
		this.spectrum.subscribe('onChange', this.onSpectrumChange.bind(this));
		this.spectrum.subscribe('onPickerDragStart', this.onSpectrumDragStart.bind(this));
		this.spectrum.subscribe('onPickerDragEnd', this.onSpectrumDragEnd.bind(this));

		this.presetCollection = new PresetCollection(this.options);
		this.presetCollection.addDefaultPresets();
		this.presets = this.presetCollection.getAllPresets();
		this.presets.forEach((preset) => {
			preset.subscribe('onChange', this.onPresetChange.bind(this));
		});

		this.favourite = new Favourite();
		this.favourite.subscribe('onSelectColor', this.onFavouriteSelect.bind(this));
		this.favourite.subscribe('onAddColor', this.onAddFavouriteColor.bind(this));
		this.favourite.subscribe('onRemoveColor', this.onRemoveFavouriteColor.bind(this));
		this.favourite.subscribe('onEditColors', this.onEditFavouriteColors.bind(this));
		this.favourite.subscribe('onSaveColors', this.onSaveFavouriteColors.bind(this));
	}

	initAnalytics(options)
	{
		this.analyticsCategory = ColorPopup.ANALYTICS.CATEGORY_DESIGN;
		if (this.hexPreview)
		{
			this.analyticsCElement = this.isHexPreviewMode
				? ColorPopup.ANALYTICS.COLOR_TYPE_GRADIENT
				: ColorPopup.ANALYTICS.COLOR_TYPE_SOLID;
		}
		this.analyticsCSubSection = this.options.style;
		if (options)
		{
			if (options.category)
			{
				this.analyticsCategory = options.category;
			}

			if (options.c_sub_section)
			{
				this.analyticsCSubSection = options.c_sub_section;
			}

			if (options.p1)
			{
				this.analyticsP1 = options.p1;
			}
		}
	}

	getPopup(): Popup
	{
		let offsetLeft = 0;
		let offsetTop = 3;
		const popupWidth = 287;

		const editorPanelCurrentElement = BX.Landing.UI.Panel.EditorPanel.getInstance().currentElement;
		if (
			editorPanelCurrentElement !== null
			&& editorPanelCurrentElement.ownerDocument !== BX.Landing.PageObject.getRootWindow().document
			&& !this.hexPreview
		)
		{
			offsetTop -= 66;
		}

		if (this.bindElement && this.isNeedCalcPopupOffset !== false)
		{
			const layoutClientRect = this.bindElement.getBoundingClientRect();
			const panelWidth = 320;
			const panelPaddingRight = 12;
			offsetLeft = ((panelWidth - popupWidth) - panelPaddingRight) - layoutClientRect.x;
		}

		return this.cache.remember('popup', () => {
			return PopupManager.create({
				id: this.popupId,
				className: 'landing-ui-field-color-popup',
				autoHide: true,
				autoHideHandler: (event: PointerEvent) => {
					const target = event.target;
					if (!this.hexPreview)
					{
						return !(target && target.closest('.popup-window-content'));
					}

					return target !== this.hexPreview.getInput()
						&& !this.getPopup().contentContainer.contains(target);
				},
				bindElement: this.bindElement,
				bindOptions: {
					forceTop: true,
					forceLeft: true,
				},
				padding: 0,
				contentPadding: 16,
				width: popupWidth,
				offsetTop,
				offsetLeft,
				content: this.getPopupContent(),
				closeByEsc: true,
				targetContainer: this.popupTargetContainer ?? null,
				events: {
					onPopupClose: () => {
						this.favourite.onSaveButtonClick();
						this.emit('onPopupClose');
					},
					onPopupShow: () => {
						this.emit('onPopupShow');
					},
				},
			});
		});
	}

	getPopupContent(): HTMLDivElement
	{
		const tabNames = [
			{ key: ColorPopup.TABS.RECENT, label: Loc.getMessage('LANDING_FIELD_COLOR_TAB_RECENT') },
			{ key: ColorPopup.TABS.SPECTRUM, label: Loc.getMessage('LANDING_FIELD_COLOR_TAB_SPECTRUM') },
			{ key: ColorPopup.TABS.PRESET, label: Loc.getMessage('LANDING_FIELD_COLOR_TAB_PRESETS') },
		];

		const tabButtonsRow = Tag.render`
			<div class="landing-ui-field-color-popup-tabs"></div>
		`;

		tabNames.forEach((tab) => {
			const btn = Tag.render`
				<button 
					class="landing-ui-field-color-popup-tab-btn"
					data-tab="${tab.key}"
					type="button"
				>${tab.label}</button>
			`;
			BX.Dom.append(btn, tabButtonsRow);
			this.tabButtons[tab.key] = btn;
			Event.bind(btn, 'click', () => this.setActiveTab(tab.key, true));
		});

		const recentTab = Tag.render`
			<div class="landing-ui-field-color-popup-container-recent">
				${this.recent.getLayout()}
			</div>
		`;
		const spectrumTab = Tag.render`
			<div class="landing-ui-field-color-popup-container-spectrum" hidden>
				${this.spectrum.getLayout()}
			</div>
		`;
		const presetsTab = Tag.render`
			<div class="landing-ui-field-color-popup-container-presets" hidden>
				${this.getPresetsLayout()}
			</div>
		`;

		this.tabContents = {
			recent: recentTab,
			spectrum: spectrumTab,
			preset: presetsTab,
		};

		const favouriteColors = Tag.render`
			<div class="landing-ui-field-color-popup-favourite-colors">
				${this.favourite.getLayout()}
			</div>
		`;

		if (!this.hexPreview)
		{
			this.colorPickerPopup = this.getColorPickerPopupLayout();
			Event.bind(this.colorPickerPopup, 'input', this.onColorPopupInput.bind(this));
		}

		const content = Tag.render`
			<div class="landing-ui-field-color-popup-container">
				${this.colorPickerPopup ?? null}
				${tabButtonsRow}
				${recentTab}
				${spectrumTab}
				${presetsTab}
				${favouriteColors}
			</div>
		`;

		Event.bind(content, 'click', (event) => {
			event.preventDefault();
			event.stopPropagation();
		});

		this.setActiveTab(this.activeTab);

		return content;
	}

	onPopupOpenClick(event, bindElement = null)
	{
		if (bindElement !== null)
		{
			this.bindElement = bindElement;
		}

		if (!this.hexPreview && this.isNeedResetPopupWhenOpen !== false)
		{
			this.resetPopupValue();
		}

		Promise.all([Recent.initItems(), Favourite.initItems()]).then(() => {
			const popup = this.getPopup();

			if (this.hexPreview && !popup.isShown())
			{
				if (event.target === this.hexPreview.getLayout())
				{
					this.setActiveTab(ColorPopup.TABS.RECENT);
				}

				if (event.target === this.hexPreview.getInput())
				{
					this.setActiveTab(ColorPopup.TABS.SPECTRUM);
				}
			}

			if (Recent.items.length === 0)
			{
				this.setActiveTab(ColorPopup.TABS.PRESET);
			}

			if (!popup.isShown())
			{
				this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.OPEN_POPUP);

				popup.show();
				this.hex.focus();
			}

			this.recent.buildItemsLayout();
			this.favourite.buildItemsLayout();
		});
	}

	resetPopupValue()
	{
		this.resetColorPickerPopupValue();
		this.unsetActivePresets();
		this.recent.buildItemsLayout(ColorPopup.HEX_DEFAULT_TEXT);
		this.favourite.buildItemsLayout(ColorPopup.HEX_DEFAULT_TEXT);
		this.spectrum.hidePicker();
	}

	onChangeColor(color)
	{
		this.emit('onColorPopupChange', color);

		if (!this.hexPreview)
		{
			const hex = (Type.isString(color) && isHex(color))
				? color
				: (color && Type.isFunction(color.getHex) ? color.getHex() : null);
			this.updateColorPickerPopup(hex);
			this.emit('onHexColorPopupChange', hex);
		}
	}

	setValue(value)
	{
		if (!value)
		{
			return;
		}

		this.spectrum.setValue(value);
		this.hex.setValue(value);

		const hexValue = value.getHex();
		this.currentHexValue = hexValue;
		this.presets.forEach((preset) => {
			preset.setActiveHex(hexValue);
		});
		this.recent.buildItemsLayout(hexValue);
		this.favourite.buildItemsLayout(hexValue);
		this.updateColorPickerPopup(hexValue);
	}

	setHexValue(hexValue)
	{
		this.setValue(new ColorValue(hexValue));
	}

	getValue()
	{
		return this.spectrum.getValue();
	}

	getPresetsLayout()
	{
		return Tag.render`
			<div class="landing-ui-field-color-presets-list">
				${this.presets.map((preset) => preset.getLayout())}
			</div>
		`;
	}

	getColorPickerPopupLayout()
	{
		this.colorPickerPopupId = `colorpicket_${Text.getRandom()}`;

		let value = ColorPopup.HEX_DEFAULT_TEXT;
		let bgValue = '#eeeeee';
		if (this.currentHexValue)
		{
			value = this.currentHexValue;
			bgValue = this.currentHexValue;
		}

		return Tag.render`
			<div class="landing-ui-field-color-popup-picker">
				<div class="landing-ui-field-color-popup-picker-preview" style="background-color: ${bgValue};"></div>
				<input id="${this.colorPickerPopupId}" type="text" value="${value}" class="landing-ui-field-color-popup-picker-input">
			</div>
		`;
	}

	updateColorPickerPopup(hex)
	{
		if (!this.colorPickerPopup)
		{
			return;
		}

		const preview = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-preview');
		if (preview)
		{
			BX.Dom.style(preview, 'background-color', hex);
		}

		const input = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-input');
		if (input)
		{
			input.value = hex;
		}
	}

	resetColorPickerPopupValue()
	{
		if (!this.colorPickerPopup)
		{
			return;
		}

		const preview = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-preview');
		if (preview)
		{
			BX.Dom.style(preview, 'background-color', '#eeeeee');
		}

		const input = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-input');
		if (input)
		{
			input.value = ColorPopup.HEX_DEFAULT_TEXT;
		}
	}

	onColorPopupInput()
	{
		const input = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-input');

		if (this.colorPopupInputTimeout)
		{
			clearTimeout(this.colorPopupInputTimeout);
		}

		this.colorPopupInputTimeout = setTimeout(() => {
			let value = input.value.replaceAll(/[^\da-f]/gi, '');
			value = value.slice(0, 6);
			const hex = `#${value.toLowerCase()}`;
			input.value = hex;

			const hexRegex = /^#([\da-f]{6})$/;
			if (hexRegex.test(hex))
			{
				this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
					type: ColorPopup.ANALYTICS.TYPE_COLORS.HEX,
				});
				const color = new ColorValue(hex);
				this.recent.addItem(hex);
				this.recent.buildItemsLayout();
				this.setValue(color);
				this.onChangeColor(hex);
				input.focus();
			}
		}, 333);
	}

	setActiveTab(tabKey, isUserClick = false)
	{
		if (isUserClick === true && tabKey !== this.activeTab)
		{
			this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.CHANGE_TAB, {
				type: tabKey,
			});
		}

		this.activeTab = tabKey;

		if (this.activeTab === ColorPopup.TABS.RECENT)
		{
			this.recent.buildItemsLayout();
		}

		Object.entries(this.tabContents).forEach(([key, node]) => {
			node.hidden = (key !== tabKey);
		});

		Object.entries(this.tabButtons).forEach(([key, btn]) => {
			if (key === tabKey)
			{
				BX.Dom.addClass(btn, 'active');
			}
			else
			{
				BX.Dom.removeClass(btn, 'active');
			}
		});
	}

	onHexChange(event)
	{
		this.unsetActivePresets();
		const color = event.getData().color;
		if (color)
		{
			this.recent.addItem(color.getHex());
		}
		this.setValue(color);
		this.onChange(event);
	}

	onSpectrumChange(event)
	{
		const color = event.getData().color;
		this.unsetActivePresets();
		this.hex.unFocus();
		this.setValue(color);
		this.onChangeColor(color);
	}

	onSpectrumDragStart(event: BaseEvent)
	{
		PageObject.getRootWindow().document.activeElement.blur();
	}

	onSpectrumDragEnd(event: BaseEvent)
	{
		this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
			type: ColorPopup.ANALYTICS.TYPE_COLORS.SPECTRUM,
		});

		const color = event.getData().color;
		this.recent.addItem(color.getHex());
	}

	onPresetChange(event)
	{
		this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
			type: ColorPopup.ANALYTICS.TYPE_COLORS.PRESET,
		});

		const presetId = event.target.id;
		this.unsetActivePresets(presetId);
		const color = event.getData().color;
		this.recent.addItem(color.getHex());
		this.setValue(color);
		this.onChangeColor(color);
	}

	onRecentChange(event: BaseEvent)
	{
		this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
			type: ColorPopup.ANALYTICS.TYPE_COLORS.RECENT,
		});

		this.unsetActivePresets();
		const color = new ColorValue(event.getData().hex);
		this.setValue(color);
		this.onChangeColor(color);
	}

	unsetActivePresets(presetId = null)
	{
		this.presets.forEach((preset) => {
			if (presetId !== preset.id)
			{
				preset.unsetActive();
			}
		});
	}

	onFavouriteSelect(event: BaseEvent)
	{
		this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
			type: ColorPopup.ANALYTICS.TYPE_COLORS.MY,
		});

		this.unsetActivePresets();
		const favouriteColor = new ColorValue(event.getData().hex);
		const color = event.getData().hex;
		this.recent.addItem(color);
		this.setValue(favouriteColor);
		this.onChangeColor(favouriteColor);
	}

	onAddFavouriteColor(event: BaseEvent)
	{
		this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.ADD_MY_COLOR);
	}

	onHexPreviewValidInput(event)
	{
		const color = event.getData().value;
		if (color)
		{
			this.recent.addItem(`#${color}`);
			this.recent.buildItemsLayout();
			this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
				type: ColorPopup.ANALYTICS.TYPE_COLORS.HEX,
			});
		}
	}

	onRemoveFavouriteColor(event: BaseEvent) {}

	onEditFavouriteColors(event: BaseEvent) {}

	onSaveFavouriteColors(event: BaseEvent) {}

	getAnalyticsCategory(): string
	{
		return this.analyticsCategory;
	}

	getAnalyticsCSubSection(): string
	{
		return this.analyticsCSubSection;
	}

	getAnalyticsCElement(): ?string
	{
		return this.analyticsCElement ?? null;
	}

	getAnalyticsP1(): ?string
	{
		return this.analyticsP1 ?? null;
	}

	sendAnalytics(event: string, params: object = {}): void
	{
		const analyticsData = {
			event,
			tool: BX.Landing.Main.getAnalyticsCategoryByType(),
			category: params?.category || this.getAnalyticsCategory(),
			c_sub_section: params?.c_sub_section || this.getAnalyticsCSubSection(),
			p1: params?.p1 || this.getAnalyticsP1(),
		};

		if (params && params.type)
		{
			analyticsData.type = params.type;
		}

		const cElement = this.getAnalyticsCElement();
		if (cElement !== null)
		{
			analyticsData.c_element = cElement;
		}

		BX.UI.Analytics.sendData(analyticsData);
	}
}
