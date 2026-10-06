import { defineComponent, provide } from 'ui.vue3';

import { ActionBar } from '../component/action-bar/action-bar';
import { ComposeHeader } from '../component/compose-header/compose-header';
import { EditorHost } from '../component/editor-host/editor-host';
import { ErrorAlert } from '../component/error-alert/error-alert';
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
	},

	setup(props: { editorId: string, uploaderControlId: string })
	{
		// Closing the screen belongs to the form instance outside Vue.
		const closeForm = useCloseComposeForm();

		// The adapter owns editor subscriptions, so exactly one instance is created here and provided to
		// every child. It stays out of `data()`: a reactive proxy breaks access to its private fields.
		const editor = new EditorAdapter({
			editorId: props.editorId,
			uploaderControlId: props.uploaderControlId,
			closeForm,
		});
		provide(composeEditorKey, editor);

		return {
			editor,
			state: useComposeState(),
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
	},

	template: `
		<div
			class="mail-compose-form"
			:class="{ '--draft-loading': state.draft.isLoading }"
			data-testid="mail-compose-form"
			:aria-busy="state.draft.isLoading ? 'true' : 'false'"
			:inert="state.draft.isLoading || state.draft.restoreFailed || state.isSending || undefined"
		>
			<ComposeHeader/>
			<div class="mail-compose-form__content" data-testid="mail-compose-form-content">
				<div class="mail-compose-form__fields" data-testid="mail-compose-form-fields">
					<SenderChip/>
					<RecipientRows/>
					<div class="mail-compose-form__subject-row" data-testid="mail-compose-form-subject-row">
						<SubjectField/>
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
				<ActionBar @signature="openSignatureMenu" @send="submitMessage" @cancel="closeForm"/>
			</div>
			<SendForm ref="sendForm" :formId="formId"/>
		</div>
	`,
});
