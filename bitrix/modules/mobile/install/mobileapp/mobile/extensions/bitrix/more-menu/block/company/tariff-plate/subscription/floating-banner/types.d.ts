import { SubscriptionData } from '../../types';

export type SubscriptionFloatingBannerProps = {
	testId: string,
	layout: LayoutWidget,
	subscription: SubscriptionData,
	onCollapseStarted?: (params: { duration: number }) => void,
};
