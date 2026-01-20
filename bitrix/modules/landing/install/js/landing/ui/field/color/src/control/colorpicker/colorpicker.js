import { Event, Tag, Text } from 'main.core';
import { BaseEvent } from 'main.core.events';

import Hex from '../hex/hex';
import ColorValue from '../../color_value';
import BaseControl from '../base_control/base_control';
import Spectrum from '../spectrum/spectrum';
import PresetCollection from '../../layout/preset/preset_collection';
import ColorPopup from '../color_popup/color_popup';

import './css/colorpicker.css';

export default class Colorpicker extends BaseControl
{
	popupId: string;
	popupTargetContainer: ?HTMLElement;

	static TABS = {
		RECENT: 'recent',
		SPECTRUM: 'spectrum',
		PRESET: 'preset',
	};

	constructor(options)
	{
		super();
		this.options = options;
		this.setEventNamespace('BX.Landing.UI.Field.Color.Colorpicker');
		this.popupId = `colorpicker_popup_${Text.getRandom()}`;
		this.popupTargetContainer = options.contentRoot;
		this.isHexPreviewMode = options.hexPreviewMode;

		this.hexPreview = new Hex();
		if (options.hexPreviewMode === true)
		{
			this.hexPreview.setPreviewMode(true);
		}

		this.options.hexPreview = this.hexPreview;

		// popup
		this.colorPopup = new ColorPopup(this.options);
		this.colorPopup.subscribe('onColorPopupChange', this.onColorPopupChange.bind(this));

		this.hex = new Hex();
		this.spectrum = new Spectrum(options);

		this.presetCollection = new PresetCollection(options);
		this.presetCollection.addDefaultPresets();
		this.presets = this.presetCollection.getAllPresets();

		// end popup

		this.initLoader();

		Event.bind(this.hexPreview.getLayout(), 'click', (event) => {
			if (!this.colorPopup.getPopup().isShown())
			{
				BX.Dom.style(this.hexPreview.getButton(), 'opacity', '.5');
				this.loader.show();
			}
			this.colorPopup.onPopupOpenClick(event);
		});
		this.colorPopup.subscribe('onPopupShow', (e) => {
			this.loader.hide();
			BX.Dom.style(this.hexPreview.getButton(), 'opacity', '1');
		});
		this.hexPreview.subscribe('onValidInput', this.onValidInput.bind(this));
		this.hexPreview.subscribe('onChange', this.onHexChange.bind(this));

		this.tabButtons = {};
		this.tabContents = {};
	}

	initLoader()
	{
		this.loader = new BX.Loader({
			target: this.hexPreview.getLayout(),
		});
		const loaderNode = this.loader.layout;
		if (loaderNode)
		{
			BX.Dom.style(loaderNode, 'width', '28px');
			BX.Dom.style(loaderNode, 'height', '28px');
			BX.Dom.style(loaderNode, 'left', 'unset');
			BX.Dom.style(loaderNode, 'right', '0');
			BX.Dom.style(loaderNode, 'transform', 'translate(0, -50%)');
		}
	}

	buildLayout(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-field-color-colorpicker">
				${this.hexPreview.getLayout()}
			</div>
		`;
	}

	getHexPreviewObject(): Hex
	{
		return this.hexPreview;
	}

	getValue(): ?ColorValue
	{
		return this.cache.remember('value', () => {
			return this.spectrum.getValue();
		});
	}

	onColorPopupChange(event)
	{
		const color = event.getData();
		if (color)
		{
			this.setValue(color);
		}
		this.onChange(new BaseEvent({ data: { color } }));
	}

	onHexChange(event: BaseEvent)
	{
		const color = event.getData().color;
		this.setValue(color);
		this.onChange(event);
	}

	onValidInput(event: BaseEvent)
	{
		const color = `#${event.getData().value}`;
		if (color)
		{
			this.emit('onValidInput', { color });
		}
	}

	setValue(value: ?ColorValue)
	{
		if (this.isNeedSetValue(value))
		{
			super.setValue(value);

			this.spectrum.setValue(value);
			this.hex.setValue(value);
			this.hexPreview.setValue(value);
			this.colorPopup.setValue(value);
			if (value)
			{
				const hexValue = value.getHex();
				this.presets.forEach((preset) => {
					preset.setActiveHex(hexValue);
				});
			}
		}
		this.setActivity(value);
	}

	setActivity(value: ?ColorValue)
	{
		if (value !== null)
		{
			if (this.spectrum.isActive())
			{
				this.hex.unsetActive();
			}
			else
			{
				this.hex.setActive();
			}
			this.hexPreview.setActive();
		}
	}

	unsetActive(): void
	{
		this.hex.unsetActive();
		this.hexPreview.unsetActive();
	}

	isActive(): boolean
	{
		return this.hex.isActive() || this.hexPreview.isActive();
	}
}
