import 'ui.design-tokens';
import 'ui.fonts.opensans';

import {Cache, Dom, Event, Tag, Text, Type} from 'main.core';
import {BaseEvent, EventEmitter} from 'main.core.events';

import BaseControl from '../../control/base_control/base_control';

import './css/tabs.css';

export default class Tabs extends EventEmitter
{
	tabs: Tab[];
	multiple: boolean;
	isBig: boolean;

	constructor()
	{
		super();
		this.setEventNamespace('BX.Landing.UI.Field.Color.Tabs');

		this.tabs = [];
		this.cache = new Cache.MemoryCache();
		this.multiple = true;
		this.isBig = false;

		this.onToggle = this.onToggle.bind(this);
	}

	setMultiple(multiple: boolean): Tabs
	{
		this.multiple = multiple;

		return this;
	}

	setBig(big: boolean): Tabs
	{
		this.isBig = big;
		this.multiple = false;

		return this;
	}

	appendTab(id: string, title: string, items: BaseControl | Tab | [BaseControl | Tab]): Tabs
	{
		const tab = new Tab({
			id: id,
			title: title,
			items: Type.isArray(items) ? items : [items],
		});
		tab.setBig(this.isBig);
		this.tabs.push(tab);
		this.bindEvents(tab);
		this.cache.delete('layout');

		return this;
	}

	prependTab(id: string, title: string, items: BaseControl | Tab | [BaseControl | Tab]): Tabs
	{
		const tab = new Tab({
			id: id,
			title: title,
			items: Type.isArray(items) || [items],
		});
		tab.setBig(this.isBig);
		this.tabs.unshift(tab);
		this.bindEvents(tab);
		this.cache.delete('layout');

		return this;
	}

	bindEvents(tab)
	{
		tab.subscribe('onToggle', this.onToggle);
		tab.subscribe('onShow', this.onToggle);
		tab.subscribe('onHide', this.onToggle);
	}

	onToggle(event: BaseEvent)
	{
		this.emit('onToggle', event);
	}

	showTab(id): Tabs
	{
		if (!this.multiple)
		{
			this.tabs.forEach((tab) => {
				tab.hide();
			});
		}

		const tab = this.getTabById(id);
		if (tab)
		{
			tab.show();
		}

		return this;
	}

	getTabById(id: string): Tab
	{
		return this.tabs.find((tab) => {
			return tab.id === id;
		});
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			const additional = this.isBig ? ' landing-ui-field-color-tabs--big' : '';
			const layout = Tag.render`<div class="landing-ui-field-color-tabs${additional}"></div>`;

			if (this.isBig)
			{
				const head = Tag.render`
					<div class="landing-ui-field-color-tabs-head landing-ui-field-color-tabs-head--big"></div>
				`;
				const content = Tag.render`
					<div class="landing-ui-field-color-tabs-content landing-ui-field-color-tabs-content--big"></div>
				`;

				this.tabs.forEach(tab => {
					Dom.append(tab.getTitle(), head);
					Dom.append(tab.getLayout(), content);
				});

				Dom.append(head, layout);
				Dom.append(content, layout);
			}
			else
			{
				this.tabs.forEach(tab => {
					const tabLayout = Tag.render`<div class="landing-ui-field-color-tabs-tab">
						${tab.getTitle()}${tab.getLayout()}
					</div>`;
					Dom.append(tabLayout, layout);
				});
			}

			// events
			this.tabs.forEach(tab => {
				Event.bind(tab.getTitle(), 'click', () => {
					if (!this.multiple)
					{
						this.tabs.forEach((tab) => {
							tab.hide();
						});
					}

					tab.toggle();
				});
			});

			this.setupAccessibility(layout);

			return layout;
		});
	}

	setupAccessibility(layout: HTMLElement): void
	{
		if (this.isBig)
		{
			const head = layout.querySelector('.landing-ui-field-color-tabs-head');
			if (head)
			{
				Dom.attr(head, 'role', 'tablist');
				if (this.tabs.length > 1)
				{
					Dom.attr(head, 'aria-orientation', 'horizontal');
				}
			}
		}

		this.tabs.forEach((tab) => {
			tab.setupAccessibility();
			Event.bind(tab.getTitle(), 'keydown', (event) => this.onTogglerKeydown(event, tab));
		});

		// Ensure the exclusive tablist stays keyboard-reachable even before any
		// tab is selected: the first tab keeps a roving tabindex of 0.
		if (this.isBig && !this.tabs.some((tab) => tab.isShown()) && this.tabs.length > 0)
		{
			Dom.attr(this.tabs[0].getTitle(), 'tabindex', '0');
		}
	}

	onTogglerKeydown(event: KeyboardEvent, tab: Tab): void
	{
		if (this.isBig)
		{
			this.onBigTabKeydown(event, tab);

			return;
		}

		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			tab.toggle();
		}
	}

	onBigTabKeydown(event: KeyboardEvent, tab: Tab): void
	{
		const activate = (targetTab) => {
			this.tabs.forEach((item) => item.hide());
			targetTab.show();
			targetTab.getTitle().focus();
		};

		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			activate(tab);

			return;
		}

		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
		{
			return;
		}

		event.preventDefault();
		const index = this.tabs.indexOf(tab);
		let nextIndex = index;
		if (event.key === 'ArrowLeft')
		{
			nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
		}
		else if (event.key === 'ArrowRight')
		{
			nextIndex = (index + 1) % this.tabs.length;
		}
		else if (event.key === 'Home')
		{
			nextIndex = 0;
		}
		else if (event.key === 'End')
		{
			nextIndex = this.tabs.length - 1;
		}

		activate(this.tabs[nextIndex]);
	}
}

