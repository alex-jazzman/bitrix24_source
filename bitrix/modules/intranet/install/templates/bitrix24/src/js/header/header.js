import { Dom } from 'main.core';

export class Header
{
	getContainer(): HTMLElement
	{
		return document.getElementById('app-header');
	}

	show(): void
	{
		Dom.removeClass(this.getContainer(), '--hidden');
	}

	hide(): void
	{
		Dom.addClass(this.getContainer(), '--hidden');
	}

	isVisible(): boolean
	{
		return !Dom.hasClass(this.getContainer(), '--hidden');
	}
}
