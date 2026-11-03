import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';

import { Layout } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { LayoutManager } from 'im.v2.lib.layout';
import { type ImModelLayout } from 'im.v2.model';

import 'im.v2.css.classes';

import './settings-button.css';

const ICON_NAME = OutlineIcons.SETTINGS_L;

// Opens the same settings screen the top menu item used to open; gated by the shell flag itself,
// so the list containers place it unconditionally.
// @vue/component
export const SettingsButton = defineComponent({
	name: 'ImListContainerSettingsButton',
	components: { BIcon } as { BIcon: typeof BIcon },
	computed: {
		ICON_NAME: () => ICON_NAME,
		isAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isChatShellNavigationWebAvailable);
		},
	},
	methods: {
		handleClick(): void
		{
			Analytics.getInstance().settings.onOpenFromListHeader();

			void LayoutManager.getInstance().setLayout({ name: Layout.settings } as ImModelLayout);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<button
			v-if="isAvailable"
			type="button"
			class="bx-im-list-container-settings-button__container --focus-visible"
			data-testid="im-list-settings-btn"
			:aria-label="loc('IM_LIST_CONTAINER_SETTINGS_BUTTON_ARIA')"
			@click="handleClick"
		>
			<BIcon
				class="bx-im-list-container-settings-button__icon"
				:name="ICON_NAME"
				:aria-hidden="true"
			/>
		</button>
	`,
});
