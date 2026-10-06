import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import './css/search-item-layout.css';

// @vue/component
export const SearchItemLayout = {
	name: 'SearchItemLayout',
	components: { BIcon },
	props: {
		selected: {
			type: Boolean,
			default: false,
		},
		centered: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click', 'contextmenu'],
	computed:
	{
		OutlineIcons: () => OutlineIcons,
	},
	template: `
		<div
			class="bx-im-search-item-layout__container bx-im-search-item-layout__scope"
			:class="{ '--selected': selected }"
			@click="$emit('click', $event)"
			@contextmenu.prevent="$emit('contextmenu', $event)"
		>
			<div class="bx-im-search-item-layout__avatar-container">
				<slot name="avatar" />
			</div>
			<div class="bx-im-search-item-layout__content-container" :class="{ '--centered': centered }">
				<div class="bx-im-search-item-layout__content_header">
					<slot name="header" />
				</div>
				<div class="bx-im-search-item-layout__item-text">
					<slot name="subtitle" />
				</div>
			</div>
			<BIcon
				v-if="selected"
				class="bx-im-search-item-layout__selected"
				:name="OutlineIcons.CHECK_M"
			/>
		</div>
	`,
};
