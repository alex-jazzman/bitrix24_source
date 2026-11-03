import { defineStore } from 'ui.vue3.pinia';
import { MediaStreamRegistry } from 'call.lib.media-registry';

import { normalizeRenderer } from './internal/normalize-renderer';
import { useUsersStore } from './users-store';

export type CallActionBridge = {
	emit: (eventName: string, data: Record<string, unknown>) => void;
};

type MediaStoreState = {
	localStreamVersion: number;
	flipLocalVideo: boolean;
	hasLocalVideo: boolean;
	hasLocalAudio: boolean;
	microphoneDeviceId: string | null;
	cameraDeviceId: string | null;
	speakerDeviceId: string | null;
	isSpeakerMuted: boolean;
	connectionQuality: number;
	_bridge: CallActionBridge | null;
};

export const useMediaStore = defineStore('callMedia', {
	state: (): MediaStoreState => ({
		localStreamVersion: 0,
		flipLocalVideo: false,
		hasLocalVideo: false,
		hasLocalAudio: false,
		microphoneDeviceId: null,
		cameraDeviceId: null,
		speakerDeviceId: null,
		isSpeakerMuted: false,
		connectionQuality: 100,
		_bridge: null,
	}),

	getters: {
		localStream(state): MediaStream | null
		{
			// reactivity dep
			void state.localStreamVersion;

			return normalizeRenderer(MediaStreamRegistry.getLocalStream());
		},

		// Display-facts for self — single fact lives in usersStore.users[currentUserId].
		// These thin getters exist so media-buttons can stay on a single store.
		isMicrophoneMuted(): boolean
		{
			const me = useUsersStore().currentUser;

			return me ? !me.microphoneState : false;
		},

		isCameraOn(): boolean
		{
			return useUsersStore().currentUser?.cameraState ?? false;
		},

		isScreenSharingActive(): boolean
		{
			return useUsersStore().currentUser?.screenSharingState ?? false;
		},
	},

	actions: {
		setFlipLocalVideo(flip: boolean): void
		{
			this.flipLocalVideo = flip;
		},

		setLocalMediaMetadata(fields: { hasLocalVideo?: boolean; hasLocalAudio?: boolean }): void
		{
			if (fields.hasLocalVideo !== undefined)
			{
				this.hasLocalVideo = fields.hasLocalVideo;
			}

			if (fields.hasLocalAudio !== undefined)
			{
				this.hasLocalAudio = fields.hasLocalAudio;
			}
		},

		setDeviceIds(fields: { microphoneId?: string | null; cameraId?: string | null; speakerId?: string | null }): void
		{
			if (fields.microphoneId !== undefined)
			{
				this.microphoneDeviceId = fields.microphoneId;
			}

			if (fields.cameraId !== undefined)
			{
				this.cameraDeviceId = fields.cameraId;
			}

			if (fields.speakerId !== undefined)
			{
				this.speakerDeviceId = fields.speakerId;
			}
		},

		setSpeakerMuted(muted: boolean): void
		{
			this.isSpeakerMuted = muted;
		},

		setConnectionQuality(quality: number): void
		{
			this.connectionQuality = quality;
		},

		incrementLocalStreamVersion(): void
		{
			this.localStreamVersion += 1;
		},

		// region Bridge (transitional — emits to legacy controller via adapter)

		attachBridge(bridge: CallActionBridge): void
		{
			this._bridge = bridge;
		},

		detachBridge(): void
		{
			this._bridge = null;
		},

		// region Intent actions
		// Write display-fact for self via usersStore, then forward to controller via bridge.
		// After legacy view retires, bridge is replaced by direct engine/media calls.

		toggleMicrophone(): void
		{
			const usersStore = useUsersStore();
			const me = usersStore.currentUser;

			if (!me)
			{
				return;
			}

			const next = !me.microphoneState;

			usersStore.updateUser(me.id, { microphoneState: next });
			this._bridge?.emit('onButtonClick', { buttonName: 'microphone' });
		},

		toggleCamera(): void
		{
			const usersStore = useUsersStore();
			const me = usersStore.currentUser;

			if (!me)
			{
				return;
			}

			const next = !me.cameraState;

			usersStore.updateUser(me.id, { cameraState: next });
			this._bridge?.emit('onButtonClick', { buttonName: 'camera' });
		},

		toggleScreenSharing(): void
		{
			this._bridge?.emit('onButtonClick', { buttonName: 'screen' });
		},

		toggleRaiseHand(): void
		{
			this._bridge?.emit('onButtonClick', { buttonName: 'floorRequest' });
		},

		// endregion
	},
});

export type MediaStoreInstance = ReturnType<typeof useMediaStore>;
