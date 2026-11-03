import { Builder, Dictionary } from 'crm.integration.analytics';
import { Reflection } from 'main.core';
import { sendData } from 'ui.analytics';
import { SidePanel } from 'ui.sidepanel';

const namespace = Reflection.namespace('BX.Crm.Copilot.CallAssessmentList');

export class ActionButton {
	#isActive: boolean;
	#sliderWidth: number;
	#isV2Enabled: boolean;

	constructor(isActiveCopilot: boolean = true, sliderWidth: number = 700, isV2Enabled: boolean = false)
	{
		this.#isActive = isActiveCopilot;
		this.#sliderWidth = sliderWidth;
		this.#isV2Enabled = isV2Enabled;
	}

	execute(): void
	{
		if (this.#isV2Enabled)
		{
			sendData(
				Builder.CallAssessment.GridActionsEvent
					.createDefault(Dictionary.ELEMENT_CREATE_BUTTON)
					.buildData(),
			);
		}

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
