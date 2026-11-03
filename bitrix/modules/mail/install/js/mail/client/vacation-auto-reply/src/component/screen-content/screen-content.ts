import { Loc, Type } from 'main.core';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { TextSm, TextXs } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { AirSwitcherStyle, Switcher as CoreSwitcher } from 'ui.switcher';
import { Switcher } from 'ui.vue3.components.switcher';
import { defineComponent, type PropType } from 'ui.vue3';

import {
	type FieldErrorTarget,
	type FieldErrorTargets,
	ScreenStatus,
	type ScreenStateData,
} from '../../state';
import { type SignatureTransport } from '../../transport';
import { type VacationAutoReplySetting } from '../../types';
import { MailboxInputId } from '../../infrastructure/adapter/mailbox-select-adapter';
import { EditorHost } from '../editor-host/editor-host';
import { MailboxField } from '../mailbox-field/mailbox-field';
import { PeriodField } from '../period-field/period-field';

const ACTIVE_LABEL_ID = 'mail-vacation-auto-reply-active-label';
const READONLY_NOTE_ID = 'mail-vacation-auto-reply-readonly';
const MAILBOX_ERROR_ID = 'mail-vacation-auto-reply-error-mailbox';

const TestId = Object.freeze({
	body: 'mail-vacation-auto-reply-form-body',
	status: 'mail-vacation-auto-reply-status',
	loader: 'mail-vacation-auto-reply-loader',
	failure: 'mail-vacation-auto-reply-failure',
	retry: 'mail-vacation-auto-reply-retry',
	empty: 'mail-vacation-auto-reply-empty',
	mailboxList: 'mail-vacation-auto-reply-mailbox-list',
	active: 'mail-vacation-auto-reply-active',
	readonly: READONLY_NOTE_ID,
});

type CoreSwitcherInstance = {
	getNode?: () => HTMLElement,
};

type CoreSwitcherClass = {
	prototype: {
		destroy?: () => void,
	},
	getList?: () => CoreSwitcherInstance[],
};

export type PeriodRequest = {
	startsAt: string,
	endsAt: string,
};

type PeriodFieldControl = {
	syncLoadedBounds(
		startsAt?: string | null,
		endsAt?: string | null,
	): void,
	getRequestValues(
		loadedStartsAt?: string | null,
		loadedEndsAt?: string | null,
	): PeriodRequest,
	setReadonly(readonly: boolean): void,
	getErrorTarget(): FieldErrorTarget,
};

type EditorHostControl = {
	hasAdapter(): boolean,
	setBody(body: string | null | undefined): boolean,
	getBody(): string,
	save(): boolean,
	showError(text: string): void,
	clearError(): void,
	setReadonly(readonly: boolean): void,
	getErrorTarget(): FieldErrorTarget,
};

type ScreenContentRefs = {
	editor?: EditorHostControl,
	period?: PeriodFieldControl,
};

export type ScreenContentControl = {
	getActive(): boolean,
	getPeriodRequest(setting?: VacationAutoReplySetting | null): PeriodRequest,
	getEditorBody(): string,
	saveEditor(): boolean,
	showEditorError(text: string): void,
	clearEditorError(): void,
	applySetting(setting: VacationAutoReplySetting): boolean,
	setReadonly(readonly: boolean): void,
	getFieldErrorTargets(): FieldErrorTargets,
	getReadonlyNoteId(): string,
};

function loc(phrase: string): string
{
	return Loc.getMessage(phrase) ?? '';
}

function resolveElement(element: Element | null): HTMLElement | null
{
	return Type.isElementNode(element) ? element as HTMLElement : null;
}

function createFallbackTarget(): FieldErrorTarget
{
	return {
		message: document.createElement('div'),
		controls: [],
	};
}

function ensureCoreSwitcherDestroy(): void
{
	const switcher = CoreSwitcher as unknown as CoreSwitcherClass;
	if (Type.isFunction(switcher.prototype.destroy))
	{
		return;
	}

	switcher.prototype.destroy = function(): void {
		const list = switcher.getList?.() ?? [];
		const index = list.indexOf(this as CoreSwitcherInstance);
		if (index >= 0)
		{
			list.splice(index, 1);
		}
	};
}

