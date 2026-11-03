import { defineComponent } from 'ui.vue3';

import { useUsersStore } from 'call.store';
import type { User, UsersStoreInstance } from 'call.store';
import { CallAvatar } from 'call.component.ui.avatar';
import { CallIcon } from 'call.component.ui.icon';
import { CallSignal } from 'call.component.ui.signal';
import { CallVideo } from 'call.component.ui.video';

import type { LocFunction } from 'call.plugin.loc';

import './css/user-card.css';

// @vue/component
export const CallUserCard = defineComponent({
	name: 'CallUserCard',

	components: {
		CallAvatar,
		CallIcon,
		CallSignal,
		CallVideo,
	},

	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},

	props: {
		userId: {
			type: Number,
			required: true,
		},
		active: {
			type: Boolean,
			default: false,
		},
		pinned: {
			type: Boolean,
			default: false,
		},
		pip: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['select'],

	setup(): { usersStore: UsersStoreInstance }
	{
		return {
			usersStore: useUsersStore(),
		};
	},

	computed: {
		user(): User | null
		{
			return this.usersStore.userById(this.userId);
		},

		isSelf(): boolean
		{
			return this.usersStore.isCurrentUser(this.userId);
		},

		displayName(): string
		{
			return this.user?.name || (this.loc as LocFunction)('CALL_USER_CARD_NO_NAME');
		},

		avatar(): string | null
		{
			return this.user?.avatar || null;
		},

		isMuted(): boolean
		{
			return !(this.user?.microphoneState ?? true);
		},

		isCameraOn(): boolean
		{
			return this.user?.cameraState ?? false;
		},

		isReconnecting(): boolean
		{
			return this.user?.state === 'Reconnecting';
		},

		isVideoStopped(): boolean
		{
			return this.user?.videoPaused ?? false;
		},

		isSpeaking(): boolean
		{
			return !this.isSelf && (this.user?.talking ?? false);
		},

		handRequest(): boolean
		{
			return !this.isSelf && (this.user?.floorRequestState ?? false);
		},

		dataLoss(): number
		{
			return this.user?.connectionQuality ?? 100;
		},

		stream(): MediaStream | null
		{
			return this.usersStore.streamForUser(this.userId);
		},

		mirrored(): boolean
		{
			return this.usersStore.mirrorFor(this.userId);
		},

		isSpeakingActive(): boolean
		{
			return this.isSpeaking && !this.isMuted && !this.isReconnecting;
		},

		hasVideo(): boolean
		{
			return !this.isReconnecting
				&& !this.isVideoStopped
				&& this.isCameraOn
				&& this.stream !== null;
		},

		status(): string | null
		{
			if (this.isVideoStopped)
			{
				return (this.loc as LocFunction)('CALL_USER_CARD_STATUS_VIDEO_STOPPED');
			}

			if (this.isReconnecting)
			{
				return (this.loc as LocFunction)('CALL_USER_CARD_STATUS_RECONNECTING');
			}

			return null;
		},

		cardClasses(): Record<string, boolean>
		{
			return {
				'--speaking': this.isSpeakingActive,
				'--active': this.active,
				'--pinned': this.pinned,
				'--pip': this.pip,
				'--self': this.isSelf,
			};
		},
	},

	methods: {
		handleSelect(): void
		{
			this.$emit('select', this.userId);
		},
	},

	template: /* HTML */`
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
	`,
});