export type TabOptions = {
	id: string,
	title: string,
	items: BaseControl[]
}

export class Tab extends EventEmitter
{
	id: string;
	title: string;
	items: BaseControl[];

	static SHOW_CLASS: string = 'show';

	constructor(options: TabOptions)
	{
		super();

		this.id = options.id;
		this.title = options.title;
		this.items = options.items;
		this.cache = new Cache.MemoryCache();
		this.isBig = false;
		this.togglerId = `landing-color-tab-toggler-${Text.getRandom()}`;
		this.contentId = `landing-color-tab-content-${Text.getRandom()}`;
	}

	setBig(isBig: boolean): Tab
	{
		this.isBig = isBig;

		return this;
	}

	getId(): string
	{
		return this.id;
	}

	isShown(): boolean
	{
		return Dom.hasClass(this.getLayout(), Tab.SHOW_CLASS);
	}

	getTitle(): string
	{
		return this.cache.remember('title', () => {
			return Tag.render`
				<span class="landing-ui-field-color-tabs-tab-toggler" id="${this.togglerId}">
					<span class="landing-ui-field-color-tabs-tab-toggler-icon"></span>
					<span class="landing-ui-field-color-tabs-tab-toggler-name">${this.title}</span>
				</span>
			`;
		});
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div class="landing-ui-field-color-tabs-tab-content" id="${this.contentId}">
					${this.items.map(item => item.getLayout())}
				</div>
			`;
		});
	}

	setupAccessibility(): void
	{
		const toggler = this.getTitle();
		const content = this.getLayout();

		if (this.isBig)
		{
			Dom.attr(toggler, {
				'role': 'tab',
				'tabindex': '-1',
				'aria-controls': this.contentId,
			});
			Dom.attr(content, {
				'role': 'tabpanel',
				'aria-labelledby': this.togglerId,
			});
		}
		else
		{
			Dom.attr(toggler, {
				'role': 'button',
				'tabindex': '0',
				'aria-controls': this.contentId,
			});
			Dom.attr(content, {
				'role': 'region',
				'aria-labelledby': this.togglerId,
			});
		}

		this.syncAriaState();
	}

	syncAriaState(): void
	{
		const shown = this.isShown();
		const toggler = this.getTitle();
		const content = this.getLayout();

		if (this.isBig)
		{
			Dom.attr(toggler, 'aria-selected', shown ? 'true' : 'false');
			Dom.attr(toggler, 'tabindex', shown ? '0' : '-1');
		}
		else
		{
			Dom.attr(toggler, 'aria-expanded', shown ? 'true' : 'false');
		}

		// `inert` keeps collapsed content measurable (layout unchanged) while
		// removing its descendants from Tab order and the accessibility tree —
		// unlike `display:none`, which would zero the opacity slider width.
		if (shown)
		{
			content.removeAttribute('inert');
		}
		else
		{
			Dom.attr(content, 'inert', '');
		}
	}

	toggle(): Tab
	{
		Dom.toggleClass(this.getLayout(), Tab.SHOW_CLASS);
		Dom.toggleClass(this.getTitle(), Tab.SHOW_CLASS);
		this.syncAriaState();
		this.emit('onToggle', {tab: this.title});

		return this;
	}

	show(): Tab
	{
		Dom.addClass(this.getLayout(), Tab.SHOW_CLASS);
		Dom.addClass(this.getTitle(), Tab.SHOW_CLASS);
		this.syncAriaState();
		this.emit('onShow', {tab: this.title});

		return this;
	}

	hide(): Tab
	{
		Dom.removeClass(this.getLayout(), Tab.SHOW_CLASS);
		Dom.removeClass(this.getTitle(), Tab.SHOW_CLASS);
		this.syncAriaState();
		this.emit('onHide', {tab: this.title});

		return this;
	}
}
