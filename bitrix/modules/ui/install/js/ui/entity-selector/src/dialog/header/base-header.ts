import { Tag, Type, Dom } from 'main.core';
import { MemoryCache } from 'main.core.cache';

import { isDialog } from '../is-dialog';

import { type Dialog } from '../dialog';
import { type Tab } from '../tabs/tab';
import { type HeaderOptions } from './header-content';

export class BaseHeader
{
	dialog: Dialog;
	tab: Tab | null = null;
	container: HTMLElement | null = null;
	cache = new MemoryCache<HTMLElement>();
	options: HeaderOptions = {};

	constructor(context: Dialog | Tab, options: HeaderOptions)
	{
		this.options = Type.isPlainObject(options) ? options : {};

		if (isDialog(context))
		{
			this.dialog = context;
		}
		else
		{
			this.tab = context;
			this.dialog = this.tab.getDialog();
		}
	}

	getDialog(): Dialog
	{
		return this.dialog;
	}

	getTab(): Tab | null
	{
		return this.tab;
	}

	show(): void
	{
		Dom.addClass(this.getContainer(), 'ui-selector-header--show');
	}

	hide(): void
	{
		Dom.removeClass(this.getContainer(), 'ui-selector-header--show');
	}

	getOptions(): HeaderOptions
	{
		return this.options;
	}

	getOption(option: string, defaultValue?: any): any
	{
		if (!Type.isUndefined(this.options[option]))
		{
			return this.options[option];
		}

		if (!Type.isUndefined(defaultValue))
		{
			return defaultValue;
		}

		return null;
	}

	getContainer(): HTMLElement
	{
		if (this.container === null)
		{
			this.container = Tag.render<HTMLElement>`
				<div class="ui-selector-header">${this.render()}</div>
			`;
		}

		return this.container;
	}

	/**
	 * @abstract
	 */
	render(): HTMLElement
	{
		throw new Error('You must implement render() method.');
	}
}
