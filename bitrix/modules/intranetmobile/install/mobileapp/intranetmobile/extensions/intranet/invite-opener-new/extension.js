/**
 * @module intranet/invite-opener-new
 */
jn.define('intranet/invite-opener-new', (require, exports, module) => {
	const { Notify } = require('notify');
	const { Invite, IntranetInviteAnalytics } = require('intranet/invite-new');
	const { Loc } = require('loc');
	const { StatusBox } = require('layout/ui/status-box');
	const { makeLibraryImagePath } = require('asset-manager');
	const { getInviteSettings, setUserVisitedInvitations } = require('intranet/invite-opener-new/api');
	const { InviteComponent } = require('intranet/invite-opener-new/src/component-opener');

	const ErrorCode = {
		POSSIBILITIES_RESTRICTED: 'Invite possibilities restricted',
		PERMISSIONS_RESTRICTED: 'Invite permissions restricted',
	};

	const componentCode = 'intranet:invite';
	/**
	 * @param {Object} params
	 * @param {AnalyticsEvent} params.analytics
	 * @param {Boolean} params.multipleInvite
	 * @param {LayoutComponent} params.parentLayout
	 * @param {Object} params.openWidgetConfig
	 * @param {Function} params.onInviteSentHandler
	 * @param {Function} params.onInviteError
	 * @param {Function} params.onViewHiddenWithoutInvitingHandler
	 * @param {Boolean} params.openAsComponent
	 * @param {Boolean} params.onHidden
	 */
	const openIntranetInviteWidget = (params) => {
		if (env.isCollaber || env.extranet)
		{
			return;
		}

		Notify.showIndicatorLoading();
		getInviteSettings(params)
			.then((inviteSettings) => {
				if (!inviteSettings)
				{
					return;
				}

				void setUserVisitedInvitations();

				if (!inviteSettings.canCurrentUserInvite)
				{
					handleUserHasNoPermissionsToInvite(params.onInviteError, params.parentLayout);

					return;
				}

				const open = params?.openAsComponent ? openInviteComponent : openInviteWidget;

				open({
					...inviteSettings,
					...params,
				});
			})
			.catch(console.error)
			.finally(() => Notify.hideCurrentIndicator())
		;
	};

	const handleUserHasNoPermissionsToInvite = (onInviteError, parentLayout = PageManager) => {
		StatusBox.open({
			backdropTitle: Loc.getMessage('INTRANET_INVITE_OPENER_TITLE_MSGVER_1'),
			testId: 'status-box-no-invitation',
			imageUri: makeLibraryImagePath('no-invitation.svg', 'invite-status-box', 'intranet'),
			parentWidget: parentLayout,
			description: Loc.getMessage('INTRANET_INVITE_DISABLED_BOX_TEXT'),
			buttonText: Loc.getMessage('INTRANET_INVITE_DISABLED_BOX_BUTTON_TEXT'),
		});

		if (onInviteError)
		{
			onInviteError([new Error(ErrorCode.PERMISSIONS_RESTRICTED)]);
		}
	};

	/**
	 * Opens the invite widget with the specified configuration.
	 *
	 * @typedef {object} InviteProps
	 * @property {Object} params - The parameters for configuring the invite widget.
	 * @property {Object} [params.parentLayout=null] - The parent layout for the widget.
	 * @property {Object} [params.openWidgetConfig={}] - Configuration options for opening the widget.
	 * @property {Object} [params.analytics={}] - Analytics configuration.
	 * @property {Function} [params.onInviteSentHandler=null] - Callback function to handle successful invite sending.
	 * @property {Function} [params.onInviteError=null] - Callback function to handle invite sending errors.
	 * @property {Function} [params.onViewHiddenWithoutInvitingHandler=null]
	 * - Callback function to handle the view being hidden without sending an invitation.
	 * @property {boolean} [params.creatorEmailConfirmed=false] - Admin confirmed email.
	 * @property {boolean} [params.canInviteBySMS=false] - Invite by SMS is avalable.
	 * @property {number} [params.canInviteByLink=false] - Invite by link is avalable.
	 * @property {number} [params.canInviteByEmail=false] - Invite by email is avalable.
	 * @property {boolean} [params.multipleInvite=true] - Whether multiple invites are allowed.
	 * @property {boolean} [params.adminConfirm=false] - Whether admin confirmation is required.
	 * @property {boolean} [params.isBitrix24Included=false] - Whether Bitrix24 is included.
	 * @property {boolean} [params.isInviteWithLocalEmailAppEnabled=true]
	 * - Whether invite with local email app is enabled.
	 */

	/**
	 * @param {InviteProps} params
	 */
	const openInviteWidget = ({
		parentLayout = null,
		openWidgetConfig = {},
		analytics = {},
		onInviteSentHandler = null,
		onInviteError = null,
		onViewHiddenWithoutInvitingHandler = null,
		canInviteBySMS = false,
		canInviteByLink = false,
		canInviteByEmail = false,
		creatorEmailConfirmed = false,
		multipleInvite = true,
		adminConfirm = false,
		isBitrix24Included = false,
		isInviteWithLocalEmailAppEnabled = true,
	}) => {
		const inviteAnalytics = new IntranetInviteAnalytics({ analytics });
		inviteAnalytics.sendDrawerOpenEvent();
		inviteAnalytics.setDepartmentParam(false);
		const config = {
			enableNavigationBarBorder: false,
			titleParams: {
				text: Loc.getMessage('INTRANET_INVITE_OPENER_TITLE_MSGVER_1'),
				type: 'dialog',
			},
			modal: true,
			backdrop: {
				showOnTop: false,
				onlyMediumPosition: false,
				mediumPositionHeight: 530,
				bounceEnable: true,
				swipeAllowed: true,
				swipeContentAllowed: false,
				horizontalSwipeAllowed: false,
				shouldResizeContent: true,
				adoptHeightByKeyboard: true,
			},
			...openWidgetConfig,
			onReady: (readyLayout) => {
				let onInviteSentHandlerExecuted = false;
				let onInviteErrorExecuted = false;
				readyLayout.showComponent(new Invite({
					layout: readyLayout,
					parentLayout,
					openWidgetConfig,
					analytics: inviteAnalytics,
					onInviteSentHandler: (users) => {
						onInviteSentHandlerExecuted = true;
						if (onInviteSentHandler)
						{
							onInviteSentHandler(users);
						}
					},
					onInviteError: (errors) => {
						onInviteErrorExecuted = true;
						if (onInviteError)
						{
							onInviteError(errors);
						}
					},
					canInviteBySMS,
					canInviteByLink,
					canInviteByEmail,
					creatorEmailConfirmed,
					multipleInvite,
					adminConfirm,
					isBitrix24Included,
					isInviteWithLocalEmailAppEnabled,
				}));

				readyLayout.on('onViewRemoved', () => {
					if (!onInviteSentHandlerExecuted && !onInviteErrorExecuted && onViewHiddenWithoutInvitingHandler)
					{
						onViewHiddenWithoutInvitingHandler();
					}
				});
			},
		};

		if (parentLayout)
		{
			parentLayout.openWidget('layout', config);

			return;
		}

		PageManager.openWidget('layout', config);
	};

	/**
	 * @param {InviteProps & { onHidden?: Function, analyticsSection: String }} params
	 */
	const openInviteComponent = ({
		parentLayout = null,
		openWidgetConfig = {},
		analyticsSection,
		onInviteSentHandler = null,
		onInviteError = null,
		onViewHiddenWithoutInvitingHandler = null,
		canInviteBySMS = false,
		canInviteByLink = false,
		canInviteByEmail = false,
		creatorEmailConfirmed = false,
		multipleInvite = true,
		adminConfirm = false,
		isBitrix24Included = false,
		isInviteWithLocalEmailAppEnabled = true,
		onHidden = () => {},
	}) => {
		if (!analyticsSection)
		{
			return;
		}

		PageManager.openComponent('JSStackComponent', {
			name: 'JSStackComponent',
			componentCode,
			// eslint-disable-next-line no-undef
			scriptPath: availableComponents[componentCode].publicUrl,
			canOpenInDefault: true,
			rootWidget: {
				name: 'layout',
				settings: {
					objectName: 'layout',
					modal: true,
					enableNavigationBarBorder: false,
					titleParams: {
						text: Loc.getMessage('INTRANET_INVITE_OPENER_TITLE_MSGVER_1'),
						type: 'dialog',
					},
					backdrop: {
						showOnTop: false,
						onlyMediumPosition: false,
						mediumPositionHeight: 530,
						bounceEnable: true,
						swipeAllowed: true,
						swipeContentAllowed: false,
						horizontalSwipeAllowed: false,
						shouldResizeContent: true,
						adoptHeightByKeyboard: true,
					},
				},
			},
			params: {
				inviteSettings: {
					parentLayout,
					openWidgetConfig,
					onInviteSentHandler,
					onInviteError,
					onViewHiddenWithoutInvitingHandler,
					canInviteBySMS,
					canInviteByLink,
					canInviteByEmail,
					creatorEmailConfirmed,
					multipleInvite,
					adminConfirm,
					isBitrix24Included,
					isInviteWithLocalEmailAppEnabled,
					analyticsSection,
					onHidden,
				},
			},
		});
	};

	module.exports = {
		openIntranetInviteWidget,
		ErrorCode,
		InviteComponent,
	};
});
