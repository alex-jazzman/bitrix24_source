/**
 * Payload of an incoming bridge event, already checked against the contract by parseIncoming().
 */
export type BridgeIncoming = {
	name: string,
	payload: object,
};

export type BaseTariffPlanWindowProps = {
	layout: LayoutWidget,
	url?: string,
	testId?: string,
};

export type BaseTariffPlanWindowState = {
	pageLoaded: boolean,
};

export type TariffPlanCheckoutProps = BaseTariffPlanWindowProps & {
	url: string,
	onOpenExternalUrl?: (url: string, presentation: ?string) => void,
};

export type TariffPlanCheckoutOptions = {
	product?: string | number,
	parentWidget?: LayoutWidget,
};
