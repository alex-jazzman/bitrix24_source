import { Dom, Tag } from 'main.core';
import { Line } from 'ui.system.skeleton';

const SKELETON_TAB_WIDTHS = [70, 49, 63, 128];

export class CatalogSkeleton
{
	renderPopup(itemCount: number): HTMLElement
	{
		const tabsNode = Tag.render`
			<nav class="vibecode-catalog__tabs vibecode-catalog__tabs--placeholder" aria-hidden="true"></nav>
		`;

		for (const width of SKELETON_TAB_WIDTHS)
		{
			Dom.append(Line(width, 26, 99), tabsNode);
		}

		return Tag.render`
			<div class="vibecode-catalog vibecode-catalog--loading">
				<header class="vibecode-catalog__header">
					<h3 class="vibecode-catalog__title ui-headline --md --accent">
						${Line(200, 26)}
					</h3>
					<div class="vibecode-catalog__search vibecode-catalog__search--placeholder" aria-hidden="true">
						${Line(null, 34)}
					</div>
					${tabsNode}
				</header>
				<div class="vibecode-catalog__content">
					<div class="vibecode-catalog__body vibecode-catalog__body--static">
						${this.#renderList(itemCount)}
					</div>
				</div>
			</div>
		`;
	}

	appendItems(container: HTMLElement, itemCount: number): void
	{
		for (let i = 0; i < itemCount; i++)
		{
			Dom.append(this.renderItem(), container);
		}
	}

	renderItem(): HTMLElement
	{
		return Tag.render`
			<li class="vibecode-catalog__item vibecode-catalog__item--placeholder" aria-hidden="true">
				<span class="vibecode-catalog__item-icon vibecode-catalog__item-icon--placeholder">
					${Line(56, 56)}
				</span>
				<div class="vibecode-catalog__item-content vibecode-catalog__item-content--placeholder">
					${Line(136, 14)}
					<div class="vibecode-catalog__item-subtitle-placeholder">
						${Line(null, 10)}
						${Line(168, 10)}
					</div>
				</div>
			</li>
		`;
	}

	#renderList(itemCount: number): HTMLElement
	{
		const listNode = Tag.render`<ul class="vibecode-catalog__list"></ul>`;

		this.appendItems(listNode, itemCount);

		return listNode;
	}
}
