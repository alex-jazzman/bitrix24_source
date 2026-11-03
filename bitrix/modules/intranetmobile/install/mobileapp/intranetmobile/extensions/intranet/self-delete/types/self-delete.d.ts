/**
 * Shared types for the intranet/self-delete extension.
 */

/**
 * Payload returned by intranet.v2.SelfDelete.getOptionsForCurrentUser.
 */
export type SelfDeleteOptions = {
	scenario: string;
	adminIds: number[];
	supportEmail: string;
	transferRightsHelpdeskCode: number;
	portalDeleteUrl: string;
};

/**
 * Props for the self-delete screens (base BaseScreen and its subclasses).
 */
export type BaseScreenProps = {
	data: SelfDeleteOptions;
	layoutWidget: LayoutWidget;
};
