import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import 'im.v2.css.classes';

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
		handleActivationKeydown(event: KeyboardEvent): void
		{
			// Only the button itself reacts; keydowns bubbling up from nested controls stay with them.
			if (event.target !== event.currentTarget)
			{
				return;
			}

			if (event.key === 'Enter' || event.key === ' ')
			{
				// Synthesize the native click the mouse path uses: the parent binds @click, which falls
				// through to this root element, so keyboard and mouse share one handler.
				event.preventDefault();
				this.$el.click();
			}
		},
	},
	template: `
		<div
			class="bx-im-collab-card-new-tab__container --ui-context-content-light --focus-visible"
			data-testid="im-collab-card-new-tab-button"
			role="button"
			tabindex="0"
			:aria-label="loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_NEW_TAB_TITLE')"
			:title="loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_NEW_TAB_TITLE')"
			@keydown="handleActivationKeydown"
		>
			<BIcon :name="OutlineIcons.OPEN_NEW" :hoverable="true" class="bx-im-collab-card-new-tab__icon" />
		</div>
	`,
};
