import { defineComponent, PropType } from 'ui.vue3';
import { Type } from 'main.core';

import { Subtitle } from './elements/subtitle';
import { Settings } from './elements/settings';

import { type SettingButton, type SubtitleData } from '../types';

export const Header = defineComponent({
	name: 'Header',

	components: {
		Subtitle,
		Settings,
	},

	emits: ['chooseNewScript'],

	props: {
		title: {
			type: String,
			required: true,
		},
		subtitle: {
			type: Object as PropType<SubtitleData>,
		},
		settings: {
			type: Array as PropType<SettingButton[]>,
			required: true,
		},
		shareLink: {
			type: String,
			default: null,
		},
	},

	computed: {
		hasSubtitle(): boolean
		{
			return !Type.isNil(this.subtitle);
		},
		hasSettings(): boolean
		{
			return this.settings.length > 0;
		},
	},

	template: `
		<div class="crm-ai-report-drawer__header">
			<div class="crm-ai-report-drawer__title-section">
				<h3 class="crm-ai-report-drawer__title ui-typography-heading-h3">{{ title }}</h3>
				<Subtitle v-if="hasSubtitle" :subtitleData="subtitle" />
			</div>
			<Settings
				v-if="hasSettings"
				:buttons="settings"
				:shareLink="shareLink"
				@chooseNewScript="$emit('chooseNewScript', $event)"
			/>
		</div>
	`,
});
