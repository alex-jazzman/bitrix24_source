import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { CardButtonLoader } from './loader';

// @vue/component
export const CollabCardButton = {
	name: 'CollabCardButton',
	components: { BIcon, CardButtonLoader },
	props: {
		title: {
			type: String,
			required: true,
		},
		counter: {
			type: Number,
			default: 0,
		},
		withIcon: {
			type: Boolean,
			default: false,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	template: `
		<div class="bx-im-nested-list-collab-card__button --ui-context-content-light" :class="{'--with-icon': withIcon}">
			<div v-if="withIcon" class="bx-im-nested-list-collab-card__button_more">
				<CardButtonLoader v-if="isLoading" />
				<BIcon
					v-else
					:name="OutlineIcons.MORE_M"
					:title="title"
				/>
			</div>
			<div v-else class="bx-im-nested-list-collab-card__button_text --ellipsis" :title="title">
				{{ title }}
			</div>
			<div v-if="counter" class="bx-im-nested-list-collab-card__button_counter">
				{{ counter }}
			</div>
		</div>
	`,
};
