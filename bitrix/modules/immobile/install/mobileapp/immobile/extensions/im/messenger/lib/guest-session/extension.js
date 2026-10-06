/**
 * @module im/messenger/lib/guest-session
 */
jn.define('im/messenger/lib/guest-session', (require, exports, module) => {
	const { Alert } = require('alert');
	const { Loc } = require('loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { UserType } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const logger = getLoggerWithContext('guest-session', 'GuestSession');

	let guestSessionAlertShown = false;

	const isGuestSession = () => MessengerParams.getUserInfo()?.type === UserType.guest;

	// A terminated guest session surfaces as an HTTP 401 on any messenger request (link revoked,
	// inviter rights gone, guest kicked/deactivated, feature disabled, session terminated on REST).
	// For an authenticated guest a 401 always means the session is gone, so the HTTP status alone is
	// a robust trigger — the error payload is unreliable (BX.ajax masks 401 as a NETWORK_ERROR).
	const isGuestUnauthorized = (httpStatus) => isGuestSession() && httpStatus === 401;

	// On the first such hit we surface a modal alert explaining the guest session has ended and a new
	// invite link is needed. Shown once; we do NOT exit the app — the guest stays put. We also
	// unsubscribe all pull handlers so no further messages are delivered to the stale session.
	const handleGuestSessionTerminated = () => {
		if (guestSessionAlertShown)
		{
			return;
		}
		guestSessionAlertShown = true;
		logger.warn('Guest session terminated by server, notifying guest and tearing down pull subscription');

		Alert.alert(
			Loc.getMessage('IMMOBILE_MESSENGER_GUEST_SESSION_TERMINATED_ALERT_TITLE'),
			Loc.getMessage('IMMOBILE_MESSENGER_GUEST_SESSION_TERMINATED_ALERT_DESCRIPTION'),
			() => {},
			Loc.getMessage('IMMOBILE_MESSENGER_GUEST_SESSION_TERMINATED_ALERT_BUTTON'),
		);

		serviceLocator.get('pull-handler-launcher')?.unsubscribeEvents();
	};

	module.exports = {
		isGuestSession,
		isGuestUnauthorized,
		handleGuestSessionTerminated,
	};
});