import { LocalizationMixin } from '../../mixins/localization-mixin';
import { PreparedIndirectPhraseMixin } from '../../mixins/prepared-indirect-phrase-mixin';

// @vue/component
export const WizardHint = {
	name: 'WizardHint',

	mixins: [LocalizationMixin, PreparedIndirectPhraseMixin],

	computed: {
		hintDescriptionText(): { beforeText: ?string, afterText: ?string }
		{
			return this.preparedIndirectPhrase(
				'MAIL_MASSCONNECT_FORM_CONNECTION_DATA_HINT_DESCRIPTION',
				'#HELP_LINK#',
			);
		},
	},

	methods: {
		goToBPHelp(event): void
		{
			if (top.BX && top.BX.Helper)
			{
				if (event)
				{
					event.preventDefault();
				}
				top.BX.Helper.show('redirect=detail&code=26953018');
			}
		},
	},

	template: `
		<div class="mail_massconnect__wizard_card">
			<div class="mail_massconnect__wizard_card_hint">
				<div class="mail_massconnect__section-title_container">
					<span class="mail_massconnect__section-description">
						<span>{{ hintDescriptionText.beforeText }}</span>
						<span class="mail_massconnect__section-description_hint-link" @click="goToBPHelp">
							{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_HINT_HELP_LINK') }}
						</span>
						<span>{{ hintDescriptionText.afterText }}</span>
					</span>
				</div>
			</div>
		</div>
	`,
};
