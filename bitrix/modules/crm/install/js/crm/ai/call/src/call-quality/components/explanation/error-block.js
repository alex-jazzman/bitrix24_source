import { NameService } from 'crm.ai.name-service';
import { Loc, Type } from 'main.core';

export const ErrorBlock = {
	data(): Object
	{
		return {
			errorText: null,
		};
	},

	methods: {
		setErrorMessage(message: string): void
		{
			this.errorText = message;
		},
	},

	computed: {
		explanationText(): string
		{
			return (
				Type.isStringFilled(this.errorText)
					? this.errorText
					: Loc.getMessage('CRM_COPILOT_CALL_QUALITY_ERROR_TEXT', NameService.copilotNameReplacement())
			);
		},

		errorTitle(): string
		{
			return Loc.getMessage('CRM_COPILOT_CALL_QUALITY_ERROR_TITLE', NameService.copilotNameReplacement());
		},
	},

	// language=Vue
	template: `
		<div class="call-quality__explanation">
			<div class="call-quality__explanation__container --error">
				<div class="call-quality__explanation-title">
					{{ errorTitle }}
				</div>
				<div 
					class="call-quality__explanation-text"
					v-html="explanationText"
				></div>
			</div>
		</div>
	`,
};
