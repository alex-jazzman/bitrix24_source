import { LocMixin } from 'sign.v2.b2e.vue-util';
import { PlaceholderItem } from './placeholder-item';
import { SectionType } from '../types';

const ROW_TEST_ID_PREFIX = 'sign-placeholder-item';

/** A row of the section: the field, the identity it lives by and the label of the autotests. */
type SectionRow = {
	item: Object,
	itemId: string,
	testId: string,
};

// @vue/component
export const PlaceholderSection = {
	name: 'PlaceholderSection',
	components: {
		PlaceholderItem,
	},
	mixins: [LocMixin],
	props: {
		section: {
			type: Object,
			required: true,
		},
		expandedItemId: {
			type: String,
			default: '',
		},
	},
	emits: ['toggle-expand', 'delete-field'],
	computed: {
		/**
		 * Rows of the section, built once per list: the open accordion travels to the rows as a boolean
		 * of its own, so raising one of them rebuilds no arrays and patches no row but the two that
		 * changed.
		 */
		rows(): SectionRow[]
		{
			return this.buildRows(this.section, null);
		},
		subsectionRows(): SectionRow[][]
		{
			return (this.section.subsections ?? []).map(
				(subsection, index) => this.buildRows(subsection, index),
			);
		},
		hasSubsections(): boolean
		{
			return Array.isArray(this.section.subsections) && this.section.subsections.length > 0;
		},
		hasItems(): boolean
		{
			if (this.hasSubsections)
			{
				return this.section.subsections.some((subsection) => subsection.items && subsection.items.length > 0);
			}

			return this.section.items && this.section.items.length > 0;
		},
	},
	methods: {
		/**
		 * Row identity: the scope of the row - the type of its section and of its subsection - keeps it
		 * unique for a code the response holds in more than one place, the code of the field keeps it
		 * stable while the list is filtered. Filtering drops the subsections left empty and shifts the
		 * indexes of the survivors, so the index names only a row the response gave no code at all.
		 */
		getItemId(item: { value?: string }, scope: string[], itemIndex: number): string
		{
			return [this.getItemSectionType(), ...scope, item.value || `index-${itemIndex}`].join('-');
		},
		// The label of the autotests follows the identity of the row instead of taking part in it.
		buildRows(itemsHolder: Object, subsectionIndex: number | null): SectionRow[]
		{
			const scope = subsectionIndex === null
				? []
				: [this.getSubsectionKey(itemsHolder, subsectionIndex)]
			;

			return (itemsHolder.items ?? []).map((item, itemIndex) => {
				const itemId = this.getItemId(item, scope, itemIndex);

				return { item, itemId, testId: [ROW_TEST_ID_PREFIX, itemId].join('-') };
			});
		},
		// The type of the subsection survives the filtering the way the code of the field does.
		getSubsectionKey(subsection: { type?: string }, index: number): string
		{
			return subsection.type || `index-${index}`;
		},
		isRowExpanded(itemId: string): boolean
		{
			return itemId !== '' && itemId === this.expandedItemId;
		},
		getItemSectionType(): string
		{
			if (this.section.type === SectionType.HCM_LINK && this.section.subsectionType)
			{
				return this.section.subsectionType;
			}

			return this.section.type;
		},
	},
	template: `
		<div v-if="hasItems" class="sign-placeholders-section">
			<div class="sign-placeholders-section-title">{{ section.title }}</div>
			<div v-if="!hasSubsections" class="sign-placeholders-section-content">
				<PlaceholderItem
					v-for="row in rows"
					:key="row.itemId"
					:placeholder="row.item"
					:section-type="getItemSectionType()"
					:item-id="row.itemId"
					:test-id="row.testId"
					:expanded="isRowExpanded(row.itemId)"
					@toggle-expand="$emit('toggle-expand', $event)"
					@delete-field="$emit('delete-field', $event)"
				/>
			</div>

			<div v-else>
				<div
					v-for="(subsection, index) in section.subsections"
					:key="getSubsectionKey(subsection, index)"
					class="sign-placeholders-subsection"
				>
					<div class="sign-placeholders-subsection-title">{{ subsection.title }}</div>
					<div>
						<PlaceholderItem
							v-for="row in subsectionRows[index]"
							:key="row.itemId"
							:placeholder="row.item"
							:section-type="getItemSectionType()"
							:item-id="row.itemId"
							:test-id="row.testId"
							:expanded="isRowExpanded(row.itemId)"
							@toggle-expand="$emit('toggle-expand', $event)"
							@delete-field="$emit('delete-field', $event)"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};
