/**
 * @module vibecode/catalog/src/item-actions-controller
 */
jn.define('vibecode/catalog/src/item-actions-controller', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { requireLazy } = require('require-lazy');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { showErrorToast, showToast } = require('toast');
	const { Icon } = require('assets/icons');
	const { PopupMenu, PopupMenuPosition } = require('ui-system/popups/popup-menu');
	const { openInApp } = require('vibecode/catalog/src/open-in-app');
	const {
		CATALOG_STATE,
		VIBECODE_KIND,
		VIBECODE_MENU_SECTION_CODE,
	} = require('vibecode/catalog/src/const');
	const {
		getPreparedItemsToUpdateAfterMove,
		getVibeCodeItemMoveIndex,
		prepareVibeCodeItemForState,
	} = require('vibecode/catalog/src/list-item-move');
	const {
		normalizeAbsoluteUrl,
		normalizePositiveInteger,
	} = require('vibecode/catalog/src/utils');

	const OPEN_APP_PAGE_PATH = '/mobile/vibecode/open-app/';

	class VibeCodeCatalogItemActionsController
	{
		constructor(renderer)
		{
			this.renderer = renderer;
			this.vibeCodeItemPopupMenu = null;
		}

		dispose()
		{
			this.vibeCodeItemPopupMenu?.hide?.();
			this.vibeCodeItemPopupMenu = null;
		}

		handleItemClick = (itemId, itemData = null) => {
			const resolvedItem = this.resolveItem(itemId, itemData);

			this.openVibeCodeItem(resolvedItem);
		};

		handleItemActionClick = (itemId, itemData = null, itemParams = {}) => {
			const resolvedItem = this.resolveItem(itemId, itemData);

			this.showVibeCodeItemMenu(resolvedItem, itemParams?.targetRef ?? null);
		};

		handleItemLongClick = (itemId, itemData = null, itemParams = {}) => {
			const resolvedItem = this.resolveItem(itemId, itemData);
			if (!resolvedItem)
			{
				return;
			}

			Haptics.impactLight();
			this.showVibeCodeItemMenu(resolvedItem, itemParams?.targetRef ?? null);
		};

		resolveItem(itemId, itemData = null)
		{
			return (itemData && typeof itemData === 'object')
				? itemData
				: ((itemId && typeof itemId === 'object') ? itemId : null)
			;
		}

		openVibeCodeItem(item = null)
		{
			if (!item)
			{
				return;
			}

			if (this.isVibeCodeBotWithChat(item))
			{
				const chatId = normalizePositiveInteger(item.chatId);

				this.recordVibeCodeItemOpen(item);

				void requireLazy('im:messenger/api/dialog-opener')
					.then(({ DialogOpener }) => DialogOpener?.open({ dialogId: `chat${chatId}` }))
					.catch(console.error)
				;

				return;
			}

			const openUrl = this.getVibeCodeItemOpenUrl(item);
			if (!openUrl)
			{
				return;
			}

			this.recordVibeCodeItemOpen(item);

			const title = item?.title ?? this.renderer.getHeaderTitle();

			const openAppPageUrl = this.getVibeCodeItemOpenAppPageUrl(item);
			if (!openAppPageUrl)
			{
				// Degradation: without externalId (or a valid id) the entry page would render an
				// error, so fall back to the previous behaviour of opening the external viewUrl.
				inAppUrl.open(openUrl, { title });

				return;
			}

			openInApp(openAppPageUrl, { title });
		}

		getVibeCodeItemOpenAppPageUrl(item = {})
		{
			const externalId = String(item?.externalId ?? '').trim();
			if (externalId === '')
			{
				return null;
			}

			const catalogItemId = normalizePositiveInteger(item?.id);
			if (catalogItemId === null)
			{
				return null;
			}

			return `${OPEN_APP_PAGE_PATH}?catalogItemId=${catalogItemId}`;
		}

		isVibeCodeBotWithChat(item = {})
		{
			return (
				String(item?.kind ?? '') === VIBECODE_KIND.BOT
				&& normalizePositiveInteger(item?.chatId) !== null
			);
		}

		getVibeCodeItemOpenUrl(item = {})
		{
			return normalizeAbsoluteUrl(item?.viewUrl);
		}

		recordVibeCodeItemOpen(item = {})
		{
			const catalogItemId = normalizePositiveInteger(item?.id);
			if (catalogItemId === null)
			{
				return;
			}

			void (new RunActionExecutor('vibecodeconnector.Catalog.recordOpen', { catalogItemId }))
				.call(false)
				.catch((error) => {
					console.error('[vibecode/catalog] failed to record item open', error);
				})
			;
		}

		showVibeCodeItemMenu(item = null, targetRef = null)
		{
			if (!item)
			{
				return;
			}

			this.vibeCodeItemPopupMenu?.hide?.();
			this.vibeCodeItemPopupMenu = new PopupMenu({
				items: this.getVibeCodeItemMenuItems(item),
				sections: [
					{
						id: VIBECODE_MENU_SECTION_CODE,
					},
				],
			});

			const showOptions = {
				position: targetRef ? PopupMenuPosition.BOTTOM : PopupMenuPosition.TOP_RIGHT,
			};
			if (targetRef)
			{
				showOptions.target = targetRef;
			}

			this.vibeCodeItemPopupMenu.show(showOptions);
		}

		getVibeCodeItemMenuItems(item = {})
		{
			const isPinned = item?.isPinned === true;
			const isHidden = item?.isHidden === true;
			const items = [];

			if (this.getVibeCodeItemOpenUrl(item) || this.isVibeCodeBotWithChat(item))
			{
				items.push({
					id: 'vibecode-open',
					testId: this.renderer.getTestId('vibecode-menu-open'),
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_MENU_OPEN'),
					icon: Icon.OPEN_NEW,
					sectionCode: VIBECODE_MENU_SECTION_CODE,
					onItemSelected: () => this.openVibeCodeItem(item),
				});
			}

			if (!isHidden)
			{
				items.push({
					id: 'vibecode-pin',
					testId: this.renderer.getTestId('vibecode-menu-pin'),
					title: Loc.getMessage(
						isPinned
							? 'MOBILE_VIBECODE_CATALOG_MENU_UNPIN'
							: 'MOBILE_VIBECODE_CATALOG_MENU_PIN',
					),
					icon: isPinned ? Icon.UNPIN : Icon.PIN,
					sectionCode: VIBECODE_MENU_SECTION_CODE,
					onItemSelected: () => this.toggleVibeCodeItemPin(item),
				});
			}

			const hiddenAction = this.getVibeCodeItemHiddenMenuItem(item);
			if (hiddenAction)
			{
				items.push(hiddenAction);
			}

			return items;
		}

		getVibeCodeItemHiddenMenuItem(item = {})
		{
			if (item?.isMine === true)
			{
				return null;
			}

			const isHidden = item?.isHidden === true;

			return {
				id: isHidden ? 'vibecode-unhide' : 'vibecode-hide',
				testId: this.renderer.getTestId(isHidden ? 'vibecode-menu-unhide' : 'vibecode-menu-hide'),
				title: Loc.getMessage(
					isHidden
						? 'MOBILE_VIBECODE_CATALOG_MENU_UNHIDE'
						: 'MOBILE_VIBECODE_CATALOG_MENU_HIDE',
				),
				icon: isHidden ? Icon.CHECK : Icon.CROSSED_EYE,
				sectionCode: VIBECODE_MENU_SECTION_CODE,
				onItemSelected: () => this.toggleVibeCodeItemHidden(item),
			};
		}

		toggleVibeCodeItemPin(item = {})
		{
			const catalogItemId = normalizePositiveInteger(item?.id);
			if (catalogItemId === null)
			{
				return;
			}

			const nextPinned = item.isPinned !== true;
			const data = this.getCatalogItemActionData(catalogItemId);

			const action = nextPinned
				? 'vibecodeconnector.Catalog.pin'
				: 'vibecodeconnector.Catalog.unpin'
			;

			void (new RunActionExecutor(action, data))
				.call(false)
				.then((response) => {
					const errors = Array.isArray(response?.errors) ? response.errors : [];
					if (errors.length > 0)
					{
						throw response;
					}

					return this.updateVibeCodeItemDynamically(item, nextPinned);
				})
				.catch((error) => {
					console.error('[vibecode/catalog] failed to toggle pin', error);
					showErrorToast({
						message: Loc.getMessage('MOBILE_VIBECODE_CATALOG_PIN_ERROR'),
					}, this.renderer.getParentWidget());
				})
			;
		}

		getCatalogItemActionData(catalogItemId)
		{
			const data = {
				catalogItemId,
			};
			const previewUserId = this.renderer.getProvider().getPreviewUserId();
			if (previewUserId !== null)
			{
				data.previewUserId = previewUserId;
			}

			return data;
		}

		toggleVibeCodeItemHidden(item = {})
		{
			const isHidden = item?.isHidden === true;
			const nextHidden = !isHidden;
			const wasPinned = item?.isPinned === true;
			const action = nextHidden
				? 'vibecodeconnector.Catalog.hide'
				: 'vibecodeconnector.Catalog.unhide'
			;

			void this.runCatalogItemAction(item, action)
				.then(() => this.updateVibeCodeItemHiddenDynamically(item, nextHidden, {
					isPinned: false,
				}))
				.then(() => {
					if (nextHidden)
					{
						this.showHideUndoToast({ ...item }, wasPinned);
					}
				})
				.catch((error) => {
					console.error('[vibecode/catalog] failed to toggle hidden state', error);
					showErrorToast({
						message: Loc.getMessage(
							nextHidden
								? 'MOBILE_VIBECODE_CATALOG_HIDE_ERROR'
								: 'MOBILE_VIBECODE_CATALOG_UNHIDE_ERROR',
						),
					}, this.renderer.getParentWidget());
				})
			;
		}

		runCatalogItemAction(item = {}, action)
		{
			const catalogItemId = normalizePositiveInteger(item?.id);
			if (catalogItemId === null)
			{
				return Promise.reject(new Error('Catalog item id is invalid'));
			}

			return (new RunActionExecutor(action, this.getCatalogItemActionData(catalogItemId)))
				.call(false)
				.then((response) => {
					const errors = Array.isArray(response?.errors) ? response.errors : [];
					if (errors.length > 0)
					{
						throw response;
					}

					return response;
				})
			;
		}

		showHideUndoToast(item = {}, wasPinned = false)
		{
			showToast({
				message: Loc.getMessage('MOBILE_VIBECODE_CATALOG_HIDE_SUCCESS'),
				buttonText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_HIDE_UNDO'),
				shouldCloseOnTap: false,
				onButtonTap: () => this.undoVibeCodeItemHide(item, wasPinned),
			}, this.renderer.getParentWidget());
		}

		undoVibeCodeItemHide(item = {}, wasPinned = false)
		{
			void this.runCatalogItemAction(item, 'vibecodeconnector.Catalog.unhide')
				.then(() => {
					if (!wasPinned)
					{
						return false;
					}

					return this.runCatalogItemAction(item, 'vibecodeconnector.Catalog.pin')
						.then(() => true)
						.catch((error) => {
							console.error('[vibecode/catalog] failed to restore pin after undo', error);
							showErrorToast({
								message: Loc.getMessage('MOBILE_VIBECODE_CATALOG_PIN_ERROR'),
							}, this.renderer.getParentWidget());

							return false;
						})
					;
				})
				.then((isPinned) => this.updateVibeCodeItemHiddenDynamically(item, false, { isPinned }))
				.catch((error) => {
					console.error('[vibecode/catalog] failed to undo hide', error);
					showErrorToast({
						message: Loc.getMessage('MOBILE_VIBECODE_CATALOG_UNHIDE_ERROR'),
					}, this.renderer.getParentWidget());
				})
			;
		}

		updateVibeCodeItemHiddenDynamically(item = {}, isHidden = false, options = {})
		{
			const updatePromise = this.applyVibeCodeItemHiddenState(item, isHidden, options);

			return updatePromise.catch((error) => {
				console.error('[vibecode/catalog] failed to update hidden item dynamically', error);
				this.renderer.handleRefresh();
			});
		}

		applyVibeCodeItemHiddenState(item = {}, isHidden = false, options = {})
		{
			const statefulList = this.renderer.statefulListRef;
			const currentItems = statefulList?.state?.items;
			if (!Array.isArray(currentItems))
			{
				this.renderer.handleRefresh();

				return Promise.resolve();
			}

			const itemId = String(item?.id ?? '');
			const currentIndex = currentItems.findIndex((currentItem) => String(currentItem?.id ?? '') === itemId);
			const catalogState = this.renderer.getCatalogState();
			const shouldShowItem = (
				catalogState === CATALOG_STATE.ALL
				|| (catalogState === CATALOG_STATE.ACTIVE && !isHidden)
				|| (catalogState === CATALOG_STATE.HIDDEN && isHidden)
			);
			if (!shouldShowItem || currentIndex === -1)
			{
				this.renderer.handleRefresh();

				return Promise.resolve();
			}

			const nextItems = currentItems.filter((currentItem) => String(currentItem?.id ?? '') !== itemId);
			const updatedItem = {
				...currentItems[currentIndex],
				...item,
				isHidden,
				isPinned: isHidden ? false : options.isPinned === true,
			};
			let insertIndex = getVibeCodeItemMoveIndex(nextItems, updatedItem.isPinned);
			if (
				currentItems[currentIndex]?.isPinned !== true
				&& updatedItem.isPinned !== true
			)
			{
				insertIndex = Math.min(currentIndex, nextItems.length);
			}

			nextItems.splice(insertIndex, 0, updatedItem);

			return this.applyVibeCodeItemsState(nextItems);
		}

		applyVibeCodeItemsState(nextItems = [])
		{
			const statefulList = this.renderer.statefulListRef;
			if (!statefulList)
			{
				this.renderer.handleRefresh();

				return Promise.resolve();
			}

			statefulList.state.items = nextItems;
			this.renderer.setListItemsCount(nextItems.length);

			if (typeof statefulList.updateSimpleList !== 'function')
			{
				statefulList.modifyCache?.();
				this.renderer.handleRefresh();

				return Promise.resolve();
			}

			return new Promise((resolve, reject) => {
				statefulList.updateSimpleList(resolve, reject);
			});
		}

		updateVibeCodeItemDynamically(item = {}, isPinned = false)
		{
			const updatePromise = this.moveVibeCodeItemDynamically(item, isPinned);

			if (updatePromise && typeof updatePromise.catch === 'function')
			{
				return updatePromise.catch((error) => {
					console.error('[vibecode/catalog] failed to update item dynamically', error);
					this.renderer.handleRefresh();
				});
			}

			return Promise.resolve();
		}

		moveVibeCodeItemDynamically(item = {}, isPinned = false)
		{
			const statefulList = this.renderer.statefulListRef;
			const currentItems = statefulList?.state?.items;

			if (
				!Array.isArray(currentItems)
				|| !statefulList?.simpleList
				|| typeof statefulList.prepareItemsForRender !== 'function'
			)
			{
				this.renderer.handleRefresh();

				return Promise.resolve();
			}

			const itemId = String(item?.id ?? '');
			const currentIndex = currentItems.findIndex((currentItem) => String(currentItem?.id ?? '') === itemId);
			if (currentIndex === -1)
			{
				this.renderer.handleRefresh();

				return Promise.resolve();
			}

			const nextItems = currentItems.filter((currentItem, index) => index !== currentIndex);
			const insertIndex = getVibeCodeItemMoveIndex(nextItems, isPinned);
			const updatedItem = prepareVibeCodeItemForState({
				...currentItems[currentIndex],
				...item,
			}, isPinned);

			nextItems.splice(insertIndex, 0, updatedItem);
			statefulList.state.items = nextItems;

			const preparedItems = statefulList.prepareItemsForRender(nextItems);
			const preparedUpdatedItem = preparedItems.find((preparedItem) => String(preparedItem?.id ?? '') === itemId);
			if (!preparedUpdatedItem)
			{
				this.renderer.handleRefresh();

				return Promise.resolve();
			}

			const preparedItemsToUpdate = getPreparedItemsToUpdateAfterMove({
				preparedItems,
				itemId,
				currentIndex,
				insertIndex,
			});
			const updatePromise = statefulList.simpleList.updateRows(preparedItemsToUpdate, 'none');
			const movePromise = currentIndex === insertIndex
				? updatePromise
				: updatePromise.then(() => statefulList.simpleList.moveRow(preparedUpdatedItem, insertIndex, 0, true))
			;

			return movePromise.then(() => {
				const currentState = statefulList.simpleList.initItemsState(preparedItems);
				statefulList.simpleList.currentIdsOrder = currentState.idsOrder;
				statefulList.simpleList.currentItemsState = currentState.itemsState;

				statefulList.modifyCache?.();
			});
		}
	}

	module.exports = {
		VibeCodeCatalogItemActionsController,
	};
});
