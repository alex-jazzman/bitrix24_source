/**
 * @module im/messenger/application/lib/pull-handler-launcher
 */
jn.define('im/messenger/application/lib/pull-handler-launcher', (require, exports, module) => {
	const { FeaturePullHandler } = require('im/messenger/provider/pull/feature');
	const { PlanLimitsPullHandler } = require('im/messenger/provider/pull/plan-limits');
	const { AnchorPullHandler } = require('im/messenger/provider/pull/anchor');
	const { BaseApplicationPullHandler } = require('im/messenger/provider/pull/base');
	const { CounterPullHandler } = require('im/messenger/provider/pull/counter');
	const { NotificationPullHandler, OnlinePullHandler, ChatFilePullHandler } = require('im/messenger/provider/pull/chat');
	const { CollabInfoPullHandler } = require('im/messenger/provider/pull/collab');
	const { VotePullHandler } = require('im/messenger/provider/pull/vote');
	const { SidebarPullHandler } = require('im/messenger/provider/pull/sidebar');
	const { RecentPullHandler } = require('im/messenger/provider/pull/recent');
	const { MessagePullHandler } = require('im/messenger/provider/pull/message');
	const { UserPullHandler } = require('im/messenger/provider/pull/user');
	const { DialogPullHandler } = require('im/messenger/provider/pull/dialog');
	const { OpenlinesPullHandler } = require('im/messenger/provider/pull/openlines');
	const { StickerPackPullHandler } = require('im/messenger/provider/pull/sticker-pack');

	/**
	 * @class PullHandlerLauncher
	 */
	class PullHandlerLauncher
	{
		static #instance;

		#handlerClassList = [
			FeaturePullHandler,
			PlanLimitsPullHandler,
			BaseApplicationPullHandler,
			NotificationPullHandler,
			CounterPullHandler,
			MessagePullHandler,
			DialogPullHandler,
			OpenlinesPullHandler,
			OnlinePullHandler,
			AnchorPullHandler,
			UserPullHandler,
			RecentPullHandler,
			VotePullHandler,
			ChatFilePullHandler,
			CollabInfoPullHandler,
			SidebarPullHandler,
			StickerPackPullHandler,
		];

		#unsubscribeCallbackList = [];

		/**
		 * @return {PullHandlerLauncher}
		 */
		static getInstance()
		{
			if (!this.#instance)
			{
				this.#instance = new this();
			}

			return this.#instance;
		}

		constructor()
		{
			this.#unsubscribeCallbackList = [];

			this.isLaunched = false;
		}

		subscribeEvents()
		{
			if (this.isLaunched)
			{
				return;
			}

			this.#handlerClassList.forEach((HandlerClass) => {
				const unsubscribeCallback = BX.PULL.subscribe(new HandlerClass());
				this.#unsubscribeCallbackList.push(unsubscribeCallback);
			});

			this.isLaunched = true;
		}

		unsubscribeEvents()
		{
			if (!this.isLaunched)
			{
				return;
			}

			this.#unsubscribeCallbackList.forEach((unsubscribeCallback) => unsubscribeCallback());
		}
	}

	module.exports = {
		PullHandlerLauncher,
	};
});
