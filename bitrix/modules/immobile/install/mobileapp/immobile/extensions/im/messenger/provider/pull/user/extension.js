/**
 * @module im/messenger/provider/pull/user
 */
jn.define('im/messenger/provider/pull/user', (require, exports, module) => {
	const { Type } = require('type');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { handleGuestSessionTerminated, isGuestSession } = require('im/messenger/lib/guest-session');

	/**
	 * @class UserPullHandler
	 */
	class UserPullHandler extends BasePullHandler
	{
		constructor()
		{
			super({ logger: getLoggerWithContext('pull-handler--user-v2', UserPullHandler) });
		}

		/**
		 * @param {UserUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleUserInvite(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleUserInvite:', params);

			await this.#updateUser(params);
		}

		/**
		 * @param {UserUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleUserUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleUserUpdate:', params);

			await this.#updateUser(params);
		}

		/**
		 * @desc this handler works for the scenario of adding a new bot to the portal (new registration)
		 * @param {BotUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleBotAdd(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleBotAdd:', params);

			await this.#updateUser(params);
		}

		/**
		 * @param {BotUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleBotUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleBotUpdate:', params);

			await this.#updateUser(params);
		}

		/**
		 * Forced logout for the current guest. Backend addresses the event to specific guest
		 * userIds; `deactivatedCodes` narrows it further when multiple guests share the chat
		 * but only some are affected (e.g. one link regenerated/revoked).
		 *
		 * Empty `deactivatedCodes` means a kill-switch broadcast (e.g. feature disabled) — terminate
		 * unconditionally. Otherwise terminate only when the current session's guestCode is listed.
		 *
		 * @param {{deactivatedCodes?: string[]}} params
		 * @param {PullExtraParams} extra
		 */
		async handleUserLogout(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleUserLogout:', params);

			if (!isGuestSession())
			{
				this.logger.info('handleUserLogout: skip, current session is not a guest session');

				return;
			}

			const deactivatedCodes = params?.deactivatedCodes;
			if (Type.isArrayFilled(deactivatedCodes))
			{
				const currentGuestCode = MessengerParams.getGuestCode();
				if (!currentGuestCode || !deactivatedCodes.includes(currentGuestCode))
				{
					this.logger.info('handleUserLogout: skip, current guestCode not in deactivatedCodes', {
						currentGuestCode,
						deactivatedCodes,
					});

					return;
				}
			}

			handleGuestSessionTerminated();
		}

		/**
		 * @param {UserUpdateParams|BotUpdateParams|UserUpdateParams} params
		 */
		async #updateUser(params)
		{
			await this.store.dispatch('usersModel/set', [params.user]);
		}
	}

	module.exports = {
		UserPullHandler,
	};
});
