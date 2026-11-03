jn.define('call/calls/layout/gridview-grid', (require, exports, module) => {
	const { UserCard } = require('call/calls/layout/user-card');
	const { GridUserCount } = require('call/const');
	const Utils = require('src/util');
	const { USER_DATA_BAKED_FIELDS, sameViewableIds, sameUsersContent, snapshotUsersContent, computeStreamSig } = require('src/comparators');
	const MobileUtils = require('utils/function');

	// Native GridView sections virtualization. Every section needs a unique `key`:
	// JNGridView.applyDiff builds Dictionary(uniqueKeysWithValues:) from section keys,
	// so duplicates crash the app via Swift _assertionFailure. See SDD §SEC-01.
	const SECTION_SIZE = 10;

	class GridViewGrid extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
			this.gridViewRef = null;
			this.userRegistry = props.userRegistry;
			this.userId = env.userId;
			this.onUserClick = props.onUserClick;
			this.onLongTap = props.onLongTap;
			this.onReplaceCamera = props.onReplaceCamera;
			this.onViewableItemsChanged = props.onViewableItemsChanged;
			this.prevViewableIds = new Set(props.viewableIds || []);
			this.initialVisibilityFallbackEnabled = props.initialVisibilityFallbackEnabled !== false;
			this.rows = props.rows || this.getDefaultRowsCount();
			this.handleViewableItemsChangedDebounced = MobileUtils.debounce(
				this.handleViewableItemsChanged.bind(this),
				500,
			);

			this.lastStreamSig = computeStreamSig(props.videoStreams);
			this.lastUserContentSnapshot = snapshotUsersContent(props.connectedUsers || []);

			// Visible sections ± 1 buffer; starts with 3 sections (~30 items),
			// the first handleViewableItemsChanged overwrites it with actual data.
			this.activeSectionSet = new Set([0, 1, 2]);
			this.sectionedData = [];

			this.state = {
				connectedUsers: props.connectedUsers || [],
				panelVisible: props.panelVisible,
				gridContainerHeight: props.gridContainerHeight,
				gridContainerWidth: props.gridContainerWidth,
				videoStreams: props.videoStreams,
				mirrorLocalVideo: props.mirrorLocalVideo,
				viewableIds: props.viewableIds || [],
				orientation: props.orientation || 'vertical',
				itemWidth: props.itemWidth || null,
				itemHeight: props.itemHeight || null,
				getConnectedUserCount: props.getConnectedUserCount,
			};
		}

		// Kick native re-populate after mount with retries: on return from fold
		// (Mantis 250774) CallLayout drops the grid instance and uses a status toggle to
		// force JN to unmount+mount. The new instance lands here — but `gridViewRef` is
		// set by the native side asynchronously. Fire `forceUpdateVisibleRows` with several
		// delays; the first attempt that catches the ref guarantees a native
		// `updateRows(items)`. On the first regular mount the refresh is safe:
		// prepareItems yields the same set that render has just shown.
		componentDidMount()
		{
			const kickDelays = [50, 150, 400, 800];
			kickDelays.forEach((ms) => {
				setTimeout(() => {
					if (this.gridViewRef)
					{
						this.forceUpdateVisibleRows();
					}
				}, ms);
			});
		}

		update(updatedProps)
		{
			if (!this.hasMeaningfulChange(updatedProps))
			{
				return;
			}

			const panelVisibleChanged = 'panelVisible' in updatedProps
				&& updatedProps.panelVisible !== this.state.panelVisible;

			const dimensionsChanged = ('itemWidth' in updatedProps && updatedProps.itemWidth !== this.state.itemWidth)
				|| ('itemHeight' in updatedProps && updatedProps.itemHeight !== this.state.itemHeight);

			const orientationChanged = 'orientation' in updatedProps
				&& updatedProps.orientation !== this.state.orientation;

			if ('rows' in updatedProps && updatedProps.rows !== this.rows)
			{
				this.rows = updatedProps.rows;
			}

			this.setState(updatedProps);

			if ('connectedUsers' in updatedProps)
			{
				this.lastUserContentSnapshot = snapshotUsersContent(updatedProps.connectedUsers);
			}

			if ('videoStreams' in updatedProps)
			{
				this.lastStreamSig = computeStreamSig(updatedProps.videoStreams);
			}

			if (dimensionsChanged || orientationChanged)
			{
				setTimeout(() => this.forceUpdateVisibleRows(), 0);
			}
		}

		forceUpdateVisibleRows(updatedProps = {})
		{
			if (!this.gridViewRef)
			{
				return;
			}

			const users = updatedProps.connectedUsers || this.state.connectedUsers || [];
			const items = this.prepareItems(users);

			this.gridViewRef.updateRows(items);
		}

		getDefaultRowsCount()
		{
			const isLandscape = Utils.getIsLandscapeOrientation();
			return isLandscape ? 4 : 2;
		}

		snapshotUserData(data)
		{
			const snapshot = {};
			for (const field of USER_DATA_BAKED_FIELDS)
			{
				snapshot[field] = data[field];
			}
			return snapshot;
		}

		hasMeaningfulChange(updatedProps)
		{
			if (!updatedProps || Object.keys(updatedProps).length === 0)
			{
				return false;
			}

			// Scalars are compared with !==
			const scalarFields = [
				'panelVisible',
				'mirrorLocalVideo',
				'gridContainerWidth',
				'gridContainerHeight',
				'orientation',
				'itemWidth',
				'itemHeight',
				'getConnectedUserCount',
			];

			for (const field of scalarFields)
			{
				if (field in updatedProps && updatedProps[field] !== this.state[field])
				{
					return true;
				}
			}

			// rows lives in this.rows, not in state
			if ('rows' in updatedProps && updatedProps.rows !== this.rows)
			{
				return true;
			}

			if ('viewableIds' in updatedProps
				&& !sameViewableIds(updatedProps.viewableIds, this.state.viewableIds))
			{
				return true;
			}

			if ('connectedUsers' in updatedProps
				&& !sameUsersContent(updatedProps.connectedUsers, this.lastUserContentSnapshot))
			{
				return true;
			}

			if ('videoStreams' in updatedProps)
			{
				const newSig = computeStreamSig(updatedProps.videoStreams);
				if (newSig !== this.lastStreamSig)
				{
					return true;
				}
			}

			return false;
		}

		prepareItems(users)
		{
			const viewableIds = this.prevViewableIds;
			// Native GridView may not emit onViewableItemsChanged before the first render
			// (or fires it with a 500ms debounce). Until that callback arrives, treat the
			// first-page users as viewable so video streams render immediately. Disabled
			// for pin/screenshare grids where the visible row is smaller.
			const fallbackActive = this.initialVisibilityFallbackEnabled && viewableIds.size === 0;

			return users.map((user, index) => ({
				key: user.data.id.toString(),
				type: 'user',
				data: this.snapshotUserData(user.data),
				index,
				isViewable: viewableIds.has(user.data.id)
					|| (fallbackActive && index < GridUserCount.fullFirstPageCount),
				panelVisible: this.state.panelVisible,
				mirrorLocalVideo: user.data.id === Number(this.userId)
					? this.state.mirrorLocalVideo
					: undefined,
			}));
		}

		prepareSectionedData(users)
		{
			const viewableIds = this.prevViewableIds;
			const fallbackActive = this.initialVisibilityFallbackEnabled && viewableIds.size === 0;
			const sections = [];
			// Native GridView lays items out in `nativeRows` rows (see `params.rows` in
			// render()). SECTION_SIZE must be a multiple of nativeRows, otherwise every
			// section ends with empty cells. Round up.
			const nativeRows = this.props.rows || this.getDefaultRowsCount();
			const sectionSize = Math.ceil(SECTION_SIZE / nativeRows) * nativeRows;
			// Orientation is part of the section key: on rotation the keys change, native
			// does reloadData and UserCards are recreated with fresh sizes
			// (getGridViewItemSize reads device.screen).
			const orientationTag = Utils.getIsLandscapeOrientation() ? 'l' : 'p';

			for (let i = 0; i < users.length; i += sectionSize)
			{
				const chunk = users.slice(i, i + sectionSize);
				sections.push({
					// SEC-01 (NORMATIVE): every section key must be unique —
					// JNGridView.applyDiff (JNGridView.swift:277) builds
					// Dictionary(uniqueKeysWithValues:) from section keys, duplicates
					// crash the app via Swift _assertionFailure.
					key: `s${Math.floor(i / sectionSize)}-${orientationTag}`,
					items: chunk.map((user, j) => ({
						key: user.data.id.toString(),
						type: 'user',
						data: this.snapshotUserData(user.data),
						index: i + j,
						isViewable: viewableIds.has(user.data.id)
							|| (fallbackActive && (i + j) < GridUserCount.fullFirstPageCount),
						panelVisible: this.state.panelVisible,
						mirrorLocalVideo: user.data.id === Number(this.userId)
							? this.state.mirrorLocalVideo
							: undefined,
					})),
				});
			}

			this.sectionedData = sections;
			return sections;
		}

		getPlaceholderSize()
		{
			if (this.state.itemWidth && this.state.itemHeight)
			{
				return { width: this.state.itemWidth, height: this.state.itemHeight };
			}

			// Mirrors UserCard.getGridViewItemSize (user-card.js:112-114), which always uses
			// document.device.screen (state.gridContainer* is not updated on rotation).
			// Diverging sizes make the layout jump when placeholder ↔ UserCard are swapped.
			const containerWidth = document.device.screen.width;
			const containerHeight = document.device.screen.height;

			// MARGIN mirrors user-card.js:13 — the placeholder must match the real
			// UserCard.getGridViewItemSize cell, otherwise the native flow layout jumps
			// when placeholder ↔ card are swapped.
			const MARGIN = 5;

			// Aspect matches UserCard.getGridViewItemSize (user-card.js:101-141):
			// - landscape: 4 columns × 2 rows, on iOS with extra width/height compensation
			//   for the uneven native GridView layout (see user-card.js:118-131);
			// - portrait: 2 columns, square items (height = width).
			if (Utils.getIsLandscapeOrientation())
			{
				const iosWidthCompensation = Utils.getIsIos() ? 30 : 0;
				const iosHeightCompensation = Utils.getIsIos() ? 10 : 0;

				return {
					width: containerWidth / 4 - MARGIN - iosWidthCompensation,
					height: containerHeight / 2 - MARGIN - iosHeightCompensation,
				};
			}

			const width = containerWidth / 2 - MARGIN;

			return {
				width,
				height: width,
			};
		}

		renderPlaceholder = () =>
		{
			const size = this.getPlaceholderSize();
			return View({
				style: {
					...size,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#26FFFFFF',
					borderRadius: 10,
					marginRight: 5,
					marginTop: 5,
					borderWidth: 2,
					borderColor: 'transparent',
				},
			});
		};

		renderItem = (item, section) =>
		{
			// section is undefined in legacy single-section calls — treat it as active
			if (typeof section === 'number' && !this.activeSectionSet.has(section))
			{
				return this.renderPlaceholder();
			}

			const streams = this.state.videoStreams;
			const isViewable = item.isViewable;
			const videoStream = isViewable
				&& streams.hasOwnProperty(item.data.id)
				&& streams[item.data.id];

			return new UserCard({
				userId: this.userId,
				avatarUri: this.userRegistry.get(item.data.id).avatar,
				gridContainerWidth: this.props.gridContainerWidth,
				gridContainerHeight: this.props.gridContainerHeight,
				panelVisible: item.panelVisible,
				videoStream,
				isGridView: true,
				gridOrientation: this.state.orientation,
				gridRows: this.rows,
				itemWidth: this.state.itemWidth,
				itemHeight: this.state.itemHeight,
				user: item,
				index: item.index,
				onUserClick: () => this.onUserClick(item.data.id),
				onLongTap: () => this.onLongTap?.(item.data.id),
				onReplaceCamera: this.props.onReplaceCamera,
				mirrorLocalVideo: item.mirrorLocalVideo,
				getConnectedUserCount: this.state.getConnectedUserCount,
			});
		};

		// In multi-section format data = [{section, items: [rowIndices]}]. Row indices map
		// to userId through this.sectionedData.
		handleViewableItemsChanged(data)
		{
			const newViewableIdSet = new Set();
			const visibleSections = new Set();

			data.forEach(({ section, items }) => {
				if (typeof section !== 'number')
				{
					// Legacy single-section payload (no `section` field): items is a flat
					// list of indices in this.state.connectedUsers. Section 0 is nominal.
					const displayedUsers = this.state.connectedUsers || [];
					visibleSections.add(0);
					(items || []).forEach((index) => {
						const user = displayedUsers[index];
						if (user)
						{
							newViewableIdSet.add(user.data.id);
						}
					});
					return;
				}

				visibleSections.add(section);
				const sectionItems = this.sectionedData[section]?.items || [];
				(items || []).forEach((row) => {
					const userItem = sectionItems[row];
					if (userItem)
					{
						newViewableIdSet.add(userItem.data.id);
					}
				});
			});

			// Empty callback (native may send [] on fast scroll or before the first
			// layout): keep the current state, otherwise the whole grid falls into the
			// placeholder path on the next render.
			if (visibleSections.size === 0)
			{
				return;
			}

			const newActiveSectionSet = new Set();
			visibleSections.forEach((s) => {
				newActiveSectionSet.add(s);
				if (s > 0) newActiveSectionSet.add(s - 1);
				newActiveSectionSet.add(s + 1);
			});

			const changedItems = [];
			this.sectionedData.forEach((section) => {
				section.items.forEach((item) => {
					const userId = item.data.id;
					const wasViewable = this.prevViewableIds.has(userId);
					const isNowViewable = newViewableIdSet.has(userId);

					if (wasViewable !== isNowViewable)
					{
						changedItems.push({
							key: userId.toString(),
							type: 'user',
							data: item.data,
							index: item.index,
							isViewable: isNowViewable,
							panelVisible: this.state.panelVisible,
							mirrorLocalVideo: userId === Number(this.userId)
								? this.state.mirrorLocalVideo
								: undefined,
						});
					}
				});
			});

			this.activeSectionSet = newActiveSectionSet;
			this.prevViewableIds = newViewableIdSet;

			if (changedItems.length > 0 && this.gridViewRef)
			{
				this.gridViewRef.updateRows(changedItems);
			}

			this.onViewableItemsChanged?.([...newViewableIdSet]);
		}

		render()
		{
			// data is passed as a plain array of sections, without the [{items}] wrapper
			const data = this.prepareSectionedData(this.state.connectedUsers || []);

			return View(
				{
					style: {
						flex: 1,
					},
				},
				GridView({
					ref: (ref) => { this.gridViewRef = ref; },
					style: {
						flex: 1,
						padding: 0.5,
					},
					params: {
						orientation: this.state.orientation,
						rows: this.props.rows || this.getDefaultRowsCount(),
					},
					bounces: false,
					// for iOS
					showsHorizontalScrollIndicator: false,
					showsVerticalScrollIndicator: false,
					animateDataUpdates: false,
					// TOD0: change waitForInteraction to false after native iOS rework
					viewabilityConfig: { itemVisiblePercentThreshold: 70, waitForInteraction: false },
					onViewableItemsChanged: (data) => {
						this.handleViewableItemsChangedDebounced(data)
					},
					data,
					renderItem: (item, section) => View(
						{},
						this.renderItem(item, section),
					),
				}),
			);
		}
	}

	module.exports = { GridViewGrid };
});
