/**
 * @module intranet/reinvite/entry
 */
jn.define('intranet/reinvite/entry', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { StatusBox } = require('layout/ui/status-box');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { makeLibraryImagePath } = require('asset-manager');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { showErrorToast } = require('toast');
	const { Reinvite } = require('intranet/reinvite');

	class ReinviteEntry extends LayoutComponent
	{
		/**
		 * @public
		 * @param {number} userId
		 * @param {function} onSave
		 * @param {string} [widgetTitle=Loc.getMessage('M_INTRANET_REINVITE_TITLE')]
		 * @param {PageManager} [parentWidget=PageManager]
		 */
		static async tryToOpenReinvite({
			userId,
			onSave,
			widgetTitle = Loc.getMessage('M_INTRANET_REINVITE_TITLE'),
			parentWidget = PageManager,
		})
		{
			const { data, errors } = await ReinviteEntry.#fetchInviteSettings();

			if (Type.isArrayFilled(errors))
			{
				showErrorToast(errors[0].message);

				return;
			}

			if (data?.canCurrentUserInvite)
			{
				ReinviteEntry.#openReinvite(userId, onSave, widgetTitle, parentWidget);
			}
			else
			{
				ReinviteEntry.#openReinviteDisabledBox(parentWidget);
			}
		}

		static async #fetchInviteSettings()
		{
			return new Promise((resolve) => {
				new RunActionExecutor('intranetmobile.invite.getInviteSettings')
					.setSkipRequestIfCacheExists()
					.setCacheTtl(3600 * 24)
					.setCacheId('inviteSettings')
					.setCacheHandler((response) => resolve(response))
					.setHandler((response) => resolve(response))
					.call(true)
				;
			});
		}

		static #openReinvite(userId, onSave, widgetTitle, parentWidget)
		{
			void new BottomSheet({
				component: (widget) => {
					return new Reinvite({
						userId,
						onSave,
						layoutWidget: widget,
					});
				},
				titleParams: {
					type: 'dialog',
					text: widgetTitle,
					largeMode: true,
				},
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.disableOnlyMediumPosition()
				.setMediumPositionHeight(Reinvite.getStartingLayoutHeight())
				.enableAdoptHeightByKeyboard()
				.open()
			;
		}

		static #openReinviteDisabledBox(parentWidget)
		{
			void StatusBox.open({
				parentWidget,
				testId: 'status-box-no-permission',
				backdropTitle: Loc.getMessage('M_INTRANET_REINVITE_TITLE'),
				imageUri: makeLibraryImagePath('user-locked.svg', 'invite-status-box', 'intranet'),
				description: Loc.getMessage('M_INTRANET_REINVITE_DISABLED_BOX_DESCRIPTION'),
				buttonText: Loc.getMessage('M_INTRANET_REINVITE_DISABLED_BOX_BUTTON_TEXT'),
			});
		}
	}

	module.exports = { ReinviteEntry };
});
