import { Type, Loc } from 'main.core';
import { MediaStreamRegistry } from 'call.lib.media-registry';
import { useCallStore } from 'call.store';

// @vue/component
export const UserTile = {
	name: 'call-user-tile',
	props: {
		userId: {
			type: Number,
			required: true,
		},
		isLocal: {
			type: Boolean,
			default: false,
		},
		localStreamVersion: {
			type: Number,
			default: 0,
		},
	},
	setup()
	{
		const callStore = useCallStore();

		return { callStore };
	},
	computed: {
		user()
		{
			return this.callStore.users[this.userId] || null;
		},
		userName()
		{
			return this.user?.name || '';
		},
		userAvatar()
		{
			return this.user?.avatar || '';
		},
		isTalking()
		{
			return this.user?.talking || false;
		},
		isMuted()
		{
			if (this.isLocal)
			{
				return this.callStore.isMicrophoneMuted;
			}

			return !(this.user?.microphoneState ?? true);
		},
		isCameraOn()
		{
			if (this.isLocal)
			{
				return this.callStore.hasLocalVideo;
			}

			return this.user?.cameraState || false;
		},
		isScreenSharing()
		{
			return this.user?.screenState || false;
		},
		hasFloorRequest()
		{
			return this.user?.floorRequestState || false;
		},
		streamVersion()
		{
			return this.user?.streamVersion || 0;
		},
		isPinned()
		{
			return this.callStore.pinnedUserId === this.userId;
		},
		shouldFlipVideo()
		{
			return this.isLocal && this.callStore.flipLocalVideo;
		},
		mutedText()
		{
			return Loc.getMessage('CALL_VUE_USER_MUTED');
		},
		screenShareText()
		{
			return Loc.getMessage('CALL_VUE_USER_SHARING_SCREEN');
		},
		floorRequestText()
		{
			return Loc.getMessage('CALL_VUE_USER_RAISED_HAND');
		},
	},
	watch: {
		streamVersion()
		{
			this.$nextTick(() => this.attachStream());
		},
		localStreamVersion()
		{
			if (this.isLocal)
			{
				this.$nextTick(() => this.attachStream());
			}
		},
		isCameraOn(newVal)
		{
			if (newVal)
			{
				this.$nextTick(() => this.attachStream());
			}
		},
	},
	mounted()
	{
		this.$nextTick(() => this.attachStream());
	},
	beforeUnmount()
	{
		if (this.$refs.video)
		{
			this.$refs.video.srcObject = null;
		}
	},
	methods: {
		attachStream()
		{
			if (!this.$refs.video)
			{
				return;
			}

			const renderer = this.isLocal
				? MediaStreamRegistry.getLocalStream()
				: MediaStreamRegistry.getRenderer(this.userId);

			if (renderer === null || renderer === undefined)
			{
				this.$refs.video.srcObject = null;

				return;
			}

			// MediaStream has getTracks — use it as duck-type check
			if (Type.isFunction(renderer.getTracks))
			{
				this.$refs.video.srcObject = renderer;

				return;
			}

			if (Type.isFunction(renderer.attach))
			{
				renderer.attach(this.$refs.video);

				return;
			}

			// MediaRenderer wrapping a stream object
			if (renderer.stream && Type.isFunction(renderer.stream.getTracks))
			{
				this.$refs.video.srcObject = renderer.stream;
			}
		},
	},
	template: /* HTML */`
		<div class="call-user-tile" :class="{ '--talking': isTalking, '--pinned': isPinned }">
			<video
				ref="video"
				class="call-user-tile__video"
				autoplay
				playsinline
				muted
				:class="{ '--hidden': !isCameraOn, '--mirror': shouldFlipVideo }"
			></video>
			<div class="call-user-tile__avatar" :class="{ '--hidden': isCameraOn }">
				<img
					v-if="userAvatar"
					:src="userAvatar"
					:alt="userName"
					:title="userName"
					class="call-user-tile__avatar_image"
				/>
				<span v-else class="call-user-tile__avatar_initials">{{ userName[0] || '?' }}</span>
			</div>
			<div class="call-user-tile__info">
				<span class="call-user-tile__name">{{ userName }}</span>
				<span v-if="isMuted" class="call-user-tile__mute-icon">{{ mutedText }}</span>
			</div>
			<div v-if="isScreenSharing" class="call-user-tile__screen-share-badge">{{ screenShareText }}</div>
			<div v-if="hasFloorRequest" class="call-user-tile__floor-request">{{ floorRequestText }}</div>
		</div>
	`,
};
