export interface showSpotlightOptions {
	setComponent?: {
		component: object,
		params?: object,
	},
	setHint?: {
		text: string,
	},
	setTarget?: {
		target: string | object,
		params?: object,
	},
	setHandler?: () => any,
}

export type PromotionCallbackData = {
	read?: boolean,
	promoId?: string,
}

export interface PromotionTriggerOptions {
	triggerType: string;
	eventName: string | MessengerStoreMutation;
	promoId: string;
	condition?: (payload?: any) => boolean;
	action: (payload?: any) => void;
}

export interface PromotionTrigger {
	type: string;
	eventName: string | MessengerStoreMutation;
	promoId: string;
	action: (payload?: any) => void;
	unsubscriber: () => void;
}
