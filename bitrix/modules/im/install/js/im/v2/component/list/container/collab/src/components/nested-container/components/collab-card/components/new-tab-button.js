import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import '../css/new-tab-button.css';

// @vue/component
export const NewTabButton = {
	name: 'NewTabButton',
	components: { BIcon },
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	template: `
		<div class="bx-im-collab-card-new-tab__container --ui-context-content-light">
			<BIcon :name="OutlineIcons.OPEN_NEW" :hoverable="true" class="bx-im-collab-card-new-tab__icon" />
		</div>
	`,
};
