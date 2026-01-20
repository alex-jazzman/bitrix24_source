import './css/style.css';
import { EventEmitter, BaseEvent } from 'main.core.events';
import ColorValue from '../../../ui/field/color/src/color_value';

/**
 * ColorPicker for Theme site.
 */
export class ColorPickerTheme extends EventEmitter
{
	static DEFAULT_COLOR_PICKER_COLOR = '#f25a8f';
	static MATCH_HEX = /#?([0-9A-F]{3}){1,2}$/i;

	constructor(node: HTMLElement, allColors, currentColor, metrikaParams = {})
	{
		super();
		this.setEventNamespace('BX.Landing.ColorPickerTheme');

		this.element = node;

		this.loader = new BX.Loader({
			target: node,
			size: 43,
		});

		this.input = this.element.firstElementChild;
		this.allColors = allColors;
		this.currentColor = currentColor;
		this.initMetrika(metrikaParams);
		this.init();
	}

	initMetrika(metrikaParams)
	{
		this.metrikaParams = metrikaParams;
	}

	init()
	{
		const color = this.initPreviewColor();
		const active = this.isActive();

		this.element.style.backgroundColor = color;
		this.element.dataset.value = color;
		this.element.classList.add('landing-colorpicker-theme');
		if (active)
		{
			this.input.setAttribute('value', color);
			this.element.classList.add('active');
		}

		this.colorField = new BX.Landing.UI.Field.ColorField({
			subtype: 'color',
		});
		this.colorField.createPopup({
			contentRoot: null,
			isNeedCalcPopupOffset: false,
			isNeedResetPopupWhenOpen: false,
			analytics: this.getMetrikaParams(),
		});
		this.colorField.colorPopup.subscribe('onHexColorPopupChange', (e) => {
			this.onColorSelected(e.data);
		});
		this.colorField.colorPopup.subscribe('onPopupShow', (e) => {
			this.loader.hide();
		});

		BX.bind(this.element, 'click', this.open.bind(this));
	}

	initPreviewColor(): string
	{
		let color;

		if (this.currentColor)
		{
			if (this.isHex(this.currentColor))
			{
				color = (this.isBaseColor())
					? ColorPickerTheme.DEFAULT_COLOR_PICKER_COLOR
					: this.currentColor;
			}
			else
			{
				color = ColorPickerTheme.DEFAULT_COLOR_PICKER_COLOR;
			}
		}
		else
		{
			color = ColorPickerTheme.DEFAULT_COLOR_PICKER_COLOR;
		}

		return color;
	}

	isActive(): boolean
	{
		if (!this.isHex(this.currentColor))
		{
			return false;
		}
		return !this.isBaseColor();
	}

	isBaseColor(): boolean
	{
		return this.allColors.includes(this.currentColor);
	}

	getSelectedColor(): string
	{
		let color;
		if (this.element.dataset.value)
		{
			color = this.element.dataset.value;
		}
		color = this.prepareColor(color);
		if (!this.isHex(color))
		{
			color = '';
		}

		return color;
	}

	onColorSelected(color): void
	{
		this.element.classList.add('ui-colorpicker-selected');
		this.element.dataset.value = color.substr(1);
		this.element.style.backgroundColor = color;

		const event = new BaseEvent({data: {color: color, node: this.element}});
		this.emit('onSelectColor', event);
		this.emit('onSelectCustomColor', event);

		this.input.setAttribute('value', color);
	}

	open(): void
	{
		this.loader.show();
		this.colorField.colorPopup.setValue(new ColorValue(this.getSelectedColor()));
		this.colorField.colorPopup.onPopupOpenClick(event, this.element);
	}

	prepareColor(color): string
	{
		if (color[0] !== '#')
		{
			color = '#' + color;
		}

		return color;
	}

	isHex(color): boolean
	{
		let isCorrect = false;
		if (color.length === 4 || color.length === 7)
		{
			if (color.match(ColorPickerTheme.MATCH_HEX))
			{
				isCorrect = true;
			}
		}

		return isCorrect;
	}

	getMetrikaParams()
	{
		return {
			category: 'settings',
			c_sub_section: 'primary',
			p1: this.metrikaParams?.p1 ?? null,
		};
	}
}