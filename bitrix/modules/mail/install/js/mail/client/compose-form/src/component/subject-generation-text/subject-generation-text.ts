import { TextMd } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';

import './subject-generation-text.css';

/**
 * The waiting look of the subject generation, the one the mobile form draws in
 * `mailmobile/install/mobileapp/mailmobile/extensions/mail/sending-form/src/subject-generation-view.js`:
 * the phrase in the BitrixGPT gradient, glowing softly, in a single line. The wait is shown by the gradient
 * sweeping along the phrase; the mobile row dims the text instead, which is not open to us here, because
 * these colours reach 3:1 on the white of the field and a dimmed phrase falls out of it.
 *
 * The animated loader of the mobile row has no twin here: the control that started the generation draws
 * the wait itself. The phrase is a look and nothing else, so a screen reader hears the start of the
 * generation from the announcement of the scenario and not from this node.
 *
 * `TextMd` keeps the status compact and gives it the regular text weight, so it fits into the subject row
 * without looking heavier than the subject typed next to it.
 */
// @vue/component
export const SubjectGenerationText = defineComponent({
	name: 'MailComposeSubjectGenerationText',

	components: {
		TextMd,
	},

	computed: {
		text(): string
		{
			return loc(Phrase.SubjectGenerationRunning);
		},
	},

	template: `
		<TextMd
			class-name="mail-compose-subject-generation-text"
			wrap="truncate"
			data-testid="mail-compose-subject-generation-text"
		>{{ text }}</TextMd>
	`,
});
