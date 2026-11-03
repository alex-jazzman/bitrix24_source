/**
 * @module more-menu/block/company/specialists
 */
jn.define('more-menu/block/company/specialists', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Indent, Color, Corner } = require('tokens');
	const { requireLazy } = require('require-lazy');

	const { Text3, Text5 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const {
		ChipButton,
		ChipButtonSize,
		ChipButtonMode,
		ChipButtonDesign,
	} = require('ui-system/blocks/chips/chip-button');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { AvatarStack } = require('ui-system/blocks/avatar-stack');

	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');

	const { getCardBorderColor } = require('more-menu/block/company/card-border');
	const { SpecialistsInviteBox } = require('more-menu/block/company/specialists/src/invite-box');

	const VISIBLE_ENTITY_COUNT = 3;

	const ICON_SIZE = 24;
	const ICON_BOX_SIZE = 38;
	// The stack wraps every avatar in a ring of its own - four points at this size, `AvatarStack.getOutline` -
	// so the circle it draws is the size plus that ring. Thirty-four makes that circle 38, the diameter
	// the icon box of this card and of the integrator standing next to it both keep.
	const AVATAR_SIZE = 34;

	/**
	 * @class ImplementationSpecialists
	 */
	class ImplementationSpecialists extends PureComponent
	{
		/**
		 * @param props
		 * @param {object} props.section implementationSpecialists section, null when unavailable
		 * @param {boolean} props.section.canView
		 * @param {boolean} props.section.canInvite
		 * @param {boolean} props.section.canInviteMore
		 * @param {boolean} props.section.canInviteNew server-side availability of a brand-new invitation
		 * @param {boolean} props.section.isRenamed
		 * @param {number} props.section.totalCount
		 * @param {Array<{id: number, fullName: string, avatarSize100: ?string}>} props.section.users
		 *        preview, not longer than the license limit
		 * @param {object} props.layout
		 * @param {string} props.testId
		 * @param {Function} [props.onRefresh] reloads the section after a successful invite
		 * @param {Function} [props.onCardClick] the tile was tapped, whichever of its states drew it
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});

			this.openList = this.openList.bind(this);
			this.openInvite = this.openInvite.bind(this);
			this.handleInviteSuccess = this.handleInviteSuccess.bind(this);

			this.openListRequest = null;
		}

		render()
		{
			const { section } = this.props;
			if (!section)
			{
				return View({ style: { height: 0 } });
			}

			// JaNative keeps the previously rendered native views when a mounted component re-renders
			// into null, so the card would stay on screen until the app restarts. An empty View gives
			// the reconciliation something to replace - same reason as in SpecialistsList slots.
			return (this.isPromoState() ? this.renderPromo() : this.renderSpecialists()) ?? View({ style: { height: 0 } });
		}

		isPromoState()
		{
			const { canView, totalCount } = this.props.section;

			return !canView || totalCount === 0;
		}

		/**
		 * A half-width tile built the same way as the integrator standing next to it - icon on top, the
		 * pitch underneath, the invite chip at the bottom edge. Blue is what tells the pair apart: the
		 * integrator owns the green one.
		 */
		renderPromo()
		{
			if (!this.shouldShowInviteButton())
			{
				return null;
			}

			return Card(
				{
					testId: this.getTestId('promo'),
					onClick: this.openInvite,
					style: {
						// the tile takes the height of its pair and keeps the chip at its bottom edge
						flexGrow: 1,
						justifyContent: 'space-between',
						borderRadius: Corner.XL.toNumber(),
					},
					design: CardDesign.PRIMARY,
					border: true,
					borderColor: getCardBorderColor(),
				},
				View(
					{
						testId: this.getTestId('promo-content'),
					},
					View(
						{
							testId: this.getTestId('promo-icon-wrapper'),
							style: {
								width: ICON_BOX_SIZE,
								height: ICON_BOX_SIZE,
								borderRadius: ICON_BOX_SIZE / 2,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColorGradient: {
									angle: 135,
									start: Color.accentSoftBlue3.toHex(),
									end: Color.accentSoftBlue1.toHex(),
								},
							},
						},
						IconView({
							testId: this.getTestId('promo-icon'),
							icon: Icon.ADD_PERSON,
							color: Color.accentMainPrimary,
							size: ICON_SIZE,
						}),
					),
					Text3({
						testId: this.getTestId('promo-title'),
						text: this.getPromoTitle(),
						color: Color.base1,
						accent: true,
						style: {
							marginTop: Indent.M.toNumber(),
						},
					}),
					Text5({
						testId: this.getTestId('promo-subtitle'),
						text: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_PROMO_SUBTITLE'),
						color: Color.base2,
						style: {
							marginTop: Indent.XS.toNumber(),
						},
					}),
				),
				ChipButton({
					testId: this.getTestId('promo-button'),
					text: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_INVITE'),
					icon: Icon.PLUS,
					size: ChipButtonSize.M,
					mode: ChipButtonMode.TINTED,
					design: ChipButtonDesign.PRIMARY,
					rounded: false,
					onClick: this.openInvite,
					style: {
						alignSelf: 'flex-start',
						marginTop: Indent.XL3.toNumber(),
					},
				}),
			);
		}

		/**
		 * The same tile as the promo one, stacked top to bottom: the title, the specialists already
		 * invited and the invitation at the bottom edge, where the promo keeps its chip.
		 */
		renderSpecialists()
		{
			return Card(
				{
					testId: this.getTestId('card'),
					style: {
						flexGrow: 1,
						justifyContent: 'space-between',
						borderRadius: Corner.XL.toNumber(),
					},
					design: CardDesign.PRIMARY,
					border: true,
					borderColor: getCardBorderColor(),
					onClick: this.openList,
				},
				View(
					{
						testId: this.getTestId('content'),
					},
					Text3({
						testId: this.getTestId('title'),
						text: this.getTitle(),
						color: Color.base1,
						accent: true,
						numberOfLines: 2,
						ellipsize: 'end',
					}),
					AvatarStack({
						testId: this.getTestId('avatar-stack'),
						entities: this.getEntities(),
						size: AVATAR_SIZE,
						withRedux: true,
						visibleEntityCount: VISIBLE_ENTITY_COUNT,
						onClick: this.openList,
						style: {
							marginTop: Indent.M.toNumber(),
						},
					}),
				),
				this.shouldShowInviteButton() && this.renderInviteButton(),
			);
		}

		renderInviteButton()
		{
			return ChipButton({
				testId: this.getTestId('invite-button'),
				text: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_INVITE'),
				icon: Icon.PLUS,
				size: ChipButtonSize.M,
				mode: ChipButtonMode.TINTED,
				design: ChipButtonDesign.PRIMARY,
				rounded: false,
				onClick: this.openInvite,
				style: {
					alignSelf: 'flex-start',
					marginTop: Indent.XL3.toNumber(),
				},
			});
		}

		shouldShowInviteButton()
		{
			return Boolean(this.props.section.canInviteNew);
		}

		/**
		 * An id alone is enough only where the shared user storage already knows the person: the avatar
		 * takes the name it draws the letters from out of that storage. The section runs in its own JS
		 * context and nothing puts the specialists there, so the entity carries the name and the photo of
		 * the payload itself - the storage still wins whenever it does know the user.
		 *
		 * @return {Array<number|{id: number, name: string, uri: string}>}
		 */
		getEntities()
		{
			const { users = [], totalCount = 0 } = this.props.section;
			const entities = users.map((user) => ImplementationSpecialists.toStackEntity(user));

			if (totalCount > entities.length && entities.length >= VISIBLE_ENTITY_COUNT)
			{
				const restCount = totalCount - entities.length;
				entities.push(...Array.from({ length: restCount }).fill(env.userId));
			}

			return entities;
		}

		/**
		 * @param {{id: number, fullName: ?string, name: ?string, avatarSize100: ?string}} user
		 * @return {{id: number, name: string, uri: string}}
		 */
		static toStackEntity(user)
		{
			const entity = { id: user.id };
			const name = user.fullName || user.name;

			if (name)
			{
				entity.name = name;
			}

			if (user.avatarSize100)
			{
				entity.uri = user.avatarSize100;
			}

			return entity;
		}

		getTitle()
		{
			const { isRenamed } = this.props.section;

			return isRenamed
				? Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_TITLE_RENAMED')
				: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_TITLE');
		}

		getPromoTitle()
		{
			const { isRenamed } = this.props.section;

			return isRenamed
				? Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_PROMO_TITLE_RENAMED')
				: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_PROMO_TITLE');
		}

		openList()
		{
			this.props.onCardClick?.();

			if (!this.openListRequest)
			{
				this.openListRequest = this.#openList().finally(() => {
					this.openListRequest = null;
				});
			}

			return this.openListRequest;
		}

		async #openList()
		{
			const { SpecialistsList } = await requireLazy('more-menu/block/company/specialists/list') || {};
			if (!SpecialistsList)
			{
				console.error('Specialists list not found');

				return;
			}

			const { section, layout, onRefresh } = this.props;

			await SpecialistsList.open({ section, layout, onRefresh });
		}

		openInvite()
		{
			this.props.onCardClick?.();

			const { layout, section } = this.props;

			SpecialistsInviteBox.open({
				layout,
				isRenamed: Boolean(section && section.isRenamed),
				onSuccess: this.handleInviteSuccess,
			});
		}

		handleInviteSuccess()
		{
			const { onRefresh } = this.props;

			if (onRefresh)
			{
				onRefresh();
			}
		}
	}

	ImplementationSpecialists.propTypes = {
		section: PropTypes.shape({
			canView: PropTypes.bool,
			canInvite: PropTypes.bool,
			canInviteMore: PropTypes.bool,
			canInviteNew: PropTypes.bool,
			isRenamed: PropTypes.bool,
			totalCount: PropTypes.number,
			users: PropTypes.array,
		}),
		layout: PropTypes.object.isRequired,
		testId: PropTypes.string.isRequired,
		onRefresh: PropTypes.func,
		// the row of the section listens to the tap; the menu mounting the tile hands no handler over
		onCardClick: PropTypes.func,
	};

	module.exports = { ImplementationSpecialists };
});
