/* eslint-disable */
declare namespace BX.BIConnector {
	class ShareBanDialog {
		/**
		 * Resolves with the actual ban state after the request, or with null when the user
		 * declines the confirmation or closes an error without retrying.
		 */
		static ban(dashboardId: number): Promise<boolean | null>;
		static unban(dashboardId: number): Promise<boolean | null>;
	}
}
