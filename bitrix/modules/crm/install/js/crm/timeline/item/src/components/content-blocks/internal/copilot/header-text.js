import { NameService } from 'crm.ai.name-service';

import { EditableDescriptionAiStatus } from '../../../enums/editable-description-ai-status';
import { Loader } from './loader';

import '../../../../css/content-blocks/internal/copilot/header-text.css';

export default {
	components: {
		Loader,
	},
	props: {
		status: {
			type: String,
			required: true,
			validator: (value: string) => {
				return [
					EditableDescriptionAiStatus.NONE,
					EditableDescriptionAiStatus.SUCCESS,
					EditableDescriptionAiStatus.IN_PROGRESS,
				].includes(value);
			},
		},
	},

	computed: {
		text(): string
		{
			if (this.status === EditableDescriptionAiStatus.IN_PROGRESS)
			{
				return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_COPILOT_HEADER_PENDING', NameService.copilotNameReplacement());
			}

			if (this.status === EditableDescriptionAiStatus.SUCCESS)
			{
				return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_COPILOT_HEADER', NameService.copilotNameReplacement());
			}

			return '';
		},

		isAnimated(): boolean
		{
			return this.status === EditableDescriptionAiStatus.IN_PROGRESS;
		},

		className(): Array
		{
			return [
				'crm-timeline-block-internal-copilot-header',
				{
					'--animated': this.status === EditableDescriptionAiStatus.IN_PROGRESS,
				},
			];
		},
	},

	template: `
		<div :class="className">
			<div class="crm-timeline-block-internal-copilot-header-icon">
				<Loader v-if="isAnimated"></Loader>
			</div>
			<div class="crm-timeline-block-internal-copilot-header_text">{{ text }}</div>
			<div
				v-if="isAnimated"
				class="crm-timeline-block-internal-copilot-header_stage"
			>
				<div class="crm-timeline-block-internal-copilot-header_dot-flashing"></div>
			</div>
		</div>
	`,
};
