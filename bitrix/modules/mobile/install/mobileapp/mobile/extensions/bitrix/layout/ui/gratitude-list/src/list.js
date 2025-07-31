/**
 * @module layout/ui/gratitude-list/src/list
 */
jn.define('layout/ui/gratitude-list/src/list', (require, exports, module) => {
	const { StatefulList } = require('layout/ui/stateful-list');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { ListItemsFactory, ListItemType } = require('layout/ui/gratitude-list/src/factory');
	const { fetchUsersIfNotLoaded } = require('statemanager/redux/slices/users/thunk');
	const { gratitudesUpserted } = require('statemanager/redux/slices/gratitude');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { inAppUrl } = require('in-app-url');

	const ITEMS_LOAD_LIMIT = 30;

	class GratitudeList extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.stateFulListRef = null;
		}

		/**
		 * @returns {Object}
		 */
		get #layout()
		{
			return this.props.layout ?? null;
		}

		/**
		 * @returns {string}
		 */
		get #testId()
		{
			return 'gratitude-list';
		}

		/**
		 * @returns {number||Object}
		 */
		get #ownerId()
		{
			return this.props.ownerId ?? null;
		}

		bindRef = (ref) => {
			if (ref)
			{
				this.stateFulListRef = ref;
			}
		};

		render()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.renderList(),
			);
		}

		renderList()
		{
			const { withRedux } = this.props;

			return new StatefulList({
				testId: this.#testId,
				layout: this.#layout,
				showAirStyle: true,
				jsonEnabled: true,
				itemsLoadLimit: ITEMS_LOAD_LIMIT,
				ref: this.bindRef,
				actions: this.getListActions(),
				actionParams: this.getListActionParams(),
				actionCallbacks: {
					loadItems: this.onItemsLoaded,
				},
				itemType: withRedux ? ListItemType.REDUX_GRATITUDE : ListItemType.GRATITUDE,
				itemFactory: ListItemsFactory,
				onBeforeItemsRender: this.onBeforeItemsRender,
				isShowFloatingButton: true,
				isFloatingButtonAccent: true,
				onFloatingButtonClick: this.onFloatingButtonClick,
				onFloatingButtonLongClick: this.onFloatingButtonClick,
				itemDetailOpenHandler: this.itemDetailOpenHandler,
				getEmptyListComponent: this.getEmptyListComponent,
			});
		}

		getListActions()
		{
			return {
				loadItems: 'mobile.Profile.getGratitudeList',
			};
		}

		getListActionParams()
		{
			return {
				loadItems: {
					ownerId: this.#ownerId,
				},
			};
		}

		onItemsLoaded = async (responseData, context) => {
			const { authorIds, items } = responseData || {};

			if (items && items.length > 0)
			{
				await dispatch(gratitudesUpserted(items));
			}

			if (authorIds && authorIds.length > 0)
			{
				await dispatch(fetchUsersIfNotLoaded({ userIds: authorIds }));
			}
		};

		onBeforeItemsRender = (items) => {
			const transformItem = this.props.withRedux === false
				? (item, index) => this.#getItemsWithAuthors(item, index)
				: (item, index) => this.#getItems(item, index);

			return this.#mapItems(items, transformItem);
		};

		#mapItems(items, transformItem)
		{
			return items.map((item, index) => ({
				...transformItem(item, index),
				testId: `${this.#testId}-item-${index}`,
				showBorder: index > 0,
			}));
		}

		#getItems(item)
		{
			return { ...item };
		}

		#getItemsWithAuthors(item)
		{
			const author = this.props.authors.find((a) => a.id === item.authorId);

			return {
				...item,
				authorImage: author?.avatarSize100 ?? null,
				authorName: author?.fullName ?? null,
			};
		}

		onFloatingButtonClick = () => {
			console.log('float click!');
		};

		itemDetailOpenHandler = (postId) => {
			if (!this.#ownerId || !postId)
			{
				console.warn('GratitudeList: itemDetailOpenHandler: postId or ownerId is not defined', this.#ownerId, postId);

				return;
			}

			inAppUrl.open(`${currentDomain}/company/personal/user/${this.#ownerId}/blog/${postId}/`);
		};

		getEmptyListComponent()
		{
			const statusBlockProps = {
				testId: 'status-block',
				image: Image({
					testId: 'image',
					style: {
						width: 108,
						height: 108,
					},
					svg: {
						uri: makeLibraryImagePath('gratitude.svg', 'empty-states'),
					},
				}),
				title: Loc.getMessage('M_UI_GRATITUDE_LIST_EMPTY_TITLE'),
				titleColor: Color.base1,
				descriptionColor: Color.base2,
				emptyScreen: true,
				preventRefresh: true,
			};

			return StatusBlock(statusBlockProps);
		}
	}

	module.exports = {
		GratitudeList,
	};
});
