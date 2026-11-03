import { Event } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { TextMd, TextSm } from 'ui.system.typography.vue';
import { markRaw, toRaw } from 'ui.vue3';

import { VoiceRecorderButton } from 'im.v2.component.textarea';
import { Analytics } from 'im.v2.lib.analytics';
import { Utils } from 'im.v2.lib.utils';
import { type VoiceRecord } from 'im.v2.lib.voice-recorder';
import { VoiceSendFailure } from 'im.v2.provider.service.uploading';

import { RecordingSession } from '../classes/recording-session';
import { MIN_RECORDING_MS } from '../const/recording-limits';
import { RecordingState, RecordingStopReason } from '../const/recording-state';
import { AccessState, ANNOUNCEMENT_SEPARATOR, getAccessStateAnnouncement } from './access-state';
import { LockIndicator } from './lock-indicator';
import { RecordingPreview } from './recording-preview';

import './css/recording-panel.css';

const ACTION_ICON_SIZE = 24;
const MAIN_ACTION_ICON_SIZE = 26;
const MILLISECONDS_IN_SECOND = 1000;

// only the warning lead time: the duration limit itself comes from the portal
const LIMIT_WARNING_MS = 10000;

const StopReasonAnnouncement = {
	[RecordingStopReason.durationLimit]: 'IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_LIMIT_REACHED',
	[RecordingStopReason.callStarted]: 'IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_CALL_STOP',
	[RecordingStopReason.otherTab]: 'IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_OTHER_TAB_STOP',
};

const SendFailureText = {
	[VoiceSendFailure.noSpace]: 'IM_TEXTAREA_VOICE_RECORDER_SEND_ERROR_NO_SPACE',
	[VoiceSendFailure.tooLarge]: 'IM_TEXTAREA_VOICE_RECORDER_SEND_ERROR_TOO_LARGE',
	[VoiceSendFailure.network]: 'IM_TEXTAREA_VOICE_RECORDER_SEND_ERROR_NETWORK',
	[VoiceSendFailure.unknown]: 'IM_TEXTAREA_VOICE_RECORDER_SEND_ERROR_COMMON',
};

