import { BitrixVueComponentProps } from 'ui.vue3';
import { BaseEvent } from 'main.core.events';
import { Loc } from 'main.core';
import 'ui.notification';

import { FieldBindings } from '../../../lib/model/field-bindings';
import { ImportSettings } from '../../../lib/model/import-settings';

import { ServiceLocator } from '../../../lib/service-locator';
import type { ConfigureImportSettingsResponse } from '../../../lib/response/configure-import-settings-response';

import { StepEventId } from '../../../lib/constant/step-event-id';

import './configure-import-settings-step.css';

export const ConfigureImportSettingsStep: BitrixVueComponentProps = {
	name: 'ConfigureImportSettingsStep',

	eventId: StepEventId.ConfigureImportSettingsStep,
	title: Loc.getMessage('CRM_ITEM_IMPORT_STEP_TITLE_CONFIGURE_IMPORT_SETTINGS_STEP'),

	props: {
		importSettings: {
			type: ImportSettings,
			required: true,
		},
	},

	methods: {
		async beforeNext(): Promise<boolean>
		{
			const validateImportFileIdEvent = new BaseEvent();
			this.$Bitrix.eventEmitter.emit('crm:item:import:field-importFileId:validate', validateImportFileIdEvent);
			if (validateImportFileIdEvent.isDefaultPrevented())
			{
				return false;
			}

			return ServiceLocator
				.instance()
				.getController()
				.configureImportSettings(this.importSettings)
				.then((response: ConfigureImportSettingsResponse) => {
					this.importSettings
						.setFieldBindings(new FieldBindings(response.fieldBindings))
						.setEntityFields(response.entityFields)
						.setFileHeaders(response.fileHeaders)
						.setPreviewTable(response.previewTable)
						.setFilesize(response.filesize)
						.setRequiredFieldIds(response.requiredFieldIds)
						.setRequisiteDuplicateControlTargets(response.requisiteDuplicateControlTargets)
					;

					return true;
				})
				.catch((response) => {
					console.error(response);

					BX.UI.Notification.Center.notify({
						content: response.errors[0].message,
						autoHideDelay: 3000,
					});

					return false;
				});
		},
	},

	template: `
		<div class="crm-item-import__wizard-step__configure-import-settings-step">
			<slot />
		</div>
	`,
};
