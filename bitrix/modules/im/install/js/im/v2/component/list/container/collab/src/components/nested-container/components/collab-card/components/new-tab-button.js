import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import '../css/new-tab-button.css';

// @vue/component
export const NewTabButton = {
	name: 'NewTabButton',
	components: { BIcon },
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-collab-card-new-tab__container --ui-context-content-light" :title="loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_NEW_TAB_TITLE')">
			<BIcon :name="OutlineIcons.OPEN_NEW" :hoverable="true" class="bx-im-collab-card-new-tab__icon" />
		</div>
	`,
};
