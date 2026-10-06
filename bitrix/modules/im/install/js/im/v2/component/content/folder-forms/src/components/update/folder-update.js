import { type JsonObject } from 'main.core';

import { FolderService } from 'im.v2.provider.service.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import { Layout } from 'im.v2.const';
import { type ImModelFolder } from 'im.v2.model';

import { FolderForm } from '../folder-form';

// @vue/component
export const FolderUpdate = {
	name: 'FolderUpdate',
	components: { FolderForm },
	props: {
		folderId: {
			type: Number,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			isUpdating: false,
			title: '',
			dialogIds: [],
		};
	},
	computed: {
		folder(): ImModelFolder
		{
			return this.$store.getters['recent/folders/getById'](this.folderId);
		},
	},
	created()
	{
		this.fillForm();
	},
	methods: {
		fillForm()
		{
			this.title = this.folder.title;
			this.dialogIds = this.folder.definition.chats.map((chat) => chat.dialogId);
		},
		async onSubmit()
		{
			let updatedFolder: ?ImModelFolder = null;
			this.isUpdating = true;
			try
			{
				const fields = {
					title: this.title.trim(),
					dialogIds: this.dialogIds,
				};

				updatedFolder = await (new FolderService()).update(this.folderId, fields);
			}
			finally
			{
				this.isUpdating = false;
			}

			if (!updatedFolder)
			{
				return;
			}

			void LayoutManager.getInstance().setLayout({
				name: Layout.folder,
				params: { folderId: updatedFolder.id },
			});
		},
		onCancel()
		{
			void LayoutManager.getInstance().restoreOriginLayout();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<FolderForm
			v-model:title="title"
			v-model:dialogIds="dialogIds"
			:isSubmitting="isUpdating"
			:submitButtonTitle="loc('IM_UPDATE_FOLDER_CONFIRM')"
			@submit="onSubmit"
			@cancel="onCancel"
		/>
	`,
};
