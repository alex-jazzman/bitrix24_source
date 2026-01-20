/**
 * @module selector/widget/entity/socialnetwork/user
 */

jn.define('selector/widget/entity/socialnetwork/user', (require, exports, module) => {
	const { Loc } = require('loc');
	const { mergeImmutable } = require('utils/object');
	const { AvatarClass } = require('ui-system/blocks/avatar');
	const { SelectorDataProvider } = require('layout/ui/user/user-name');
	const { BaseSelectorEntity } = require('selector/widget/entity');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Color, Typography } = require('tokens');
	const { feature } = require('native/feature');

	/**
	 * @class SocialNetworkUserSelector
	 */
	class SocialNetworkUserSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'user';
		}

		static getContext()
		{
			return 'mobile-user';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_USER');
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_USER_2');
		}

		static isCreationEnabled()
		{
			return true;
		}

		static prepareItemForDrawing(item)
		{
			if (!item.id)
			{
				return item;
			}

			const avatarParams = AvatarClass.resolveEntitySelectorParams({ ...item, withRedux: true });
			const avatar = AvatarClass.getAvatar(avatarParams).getAvatarNativeProps();
			const userNameStyle = SelectorDataProvider.getUserTitleStyle(item);

			return mergeImmutable(
				item,
				{
					id: `${item.entityId}/${item.id}`,
					avatar,
					styles: userNameStyle,
				},
			);
		}

		static getSearchPlaceholderWithCreation()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_INVITE_SEARCH_WITH_CREATION');
		}

		static getCreateText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_INVITE_USER_TAG');
		}

		static getCreatingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_INVITING_USER_TAG');
		}

		static canCreateWithEmptySearch()
		{
			return true;
		}

		static getCustomCreateElement({ items = [], isRecent = false } = {})
		{
			if (!feature.isFeatureEnabled('list_widget_invite_banner'))
			{
				return null;
			}

			const accent = isRecent && items.length < 5;
			const imageUrl = encodeURI(
				makeLibraryImagePath(`add-3${accent ? '-active' : ''}.png`, 'volumetric'),
			);

			return {
				id: `invite-banner${accent ? '-accent' : ''}`,
				type: 'invite',
				title: Loc.getMessage('SELECTOR_COMPONENT_INVITE_BANNER_TITLE'),
				subtitle: Loc.getMessage('SELECTOR_COMPONENT_INVITE_BANNER_DESCRIPTION'),
				styles: {
					image: {
						image: {
							borderRadius: 0,
						},
					},
					innerContent: {
						backgroundColor: accent ? Color.accentMainPrimary.toHex() : Color.accentSoftBlue2.toHex(),
						// cornerRadius: Component.elementAccentCorner.toNumber(),
						cornerRadius: 32,
					},
					title: {
						color: accent ? Color.baseWhiteFixed.toHex() : Color.accentMainLink.toHex(),
						font: {
							typographyName: Typography.text4Accent.getName(),
							color: accent ? Color.baseWhiteFixed.toHex() : Color.accentMainLink.toHex(),
							useColor: true,
						},
					},
					subtitle: {
						color: accent ? Color.chatOverallBaseWhite2.toHex() : Color.base3.toHex(),
						font: {
							typographyName: Typography.text6.getName(),
							color: accent ? Color.chatOverallBaseWhite2.toHex() : Color.base3.toHex(),
							useColor: true,
						},
					},
					arrow: {
						backgroundColor: accent ? Color.chatMyPrimary3.toHex() : Color.accentSoftBlue3.toHex(),
						image: {
							tintColor: accent ? Color.baseWhiteFixed.toHex() : Color.accentMainPrimaryalt.toHex(),
						},
					},
				},
				useLetterImage: false,
				params: {
					preventCloseOnSelect: true,
				},
				imageUrl,
				sectionCode: 'common',
				unselectable: true,
			};
		}

		static addEvents(events)
		{
			return {
				onItemSelected: ({ item, widgetEntity }) => {
					if (item.type === 'invite')
					{
						widgetEntity?.createOptions?.handler?.();
					}
				},
				...events,
			};
		}

		static getCreateEntityHandler(providerOptions, createOptions)
		{
			// to prevent cyclical dependency
			const { openIntranetInviteWidget } = require('intranet/invite-opener-new');
			const { getParentLayout, analytics } = createOptions;

			return (text, allowMultipleSelection) => {
				return new Promise((resolve, reject) => {
					openIntranetInviteWidget({
						analytics,
						multipleInvite: allowMultipleSelection,
						parentLayout: getParentLayout ? getParentLayout() : null,
						onInviteSentHandler: (users) => {
							if (Array.isArray(users) && users.length > 0)
							{
								const preparedUsers = users.map((user) => {
									return {
										id: user.id,
										type: 'user',
										entityId: 'user',
										phone: user.personalMobile,
										firstName: user.name,
										lastName: user.lastName,
										title: user.fullName,
									};
								});
								resolve(preparedUsers);
							}
						},
						onInviteError: (errors) => {
							reject(errors);
						},
						onViewHiddenWithoutInvitingHandler: () => {
							reject();
						},
					});
				});
			};
		}
	}

	module.exports = { SocialNetworkUserSelector };
});

(() => {
	const require = (ext) => jn.require(ext);
	const { SocialNetworkUserSelector } = require('selector/widget/entity/socialnetwork/user');

	this.SocialNetworkUserSelector = SocialNetworkUserSelector;
})();
