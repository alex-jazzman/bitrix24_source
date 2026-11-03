import type { MemberCollection } from '../../../../../store/model/user-groups-model';
import { SingleMember } from '../../../../header/members/single-member';
import '../../../../../css/value/popup-header/master-switcher/single-role-title.css';

const MAX_SHOWN_MEMBERS = 5;

export const SingleRoleTitle = {
	name: 'SingleRoleTitle',
	components: { SingleMember },
	props: {
		userGroup: {
			/** @type UserGroup */
			type: Object,
			required: true,
		},
	},
	computed: {
		shownMembers(): MemberCollection
		{
			if (this.userGroup.members.size <= MAX_SHOWN_MEMBERS)
			{
				return this.userGroup.members;
			}

			const shown: MemberCollection = new Map();
			for (const [accessCode, member] of this.userGroup.members)
			{
				if (shown.size >= MAX_SHOWN_MEMBERS)
				{
					break;
				}

				shown.set(accessCode, member);
			}

			return shown;
		},
		notShownMembersCount(): number
		{
			if (this.userGroup.members.size > MAX_SHOWN_MEMBERS)
			{
				return this.userGroup.members.size - MAX_SHOWN_MEMBERS;
			}

			return 0;
		},
	},
	template: `
		<div class="ui-access-rights-v2-cell-popup-header-role-container">
			<div
				class="ui-access-rights-v2-cell-popup-header-role-title ui-access-rights-v2-text-ellipsis"
				:title="userGroup.title"
			>
				{{ userGroup.title }}
			</div>
			<div v-if="userGroup.members.size > 0" class="ui-access-rights-v2-cell-popup-header-role-members">
				<SingleMember v-for="[accessCode, member] in shownMembers" :key="accessCode" :member="member"/>
				<span v-if="notShownMembersCount > 0" class="ui-access-rights-v2-members-more">
					+ {{ notShownMembersCount }}
				</span>
			</div>
		</div>
	`,
};
