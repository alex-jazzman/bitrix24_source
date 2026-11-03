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

	const SupportBannerEvent = Object.freeze({
		MEETUP: 'meetup',
		SETUP_CONSULTATION: 'setup_consultation',
	});

	/**
	 * Events of the menu and of the cards it owns. The menu is the home of those cards, so its own
	 * section is the default one; a card drawn by another screen names that screen instead, and the
	 * `section` argument of a sender is exactly that name. Left out, the default wins: `merge()` of the
	 * event skips a nil value.
	 */
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

		static sendDrawerOpenEvent(section)
		{
			new this({
				tool: 'intranet',
				category: 'whats_new',
				event: 'drawer_open',
				c_section: section,
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

		static sendSupportBannerClickEvent(type)
		{
			if (!Object.values(SupportBannerEvent).includes(type))
			{
				return;
			}

			new this({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'click_banner',
				type,
			}).send();
		}

		static sendIntegratorPromoClickEvent(section)
		{
			new this({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'click_integrator',
				type: 'promo',
				c_section: section,
			}).send();
		}

		static sendIntegratorMenuClickEvent(section)
		{
			new this({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'click_integrator',
				type: 'menu',
				c_section: section,
			}).send();
		}

		static sendIntegratorContactClickEvent(section)
		{
			new this({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'click_integrator',
				type: 'contact',
				c_section: section,
			}).send();
		}

		static sendIntegratorFeedbackClickEvent(section)
		{
			new this({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'click_integrator',
				type: 'feedback',
				c_section: section,
			}).send();
		}

		static sendIntegratorRefuseClickEvent(section)
		{
			new this({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'click_integrator',
				type: 'refuse',
				c_section: section,
			}).send();
		}

		static sendIntegratorRefuseSuccessEvent(section)
		{
			new this({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'refuse_integrator',
				type: 'success',
				c_section: section,
			}).send();
		}
	}

	module.exports = {
		MoreMenuAnalytics,
		AHA_EVENT_KEY,
		SupportBannerEvent,
	};
});
