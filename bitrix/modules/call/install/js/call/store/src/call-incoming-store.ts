import { defineStore } from 'ui.vue3.pinia';
import { Text, Type } from 'main.core';

// region Type definitions

export type IncomingCallType = 'regular' | 'conference';

export type IncomingCallParams = {
	callType?: string;
	callerName?: string;
	callerAvatar?: string;
	callerType?: string;
	callerColor?: string;
	video?: boolean;
	hasCamera?: boolean;
	microphoneState?: boolean;
	cameraState?: boolean;
	isDesktop?: boolean;
};

type CallIncomingStoreState = {
	callType: IncomingCallType;
	callerName: string;
	callerAvatar: string;
	callerType: string;
	callerColor: string | null;
	video: boolean;
	hasCamera: boolean;
	initialMicrophoneState: boolean;
	initialCameraState: boolean;
	isDesktop: boolean;
};

// endregion Type definitions

export const useCallIncomingStore = defineStore('call-incoming', {
	state: (): CallIncomingStoreState => ({
		callType: 'regular',
		callerName: '',
		callerAvatar: '',
		callerType: '',
		callerColor: null,
		video: false,
		hasCamera: false,
		initialMicrophoneState: true,
		initialCameraState: false,
		isDesktop: false,
	}),

	actions: {
		initFromParams(params: IncomingCallParams): void
		{
			if (params.callType === 'regular' || params.callType === 'conference')
			{
				this.callType = params.callType;
			}

			if (Type.isString(params.callerName))
			{
				// backend sends the entity name HTML-encoded, Vue escapes it again on render
				this.callerName = Text.decode(params.callerName);
			}

			if (Type.isString(params.callerAvatar))
			{
				this.callerAvatar = params.callerAvatar;
			}
			else
			{
				this.callerAvatar = '';
			}

			if (Type.isString(params.callerType))
			{
				this.callerType = params.callerType;
			}
			else
			{
				this.callerType = '';
			}

			if (Type.isStringFilled(params.callerColor))
			{
				this.callerColor = params.callerColor as string;
			}

			this.video = Boolean(params.video);
			this.hasCamera = Boolean(params.hasCamera);
			this.initialMicrophoneState = Boolean(params.microphoneState ?? true);
			this.initialCameraState = Boolean(params.cameraState ?? false);
			this.isDesktop = Boolean(params.isDesktop);
		},

		setHasCamera(value: boolean): void
		{
			if (this.callType !== 'regular')
			{
				return;
			}

			this.hasCamera = Boolean(value);
		},
	},
});

export type CallIncomingStoreInstance = ReturnType<typeof useCallIncomingStore>;
