import { ProjectWizard } from 'socialnetwork.v2.application.project-wizard';
import { TYPES_PROJECT_WIZARD_ACTION } from 'socialnetwork.v2.model.interface';

import { Utils } from 'im.v2.lib.utils';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { LayoutManager } from 'im.v2.lib.layout';
import { MessengerSlider } from 'im.v2.lib.slider';
import { Messenger } from 'im.public';

// @vue/component
export const CollabV2Creation = {
	name: 'CollabV2Creation',
	mounted()
	{
		this.createForm = new ProjectWizard({
			action: TYPES_PROJECT_WIZARD_ACTION.CREATE,
			container: this.$refs['form-container'],
			onCancel: () => this.restoreOriginLayout(),
			onSave: ({ id, name, chatId }) => this.handleSave({ id, name, chatId }),
		});

		void this.createForm.mount();
	},
	beforeUnmount(): void
	{
		this.createForm?.unmount();
		CreateChatManager.getInstance().clearPresetFields();
	},
	methods: {
		handleSave({ id, name, chatId }: { id: number, name: string, chatId: number })
		{
			const onCreate = CreateChatManager.getInstance().getOnCreate();
			if (onCreate)
			{
				onCreate({ id, name, chatId });
				MessengerSlider.getInstance().getCurrent()?.close();

				return;
			}

			this.openCollab(chatId);
		},
		restoreOriginLayout()
		{
			void LayoutManager.getInstance().restoreOriginLayout();
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
