import { CollabInvitationService } from 'im.v2.provider.service.collab-invitation';

import { AddToChatContent } from '../../elements/add-to-chat-content/add-to-chat-content';

// @vue/component
export const AddEmployeesTab = {
	name: 'AddEmployeesTab',
	components: { AddToChatContent },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		height: {
			type: Number,
			required: true,
		},
	},
	emits: ['close'],
	methods:
	{
		inviteMembers({ members })
		{
			(new CollabInvitationService()).addEmployees({ dialogId: this.dialogId, members });
			this.$emit('close');
		},
	},
	template: `
		<div class="bx-im-add-to-collab__employees-tab-container">
			<AddToChatContent
				:dialogId="dialogId"
				:height="height"
				@inviteMembers="inviteMembers"
				@close="$emit('close')"
			/>
		</div>
	`,
};
