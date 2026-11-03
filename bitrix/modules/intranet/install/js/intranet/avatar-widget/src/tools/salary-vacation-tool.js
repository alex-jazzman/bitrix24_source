import { Dom, Event, Tag, Text } from 'main.core';
import { PopupManager } from 'main.popup';
import { SalaryVacationMenu } from 'humanresources.hcmlink.salary-vacation-menu';

import { Analytics } from '../analytics';
import { BaseMainTool } from './base-main-tool';

const SALARY_VACATION_MENU_ID = 'hcmLink-vacation-salary-menu';

export class SalaryVacationTool extends BaseMainTool
{
	getIconClass(): string
	{
		return '--o-favorite';
	}

	getLayout(): HTMLElement
	{
		const container = super.getLayout();
		const button = this.getButton();

		if (this.#getMenu().isHidden())
		{
			return null;
		}

		Dom.attr(button, {
			'aria-haspopup': 'menu',
			'aria-expanded': 'false',
		});

		if (this.#getMenu().isDisabled())
		{
			const description = this.#getDisabledDescription();
			Dom.append(description, container);
			Dom.attr(button, {
				'aria-disabled': 'true',
				'aria-describedby': description.id,
			});
			Dom.attr(container, 'data-hint', '');
			Dom.attr(container, 'data-hint-interactivity', '');
			Event.bind(container, 'mouseenter', () => {
				this.#getHintInstance().show(container, this.options.disabledHint);
			});

			Event.bind(container, 'mouseleave', () => {
				setTimeout(() => {
					const hintPopup = this.#getHintInstance()?.popup?.popupContainer;

					if (!hintPopup || !hintPopup.matches(':hover'))
					{
						this.#getHintInstance().hide(container);
					}
				}, 100);
			});
		}

		return container;
	}

	onClick(): void
	{
		if (this.#getMenu().isHidden() || this.#getMenu().isDisabled())
		{
			return;
		}

		Analytics.send(Analytics.EVENT_CLICK_SALARY);
		this.#getMenu().show(this.getButton());
		this.#syncMenuState();
	}

	#syncMenuState(): void
	{
		const popup = PopupManager.getPopupById(SALARY_VACATION_MENU_ID);
		if (!popup)
		{
			return;
		}

		this.cache.remember('salaryMenuStateHandlers', () => {
			popup.subscribe('onShow', () => {
				Dom.attr(this.getButton(), 'aria-expanded', 'true');
			});
			popup.subscribe('onClose', () => {
				Dom.attr(this.getButton(), 'aria-expanded', 'false');
			});

			return true;
		});

		Dom.attr(this.getButton(), 'aria-expanded', popup.isShown() ? 'true' : 'false');
		Dom.attr(popup.getPopupContainer(), 'aria-label', this.getTitle());
	}

	#getMenu(): SalaryVacationMenu
	{
		return this.cache.remember('salaryMenu', () => {
			return new SalaryVacationMenu();
		});
	}

	#getHintInstance()
	{
		return this.cache.remember('hint', () => {
			return BX.UI.Hint.createInstance({
				popupParameters: {
					fixed: true,
				},
			});
		});
	}

	#getDisabledDescription(): HTMLElement
	{
		return this.cache.remember('disabledDescription', () => {
			const hintContainer = Tag.render`<div>${this.options.disabledHint}</div>`;

			return Tag.render`
				<visually-hidden id="intranet-avatar-widget-salary-vacation-disabled-description">
					${Text.encode(hintContainer.textContent)}
				</visually-hidden>
			`;
		});
	}

	getId(): string
	{
		return 'salary-vacation';
	}
}
