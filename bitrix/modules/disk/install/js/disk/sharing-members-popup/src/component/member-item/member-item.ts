import { TextSm } from 'ui.system.typography.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { type SharingRightValue } from '../../const/sharing';
import { changeMemberRight } from '../../feature/change-member-right/change-member-right';
import { getRightLabel } from '../../lib/right-label/right-label';
import { type SharingStore, useSharingStore } from '../../model/sharing/sharing';
import { type SharingMember } from '../../model/sharing/types';
import { RightSelect } from '../right-select/right-select';

import './member-item.css';

/**
 * A member the object is shared with. The list shows every member the server sent, including
 * the chats, the closed groups and the departments the entity selector cannot express. The row
 * carries no removal of its own: the set of members is changed in the dialog of the selector.
 */
export const MemberItem = defineComponent({
	name: 'DiskSharingMemberItem',
	components: {
		RightSelect,
		TextSm,
	},
	props: {
		member: {
			type: Object as PropType<SharingMember>,
			required: true,
		},
	},
	// the store is taken here, where the injection context of the component gives the pinia of the popup
	setup(): { store: SharingStore }
	{
		return { store: useSharingStore() };
	},
	computed: {
		rightLabel(): string
		{
			return getRightLabel(this.member.right);
		},
		// a mode that locks the loaded members shows their level as a plain label
		isEditable(): boolean
		{
			return this.store.permission.canChangeMembers && !this.store.isMemberLocked(this.member.entityId);
		},
		right: {
			get(): SharingRightValue
			{
				return this.member.right;
			},
			set(right: SharingRightValue): void
			{
				changeMemberRight(this.store, this.member.entityId, right);
			},
		},
	},
	template: `
		<div class="disk-sharing-members-popup-member" :data-testid="'disk-sharing-members-item-' + member.entityId">
			<TextSm
				class="disk-sharing-members-popup-member__name"
				wrap="truncate"
				data-testid="disk-sharing-members-name"
			>{{ member.name }}</TextSm>
			<RightSelect v-if="isEditable" v-model="right" :memberName="member.name"/>
			<TextSm
				v-else
				class="disk-sharing-members-popup-member__right"
				data-testid="disk-sharing-members-right-label"
			>{{ rightLabel }}</TextSm>
		</div>
	`,
});
