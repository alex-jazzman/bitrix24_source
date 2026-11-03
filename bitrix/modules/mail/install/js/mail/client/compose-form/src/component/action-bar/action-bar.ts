import { Dom, Runtime } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { TextSm } from 'ui.system.typography.vue';
import { defineAsyncComponent, defineComponent, type Component } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import {
	Phrase,
	SaveTemplateContainerTestId,
	SaveTemplateControlTestId,
	SendControlTestId,
	SlotsControlTestId,
} from '../../const';
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
	saveTemplate: SaveTemplateContainerTestId,
	saveTemplateControl: SaveTemplateControlTestId,
});

type CheckboxExtension = {
	Vue: {
		Checkbox: Component,
	},
};

const CheckboxSizeMd = 'md';
const Checkbox = defineAsyncComponent({
	loader: () => {
		return Runtime.loadExtension('ui.system.checkbox').then((exports) => {
			return (exports as unknown as CheckboxExtension).Vue.Checkbox;
		});
	},
});

type ActionBarLabels = {
	copilot: string,
	attach: string,
	createDocument: string,
	signature: string,
	slots: string,
	send: string,
	cancel: string,
	saveTemplate: string,
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
		Checkbox,
		SendSplitButton,
		TemplatePicker,
		TextSm,
		UiButton,
	},

	props: {
		formId: {
			type: String,
			required: true,
		},
	},

	emits: ['signature', 'send', 'schedule', 'cancel'],

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
			checkboxSize: CheckboxSizeMd,
			copilotStyle: AirButtonStyle.TINTED_BITRIX_GPT,
			copilotIcon: Outline.AI_STARS,
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
		saveTemplateControlId(): string
		{
			return `${this.formId}-${TestId.saveTemplateControl}`;
		},

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
				saveTemplate: loc(Phrase.SaveAsTemplate),
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

		/**
		 * A letter already on the schedule is saved again through the update of the schedule, and that path
		 * carries no ask of a template: the box there would be a control that does nothing.
		 */
		isSaveTemplateShown(): boolean
		{
			return this.state.features.saveTemplate && this.state.scheduledMessage.id <= 0;
		},

		/**
		 * The half of the schedule stands on its own flag alone: under the flag of the unfinished elements the
		 * card would open over a form that schedules nothing, and every choice in it would do nothing at all.
		 */
		isScheduleShown(): boolean
		{
			return this.state.features.scheduledMessages;
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

		isRestoreFailed(): boolean
		{
			return this.state.draft.restoreFailed;
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
			return isSelectedSenderMigrationActive(this.state) ? loc('MAIL_MIGRATION_ACTION_UNAVAILABLE') : '';
		},
	},

	watch: {
		sendUnavailableHint(): void
		{
			this.syncSendHint();
		},

		/** The send control is drawn anew with this state, so the hint goes onto the new node. */
		isRestoreFailed(): void
		{
			void this.$nextTick(this.syncSendHint);
		},
	},

	mounted(): void
	{
		this.syncSendHint();
	},

	updated(): void
	{
		this.syncSendHint();
	},

	methods: {
		handleCopilot(): void
		{
			this.editor.showCopilot();
		},

		handleAttach(): void
		{
			this.editor.toggleUploader();
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
			this.editor.toggleCreateDocument();
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

		/**
		 * An attribute bound on the Vue wrapper never reaches the rendered button, so the hint is written on the
		 * node itself. The split writes its own hint.
		 */
		syncSendHint(): void
		{
			if (this.isScheduleShown)
			{
				return;
			}

			const control = this.getSendControlNode();
			if (control)
			{
				Dom.attr(control, 'title', this.sendUnavailableHint || null);
			}
		},

		getSendControlNode(): HTMLElement | null
		{
			const row = this.$refs.sendRow as HTMLElement | undefined;

			return row?.querySelector<HTMLElement>(`[data-testid="${TestId.send}"]`) ?? null;
		},
	},

	template: `
		<div
			v-if="!isRestoreFailed"
			ref="actions"
			class="mail-compose-action-bar"
			:class="{ '--with-copilot': isCopilotShown }"
			:data-testid="testId.actions"
		>
			<UiButton
				v-if="isCopilotShown"
				class="mail-compose-copilot-button"
				:text="labels.copilot"
				:style="copilotStyle"
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
		<div ref="sendRow" class="mail-compose-send-row" :data-testid="testId.sendRow">
			<template v-if="!isRestoreFailed">
				<SendSplitButton
					v-if="isScheduleShown"
					@send="handleSend"
					@schedule="$emit('schedule', $event)"
				/>
				<UiButton
					v-else
					:text="labels.send"
					:style="sendStyle"
					:size="sendSize"
					:loading="isSending"
					:disabled="isSendDisabled"
					:dataset="{ testid: testId.send }"
					@click="handleSend"
				/>
			</template>
			<UiButton
				:text="labels.cancel"
				:style="cancelStyle"
				:size="sendSize"
				:dataset="{ testid: testId.cancel }"
				@click="handleCancel"
			/>
			<div
				v-if="isSaveTemplateShown"
				class="mail-compose-save-template"
				:data-testid="testId.saveTemplate"
			>
				<Checkbox
					v-model="state.saveAsTemplate"
					:id="saveTemplateControlId"
					:size="checkboxSize"
					:data-testid="testId.saveTemplateControl"
					@keydown.enter.prevent
				/>
				<TextSm
					tag="label"
					class-name="mail-compose-save-template__label"
					:for="saveTemplateControlId"
				>{{ labels.saveTemplate }}</TextSm>
			</div>
		</div>
	`,
});
