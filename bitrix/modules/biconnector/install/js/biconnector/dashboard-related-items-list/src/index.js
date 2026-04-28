import { Loc, Tag, Event } from 'main.core';
import 'ui.icon-set.outline';
import 'ui.design-tokens.air';
import { Text } from 'ui.system.typography';
import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';
import 'ui.icon-set.outline';

import './css/main.css';

export type Dashboard = {
	link: string,
	isExternal: boolean,
	title: string,
	owner?: Owner,
};

export type Entity = {
	title: string,
	type: 'dashboard'|'chart',
	link: string,
	entities: SubEntity[],
}

export type SubEntity = {
	title: string,
	type: 'chart'|'dataset',
	link: string,
}

class DashboardRelatedEntitiesList
{
	#entities: Entity[];
	#onOpen: ?Function;

	constructor(entities: Entity[], options: {onOpen?: Function} = {})
	{
		this.#entities = entities;
		this.#onOpen = options.onOpen || null;
	}

	render(): HTMLElement
	{
		const items = [];
		for (let i = 0; i < this.#entities.length; i++)
		{
			items.push(this.#getItemNode(this.#entities[i], i === this.#entities.length - 1));
		}

		const container = Tag.render`
			<div class="superset-dashboard-related-entities-list">
				${items}
			</div>
		`;

		this.#addEventListeners(container);

		return container;
	}

	#openEntity(url: string, onDone: ?Function = null): void
	{
		if (this.#onOpen)
		{
			this.#onOpen(url, onDone);

			return;
		}

		window.open(url, '_blank');
		if (onDone)
		{
			onDone();
		}
	}

	#addEventListeners(container)
	{
		const headers = container.querySelectorAll('.superset-dashboard-related-entities-list-item__header');
		headers.forEach(header => {

			Event.bind(header, 'click', (event) => {
				const item = header.closest('.superset-dashboard-related-entities-list-item');
				if (item) {
					const wasExpanded = item.classList.contains('--expanded');
					const content = item.querySelector('.superset-dashboard-related-entities-list-item__content');

					item.classList.toggle('--expanded');
					if (!wasExpanded)
					{
						content.style.maxHeight = content.scrollHeight + 'px';
						this.#scrollToItem(item, container);
					}
					else
					{
						content.style.maxHeight = '0';
					}
				}
			});
		});

		const entityLinks = container.querySelectorAll('[data-entity-url]');
		entityLinks.forEach((link) => {
			Event.bind(link, 'click', (event) => {
				event.preventDefault();
				event.stopPropagation();
				this.#openEntity(link.dataset.entityUrl);
			});
		});
	}

	#scrollToItem(item, container)
	{
		const isLastItem =
			item.classList.contains('superset-dashboard-related-entities-list-item')
			&& item === container.querySelector('.superset-dashboard-related-entities-list-item:last-child')
		;

		if (!isLastItem || this.#entities.length <= 1) {
			return;
		}

		setTimeout(() => {
			const itemRect = item.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();

			// if element is hide by bottom edge of list - scroll to element after open
			if (itemRect.bottom > containerRect.bottom) {
				const scrollTop = container.scrollTop + (itemRect.bottom - containerRect.bottom) + 20; // +20px for padding
				container.scrollTo({
					top: scrollTop,
					behavior: 'smooth'
				});
			}
		}, 200);
	}

	#getTypeName(type: string): string
	{
		switch (type) {
			case 'dashboard':
				return Loc.getMessage('BI_DASHBOARD_RELATED_ITEMS_LIST_TYPE_DASHBOARD');
			case 'chart':
				return Loc.getMessage('BI_DASHBOARD_RELATED_ITEMS_LIST_TYPE_CHART');
			default:
				return '';
		}
	}

	#getItemNode(item: Entity, lastItem: boolean): HTMLElement
	{
		return Tag.render`
			<div class="superset-dashboard-related-entities-list-item">
				<div class="--ui-hoverable superset-dashboard-related-entities-list-item__header">
					<div class="superset-dashboard-related-entities-list-item__info">
						<div class="superset-dashboard-related-entities-list-item__title-wrapper">
							<a class="superset-dashboard-related-entities-list-item__title" href="#" data-entity-url="${item.link}">
								${Text.render(item.title, {size: 'md', className: '--ui-hoverable'})}
							</a>
						</div>
						${Text.render(this.#getTypeName(item.type), {tag: 'div', size: '2xs', className: 'superset-dashboard-related-entities-list-item__type'})}
					</div>
					<span class="superset-dashboard-related-entities-list-item__chevron ui-icon-set --chevron-down-l"></span>
				</div>
				${lastItem ? '' : '<div class="superset-dashboard-related-entities-list-item__divider-header"></div>'}
				<div
					class="
						superset-dashboard-related-entities-list-item__content
						${lastItem ? 'superset-dashboard-related-entities-list-item__content_last' : ''}
					"
				>
					${
						lastItem ?
							'<div class="superset-dashboard-related-entities-list-item__divider-header superset-dashboard-related-entities-list-item__divider-last-item"></div>'
							: ''
					}
					${item.entities.map(subItem => this.#getSubItemNode(subItem))}
				</div>
			</div>
		`;
	}

	#getSubItemNode(item: SubEntity): HTMLElement
	{
		const button = new Button({
			text: Loc.getMessage('BI_DASHBOARD_RELATED_ITEMS_LIST_OPEN_BTN'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.EXTRA_SMALL,
			onclick: () => {
				button.setWaiting(true);
				this.#openEntity(item.link, () => button.setWaiting(false));
			},
		});

		return Tag.render`
			<div class="superset-dashboard-related-entities-list-sub-item">
				<a class="superset-dashboard-related-entities-list-sub-item__icon" href="#" data-entity-url="${item.link}">
					${this.#getSubItemIconByType(item.type)}
				</a>
				<a class="superset-dashboard-related-entities-list-sub-item__title" href="#" data-entity-url="${item.link}">
					${Text.render(item.title, {size: 'sm', className: '--ui-hoverable'})}
				</a>
				<div class="superset-dashboard-related-entities-list-sub-item__button">
					${button.render()}
				</div>
			</div>
		`;
	}

	#getSubItemIconByType(type: string): ?HTMLElement
	{
		switch (type) {
			case 'chart':
				return Tag.render`
					<span class="ui-icon-set --statistics-arrow superset-dashboard-related-entities-list-item__icon"></span>
				`;
			case 'dataset':
				return Tag.render`
					<span class="ui-icon-set --o-database superset-dashboard-related-entities-list-item__icon"></span>
				`;
		}

		return null;
	}
}


export {
	DashboardRelatedEntitiesList
};
