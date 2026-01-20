import { Button as ConfirmButton, ButtonSize } from 'ui.vue3.components.button';

// @vue/component
export const SelectButton = {
	name: 'SelectConfirm',
	components: { ConfirmButton },
	emits: ['click'],
	computed: {
		ButtonSize: () => ButtonSize,
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-desktop-mode-selection-banner__select-confirm_container">
			<span class="bx-im-desktop-mode-selection-banner__select-confirm_description">
				{{ loc('IM_DESKTOP_MODE_SELECTION_BANNER_MORE_DESCRIPTION_SELECT_CONFIRM') }}
			</span>
			<ConfirmButton
				class="bx-im-desktop-mode-selection-banner__select-confirm_button"
				:text="loc('IM_DESKTOP_MODE_SELECTION_BANNER_BUTTON_SELECT_CONFIRM')"
				:size="ButtonSize.EXTRA_LARGE"
				@click="$emit('click')"
			/>
		</div>
	`,
};
