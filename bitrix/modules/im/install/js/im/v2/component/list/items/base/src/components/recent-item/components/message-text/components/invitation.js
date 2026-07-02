// @vue/component
export const InvitationPlaceholder = {
	name: 'InvitationPlaceholder',
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span class="bx-im-list-recent-item__balloon_container --invitation">
			<span class="bx-im-list-recent-item__balloon">
				{{ loc('IM_LIST_RECENT_INVITATION_NOT_ACCEPTED_MSGVER_1') }}
			</span>
		</span>
	`,
};
