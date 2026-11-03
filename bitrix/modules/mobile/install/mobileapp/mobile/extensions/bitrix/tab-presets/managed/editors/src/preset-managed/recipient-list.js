/**
 * @module tab-presets/managed/editors/src/preset-managed/recipient-list
 */
jn.define('tab-presets/managed/editors/src/preset-managed/recipient-list', (require, exports, module) => {
	const { Avatar, AvatarShape } = require('ui-system/blocks/avatar');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { Color, Indent } = require('tokens');
	const {
		RecipientEntityId,
	} = require('tab-presets/managed/editors/src/preset-managed/recipient-picker-state');

	const RECIPIENT_AVATAR_SIZE = 40;
	const RECIPIENT_AVATAR_ICON_SIZE = 24;

	/**
	 * @param {RecipientListProps} props
	 */
	const RecipientList = ({ items = [], testId, paddingLeft = 0, paddingRight = 0 }) => {
		if (items.length === 0)
		{
			return null;
		}

		return View(
			{
				testId: `${testId}-recipient-list`,
			},
			...items.map((item) => RecipientListItem({
				item,
				testId: `${testId}-recipient-${item.type}-${item.id}`,
				paddingLeft,
				paddingRight,
			})),
		);
	};

	/**
	 * @param {RecipientListItemProps} props
	 */
	const RecipientListItem = ({ item, testId, paddingLeft, paddingRight }) => View(
		{
			testId,
			style: {
				flexDirection: 'row',
				alignItems: 'flex-start',
				paddingTop: Indent.XL.toNumber(),
				paddingLeft,
			},
		},
		RecipientAvatar({ item, testId }),
		View(
			{
				style: {
					flex: 1,
					flexShrink: 1,
				},
			},
			View(
				{
					style: {
						height: RECIPIENT_AVATAR_SIZE,
						justifyContent: 'center',
						paddingRight,
					},
				},
				Text4({
					testId: `${testId}-title`,
					text: item.title,
					color: Color.base1,
					numberOfLines: 1,
					style: {
						flexShrink: 1,
					},
				}),
				item.subtitle && Text5({
					testId: `${testId}-subtitle`,
					text: item.subtitle,
					color: Color.base3,
					numberOfLines: 1,
					style: {
						flexShrink: 1,
						marginTop: Indent.XS2.toNumber(),
					},
				}),
			),
			View({
				style: {
					marginTop: Indent.XS.toNumber(),
					borderBottomWidth: 1,
					borderBottomColor: Color.bgSeparatorSecondary.toHex(),
				},
			}),
		),
	);

	/**
	 * @param {RecipientAvatarProps} props
	 */
	const RecipientAvatar = ({ item, testId }) => {
		const avatarStyle = {
			marginRight: Indent.XL.toNumber(),
		};

		if (item.type === RecipientEntityId.DEPARTMENT)
		{
			return Avatar({
				testId: `${testId}-avatar`,
				id: item.id,
				size: RECIPIENT_AVATAR_SIZE,
				name: item.title,
				withRedux: false,
				useLetterImage: false,
				shape: AvatarShape.SQUARE,
				backgroundColor: Color.accentExtraAqua,
				style: avatarStyle,
				icon: IconView({
					testId: `${testId}-avatar-icon`,
					icon: Icon.DEPARTMENT,
					color: Color.baseWhiteFixed,
					size: RECIPIENT_AVATAR_ICON_SIZE,
				}),
			});
		}

		return Avatar({
			testId: `${testId}-avatar`,
			id: item.id,
			size: RECIPIENT_AVATAR_SIZE,
			uri: item.imageUrl,
			name: item.title,
			withRedux: true,
			style: avatarStyle,
		});
	};

	module.exports = { RecipientList };
});
