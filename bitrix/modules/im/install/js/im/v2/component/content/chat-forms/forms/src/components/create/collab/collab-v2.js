import { ProjectWizard } from 'socialnetwork.v2.application.project-wizard';
import { TYPES_PROJECT_WIZARD_ACTION } from 'socialnetwork.v2.model.interface';

import { Utils } from 'im.v2.lib.utils';
import { LayoutManager } from 'im.v2.lib.layout';
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
			onSave: ({ chatId }) => this.openCollab(chatId),
		});

		void this.createForm.mount();
	},
	beforeUnmount(): void
	{
		this.createForm?.unmount();
	},
	methods: {
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
