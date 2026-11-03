import { ajax, Loc, Tag } from 'main.core';
import { Popup } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';
import { BannerDispatcher } from 'ui.banner-dispatcher';

import './kanban-sort-popup.css';

const PROMOTION_ID = 'tasks_kanban_field_sort';
const BIND_ELEMENT_ID = 'tasks-popupMenuOptions';

function message(phraseId: string): string
{
	return Loc.getMessage(phraseId) ?? '';
}

export class KanbanSortPopup
{
	static show(): void
	{
		new this().showPopup();
	}

	showPopup(): void
	{
		const bindElement = document.getElementById(BIND_ELEMENT_ID);
		if (!bindElement)
		{
			return;
		}

		BannerDispatcher.normal.toQueue((onDone: Function): Popup => {
			const popup = this.#createPopup(bindElement, onDone);
			popup.show();

			// the hint takes no focus, so a screen reader learns about it only from the live region
			LiveAnnouncer.announce(message('TASKS_COMPONENT_ONBOARDING_KANBAN_SORT_POPUP_TEXT'));

			this.#setViewed();

			return popup;
		});
	}

	#createPopup(bindElement: HTMLElement, onDone: Function): Popup
	{
		return new Popup({
			className: 'tasks-onboarding-kanban-sort-popup-wrapper',
			content: this.#getContent(),
			bindElement,
			ariaLabel: message('TASKS_COMPONENT_ONBOARDING_KANBAN_SORT_POPUP_ARIA_LABEL'),
			background: 'var(--ui-color-bg-content-inapp)',
			angle: true,
			autoHide: true,
			autoHideHandler: () => true,
			cacheable: false,
			animation: 'fading',
			padding: 0,
			maxWidth: 380,
			closeByEsc: true,
			closeIcon: true,
			// a hint must not steal the focus on its own and must not hold it: the board stays usable
			focusTrap: false,
			events: {
				// the popup is not cacheable, so onDestroy fires once whichever way it was closed
				onDestroy: (): void => {
					onDone();
				},
			},
		});
	}

	#getContent(): HTMLElement
	{
		return Tag.render`
			<div class="tasks-onboarding-kanban-sort-popup" data-testid="tasks-kanban-sort-onboarding">
				${message('TASKS_COMPONENT_ONBOARDING_KANBAN_SORT_POPUP_TEXT')}
			</div>
		`;
	}

	#setViewed(): void
	{
		// best-effort mark: if the request fails, the hint simply shows up next time
		ajax.runAction('tasks.promotion.setViewed', {
			data: {
				promotion: PROMOTION_ID,
			},
		}).catch(() => {});
	}
}
