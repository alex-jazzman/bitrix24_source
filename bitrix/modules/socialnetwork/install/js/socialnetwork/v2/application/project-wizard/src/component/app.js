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

const HIGHLIGHT_CLASS = 'sonet--project-wizard--base-feature-highlight';
// Must match the animation duration of `.sonet--project-wizard--base-feature-highlight`
// defined in base-feature.css (@keyframes sonet-project-wizard-base-feature-highlight-fade, 1.8s).
const HIGHLIGHT_DURATION_MS = 1800;

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
			'isActionUpdate',
			'isActionCopy',
			'scrollToStartupTool',
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
	beforeUnmount()
	{
		clearTimeout(this._highlightTimer);
	},
	methods: {
		...mapActions(useProjectStore, ['patchProject']),
		async initWizard(): Promise<void>
		{
			this.loading = true;
			this._scrollDone = false;

			if (!this.isActionCreate && this.id > 0)
			{
				await new GetProjectFeature().getProject(this.id);

				void this.getDefaultData();
			}
			else
			{
				await new GetProjectFeature().getAvailableFeatures();
				await this.getDefaultData();

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

			if (this.isActionUpdate && this.scrollToStartupTool)
			{
				void this.$nextTick(() => {
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							if (!this._scrollDone)
							{
								this._scrollDone = true;
								this.scrollToStartupToolHandler();
							}
						});
					});
				});
			}
		},
		async getDefaultData(): Promise<void>
		{
			await GetDefaultData.getDefaultData();
		},
		scrollToStartupToolHandler(): void
		{
			try
			{
				const searchRoot = this.$el instanceof HTMLElement ? this.$el : document;
				const target = searchRoot.querySelector('[data-testid="base-feature-target"]');
				if (target instanceof HTMLElement)
				{
					target.scrollIntoView({ block: 'center', behavior: 'smooth' });

					const highlightTarget = target.querySelector('.sonet--project-wizard--base-feature-field-content');
					if (!(highlightTarget instanceof HTMLElement))
					{
						return;
					}

					clearTimeout(this._highlightTimer);
					highlightTarget.classList.remove(HIGHLIGHT_CLASS);
					// Force reflow so re-adding the class restarts the animation
					void highlightTarget.offsetWidth;
					highlightTarget.classList.add(HIGHLIGHT_CLASS);
					this._highlightTimer = setTimeout(() => {
						highlightTarget.classList.remove(HIGHLIGHT_CLASS);
					}, HIGHLIGHT_DURATION_MS);
				}
			}
			catch
			{
				// best-effort: scroll failure must not break the wizard
			}
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
