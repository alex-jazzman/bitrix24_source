import { type JsonObject } from 'main.core';

import { ChatAccessManager } from 'im.v2.lib.access';
import { Notifier } from 'im.v2.lib.notifier';
import { CollabInvitationService } from 'im.v2.provider.service.collab-invitation';

import { AddToChatFooter } from '../../add-to-chat/components/footer';

// @vue/component
export const AddEmployeesTab = {
	name: 'AddEmployeesTab',
	components: { AddToChatFooter },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		/** @type number[] */
		members: {
			type: Array,
			default: () => [],
		},
		/** @type SelectorEntityItem[] */
		structureNodes: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			isLoading: false,
		};
	},
	computed: {
		hasSelection(): boolean
		{
			return this.members.length > 0 || this.structureNodes.length > 0;
		},
	},
	methods: {
		async inviteMembers(): Promise<void>
		{
			if (this.isLoading || !this.hasSelection)
			{
				return;
			}

			this.isLoading = true;
			const canAdd = await ChatAccessManager.canAddSelection(this.dialogId, this.members, this.structureNodes);
			if (!canAdd)
			{
				this.isLoading = false;

				return;
			}

			try
			{
				await new CollabInvitationService().addEmployees({
					dialogId: this.dialogId,
					members: this.members,
					structureNodes: this.structureNodes,
				});
			}
			catch
			{
				Notifier.onDefaultError();

				return;
			}
			finally
			{
				this.isLoading = false;
			}

			this.$emit('close');
		},
	},
	template: `
		<AddToChatFooter
			:disabled="!hasSelection"
			:loading="isLoading"
			@confirm="inviteMembers"
			@cancel="$emit('close')"
		/>
	`,
};
