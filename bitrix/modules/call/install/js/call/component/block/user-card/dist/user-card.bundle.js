/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_store, call_component_ui_avatar, call_component_ui_icon, call_component_ui_signal, call_component_ui_video) {
	'use strict';

	const CallUserCard = ui_vue3.defineComponent({
		name: 'CallUserCard',
		components: {
			CallAvatar: call_component_ui_avatar.CallAvatar,
			CallIcon: call_component_ui_icon.CallIcon,
			CallSignal: call_component_ui_signal.CallSignal,
			CallVideo: call_component_ui_video.CallVideo
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		props: {
			userId: {
				type: Number,
				required: true
			},
			active: {
				type: Boolean,
				default: false
			},
			pinned: {
				type: Boolean,
				default: false
			},
			pip: {
				type: Boolean,
				default: false
			}
		},
		emits: ['select'],
		setup() {
			return {
				usersStore: call_store.useUsersStore()
			};
		},
		computed: {
			user() {
				return this.usersStore.userById(this.userId);
			},
			isSelf() {
				return this.usersStore.isCurrentUser(this.userId);
			},
			displayName() {
				return this.user?.name || this.loc('CALL_USER_CARD_NO_NAME');
			},
			avatar() {
				return this.user?.avatar || null;
			},
			isMuted() {
				return !(this.user?.microphoneState ?? true);
			},
			isCameraOn() {
				return this.user?.cameraState ?? false;
			},
			isReconnecting() {
				return this.user?.state === 'Reconnecting';
			},
			isVideoStopped() {
				return this.user?.videoPaused ?? false;
			},
			isSpeaking() {
				return !this.isSelf && (this.user?.talking ?? false);
			},
			handRequest() {
				return !this.isSelf && (this.user?.floorRequestState ?? false);
			},
			dataLoss() {
				return this.user?.connectionQuality ?? 100;
			},
			stream() {
				return this.usersStore.streamForUser(this.userId);
			},
			mirrored() {
				return this.usersStore.mirrorFor(this.userId);
			},
			isSpeakingActive() {
				return this.isSpeaking && !this.isMuted && !this.isReconnecting;
			},
			hasVideo() {
				return !this.isReconnecting && !this.isVideoStopped && this.isCameraOn && this.stream !== null;
			},
			status() {
				if (this.isVideoStopped) {
					return this.loc('CALL_USER_CARD_STATUS_VIDEO_STOPPED');
				}
				if (this.isReconnecting) {
					return this.loc('CALL_USER_CARD_STATUS_RECONNECTING');
				}
				return null;
			},
			cardClasses() {
				return {
					'--speaking': this.isSpeakingActive,
					'--active': this.active,
					'--pinned': this.pinned,
					'--pip': this.pip,
					'--self': this.isSelf
				};
			}
		},
		methods: {
			handleSelect() {
				this.$emit('select', this.userId);
			}
		},
		template: `
		<div class="call-user-card" :class="cardClasses" @click="handleSelect">
			<div class="call-user-card__top">
				<CallSignal v-if="!isSelf" :dataLoss="dataLoss" class="call-user-card__signal" />
			</div>

			<div v-if="active" class="call-user-card__bottom">
				<span class="call-user-card__name">{{ displayName }}</span>
				<div class="call-user-card__devices">
					<CallIcon v-if="isMuted" icon="microphone-off" color="red" :size="20" />
					<CallIcon v-if="!isCameraOn" icon="video-slash" color="red" :size="20" />
				</div>
			</div>

			<div v-if="handRequest" class="call-user-card__hand">
				<CallIcon icon="hand-solid" :size="20" />
			</div>

			<div class="call-user-card__content">
				<CallVideo
					v-if="hasVideo"
					:test-id="'call-user-card-video-' + userId"
					:srcObject="stream"
					:mirrored="mirrored"
					class="call-user-card__video"
				/>
				<div v-else class="call-user-card__avatar">
					<CallAvatar :label="displayName" :speaker="isSpeakingActive" :image="avatar" />
					<div v-if="status" class="call-user-card__status">{{ status }}</div>
				</div>
			</div>
		</div>
	`
	});

	const CallUserCardPlus = ui_vue3.defineComponent({
		name: 'CallUserCardPlus',
		components: {
			CallIcon: call_component_ui_icon.CallIcon
		},
		template: `
		<div class="call-user-card --plus">
			<div class="call-user-card__content">
				<CallIcon icon="plus" :size="26"></CallIcon>
			</div>
		</div>
	`
	});

	exports.CallUserCard = CallUserCard;
	exports.CallUserCardPlus = CallUserCardPlus;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Store, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui);
//# sourceMappingURL=user-card.bundle.js.map
