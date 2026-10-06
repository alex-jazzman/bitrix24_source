import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';

import { AttachToCollabV2Content } from './components/content';

const POPUP_ID = 'im-attach-to-collab-v2-popup';

// @vue/component
export const AttachToCollabV2 = {
	name: 'AttachToCollabV2',
	components: { MessengerPopup, AttachToCollabV2Content },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		recentSectionType: {
			type: String || null,
			default: null,
		},
		popupTitle: {
			type: String,
			required: true,
		},
		searchParams: {
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['close'],
	computed: {
		POPUP_ID: () => POPUP_ID,
		config(): PopupOptions
		{
			return {
				titleBar: this.popupTitle,
				closeIcon: true,
				overlay: {
					backgroundColor: '#00204E75',
					opacity: 100,
				},
				padding: 0,
				contentPadding: 0,
				contentBackground: '#fff',
				className: 'bx-im-attach-to-collab-v2__scope',
			};
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<AttachToCollabV2Content
				:dialogId="dialogId"
				:recentSectionType="recentSectionType"
				:searchParams="searchParams"
				@popupClose="$emit('close')"
			/>
		</MessengerPopup>
	`,
};
