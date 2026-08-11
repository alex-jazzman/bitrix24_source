import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';

import './node-settings-rules-inspector-toggle-button.css';

// @vue/component
export const NodeSettingsRulesInspectorToggleButton = {
	name: 'NodeSettingsRulesInspectorToggleButton',
	components: {
		BIcon,
	},
	props: {
		isVisible: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:isVisible'],
	computed: {
		iconName(): string
		{
			return this.isVisible ? Outline.CROSSED_EYE : Outline.OBSERVER;
		},
		buttonText(): string
		{
			return this.isVisible
				? Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TOGGLE_BUTTON_HIDE')
				: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TOGGLE_BUTTON_SHOW')
			;
		},
	},
	methods: {
		onToggle(): void
		{
			this.$emit('update:isVisible', !this.isVisible);
		},
	},
	template: `
		<div class="node-settings-rules-toggle-inspector-button" 
			 @click="onToggle"
		>
			<div class="node-settings-rules-toggle-inspector-button__icon">
				<BIcon :name="iconName" :size="24"/>
			</div>
			<span class="node-settings-rules-toggle-inspector-button__text">
				{{ buttonText }}
			</span>
		</div>
	`,
};
