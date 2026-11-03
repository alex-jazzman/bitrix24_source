import { defineStore } from 'ui.vue3.pinia';
import { SHARED_TOAST_TYPES } from '../constants';
import type { ToastMessage, ToastType } from '../types';

type ToastState = {
	toastQueue: Array<ToastMessage>
};

export const useToastStore = defineStore('bizprocdesigner-toast-store', {
	state: (): ToastState => ({
		toastQueue: [],
	}),
	getters: {
		isEmpty: (state: ToastState): boolean => {
			return state.toastQueue.length === 0;
		},
		current: (state: ToastState): ToastMessage | null => {
			return state.toastQueue.length > 0 ? state.toastQueue[0] : null;
		},
	},
	actions: {
		addToQueue(message: ToastMessage): void
		{
			this.toastQueue.push(message);
		},
		dequeue(): void
		{
			this.toastQueue.shift();
		},
		clearAllOfType(type: ToastType): void
		{
			this.toastQueue = this.toastQueue.filter((toast) => toast.type !== type);
		},
		clearByTag(tag: string): void
		{
			this.toastQueue = this.toastQueue.filter((toast) => toast.tag !== tag);
		},
		addWarning(message: string, tag: ?string = null): void
		{
			this.addToQueue({
				message,
				type: SHARED_TOAST_TYPES.WARNING,
				...(tag === null ? {} : { tag }),
			});
		},
		addCustom(message: string, type: ToastType, extra: $Shape<ToastMessage> = {}): void
		{
			this.addToQueue({
				...extra,
				message,
				type,
			});
		},
	},
});
