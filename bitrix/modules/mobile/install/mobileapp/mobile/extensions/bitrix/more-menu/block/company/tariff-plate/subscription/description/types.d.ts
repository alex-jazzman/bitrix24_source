import { SubscriptionData } from '../../types';

export type SubscriptionDescriptionOptions = {
	subscription?: SubscriptionData,
	testId?: string,
};

export type SubscriptionDescriptionProps = SubscriptionDescriptionOptions & {
	layout: LayoutWidget,
	parentWidget: LayoutWidget,
};

export type SubscriptionDescriptionState = {
	isActivating: boolean,
};
