import { Text, Type } from 'main.core';
import { DeadlineAndPingSelectorBackgroundColor } from '../../enums/deadline-and-ping-selector-background';

export default {
	props: {
		isScheduled: Boolean,
		deadlineBlock: Object,
		pingSelectorBlock: Object,
		deadlineBlockTitle: String,
		backgroundToken: String,
		backgroundColor: {
			type: String,
			required: false,
			default: null,
		},
	},

	computed: {
		className(): Object
		{
			return {
				'crm-timeline__card-container_info': true,
				'--inline': true,
				'crm-timeline-block-deadline-and-ping-selector-deadline-wrapper': true,
				'--orange': this.backgroundToken === DeadlineAndPingSelectorBackgroundColor.ORANGE,
				'--gray': this.backgroundToken === DeadlineAndPingSelectorBackgroundColor.GRAY,
			};
		},
		deadlineBlockStyle(): Object
		{
			if (this.isScheduled && Type.isStringFilled(this.backgroundColor))
			{
				return {
					'--crm-timeline-block-deadline-and-ping-selector-deadline_bg-color': Text.encode(this.backgroundColor),
				};
			}

			return {};
		},
	},

	// language=Vue
	template: `
		<span class="crm-timeline-block-deadline-and-ping-selector">
			<div 
				:class="className" 
				ref="deadlineBlock" 
				v-if="deadlineBlock"
				:style="deadlineBlockStyle"
			>
				<div class="crm-timeline__card-container_info-title" v-if="deadlineBlockTitle">
					{{deadlineBlockTitle}}&nbsp;
				</div>
				<component
					:is="deadlineBlock.rendererName"
					v-bind="deadlineBlock.properties"
				/>
			</div>
	
			<component
				v-if="pingSelectorBlock"
				:is="pingSelectorBlock.rendererName"
				v-bind="pingSelectorBlock.properties"
				ref="pingSelectorBlock"
			/>
		</span>	
	`,
};
