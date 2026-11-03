import { defineStore } from 'ui.vue3.pinia';

import type { CallActionBridge } from './media-store';

export type RecordState = 'Inactive' | 'Recording' | 'Paused' | 'Destroyed';
export type RecordType = 'video' | 'audio' | null;

type RecordingStoreState = {
	state: RecordState;
	type: RecordType;
	initiatorId: number | null;
	startedAt: number | null;
	_bridge: CallActionBridge | null;
};

export const useRecordingStore = defineStore('callRecording', {
	state: (): RecordingStoreState => ({
		state: 'Inactive',
		type: null,
		initiatorId: null,
		startedAt: null,
		_bridge: null,
	}),

	getters: {
		isActive: (state): boolean => state.state !== 'Inactive' && state.state !== 'Destroyed',
		isPaused: (state): boolean => state.state === 'Paused',
		duration(state): number
		{
			return state.startedAt === null ? 0 : Date.now() - state.startedAt;
		},
	},

	actions: {
		setState(fields: { state?: RecordState; type?: RecordType; initiatorId?: number | null }): void
		{
			if (fields.state !== undefined) this.state = fields.state;
			if (fields.type !== undefined) this.type = fields.type;
			if (fields.initiatorId !== undefined) this.initiatorId = fields.initiatorId;
		},

		setStartedAt(timestamp: number | null): void
		{
			this.startedAt = timestamp;
		},

		attachBridge(bridge: CallActionBridge): void { this._bridge = bridge; },
		detachBridge(): void { this._bridge = null; },

		menuAction(state: 'started' | 'stopped' | 'paused' | 'resumed' | 'destroyed', kind: 'audio' | 'video' | 'none'): void
		{
			this._bridge?.emit('onCommonRecordMenu', { state, kind });
		},
	},
});

export type RecordingStoreInstance = ReturnType<typeof useRecordingStore>;
