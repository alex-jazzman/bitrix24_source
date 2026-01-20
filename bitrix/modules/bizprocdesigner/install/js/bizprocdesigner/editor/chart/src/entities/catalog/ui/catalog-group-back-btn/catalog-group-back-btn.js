import { BIcon, Outline } from 'ui.icon-set.api.vue';
import './catalog-group-back-btn.css';

const GROUP_BACK_BTN_CLASS_NAMES = {
	base: 'editor-chart-group-back-btn',
	collapsed: '--collapsed',
};

const ICON_CLASS_NAMES = {
	base: 'editor-chart-group-back-btn__icon',
	collapsed: '--collapsed',
};

// @vue/component
export const CatalogGroupBackBtn = {
	name: 'CatalogGroupBackBtn',
	components: {
		BIcon,
	},
	props: {
		groupTitle: {
			type: String,
			default: '',
		},
		collapsed: {
			type: Boolean,
			default: false,
		},
	},
	setup(): { iconSet: { [string]: string } }
	{
		return { iconSet: Outline };
	},
	computed: {
		groupBackBtnCalssNames(): { [string]: boolean }
		{
			return {
				[GROUP_BACK_BTN_CLASS_NAMES.base]: true,
				[GROUP_BACK_BTN_CLASS_NAMES.collapsed]: this.collapsed,
			};
		},
		iconClassNames(): { [string]: boolean }
		{
			return {
				[ICON_CLASS_NAMES.base]: true,
				[ICON_CLASS_NAMES.collapsed]: this.collapsed,
			};
		},
	},
	template: `
		<button
			:class="groupBackBtnCalssNames"
			:data-test-id="$testId('catalogGroupBackBtn')"
		>
			<div
				v-if="!collapsed"
				class="editor-chart-group-back-btn__back-wrapper"
			>
				<BIcon
					:name="iconSet.ARROW_LEFT_XS"
					:size="30"
					class="editor-chart-group-back-btn__back"
				/>
			</div>

			<div :class="iconClassNames">
				<slot name="icon"/>
			</div>

			<p class="editor-chart-group-back-btn__title">
				{{ groupTitle }}
			</p>
		</button>
	`,
};
