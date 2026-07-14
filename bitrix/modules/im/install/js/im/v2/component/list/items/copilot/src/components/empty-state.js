import { RecentType } from 'im.v2.const';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';
import { CopilotManager } from 'im.v2.lib.copilot';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: { RecentEmptyState },
	computed: {
		RecentType: () => RecentType,
		subtitle()
		{
			return this.loc('IM_LIST_COPILOT_EMPTY_SUBTITLE', {
				'#COPILOT_NAME#': (new CopilotManager()).getName(),
			});
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<RecentEmptyState
			:title="loc('IM_LIST_COPILOT_EMPTY_TITLE')"
			:subtitle="subtitle"
			:recentSection="RecentType.copilot"
		/>
	`,
};
