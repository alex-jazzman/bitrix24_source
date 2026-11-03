import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import 'im.v2.css.classes';

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
	methods: {
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
			class="bx-im-nested-list-collab-card__button --ui-context-content-light --focus-visible"
			:class="{'--with-icon': withIcon}"
			role="button"
			tabindex="0"
			:aria-label="title"
			@keydown="handleActivationKeydown"
		>
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
