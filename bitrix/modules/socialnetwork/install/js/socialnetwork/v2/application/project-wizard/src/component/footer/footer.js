import { Event } from 'main.core';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';

import { EventName } from 'socialnetwork.v2.const';

import { ScnButtonSubmitProject } from './scn-button-submit-project';
import './footer.css';

// @vue/component
export const ProjectWizardFooter = {
	name: 'ProjectWizardFooter',
	components: {
		ScnButtonSubmitProject,
		UiButton,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	methods: {
		close(): void
		{
			Event.EventEmitter.emit(EventName.CloseProjectWizard);
		},
	},
	template: `
		<div class="socialnetwork--project-wizard-footer">
			<ScnButtonSubmitProject />
			<UiButton
				:text="loc('SONET_EXT_PROJECT_WIZARD_CANCEL_BUTTON')"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.PLAIN"
				@click="close"
			/>
		</div>
	`,
};
