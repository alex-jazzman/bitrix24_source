import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { watch, computed } from 'ui.vue3';
import { Loc } from 'main.core';
import { diagramStore } from '../../../entities/blocks';
import { useDebugStatus } from '../../composables';
import { DEBUG_BAR_LABELS } from '../../../entities/debug-bar/constants';

// @vue/component
export const DebugButton = {
	name: 'DebugButton',
	components: {
		BIcon,
	},
	setup()
	{
		const { isDebugEnabled, isLoading, toggleDebug, checkDebugStatus } = useDebugStatus();
		const diagramStoreObj = diagramStore();

		watch(
			() => diagramStoreObj.templateId,
			(newTemplateId) => {
				if (newTemplateId && newTemplateId > 0)
				{
					checkDebugStatus(newTemplateId);
				}
			},
			{ immediate: true },
		);

		const buttonTitle = computed(() => {
			return isDebugEnabled.value
				? Loc.getMessage(DEBUG_BAR_LABELS.BUTTON_DISABLE_TITLE)
				: Loc.getMessage(DEBUG_BAR_LABELS.BUTTON_ENABLE_TITLE);
		});

		return {
			isDebugEnabled,
			isLoading,
			toggleDebug,
			buttonTitle,
			outline: Outline,
		};
	},
	template: `
		<button
			@click="toggleDebug"
			:disabled="isLoading"
			:class="{
				'bp-debug-button': true,
				'bp-debug-button--active': isDebugEnabled,
				'bp-debug-button--loading': isLoading,
			}"
			:title="buttonTitle"
		>
			<BIcon
				:name="outline.BUG"
				:size="24"
				:color="isDebugEnabled ? 'var(--designer-bp-entities-icons)' : 'var(--ui-color-base-4)'"
			/>
		</button>
	`,
};
