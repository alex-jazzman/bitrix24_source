import { Dom, Event, Loc, Tag } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';

import { CatalogSkeleton } from '../skeleton';
import { type TabController } from '../tab-controller';
import { CatalogPopupCompanyListEmptyState } from './popup-company-list-empty-state';
import { CatalogPopupMyListEmptyState } from './popup-my-list-empty-state';
import { CatalogPopupItem } from './popup-item';
import { CatalogState } from './popup-state-dropdown';
import { MY_TAB_ID } from '../constants';

type CatalogPopupListOptions = {
	onScroll: () => void,
	onChatOpen?: () => void,
	onReloadRequested?: () => void,
	initialSkeletonTiles: number,
	paginationSkeletonTiles: number,
};

type CatalogPopupListState = {
	activeTabId: string,
	controllers: Map<string, TabController>,
};

export class CatalogPopupList
{
	#onScroll: () => void;
	#onChatOpen: (() => void) | null;
	#onReloadRequested: (() => void) | null;
	#initialSkeletonTiles: number;
	#paginationSkeletonTiles: number;
	#skeleton: CatalogSkeleton = new CatalogSkeleton();
	#myEmptyState: CatalogPopupMyListEmptyState = new CatalogPopupMyListEmptyState();
	#companyEmptyState: CatalogPopupCompanyListEmptyState = new CatalogPopupCompanyListEmptyState();
	#bodyNode: HTMLElement | null = null;
	#listNode: HTMLElement | null = null;
	#lastState: CatalogPopupListState | null = null;

	constructor(options: CatalogPopupListOptions)
	{
		this.#onScroll = options.onScroll;
		this.#onChatOpen = options.onChatOpen ?? null;
		this.#onReloadRequested = options.onReloadRequested ?? null;
		this.#initialSkeletonTiles = options.initialSkeletonTiles;
		this.#paginationSkeletonTiles = options.paginationSkeletonTiles;
	}

