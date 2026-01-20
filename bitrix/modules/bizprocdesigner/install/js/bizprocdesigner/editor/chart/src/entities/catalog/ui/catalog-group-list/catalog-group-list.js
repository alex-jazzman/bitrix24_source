import './catalog-group-list.css';
// eslint-disable-next-line no-unused-vars
import type { CatalogMenuGroup } from '../../types';

const CATALOG_GROUP_LIST_CLASS_NAMES = {
	base: 'editor-chart-catalog-group-list',
	withoutScroll: '--withoutScroll',
};

// @vue/component
export const CatalogGroupList = {
	name: 'CatalogGroupList',
	props: {
		/** @type Array<CatalogMenuGroup> */
		groups: {
			type: Array,
			default: () => ([]),
		},
		/** @type CatalogMenuGroup | null */
		currentGroup: {
			type: Object,
			default: null,
		},
	},
	computed: {
		catalogGroupListClassNames(): { [string]: boolean }
		{
			return {
				[CATALOG_GROUP_LIST_CLASS_NAMES.base]: true,
				[CATALOG_GROUP_LIST_CLASS_NAMES.withoutScroll]: this.currentGroup !== null,
			};
		},
	},
	template: `
		<ul :class="catalogGroupListClassNames">
			<li
				v-for="group in groups"
				:key="group.id"
				class="editor-chart-catalog-group-list__group"
			>
				<slot
					:group="group"
					name="group"
				/>
			</li>
		</ul>
	`,
};
