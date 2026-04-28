import { LocMixin } from 'sign.v2.b2e.vue-util';
import { PlaceholderItem } from './placeholder-item';
import { SectionType } from '../types';

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
	},
	computed: {
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
		getItemDataTestId(...indices): string
		{
			return ['sign-placeholder-item', this.section.type, ...indices].join('-');
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
					v-for="(item, index) in section.items"
					:key="index"
					:placeholder="item"
					:section-type="getItemSectionType()"
					:data-test-id="getItemDataTestId(index)"
				/>
			</div>

			<div v-else>
				<div v-for="(subsection, index) in section.subsections" :key="index" class="sign-placeholders-subsection">
					<div class="sign-placeholders-subsection-title">{{ subsection.title }}</div>
					<div>
						<PlaceholderItem
							v-for="(item, itemIndex) in subsection.items"
							:key="itemIndex"
							:placeholder="item"
							:section-type="getItemSectionType()"
							:data-test-id="getItemDataTestId(index, itemIndex)"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};
