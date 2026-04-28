/**
 * @module timeman/analytics
 */
jn.define('timeman/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const TimemanAnalyticsEventType = {
		ON_TIMEMAN_OPEN_DAY: 'OnTimemanOpenDay',
		ON_TIMEMAN_START_DAY: 'OnTimemanStartDay',
		ON_TIMEMAN_CLOSE_DAY: 'OnTimemanCloseDay',
		ON_TIMEMAN_PAUSE_DAY: 'OnTimemanPauseDay',
		ON_TIMEMAN_RESUME_DAY: 'OnTimemanResumeDay',
		ON_TIMEMAN_CLICK_FINISH_CUSTOM_TIME: 'OnTimemanClickFinishCustomTime',
		ON_TIMEMAN_CLICK_START_CUSTOM_TIME: 'OnTimemanClickStartCustomTime',
		ON_TIMEMAN_EDIT_DAY: 'OnTimemanEditDay',
		ON_TIMEMAN_DAILY_WORK_DONE_SAVE: 'onTimemanWorkDoneSave',
	};

	const TimemanAnalyticsId = {
		[TimemanAnalyticsEventType.ON_TIMEMAN_OPEN_DAY]: 'popup_open',
		[TimemanAnalyticsEventType.ON_TIMEMAN_START_DAY]: 'start_day',
		[TimemanAnalyticsEventType.ON_TIMEMAN_CLOSE_DAY]: 'finish_day',
		[TimemanAnalyticsEventType.ON_TIMEMAN_PAUSE_DAY]: 'break_start',
		[TimemanAnalyticsEventType.ON_TIMEMAN_RESUME_DAY]: 'resume_day',
		[TimemanAnalyticsEventType.ON_TIMEMAN_CLICK_FINISH_CUSTOM_TIME]: 'click_finish_custom_time',
		[TimemanAnalyticsEventType.ON_TIMEMAN_CLICK_START_CUSTOM_TIME]: 'click_start_custom_time',
		[TimemanAnalyticsEventType.ON_TIMEMAN_EDIT_DAY]: 'edit_day',
		[TimemanAnalyticsEventType.ON_TIMEMAN_DAILY_WORK_DONE_SAVE]: 'daily_work_done_save',
	};

	const TimemanAnalyticsSection = {
		AVA_MENU: 'ava_menu',
	};

	const TimemanAnalyticsElement = {
		WORKDAY_POPUP: 'workday_popup',
	};

	class TimemanAnalytics
	{
		subscribeEvents()
		{
			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_OPEN_DAY, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_OPEN_DAY);
			});

			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_START_DAY, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_START_DAY);
			});

			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_CLOSE_DAY, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_CLOSE_DAY);
			});
			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_PAUSE_DAY, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_PAUSE_DAY);
			});
			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_RESUME_DAY, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_RESUME_DAY);
			});
			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_CLICK_FINISH_CUSTOM_TIME, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_CLICK_FINISH_CUSTOM_TIME);
			});
			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_CLICK_START_CUSTOM_TIME, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_CLICK_START_CUSTOM_TIME);
			});
			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_EDIT_DAY, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_EDIT_DAY);
			});
			BX.addCustomEvent(TimemanAnalyticsEventType.ON_TIMEMAN_DAILY_WORK_DONE_SAVE, () => {
				this.sendAnalytics(TimemanAnalyticsEventType.ON_TIMEMAN_DAILY_WORK_DONE_SAVE);
			});
		}

		sendAnalytics(event)
		{
			new AnalyticsEvent({
				tool: 'timeman',
				category: 'workday',
				event: TimemanAnalyticsId[event],
				c_section: TimemanAnalyticsSection.AVA_MENU,
				c_element: TimemanAnalyticsElement.WORKDAY_POPUP,
			}).send();
		}
	}

	module.exports = {
		TimemanAnalytics: new TimemanAnalytics(),
		TimemanAnalyticsEventType,
	};
});
