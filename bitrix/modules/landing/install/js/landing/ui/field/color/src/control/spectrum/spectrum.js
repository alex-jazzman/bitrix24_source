import { Dom, Event, Tag, Text } from 'main.core';
import ColorValue from '../../color_value';
import BaseControl from '../base_control/base_control';
import { PageObject } from 'landing.pageobject';
import './css/spectrum.css';

export default class Spectrum extends BaseControl
{
	static DEFAULT_SATURATION: number = 100;
	static HUE_RANGE: number = 375;
	static HUE_RANGE_GRAY_THRESHOLD: number = 360;
	static HUE_RANGE_GRAY_MIDDLE: number = 367;
	static HIDE_CLASS: string = 'hidden';

	constructor(options)
	{
		super();
		this.setEventNamespace('BX.Landing.UI.Field.Color.Spectrum');

		this.onPickerDragStart = this.onPickerDragStart.bind(this);
		this.onPickerDragMove = this.onPickerDragMove.bind(this);
		this.onPickerDragEnd = this.onPickerDragEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);

		this.scrollContext = options.contentRoot;

		Event.bind(this.getLayout(), 'mousedown', this.onPickerDragStart);
	}

	buildLayout(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-field-color-spectrum">
				${this.getPicker()}
			</div>
		`;
	}

	getPicker(): HTMLDivElement
	{
		return this.cache.remember('picker', () => {
			return Tag.render`<div class="landing-ui-field-color-spectrum-picker"></div>`;
		});
	}

	getPickerPos(): {x: number, y: number}
	{
		return {
			x: Text.toNumber(Dom.style(this.getPicker(), 'left')),
			y: Text.toNumber(Dom.style(this.getPicker(), 'top')),
		};
	}

	onPickerDragStart(event: MouseEvent)
	{
		if (event.ctrlKey || event.metaKey || event.button)
		{
			return;
		}

		const documentBody = this.getLayout().ownerDocument.body;
		Event.bind(this.scrollContext, 'scroll', this.onScroll);
		Event.bind(this.getLayout(), 'mousemove', this.onPickerDragMove);
		Event.bind(this.getLayout(), 'mouseup', this.onPickerDragEnd);
		Dom.addClass(documentBody, 'landing-ui-field-color-draggable');
		this.onScroll();
		this.showPicker();
		this.emit('onPickerDragStart', { color: this.getValue() });
		this.onPickerDragMove(event);
	}

	onPickerDragMove(event: MouseEvent)
	{
		if (event.target === this.getPicker())
		{
			return;
		}
		this.setPickerPos(event.pageX, event.pageY);
		this.onChange();
	}

	onPickerDragEnd()
	{
		const documentBody = this.getLayout().ownerDocument.body;
		Event.unbind(this.scrollContext, 'scroll', this.onScroll);
		Event.unbind(this.getLayout(), 'mousemove', this.onPickerDragMove);
		Event.unbind(this.getLayout(), 'mouseup', this.onPickerDragEnd);
		Dom.removeClass(documentBody, 'landing-ui-field-color-draggable');
		this.emit('onPickerDragEnd', { color: this.getValue() });
	}

	onScroll()
	{
		this.cache.delete('layoutSize');
	}

	getLayoutRect(): {}
	{
		const ownerDocument = this.getLayout().ownerDocument;

		return this.cache.remember('layoutSize', () => {
			const layoutRect = this.getLayout().getBoundingClientRect();
			const scrollTop = ownerDocument.documentElement.scrollTop || 0;

			return {
				width: layoutRect.width,
				height: layoutRect.height,
				left: layoutRect.left,
				top: layoutRect.top + scrollTop,
			};
		});
	}

	/**
	 * Set picker by absolut page coords
	 * @param x
	 * @param y
	 */
	setPickerPos(x: number, y: number)
	{
		const { width, height, top, left } = this.getLayoutRect();

		let leftToSet = Math.min(Math.max((x - left), 0), width);
		leftToSet = (leftToSet > width / Spectrum.HUE_RANGE * Spectrum.HUE_RANGE_GRAY_THRESHOLD)
			? width / Spectrum.HUE_RANGE * Spectrum.HUE_RANGE_GRAY_MIDDLE
			: leftToSet
		;

		Dom.style(this.getPicker(), {
			left: `${leftToSet}px`,
			top: `${Math.min(Math.max((y - top), 0), height)}px`,
		});
	}

	getValue(): ?ColorValue
	{
		return this.cache.remember('value', () => {
			if (Dom.hasClass(this.getPicker(), Spectrum.HIDE_CLASS))
			{
				return null;
			}

			const layoutWidth = this.getLayout().getBoundingClientRect().width;
			const h = (this.getPickerPos().x / layoutWidth) * Spectrum.HUE_RANGE;
			const layoutHeight = this.getLayout().getBoundingClientRect().height;
			const l = (1 - this.getPickerPos().y / layoutHeight) * 100;

			if (isNaN(h) || isNaN(l))
			{
				return null;
			}

			return new ColorValue({
				h: Math.min(h, Spectrum.HUE_RANGE_GRAY_THRESHOLD),
				s: (h >= Spectrum.HUE_RANGE_GRAY_THRESHOLD) ? 0 : Spectrum.DEFAULT_SATURATION,
				l,
			});
		});
	}

	setValue(value: ?ColorValue)
	{
		super.setValue(value);

		if ((value !== null) && Spectrum.isSpectrumValue(value))
		{
			// in first set value we can't match bounding client rect (layout not render). Then, use percents
			const { h, s, l } = value.getHsl();

			const left = (s === 0)
				? Spectrum.HUE_RANGE_GRAY_MIDDLE / Spectrum.HUE_RANGE * 100
				: h / Spectrum.HUE_RANGE * 100;
			Dom.style(this.getPicker(), 'left', `${left}%`);

			const top = 100 - l;
			Dom.style(this.getPicker(), 'top', `${top}%`);

			this.showPicker();
		}
		else
		{
			this.hidePicker();
		}
	}

	hidePicker()
	{
		Dom.addClass(this.getPicker(), Spectrum.HIDE_CLASS);
	}

	showPicker()
	{
		Dom.removeClass(this.getPicker(), Spectrum.HIDE_CLASS);
	}

	isActive(): boolean
	{
		return (this.getValue() !== null) && Spectrum.isSpectrumValue(this.getValue());
	}

	static isSpectrumValue(value: ColorValue): boolean
	{
		return (value !== null)
			&& (
				value.getHsl().s === Spectrum.DEFAULT_SATURATION
				|| value.getHsl().s === 0
			);
	}
}
