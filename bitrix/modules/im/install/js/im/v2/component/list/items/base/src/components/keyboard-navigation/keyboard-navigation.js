import { markRaw } from 'ui.vue3';

import { createListFocusZone } from 'im.v2.lib.a11y';

import './css/keyboard-navigation.css';

const CREATE_CHAT_DRAFT_SELECTOR = '.bx-im-list-recent-create-chat__container';

// Only the rows rove: the create-chat draft keeps its own Tab stops
const isListRow = (element: HTMLElement): boolean => {
	return element.matches('[data-id]') && !element.closest(CREATE_CHAT_DRAFT_SELECTOR);
};

// @vue/component
// The scroll area of a list and the roving focus over its rows: one Tab stop, arrows and Home/End walk
// the rows. The zone binds to the root node for life, so it lives and dies with this component.
// In the compact collab peek (avatarsOnly) the list is a mouse-only avatar strip beside the nested
// drawer: the zone is off and the container itself leaves the tab order and the accessibility tree.
export const KeyboardNavigation = {
	name: 'KeyboardNavigation',
	inject: {
		avatarsOnly: {
			default: false,
		},
	},
	watch: {
		avatarsOnly: 'syncFocusZone',
	},
	created()
	{
		this.focusZone = null;
	},
	mounted()
	{
		this.focusZone = markRaw(createListFocusZone(this.$el, { focusableElementFilter: isListRow }));
		this.syncFocusZone();
	},
	activated()
	{
		this.syncFocusZone();
	},
	deactivated()
	{
		this.focusZone.deactivate();
	},
	beforeUnmount()
	{
		this.focusZone.deactivate();
	},
	methods: {
		syncFocusZone()
		{
			if (this.avatarsOnly)
			{
				this.focusZone.deactivate();

				return;
			}

			this.focusZone.activate();
		},
		// The fade around the container holds the rows at opacity 0 while activate() collects them
		refreshFocusZone()
		{
			this.focusZone.refreshElements();
		},
	},
	template: `
		<div :tabindex="avatarsOnly ? -1 : null" :aria-hidden="avatarsOnly ? 'true' : null" class="bx-im-list-base__scroll-container">
			<slot></slot>
		</div>
	`,
};
