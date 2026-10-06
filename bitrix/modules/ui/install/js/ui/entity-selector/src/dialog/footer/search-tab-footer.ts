import { Tag, Browser, Loc, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Loader } from 'main.loader';

import { BaseFooter } from '../footer/base-footer';
import { type SearchTab } from '../tabs/search-tab';
import { type Tab } from '../tabs/tab';
import { type FooterOptions } from './footer-content';

export class SearchTabFooter extends BaseFooter
{
	loader: Loader | null = null;

	constructor(tab: Tab, options: FooterOptions)
	{
		super(tab, options);

		this.getDialog().subscribe('onSearch', this.handleOnSearch.bind(this));
		const tagSelector = this.getDialog().getTagSelector();
		if (tagSelector)
		{
			tagSelector.subscribe('onMetaEnter', this.handleMetaEnter.bind(this));
		}
	}

	render(): HTMLElement
	{
		return Tag.render`
			<button type="button" tabindex="0" class="ui-selector-search-footer" onclick="${this.handleClick.bind(this)}">
				<span class="ui-selector-search-footer-box">
					${this.getLabelContainer()}
					${this.getQueryContainer()}
					${this.getLoaderContainer()}
				</span>
				<span class="ui-selector-search-footer-cmd">${
					Browser.isMac() ? '&#8984;+Enter' : 'Ctrl+Enter'
				}</span>
			</button>
		`;
	}

	getLoader(): Loader
	{
		if (this.loader === null)
		{
			this.loader = new Loader({
				target: this.getLoaderContainer(),
				size: 17,
				color: 'rgba(82, 92, 105, 0.9)',
			});
		}

		return this.loader;
	}

	showLoader(): void
	{
		void this.getLoader().show();
	}

	hideLoader(): void
	{
		void this.getLoader().hide();
	}

	setLabel(label: string)
	{
		if (Type.isString(label))
		{
			this.getLabelContainer().textContent = label;
		}
	}

	getLabelContainer(): HTMLElement
	{
		return this.cache.remember('label', () => {
			return Tag.render`
				<span class="ui-selector-search-footer-label">${
					this.getOption('label', Loc.getMessage('UI_SELECTOR_CREATE_ITEM_LABEL'))
				}</span>
			`;
		});
	}

	getQueryContainer(): HTMLElement
	{
		return this.cache.remember('name-container', () => {
			return Tag.render`
				<span class="ui-selector-search-footer-query"></span>
			`;
		});
	}

	getLoaderContainer(): HTMLElement
	{
		return this.cache.remember('loader', () => {
			return Tag.render`
				<span class="ui-selector-search-footer-loader"></span>
			`;
		});
	}

	createItem(): void
	{
		const tagSelector = this.getDialog().getTagSelector();
		if (tagSelector && tagSelector.isLocked())
		{
			return;
		}

		const finalize = () => {
			this.hideLoader();
			if (this.getDialog().getTagSelector())
			{
				this.getDialog().getTagSelector()!.unlock();
				this.getDialog().focusSearch();
			}
		};

		this.showLoader();

		if (tagSelector)
		{
			tagSelector.lock();
		}

		this.getDialog()
			.emitAsync('Search:onItemCreateAsync', {
				searchQuery: (this.getTab() as SearchTab).getLastSearchQuery(),
			})
			.then(() => {
				(this.getTab() as SearchTab).clearResults();
				this.getDialog().clearSearch();
				if (this.getDialog().getActiveTab() === this.getTab())
				{
					this.getDialog().selectFirstTab();
				}

				finalize();
			})
			.catch(() => {
				finalize();
			});
	}

	handleClick(): void
	{
		this.createItem();
	}

	handleMetaEnter(event: BaseEvent): void
	{
		const keyboardEvent: KeyboardEvent = event.getData().event;
		keyboardEvent.stopPropagation();

		if (this.getDialog().getActiveTab() !== this.getTab())
		{
			return;
		}

		this.handleClick();
	}

	handleOnSearch(event: BaseEvent): void
	{
		const { query } = event.getData();
		this.getQueryContainer().textContent = query;
	}
}
