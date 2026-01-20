import { useLoc } from '../../../shared/composables';

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
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	template: `
		<button
			class="ui-btn --air ui-btn-lg ui-btn-no-caps"
			:class="{'ui-btn-wait': isSaving }"
		>
			{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE') }}
		</button>
	`,
};
