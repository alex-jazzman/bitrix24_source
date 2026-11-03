import {Tag, Dom, Event, Type, Cache} from 'main.core';
import {EventEmitter} from 'main.core.events';

import 'ui.design-tokens.air';

import {IColorValue} from '../../types/i_color_value';
import ColorValue from '../../color_value';
import GradientValue from '../../gradient_value';
import {PresetOptions, defaultType, gradientType} from './types/preset-options';
import Generator from './generator';

import './css/preset.css';

export default class Preset extends EventEmitter
{
	id: string;
	type: 'color' | 'gradient';
	items: [ColorValue | GradientValue];
	activeItem: string | IColorValue | null;

	static ACTIVE_CLASS: string = 'active';

	constructor(options: PresetOptions)
	{
		super();
		this.cache = new Cache.MemoryCache();
		this.setEventNamespace('BX.Landing.UI.Field.Color.Preset');

		this.id = options.id;
		this.type = options.type || defaultType;
		this.items = options.items;
		this.activeItem = null;
	}

	getId(): string
	{
		return this.id;
	}

	getGradientPreset(): Preset
	{
		const options = (this.type === gradientType)
			? {type: gradientType, items: this.items}
			: Generator.getGradientByColorOptions({items: this.items});

		return new Preset(options);
	}

	getLayout(): HTMLDivElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div class="landing-ui-field-color-preset">
					${this.items.map((item) => {
						return this.getItemLayout(item.getName());
					})}
				</div>
			`;
		});
	}

	getItemLayout(name: string): HTMLDivElement
	{
		return this.cache.remember(name, () => {
			const color = this.getItemByName(name);
			const style = Type.isString(color) ? color : color.getStyleString();
			const item = Tag.render`
				<div
					class="landing-ui-field-color-preset-item"
					style="background: ${style}"
					data-name="${name}"
				></div>
			`;
			Event.bind(item, 'click', this.onItemClick.bind(this));
			if (this.type === gradientType)
			{
				Dom.attr(item, {
					tabindex: '0',
					role: 'button',
					'aria-pressed': 'false',
					'aria-label': `${color.getFrom().getHex()} → ${color.getTo().getHex()}`,
				});
				Event.bind(item, 'keydown', this.onItemKeydown.bind(this));
			}

			return item;
		});
	}

	onItemKeydown(event: KeyboardEvent): void
	{
		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			event.stopPropagation();
			event.currentTarget.click();

			return;
		}

		if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		const currentItem = event.currentTarget;
		const currentRect = currentItem.getBoundingClientRect();
		const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
		const backwards = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
		const axis = horizontal ? 'left' : 'top';
		const crossAxis = horizontal ? 'top' : 'left';
		const layouts = this.items.map((value) => {
			const item = this.getItemLayout(value.getName());

			return { item, rect: item.getBoundingClientRect() };
		}).filter(({ rect }) => rect.width > 0 && rect.height > 0);
		const adjacentRowDistance = Math.min(
			...layouts
				.map(({ rect }) => (rect.top - currentRect.top) * (backwards ? -1 : 1))
				.filter((distance) => distance > 1),
		);
		let nextItem = null;
		let nearestDistance = Infinity;

		layouts.forEach(({ item, rect }) => {
			const distance = (rect[axis] - currentRect[axis]) * (backwards ? -1 : 1);
			if (
				Math.abs(rect[crossAxis] - currentRect[crossAxis]) < 1
				&& (horizontal || Math.abs(distance - adjacentRowDistance) < 1)
				&& distance > 1
				&& distance < nearestDistance
			)
			{
				nextItem = item;
				nearestDistance = distance;
			}
		});

		if (nextItem)
		{
			nextItem.focus({ preventScroll: true });
		}
	}

	getItemByName(name: string): string | IColorValue | null
	{
		return this.items.find(item => name === item.getName()) || null;
	}

	isPresetValue(value: ColorValue | GradientValue | null): boolean
	{
		if (value === null)
		{
			return false;
		}
		return this.items.some(item => {
			if (item instanceof ColorValue && value instanceof ColorValue)
			{
				return ColorValue.compare(item, new ColorValue(value).setOpacity(1));
			}
			else if (item instanceof GradientValue && value instanceof GradientValue)
			{
				return GradientValue.compare(item, value, false);
			}
			return false;
		});
	}

	onItemClick(event: MouseEvent)
	{
		this.setActiveItem(event.currentTarget.dataset.name);

		let value = null;
		if (this.activeItem !== null)
		{
			value = this.activeItem instanceof GradientValue
				? new GradientValue(this.activeItem)
				: new ColorValue(this.activeItem);
		}

		this.emit('onChange', {color: value});
	}

	setActiveItem(name: string)
	{
		this.activeItem = this.getItemByName(name);

		this.items.forEach((item) => {
			const itemName = item.getName();
			if (this.type === gradientType)
			{
				Dom.attr(this.getItemLayout(itemName), 'aria-pressed', name === itemName ? 'true' : 'false');
			}

			if (name === itemName)
			{
				Dom.addClass(this.getItemLayout(itemName), Preset.ACTIVE_CLASS);
			}
			else
			{
				Dom.removeClass(this.getItemLayout(itemName), Preset.ACTIVE_CLASS);
			}
		});
	}

	setActiveValue(value: ColorValue | GradientValue | null)
	{
		if (value !== null)
		{
			if (value instanceof GradientValue)
			{
				this.setActiveItem(
					new GradientValue(value)
						.setAngle(GradientValue.DEFAULT_ANGLE)
						.setType(GradientValue.DEFAULT_TYPE)
						.getName()
				);
			}
			else
			{
				this.setActiveItem(
					new ColorValue(value)
						.setOpacity(1)
						.getName()
				);
			}
		}
	}

	setActiveHex(hexValue)
	{
		this.items.forEach((item) => {
			const hexItem = item.getHex();
			if (hexValue === hexItem)
			{
				this.setActiveItem(item.getName());
			}
		});
	}

	unsetActive()
	{
		this.items.forEach(item => {
			Dom.removeClass(this.getItemLayout(item.getName()), Preset.ACTIVE_CLASS);
			if (this.type === gradientType)
			{
				Dom.attr(this.getItemLayout(item.getName()), 'aria-pressed', 'false');
			}
		});
	}

	isActive(): boolean
	{
		return this.items.some(item => {
			return Dom.hasClass(this.getItemLayout(item.getName()), Preset.ACTIVE_CLASS);
		});
	}
}
