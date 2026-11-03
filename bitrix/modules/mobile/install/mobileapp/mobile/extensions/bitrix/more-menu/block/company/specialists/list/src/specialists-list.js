/**
 * @module more-menu/block/company/specialists/list/src/specialists-list
 */
jn.define('more-menu/block/company/specialists/list/src/specialists-list', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Text5 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { ChipStatus, ChipStatusDesign, ChipStatusMode } = require('ui-system/blocks/chips/chip-status');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { UIMenu } = require('layout/ui/menu');
	const { UserList } = require('layout/ui/user-list');
	const { BottomSheet } = require('bottom-sheet');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { confirmDestructiveAction } = require('alert');
	const { showToast, showErrorToast } = require('toast');
	const { createTestIdGenerator } = require('utils/test');
	const { ReactiveRowSlot } = require('more-menu/block/company/specialists/list/src/reactive-row-slot');
	const {
		SpecialistsListContent,
	} = require('more-menu/block/company/specialists/list/src/specialists-list-content');

	const RowAction = Object.freeze({
		REINVITE: 'reinvite',
		CANCEL_INVITE: 'cancelInvite',
	});

	const StatusKind = Object.freeze({
		PENDING: 'pending',
		INVITED: 'invited',
		CANCELLED: 'cancelled',
	});

	const REINVITE_ACTION = 'intranetmobile.employees.reinvite';
	const CANCEL_INVITE_ACTION = 'intranet.controller.invite.deleteInvitation';
	const LIST_DATA_ACTION = 'mobile.Menu.getImplementationSpecialistsList';

	/**
	 * @typedef {Object} SpecialistsRowState
	 * @property {boolean} [reinvited]
	 * @property {boolean} [reinviting]
	 * @property {boolean} [cancelling]
	 * @property {boolean} [removed]
	 *
	 * @class SpecialistsList
	 */
	class SpecialistsList
	{
		/**
		 * @public
		 * @param {Object} props
		 * @param {Object} props.section implementationSpecialists section
		 * @param {PageManager} [props.layout]
		 * @param {Function} [props.onRefresh] re-fetch of the more-menu after a successful row action
		 * @return {Promise}
		 */
		static open(props = {})
		{
			return new SpecialistsList(props).show();
		}

		/**
		 * @param {Object} props
		 * @param {Object} props.section
		 * @param {PageManager} [props.layout]
		 * @param {Function} [props.onRefresh]
		 */
		constructor(props = {})
		{
			this.section = props.section || {};
			this.layout = props.layout || null;
			this.onRefresh = typeof props.onRefresh === 'function' ? props.onRefresh : null;

			// Widget of the opened list itself; toasts must render on this layer, otherwise
			// they are hidden behind the list bottom-sheet. Captured from the render callbacks.
			this.listLayout = null;

			/** @type {Object<string, SpecialistsRowState>} */
			this.rowState = {};
			this.menuTargets = {};

			// user.id -> Set of slot invalidation callbacks; drives in-place row re-render.
			this.rowSlots = new Map();

			this.testId = createTestIdGenerator({ prefix: 'specialists-list' });
		}

		/**
		 * @return {Promise}
		 */
		show()
		{
			const totalCount = Number(this.section.totalCount) || 0;

			void new BottomSheet({
				titleParams: {
					text: this.getTitle(),
					type: 'dialog',
				},
				component: (widget) => {
					this.captureLayout(widget);

					return new SpecialistsListContent({
						load: () => this.loadListData(),
						onLoadError: () => this.handleListLoadError(widget),
						renderLoader: () => this.renderLoader(),
						renderList: () => this.renderList(widget),
					});
				},
			})
				.setParentWidget(this.layout || PageManager)
				.enableSwipe()
				.enableBounce()
				.disableShowOnTop()
				.enableResizeContent()
				.disableHorizontalSwipe()
				.setMediumPositionPercent(30 + Math.min(totalCount, 10) * 7)
				.disableOnlyMediumPosition()
				.open();

			return Promise.resolve();
		}

		/**
		 * Fetches the full list dataset (users + companion) on demand and stores it on the section.
		 * Rejects on a failed response so the content component can surface the error.
		 *
		 * @return {Promise}
		 */
		loadListData()
		{
			return SpecialistsList.runAction(LIST_DATA_ACTION, {})
				.then((response) => {
					if (!SpecialistsList.isSuccess(response))
					{
						throw new Error('failed to load implementation specialists list');
					}

					this.applyListData(response.data || {});
				});
		}

		/**
		 * @param {{ users?: Array, extra?: Object }} data
		 */
		applyListData(data)
		{
			this.section = {
				...this.section,
				users: Array.isArray(data.users) ? data.users : [],
				extra: data.extra || {},
			};
		}

		renderLoader()
		{
			return new LoadingScreenComponent({
				testId: this.testId('loader'),
				backgroundColor: Color.bgContentPrimary.toHex(),
			});
		}

		renderList(widget)
		{
			return new UserList({
				users: this.section.users || [],
				testId: this.testId(),
				parentWidget: widget,
				renderCustomDescription: (user) => this.renderCustomDescription(user),
				renderBelowBlock: (user, layout) => this.renderBelowBlock(user, layout),
				renderRightAction: (user, layout) => this.renderRightAction(user, layout),
				onItemLongClick: (user) => this.handleItemLongClick(user),
			});
		}

		handleListLoadError(widget)
		{
			if (widget && typeof widget.close === 'function')
			{
				widget.close();
			}

			showErrorToast({
				message: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_LOAD_ERROR'),
			}, this.layout);
		}

		getTitle()
		{
			return this.section.isRenamed
				? Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_TITLE_RENAMED')
				: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_TITLE');
		}

		renderCustomDescription(user)
		{
			const { integratorName } = this.getExtra(user.id);
			if (!integratorName)
			{
				return null;
			}

			return Text5({
				text: integratorName,
				color: Color.base2,
				numberOfLines: 1,
				ellipsize: 'end',
				testId: this.testId(`integrator-${user.id}`),
			});
		}

		/**
		 * Reactive below-block slot: re-renders in place when the row state changes, so a
		 * reinvite/cancel flips the status chip and the inline reinvite button without a reload.
		 */
		renderBelowBlock(user, layout)
		{
			this.captureLayout(layout);

			return new ReactiveRowSlot({
				subscribe: (invalidate) => this.subscribeRow(user.id, invalidate),
				renderContent: () => this.buildBelowBlock(user),
			});
		}

		/**
		 * Status chip and, right next to it, the reinvite quick-button - rendered below the
		 * name/description inside the user block (like the employees list bottom chips row).
		 */
		buildBelowBlock(user)
		{
			const rowState = this.getRowState(user.id);
			if (!this.getExtra(user.id).isPending)
			{
				return null;
			}

			const actions = SpecialistsList.getRowActions(user, this.section, rowState);

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexWrap: 'wrap',
						marginTop: Indent.XS.toNumber(),
					},
					testId: this.testId(`below-${user.id}`),
				},
				this.renderStatusChip(user, rowState),
				// getRowActions returns [] while the row is busy, so keep the loading reinvite button
				// visible for the in-flight reinvite itself.
				(actions.includes(RowAction.REINVITE) || rowState.reinviting) && this.renderReinviteButton(user),
			);
		}

		/**
		 * Reactive right-action slot: re-renders in place so the three-dots menu icon appears or
		 * disappears together with the below-block, staying in sync with the available actions.
		 */
		renderRightAction(user, layout)
		{
			this.captureLayout(layout);

			return new ReactiveRowSlot({
				subscribe: (invalidate) => this.subscribeRow(user.id, invalidate),
				renderContent: () => this.buildRightAction(user),
			});
		}

		/**
		 * Three-dots menu pinned to the far right of the whole cell (like the employees list).
		 * Opens a menu with every available row action.
		 */
		buildRightAction(user)
		{
			const rowState = this.getRowState(user.id);
			if (!this.getExtra(user.id).isPending || rowState.removed)
			{
				return null;
			}

			const actions = SpecialistsList.getRowActions(user, this.section, rowState);
			if (actions.length === 0)
			{
				return null;
			}

			return this.renderMenuIcon(user);
		}

		captureLayout(layout)
		{
			if (layout)
			{
				this.listLayout = layout;
			}
		}

		renderStatusChip(user, rowState)
		{
			const kind = SpecialistsList.getStatusKind(rowState);

			const textKey = {
				[StatusKind.INVITED]: 'MORE_MENU_COMPANY_SPECIALISTS_LIST_STATUS_INVITED',
				[StatusKind.CANCELLED]: 'MORE_MENU_COMPANY_SPECIALISTS_LIST_STATUS_CANCELLED',
			}[kind] || 'MORE_MENU_COMPANY_SPECIALISTS_LIST_STATUS_INVITE_NOT_ACCEPTED';

			const design = {
				[StatusKind.INVITED]: ChipStatusDesign.SUCCESS,
				[StatusKind.CANCELLED]: ChipStatusDesign.NEUTRAL,
			}[kind] || ChipStatusDesign.PRIMARY;

			return ChipStatus({
				text: Loc.getMessage(textKey),
				design,
				mode: ChipStatusMode.TINTED,
				style: {
					marginRight: Indent.S.toNumber(),
				},
				testId: this.testId(`status-${user.id}`),
			});
		}

		renderReinviteButton(user)
		{
			const isReinviting = Boolean(this.getRowState(user.id).reinviting);

			return ChipButton({
				icon: Icon.REFRESH,
				mode: ChipButtonMode.OUTLINE,
				design: ChipButtonDesign.GREY,
				compact: true,
				loading: isReinviting,
				disabled: isReinviting,
				onClick: () => this.handleReinvite(user),
				testId: this.testId(`reinvite-${user.id}`),
			});
		}

		renderMenuIcon(user)
		{
			return View(
				{
					style: {
						alignItems: 'center',
						justifyContent: 'center',
					},
					ref: (ref) => {
						this.menuTargets[user.id] = ref;
					},
					onClick: () => this.openRowMenu(user),
					testId: this.testId(`menu-${user.id}`),
				},
				IconView({
					icon: Icon.MORE,
					color: Color.base3,
					size: 24,
					testId: this.testId(`menu-icon-${user.id}`),
				}),
			);
		}

		handleItemLongClick(user)
		{
			const actions = SpecialistsList.getRowActions(user, this.section, this.getRowState(user.id));
			if (actions.length === 0)
			{
				return;
			}

			this.openRowMenu(user);
		}

		openRowMenu(user)
		{
			const items = this.getMenuItems(user);
			if (items.length === 0)
			{
				return;
			}

			const target = this.menuTargets[user.id];

			void new UIMenu(items).show(target ? { target } : {});
		}

		getMenuItems(user)
		{
			const actions = SpecialistsList.getRowActions(user, this.section, this.getRowState(user.id));

			return actions.map((action) => this.buildMenuItem(action, user));
		}

		buildMenuItem(action, user)
		{
			if (action === RowAction.REINVITE)
			{
				return {
					id: RowAction.REINVITE,
					title: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_ACTION_REINVITE'),
					iconName: Icon.REFRESH,
					onItemSelected: () => this.handleReinvite(user),
				};
			}

			return {
				id: RowAction.CANCEL_INVITE,
				title: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_ACTION_CANCEL_INVITE'),
				iconName: Icon.TRASHCAN,
				isDestructive: true,
				onItemSelected: () => this.handleCancelInvite(user),
			};
		}

		handleReinvite(user)
		{
			const userId = user.id;
			const rowState = this.getRowState(userId);
			// A shared busy lock: no reinvite while another write action of the same row is in flight.
			if (rowState.reinviting || rowState.cancelling)
			{
				return;
			}

			const extra = this.getExtra(userId);
			const isExtranetUser = Boolean(extra.isExtranetUser ?? user.isExtranet);

			// Lock the row action until the request settles so a double tap can't send a second invite.
			this.markRowState(userId, { reinviting: true });

			void SpecialistsList.runAction(REINVITE_ACTION, { userId, isExtranetUser })
				.then((response) => {
					if (!SpecialistsList.isSuccess(response))
					{
						this.markRowState(userId, { reinviting: false });
						showErrorToast({
							message: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_REINVITE_ERROR'),
						}, this.listLayout);

						return;
					}

					this.markRowState(userId, { reinviting: false, reinvited: true });
					showToast({
						message: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_REINVITE_SUCCESS'),
					}, this.listLayout);
					// No menu reload here: the row updates reactively and the card preview is unchanged.
				});
		}

		handleCancelInvite(user)
		{
			confirmDestructiveAction({
				title: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_CANCEL_INVITE_CONFIRM_TITLE'),
				description: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_CANCEL_INVITE_CONFIRM_DESCRIPTION'),
				destructionText: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_CANCEL_INVITE_CONFIRM_DESTRUCT'),
				onDestruct: () => this.cancelInvite(user),
			});
		}

		cancelInvite(user)
		{
			const userId = user.id;
			const rowState = this.getRowState(userId);
			// A shared busy lock: no cancel while a reinvite is in flight or the row is already removed.
			if (rowState.cancelling || rowState.reinviting || rowState.removed)
			{
				return;
			}

			// Lock the row action until the request settles so a double tap can't send a second cancel.
			this.markRowState(userId, { cancelling: true });

			void SpecialistsList.runAction(CANCEL_INVITE_ACTION, { params: { userId } })
				.then((response) => {
					if (!SpecialistsList.isSuccess(response))
					{
						this.markRowState(userId, { cancelling: false });
						showErrorToast({
							message: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_CANCEL_INVITE_ERROR'),
						}, this.listLayout);

						return;
					}

					this.markRowState(userId, { cancelling: false, removed: true });
					showToast({
						message: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_LIST_CANCEL_INVITE_SUCCESS'),
					}, this.listLayout);
					this.requestRefresh();
				});
		}

		getExtra(userId)
		{
			return (this.section.extra && this.section.extra[userId]) || {};
		}

		/**
		 * @param {string|number} userId
		 * @return {SpecialistsRowState}
		 */
		getRowState(userId)
		{
			return this.rowState[userId] || {};
		}

		markRowState(userId, patch)
		{
			this.rowState[userId] = { ...this.getRowState(userId), ...patch };
			this.invalidateRow(userId);
		}

		/**
		 * @param {string|number} userId
		 * @param {Function} invalidate
		 * @return {Function} unsubscribe
		 */
		subscribeRow(userId, invalidate)
		{
			let subscribers = this.rowSlots.get(userId);
			if (!subscribers)
			{
				subscribers = new Set();
				this.rowSlots.set(userId, subscribers);
			}
			subscribers.add(invalidate);

			return () => {
				const current = this.rowSlots.get(userId);
				if (!current)
				{
					return;
				}

				current.delete(invalidate);
				if (current.size === 0)
				{
					this.rowSlots.delete(userId);
				}
			};
		}

		invalidateRow(userId)
		{
			const subscribers = this.rowSlots.get(userId);
			if (!subscribers)
			{
				return;
			}

			subscribers.forEach((invalidate) => invalidate());
		}

		requestRefresh()
		{
			if (this.onRefresh)
			{
				this.onRefresh();
			}
		}

		/**
		 * Available row actions for a pending specialist, gated by the section flags and local state.
		 *
		 * @param {Object} user
		 * @param {Object} section
		 * @param {SpecialistsRowState} [rowState]
		 * @return {string[]}
		 */
		static getRowActions(user, section, rowState = {})
		{
			const extra = (section && section.extra && section.extra[user && user.id]) || {};
			// A busy or removed row exposes no actions: neither the menu nor the right-action is offered
			// while a write request of the row is in flight.
			if (!extra.isPending || rowState.reinviting || rowState.cancelling || rowState.removed)
			{
				return [];
			}

			const actions = [];

			if (section && section.canInvite && !rowState.reinvited)
			{
				actions.push(RowAction.REINVITE);
			}

			if (SpecialistsList.canCancelInvitation(extra))
			{
				actions.push(RowAction.CANCEL_INVITE);
			}

			return actions;
		}

		/**
		 * Whether the current user may cancel this specialist's invitation. The server computes the
		 * exact per-user permission (Invitation::canDelete) and exposes it as extra.canCancel; the
		 * client only reflects it, and the server re-checks it on the action call.
		 *
		 * @param {Object} extra companion data of the row (section.extra[userId])
		 * @return {boolean}
		 */
		static canCancelInvitation(extra)
		{
			return Boolean(extra && extra.canCancel);
		}

		/**
		 * @param {SpecialistsRowState} [rowState]
		 * @return {string}
		 */
		static getStatusKind(rowState = {})
		{
			if (rowState.removed)
			{
				return StatusKind.CANCELLED;
			}

			return rowState.reinvited ? StatusKind.INVITED : StatusKind.PENDING;
		}

		/**
		 * @param {string} action
		 * @param {Object} options
		 * @return {Promise<Object>}
		 */
		static runAction(action, options)
		{
			return new Promise((resolve) => {
				void new RunActionExecutor(action, options)
					.setHandler((response) => resolve(response))
					.call();
			});
		}

		/**
		 * @param {Object} response
		 * @return {boolean}
		 */
		static isSuccess(response)
		{
			return Boolean(response)
				&& response.status === 'success'
				&& (!response.errors || response.errors.length === 0);
		}
	}

	module.exports = {
		SpecialistsList,
		// Exported for unit tests only.
		RowAction,
		StatusKind,
	};
});
