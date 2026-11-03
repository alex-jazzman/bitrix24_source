/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/src/project-info/link
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/src/project-info/link', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Text4 } = require('ui-system/typography');
	const { IconView, Icon } = require('ui-system/blocks/icon');

	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const ICON_SIZE = 24;
	const PROJECT_INFO_EXTENSION = 'im:messenger/controller/sidebar-v2/controller/collab/project-info';

	// A sheet that the native layer refuses answers nothing at all: BottomSheet.open() swallows
	// that rejection and its promise never settles. So the guard against a second tap expires by
	// itself after the time an opening takes - a refused sheet must not leave the row dead to
	// every further tap.
	const OPEN_GUARD_TIMEOUT = 3000;

	// The guard has to outlive the row it guards: the panel rebuilds this component on every
	// redraw, and the answer that fills the fields triggers one - exactly while the sheet is
	// opening. Kept per dialog, so the row of one chat does not hold the row of another.
	const openingStartedAt = new Map();

	/**
	 * @param {DialogId} dialogId
	 * @return {boolean}
	 */
	function isOpening(dialogId)
	{
		const startedAt = openingStartedAt.get(dialogId);

		if (startedAt === undefined)
		{
			return false;
		}

		if (Date.now() - startedAt < OPEN_GUARD_TIMEOUT)
		{
			return true;
		}

		openingStartedAt.delete(dialogId);

		return false;
	}

	/**
	 * The way into the project info: one row of the panel, in the same shape as the invitation link
	 * below it - an accent icon and an accent phrase, with nothing drawn around them. The fields
	 * themselves live in the sheet it opens; a panel that previewed two of them had to crop both.
	 *
	 * @extends {LayoutComponent<ProjectInfoLinkProps>}
	 */
	class ProjectInfoLink extends LayoutComponent
	{
		render()
		{
			return View(
				{
					testId: 'project-info-link',
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: Indent.XL.toNumber(),
						paddingBottom: Indent.XS.toNumber(),
					},
					onClick: () => this.#open(),
				},
				IconView({
					testId: 'project-info-link-icon',
					icon: Icon.INFO_CIRCLE,
					size: ICON_SIZE,
					color: Color.accentMainPrimary,
				}),
				Text4({
					testId: 'project-info-link-text',
					text: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_LINK'),
					color: Color.accentMainPrimary,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flex: 1,
						marginLeft: Indent.XL.toNumber(),
					},
				}),
			);
		}

		/**
		 * A tap while the sheet is already on its way would open a second one over it.
		 *
		 * @return {boolean}
		 */
		get opening()
		{
			return isOpening(this.props.dialogId);
		}

		#open()
		{
			const dialogId = this.props.dialogId;

			if (isOpening(dialogId))
			{
				return;
			}

			const startedAt = Date.now();
			openingStartedAt.set(dialogId, startedAt);

			// The sheet answers once it is on the screen, and the tap that opened it is done by
			// then: whichever way that promise settles, the row lets go of its own guard. An opening
			// that outlives the window must leave alone the window armed by the tap after it.
			const release = () => {
				if (openingStartedAt.get(dialogId) === startedAt)
				{
					openingStartedAt.delete(dialogId);
				}
			};

			void this.props.loadProjectInfo();

			globalThis.requireLazy(PROJECT_INFO_EXTENSION, false)
				.then((extension) => extension?.ProjectInfoModal?.open({
					store: this.props.store,
					storeManager: this.props.storeManager,
					dialogId,
					description: this.props.description,
					parentWidget: this.props.parentWidget,
				}))
				.then(release)
				.catch(release)
			;
		}
	}

	module.exports = { ProjectInfoLink, OPEN_GUARD_TIMEOUT, PROJECT_INFO_EXTENSION };
});
