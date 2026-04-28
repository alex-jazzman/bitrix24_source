/**
 * @module more-menu/analytics
 */
jn.define('more-menu/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const AHA_EVENT_KEY = Object.freeze({
		CALL_LIST_POPUP_SHOW: 'call_list_popup_show',
		CALL_LIST_CLICK_SET_MENU: 'call_list_click_set_menu',
	});

	const AHA_ANALYTICS_EVENTS = Object.freeze({
		[AHA_EVENT_KEY.CALL_LIST_POPUP_SHOW]: {
			tool: 'im',
			category: 'popup',
			event: 'view_popup',
			type: 'add_call_list_to_menu',
		},
		[AHA_EVENT_KEY.CALL_LIST_CLICK_SET_MENU]: {
			tool: 'im',
			category: 'popup',
			event: 'click_set_menu',
			type: 'add_call_list_to_menu',
		},
	});

	class MoreMenuAnalytics extends AnalyticsEvent
	{
		getDefaults()
		{
			return {
				tool: null,
				category: null,
				event: 'open_section',
				type: null,
				c_section: 'ava_menu',
				c_sub_section: null,
				c_element: null,
				status: null,
				p1: null,
				p2: null,
				p3: null,
				p4: null,
				p5: null,
			};
		}

		static isValidAnalyticsData(data)
		{
			return (
				typeof data === 'object'
				&& data?.tool
				&& data?.category
				&& data?.event
			);
		}

		static sendDrawerOpenEvent()
		{
			new this({
				tool: 'intranet',
				category: 'whats_new',
				event: 'drawer_open',
				c_section: 'ava_menu',
			}).send();
		}

		static sendMenuOpenEvent()
		{
			new this({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'menu_open',
			}).send();
		}

		static sendStartWorkDay()
		{
			new this({
				tool: 'timeman',
				category: 'workday',
				event: 'start_day',
				c_element: 'ava_menu_button',
			}).send();
		}

		static sendFinishWorkDay()
		{
			new this({
				tool: 'timeman',
				category: 'workday',
				event: 'finish_day',
				c_element: 'ava_menu_button',
			}).send();
		}

		static sendPauseWorkDay()
		{
			new this({
				tool: 'timeman',
				category: 'workday',
				event: 'break_start',
				c_element: 'ava_menu_button',
			}).send();
		}

		static sendResumeWorkDay()
		{
			new this({
				tool: 'timeman',
				category: 'workday',
				event: 'resume_day',
				c_element: 'ava_menu_button',
			}).send();
		}

		static sendAhaMomentEvent(eventKey)
		{
			const eventConfig = AHA_ANALYTICS_EVENTS[eventKey];
			if (!eventConfig)
			{
				return;
			}

			new AnalyticsEvent(eventConfig).send();
		}
	}

	module.exports = {
		MoreMenuAnalytics,
		AHA_EVENT_KEY,
	};
});
