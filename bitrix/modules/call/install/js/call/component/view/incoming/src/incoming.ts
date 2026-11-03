// @ts-ignore
import 'ui.design-tokens';
import { defineComponent, getCurrentInstance } from 'ui.vue3';

// @ts-ignore
import 'call.asset.css.design-tokens';
import { CallAvatar } from 'call.component.ui.avatar';
import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';
import { type LocFunction } from 'call.plugin.loc';
import { useCallIncomingStore, type CallIncomingStoreInstance } from 'call.store';

import './css/incoming.css';

// A live region is a channel of announcements and not a place the text lives in: it is filled, the
// reader takes what appeared, and it is emptied again. The reason of a lost camera also sits on the
// camera button, so a region holding it for good would give the reader the same phrase twice.
// The platform announcer keeps a message for 500 ms plus 30 ms per character (ui.a11y
// LiveAnnouncer), about 1.4 s for the longest translation of this one, and never longer than 4 s.
const ANNOUNCEMENT_LIFETIME = 2000;

type CallIncomingData = {
	localMicrophoneState: boolean;
	localCameraState: boolean;
	announcementPhraseCode: string;
	announcementTimerId: ReturnType<typeof setTimeout> | null;
};

export const CallIncoming = defineComponent({
	name: 'CallIncoming',
	components: {
		CallButton,
		CallIcon,
		CallAvatar,
	},
	inject: {
		loc: {
			default:
				(): LocFunction => (key: string): string => key,
		},
	},
	emits: ['button-click'],
	setup(): { callIncomingStore: CallIncomingStoreInstance; instanceUid: number }
	{
		const callIncomingStore = useCallIncomingStore();
		// the card lives inside the messenger page, so its node ids have to be unique per instance
		const instanceUid = getCurrentInstance()?.uid ?? 0;

		return { callIncomingStore, instanceUid };
	},
	data(): CallIncomingData
	{
		return {
			localMicrophoneState: true,
			localCameraState: true,
			announcementPhraseCode: '',
			announcementTimerId: null,
		};
	},
	computed: {
		isDesktop(): boolean
		{
			return this.callIncomingStore.isDesktop;
		},
		isRegularCall(): boolean
		{
			return this.callIncomingStore.callType === 'regular';
		},
		cameraDisabled(): boolean
		{
			return !this.callIncomingStore.hasCamera;
		},
		answerPhraseCode(): string
		{
			return this.isRegularCall ? 'CALL_INCOMING_ANSWER_ARIA' : 'CALL_CONFERENCE_ANSWER_ARIA';
		},
		declinePhraseCode(): string
		{
			return this.isRegularCall ? 'CALL_INCOMING_DECLINE_ARIA' : 'CALL_CONFERENCE_SKIP_ARIA';
		},
		cameraUnavailableId(): string
		{
			return `call-incoming-camera-unavailable-${this.instanceUid}`;
		},
		callerName(): string
		{
			return this.callIncomingStore.callerName;
		},
		callerAvatar(): string
		{
			return this.callIncomingStore.callerAvatar;
		},
		callerType(): string
		{
			return this.callIncomingStore.callerType;
		},
		callerColor(): string | null
		{
			return this.callIncomingStore.callerColor;
		},
	},
	watch: {
		'callIncomingStore.hasCamera': {
			handler(newValue: boolean): void
			{
				if (newValue)
				{
					return;
				}

				this.localCameraState = false;
				this.announceCameraLoss();
			},
		},
	},
	created(): void
	{
		this.localMicrophoneState = this.callIncomingStore.initialMicrophoneState;
		this.localCameraState = this.callIncomingStore.initialCameraState;
	},
	beforeUnmount(): void
	{
		this.stopAnnouncementTimer();
	},
	methods: {
		handleAnswerClick(): void
		{
			if (this.isRegularCall)
			{
				this.$emit('button-click', {
					button: 'answer',
					mediaParams: {
						audio: this.localMicrophoneState,
						video: this.localCameraState,
					},
				});
			}
			else
			{
				this.$emit('button-click', { button: 'answerConference' });
			}
		},

		handleDeclineClick(): void
		{
			if (this.isRegularCall)
			{
				this.$emit('button-click', { button: 'decline' });
			}
			else
			{
				this.$emit('button-click', { button: 'skipConference' });
			}
		},

		handleMicrophoneToggle(): void
		{
			this.localMicrophoneState = !this.localMicrophoneState;
		},

		handleCameraToggle(): void
		{
			if (this.cameraDisabled)
			{
				return;
			}

			this.localCameraState = !this.localCameraState;
		},

		// a reader speaks the change of the text, not the text itself: the node is emptied first and
		// filled a tick later, so a camera lost for the second time is announced again
		announceCameraLoss(): void
		{
			// an emptying awaiting the previous announcement would take this one away with it
			this.stopAnnouncementTimer();
			this.announcementPhraseCode = '';

			void this.$nextTick(() => {
				this.announcementPhraseCode = 'CALL_INCOMING_CAMERA_UNAVAILABLE_ARIA';
			});

			this.announcementTimerId = setTimeout(() => {
				this.announcementTimerId = null;
				this.announcementPhraseCode = '';
			}, ANNOUNCEMENT_LIFETIME);
		},

		stopAnnouncementTimer(): void
		{
			if (this.announcementTimerId === null)
			{
				return;
			}

			clearTimeout(this.announcementTimerId);
			this.announcementTimerId = null;
		},
	},
	template: /* HTML */ `
		<div
			data-testid="call-incoming"
			:data-test-meta="isDesktop ? 'desktop' : null"
			class="call-incoming"
			:class="{ '--desktop': isDesktop }"
			tabindex="-1"
		>
			<div class="call-incoming__subtitle" data-testid="call-incoming-subtitle">
				<CallIcon icon="video" :size="20"></CallIcon>
				<span>{{ loc('CALL_VIEW_INCOMING_SUBTITLE') }}</span>
			</div>
			<div class="call-incoming__title" data-testid="call-incoming-title">{{ callerName }}</div>
			<div class="call-incoming__center">
				<CallAvatar
					test-id="call-incoming-avatar"
					:label="callerName"
					:image="callerAvatar"
					:color="callerColor"
					:size="100"
					caller
					aria-hidden="true"
				/>
				<div v-if="isRegularCall" class="call-incoming__devices" data-testid="call-incoming-devices">
					<CallButton
						test-id="call-incoming-microphone-button"
						:test-state="localMicrophoneState ? 'active' : 'inactive'"
						color="none"
						:size="28"
						:label="loc('CALL_VIEW_INCOMING_MICROPHONE')"
						label-position="bottom-block"
						role="switch"
						:aria-checked="localMicrophoneState ? 'true' : 'false'"
						@click="handleMicrophoneToggle"
					>
						<CallIcon
							:icon="localMicrophoneState ? 'microphone' : 'microphone-off'"
							:color="localMicrophoneState ? 'gray' : 'red'"
							:size="26"
						/>
					</CallButton>
					<CallButton
						test-id="call-incoming-camera-button"
						:test-state="localCameraState ? 'active' : 'inactive'"
						color="none"
						:size="28"
						:label="loc('CALL_VIEW_INCOMING_CAMERA')"
						label-position="bottom-block"
						:disabled="cameraDisabled"
						role="switch"
						:aria-checked="localCameraState ? 'true' : 'false'"
						:aria-describedby="cameraDisabled ? cameraUnavailableId : null"
						@click="handleCameraToggle"
					>
						<CallIcon
							:icon="localCameraState ? 'video' : 'video-off'"
							:color="localCameraState ? 'gray' : 'red'"
							:size="26"
						/>
					</CallButton>
					<span
						v-if="cameraDisabled"
						:id="cameraUnavailableId"
						class="call-incoming__visually-hidden"
					>{{ loc('CALL_INCOMING_CAMERA_UNAVAILABLE_ARIA') }}</span>
				</div>
			</div>
			<div class="call-incoming__actions" data-testid="call-incoming-actions">
				<CallButton
					test-id="call-incoming-decline-button"
					:size="54"
					circle
					color="red"
					:aria-label="loc(declinePhraseCode)"
					@click="handleDeclineClick"
				>
					<CallIcon icon="cross" :size="40"></CallIcon>
				</CallButton>
				<CallButton
					test-id="call-incoming-answer-button"
					:size="54"
					circle
					color="green"
					:aria-label="loc(answerPhraseCode)"
					@click="handleAnswerClick"
				>
					<CallIcon icon="check" :size="40"></CallIcon>
				</CallButton>
			</div>
			<div
				data-testid="call-incoming-announcement"
				class="call-incoming__visually-hidden"
				aria-live="polite"
				aria-atomic="true"
			>{{ announcementPhraseCode ? loc(announcementPhraseCode) : '' }}</div>
		</div>
	`,
});
