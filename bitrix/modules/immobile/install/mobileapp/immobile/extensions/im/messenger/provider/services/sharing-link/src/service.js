/**
 * @module im/messenger/provider/services/sharing-link/src/service
 */
jn.define('im/messenger/provider/services/sharing-link/src/service', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { DialogHelper } = require('im/messenger/lib/helper');

	const logger = LoggerManager.getInstance().getLogger('service--sharing-link');

	/**
	 * @class SharingLinkService
	 */
	class SharingLinkService
	{
		/** @type {Set<string>} */
		static #fetchedDialogs = new Set();

		/** @type {Set<string>} */
		static #fetchedGuestDialogs = new Set();

		/**
		 * @param {string} dialogId
		 * @return {boolean}
		 */
		static isFetched(dialogId)
		{
			return SharingLinkService.#fetchedDialogs.has(dialogId);
		}

		/**
		 * @param {string} dialogId
		 * @return {boolean}
		 */
		static isGuestFetched(dialogId)
		{
			return SharingLinkService.#fetchedGuestDialogs.has(dialogId);
		}

		/**
		 * @return {Object}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @param {string} dialogId
		 * @return {Promise<Object>}
		 */
		async getIndividual(dialogId)
		{
			logger.log('SharingLinkService.getIndividual', dialogId);

			const result = await runAction(RestMethod.imV2ChatSharingLinkGetIndividual, {
				data: { dialogId },
			});

			const linkData = result?.sharingLink;
			if (linkData)
			{
				await this.store.dispatch('sidebarModel/sidebarSharedLinkModel/set', linkData);
			}

			SharingLinkService.#fetchedDialogs.add(dialogId);

			return linkData;
		}

		/**
		 * @param {string} code
		 * @return {Promise<Object>}
		 */
		async regenerateIndividual(code)
		{
			logger.log('SharingLinkService.regenerateIndividual', code);

			const result = await runAction(RestMethod.imV2ChatSharingLinkRegenerateIndividual, {
				data: { code },
			});

			const newLink = result?.sharingLink;
			if (newLink)
			{
				await this.store.dispatch('sidebarModel/sidebarSharedLinkModel/regenerate', { newLink });
			}

			return newLink;
		}

		/**
		 * @param {string} code
		 * @return {Promise<{dialogId: string}>}
		 */
		async joinByCode(code)
		{
			logger.log('SharingLinkService.joinByCode', code);

			const result = await runAction(RestMethod.imV2ChatJoinByCode, {
				data: { code },
			});

			return { dialogId: result.dialogId };
		}

		// region guest invite

		/**
		 * @param {number} chatId
		 * @return {Promise<GuestSharingLink>}
		 */
		async generateGuestLink(chatId)
		{
			logger.log('SharingLinkService.generateGuestLink', chatId);

			const result = await runAction(RestMethod.imV2GuestLinkGenerate, {
				data: { chatId },
			});

			return result?.sharingLink;
		}

		/**
		 * @desc Get-or-create guest invite link for a chat and put it into the store.
		 * @param {string} dialogId
		 * @return {Promise<Object>}
		 */
		async getGuest(dialogId)
		{
			logger.log('SharingLinkService.getGuest', dialogId);

			const chatId = this.#resolveChatId(dialogId);
			if (!chatId)
			{
				return null;
			}

			const result = await runAction(RestMethod.imV2GuestLinkGenerate, {
				data: { chatId },
			});

			const linkData = result?.sharingLink;
			if (linkData)
			{
				await this.store.dispatch('sidebarModel/sidebarSharedLinkModel/set', linkData);
			}

			SharingLinkService.#fetchedGuestDialogs.add(dialogId);

			return linkData;
		}

		/**
		 * @desc Revoke current guest invite link and generate a new one.
		 * @param {string} dialogId
		 * @return {Promise<Object>}
		 */
		async regenerateGuest(dialogId)
		{
			logger.log('SharingLinkService.regenerateGuest', dialogId);

			const chatId = this.#resolveChatId(dialogId);
			if (!chatId)
			{
				return null;
			}

			const result = await runAction(RestMethod.imV2GuestLinkRegenerate, {
				data: { chatId },
			});

			const newLink = result?.sharingLink;
			if (newLink)
			{
				await this.store.dispatch('sidebarModel/sidebarSharedLinkModel/regenerate', { newLink });
			}

			return newLink;
		}

		/**
		 * @param {number} chatId
		 * @return {Promise<GuestSharingLink>}
		 */
		async regenerateGuestLink(chatId)
		{
			logger.log('SharingLinkService.regenerateGuestLink', chatId);

			const result = await runAction(RestMethod.imV2GuestLinkRegenerate, {
				data: { chatId },
			});

			return result?.sharingLink;
		}

		/**
		 * @param {number} chatId
		 * @param {GuestEmailInvitation[]} invitations
		 * @return {Promise}
		 */
		async inviteGuestsByEmail(chatId, invitations)
		{
			logger.log('SharingLinkService.inviteGuestsByEmail', chatId, invitations);

			return runAction(RestMethod.imV2GuestLinkInviteByEmail, {
				data: { chatId, invitations },
			});
		}

		/**
		 * @param {number} chatId
		 * @param {GuestPhoneInvitation[]} invitations
		 * @return {Promise}
		 */
		async inviteGuestsByPhone(chatId, invitations)
		{
			logger.log('SharingLinkService.inviteGuestsByPhone', chatId, invitations);

			return runAction(RestMethod.imV2GuestLinkInviteByPhoneNumber, {
				data: { chatId, invitations },
			});
		}

		// endregion

		/**
		 * @param {string} dialogId
		 * @return {?number}
		 */
		#resolveChatId(dialogId)
		{
			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			const chatId = dialogHelper?.dialogModel?.chatId;

			return chatId || null;
		}
	}

	module.exports = { SharingLinkService };
});
