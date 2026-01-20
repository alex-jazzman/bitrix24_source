import { Dom, Reflection } from 'main.core';
import './tour.css';
import 'ui.design-tokens';
import { BaseTour } from '../tools/base-tour';

const UserOptions = Reflection.namespace('BX.userOptions');

/** @memberof BX.Crm.Timeline.MenuBar.ToDo */
export default class Tour extends BaseTour
{
	canShow(): boolean
	{
		const { guideBindElement } = this.getParams();

		const mainSection = document.querySelector('[data-tab-id="main"]');
		if (!mainSection || Dom.style(mainSection, 'display') === 'none')
		{
			return false;
		}

		const style = window.getComputedStyle(guideBindElement);

		return document.contains(guideBindElement)
			&& style.display !== 'none'
			&& style.visibility !== 'hidden'
			&& style.opacity !== '0'
			&& guideBindElement.offsetWidth > 0
			&& guideBindElement.offsetHeight > 0
		;
	}

	saveUserOption(optionName: ?string = null): void
	{
		UserOptions.save('crm', 'todo', 'isTimelineTourViewedInWeb', 1);
	}
}
