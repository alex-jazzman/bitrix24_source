import { Type } from 'main.core';
import { type UploaderFile } from 'ui.uploader.core';
import { mapActions, mapWritableState } from 'ui.vue3.pinia';

import { UiAvatarProject } from 'socialnetwork.v2.components.elements.ui-avatar-project';
import { useProjectStore } from 'socialnetwork.v2.model.project';

import { ProjectWizardTitle } from './title/title.js';

import './header.css';

const fileToBaseSixFourNoPrefix = async (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const resultWithPrefix = reader.result;
			const commaPosition = resultWithPrefix.indexOf(',');
			const result = resultWithPrefix.slice(commaPosition + 1);

			if (Type.isString(result))
			{
				resolve(result);
			}
			else
			{
				reject(new Error('Failed to read file as string'));
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
};

// @vue/component
export const ProjectWizardHeader = {
	name: 'ProjectWizardHeader',
	components: {
		UiAvatarProject,
		ProjectWizardTitle,
	},
	computed: {
		...mapWritableState(useProjectStore, [
			'avatar',
		]),
		avatarUrl(): string
		{
			return this.avatar?.url;
		},
	},
	methods: {
		...mapActions(useProjectStore, ['patchProject']),
		async handleAvatarUpdate(avatarFile: UploaderFile | null): Promise<void>
		{
			if (avatarFile)
			{
				const url = avatarFile.getPreviewUrl();
				const binary = avatarFile.getBinary();
				const encodedFile = await fileToBaseSixFourNoPrefix(binary);

				this.patchProject({
					avatar: {
						url,
						encodedFile,
					},
				});
			}
			else
			{
				this.patchProject({
					avatar: null,
				});
			}
		},
	},
	template: `
		<div
			class="socialnetwork--project-wizard-header"
		>
			<UiAvatarProject
				:url="avatarUrl"
				@update="handleAvatarUpdate"
			/>
			<ProjectWizardTitle />
		</div>
	`,
};
