import { Router } from 'crm.router';
import { Type } from 'main.core';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { EditableDescriptionAiStatus } from '../components/enums/editable-description-ai-status';
import ConfigurableItem from '../configurable-item';
import 'crm_common';

import type { CopilotConfig } from './ai/copilot-base';
import { CopilotBase } from './ai/copilot-base';
import { type ActionParams } from './base';

export class RepeatSale extends CopilotBase
{
	#prevHeaderText: string;

	// region Base overridden methods
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;
		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Activity:RepeatSale:ShowRestrictionSlider')
		{
			this.#showRestrictionSlider();
		}

		if (!Type.isObject(actionData))
		{
			return;
		}

		if (action === 'Activity:RepeatSale:Schedule')
		{
			this.runScheduleAction(actionData.activityId, actionData.scheduleDate, actionData.description);
		}

		if (action === 'Activity:RepeatSale:LaunchCopilot')
		{
			void this.handleCopilotLaunch(item, actionData);
		}

		if (action === 'Activity:RepeatSale:OpenSegment')
		{
			this.#openSegment(actionData.activityId, actionData.segmentId);
		}
	}
	// endregion

	// region CopilotBase overridden methods
	getCopilotConfig(): CopilotConfig
	{
		return {
			actionEndpoint: 'crm.timeline.repeatsale.launchCopilot',
			validEntityTypes: [BX.CrmEntityType.enumeration.deal],
			agreementContext: 'audio', // @todo!
			onPreLaunch: (...args) => this.#handlePreLaunch(...args),
			onError: (...args) => this.#handleError(...args),
		};
	}
	// endregion

	// region jsEvent action handlers
	#handlePreLaunch(item: ConfigurableItem, actionData: Object): void
	{
		const descriptionBlock = item.getLayoutContentBlockById('description');
		const errorBlock = item.getLayoutContentBlockById('error');

		this.#prevHeaderText = descriptionBlock?.getHeaderText();

		descriptionBlock?.setHeaderText('');
		descriptionBlock?.setCopilotStatus(EditableDescriptionAiStatus.IN_PROGRESS);
		errorBlock?.closeBlock();
	}

	#handleError(item: ConfigurableItem, actionData: Object, response: Object): void
	{
		const descriptionBlock = item.getLayoutContentBlockById('description');

		descriptionBlock?.setHeaderText(this.#prevHeaderText);
		descriptionBlock?.setCopilotStatus(EditableDescriptionAiStatus.NONE);
	}

	#showRestrictionSlider(): void
	{
		FeaturePromotersRegistry.getPromoter({ featureId: 'limit_v2_crm_repeat_sale' }).show();
	}

	#openSegment(item: ConfigurableItem, segmentId: number): void
	{
		if (!Type.isInteger(segmentId))
		{
			return;
		}

		void Router.Instance.openRepeatSaleSegmentSlider(segmentId, true, {
			section: 'deal_section',
		});
	}
	// endregion

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return item.getType() === 'Activity:RepeatSale'
			|| item.getType() === 'RepeatSaleCreated'
			|| item.getType() === 'LaunchError'
		;
	}
}