// @vue/component
export const ScreenContent = defineComponent({
	name: 'MailVacationAutoReplyScreenContent',
	components: {
		Alert,
		EditorHost,
		MailboxField,
		PeriodField,
		Switcher,
		TextSm,
		TextXs,
		UiButton,
	},
	props: {
		state: {
			type: Object as PropType<ScreenStateData>,
			required: true,
		},
		mailboxListPath: {
			type: String,
			default: '',
		},
		timezoneId: {
			type: String,
			default: '',
		},
		editorId: {
			type: String,
			default: '',
		},
		editorNode: {
			type: Object as PropType<HTMLElement | null>,
			default: null,
		},
		transport: {
			type: Object as PropType<SignatureTransport | null>,
			default: null,
		},
	},
	emits: ['retry', 'selectMailbox', 'changeActive'],
	setup()
	{
		ensureCoreSwitcherDestroy();

		return {
			alertDesign: AlertDesign,
			activeLabelId: ACTIVE_LABEL_ID,
			buttonSize: ButtonSize.SMALL,
			readonlyNoteId: READONLY_NOTE_ID,
			retryStyle: AirButtonStyle.OUTLINE,
			switcherOptions: Object.freeze({
				size: 'medium',
				useAirDesign: true,
				style: AirSwitcherStyle.TINTED,
			}),
			testId: TestId,
		};
	},
	computed: {
		isLoading(): boolean
		{
			return this.state.status === ScreenStatus.Loading;
		},

		isBusy(): boolean
		{
			return this.isLoading || this.state.saving;
		},

		isFailed(): boolean
		{
			return this.state.status === ScreenStatus.Failed;
		},

		isEmpty(): boolean
		{
			return this.state.status === ScreenStatus.Empty;
		},

		isReady(): boolean
		{
			return this.state.status === ScreenStatus.Ready;
		},

		setting(): VacationAutoReplySetting | null
		{
			return this.state.setting;
		},

		isReadonly(): boolean
		{
			return this.setting?.canEdit !== true;
		},

		/**
		 * Fields take no input while the answer of a save is on its way: the answer carries the whole
		 * setting and is applied to the whole form, so what was typed after the button was pressed would
		 * be replaced by the snapshot of the answer without a trace. This is not the read-only screen of
		 * somebody else's mailbox - the note of the rights stays hidden, and the save button keeps saying
		 * what it is going to do.
		 */
		isFrozen(): boolean
		{
			return this.isReadonly || this.state.saving;
		},

		isActive(): boolean
		{
			return this.setting?.active === true;
		},

		selectedMailboxId: {
			get(): number
			{
				return this.state.mailboxId;
			},
			set(mailboxId: number): void
			{
				this.$emit('selectMailbox', mailboxId);
			},
		},

		loadFailureMessage(): string
		{
			return this.state.loadFailure?.message ?? '';
		},

		busyStatusText(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_SAVE_WAIT');
		},

		canRetry(): boolean
		{
			return this.state.loadFailure?.retryable === true;
		},

		retryText(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_RETRY');
		},

		emptyText(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_NO_MAILBOX');
		},

		mailboxListText(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_MAILBOX_LIST');
		},

		readonlyText(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_READONLY');
		},

		activeLabel(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_ACTIVE_LABEL');
		},

		exclusionsHint(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_EXCLUSIONS_HINT');
		},

		signatureHint(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_SIGNATURE_HINT');
		},
	},
	methods: {
		handleRetry(): void
		{
			this.$emit('retry');
		},

		handleActiveCheck(): void
		{
			this.changeActive(true);
		},

		handleActiveUncheck(): void
		{
			this.changeActive(false);
		},

		handleActiveToggle(event: KeyboardEvent): void
		{
			if (
				!Type.isElementNode(this.$el)
				|| !(this.$el as HTMLElement).isConnected
				|| !this.isReady
				|| this.isReadonly
				|| this.state.setting === null
			)
			{
				return;
			}

			event.preventDefault();
			this.changeActive(!this.isActive);
		},

		changeActive(active: boolean): void
		{
			if (!this.isReady || this.isReadonly || this.state.setting === null)
			{
				return;
			}

			this.$emit('changeActive', active);
		},

		getActive(): boolean
		{
			return this.state.setting?.active === true;
		},

		getPeriodRequest(setting: VacationAutoReplySetting | null | undefined = undefined): PeriodRequest
		{
			const period = (this.$refs as ScreenContentRefs).period;
			const currentSetting = setting === undefined ? this.state.setting : setting;

			return period?.getRequestValues(currentSetting?.startsAt, currentSetting?.endsAt) ?? {
				startsAt: '',
				endsAt: '',
			};
		},

		getEditorBody(): string
		{
			return (this.$refs as ScreenContentRefs).editor?.getBody() ?? '';
		},

		saveEditor(): boolean
		{
			return (this.$refs as ScreenContentRefs).editor?.save() === true;
		},

		showEditorError(text: string): void
		{
			(this.$refs as ScreenContentRefs).editor?.showError(text);
		},

		clearEditorError(): void
		{
			(this.$refs as ScreenContentRefs).editor?.clearError();
		},

		applySetting(setting: VacationAutoReplySetting): boolean
		{
			void setting;
			const editor = (this.$refs as ScreenContentRefs).editor;
			if (editor?.hasAdapter() !== true)
			{
				return false;
			}

			try
			{
				editor.getBody();

				return true;
			}
			catch
			{
				return false;
			}
		},

		setReadonly(readonly: boolean): void
		{
			const refs = this.$refs as ScreenContentRefs;
			refs.period?.setReadonly(readonly);
			refs.editor?.setReadonly(readonly);
		},

		getFieldErrorTargets(): FieldErrorTargets
		{
			const refs = this.$refs as ScreenContentRefs;

			return {
				mailbox: this.getMailboxErrorTarget(),
				period: refs.period?.getErrorTarget() ?? createFallbackTarget(),
				body: refs.editor?.getErrorTarget() ?? createFallbackTarget(),
			};
		},

		getMailboxErrorTarget(): FieldErrorTarget
		{
			const message = resolveElement(this.$el.querySelector(`#${MAILBOX_ERROR_ID}`)) ?? document.createElement('div');
			const input = this.$el.querySelector(`#${MailboxInputId}`);

			return {
				message,
				controls: Type.isElementNode(input) ? [input as HTMLElement] : [],
			};
		},

		getReadonlyNoteId(): string
		{
			return READONLY_NOTE_ID;
		},
	},
	template: `
		<div
			class="mail-vacation-auto-reply-form__surface --ui-context-content-light"
			:aria-busy="isBusy ? 'true' : 'false'"
		>
			<div
				v-show="isBusy"
				class="mail-vacation-auto-reply-form__status"
				:data-testid="testId.status"
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>{{ busyStatusText }}</div>
			<div
				v-show="isLoading"
				class="mail-vacation-auto-reply-form__loader"
				:data-testid="testId.loader"
			></div>

			<div
				v-show="isFailed"
				class="mail-vacation-auto-reply-form__message"
				:data-testid="testId.failure"
				role="alert"
			>
				<Alert :design="alertDesign.tintedAlert">
					<div class="mail-vacation-auto-reply-form__message-content">
						<TextSm
							tag="span"
							class-name="mail-vacation-auto-reply-form__message-text"
						>{{ loadFailureMessage }}</TextSm>
						<span v-if="canRetry" class="mail-vacation-auto-reply-form__message-action">
							<UiButton
								:text="retryText"
								:size="buttonSize"
								:style="retryStyle"
								:dataset="{ testid: testId.retry }"
								@click="handleRetry"
							/>
						</span>
					</div>
				</Alert>
			</div>

			<div
				v-show="isEmpty"
				class="mail-vacation-auto-reply-form__message"
				:data-testid="testId.empty"
			>
				<Alert :design="alertDesign.tinted">
					<div class="mail-vacation-auto-reply-form__message-content">
						<TextSm
							tag="span"
							class-name="mail-vacation-auto-reply-form__message-text"
						>{{ emptyText }}</TextSm>
						<TextSm
							v-if="mailboxListPath !== ''"
							tag="a"
							class-name="mail-vacation-auto-reply-form__link"
							:href="mailboxListPath"
							:data-testid="testId.mailboxList"
						>{{ mailboxListText }}</TextSm>
					</div>
				</Alert>
			</div>

			<div
				v-show="isReady"
				class="mail-vacation-auto-reply-form__body"
				:class="{ '--readonly': isReadonly, '--saving': state.saving }"
				:data-testid="testId.body"
			>
				<MailboxField
					v-model="selectedMailboxId"
					:mailboxes="state.mailboxes"
					:error="state.fieldErrors.mailbox"
				/>
				<div
					v-show="isReadonly"
					:id="readonlyNoteId"
					class="mail-vacation-auto-reply-form__note --readonly"
					:data-testid="testId.readonly"
				>
					<Alert :design="alertDesign.tintedWarning">
						<TextSm>{{ readonlyText }}</TextSm>
					</Alert>
				</div>
				<div class="mail-vacation-auto-reply-form__row --inline">
					<TextSm
						tag="span"
						class-name="mail-vacation-auto-reply-form__label"
						:id="activeLabelId"
					>{{ activeLabel }}</TextSm>
					<Switcher
						class="mail-vacation-auto-reply-form__switcher"
						:data-testid="testId.active"
						role="switch"
						:tabindex="isFrozen ? -1 : 0"
						:aria-checked="String(isActive)"
						:aria-disabled="isFrozen ? 'true' : null"
						:is-checked="isActive"
						:is-disabled="isFrozen"
						:options="switcherOptions"
						:aria-labelledby="activeLabelId"
						@keydown.enter="handleActiveToggle"
						@keydown.space="handleActiveToggle"
						@check="handleActiveCheck"
						@uncheck="handleActiveUncheck"
					/>
				</div>
				<PeriodField
					ref="period"
					:setting="setting"
					:timezone-id="setting?.timezoneId ?? ''"
					:fallback-timezone-id="timezoneId"
					:readonly="isFrozen"
					:error="state.fieldErrors.period"
				/>
				<TextXs tag="div" class-name="mail-vacation-auto-reply-form__note">{{ exclusionsHint }}</TextXs>
				<TextXs tag="div" class-name="mail-vacation-auto-reply-form__note">{{ signatureHint }}</TextXs>
				<EditorHost
					ref="editor"
					:editor-id="editorId"
					:editor-node="editorNode"
					:transport="transport"
					:setting="setting"
					:readonly="isFrozen"
					:error="state.fieldErrors.body"
				/>
			</div>
		</div>
	`,
});
