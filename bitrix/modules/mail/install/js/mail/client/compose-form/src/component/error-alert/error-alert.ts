import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { defineComponent } from 'ui.vue3';

import { getRecipientsTotalLimitError, ValidationError } from '../../feature/validate-message/validate-message';
import { useComposeState } from '../../model/compose/compose';
import { type ComposeError } from '../../model/compose/types';

import './error-alert.css';

const TestId = 'mail-compose-error-alert';

/**
 * Shows the validation refusals and the server errors of the send; large attachment upload errors have a
 * block of their own next to the files. A new send rewrites `state.errors`, so the message of the previous
 * attempt is replaced rather than appended to.
 */
// @vue/component
export const ErrorAlert = defineComponent({
	name: 'MailComposeErrorAlert',

	components: {
		Alert,
	},

	setup()
	{
		return {
			state: useComposeState(),
			design: AlertDesign.tintedAlert,
			testId: TestId,
		};
	},

	computed: {
		errors(): ComposeError[]
		{
			const totalLimitError = getRecipientsTotalLimitError(this.state);
			if (!totalLimitError)
			{
				return this.state.errors;
			}

			const storedErrors = this.state.errors.filter((error: ComposeError): boolean => {
				return error.code !== ValidationError.RecipientsTotalLimit;
			});

			return [totalLimitError, ...storedErrors];
		},

		messages(): string[]
		{
			return this.errors.map((error: ComposeError): string => error.message);
		},

		isShown(): boolean
		{
			return this.messages.length > 0;
		},
	},

	watch: {
		/** A repeated refusal counts as a new message, so the announcement follows the list. */
		messages(): void
		{
			void this.$nextTick(this.announce);
		},
	},

	methods: {
		/**
		 * Takes the focus and scrolls into view: in a long message the block is pushed off screen, and the
		 * user would be left with a message that does not send and no visible reason.
		 */
		announce(): void
		{
			const block = this.$refs.block as HTMLElement | undefined;
			if (!block)
			{
				return;
			}

			block.focus();
			block.scrollIntoView({ block: 'nearest' });
		},

		handleClose(): void
		{
			this.state.errors = [];
		},
	},

	template: `
		<div
			v-if="isShown"
			ref="block"
			class="mail-compose-error-alert"
			:data-testid="testId"
			role="alert"
			tabindex="-1"
		>
			<Alert :design="design" hasCloseButton @closeButtonClick="handleClose">
				<span
					v-for="(message, index) in messages"
					:key="index"
					class="mail-compose-error-alert__message"
				>{{ message }}</span>
			</Alert>
		</div>
	`,
});
