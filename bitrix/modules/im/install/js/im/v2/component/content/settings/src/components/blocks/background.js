import { Settings } from 'im.v2.const';
import { SelectableBackground, ThemeManager, type BackgroundStyle } from 'im.v2.lib.theme';
import { SettingsService } from 'im.v2.provider.service.settings';

import './css/background.css';

// @vue/component
export const ChatBackground = {
	name: 'ChatBackground',
	emits: ['close'],
	computed:
	{
		currentBackgroundId(): string
		{
			return this.$store.getters['application/settings/get'](Settings.appearance.background).toString();
		},
		backgroundIdList(): string[]
		{
			return Object.keys(SelectableBackground);
		},
	},
	methods:
	{
		getBackgroundStyleById(backgroundId: string): BackgroundStyle
		{
			return ThemeManager.getBackgroundStyleById(backgroundId);
		},
		onBackgroundClick(backgroundId: string)
		{
			const settingsService = new SettingsService();
			settingsService.changeSetting(Settings.appearance.background, backgroundId);
		},
	},
	template: `
		<div class="bx-im-settings-background__container">
			<div class="bx-im-settings-background__list">
				<div
					v-for="id in backgroundIdList"
					:key="id"
					:style="getBackgroundStyleById(id)"
					class="bx-im-background-select-popup__item bx-im-settings-background__item"
					:class="{'--active': id === currentBackgroundId}"
					@click="onBackgroundClick(id)"
				></div>
			</div>
		</div>
	`,
};
