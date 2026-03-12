/**
 * @module im/messenger/lib/element/dialog/src/message/banner/banners/admin/configuration
 */
jn.define('im/messenger/lib/element/dialog/src/message/banner/banners/admin/configuration', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const {
		Await,
		Success,
		Failure,
		ImageName,
		ImageBackgroundColor,
	} = require('im/messenger/lib/element/dialog/src/message/banner/banners/admin/type');
	const { ButtonDesignType } = require('im/messenger/lib/element/dialog/message/banner/const/type');
	const { ButtonSize } = require('ui-system/form/buttons');
	const { Feature } = require('im/messenger/lib/feature');
	const {
		openHelpdesk,
		openSupport,
	} = require('im/messenger/lib/element/dialog/src/message/banner/banners/admin/utils');
	const {
		FireAdminConfirmation,
		TransferAdminRightsConfirmation,
		sendFirstAdminRequest,
		FirstAdminAction,
	} = require('intranet/fire-admin');
	const { Logger } = require('im/messenger/lib/logger');

	const isBannerButtonNewlineSupported = Feature.isBannerButtonNewlineSupported;

	const getComponentParams = (messageData) => {
		const { COMPONENT_PARAMS = {} } = messageData?.params || {};

		return COMPONENT_PARAMS;
	};

	const getMessageId = (messageData) => {
		return messageData?.id || null;
	};

	const createHelpdeskButton = (id) => ({
		id,
		text: Loc.getMessage('IMMOBILE_ADMIN_MESSAGE_FIRE_REQUEST_MORE_BUTTON'),
		height: ButtonSize.S.getName(),
		rightIconName: 'question',
		design: ButtonDesignType.plainNoAccent,
		customStyle: { offset: 0 },
		callback: () => openHelpdesk(),
	});

	const createSupportButton = (id, senderPage) => ({
		id,
		text: Loc.getMessage('IMMOBILE_ADMIN_MESSAGE_FIRE_SUPPORT_BUTTON'),
		design: ButtonDesignType.outlineNoAccent,
		callback: ({ messageData }) => {
			const params = getComponentParams(messageData);
			const supportChat = params.supportChat?.id || 0;

			openSupport(supportChat, senderPage);
		},
	});

	const createSuccessBanner = (title, description) => ({
		banner: {
			title: Loc.getMessage(title),
			imageName: ImageName.docSuccessSign,
			picBackgroundColor: ImageBackgroundColor.docSuccessSign,
			description: Loc.getMessage(description),
		},
	});

	const createFailureBanner = (title, description, buttons = []) => ({
		banner: {
			title: Loc.getMessage(title),
			imageName: ImageName.docFailureSign,
			picBackgroundColor: ImageBackgroundColor.docFailureSign,
			description: Loc.getMessage(description),
			buttons,
		},
	});

	const createCancelButton = (id, text, action) => ({
		id,
		text: Loc.getMessage(text),
		height: ButtonSize.S.getName(),
		design: ButtonDesignType.outlineAccent2,
		callback: ({ messageData }) => {
			const params = getComponentParams(messageData);
			const messageId = getMessageId(messageData);

			void sendFirstAdminRequest(action, {
				currentAdminId: Number(params.user?.id),
				initiatorId: Number(params.initiator?.id),
				initiatorFullName: params.initiator?.name,
				messageId,
			}).catch((error) => Logger.error('sendFirstAdminRequest error', error));
		},
	});

	const createConfirmButton = (id, text, openFn) => ({
		id,
		text: Loc.getMessage(text),
		height: ButtonSize.S.getName(),
		design: ButtonDesignType.outlineNoAccent,
		callback: ({ messageData }) => {
			const params = getComponentParams(messageData);
			const messageId = getMessageId(messageData);

			openFn({
				currentAdminId: params.user?.id,
				initiatorId: params.initiator?.id,
				initiatorFullName: params.initiator?.name,
				messageId,
			});
		},
	});

	const maybeNewLine = isBannerButtonNewlineSupported ? [{ type: 'NEWLINE' }] : [];

	const AdminMetaData = {
		[Await.fireRequest]: {
			banner: {
				title: Loc.getMessage('IMMOBILE_ADMIN_MESSAGE_FIRE_REQUEST_TITLE'),
				imageName: ImageName.docAwaitSign,
				picBackgroundColor: ImageBackgroundColor.docAwaitSign,
				description: Loc.getMessage('IMMOBILE_ADMIN_MESSAGE_FIRE_REQUEST_DESCRIPTION'),
				buttons: [
					createHelpdeskButton(`${Await.fireRequest}-more-button`),
					...maybeNewLine,
					createCancelButton(
						`${Await.fireRequest}-cancel-button`,
						'IMMOBILE_ADMIN_MESSAGE_FIRE_REQUEST_CANCEL_BUTTON',
						FirstAdminAction.cancelFire,
					),
					createConfirmButton(
						`${Await.fireRequest}-confirm-button`,
						'IMMOBILE_ADMIN_MESSAGE_FIRE_REQUEST_CONFIRM_BUTTON',
						FireAdminConfirmation.open,
					),
				],
			},
		},
		[Await.transferRequest]: {
			banner: {
				title: Loc.getMessage('IMMOBILE_ADMIN_MESSAGE_ADMIN_TRANSFER_REQUEST_TITLE'),
				imageName: ImageName.docAwaitSign,
				picBackgroundColor: ImageBackgroundColor.docAwaitSign,
				description: Loc.getMessage('IMMOBILE_ADMIN_MESSAGE_ADMIN_TRANSFER_REQUEST_DESCRIPTION'),
				buttons: [
					createHelpdeskButton(`${Await.transferRequest}-more-button`),
					...maybeNewLine,
					createCancelButton(
						`${Await.transferRequest}-cancel-button`,
						'IMMOBILE_ADMIN_MESSAGE_ADMIN_TRANSFER_REQUEST_CANCEL_BUTTON',
						FirstAdminAction.cancelTransfer,
					),
					createConfirmButton(
						`${Await.transferRequest}-confirm-button`,
						'IMMOBILE_ADMIN_MESSAGE_ADMIN_TRANSFER_REQUEST_CONFIRM_BUTTON',
						TransferAdminRightsConfirmation.open,
					),
				],
			},
		},
		[Success.acceptedFire]: createSuccessBanner(
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_FIRE_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_FIRE_DESCRIPTION',
		),
		[Success.acceptedFireM]: createSuccessBanner(
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_FIRE_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_FIRE_M_DESCRIPTION',
		),
		[Success.acceptedFireF]: createSuccessBanner(
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_FIRE_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_FIRE_F_DESCRIPTION',
		),
		[Success.acceptedTransferSelf]: createSuccessBanner(
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_TRANSFER_SELF_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_TRANSFER_SELF_DESCRIPTION',
		),
		[Success.acceptedTransfer]: createSuccessBanner(
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_TRANSFER_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_TRANSFER_DESCRIPTION',
		),
		[Success.acceptedTransferM]: createSuccessBanner(
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_TRANSFER_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_TRANSFER_M_DESCRIPTION',
		),
		[Success.acceptedTransferF]: createSuccessBanner(
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_TRANSFER_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_ACCEPTED_TRANSFER_F_DESCRIPTION',
		),
		[Failure.refusedFireSelf]: createFailureBanner(
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REQUEST_DECLINE_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REQUEST_DECLINE_DESCRIPTION',
		),
		[Failure.refusedFire]: createFailureBanner(
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_FIRE_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_FIRE_DESCRIPTION',
			[
				createSupportButton(
					`${Failure.refusedFire}-support-button`,
					'messenger_refused_admin_fire',
				),
			],
		),
		[Failure.refusedFireM]: createFailureBanner(
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_FIRE_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_FIRE_M_DESCRIPTION',
			[
				createSupportButton(
					`${Failure.refusedFireM}-support-button`,
					'messenger_refused_admin_fire',
				),
			],
		),
		[Failure.refusedFireF]: createFailureBanner(
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_FIRE_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_FIRE_F_DESCRIPTION',
			[
				createSupportButton(
					`${Failure.refusedFireF}-support-button`,
					'messenger_refused_admin_fire',
				),
			],
		),
		[Failure.refusedTransferSelf]: createFailureBanner(
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_REFUSED_TRANSFER_SELF_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_ADMIN_REFUSED_TRANSFER_SELF_DESCRIPTION',
		),
		[Failure.refusedTransfer]: createFailureBanner(
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_TRANSFER_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_TRANSFER_DESCRIPTION',
			[
				createSupportButton(
					`${Failure.refusedTransfer}-support-button`,
					'messenger_refused_admin_transfer_rights',
				),
			],
		),
		[Failure.refusedTransferM]: createFailureBanner(
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_TRANSFER_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_TRANSFER_M_DESCRIPTION',
			[
				createSupportButton(
					`${Failure.refusedTransferM}-support-button`,
					'messenger_refused_admin_transfer_rights',
				),
			],
		),
		[Failure.refusedTransferF]: createFailureBanner(
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_TRANSFER_TITLE',
			'IMMOBILE_ADMIN_MESSAGE_FIRE_REFUSED_TRANSFER_F_DESCRIPTION',
			[
				createSupportButton(
					`${Failure.refusedTransferF}-support-button`,
					'messenger_refused_admin_transfer_rights',
				),
			],
		),
	};

	module.exports = {
		AdminMetaData,
	};
});
