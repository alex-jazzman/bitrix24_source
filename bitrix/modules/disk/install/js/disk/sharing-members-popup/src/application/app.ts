import { Loc } from 'main.core';
import { HeadlineXs, TextSm } from 'ui.system.typography.vue';
import { defineComponent, type PropType } from 'ui.vue3';
import { Avatar } from 'ui.vue3.components.avatar';

import { Footer } from '../component/footer/footer';
import { MemberAdd } from '../component/member-add/member-add';
import { MemberList } from '../component/member-list/member-list';
import { type SharingStore, useSharingStore } from '../model/sharing/sharing';
import { type SharingOwner } from '../model/sharing/types';

const AvatarSize = 30;

type AvatarOptions = {
	size: number,
	userName: string,
	userpicPath: string,
};

export const App = defineComponent({
	name: 'DiskSharingMembersApp',
	components: {
		Avatar,
		Footer,
		HeadlineXs,
		MemberAdd,
		MemberList,
		TextSm,
	},
	props: {
		// the popup lives in a dialog of the design system, so closing it belongs to its owner
		closeDialog: {
			type: Function as PropType<() => void>,
			required: true,
		},
	},
	// the store is taken here, where the injection context of the component gives the pinia of the popup
	setup(): { store: SharingStore }
	{
		return { store: useSharingStore() };
	},
	computed: {
		owner(): SharingOwner | null
		{
			return this.store.owner;
		},
	},
	methods: {
		loc(messageCode: string): string
		{
			return Loc.getMessage(messageCode) ?? '';
		},
		avatarOptions(name: string, avatar: string): AvatarOptions
		{
			return { size: AvatarSize, userName: name, userpicPath: avatar };
		},
	},
	template: `
		<div class="disk-sharing-members-popup__body" data-testid="disk-sharing-members-popup">
			<div class="disk-sharing-members-popup__section --padded">
				<HeadlineXs class="disk-sharing-members-popup__label">
					{{ loc('JS_DISK_SHARING_MEMBERS_POPUP_LABEL_OWNER') }}
				</HeadlineXs>
				<a v-if="owner" class="disk-sharing-members-popup__row" :href="owner.link" data-testid="disk-sharing-members-owner">
					<Avatar :options="avatarOptions(owner.name, owner.avatar)"/>
					<TextSm class="disk-sharing-members-popup__name">{{ owner.name }}</TextSm>
				</a>
			</div>
			<div class="disk-sharing-members-popup__section">
				<MemberAdd/>
				<MemberList/>
			</div>
			<Footer :closeDialog="closeDialog"/>
		</div>
	`,
});
