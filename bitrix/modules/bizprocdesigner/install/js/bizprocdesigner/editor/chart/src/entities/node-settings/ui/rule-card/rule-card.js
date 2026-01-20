import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

// eslint-disable-next-line no-unused-vars
import type { TRuleCard } from '../types';

// @vue/component
export const RuleCard = {
	name: 'rule-card',
	components: { BIcon },
	props:
	{
		/** @type TRuleCard */
		ruleCard:
		{
			type: Object,
			required: true,
		},
	},
	created(): void
	{
		this.iconColor = 'var(--ui-color-palette-gray-50)';
	},
	template: `
		<div
			data-name="rule-card"
			class="rule-card"
			:data-id="ruleCard.id"
		>
			<div class="rule-card__top">
				<BIcon
					name="drag-s"
					class="rule-card__dnd-icon"
					draggable="true"
					:color="iconColor"
				/>
				<slot name="deleteRuleCard" />
				<!--
				<div class="rule-card__top_delimeter"></div>
				<BIcon
					:size="20"
					name="o-question"
					:color="iconColor"
				/>
				-->
			</div>
			<slot
				v-for="(construction, index) in ruleCard.constructions"
				:key="construction.id"
				:construction="construction"
				:position="index"
			/>
			<slot
				name="addConstructionButton"
			/>
		</div>
	`,
};
