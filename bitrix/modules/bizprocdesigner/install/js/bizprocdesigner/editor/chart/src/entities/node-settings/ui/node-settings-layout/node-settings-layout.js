import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

import './style.css';

// @vue/component
export const NodeSettingsLayout = {
	name: 'NodeSettingsLayout',
	components: { BIcon },
	props:
	{
		isLoading:
		{
			type: Boolean,
			required: true,
		},
		isSaving:
		{
			type: Boolean,
			required: true,
		},
		isShown:
		{
			type: Boolean,
			required: true,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	template: `
		<div
			v-if="isShown"
			class="editor-chart-node-settings-layout"
			:class="{ '--saving': isSaving, '--loading': isLoading }"
		>
			<template v-if="!isLoading">
				<slot name="header" />
				<div class="editor-chart-node-settings-layout__controls">
					<slot name="tabs" />
					<slot name="data-inspector-toggle" />
				</div>
				<slot name="content" />
				<div class="editor-chart-node-settings-layout__footer">
					<slot name="actions" />
				</div>
			</template>
		</div>
	`,
};
