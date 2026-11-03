/**
 * @module more-menu/block/company/users
 */
jn.define('more-menu/block/company/users', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Loc } = require('loc');
	const { Indent, Color, Corner, Component } = require('tokens');
	const { inAppUrl } = require('in-app-url');
	const { requireLazy } = require('require-lazy');

	const { Text2, Text3 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const {
		ChipButton,
		ChipButtonSize,
		ChipButtonMode,
		ChipButtonDesign,
	} = require('ui-system/blocks/chips/chip-button');
	const { Card, CardCorner, CardDesign } = require('ui-system/layout/card');
	const { AvatarStack } = require('ui-system/blocks/avatar-stack');
	const { BadgeCounter, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');

	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { RefRegistry } = require('more-menu/ref-registry');
	const { getCardBorderColor } = require('more-menu/block/company/card-border');
	const { PureComponent } = require('layout/pure-component');

	// One row of the menu holds four avatars; the card of the section shares the row with the invite
	// button, so three is what stays readable there.
	const MENU_VISIBLE_ENTITY_COUNT = 4;
	const HUB_VISIBLE_ENTITY_COUNT = 3;

	const MENU_AVATAR_SIZE = 24;
	const HUB_AVATAR_SIZE = 33;
	// the row of the title of a two-row card: enough for the line of the title and the chevron beside it
	const HUB_TITLE_ROW_HEIGHT = 28;
	const HUB_CHEVRON_SIZE = 24;
	// The ring around every avatar is a cutout down to the surface under the stack, so the card names
	// both its width and its tone: the stack picks neither by itself.
	const HUB_AVATAR_STACK_OUTLINE = Indent.XS2;
	// The row of the stack keeps this height whether the stack is drawn there or not: a preview of one
	// employee draws no stack, and the card must stand as tall as the one that does.
	const HUB_STACK_ROW_HEIGHT = HUB_AVATAR_SIZE + HUB_AVATAR_STACK_OUTLINE.toNumber();
	// Both rows that take a tap - the title with its chevron and the stack of the avatars - are drawn
	// shorter than a finger needs, so each of them stands in a row of the minimum height with its content
	// centred. The room that appears inside is paid for by the gap between the rows, which the height of
	// the rows now carries itself.
	const MIN_TAP_TARGET = 44;
	// What the rows of the minimum height add above the drawn content: half of the difference at the top of
	// the first row and half at the bottom of the last one. The card takes that much off its own padding,
	// so the air inside stays the one it had before the targets grew.
	const tapAirAround = (drawnHeight) => Math.max(Math.ceil((MIN_TAP_TARGET - drawnHeight) / 2), 0);
	const MENU_INVITE_REF_KEY = 'company_users_invite_button';
	const HUB_EMPLOYEES_REF_KEY = 'my_company_employees_card';
	const HIGHLIGHT_BORDER_WIDTH = 3;
	const HIGHLIGHT_CORNER_RADIUS = CardCorner.L.toNumber();
	const HIGHLIGHT_FADE_DURATION = 450;
	const HIGHLIGHT_HOLD_DURATION = 150;
	const HIGHLIGHT_PAUSE_DURATION = 120;
	/**
	 * @typedef {Object} EmployeesInfo
	 * @property {Array<{id: number, fullName: ?string, name: ?string, avatarSize100: ?string}>} users
	 *           preview of the employees, not longer than the stack of the menu
	 * @property {number} totalUsersCount
	 */
	/**
	 * @class MoreMenuUsers
	 */
	class MoreMenuUsers extends PureComponent
	{
		/**
		 * @param props
		 * @param {?EmployeesInfo} props.employees the payload of the card, handed over by its owner
		 * @param {object} props.layout
		 * @param {boolean} props.canInvite
		 * @param {boolean} props.canUseTelephony
		 * @param {string} props.testId
		 * @param {boolean} [props.hubDesign] look of the "My company" section instead of the menu one
		 * @param {boolean} [props.highlighted] the section asks for the highlight, once and for good
		 * @param {function} [props.onHighlightComplete] the highlight is over, or is never going to run
		 * @param {function} [props.onCardClick] a row of the card was tapped
		 */
		constructor(props)
		{
			super(props);
			this.isHighlightAnimationStarted = false;
			this.highlightTimers = [];

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});

			this.openUsers = this.openUsers.bind(this);
			this.openInvite = this.openInvite.bind(this);
			this.setHubCardRef = this.setHubCardRef.bind(this);
			this.setHighlightRef = this.setHighlightRef.bind(this);
			this.setInviteButtonRef = this.setInviteButtonRef.bind(this);
		}

		componentDidMount()
		{
			if (this.props.hubDesign)
			{
				RefRegistry.register(HUB_EMPLOYEES_REF_KEY, this.hubCardRef);
				this.#tryAnimateHighlight();

				return;
			}

			RefRegistry.register(MENU_INVITE_REF_KEY, this.inviteButtonRef);
		}

		/**
		 * The section hands the highlight over as an intention and does not take it back, so the card
		 * itself picks the moment: the very frame it stands with its data, and never a second time. A
		 * card that got no preview lets the intention go instead - there is nothing left to draw the
		 * eye to, and the section is waiting to hear that the highlight is over.
		 */
		#tryAnimateHighlight()
		{
			const { employees, highlighted } = this.props;

			if (!highlighted || this.isHighlightAnimationStarted)
			{
				return;
			}

			this.isHighlightAnimationStarted = true;

			// nothing on the card to draw the eye to: the answer of the section carried no preview
			if (!employees || !this.highlightRef)
			{
				this.props.onHighlightComplete?.();

				return;
			}

			const firstFadeOutAt = HIGHLIGHT_FADE_DURATION + HIGHLIGHT_HOLD_DURATION;
			const secondFadeInAt = firstFadeOutAt + HIGHLIGHT_FADE_DURATION + HIGHLIGHT_PAUSE_DURATION;
			const secondFadeOutAt = secondFadeInAt + HIGHLIGHT_FADE_DURATION + HIGHLIGHT_HOLD_DURATION;
			const completeAt = secondFadeOutAt + HIGHLIGHT_FADE_DURATION;

			this.#animateHighlight(1);
			this.#scheduleHighlightAnimation(0, firstFadeOutAt);
			this.#scheduleHighlightAnimation(1, secondFadeInAt);
			this.#scheduleHighlightAnimation(0, secondFadeOutAt);
			this.highlightTimers.push(setTimeout(() => {
				this.props.onHighlightComplete?.();
			}, completeAt));
		}

		#scheduleHighlightAnimation(opacity, delay)
		{
			this.highlightTimers.push(setTimeout(() => {
				this.#animateHighlight(opacity);
			}, delay));
		}

		#animateHighlight(opacity)
		{
			this.highlightRef?.animate({
				opacity,
				duration: HIGHLIGHT_FADE_DURATION,
			});
		}

		componentWillUnmount()
		{
			this.highlightTimers.forEach((timer) => clearTimeout(timer));

			try
			{
				RefRegistry.unregister(this.props.hubDesign ? HUB_EMPLOYEES_REF_KEY : MENU_INVITE_REF_KEY);
			}
			catch (e)
			{
				console.error('RefRegistry unregister error', e);
			}
		}

		render()
		{
			return this.props.hubDesign ? this.renderHubCard() : this.renderMenuCard();
		}

		/**
		 * Look of the company block of the "More" menu: title, stack and invite button in one row.
		 */
		renderMenuCard()
		{
			const canInvite = this.#canInvite();

			return Card(
				{
					testId: this.getTestId('card'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexGrow: 2,
						borderRadius: Corner.XL.toNumber(),
						backgroundColor: Color.bgContentSecondaryInvert.toHex(),
					},
					design: CardDesign.PRIMARY,
					border: false,
				},
				View(
					{
						style: {
							flexGrow: 2,
							flexDirection: 'row',
							alignItems: 'center',
							height: 28,
						},
						onClick: this.openUsers,
					},
					Text3({
						testId: this.getTestId('title'),
						text: Loc.getMessage('MORE_MENU_COMPANY_USERS_TITLE'),
						color: Color.base1,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							flexShrink: 2,
						},
					}),
					this.renderInvitationCounter(),
					this.renderChevron(),
				),
				this.shouldShowAvatarStack() && this.renderAvatarStack(MENU_AVATAR_SIZE),
				canInvite && this.renderInviteButton(),
			);
		}

		/**
		 * Look of the "My company" section: what shares the row with the title is decided by the stack of
		 * the avatars. A stack and an invite button do not fit one row together, so a card that draws the
		 * stack moves the button to a row of its own; a card with no stack keeps the button on the line
		 * of the title, at the right edge. Without the right to invite the row ends with the stack, or
		 * with nothing at all.
		 *
		 * The surface under all of it is an ordinary card of the design system: on the wallpaper the texts
		 * of the block depended on the bundle of the appearance the user had chosen, and the contrast of
		 * them could not be measured at all.
		 */
		renderHubCard()
		{
			const withInviteButton = this.#canInvite();
			const withStack = this.shouldShowAvatarStack();
			const isSingleRow = !withInviteButton || !withStack;

			const topAir = tapAirAround(isSingleRow ? HUB_STACK_ROW_HEIGHT : HUB_TITLE_ROW_HEIGHT);
			const bottomAir = isSingleRow ? topAir : tapAirAround(HUB_STACK_ROW_HEIGHT);

			return View(
				{
					style: {
						flexGrow: 2,
						position: 'relative',
					},
				},
				Card(
					{
						testId: this.getTestId('card'),
						ref: this.setHubCardRef,
						corner: CardCorner.L,
						border: true,
						borderColor: getCardBorderColor(),
						style: {
							flexDirection: isSingleRow ? 'row' : 'column',
							alignItems: isSingleRow ? 'center' : 'stretch',
							paddingTop: Math.max(Component.cardPaddingT.toNumber() - topAir, 0),
							paddingBottom: Math.max(Component.cardPaddingB.toNumber() - bottomAir, 0),
						},
					},
					this.renderHubTitleRow(isSingleRow),
					this.#renderHubTrailing(isSingleRow, withInviteButton),
				),
				this.renderHubHighlight(),
			);
		}

		/**
		 * What ends the card: the invite button on the line of the title, the stack next to it, or the
		 * whole row of actions underneath.
		 *
		 * @param {boolean} isSingleRow
		 * @param {boolean} withInviteButton
		 * @return {?object}
		 */
		#renderHubTrailing(isSingleRow, withInviteButton)
		{
			if (!isSingleRow)
			{
				return this.renderHubActionsRow();
			}

			return withInviteButton ? this.renderHubInviteButton() : this.renderHubStack();
		}

		/**
		 * @return {boolean}
		 */
		#canInvite()
		{
			return Boolean(this.props.canInvite);
		}

		/**
		 * The ring of the highlight runs along the outer edge of the block. There is no pane with a rim
		 * of its own under the content any more, so the ring names a corner of its own instead of taking
		 * it from that rim.
		 */
		renderHubHighlight()
		{
			if (!this.props.highlighted)
			{
				return null;
			}

			return View({
				testId: this.getTestId('highlight'),
				ref: this.setHighlightRef,
				clickable: false,
				style: {
					position: 'absolute',
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
					opacity: 0,
					borderWidth: HIGHLIGHT_BORDER_WIDTH,
					borderColor: Color.accentMainPrimary.toHex(),
					borderRadius: HIGHLIGHT_CORNER_RADIUS,
				},
			});
		}

		setHubCardRef(ref)
		{
			this.hubCardRef = ref;
		}

		setHighlightRef(ref)
		{
			this.highlightRef = ref;
		}

		setInviteButtonRef(ref)
		{
			this.inviteButtonRef = ref;
		}

		/**
		 * @param {boolean} isSingleRow the row is the whole card: it takes the spare width and holds the
		 *   height of the stack of the avatars, drawn there or not, so the card keeps that height either
		 *   way and the invite button of a card with no stack stands on the line of the title
		 */
		renderHubTitleRow(isSingleRow)
		{
			const drawnHeight = isSingleRow ? HUB_STACK_ROW_HEIGHT : HUB_TITLE_ROW_HEIGHT;

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexGrow: isSingleRow ? 2 : 0,
						height: Math.max(drawnHeight, MIN_TAP_TARGET),
					},
					onClick: this.openUsers,
				},
				Text2({
					testId: this.getTestId('title'),
					text: Loc.getMessage('MORE_MENU_COMPANY_USERS_TITLE'),
					color: Color.base1,
					accent: true,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexShrink: 2,
					},
				}),
				this.renderInvitationCounter(true),
				this.renderHubChevron(),
				// the counter follows the title, so the space up to the right edge belongs here: it is what
				// pushes the stack or the invite button of the card against that edge
				View({ style: { flexGrow: 1 } }),
			);
		}

		renderHubActionsRow()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				this.renderHubStack(),
				View({
					style: {
						flexGrow: 2,
					},
				}),
				this.renderHubInviteButton(),
			);
		}

		/**
		 * The stack of the section, or `false` when there is no preview to draw. The room is held by
		 * `renderHubTitleRow()` through `HUB_STACK_ROW_HEIGHT`, not here.
		 */
		renderHubStack()
		{
			if (!this.shouldShowAvatarStack())
			{
				return false;
			}

			// the stack is a component of the design system and states its own size, so the row around it is
			// what takes the tap
			return View(
				{
					onClick: this.openUsers,
					style: {
						height: MIN_TAP_TARGET,
						justifyContent: 'center',
					},
				},
				this.renderAvatarStack(HUB_AVATAR_SIZE, {
					outline: HUB_AVATAR_STACK_OUTLINE,
					backgroundColor: Color.bgContentPrimary,
				}),
			);
		}

		renderHubInviteButton()
		{
			return ChipButton({
				testId: this.getTestId('invite-button'),
				text: Loc.getMessage('MORE_MENU_COMPANY_USERS_INVITE'),
				icon: Icon.ADD_PERSON,
				size: ChipButtonSize.L,
				// tinted rather than solid: the invitation shares the screen with the call of the tariff, and
				// two solid buttons of the same weight competed for the first look
				mode: ChipButtonMode.TINTED,
				design: ChipButtonDesign.PRIMARY,
				rounded: false,
				badge: this.getInviteButtonBadge(),
				onClick: this.openInvite,
				forwardRef: this.setInviteButtonRef,
			});
		}

		/**
		 * The counter of the invitations still waiting for an answer. In the section it follows the title
		 * the way the counter of the news does, so both cards of the hub wear it the same.
		 *
		 * @param {boolean} [hubDesign] look of the "My company" section instead of the menu one
		 */
		renderInvitationCounter(hubDesign = false)
		{
			const { counters } = this.props;
			const totalInvitation = counters?.total_invitation ?? 0;

			if (!totalInvitation)
			{
				return null;
			}

			return BadgeCounter({
				testId: this.getTestId('total-invitation-counter'),
				value: totalInvitation,
				design: BadgeCounterDesign.ALERT,
				showRawValue: hubDesign,
				style: {
					flexShrink: 0,
					marginLeft: (hubDesign ? Indent.M : Indent.XS).toNumber(),
				},
			});
		}

		/**
		 * The chevron of the section: the size of the one the "enable demo" plate wears, in the colour of
		 * the title it follows.
		 */
		renderHubChevron()
		{
			return IconView({
				testId: this.getTestId('hub-chevron'),
				icon: Icon.CHEVRON_TO_THE_RIGHT,
				color: Color.base1,
				size: HUB_CHEVRON_SIZE,
				style: {
					marginLeft: Indent.XS.toNumber(),
				},
			});
		}

		renderChevron()
		{
			return IconView({
				testId: this.getTestId('title-chevron'),
				size: 20,
				icon: Icon.CHEVRON_TO_THE_RIGHT,
				color: Color.base1,
				resizeMode: 'cover',
				style: {
					marginTop: 2,
					width: 10,
					height: 16,
					marginLeft: Indent.XS.toNumber(),
				},
			});
		}

		/**
		 * @param {number} size
		 * @param {{ outline?: Indent, backgroundColor?: Color }} [ring] the ring around the avatars
		 */
		renderAvatarStack(size, { outline, backgroundColor } = {})
		{
			return AvatarStack({
				testId: this.getTestId('avatar-stack'),
				entities: this.getEntities(),
				size,
				outline,
				backgroundColor,
				withRedux: true,
				visibleEntityCount: this.getVisibleEntityCount(),
				onClick: this.openUsers,
			});
		}

		/**
		 * The stack and the filler of `getEntities` read one number: the rest behind the counter is
		 * measured from the very limit the stack draws.
		 *
		 * @return {number}
		 */
		getVisibleEntityCount()
		{
			return this.props.hubDesign ? HUB_VISIBLE_ENTITY_COUNT : MENU_VISIBLE_ENTITY_COUNT;
		}

		/**
		 * An id alone is enough only where the shared user storage already knows the person: the avatar
		 * takes the name it draws the letters from out of that storage. The owner of the card warms that
		 * storage up with the very same preview, and the entity carries the name and the photo of the
		 * payload as well; the storage still wins whenever it does know the user.
		 * The filler stays a bare id: it is nobody, it only lifts the length of the stack up to the total
		 * count the rest counter is measured from.
		 *
		 * @return {Array<number|{id: number, name: string, uri: string}>}
		 */
		getEntities()
		{
			const { employees } = this.props;
			const users = employees?.users || [];
			const totalUsersCount = employees?.totalUsersCount || 0;

			const entities = users.map((user) => MoreMenuUsers.toStackEntity(user));

			if (totalUsersCount > users.length && users.length >= this.getVisibleEntityCount())
			{
				const restCount = totalUsersCount - users.length;
				entities.push(...Array.from({ length: restCount }).fill(env.userId)); // add fake items to show rest count
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

		renderInviteButton()
		{
			if (this.shouldShowAvatarStack())
			{
				return Button({
					testId: this.getTestId('invite-button'),
					size: ButtonSize.S,
					leftIcon: Icon.PLUS,
					design: ButtonDesign.PLAN_ACCENT,
					style: {
						marginLeft: Indent.S.toNumber(),
					},
					onClick: this.openInvite,
					badge: this.getInviteButtonBadge(),
					forwardRef: this.setInviteButtonRef,
				});
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Button({
					testId: this.getTestId('invite-button'),
					size: ButtonSize.S,
					design: ButtonDesign.FILLED,
					style: {
						marginLeft: Indent.S.toNumber(),
					},
					onClick: this.openInvite,
					text: Loc.getMessage('MORE_MENU_COMPANY_USERS_INVITE'),
					backgroundColor: Color.accentMainPrimary,
					badge: this.getInviteButtonBadge(),
					forwardRef: this.setInviteButtonRef,
				}),
			);
		}

		shouldShowAvatarStack()
		{
			const { employees } = this.props;
			const users = employees?.users || [];

			return Array.isArray(users) && users.length > 1;
		}

		getInviteButtonBadge()
		{
			const { counters } = this.props;
			const menuInvite = counters?.menu_invite ?? 0;
			const totalInvitation = counters?.total_invitation ?? 0;

			if (!menuInvite || totalInvitation > 0)
			{
				return null;
			}

			return BadgeCounter({
				testId: this.getTestId('invite-button-counter'),
				value: menuInvite,
				design: BadgeCounterDesign.ALERT,
			});
		}

		openUsers()
		{
			this.props.onCardClick?.('users');

			inAppUrl.open('/intranetmobile/users', {
				title: Loc.getMessage('MORE_MENU_COMPANY_USERS_TITLE'),
				canInvite: this.#canInvite(),
				canUseTelephony: Boolean(this.props.canUseTelephony),
				parentWidget: this.props.layout,
			});
		}

		async openInvite()
		{
			this.props.onCardClick?.('invite');

			const { layout } = this.props;
			const { openIntranetInviteWidget } = await requireLazy('intranet:invite-opener-new') || {};
			if (openIntranetInviteWidget)
			{
				openIntranetInviteWidget({
					analytics: new AnalyticsEvent().setSection('ava_menu'),
					parentLayout: layout,
				});
			}
			else
			{
				console.error('Invite opener not found');
			}
		}
	}

	MoreMenuUsers.propTypes = {
		employees: PropTypes.object,
		layout: PropTypes.object.isRequired,
		canInvite: PropTypes.bool,
		canUseTelephony: PropTypes.bool,
		testId: PropTypes.string.isRequired,
		hubDesign: PropTypes.bool,
		highlighted: PropTypes.bool,
		onHighlightComplete: PropTypes.func,
		onCardClick: PropTypes.func,
	};

	MoreMenuUsers.defaultProps = {
		hubDesign: false,
		highlighted: false,
		onHighlightComplete: null,
	};

	module.exports = { MoreMenuUsers };
});
