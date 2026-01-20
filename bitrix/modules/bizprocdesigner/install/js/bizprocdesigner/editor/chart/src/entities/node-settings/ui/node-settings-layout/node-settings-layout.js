import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

// @vue/component
export const NodeSettingsLayout = {
	name: 'node-settings-layout',
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
	emits: ['close'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	template: `
		<div
			v-if="isShown"
			class="node-settings"
			:class="{ '--saving': isSaving, '--loading': isLoading }"
		>
			<template v-if="!isLoading">
				<div class="node-settings__header">
					<span>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TITLE') }}</span>
					<BIcon
						class="node-settings__header_close-icon"
						name="cross-m"
						:size="20"
						:data-test-id="$testId('complexNodeSettingsClose')"
						color="#828b95"
						@click="$emit('close')"
					/>
				</div>
				<slot />
			</template>
			<div class="node-settings__footer">
				<slot
					v-if="!isLoading"
					name="actions"
				/>
			</div>
		</div>
	`,
};
