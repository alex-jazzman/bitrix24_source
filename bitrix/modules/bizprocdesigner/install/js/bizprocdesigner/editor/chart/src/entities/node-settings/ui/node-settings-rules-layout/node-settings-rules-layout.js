import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';
import { DragRuleEntity } from '../../directives/drag-rule-entity';
import { type TRuleCard, type OrderPayload } from '../../types';

import './style.css';

// @vue/component
export const NodeSettingsRulesLayout = {
	name: 'NodeSettingsRulesLayout',
	components: { BIcon },
	directives: { 'drag-construction': DragRuleEntity },
	props:
	{
		/** @type NodeSettings */
		nodeSettings:
		{
			type: Object,
			required: true,
		},
		/** @type Port */
		currentRule:
		{
			type: [Object, null],
			required: true,
		},
		isSaving:
		{
			type: Boolean,
			required: true,
		},
	},
	emits: ['drop', 'scroll-layout'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		ruleCards(): Array<TRuleCard>
		{
			const store = this.currentRule.type === PORT_TYPES.input
				? this.nodeSettings.rules
				: this.nodeSettings.relations
			;

			return store.get(this.currentRule.id).ruleCards;
		},
	},
	methods:
	{
		onDrop(payload: OrderPayload): void
		{
			this.$emit('drop', payload);
		},
	},
	template: `
		<div
			class="editor-chart-node-settings-rules-layout"
			:class="{ '--saving': isSaving }"
			@scroll="$emit('scroll-layout')"
		>
			<template v-if="currentRule">
				<slot name="addConstructionToolbar" />
				<div
					class="editor-chart-node-settings-rules-layout__content"
					v-drag-construction="onDrop"
				>
					<slot
						v-for="ruleCard in ruleCards"
						:key="ruleCard.id"
						:ruleCard="ruleCard"
						name="ruleCard"
					/>
					<template
						v-if="ruleCards.length === 0"
					>
						<div class="editor-chart-node-settings-rules-layout__empty">
							<h3 class="editor-chart-node-settings-rules-layout__empty_head">
								{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_SETTINGS_EMPTY_STATE_HEAD') }}
							</h3>
							<p class="editor-chart-node-settings-rules-layout__empty_text">
								{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_SETTINGS_EMPTY_STATE_TEXT') }}
							</p>
						</div>
					</template>
				</div>
			</template>
		</div>
	`,
};
