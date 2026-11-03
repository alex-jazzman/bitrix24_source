import { PageManager } from '../../../../../../../dev/janative/api';

export type DemoActivationDescriptionOptions = {
	testId?: string,
	/**
	 * Drawn as given: the caller composes the verdict itself, ANDing its own flag with
	 * `isPurchaseAllowed(isCtaForced)` of `utils/store`. The drawer asks no rule of its own.
	 */
	showPurchaseCta?: boolean,
};

export type DemoActivationDescriptionProps = DemoActivationDescriptionOptions & {
	layout: PageManager,
	parentWidget: PageManager,
};

export type DemoActivationDescriptionState = {
	isActivating: boolean,
};
