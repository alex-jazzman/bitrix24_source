import { defineComponent, provide } from 'ui.vue3';

import { ActionBar } from '../component/action-bar/action-bar';
import { ComposeHeader } from '../component/compose-header/compose-header';
import { EditorHost } from '../component/editor-host/editor-host';
import { ErrorAlert } from '../component/error-alert/error-alert';
import { GenerateSubjectButton } from '../component/generate-subject-button/generate-subject-button';
import { QuoteToggle } from '../component/quote-toggle/quote-toggle';
import { RecipientRows } from '../component/recipient-rows/recipient-rows';
import { SenderChip } from '../component/sender-chip/sender-chip';
import { SendForm } from '../component/send-form/send-form';
import { ShowBccButton } from '../component/show-bcc-button/show-bcc-button';
import { SignatureBlock } from '../component/signature-block/signature-block';
import { SubjectField } from '../component/subject-field/subject-field';
import { AttachmentAnchorTestId, NoticesTestId, SlotsControlTestId } from '../const';
import { useCloseComposeForm } from '../feature/close-form/close-form';
import { showCalendarSlotsTour } from '../feature/insert-calendar-slots/insert-calendar-slots';
import { restoreScheduledBody } from '../feature/schedule-message/scheduled-body';
import { composeEditorKey, EditorAdapter } from '../infrastructure/adapter/editor/editor';
import { type EditorUnsubscribe } from '../infrastructure/adapter/editor/types';
import { sendComposeSendAnalytics } from '../lib/analytics/analytics';
import { useComposeState } from '../model/compose/compose';

import '../css/compose-form.css';

/** Part of `SignatureBlock` reached through `$refs`. */
type SignatureControl = {
	handleControlClick(): void,
};

/** Part of `SendForm` reached through `$refs`. */
type SendControl = {
	submit(): void,
	schedule(payload: { scheduledAt: string, timezoneId: string }): void,
};

/**
 * `EditorHost` is a sibling of the other sections and has no reactive bindings: its node has to be
 * created once, while the sections around it re-render freely.
 */
// @vue/component
export const App = defineComponent({
	name: 'MailComposeApp',

	components: {
		ActionBar,
		ComposeHeader,
		EditorHost,
		ErrorAlert,
		GenerateSubjectButton,
		QuoteToggle,
		RecipientRows,
		SenderChip,
		SendForm,
		ShowBccButton,
		SignatureBlock,
		SubjectField,
	},

	props: {
		editorId: {
			type: String,
			required: true,
		},
		/** Id of the server-rendered `form` element; the message is sent as its serialisation. */
		formId: {
			type: String,
			required: true,
		},
		/** Id of the Disk uploader control that owns the attachment set. */
		uploaderControlId: {
			type: String,
			required: true,
		},
		/** Markup for the head of the letter document: the tokens the styles of the letter are written in. */
		editorHeadHtml: {
			type: String,
			default: '',
		},
	},

	setup(props: { editorId: string, uploaderControlId: string, editorHeadHtml: string })
	{
		// Closing the screen belongs to the form instance outside Vue.
		const closeForm = useCloseComposeForm();

		// The adapter owns editor subscriptions, so exactly one instance is created here and provided to
		// every child. It stays out of `data()`: a reactive proxy breaks access to its private fields.
		const editor = new EditorAdapter({
			editorId: props.editorId,
			uploaderControlId: props.uploaderControlId,
			headHtml: props.editorHeadHtml,
			closeForm,
		});
		provide(composeEditorKey, editor);

		// Done here and not in a child: the body of a scheduled message has to be taken over before any part
		// of the form reads it, and the order of the children is no guarantee of that.
		const state = useComposeState();
		restoreScheduledBody({ editor, state });

		return {
			editor,
			state,
			closeForm,
			subscriptions: [] as EditorUnsubscribe[],
			noticesTestId: NoticesTestId,
			attachmentAnchorTestId: AttachmentAnchorTestId,
		};
	},

	mounted(): void
	{
		// The tour waits for the editor body and points at a footer control, so it is started here rather
		// than in a child.
		this.subscriptions.push(showCalendarSlotsTour({
			editor: this.editor,
			state: this.state,
			getControlNode: this.getSlotsControlNode,
		}));
	},

	beforeUnmount(): void
	{
		this.subscriptions.forEach((unsubscribe: EditorUnsubscribe): void => {
			unsubscribe();
		});
		this.subscriptions.length = 0;
		this.editor.destroy();
	},

	methods: {
		getSlotsControlNode(): HTMLElement | null
		{
			const footer = this.$refs.footer as HTMLElement | undefined;

			return footer?.querySelector<HTMLElement>(`[data-testid="${SlotsControlTestId}"]`) ?? null;
		},

		/**
		 * The footer action reuses the picker of `SignatureBlock` instead of opening a second one. With no
		 * signature row rendered there is nothing to open and the call does nothing.
		 */
		openSignatureMenu(): void
		{
			const signature = this.$refs.signature as SignatureControl | null | undefined;

			signature?.handleControlClick();
		},

		/** Analytics is sent on the click itself, before validation, so a refused attempt is counted too. */
		submitMessage(): void
		{
			sendComposeSendAnalytics(this.state.analytics);

			const sendForm = this.$refs.sendForm as SendControl | null | undefined;

			sendForm?.submit();
		},

		scheduleMessage(payload: { scheduledAt: string, timezoneId: string }): void
		{
			if (!this.state.features.scheduledMessages)
			{
				return;
			}

			const sendForm = this.$refs.sendForm as SendControl | null | undefined;

			sendForm?.schedule(payload);
		},
	},

	template: `
		<div
			class="mail-compose-form"
			:class="{ '--draft-loading': state.draft.isLoading }"
			data-testid="mail-compose-form"
			:aria-busy="state.draft.isLoading ? 'true' : 'false'"
			:inert="state.draft.isLoading || state.isSending || undefined"
		>
			<ComposeHeader/>
			<div
				class="mail-compose-form__content"
				data-testid="mail-compose-form-content"
				:inert="state.draft.restoreFailed || undefined"
			>
				<div class="mail-compose-form__fields" data-testid="mail-compose-form-fields">
					<SenderChip/>
					<RecipientRows/>
					<div class="mail-compose-form__subject-row" data-testid="mail-compose-form-subject-row">
						<SubjectField/>
						<GenerateSubjectButton :formId="formId"/>
						<ShowBccButton/>
					</div>
				</div>
				<EditorHost/>
				<SignatureBlock ref="signature"/>
				<QuoteToggle/>
				<div class="mail-compose-form__notices" :data-testid="noticesTestId"></div>
				<div :data-testid="attachmentAnchorTestId"></div>
			</div>
			<div ref="footer" class="mail-compose-form__footer" data-testid="mail-compose-form-footer">
				<ErrorAlert/>
				<ActionBar
					:formId="formId"
					@signature="openSignatureMenu"
					@send="submitMessage"
					@schedule="scheduleMessage"
					@cancel="closeForm"
				/>
			</div>
			<SendForm ref="sendForm" :formId="formId"/>
		</div>
	`,
});
