(() => {
	const require = (ext) => jn.require(ext);

	const { AnalyticsEvent } = require('analytics');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { AjaxMethod } = require('mail/const');

	class MailBackground
	{
		constructor()
		{
			this.bindEvents();
			this.subscribeToPublicationEvents();
		}

		bindEvents()
		{
			BX.addCustomEvent('mailbackground::router', (threadId = 0, mailboxId = 0, source = 'mail') => {
				const numMailboxId = Number(mailboxId);

				if (numMailboxId === 0)
				{
					ComponentHelper.openLayout({
						canOpenInDefault: true,
						name: 'mail:mail.message.view',
						object: 'layout',
						widgetParams: {
							title: '',
						},
						componentParams: {
							isCrmMessage: 0,
							threadId,
							source,
						},
					});
				}
				else
				{
					ComponentHelper.openLayout({
						canOpenInDefault: true,
						name: 'mail:mail.message.grid',
						object: 'layout',
						widgetParams: {
							title: '',
						},
						componentParams: {
							mailboxId,
						},
					});
				}
			});
		}

		subscribeToPublicationEvents()
		{
			BX.addCustomEvent('Livefeed.PublicationQueue::afterPostAdd', (item) => {
				this.handleFeedPostPublished(item);
			});
		}

		handleFeedPostPublished(item)
		{
			const messageId = Number.parseInt(item?.MAIL_MESSAGE_ID, 10);

			// Реагируем только на посты, созданные из письма (строгая фильтрация по маркеру MAIL_MESSAGE_ID).
			if (!messageId)
			{
				return;
			}

			const postId = Number.parseInt(item?.post_id, 10);
			if (!postId)
			{
				console.error('mail/background: не удалось привязать пост к письму — отсутствует post_id', { messageId });

				return;
			}

			// Аналитику шлём после проверки postId — только на реальном пути привязки: без postId
			// привязки не будет, поэтому такой случай не считаем успешным созданием поста из письма.
			this.sendFeedPostAnalytics();

			this.bindFeedPost({ messageId, postId });
		}

		bindFeedPost({ messageId, postId })
		{
			// Fire-and-forget: ошибка привязки не блокирует UI, но логируется для наблюдаемости.
			(new RunActionExecutor(AjaxMethod.mailBindFeedPost, { messageId, postId }))
				.setHandler((response) => {
					if (response?.errors?.length > 0)
					{
						console.error('mail/background: привязка поста к письму завершилась с ошибкой', {
							messageId,
							postId,
							errors: response.errors,
						});

						return;
					}

					// Точечное обновление UI-стора писем: капсула «Пост» появляется сразу, без релоада.
					BX.postComponentEvent('Mail.Binding::feedPostBound', [{ messageId, postId }]);
				})
				.setNetworkErrorHandler(() => {
					console.error('mail/background: сетевая ошибка при привязке поста к письму', { messageId, postId });
				})
				.call(false);
		}

		sendFeedPostAnalytics()
		{
			new AnalyticsEvent({
				tool: 'mail',
				category: 'mail_general_ops',
				event: 'create_feed_post_from_email',
				c_section: 'mail',
			}).send();
		}
	}

	this.MailBackground = new MailBackground();
})();
