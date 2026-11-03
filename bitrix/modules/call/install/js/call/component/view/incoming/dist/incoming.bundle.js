/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_designTokens, ui_vue3, call_asset_css_designTokens, call_component_ui_avatar, call_component_ui_button, call_component_ui_icon, call_store) {
	'use strict';

	const ANNOUNCEMENT_LIFETIME = 2000;
	const CallIncoming = ui_vue3.defineComponent({
		name: 'CallIncoming',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon,
			CallAvatar: call_component_ui_avatar.CallAvatar
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		emits: ['button-click'],
		setup() {
			const callIncomingStore = call_store.useCallIncomingStore();
			const instanceUid = ui_vue3.getCurrentInstance()?.uid ?? 0;
			return {
				callIncomingStore,
				instanceUid
			};
		},
		data() {
			return {
				localMicrophoneState: true,
				localCameraState: true,
				announcementPhraseCode: '',
				announcementTimerId: null
			};
		},
		computed: {
			isDesktop() {
				return this.callIncomingStore.isDesktop;
			},
			isRegularCall() {
				return this.callIncomingStore.callType === 'regular';
			},
			cameraDisabled() {
				return !this.callIncomingStore.hasCamera;
			},
			answerPhraseCode() {
				return this.isRegularCall ? 'CALL_INCOMING_ANSWER_ARIA' : 'CALL_CONFERENCE_ANSWER_ARIA';
			},
			declinePhraseCode() {
				return this.isRegularCall ? 'CALL_INCOMING_DECLINE_ARIA' : 'CALL_CONFERENCE_SKIP_ARIA';
			},
			cameraUnavailableId() {
				return `call-incoming-camera-unavailable-${this.instanceUid}`;
			},
			callerName() {
				return this.callIncomingStore.callerName;
			},
			callerAvatar() {
				return this.callIncomingStore.callerAvatar;
			},
			callerType() {
				return this.callIncomingStore.callerType;
			},
			callerColor() {
				return this.callIncomingStore.callerColor;
			}
		},
		watch: {
			'callIncomingStore.hasCamera': {
				handler(newValue) {
					if (newValue) {
						return;
					}
					this.localCameraState = false;
					this.announceCameraLoss();
				}
			}
		},
		created() {
			this.localMicrophoneState = this.callIncomingStore.initialMicrophoneState;
			this.localCameraState = this.callIncomingStore.initialCameraState;
		},
		beforeUnmount() {
			this.stopAnnouncementTimer();
		},
		methods: {
			handleAnswerClick() {
				if (this.isRegularCall) {
					this.$emit('button-click', {
						button: 'answer',
						mediaParams: {
							audio: this.localMicrophoneState,
							video: this.localCameraState
						}
					});
				} else {
					this.$emit('button-click', {
						button: 'answerConference'
					});
				}
			},
			handleDeclineClick() {
				if (this.isRegularCall) {
					this.$emit('button-click', {
						button: 'decline'
					});
				} else {
					this.$emit('button-click', {
						button: 'skipConference'
					});
				}
			},
			handleMicrophoneToggle() {
				this.localMicrophoneState = !this.localMicrophoneState;
			},
			handleCameraToggle() {
				if (this.cameraDisabled) {
					return;
				}
				this.localCameraState = !this.localCameraState;
			},
			announceCameraLoss() {
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
			stopAnnouncementTimer() {
				if (this.announcementTimerId === null) {
					return;
				}
				clearTimeout(this.announcementTimerId);
				this.announcementTimerId = null;
			}
		},
		template: `
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
	`
	});

	exports.CallIncoming = CallIncoming;

})(this.BX.Call.Component.View = this.BX.Call.Component.View || {}, window, BX.Vue3, window, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Store);
//# sourceMappingURL=incoming.bundle.js.map
