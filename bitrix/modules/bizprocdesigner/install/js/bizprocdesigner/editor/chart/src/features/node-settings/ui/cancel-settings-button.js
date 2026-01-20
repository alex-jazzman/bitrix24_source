import { useLoc } from '../../../shared/composables';

// @vue/component
export const CancelSettingsButton = {
	name: 'cancel-settings-button',
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	template: `
		<button class="ui-btn ui-btn-lg ui-btn-link ui-btn-no-caps">
			{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DISCARD') }}
		</button>
	`,
};