	render(): HTMLElement
	{
		if (this.#bodyNode)
		{
			return this.#bodyNode;
		}

		this.#listNode = Tag.render`<ul class="vibecode-catalog__list"></ul>`;
		this.#bodyNode = Tag.render`<div class="vibecode-catalog__body" tabindex="-1"></div>`;
		Dom.append(this.#listNode, this.#bodyNode);

		Event.bind(this.#bodyNode, 'scroll', this.#onScroll);

		return this.#bodyNode;
	}

	renderItems(state: CatalogPopupListState): void
	{
		if (!this.#bodyNode || !this.#listNode)
		{
			return;
		}

		this.#lastState = state;
		const ctrl = state.controllers.get(state.activeTabId);

		if (!ctrl)
		{
			return;
		}

		const items = ctrl.getItems();
		const isLoading = ctrl.isLoading();

		// a failed first load leaves nothing to render: without this the list would be an
		// empty box with no way back
		if (items.length === 0 && !isLoading && ctrl.hasFailed())
		{
			this.#showLoadErrorState();

			return;
		}

		const shouldShowContentEmptyState = items.length === 0
			&& ctrl.isLoaded()
			&& !isLoading
			&& !ctrl.hasQuery()
			&& this.#hasContentEmptyState(state.activeTabId);

		if (shouldShowContentEmptyState)
		{
			this.#showContentEmptyState(state.activeTabId, ctrl.getState());

			return;
		}

		const listNode = this.#showList();

		Dom.attr(listNode, 'aria-busy', isLoading ? 'true' : null);

		if (items.length === 0 && isLoading)
		{
			this.#skeleton.appendItems(listNode, this.#initialSkeletonTiles);

			return;
		}
		const tab = ctrl.getConfig();
		const showHiddenBadge = ctrl.getState() === CatalogState.All;

		for (const item of items)
		{
			const reRender = () => {
				ctrl.resortForPin(item.id);
				if (this.#lastState)
				{
					this.renderItems(this.#lastState);
				}
			};

			const reRenderAfterRename = () => {
				if (!ctrl.hasQuery())
				{
					if (this.#lastState)
					{
						this.renderItems(this.#lastState);
					}

					return;
				}

				void ctrl.refresh().then((refreshed) => {
					if (!refreshed)
					{
						console.error('[vibecodeconnector.catalog] rename list re-read failed; showing locally updated item');
					}

					if (this.#lastState)
					{
						this.renderItems(this.#lastState);
					}
				});
			};
			const popupItem = new CatalogPopupItem(item, tab, {
				onPinToggled: reRender,
				onHiddenToggled: reRender,
				onHiddenCommitted: () => this.#onReloadRequested?.(),
				onRenamed: reRenderAfterRename,
				onChatOpen: () => this.#onChatOpen?.(),
				onOpened: (itemId: number) => ctrl.markOpened(itemId),
				showHiddenBadge,
			});
			Dom.append(popupItem.render(), listNode);
		}

		if (isLoading)
		{
			this.#skeleton.appendItems(listNode, this.#paginationSkeletonTiles);

			return;
		}

		if (items.length === 0 && ctrl.isLoaded())
		{
			Dom.append(this.#renderEmptyState(), listNode);
		}
	}

	containsFocus(): boolean
	{
		return this.#bodyNode !== null && this.#bodyNode.contains(document.activeElement);
	}

	isScrollThresholdReached(thresholdPx: number): boolean
	{
		if (!this.#bodyNode)
		{
			return false;
		}

		const distance = this.#bodyNode.scrollHeight - this.#bodyNode.scrollTop - this.#bodyNode.clientHeight;

		return distance <= thresholdPx;
	}

	updateSubtitleClamps(): void
	{
		if (!this.#listNode || !this.#listNode.isConnected)
		{
			return;
		}

		const subtitles = this.#listNode.querySelectorAll('.vibecode-catalog__item-subtitle');

		for (const subtitle of subtitles)
		{
			if (!(subtitle instanceof HTMLElement))
			{
				continue;
			}

			const lineHeight = Number.parseFloat(window.getComputedStyle(subtitle).lineHeight);
			const availableHeight = subtitle.getBoundingClientRect().height;
			const lines = lineHeight > 0
				? Math.max(1, Math.floor((availableHeight + 1) / lineHeight))
				: 1;

			Dom.style(subtitle, '-webkit-line-clamp', String(lines));
			Dom.style(subtitle, 'line-clamp', String(lines));
		}
	}

	destroy(): void
	{
		this.#toggleContentEmptyState(false);
		this.#bodyNode = null;
		this.#listNode = null;
		this.#lastState = null;
	}

	#showList(): HTMLElement
	{
		const listNode = this.#listNode;
		const bodyNode = this.#bodyNode;

		if (!listNode || !bodyNode)
		{
			throw new Error('CatalogPopupList is not rendered');
		}

		Dom.removeClass(bodyNode, 'vibecode-catalog__body--static');
		this.#toggleContentEmptyState(false);

		if (!listNode.isConnected)
		{
			Dom.clean(bodyNode);
			Dom.append(listNode, bodyNode);
		}

		Dom.clean(listNode);

		return listNode;
	}

	#showContentEmptyState(activeTabId: string, catalogState: string): void
	{
		if (!this.#bodyNode)
		{
			return;
		}

		Dom.clean(this.#bodyNode);
		Dom.addClass(this.#bodyNode, 'vibecode-catalog__body--static');

		if (catalogState === CatalogState.Hidden)
		{
			Dom.append(this.#renderHiddenEmptyState(), this.#bodyNode);
		}
		else
		{
			const emptyState = activeTabId === 'company'
				? this.#companyEmptyState
				: this.#myEmptyState;

			Dom.append(emptyState.render(), this.#bodyNode);
		}

		this.#toggleContentEmptyState(true);
	}

	#showLoadErrorState(): void
	{
		if (!this.#bodyNode)
		{
			return;
		}

		Dom.clean(this.#bodyNode);
		Dom.addClass(this.#bodyNode, 'vibecode-catalog__body--static');
		Dom.append(this.#renderLoadErrorState(), this.#bodyNode);
		this.#toggleContentEmptyState(true);
	}

	#renderLoadErrorState(): HTMLElement
	{
		const retryButton = new Button({
			className: 'vibecode-catalog__popup-empty-state-button',
			size: ButtonSize.MEDIUM,
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_LIST_LOAD_RETRY'),
			dataset: { testid: 'vibecode-catalog-load-error-retry' },
			props: {
				type: 'button',
			},
			onclick: (button: Button, event: MouseEvent) => {
				event.preventDefault();

				// the button is about to be disabled and then dropped with the whole
				// state: without this the focus would land on the document body
				this.#bodyNode?.focus();
				button.setDisabled(true);
				this.#onReloadRequested?.();
			},
		});

		return Tag.render`
			<div class="vibecode-catalog__content-empty-state" role="alert" data-testid="vibecode-catalog-load-error">
				<div class="vibecode-catalog__popup-empty-state vibecode-catalog__popup-empty-state--content">
					<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
						${Loc.getMessage('VIBECODECONNECTOR_CATALOG_LIST_LOAD_ERROR')}
					</p>
					${retryButton.render()}
				</div>
			</div>
		`;
	}

	#renderHiddenEmptyState(): HTMLElement
	{
		return Tag.render`
			<div class="vibecode-catalog__content-empty-state" data-testid="vibecode-catalog-hidden-empty">
				<p class="vibecode-catalog__hidden-empty-state ui-text --sm">
					${Loc.getMessage('VIBECODECONNECTOR_CATALOG_HIDDEN_EMPTY')}
				</p>
			</div>
		`;
	}

	#toggleContentEmptyState(isShown: boolean): void
	{
		const contentNode = this.#bodyNode?.closest('.vibecode-catalog__content');

		if (!(contentNode instanceof HTMLElement))
		{
			return;
		}

		const method = isShown ? Dom.addClass : Dom.removeClass;

		method(contentNode, 'vibecode-catalog__content--empty');
	}

	#hasContentEmptyState(tabId: string): boolean
	{
		return [MY_TAB_ID, 'company'].includes(tabId);
	}

	#renderEmptyState(): HTMLElement
	{
		return Tag.render`
			<li class="vibecode-catalog__item vibecode-catalog__item--empty">
				<div class="vibecode-catalog__item-content">
					<p class="vibecode-catalog__item-subtitle">
						${Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_EMPTY')}
					</p>
				</div>
			</li>
		`;
	}
}
