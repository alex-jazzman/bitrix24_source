import { Loc } from 'main.core';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { type SharingStore, useSharingStore } from '../../model/sharing/sharing';
import { type SharingMember } from '../../model/sharing/types';
import { MemberItem } from '../member-item/member-item';

import './member-list.css';

/**
 * The members in the order the server sent them: the order of the legacy list came from the
 * destination widget, which the popup no longer uses.
 */
export const MemberList = defineComponent({
	name: 'DiskSharingMemberList',
	components: {
		MemberItem,
		TextSm,
	},
	// the store is taken here, where the injection context of the component gives the pinia of the popup
	setup(): { store: SharingStore }
	{
		return { store: useSharingStore() };
	},
	computed: {
		members(): SharingMember[]
		{
			return this.store.members;
		},
		nameColumn(): string
		{
			return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_USERS_NAME') ?? '';
		},
		rightColumn(): string
		{
			return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_ACCESS_LEVEL') ?? '';
		},
	},
	template: `
		<div class="disk-sharing-members-popup-members" :class="{ '--filled': members.length > 0 }">
			<div v-if="members.length" class="disk-sharing-members-popup-columns">
				<TextSm class="disk-sharing-members-popup-columns__title">{{ nameColumn }}</TextSm>
				<TextSm class="disk-sharing-members-popup-columns__title">{{ rightColumn }}</TextSm>
			</div>
			<div class="disk-sharing-members-popup__list" data-testid="disk-sharing-members-list">
				<MemberItem
					v-for="member in members"
					:key="member.entityId"
					:member="member"
				/>
			</div>
		</div>
	`,
});
