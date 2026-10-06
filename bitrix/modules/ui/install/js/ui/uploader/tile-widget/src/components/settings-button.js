import { Loc } from 'main.core';

import type { BitrixVueComponentProps } from 'ui.vue3';

export const SettingsButton: BitrixVueComponentProps = {
	inject: ['widgetOptions', 'emitter'],
	data: () => ({
		selected: false,
	}),
	computed: {
		buttonLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_SETTINGS_LABEL');
		},
	},
	methods: {
		handleSettingsClick(): void
		{
			this.emitter.emit(
				'SettingsButton:onClick',
				{
					container: this.$refs['container'],
					button: this,
				}
			);
		},

		getContainer(): HTMLElement
		{
			return this.$refs['container'];
		},

		select(): void
		{
			this.selected = true;
		},

		deselect(): void
		{
			this.selected = false;
		}
	},
	// language=Vue
	template: `
		<button
			type="button"
			class="ui-tile-uploader-settings"
			data-testid="ui-tile-uploader-settings-btn"
			:class="{ '--selected': selected }"
			:aria-label="buttonLabel"
			aria-haspopup="menu"
			:aria-expanded="selected ? 'true' : 'false'"
			@click="handleSettingsClick"
			ref="container"
		></button>
	`
};
