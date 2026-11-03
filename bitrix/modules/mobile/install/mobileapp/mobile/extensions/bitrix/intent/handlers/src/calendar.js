/**
 * @module intent/handlers/src/calendar
 */
jn.define('intent/handlers/src/calendar', (require, exports, module) => {
	// the global BX.ajax.runAction is hung by the transport factory on whoever requires it, and the
	// code of the section is applied from background, where nobody raised `rest`
	const { runAction } = require('rest/transport');

	const SYNC_CODES = ['calendar_sync_slider', 'calendar_sync_banner'];

	const openIosGuide = () => {
		BX.ajax({
			url: '/bitrix/tools/dav_profile.php?action=token&params[resources]=caldav',
			dataType: 'json',
			method: 'GET',
		})
			.then((response) => {
				if (response.token)
				{
					Application.openUrl(`${currentDomain}/pub/calendar_ios_guide.php?access_token=${response.token}`);
				}
			})
			.catch((error) => console.error(error));
	};

	const openAndroidGuide = () => {
		if (typeof Application.davSyncEnable !== 'undefined')
		{
			Application.davSyncEnable('calendar');
			Application.openUrl(`${currentDomain}/pub/calendar_android_guide.php`);
		}
	};

	const openSyncGuide = (code) => {
		const platform = Application.getPlatform();

		if (platform === 'ios')
		{
			openIosGuide();
		}
		else
		{
			openAndroidGuide();
		}

		runAction('calendar.api.calendarajax.analytical', {
			analyticsLabel: {
				mobile_sync_device_platform: platform,
				link_place: code === 'calendar_sync_banner' ? 'banner' : 'slider',
				mobile_sync_calendar: 'mobile_sync_calendar',
			},
		});

		analytics.send(`calendar_sync_${platform}`, { type: code });
	};

	/**
	 * @type {IntentActionEntry[]}
	 */
	const intentActions = SYNC_CODES.map((code) => ({ codes: code, action: () => openSyncGuide(code) }));

	module.exports = { intentActions };
});
