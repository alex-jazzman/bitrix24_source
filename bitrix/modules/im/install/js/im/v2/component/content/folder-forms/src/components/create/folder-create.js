import { type JsonObject } from 'main.core';

import { FolderService } from 'im.v2.provider.service.folder';
import { FolderManager } from 'im.v2.lib.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import { type ImModelFolder } from 'im.v2.model';

import { FolderForm } from '../folder-form';

// @vue/component
export const FolderCreation = {
	name: 'FolderCreation',
	components: { FolderForm },
	inheritAttrs: false,
	data(): JsonObject
	{
		return {
			isCreating: false,
			title: '',
			dialogIds: [],
		};
	},
	methods: {
		async onSubmit()
		{
			let newFolder: ?ImModelFolder = null;
			this.isCreating = true;
			try
			{
				const fields = {
					title: this.title.trim(),
					dialogIds: this.dialogIds,
				};

				newFolder = await (new FolderService()).add(fields);
			}
			finally
			{
				this.isCreating = false;
			}

			if (!newFolder)
			{
				return;
			}

			FolderManager.openPersonalFolder(newFolder.id);
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
			:isSubmitting="isCreating"
			:submitButtonTitle="loc('IM_CREATE_FOLDER_CONFIRM')"
			@submit="onSubmit"
			@cancel="onCancel"
		/>
	`,
};
