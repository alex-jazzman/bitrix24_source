import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { ScrollWithGradient, ScrollDirection } from 'im.v2.component.elements.scroll-with-gradient';
import { NavigationSection } from 'im.v2.component.list.container.elements.navigation-section';

import { type CollabSectionItem } from '../../nested-container';

// @vue/component
export const CollabNavigation = {
	name: 'CollabNavigation',
	components: { ScrollWithGradient, NavigationSection },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
		sections: {
			type: Array,
			required: true,
		},
		currentSection: {
			type: String,
			required: true,
		},
	},
	computed: {
		ScrollDirection: () => ScrollDirection,
		items(): CollabSectionItem[]
		{
			return this.sections;
		},
	},
	methods: {
		getSectionCounter(type: RecentTypeItem): number
		{
			const childrenCounter = this.$store.getters['counters/getChildrenTotalCounter'](this.parentChatId, type);

			if (type === RecentType.collabDefault)
			{
				const parentCounter = this.$store.getters['counters/getTotalCounterByIds']([this.parentChatId]);

				return parentCounter + childrenCounter;
			}

			return childrenCounter;
		},
	},
	template: `
		<ScrollWithGradient :direction="ScrollDirection.horizontal">
			<div class="bx-im-nested-list-collab__section_container">
				<div v-for="{ type, title } in items" :key="type" class="bx-im-nested-list-collab__section">
					<NavigationSection
						:text="title"
						:isSelected="currentSection === type"
						:counter="getSectionCounter(type)"
						@click="$emit('selectSection', type)"
					/>
				</div>
			</div>
		</ScrollWithGradient>
	`,
};
