import { Dom } from 'main.core';

export class LeftMenu
{
	getContainer(): HTMLElement
	{
		return document.querySelector('.js-app__left-menu');
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
