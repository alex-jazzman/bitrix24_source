/**
 * @module layout/ui/name-checker-box
 */
jn.define('layout/ui/name-checker-box', (require, exports, module) => {
	const { merge } = require('utils/object');
	const { AvatarEntityType } = require('ui-system/blocks/avatar');
	const { NameChecker } = require('layout/ui/name-checker-box/src/name-checker');
	const { NameCheckerImageType } = require('layout/ui/name-checker-box/src/info-area-graphics');

	/**
	 * @param {OpenNameCheckerParams} params
	 * @return {Promise<NameChecker>}
	 */
	const openNameChecker = ({
		parentLayout = null,
		usersToInvite = [],
		alreadyInvitedUsers = [],
		analytics = {},
		openWidgetConfig = {},
		labelText = null,
		inviteButtonText = null,
		boxTitle = null,
		description = null,
		subdescription = null,
		onSendInviteButtonClick = null,
		getItemFormattedSubDescription = null,
		getAlreadyInvitedUsersLabelTextForSubtitle = null,
		getAlreadyInvitedUsersStringForSubtitle = null,
		infoAreaGraphicsUri = null,
		infoAreaGraphicsType = NameCheckerImageType.SVG,
		dismissAlert = null,
		avatarEntityType = AvatarEntityType.USER,
	}) => {
		return new Promise((resolve) => {
			const config = merge({
				enableNavigationBarBorder: false,
				titleParams: {
					text: boxTitle,
					type: 'dialog',
				},
				backdrop: {
					showOnTop: true,
					onlyMediumPosition: false,
					mediumPositionHeight: 500,
					bounceEnable: true,
					swipeAllowed: true,
					swipeContentAllowed: false,
					horizontalSwipeAllowed: false,
					shouldResizeContent: true,
					adoptHeightByKeyboard: true,
				},
				onReady: (readyLayout) => {
					readyLayout.preventBottomSheetDismiss(true);
					const instance = new NameChecker({
						layout: readyLayout,
						usersToInvite,
						alreadyInvitedUsers,
						parentLayout,
						openWidgetConfig,
						analytics,
						labelText,
						inviteButtonText,
						description,
						subdescription,
						onSendInviteButtonClick,
						getItemFormattedSubDescription,
						getAlreadyInvitedUsersLabelTextForSubtitle,
						getAlreadyInvitedUsersStringForSubtitle,
						infoAreaGraphicsUri,
						infoAreaGraphicsType,
						dismissAlert,
						avatarEntityType,
					});
					readyLayout.showComponent(instance);
					resolve(instance);
				},
			}, openWidgetConfig);

			if (parentLayout)
			{
				parentLayout.openWidget('layout', config);

				return;
			}

			PageManager.openWidget('layout', config);
		});
	};

	module.exports = { openNameChecker, NameCheckerImageType };
});
