/**
 * @module background/notifications/open-copilot-chat-tab
 */
jn.define('background/notifications/open-copilot-chat-tab', (require, exports, module) => {
	const { BaseNotificationHandler } = require('background/notifications/base');
	const { requireLazyBatch } = require('require-lazy');
	const { AnalyticsEvent } = require('analytics');

	const OPEN_TAB_MAX_ATTEMPTS = 10;
	const OPEN_TAB_ATTEMPT_TIMEOUT = 1000;

	/**
	 * @class OpenCopilotChatTabNotification
	 */
	class OpenCopilotChatTabNotification extends BaseNotificationHandler
	{
		getNotificationType()
		{
			return 'MOBILE_OPEN_COPILOT_CHAT';
		}

		handleNotificationClick(message)
		{
			const analytics = this.getAnalytics();
			if (analytics)
			{
				analytics.send();
			}

			void this.#openCopilotTab();
		}

		async #openCopilotTab()
		{
			try
			{
				const extensions = await requireLazyBatch(['im:messenger/api/tab', 'im:messenger/api/navigation'], false);
				const { openCopilotTab } = extensions.get('im:messenger/api/tab');
				const { closeAll } = extensions.get('im:messenger/api/navigation');

				// При холодном старте компонент мессенджера монтируется не сразу: closeAll и openCopilotTab
				// шлют событие в ещё несмонтированный компонент и «теряются» (промис не резолвится). Поэтому
				// closeAll делаем best-effort, а переключение на вкладку CoPilot повторяем, пока компонент
				// не примет его (changeTabResult) либо не выйдет лимит попыток.
				await this.#runWithTimeout(() => closeAll?.(), OPEN_TAB_ATTEMPT_TIMEOUT).catch(() => {});

				for (let attempt = 1; attempt <= OPEN_TAB_MAX_ATTEMPTS; attempt++)
				{
					try
					{
						await this.#runWithTimeout(() => openCopilotTab?.(), OPEN_TAB_ATTEMPT_TIMEOUT);

						return;
					}
					catch (error)
					{
						if (attempt === OPEN_TAB_MAX_ATTEMPTS)
						{
							console.error('OpenCopilotChatTabNotification: unable to open CoPilot tab', error);
						}
					}
				}
			}
			catch (error)
			{
				console.error(error);
			}
		}

		#runWithTimeout(factory, timeout)
		{
			return new Promise((resolve, reject) => {
				let isSettled = false;

				const timer = setTimeout(() => {
					if (!isSettled)
					{
						isSettled = true;
						reject(new Error('timeout'));
					}
				}, timeout);

				Promise.resolve(factory())
					.then((value) => {
						if (!isSettled)
						{
							isSettled = true;
							clearTimeout(timer);
							resolve(value);
						}
					})
					.catch((error) => {
						if (!isSettled)
						{
							isSettled = true;
							clearTimeout(timer);
							reject(error);
						}
					});
			});
		}

		getAnalytics()
		{
			return new AnalyticsEvent()
				.setEvent('push_mobile_1-8d_copilot')
				.setCategory('1-8d')
				.setTool('mobile');
		}

		getNotificationEventName()
		{
			return '';
		}

		getSubscriptionEventName()
		{
			return '';
		}
	}

	module.exports = {
		OpenCopilotChatTabNotification,
	};
});
