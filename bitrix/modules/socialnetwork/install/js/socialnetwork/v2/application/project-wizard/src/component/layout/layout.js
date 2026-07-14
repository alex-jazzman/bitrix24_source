import { UiLoader } from 'socialnetwork.v2.components.elements.ui-loader';

import { InjectionKey } from '../../const/index.js';

// @vue/component
export const ProjectWizardLayout = {
	name: 'ProjectWizardLayout',
	components: {
		UiLoader,
	},
	provide(): { [string]: () => HTMLElement | null }
	{
		return {
			[InjectionKey.GetWizardBodyContainer]: (): ?HTMLElement => this.$refs.body || null,
		};
	},
	props: {
		loading: Boolean,
	},
	template: `
		<div class="socialnetwork--project-wizard">
			<div class="socialnetwork--project-wizard-main">
				<UiLoader v-if="loading" :show="loading"/>
				<div v-else ref="body" class="socialnetwork--project-wizard-body">
					<slot name="body"/>
				</div>
				<slot name="footer"/>
			</div>
		</div>
	`,
};
