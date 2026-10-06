import { Reflection } from 'main.core';
import { SidePanel } from 'ui.sidepanel';

const namespace = Reflection.namespace('BX.Crm.Copilot.CallAssessmentList');

export class ActionButton {
	#isActive: boolean;
	#sliderWidth: number;

	constructor(isActiveCopilot: boolean = true, sliderWidth: number = 700)
	{
		this.#isActive = isActiveCopilot;
		this.#sliderWidth = sliderWidth;
	}

	execute(): void
	{
		if (this.#isActive)
		{
			if (!SidePanel.Instance)
			{
				console.error('SidePanel.Instance not found');

				return;
			}

			SidePanel.Instance.open(
				`/crm/copilot-call-assessment/details/0/`,
				{
					cacheable: false,
					//width: this.#sliderWidth,
					allowChangeHistory: false,
				}
			);

			return;
		}

		top.BX.UI?.InfoHelper?.show('limit_v2_crm_copilot_call_assessment_off');
	}
}

namespace.ActionButton = ActionButton;
