import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { Phrase, SendControlTestId, SlotsControlTestId } from '../../const';
import { insertCalendarSlots } from '../../feature/insert-calendar-slots/insert-calendar-slots';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { loc } from '../../lib/loc/loc';
import {
	isRecipientsTotalLimitExceeded,
	isSelectedSenderMigrationActive,
	useComposeState,
} from '../../model/compose/compose';
import { SendSplitButton } from '../send-split-button/send-split-button';
import { TemplatePicker } from '../template-picker/template-picker';

import './action-bar.css';

const TestId = Object.freeze({
	actions: 'mail-compose-action-bar',
	copilot: 'mail-compose-copilot-action',
	attach: 'mail-compose-attach-action',
	createDocument: 'mail-compose-create-document-action',
	signature: 'mail-compose-signature-action',
	slots: SlotsControlTestId,
	sendRow: 'mail-compose-send-row',
	send: SendControlTestId,
	cancel: 'mail-compose-cancel',
});

type ActionBarLabels = {
	copilot: string,
	attach: string,
	createDocument: string,
	signature: string,
	slots: string,
	send: string,
	cancel: string,
};

/**
 * The action row and the send row are rendered as siblings without a wrapper: the form footer lays them
 * out in a column. Every action delegates to the part of the form that owns it, so no page global is
 * reached from here.
 */
// @vue/component
export const ActionBar = defineComponent({
	name: 'MailComposeActionBar',

	components: {
		SendSplitButton,
		TemplatePicker,
		UiButton,
	},

	emits: ['signature', 'send', 'cancel'],

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			actionStyle: AirButtonStyle.PLAIN_NO_ACCENT,
			actionSize: ButtonSize.SMALL,
			sendStyle: AirButtonStyle.FILLED,
			cancelStyle: AirButtonStyle.PLAIN,
			sendSize: ButtonSize.MEDIUM,
			copilotIcon: Outline.COPILOT,
			attachIcon: Outline.ATTACH,
			createDocumentIcon: Outline.CREATE_FILE,
			signatureIcon: Outline.DOCUMENT_SIGN,
			slotsIcon: Outline.CALENDAR_WITH_SLOTS,
			testId: TestId,
		};
	},

	data()
	{
		return {
			isSlotsPending: false,
		};
	},

	computed: {
		labels(): ActionBarLabels
		{
			return {
				copilot: loc(Phrase.CopilotButton),
				attach: loc(Phrase.AttachButton),
				createDocument: loc(Phrase.CreateDocumentButton),
				// This action and the control over the body open the same picker, so they share one label.
				signature: loc(Phrase.SignatureButton),
				slots: loc(Phrase.SlotsButton),
				send: loc(Phrase.SendButton),
				cancel: loc(Phrase.CancelButton),
			};
		},

		/** Off means not rendered at all: a hidden element would still take room and keep its tab stop. */
		isUnfinishedShown(): boolean
		{
			return this.state.features.unfinishedElements;
		},

		isTemplatesShown(): boolean
		{
			return this.state.features.templates;
		},

		/** Server flags alone decide this; the form checks no tariff of its own. */
		isCopilotShown(): boolean
		{
			return this.state.copilot.isCopilotEnabled === true;
		},

		isSending(): boolean
		{
			return this.state.isSending;
		},

		isSendDisabled(): boolean
		{
			return this.isSending
				|| isSelectedSenderMigrationActive(this.state)
				|| isRecipientsTotalLimitExceeded(this.state)
			;
		},

		sendUnavailableHint(): string
		{
			return isSelectedSenderMigrationActive(this.state) ? loc('MAIL_MIGRATION_SEND_UNAVAILABLE') : '';
		},
	},

	methods: {
		handleCopilot(): void
		{
			this.editor.showCopilot();
		},

		handleAttach(): void
		{
			this.editor.showUploader();
		},

		/** The picker belongs to `SignatureBlock`, so the parent is asked to open it. */
		handleSignature(): void
		{
			this.$emit('signature');
		},

		/** A repeated click while the request is in flight is refused: one slots line per click. */
		handleSlots(): void
		{
			if (this.isSlotsPending)
			{
				return;
			}

			this.isSlotsPending = true;
			const stopWaiting = (): void => {
				this.isSlotsPending = false;
			};

			void insertCalendarSlots({
				editor: this.editor,
				state: this.state,
				getControlNode: this.getSlotsControlNode,
			}).then(stopWaiting, stopWaiting);
		},

		handleCreateDocument(): void
		{
			this.editor.showCreateDocument();
		},

		handleSend(): void
		{
			if (this.isSendDisabled)
			{
				return;
			}

			this.$emit('send');
		},

		handleCancel(): void
		{
			this.$emit('cancel');
		},

		/**
		 * The tariff promo anchors on this node and the focus returns to it after the calendar slider closes.
		 * The rendered button stands next to the placeholder of its Vue wrapper rather than inside it, so it
		 * is located by `data-testid`.
		 */
		getSlotsControlNode(): HTMLElement | null
		{
			const row = this.$refs.actions as HTMLElement | undefined;

			return row?.querySelector<HTMLElement>(`[data-testid="${TestId.slots}"]`) ?? null;
		},
	},

	template: `
		<div ref="actions" class="mail-compose-action-bar" :data-testid="testId.actions">
			<UiButton
				v-if="isCopilotShown"
				:text="labels.copilot"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="copilotIcon"
				:dataset="{ testid: testId.copilot }"
				@click="handleCopilot"
			/>
			<UiButton
				:text="labels.attach"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="attachIcon"
				:dataset="{ testid: testId.attach }"
				@click="handleAttach"
			/>
			<UiButton
				v-if="isUnfinishedShown"
				:text="labels.createDocument"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="createDocumentIcon"
				:dataset="{ testid: testId.createDocument }"
				@click="handleCreateDocument"
			/>
			<UiButton
				:text="labels.signature"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="signatureIcon"
				:dataset="{ testid: testId.signature }"
				@click="handleSignature"
			/>
			<UiButton
				:text="labels.slots"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="slotsIcon"
				:loading="isSlotsPending"
				:dataset="{ testid: testId.slots }"
				@click="handleSlots"
			/>
			<TemplatePicker v-if="isTemplatesShown"/>
		</div>
		<div class="mail-compose-send-row" :data-testid="testId.sendRow">
			<SendSplitButton v-if="isUnfinishedShown" @send="handleSend"/>
			<UiButton
				v-else
				:text="labels.send"
				:style="sendStyle"
				:size="sendSize"
				:loading="isSending"
				:disabled="isSendDisabled"
				:title="sendUnavailableHint"
				:dataset="{ testid: testId.send }"
				@click="handleSend"
			/>
			<UiButton
				:text="labels.cancel"
				:style="cancelStyle"
				:size="sendSize"
				:dataset="{ testid: testId.cancel }"
				@click="handleCancel"
			/>
		</div>
	`,
});
