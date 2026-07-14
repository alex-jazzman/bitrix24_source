import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';
import { Notifier } from 'ui.notification-manager';

import { useProjectStore } from 'socialnetwork.v2.model.project';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { GetProjectFeature } from 'socialnetwork.v2.features.project.get-project-feature';

import { GetDefaultData } from '../feature/get-default-data';
import { ProjectWizardLayout } from './layout/layout';
import { ProjectWizardHeader } from './header/header';
import { ProjectWizardContent } from './content/content';
import { ProjectWizardFooter } from './footer/footer';

import './app.css';

// @vue/component
export const App = {
	name: 'SocialnetworkProjectWizardApp',
	components: {
		ProjectWizardLayout,
		ProjectWizardHeader,
		ProjectWizardContent,
		ProjectWizardFooter,
	},
	computed: {
		...mapState(useInterfaceStore, [
			'currentUserId',
			'isActionCreate',
		]),
		...mapWritableState(useInterfaceStore, ['loading']),
		...mapState(useProjectStore, {
			id: 'id',
		}),
	},
	created()
	{
		this.patchProject({ ownerId: this.currentUserId });
		void this.initWizard();
	},
	methods: {
		...mapActions(useProjectStore, ['patchProject']),
		async initWizard(): Promise<void>
		{
			this.loading = true;

			if (!this.isActionCreate && this.id > 0)
			{
				await new GetProjectFeature().getProject(this.id);
				void this.getDefaultData();
			}
			else
			{
				await new GetProjectFeature().getAvailableFeatures();
				void this.getDefaultData();

				const error = await new GetProjectFeature().getAvailableFeatures();
				if (error)
				{
					Notifier.notifyViaBrowserProvider({
						id: 'socialnetwork-project-wizard-init-error',
						text: error.message,
					});
				}
			}

			this.loading = false;
		},
		async getDefaultData(): Promise<void>
		{
			await GetDefaultData.getDefaultData();
		},
	},
	template: `
		<ProjectWizardLayout :loading>
			<template #body>
				<ProjectWizardHeader v-if="!loading"/>
				<ProjectWizardContent/>
			</template>
			<template #footer>
				<ProjectWizardFooter #footer/>
			</template>
		</ProjectWizardLayout>
	`,
};
