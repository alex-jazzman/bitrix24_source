import { Event, Runtime, Dom, Type, Reflection, type JsonObject } from 'main.core';

export class SearchTitle
{
	#searchOptions: JsonObject = {};
	#extensionLoaded: boolean = false;
	#container: HTMLElement = null;
	#button: HTMLElement = null;
	#input: HTMLInputElement = null;
	#searchTitleInstance = null;
	#searchButtonLabel: string = '';
	#closeButtonLabel: string = '';
	#boundHandleKeyDown: Function = null;

	constructor(options)
	{
		this.#container = document.getElementById(options.containerId);
		this.#button = document.getElementById(options.buttonId);
		this.#input = document.getElementById(options.inputId);

		this.#searchOptions = options.searchOptions;
		this.#searchButtonLabel = options.searchButtonLabel || '';
		this.#closeButtonLabel = options.closeButtonLabel || '';
		this.#boundHandleKeyDown = this.#handleKeyDown.bind(this);

		Event.bind(this.#button, 'click', this.#handleButtonClick.bind(this));
		Event.bind(this.#input, 'focusout', this.#handleInputFocusOut.bind(this));
	}

	open(): void
	{
		Dom.addClass(this.#container, '--active');

		this.#input.disabled = false;
		Dom.attr(this.#input, 'aria-hidden', null);
		Dom.attr(this.#input, 'tabindex', null);

		Dom.attr(this.#button, 'aria-label', this.#closeButtonLabel);
		Dom.attr(this.#button, 'aria-expanded', true);

		Event.bind(document, 'keydown', this.#boundHandleKeyDown);

		setTimeout(() => {
			this.#input.focus();
		}, 200);
	}

	close(): void
	{
		Event.unbind(document, 'keydown', this.#boundHandleKeyDown);

		Dom.removeClass(this.#container, '--active');
		this.#input.disabled = true;
		Dom.attr(this.#input, 'aria-hidden', true);
		Dom.attr(this.#input, 'tabindex', -1);

		Dom.attr(this.#button, 'aria-label', this.#searchButtonLabel);
		Dom.attr(this.#button, 'aria-expanded', false);

		if (this.#searchTitleInstance !== null)
		{
			this.#searchTitleInstance.clearSearch();
			this.#searchTitleInstance.closeResult();
		}
	}

	#handleButtonClick(): void
	{
		if (Dom.hasClass(this.#container, '--active'))
		{
			this.close();
		}
		else
		{
			this.open();
		}

		if (this.#extensionLoaded)
		{
			return;
		}

		this.#extensionLoaded = true;
		Runtime.loadExtension('intranet.search_title').then(() => {
			const SearchTitleClass = Reflection.getClass('BX.Intranet.SearchTitle');
			this.#searchTitleInstance = new SearchTitleClass(this.#searchOptions);
		}).catch((error) => {
			console.error(error);
		});
	}

	#handleInputFocusOut(event): void
	{
		if (!Type.isStringFilled(this.#input.value) && event.relatedTarget !== this.#button)
		{
			this.close();
		}
	}

	#handleKeyDown(event): void
	{
		if (event.key !== 'Escape')
		{
			return;
		}

		this.close();
		this.#button.focus();
	}
}
