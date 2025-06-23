import { Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Content } from './content';
import { SalaryVacationMenu } from 'humanresources.hcmlink.salary-vacation-menu';
import { Analytics } from '../analytics';
import type { SalaryVacationContentOptions } from '../types';

export class SalaryVacationContent extends Content
{
	#salaryVacationMenu: SalaryVacationMenu;

	constructor(options: SalaryVacationContentOptions)
	{
		super(options);
		this.#salaryVacationMenu = new SalaryVacationMenu();
	}

	getOptions(): SalaryVacationContentOptions
	{
		return super.getOptions();
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			if (this.#salaryVacationMenu.isHidden())
			{
				return null;
			}

			if (this.#salaryVacationMenu.isDisabled())
			{
				return this.#getDisabledState();
			}

			return this.#getActiveState();
		});
	}

	#getDisabledState(): HTMLElement
	{
		return this.cache.remember('disabledState', () => {
			EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:makeWithHint');

			return Tag.render`
				<div
					class="intranet-avatar-widget-item__wrapper"
					${this.#salaryVacationMenu.isDisabled() ? `data-hint="${this.getOptions().disabledHint}"` : ''}
					data-hint-no-icon
					data-hint-html
					data-hint-interactivity
					data-id="bx-avatar-widget-content-salary-vacation"
				 >
					<i class="ui-icon-set --o-favorite intranet-avatar-widget-item__icon"/>
					<span class="intranet-avatar-widget-item__title">${this.getOptions().title}</span>
					${this.#getChevron()}
				</div>
			`;
		});
	}

	#getActiveState(): HTMLElement
	{
		return this.cache.remember('activeState', () => {
			const onclick = () => {
				this.#salaryVacationMenu.show(this.#getChevron());
				Analytics.send(Analytics.EVENT_CLICK_SALARY);
			};

			return Tag.render`
				<div onclick="${onclick}" class="intranet-avatar-widget-item__wrapper" data-id="bx-avatar-widget-content-salary-vacation">
					<i class="ui-icon-set --active --o-favorite intranet-avatar-widget-item__icon"/>
					<span class="intranet-avatar-widget-item__title">${this.getOptions().title}</span>
					${this.#getChevron()}
				</div>
			`;
		});
	}

	#getChevron(): HTMLElement
	{
		return this.cache.remember('chevron', () => {
			return Tag.render`<i class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>`;
		});
	}
}
