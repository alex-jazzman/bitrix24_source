import { NameService } from 'crm.ai.name-service';
import { Loc } from 'main.core';

import { Loader } from '../common/loader';

export const AssessmentSettingsPendingBlock = {
	components: {
		Loader,
	},

	computed: {
		pendingTitle(): string
		{
			return Loc.getMessage('CRM_COPILOT_CALL_QUALITY_ASSESSMENT_SETTINGS_PENDING_TITLE', NameService.copilotNameReplacement());
		},
	},

	// language=Vue
	template: `
		<div class="call-quality__explanation">
			<div class="call-quality__explanation__container">
				<div class="call-quality__explanation-title">
					{{ pendingTitle }}
				</div>
				<div class="call-quality__explanation-text">
					<div class="call-quality__explanation-loader__container">
						<Loader />
						<div class="call-quality__explanation-loader__lottie-text">
							{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_ASSESSMENT_SETTINGS_PENDING_TEXT') }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
