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
	/** The show did not happen for a reason that passes by itself: the request is postponed, the promo is not read. */
	postponed?: boolean,
}

/** Rect the native side measured for the spotlight target; empty when the target is off screen. */
export type MeasuredTargetRect = {
	x?: number,
	y?: number,
	width?: number,
	height?: number,
	/** Edge of the popup the ear stands on: 'top' when the popup lies under the target, and by default. */
	position?: 'top' | 'bottom',
}

export type OnboardingHintStep = {
	title: string,
	description: string,
	buttonText: string,
	imageUrl: string,
	/** The element the ear points at while the step is on the screen; the target of the show by default. */
	targetRef?: string,
	/** Asked before the target is measured: the step brings its own target within reach, and only then
	 *  is it measured. Never throws - a target it could not bring in stays unpointed at. */
	revealTarget?: () => Promise<void>,
}

export type OnboardingHintProps = {
	testId: string,
	/** The target of the first step; a step carrying a `targetRef` of its own moves the ear onto it. */
	targetRef: string,
	steps: OnboardingHintStep[],
	/** Waited out before the target is measured: the target may still be on its way to the screen. */
	delay?: number,
	/** Asked right before the show, so a hint whose target left the model is declined. The answer is
	 *  awaited, so the check may be asynchronous. */
	canShow?: () => boolean | Promise<boolean>,
	/** Tap on the action button of the given step. */
	onAction?: (step: number) => void,
	onClose?: () => void,
	onHide?: () => void,
	/** The hint did not reach the screen: without an argument when it was declined, with an Error when
	 *  canShow threw or rejected, the spotlight could not be created, measuring the target failed, the
	 *  show itself threw or the popup never got measured on the screen - the hint then takes the
	 *  spotlight down itself. A hint hidden while canShow was answering reports nothing. */
	onShowSkipped?: (error?: Error) => void,
}

export type OnboardingHintViewProps = {
	testId: string,
	steps: OnboardingHintStep[],
	targetRect: MeasuredTargetRect,
	onAction: (step: number) => void,
	onClose: () => void,
	/** The popup got no position in the window by the last retry after its layout and stays transparent. */
	onMeasureFailed?: () => void,
}

export type OnboardingHintViewState = {
	step: number,
	/** Absolute x of the popup, known only after the layout: the ear is offset against it. */
	popupX: number | null,
	/** Offset of the bubble inside the popup, known only after the layout: the shadow moves it off the edge. */
	bubbleTop: number | null,
	/** Height of the bubble, known only after the layout: an ear at the bottom hangs from its lower edge. */
	bubbleHeight: number | null,
	/** The target the ear points at; its position names the edge of the popup the ear stands on. */
	targetRect: MeasuredTargetRect,
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
