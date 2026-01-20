import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

import { DragRuleEntity } from '../../directives/drag-rule-entity';

// eslint-disable-next-line no-unused-vars
import type { TRuleCard, NodeSettings } from '../types';

// @vue/component
export const NodeSettingsRulesLayout = {
	name: 'node-settings-rules-layout',
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
		currentRuleId:
		{
			type: String,
			required: true,
		},
		isSaving:
		{
			type: Boolean,
			required: true,
		},
		isRuleSettingsShown:
		{
			type: Boolean,
			required: true,
		},
	},
	emits: ['close', 'drop', 'scroll-layout'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		ruleCards(): Array<TRuleCard>
		{
			return this.nodeSettings.rules.get(this.currentRuleId)?.ruleCards ?? [];
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
		<transition-group name="slide-rule-panel">
			<div
				v-if="isRuleSettingsShown"
				class="node-settings-rules-panel"
				:class="{ '--saving': isSaving }"
			>
				<div class="node-settings-rules-panel__header">
					<BIcon
						:size="20"
						:data-test-id="$testId('complexNodeRuleSettingsClose')"
						name="arrow-left-l"
						color="#828b95"
						class="node-settings-rules-panel__header_back"
						@click="$emit('close')"
					/>
					<span class="node-settings-rules-panel__header_label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULES_LAYOUT_TITLE') }}
					</span>
					<slot name="rules-dropdown" />
					<!--
					<BIcon
						:size="20"
						name="o-question"
						color="#a8adb4"
						class="node-settings-rules-panel__header_question"
					/>
					-->
				</div>
				<div
					class="node-settings-rules-panel__content"
					v-drag-construction="onDrop"
					@scroll="$emit('scroll-layout')"
				>
					<slot
						v-for="ruleCard in ruleCards"
						:key="ruleCard.id"
						:ruleCard="ruleCard"
						name="ruleCard"
					/>
					<slot v-if="ruleCards.length === 0"
						name="addRuleCardButton"
					/>
				</div>
				<div class="node-settings-rules-panel__footer">
					<slot name="actions" />
				</div>
			</div>
			<div
				v-if="isRuleSettingsShown"
				class="node-settings-rules-layout__back"
			></div>
		</transition-group>
	`,
};
