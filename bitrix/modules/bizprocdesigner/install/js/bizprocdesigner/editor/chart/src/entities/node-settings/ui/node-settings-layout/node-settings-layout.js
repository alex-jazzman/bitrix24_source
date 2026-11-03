import { BIcon } from 'ui.icon-set.api.vue';

import { bindMultipleSelectBehavior } from '../../../../features/node-settings/utils/multiple-select-behavior';
import { useLoc } from '../../../../shared/composables';
import { useNodeSettingsStore } from '../../stores/node-settings-store';

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
	setup(): { getMessage: () => string; settingsStore: useNodeSettingsStore; }
	{
		const { getMessage } = useLoc();

		return { getMessage, settingsStore: useNodeSettingsStore() };
	},
	data(): { multipleSelectBehaviorDisposer: Function | null }
	{
		return {
			multipleSelectBehaviorDisposer: null,
		};
	},
	computed:
	{
		// Only an agent-driven show asks for the fade; a user click must stay instant. The flag has
		// to reach Transition as a strict boolean: `css` defaults to true, so an absent one would
		// animate what nobody asked to animate. The loading skeleton takes the whole subtree down
		// with it, so the content comes back together with its Transition, hence `appear`, without
		// which a freshly mounted pair plays nothing.
		shouldShowWithTransition(): boolean
		{
			return this.settingsStore.shouldShowWithTransition === true;
		},
	},
	watch:
	{
		isShown(value: boolean): void
		{
			if (value)
			{
				this.$nextTick(() => this.mountMultipleSelectBehavior());

				return;
			}

			this.unmountMultipleSelectBehavior();
		},
	},
	mounted(): void
	{
		this.mountMultipleSelectBehavior();
	},
	updated(): void
	{
		this.mountMultipleSelectBehavior();
	},
	beforeUnmount(): void
	{
		this.unmountMultipleSelectBehavior();
	},
	methods:
	{
		// The fade belongs to the show that asked for it, so the flag goes down as soon as it has
		// played: the content of this panel is a tab, and switching tabs on the node a series left
		// behind has to stay as instant as any other click of the user. `appear` declares no
		// after-appear hook of its own, so Vue routes the very first play through this one too.
		onContentShown(): void
		{
			this.settingsStore.finishShowTransition();
		},
		mountMultipleSelectBehavior(): void
		{
			if (this.multipleSelectBehaviorDisposer || !this.isShown || !this.$refs.layout)
			{
				return;
			}

			this.multipleSelectBehaviorDisposer = bindMultipleSelectBehavior({
				roots: [this.$refs.layout],
			});
		},
		unmountMultipleSelectBehavior(): void
		{
			if (this.multipleSelectBehaviorDisposer)
			{
				this.multipleSelectBehaviorDisposer();
				this.multipleSelectBehaviorDisposer = null;
			}
		},
	},
	template: `
		<div
			v-if="isShown"
			ref="layout"
			class="editor-chart-node-settings-layout"
			:class="{ '--saving': isSaving, '--loading': isLoading }"
			:data-testid="$testId('bizprocdesigner-complex-node-settings')"
		>
			<template v-if="!isLoading">
				<slot name="header" />
				<div class="editor-chart-node-settings-layout__controls">
					<slot name="tabs" />
					<slot name="data-inspector-toggle" />
				</div>
				<Transition
					:css="shouldShowWithTransition"
					name="node-settings-transition"
					appear
					@after-enter="onContentShown"
				>
					<slot name="content" />
				</Transition>
				<div class="editor-chart-node-settings-layout__footer">
					<slot name="actions" />
				</div>
			</template>
		</div>
	`,
};
