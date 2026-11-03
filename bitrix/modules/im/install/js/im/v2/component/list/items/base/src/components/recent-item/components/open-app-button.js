import '../css/open-app-button.css';

// @vue/component
export const OpenAppButton = {
	name: 'OpenAppButton',
	props: {
		url: {
			type: String,
			required: true,
		},
		dialogId: {
			type: [String, Number],
			required: true,
		},
		withUnreadBadge: {
			type: Boolean,
			default: false,
		},
		isChatMuted: {
			type: Boolean,
			default: false,
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<a
			:href="url"
			:data-testid="'im-vibecode-app-open-button-' + dialogId"
			class="bx-im-list-recent-item__open-app"
		>{{ loc('IM_LIST_ITEMS_OPEN_APP') }}<span
			v-if="withUnreadBadge"
			:data-testid="'im-vibecode-app-unread-badge-' + dialogId"
			:class="{ '--muted': isChatMuted }"
			class="bx-im-list-recent-item__open-app_unread-badge"
		></span></a>
	`,
};
