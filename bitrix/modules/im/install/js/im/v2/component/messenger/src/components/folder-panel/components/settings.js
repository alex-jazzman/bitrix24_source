import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { PanelSettingsMenu } from '../classes/panel-settings-menu';

// @vue/component
export const PanelSettings = {
	name: 'PanelSettings',
	components: { BIcon },
	emits: ['openFolderList'],
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	created()
	{
		this.contextMenuManager = new PanelSettingsMenu();
		this.contextMenuManager.subscribe(PanelSettingsMenu.events.openFolderList, () => this.$emit('openFolderList'));
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods: {
		onSettingsClick()
		{
			this.contextMenuManager.openMenu({}, this.$refs.icon);
		},
	},
	template: `
		<button
			type="button"
			class="bx-im-messenger-folder-panel__settings_container"
			aria-haspopup="menu"
			data-testid="folder-panel-settings-btn"
			ref="icon"
			@click="onSettingsClick"
		>
			<BIcon
				:name="OutlineIcons.SETTINGS_L"
				:hoverable="true"
				class="bx-im-messenger-folder-panel__settings"
			/>
		</button>
	`,
};
