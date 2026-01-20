/**
 * @module layout/ui/user/card
 */
jn.define('layout/ui/user/card', (require, exports, module) => {
	const { Alert } = require('alert');
	const { AvatarPicker } = require('avatar-picker');
	const { Loc } = require('loc');
	const { Indent, Color, Corner, Component } = require('tokens');

	const { FileConverter } = require('files/converter');
	const { getFile } = require('files/entry');

	const { SafeImage } = require('layout/ui/safe-image');

	const { connect } = require('statemanager/redux/connect');
	const { usersSelector, updateProfilePhoto } = require('statemanager/redux/slices/users');

	const { Avatar, AvatarEntityType } = require('ui-system/blocks/avatar');
	const { BadgeButton, BadgeButtonDesign, BadgeButtonSize } = require('ui-system/blocks/badges/button');
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Card, CardCorner } = require('ui-system/layout/card');
	const { Text2, Text4 } = require('ui-system/typography/text');

	const { transparent } = require('utils/color');
	const { Line, Circle } = require('utils/skeleton');
	const { createTestIdGenerator } = require('utils/test');
	const { withCurrentDomain } = require('utils/url');
	const { PropTypes } = require('utils/validation');

	const { inAppUrl } = require('in-app-url');

	/**
	 * @typedef {Object} User
	 * @property {string} id
	 * @property {string} name
	 * @property {string} fullName
	 * @property {string} [avatar]
	 * @property {string} [avatarSizeOriginal]
	 * @property {string} [avatarSize100]
	 * @property {boolean} [isExtranet]
	 * @property {boolean} [isCollaber]
	 */

	/**
	 * @typedef {Object} CurrentTheme
	 * @property {string} id
	 * @property {string} title
	 * @property {string} previewImage
	 * @property {string[]} prefetchImages
	 * @property {number} width
	 * @property {number} height
	 * @property {boolean} new
	 * @property {boolean} removable
	 * @property {boolean} resizable
	 */

	const AVATAR_SIZE = 48;
	const CARD_PADDING_BOTTOM = Component.cardPaddingB.toNumber() - 1;

	/**
	 * @class UserCard
	 *
	 * @param {Object} props
	 * @param {number} props.userId
	 * @param {User} props.user
	 * @param {boolean} [props.canEditProfile=false]
	 * @param {boolean} [props.clickable=true]
	 * @param {CurrentTheme} props.currentTheme
	 * @param {Function} props.updateProfilePhoto
	 * @param {string} [props.testId='user-card']
	 */
	class UserCard extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				imageLoaded: false,
			};

			this.getTestId = createTestIdGenerator({
				context: this,
			});

			this.avatarPicker = new AvatarPicker();
			this.onAvatarClick = this.onAvatarClick.bind(this);
			this.userInfoContainerRef = null;
		}

		componentDidUpdate(prevProps, prevState)
		{
			const { canEditProfile, userId } = this.props;
			if (this.userInfoContainerRef && userId && canEditProfile)
			{
				void requireLazy('onboarding', false)
					.then(({ OnboardingBase, CaseName }) => {
						if (OnboardingBase)
						{
							void OnboardingBase.tryToShow(CaseName.ON_PROFILE_SHOULD_BE_FILLED, {
								title: Loc.getMessage('USER_CARD_ONBOARDING_TITLE'),
								description: Loc.getMessage('USER_CARD_ONBOARDING_DESCRIPTION'),
								targetRef: this.userInfoContainerRef,
								ownerId: userId,
								spotlightParams: {
									pointerMargin: CARD_PADDING_BOTTOM,
								},
							});
						}
					})
				;
			}
		}

		render()
		{
			const {
				currentTheme,
				canEditProfile,
				clickable,
			} = this.props;

			const isLightTheme = this.isLightTheme(currentTheme);
			const colorByTheme = isLightTheme ? Color.baseBlackFixed : Color.baseWhiteFixed;

			return Card(
				{
					testId: this.getTestId('wrapper'),
					style: {
						borderColor: isLightTheme ? null : Color.cardStrokeGradient1.toHex(),
						// fix height with border
						paddingTop: Component.cardPaddingT.toNumber() - 1,
						paddingBottom: CARD_PADDING_BOTTOM,
					},
					corner: CardCorner.XL,
					border: true,
					onClick: clickable ? () => {
						inAppUrl.open('/bitrix24/profile', {
							canEditProfile,
						});
					} : null,
				},
				SafeImage({
					withShimmer: true,
					testId: this.getTestId('background'),
					style: {
						minWidth: 420,
						minHeight: 140,
						width: '100%',
						height: '100%',
						backgroundColor: currentTheme?.previewColor,
					},
					wrapperStyle: {
						position: 'absolute',
						top: 0,
						left: 0,
						bottom: 0,
						right: 0,
						alignItems: 'center',
						borderRadius: Component.cardCornerXL.toNumber(),
					},
					clickable: false,
					resizeMode: 'cover',
					onSuccess: this.onImageLoad,
					renderPlaceholder: this.renderPlaceholder,
					...this.getBackgoundImageContent(currentTheme?.previewImage),
				}),
				(this.state.imageLoaded) && this.renderGradientOverlay(colorByTheme.toHex()),
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
						ref: (ref) => {
							if (ref)
							{
								this.userInfoContainerRef = ref;
							}
						},
					},
					this.renderAvatar(),
					this.renderDetails(),
				),
			);
		}

		renderPlaceholder = () => {
			return View(
				{
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						bottom: 0,
						right: 0,
						backgroundColor: Color.accentSoftBlue2.toHex(),
					},
				},
			);
		};

		/**
		 * @param {string} previewImage
		 * @return {{uri: string}|{svg: {uri: string}}}
		 */
		getBackgoundImageContent(previewImage)
		{
			if (previewImage && previewImage.endsWith('.svg'))
			{
				return {
					svg: {
						uri: withCurrentDomain(previewImage),
					},
				};
			}

			return {
				uri: withCurrentDomain(previewImage),
			};
		}

		renderAvatar()
		{
			const { user, canEditProfile } = this.props;
			if (!user)
			{
				return View(
					{
						style: {
							paddingRight: Indent.XS2.toNumber(),
							marginRight: Indent.XL.toNumber() + Indent.XS2.toNumber(),
						},
					},
					this.state.imageLoaded ? Circle(AVATAR_SIZE) : View(
						{
							style: {
								backgroundColor: Color.bgContentPrimary.toHex(),
								width: AVATAR_SIZE,
								height: AVATAR_SIZE,
								borderRadius: AVATAR_SIZE / 2,
							},
						},
					),
				);
			}

			const hasUserAvatar = user?.avatarSizeOriginal || user?.avatarSize100;

			return View(
				{
					style: {
						position: 'relative',
						paddingRight: Indent.XS2.toNumber(),
						marginRight: Indent.XL.toNumber(),
					},
				},
				Avatar({
					id: user.id,
					name: user.name,
					size: AVATAR_SIZE,
					testId: this.getTestId('avatar'),
					image: user.avatar,
					withRedux: true,
					accent: user?.isExtranet || user?.isCollaber,
					onClick: canEditProfile && !hasUserAvatar ? this.onAvatarClick : null,
					entityType: this.getEntityType(user),
					backBorderWidth: 0,
				}),
				canEditProfile && !hasUserAvatar && Shadow(
					{
						radius: Corner.XS.toNumber(),
						color: transparent(Color.baseBlackFixed.toHex(), 0.12),
						offset: { x: 0, y: Indent.XS2.toNumber() },
						inset: {
							top: 0,
							right: 3,
							left: 3,
						},
						style: {
							borderRadius: Corner.M.toNumber(),
							position: 'absolute',
							top: 0,
							right: 0,
						},
						clickable: false,
					},
					BadgeButton({
						testId: this.getTestId('avatar-pen'),
						size: BadgeButtonSize.S,
						icon: Icon.EDIT,
						design: BadgeButtonDesign.WHITE,
						onClick: this.onAvatarClick,
						style: {
							backgroundColor: Color.base8.toHex(),
						},
					}),
				),
			);
		}

		getEntityType(user)
		{
			if (user.isCollaber)
			{
				return AvatarEntityType.COLLAB;
			}

			if (user.isExtranet)
			{
				return AvatarEntityType.EXTRANET;
			}

			return AvatarEntityType.USER;
		}

		onImageLoad = () => {
			this.setState({
				imageLoaded: true,
			});
		};

		async onAvatarClick()
		{
			try
			{
				const { user } = this.props;

				const image = await this.avatarPicker.open();

				if (!image)
				{
					return;
				}

				const base64 = await this.prepareUserPhoto(image);
				await this.updateProfilePhoto(user.id, image, base64);
			}
			catch (error)
			{
				console.error(error);
				this.onAvatarSelectError(error);
			}
		}

		/**
		 * @param {object} image
		 * @return {Promise<string>}
		 */
		async prepareUserPhoto(image)
		{
			const imagePath = image.previewUrl;
			const preparedPath = imagePath.replace('file://', '');

			const resizedPath = await new FileConverter().resize('avatarResize', {
				url: preparedPath,
				width: 1000,
				height: 1000,
			});

			const file = await getFile(resizedPath);

			file.readMode = BX.FileConst.READ_MODE.DATA_URL;

			const fileData = await file.readNext();

			if (fileData.content)
			{
				const content = fileData.content;

				return content.slice(content.indexOf('base64,') + 7);
			}

			throw new Error('File content is empty');
		}

		/**
		 * @param {number} userId
		 * @param {object} image
		 * @param {string} base64
		 * @return {Promise<*>}
		 */
		async updateProfilePhoto(userId, image, base64)
		{
			const action = await this.props.updateProfilePhoto(userId, image, base64);
			if (action.error)
			{
				throw action.error;
			}

			return action;
		}

		onAvatarSelectError()
		{
			Alert.alert(
				Loc.getMessage('USER_CARD_AVATAR_CHOOSE_ERROR_TITLE'),
				Loc.getMessage('USER_CARD_AVATAR_CHOOSE_ERROR_TEXT'),
				() => {},
			);
		}

		renderDetails()
		{
			const { user, currentTheme } = this.props;

			if (!user)
			{
				if (this.state.imageLoaded)
				{
					return View(
						{
							style: {
								flex: 1,
								flexDirection: 'column',
								justifyContent: 'center',
							},
						},
						View(
							{
								style: {
									marginBottom: Indent.XS2.toNumber(),
								},
							},
							Line(93, 9, Indent.S.toNumber(), Indent.S.toNumber()),
						),
						Line(93, 9, Indent.S.toNumber(), Indent.S.toNumber()),
					);
				}

				return View(
					{
						style: {
							flex: 1,
							flexDirection: 'column',
							justifyContent: 'center',
						},
					},
					View(
						{
							style: {
								paddingVertical: Indent.S.toNumber(),
								marginBottom: Indent.XS2.toNumber(),
							},
						},
						View(
							{
								style: {
									width: 93,
									height: 9,
									backgroundColor: Color.bgContentPrimary.toHex(),
									borderRadius: 4,
								},
							},
						),
					),
					View(
						{
							style: {
								paddingVertical: Indent.S.toNumber(),
							},
						},
						View(
							{
								style: {
									width: 93,
									height: 9,
									backgroundColor: Color.bgContentPrimary.toHex(),
									borderRadius: 4,
								},
							},
						),
					),
				);
			}

			const textColor = this.getTextColorByTheme(currentTheme);

			return View(
				{
					style: {
						flexDirection: 'column',
						justifyContent: 'center',
						flexShrink: 2,
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							flexShrink: 2,
						},
					},
					Text2({
						text: user.fullName,
						testId: this.getTestId('full_name'),
						color: textColor,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							flexShrink: 2,
						},
					}),
					IconView({
						icon: Icon.CHEVRON_TO_THE_RIGHT,
						size: 20,
						color: textColor,
						testId: this.getTestId('chevron'),
						resizeMode: 'cover',
						style: {
							width: 10,
							height: 21,
							marginLeft: Indent.XS.toNumber(),
							alignSelf: 'flex-end',
						},
					}),
				),
				this.renderStatus(textColor),
			);
		}

		renderStatus(textColor)
		{
			const { user } = this.props;
			const status = this.getStatus(user);

			if (!status)
			{
				return null;
			}

			if (user.isCollaber)
			{
				return BadgeCounter({
					testId: this.getTestId('status-badge'),
					value: status,
					design: BadgeCounterDesign.SUCCESS,
					size: BadgeCounterSize.S,
					style: {
						marginTop: Indent.XS.toNumber(),
					},
				});
			}

			if (user.isExtranet)
			{
				return BadgeCounter({
					testId: this.getTestId('status-badge'),
					value: status,
					design: BadgeCounterDesign.PRIMARY_EFFECTIVINESS,
					size: BadgeCounterSize.S,
					style: {
						marginTop: Indent.XS.toNumber(),
					},
				});
			}

			return Text4({
				text: status,
				testId: this.getTestId('status'),
				color: textColor,
				numberOfLines: 1,
				ellipsize: 'end',
				style: {
					marginTop: Indent.XS2.toNumber(),
				},
			});
		}

		getStatus(user)
		{
			if (user?.isAdmin)
			{
				return Loc.getMessage('USER_CARD_ADMIN_STATUS');
			}

			if (user?.isCollaber)
			{
				return Loc.getMessage('USER_CARD_COLLABER_STATUS');
			}

			if (user?.isExtranet)
			{
				return Loc.getMessage('USER_CARD_EXTRANET_STATUS');
			}

			return user?.workPosition || null;
		}

		/**
		 * @param {CurrentTheme} theme
		 * @return {boolean}
		 */
		isLightTheme(theme)
		{
			if (!theme || !theme.id)
			{
				return false;
			}

			const baseThemeId = theme.id.split(':')[0];

			return baseThemeId === 'light';
		}

		/**
		 * @param {CurrentTheme} theme
		 * @return {Color}
		 */
		getTextColorByTheme(theme)
		{
			if (!theme)
			{
				return Color.base1;
			}

			if (this.isLightTheme(theme))
			{
				return Color.baseWhiteFixed;
			}

			return Color.baseBlackFixed;
		}

		renderGradientOverlay(color)
		{
			return View(
				{
					style: {
						borderRadius: Component.cardCornerL.toNumber() || 22,
						backgroundColorGradient: {
							start: transparent(color, 0.2),
							end: transparent(color, 0.8),
							angle: 90,
						},

						position: 'absolute',
						top: 0,
						left: 0,
						bottom: 0,
						right: 0,
					},
				},
			);
		}
	}

	const mapStateToProps = (state, props) => {
		return {
			user: usersSelector.selectById(state, props.userId),
		};
	};

	const mapDispatchToProps = (dispatch) => {
		return {
			updateProfilePhoto: (userId, image, base64) => dispatch(updateProfilePhoto({ userId, image, base64 })),
		};
	};

	UserCard.propTypes = {
		userId: PropTypes.number.isRequired,
		user: PropTypes.object.isRequired,
		canEditProfile: PropTypes.bool,
		clickable: PropTypes.bool,
		currentTheme: PropTypes.object.isRequired,
		updateProfilePhoto: PropTypes.func.isRequired,
		testId: PropTypes.string,
	};

	UserCard.defaultProps = {
		canEditProfile: false,
		clickable: true,
		testId: 'user-card',
	};

	module.exports = {
		UserCardClass: UserCard,
		UserCard: connect(mapStateToProps, mapDispatchToProps)(UserCard),
	};
});
