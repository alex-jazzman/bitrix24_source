import { ProjectWizard } from 'socialnetwork.v2.application.project-wizard';
import { TYPES_PROJECT_WIZARD_ACTION } from 'socialnetwork.v2.model.interface';

import { type ImModelChat } from 'im.v2.model';
import { Messenger } from 'im.public';
import { Utils } from 'im.v2.lib.utils';

// @vue/component
export const CollabV2Updating = {
	name: 'CollabV2Updating',
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		copyMode: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		collabId(): ?string
		{
			return this.dialog.entityLink?.id;
		},
	},
	mounted()
	{
		this.updateForm = new ProjectWizard({
			action: this.copyMode ? TYPES_PROJECT_WIZARD_ACTION.COPY : TYPES_PROJECT_WIZARD_ACTION.UPDATE,
			projectId: this.collabId,
			container: this.$refs['form-container'],
			onCancel: () => this.openChatLayout(),
			onSave: ({ chatId }) => this.openCollab(chatId),
		});

		void this.updateForm.mount();
	},
	beforeUnmount(): void
	{
		this.updateForm?.unmount();
	},
	methods: {
		openChatLayout()
		{
			void Messenger.openChat(this.dialogId);
		},
		openCollab(chatId: number)
		{
			const dialogId = Utils.dialog.buildChatDialogId(chatId);

			void Messenger.openCollab(dialogId);
		},
	},
	template: `
		<div class="bx-im-content-chat-forms__content --collab-v2" ref="form-container"></div>
	`,
};
