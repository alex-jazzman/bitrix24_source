// @vue/component
export const BirthdayPlaceholder = {
	name: 'BirthdayPlaceholder',
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span class="bx-im-list-recent-item__balloon_container --birthday" :title="loc('IM_LIST_RECENT_BIRTHDAY')">
			<span class="bx-im-list-recent-item__balloon">
				{{ loc('IM_LIST_RECENT_BIRTHDAY') }}
			</span>
		</span>
	`,
};
