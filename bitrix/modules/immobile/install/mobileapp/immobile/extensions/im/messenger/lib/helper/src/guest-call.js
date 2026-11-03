/**
 * @module im/messenger/lib/helper/guest-call
 */
jn.define('im/messenger/lib/helper/guest-call', (require, exports, module) => {
	const { OpenDialogContextType } = require('im/messenger/const/context-type');

	/**
	 * Only the link opening context identifies the guest to the call manager. It is carried by the
	 * guest sharing link and by the other in-app links that open a dialog; opening the same chat
	 * from the recent list or from the call menu carries the default context and just opens it.
	 *
	 * @param {{ isCurrentUserGuest: boolean, openingContext: string }} params
	 * @return {boolean}
	 */
	const isGuestOpeningByLink = ({ isCurrentUserGuest, openingContext }) => (
		isCurrentUserGuest && openingContext === OpenDialogContextType.link
	);

	module.exports = { isGuestOpeningByLink };
});
