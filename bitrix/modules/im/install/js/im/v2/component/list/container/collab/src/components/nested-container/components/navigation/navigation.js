import { FeaturePromoter } from 'ui.info-helper';

import { RecentType, SliderCode, type RecentTypeItem } from 'im.v2.const';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { ScrollWithGradient, ScrollDirection } from 'im.v2.component.elements.scroll-with-gradient';
import { NavigationSection } from 'im.v2.component.list.container.elements.navigation-section';

import { type CollabSectionItem } from '../../const/section-config';

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
	emits: ['selectSection'],
	computed: {
		ScrollDirection: () => ScrollDirection,
		items(): CollabSectionItem[]
		{
			return this.sections;
		},
		isCopilotActive(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.copilotActive);
		},
	},
	methods: {
		onSelectSection(type: RecentTypeItem)
		{
			if (type === RecentType.copilot && !this.isCopilotActive)
			{
				this.showCopilotFeatureSlider();

				return;
			}

			this.$emit('selectSection', type);
		},
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
		showCopilotFeatureSlider()
		{
			const promoter = new FeaturePromoter({ code: SliderCode.copilotDisabled });
			promoter.show();
		},
	},
	template: `
		<ScrollWithGradient :direction="ScrollDirection.horizontal">
			<div class="bx-im-nested-list-collab__section_container">
				<div v-for="{ type, getTitle } in items" :key="type" class="bx-im-nested-list-collab__section">
					<NavigationSection
						:text="getTitle()"
						:isSelected="currentSection === type"
						:counter="getSectionCounter(type)"
						@click="onSelectSection(type)"
					/>
				</div>
			</div>
		</ScrollWithGradient>
	`,
};
