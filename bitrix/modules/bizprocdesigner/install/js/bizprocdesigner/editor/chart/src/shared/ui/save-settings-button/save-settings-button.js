import { useLoc } from '../../composables';

// @vue/component
export const SaveSettingsButton = {
	name: 'save-settings-button',
	props:
	{
		isSaving:
		{
			type: Boolean,
			required: true,
		},
		/**
		 * The save is unavailable right now. Off by default, so a caller that has nothing to wait for
		 * keeps the button as it was.
		 * Marked and dimmed, not disabled: like the add controls of the panel the button stays
		 * focusable, and the press is answered by the handler it is bound to.
		 */
		isDisabled:
		{
			type: Boolean,
			default: false,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	template: `
		<button
			class="ui-btn --air ui-btn-lg ui-btn-no-caps"
			:class="{ 'ui-btn-wait': isSaving, 'ui-btn-disabled': isDisabled }"
			:aria-disabled="isDisabled"
		>
			{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE') }}
		</button>
	`,
};
