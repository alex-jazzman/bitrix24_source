import { Dom, Tag, Type } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { type Tab } from '../tabs/tab';

export class BaseStub
{
	tab: Tab;
	autoShow: boolean = true;
	cache = new MemoryCache<HTMLElement>();
	content: HTMLElement | null = null;
	options: Record<string, unknown> = {};

	constructor(tab: Tab, options: Record<string, unknown>)
	{
		this.options = Type.isPlainObject(options) ? options : {};
		this.tab = tab;
		this.autoShow = this.getOption('autoShow', true);
	}

	/**
	 * @abstract
	 */
	render(): HTMLElement
	{
		throw new Error('You must implement render() method.');
	}

	getTab(): Tab
	{
		return this.tab;
	}

	getOuterContainer(): HTMLElement
	{
		return this.cache.remember('outer-container', () => {
			return Tag.render`
				<div class="ui-selector-tab-stub">${this.render()}</div>
			`;
		});
	}

	isAutoShow(): boolean
	{
		return this.autoShow;
	}

	show(): void
	{
		Dom.append(this.getOuterContainer(), this.getTab().getContainer());
		/* requestAnimationFrame(() => {
			Dom.addClass(this.getOuterContainer(), 'ui-selector-tab-stub--show');
		}); */
	}

	hide(): void
	{
		// Dom.removeClass(this.getOuterContainer(), 'ui-selector-tab-stub--show');
		Dom.remove(this.getOuterContainer());
	}

	getOptions(): Record<string, unknown>
	{
		return this.options;
	}

	getOption<T = unknown>(option: string, defaultValue?: T): T
	{
		if (!Type.isUndefined(this.options[option]))
		{
			return this.options[option] as T;
		}

		if (!Type.isUndefined(defaultValue))
		{
			return defaultValue;
		}

		return null as T;
	}
}
