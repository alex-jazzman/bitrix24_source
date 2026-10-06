/**
 * @module call/sync
 */
jn.define('call/sync', (require, exports, module) => {
	const { restCall } = require('call/callList/utils');
	const { CallSettingsManager } = require('call/settings-manager');

	class SyncCallService
	{
		constructor()
		{
			this.isStarting = false;
		}

		async startCall()
		{
			if (this.isStarting)
			{
				return;
			}

			this.isStarting = true;

			try
			{
				const result = await restCall('call.Call.createChatForCall', {});
				const { dialogId, chatId, guestLink } = result;

				if (!dialogId)
				{
					console.error('[SyncCallService][startCall] No dialogId in response', result);

					return;
				}

				const eventData = {
					dialogId,
					video: false,
					chatData: {
						dialogId,
						chatId,
					},
				};

				const syncCallInvitePeriod = CallSettingsManager.syncCallInvitePeriod;
				if (Number.isInteger(syncCallInvitePeriod) && syncCallInvitePeriod > 0)
				{
					eventData.invitePeriod = syncCallInvitePeriod;
				}

				if (guestLink)
				{
					const toastMessage = await this.copyGuestLink(guestLink);
					if (toastMessage)
					{
						eventData.pendingToast = {
							message: toastMessage,
							time: 3,
							position: 'top',
							offset: 15,
						};
					}
				}

				BX.postComponentEvent('onCallInvite', [eventData], 'calls');
			}
			catch (error)
			{
				console.error('[SyncCallService][startCall] Failed to start call:', error);
			}
			finally
			{
				this.isStarting = false;
			}
		}

		/**
		 * Copies the guest link to the clipboard.
		 * Returns the toast message to display, or empty string on missing link.
		 * @param {string} guestLink
		 * @returns {Promise<string>}
		 */
		async copyGuestLink(guestLink)
		{
			try
			{
				await Application.copyToClipboard(guestLink);

				return BX.message('CALLMOBILE_SYNC_GUEST_LINK_COPIED');
			}
			catch
			{
				return BX.message('CALLMOBILE_SYNC_GUEST_LINK_COPY_ERROR');
			}
		}
	}

	module.exports = { SyncCallService };
});