// @vue/component
export const RecordingPanel = {
	name: 'VoiceRecordingPanel',
	components: { AccessState, BIcon, LockIndicator, RecordingPreview, TextMd, TextSm, VoiceRecorderButton },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		isLockedOnStart: {
			type: Boolean,
			default: false,
		},
		// whether a pointer stood behind the start; the panel answers by it where the initial focus
		// goes and nothing else, and the length of the recording is measured by the session
		isStartedFromPointer: {
			type: Boolean,
			default: false,
		},
		// a record handed back by a failed send: the panel opens on it and starts no session of its own
		initialRecord: {
			type: Object,
			default: null,
		},
		sendFailure: {
			type: String,
			default: '',
		},
	},
	emits: ['recorded', 'close'],
	data(): Object
	{
		return {
			session: null,
			durationMs: 0,
			remainingMs: null,
			isCancelArmed: false,
			isLockArmed: false,
			isLocked: this.isLockedOnStart,
			record: this.initialRecord,
			isSendingOnRelease: false,
		};
	},
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		ACTION_ICON_SIZE: () => ACTION_ICON_SIZE,
		MAIN_ACTION_ICON_SIZE: () => MAIN_ACTION_ICON_SIZE,
		recordingState(): string
		{
			return this.session?.getState().recordingState ?? RecordingState.idle;
		},
		stopReason(): ?string
		{
			return this.session?.getState().stopReason ?? null;
		},
		errorCode(): ?string
		{
			return this.session?.getState().errorCode ?? null;
		},
		hasAccessError(): boolean
		{
			return this.errorCode !== null;
		},
		hasRecord(): boolean
		{
			return this.record !== null;
		},
		hasSendFailure(): boolean
		{
			return this.sendFailure !== '';
		},
		sendFailureText(): string
		{
			return this.loc(SendFailureText[this.sendFailure] ?? SendFailureText[VoiceSendFailure.unknown]);
		},
		isRecordingOver(): boolean
		{
			return this.recordingState === RecordingState.stopped;
		},
		isHoldGesture(): boolean
		{
			return !this.isLocked && !this.hasRecord;
		},
		// the keyboard and the accessibility API both open the panel already locked and with no
		// pointer behind it: there is no hold to release and no hand on a pointer to work around
		isStartWithoutPointer(): boolean
		{
			return this.isLockedOnStart && !this.hasRecord && !this.isStartedFromPointer;
		},
		// counted by the same duration the timer of the panel shows, so the states of the actions
		// never disagree with the time the user reads; the session publishes that duration at the
		// minimum as well as on every whole second
		isTooShortToKeep(): boolean
		{
			if (this.hasRecord)
			{
				return this.record.durationMs < MIN_RECORDING_MS;
			}

			// a recording the browser has not started yet is not a short one: there is nothing for the
			// minimum to measure until the first fragment is written
			if (this.recordingState !== RecordingState.recording && !this.isPaused)
			{
				return false;
			}

			return this.durationMs < MIN_RECORDING_MS;
		},
		isPaused(): boolean
		{
			return this.recordingState === RecordingState.paused;
		},
		isLockedRecording(): boolean
		{
			return this.isLocked && this.recordingState === RecordingState.recording;
		},
		duration(): string
		{
			return Utils.date.formatMediaDurationTime(this.durationMs / MILLISECONDS_IN_SECOND);
		},
		// a portal with no limit reports no remainder, so the warning never comes
		isLimitApproaching(): boolean
		{
			return !this.hasRecord && this.remainingMs !== null && this.remainingMs <= LIMIT_WARNING_MS;
		},
		// the notice is spelled out and not left to the colour of the timer alone
		limitLeftText(): string
		{
			const remainingSeconds = Math.ceil(this.remainingMs / MILLISECONDS_IN_SECOND);

			return this.loc('IM_TEXTAREA_VOICE_RECORDER_LIMIT_LEFT', {
				'#TIME#': Utils.date.formatMediaDurationTime(remainingSeconds),
			});
		},
		panelLabel(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_PANEL');
		},
		pausedLabel(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_PAUSED');
		},
		// the timer is left out on purpose: a text that changes on every tick makes a screen reader unusable
		stateAnnouncement(): string
		{
			if (this.hasAccessError)
			{
				return getAccessStateAnnouncement(this.errorCode);
			}

			if (this.hasSendFailure)
			{
				return `${this.sendFailureText}. ${this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_READY')}`;
			}

			if (this.hasRecord)
			{
				// a record below the minimum is offered no sending, so the announcement names that
				// instead of the record ready to be sent
				if (this.isTooShortToKeep)
				{
					return this.tooShortText;
				}

				return this.loc(
					StopReasonAnnouncement[this.stopReason] ?? 'IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_READY',
				);
			}

			if (this.isPaused)
			{
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_PAUSED');
			}

			// the wait for the answer of the browser is as long as the user makes it, so it is named
			if (this.recordingState === RecordingState.requesting)
			{
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_REQUESTING');
			}

			if (this.recordingState !== RecordingState.recording)
			{
				return '';
			}

			if (this.isLimitApproaching)
			{
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_LIMIT_SOON');
			}

			return this.isLocked
				? this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_LOCKED')
				: this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_RECORDING');
		},
		// a refusal is read out at once: it has to be repaired before anything else goes on
		isAnnouncementUrgent(): boolean
		{
			return this.hasAccessError || this.hasSendFailure;
		},
		// the hint names what the release will actually do, and its branches stand in the order the
		// release itself runs them: the cancel, then the minimum, then the send
		releaseHint(): string
		{
			if (this.isCancelArmed)
			{
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_HINT_CANCEL');
			}

			return this.isTooShortToKeep
				? this.loc('IM_TEXTAREA_VOICE_RECORDER_HINT_LOCK')
				: this.loc('IM_TEXTAREA_VOICE_RECORDER_HINT_SEND');
		},
		cancelHint(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_CANCEL');
		},
		pauseHint(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_PAUSE');
		},
		resumeHint(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_RESUME');
		},
		// the stop, the send and the announcement of a record are refused by one and the same
		// minimum, so all three name it with one text and none of them names an action
		tooShortText(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_TOO_SHORT');
		},
		// a refused action names the reason in its own accessible name instead of only greying out
		stopHint(): string
		{
			return this.isTooShortToKeep ? this.tooShortText : this.loc('IM_TEXTAREA_VOICE_RECORDER_STOP');
		},
		sendHint(): string
		{
			return this.isTooShortToKeep ? this.tooShortText : this.loc('IM_TEXTAREA_VOICE_RECORDER_SEND');
		},
	},
	watch:
	{
		// immediate on purpose: the announcer region outlives the panel, so a panel that opens with a
		// text already in it is read out all the same
		stateAnnouncement: {
			handler(announcement: string)
			{
				if (announcement === '')
				{
					return;
				}

				this.announce(announcement, this.isAnnouncementUrgent ? 'assertive' : 'polite');
			},
			immediate: true,
		},
		recordingState(state: string)
		{
			// every end of a session passes through idle, so the panel asks for its way out here alone
			if (state === RecordingState.idle)
			{
				this.$emit('close');

				return;
			}

			// the panel stays to name the refusal, and the hold behind it decides nothing any more
			if (state === RecordingState.error)
			{
				this.stopWaitingForRelease();
			}
		},
		hasRecord(hasRecord: boolean)
		{
			// the stop button leaves with the recording: focus standing on it moves to the send button
			if (!hasRecord || !this.$el.contains(document.activeElement))
			{
				return;
			}

			void this.$nextTick(() => this.$refs.send?.focus());
		},
		// the notice adds a row and moves everything above it, so the cached boxes are read again
		isLimitApproaching()
		{
			void this.$nextTick(this.readGestureBounds);
		},
		// the actions of the recording leave with it: focus standing on one of them moves to the panel
		hasAccessError(hasError: boolean)
		{
			if (!hasError || !this.$el.contains(document.activeElement))
			{
				return;
			}

			void this.$nextTick(() => this.$el.focus());
		},
	},
	created()
	{
		// read for the pointer alone and never rendered, so it stays out of the reactive state
		this.cancelBounds = null;

		// compared by identity and never rendered, so it stays out of the reactive state as well
		this.recordOfOwnSession = null;

		// a session started over a record that came back would ask for the microphone a second time
		if (this.hasRecord)
		{
			return;
		}

		// markRaw keeps the private fields of the session reachable: a reactive proxy would break them
		this.session = markRaw(new RecordingSession());
		this.session.subscribe(RecordingSession.events.onTick, this.onTick);
		this.session.subscribe(RecordingSession.events.onStopped, this.onStopped);

		void this.session.start();
	},
	mounted()
	{
		this.takeInitialFocus();

		// a panel that opens locked, or on a record that came back, has no hold standing behind it
		if (this.isLocked || this.hasRecord)
		{
			return;
		}

		// the release ends the recording wherever the pointer is by then, and the button it started on
		// is hidden with the field, so the document is listened to and not the button
		Event.bind(document, 'pointerup', this.onPointerUp);
		Event.bind(document, 'pointercancel', this.onPointerCancel);
		Event.bind(document, 'pointermove', this.onPointerMove);
		Event.bind(window, 'resize', this.readGestureBounds);
	},
	beforeUnmount()
	{
		this.stopWaitingForRelease();

		if (!this.session)
		{
			return;
		}

		this.session.unsubscribe(RecordingSession.events.onTick, this.onTick);
		this.session.unsubscribe(RecordingSession.events.onStopped, this.onStopped);
		// frees the microphone stream whatever state the recording is left in
		this.session.cancel();
	},
	methods:
	{
		// the announcer cuts a message at its own limit, so a state that comes in parts is read part by
		// part; the priority is named by the caller and belongs to the opening part alone, because an
		// urgent one drops whatever is being read
		announce(announcement: string, priority: string = 'polite')
		{
			const [opening, ...rest] = announcement.split(ANNOUNCEMENT_SEPARATOR);

			LiveAnnouncer.announce(opening, priority);
			rest.forEach((part) => LiveAnnouncer.announce(part, 'polite'));
		},
		onTick(event: BaseEvent<{ durationMs: number, remainingMs: ?number }>)
		{
			const { durationMs, remainingMs } = event.getData();

			this.durationMs = durationMs;
			this.remainingMs = remainingMs;
		},
		onStopped(event: BaseEvent<VoiceRecord>)
		{
			const record = event.getData();

			this.recordOfOwnSession = record;

			if (this.isSendingOnRelease)
			{
				this.handOverRecord(record);

				return;
			}

			// every other end keeps the record in the panel: what is sent is decided by the user
			this.stopWaitingForRelease();
			this.record = record;
		},
		onPointerUp(event: PointerEvent)
		{
			if (this.isRecordingOver)
			{
				this.stopWaitingForRelease();

				return;
			}

			// dropping a record is irreversible, so the release answers by the box of the moment and
			// not by the cached one, which the panel may have outgrown while the hold was running
			this.readGestureBounds();

			if (this.isPointerOverCancel(event))
			{
				this.session.cancel();

				return;
			}

			if (this.isPointerOverLock(event) || this.isReleaseTooEarlyToSend())
			{
				this.onLock();

				return;
			}

			// the release is the send itself, and the panel closes on the answer of the session
			this.isSendingOnRelease = true;
			this.session.stop();
		},
		// the gesture ended before there was anything to send, so it counts as a click on the
		// microphone and the recording goes on with nothing to hold
		isReleaseTooEarlyToSend(): boolean
		{
			// the browser is still asking for the microphone, and it takes as long as the user makes
			// it: the length of such a gesture says nothing about the length of the record
			if (this.recordingState !== RecordingState.recording)
			{
				return true;
			}

			// one check of the threshold covers both cases, a short click of the microphone and a hold
			// that recorded too little, and it is the same one the actions of the panel are held by
			return this.isTooShortToKeep;
		},
		onPointerCancel()
		{
			if (this.isRecordingOver)
			{
				this.stopWaitingForRelease();

				return;
			}

			// an interrupted gesture is not a release: nothing was recorded on purpose, nothing is sent
			this.session.cancel();
		},
		// the pointer of the hold stays captured by the button it went down on, so the trash button gets
		// no enter event of its own: its coordinates are what answers where the pointer is
		onPointerMove(event: PointerEvent)
		{
			if (event.buttons === 0)
			{
				return;
			}

			// the panel takes the place of the field only once the field is hidden, which happens after
			// this panel is mounted: the first move is the earliest moment the box is worth reading,
			// and it is read there once and not on every move that follows
			if (!this.cancelBounds)
			{
				this.readGestureBounds();
			}

			this.isCancelArmed = this.isPointerOverCancel(event);
			this.isLockArmed = this.isPointerOverLock(event);
		},
		readGestureBounds()
		{
			this.readCancelBounds();
			this.$refs.lock?.readBounds();
		},
		// the box lights the button up on the way to it; what the release does is decided by a box of
		// its own, so a cache the panel outgrew costs a highlight and never a record
		readCancelBounds()
		{
			this.cancelBounds = this.$refs.cancel?.getBoundingClientRect() ?? null;
		},
		isPointerOverCancel(event: PointerEvent): boolean
		{
			if (!this.cancelBounds)
			{
				return false;
			}

			const { top, right, bottom, left } = this.cancelBounds;

			return event.clientX >= left && event.clientX <= right
				&& event.clientY >= top && event.clientY <= bottom;
		},
		isPointerOverLock(event: PointerEvent): boolean
		{
			return this.$refs.lock?.containsPointer(event) ?? false;
		},
		onLock()
		{
			if (this.isLocked)
			{
				return;
			}

			// the recording is no longer tied to the gesture, so the release stops meaning anything
			this.stopWaitingForRelease();

			// the indicator leaves with the hold: focus that reached it moves to the panel and not nowhere
			const keepsFocus = this.$el.contains(document.activeElement);
			this.isLocked = true;

			if (keepsFocus)
			{
				void this.$nextTick(() => this.$el.focus());
			}
		},
		pauseRecording()
		{
			this.session.pause();
		},
		resumeRecording()
		{
			this.session.resume();
		},
		// the guard and not the `disabled` attribute: a refused action stays reachable to name its own
		// reason, and a screen reader announces nothing about a disabled button
		stopRecording()
		{
			// the name and the state of the button under the focus are not read again when they change,
			// so a refusal is named at the press itself
			if (this.isTooShortToKeep)
			{
				this.announce(this.tooShortText);

				return;
			}

			this.session.stop();
		},
		// the trash button of the panel and the Esc of the composer, which reaches this very method
		cancelRecording()
		{
			// assertive: the cancel makes every announcement about the recording still waiting in the
			// queue untrue, and an urgent one both drops what is being read and goes first
			this.announce(this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_CANCELLED'), 'assertive');

			// a panel opened on a record that came back has no session to end, so it asks for the way out
			if (!this.session)
			{
				this.$emit('close');

				return;
			}

			this.session.cancel();
		},
		sendRecord()
		{
			if (this.isTooShortToKeep)
			{
				this.announce(this.tooShortText);

				return;
			}

			this.handOverRecord(this.record);
		},
		handOverRecord(record: VoiceRecord)
		{
			this.$emit('recorded', record);
			this.$emit('close');
			// counted last: nothing about analytics stands between the record and the chat
			this.countRecord(record);
		},
		// the record of its own session is the only one this panel counts, and counting takes it: a
		// record that came back from a failed send was counted by the panel that recorded it
		countRecord(record: VoiceRecord)
		{
			// the panel keeps its record in the reactive state: identity is compared behind that view
			if (toRaw(record) !== this.recordOfOwnSession)
			{
				return;
			}

			this.recordOfOwnSession = null;

			Analytics.getInstance().voiceRecorder.onRecordSent({
				dialogId: this.dialogId,
				durationSeconds: record.durationSeconds,
				isLocked: this.isLocked,
			});
		},
		hasFocusFallenToPage(): boolean
		{
			const { activeElement, body } = document;

			return !activeElement || activeElement === body;
		},
		hasFocusOnCoveredField(): boolean
		{
			return this.hasFocusFallenToPage()
				|| Boolean(this.$el.parentElement?.contains(document.activeElement));
		},
		takeInitialFocus()
		{
			// a start with no pointer has no hold to release: focus goes on to the action that ends
			// the recording. A start from the pointer leaves focus on the panel instead - the user is
			// working with the pointer, and the stop button must not come under their hand. A panel
			// rendered without that button takes the focus the way every other path does
			if (this.isStartWithoutPointer && this.$refs.stop)
			{
				this.$refs.stop.focus();

				return;
			}

			this.takeFocusFromCoveredField();
		},
		// the field is merely hidden, so focus left on it would strand the user off the screen; focus
		// the user put anywhere else is left alone. The root of the panel takes no action of its own,
		// so a space bar meant for the text of the field sends nothing from here
		takeFocusFromCoveredField()
		{
			if (this.hasFocusOnCoveredField())
			{
				this.$el.focus();
			}
		},
		stopWaitingForRelease()
		{
			Event.unbind(document, 'pointerup', this.onPointerUp);
			Event.unbind(document, 'pointercancel', this.onPointerCancel);
			Event.unbind(document, 'pointermove', this.onPointerMove);
			Event.unbind(window, 'resize', this.readGestureBounds);
			this.isCancelArmed = false;
			this.isLockArmed = false;
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div
			:aria-label="panelLabel"
			class="bx-im-voice-recording-panel"
			data-testid="im-textarea-recording-panel"
			role="group"
			tabindex="-1"
		>
			<AccessState v-if="hasAccessError" :code="errorCode" @close="$emit('close')" />
			<template v-else>
				<div class="bx-im-voice-recording-panel__main">
					<RecordingPreview
						v-if="hasRecord"
						:blob="record.blob"
						:durationSeconds="record.durationSeconds"
					/>
					<div
						v-else
						class="bx-im-voice-recording-panel__status"
						data-testid="im-textarea-recording-status"
					>
						<!-- the recording mark has no design system component of its own -->
						<div
							:class="{ '--paused': isPaused }"
							class="bx-im-voice-recording-panel__dot"
						></div>
						<TextMd
							:class="{ '--warning': isLimitApproaching }"
							class="bx-im-voice-recording-panel__timer"
							data-testid="im-textarea-recording-timer"
						>{{ duration }}</TextMd>
						<!-- both states are spelled out: a mark that differs only in colour is read by nobody -->
						<TextSm
							v-if="isPaused"
							class="bx-im-voice-recording-panel__state"
							data-testid="im-textarea-recording-state"
						>{{ pausedLabel }}</TextSm>
						<TextSm
							v-if="isLimitApproaching"
							class="bx-im-voice-recording-panel__limit"
							data-testid="im-textarea-recording-limit"
						>{{ limitLeftText }}</TextSm>
					</div>
					<LockIndicator
						v-if="isHoldGesture"
						:isArmed="isLockArmed"
						ref="lock"
						@lock="onLock"
					/>
				</div>
				<TextSm
					v-if="hasSendFailure"
					class="bx-im-voice-recording-panel__failure"
					data-testid="im-textarea-recording-send-failure"
				>{{ sendFailureText }}</TextSm>
				<div class="bx-im-voice-recording-panel__actions">
					<button
						:title="cancelHint"
						:aria-label="cancelHint"
						:class="{ '--armed': isCancelArmed }"
						ref="cancel"
						class="bx-im-voice-recording-panel__cancel"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-cancel"
						@click="cancelRecording"
					>
						<BIcon :name="OutlineIcons.TRASHCAN" :size="ACTION_ICON_SIZE" />
					</button>
					<!-- a locked recording has no hold left to release: the hint would name a gesture that is over -->
					<TextSm
						v-if="isHoldGesture"
						class="bx-im-voice-recording-panel__hint"
						data-testid="im-textarea-recording-hint"
					>{{ releaseHint }}</TextSm>
					<!-- pause and resume share one place: the button under the pointer must not move on every press -->
					<button
						v-if="isLockedRecording"
						:title="pauseHint"
						:aria-label="pauseHint"
						class="bx-im-voice-recording-panel__action"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-pause"
						@click="pauseRecording"
					>
						<BIcon :name="OutlineIcons.PAUSE_M" :size="ACTION_ICON_SIZE" />
					</button>
					<button
						v-else-if="isPaused"
						:title="resumeHint"
						:aria-label="resumeHint"
						class="bx-im-voice-recording-panel__action"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-resume"
						@click="resumeRecording"
					>
						<BIcon :name="OutlineIcons.RECORD_ON" :size="ACTION_ICON_SIZE" />
					</button>
					<!-- the place of the microphone holds the main action through all states of the panel -->
					<VoiceRecorderButton v-if="isHoldGesture" isRecording />
					<!-- aria-disabled and not disabled: a refused action stays reachable and names its
						 reason through the title and the label, and a screen reader announces nothing
						 about a disabled button -->
					<button
						v-else-if="hasRecord"
						:title="sendHint"
						:aria-label="sendHint"
						:aria-disabled="isTooShortToKeep ? 'true' : undefined"
						:class="{ '--disabled': isTooShortToKeep }"
						ref="send"
						class="bx-im-voice-round-button"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-send"
						@click="sendRecord"
					>
						<BIcon :name="OutlineIcons.SEND" :size="MAIN_ACTION_ICON_SIZE" />
					</button>
					<button
						v-else
						:title="stopHint"
						:aria-label="stopHint"
						:aria-disabled="isTooShortToKeep ? 'true' : undefined"
						:class="{ '--disabled': isTooShortToKeep }"
						ref="stop"
						class="bx-im-voice-round-button"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-stop"
						@click="stopRecording"
					>
						<BIcon :name="OutlineIcons.STOP_M" :size="MAIN_ACTION_ICON_SIZE" />
					</button>
				</div>
			</template>
		</div>
	`,
};
