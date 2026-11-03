import { TextXs } from 'ui.system.typography.vue';
import { LocMixin } from 'sign.v2.b2e.vue-util';
import { PlaceholderItem } from './placeholder-item';
import type { RecentField } from '../section-filter';

/**
 * Identity of a row of the block. The panel keeps a single open accordion for the whole of it, so the
 * prefix is what tells a row of the history from the row of the same field in the list; the stored
 * code tells the rows of the block apart, and one field copied with two sets holds two of them.
 */
const RECENT_ITEM_ID_PREFIX = 'recent-';

/**
 * Recently copied fields, offered by the search mode while the query is empty. The rows are the rows of
 * the list without their deletion: a row comes drawn with the set of modifiers its code was copied
 * with, and both the copy zone and the accordion answer for that set. The join with the current list
 * happens outside the block.
 */
// @vue/component
export const RecentFields = {
	name: 'SignPlaceholderRecentFields',
	components: {
		PlaceholderItem,
		TextXs,
	},
	mixins: [LocMixin],
	props: {
		fields: {
			/** @type RecentField[] */
			type: Array,
			default: (): RecentField[] => [],
		},
		expandedItemId: {
			type: String,
			default: '',
		},
	},
	emits: ['toggle-expand'],
	methods: {
		itemId(field: RecentField): string
		{
			return `${RECENT_ITEM_ID_PREFIX}${field.storedCode}`;
		},
		isExpanded(field: RecentField): boolean
		{
			return this.itemId(field) === this.expandedItemId;
		},
		// The block itself keeps the bare identifier: a suffixed one would answer the locator of a row too.
		testId(index: number): string
		{
			return `sign-placeholder-recent-${index}`;
		},
	},
	template: `
		<div class="sign-placeholders-recent" data-testid="sign-placeholder-recent">
			<TextXs tag="div" class-name="sign-placeholders-recent-title">
				{{ loc('PLACEHOLDER_LIST_RECENT_TITLE') }}
			</TextXs>
			<PlaceholderItem
				v-for="(field, index) in fields"
				:key="field.storedCode"
				:placeholder="field.placeholder"
				:section-type="field.sectionType"
				:item-id="itemId(field)"
				:test-id="testId(index)"
				:expanded="isExpanded(field)"
				:stored-selection="field.selection"
				:deletable="false"
				@toggle-expand="$emit('toggle-expand', $event)"
			/>
		</div>
	`,
};
