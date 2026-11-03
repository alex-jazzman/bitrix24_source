/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/cache/shared-storage/recent
 */
jn.define('im/messenger/cache/shared-storage/recent', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');

	const { NativeFeatureName } = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');
	const { Cache } = require('im/messenger/cache/base');
	const { DatabaseEpoch } = require('im/messenger/lib/database-epoch');

	const logger = getLogger('recent--cache');

	const SAVE_THROTTLE_MS = 2000;
	const RECENT_ITEM_BUTTON_CONTRACT_PROFILE_FIELDS = Object.freeze([
		'platform',
		'chatRecentItemButtonEnabled',
		'vibecodeButtonAvailable',
		'vibecodeRecentActionAvailable',
	]);

	// service rows the recent list injects itself: the pagination loader, the active call banner and
	// the invite banner. The row types repeat RecentItemType and the banner id of the recent
	// controller literally: the cache is read on the critical path of the first show and must not
	// pull the controller extensions in.
	const SERVICE_ROW_TYPES = new Set(['loading', 'call', 'invite']);
	const LOADER_ID_PREFIX = 'loadNextPage';

	/**
	 * @desc A service row must not reach the snapshot: on the next start it would stand between the
	 * content rows and the snapshot would stop being a prefix of the first page.
	 * @param {RecentWidgetItem|RecentItem} item
	 * @return {boolean}
	 */
	const isServiceRow = (item) => {
		return SERVICE_ROW_TYPES.has(item.type)
			|| item.sectionCode === 'call'
			|| String(item.id).startsWith(LOADER_ID_PREFIX)
		;
	};

	/**
	 * @class RecentViewCache
	 */
	class RecentViewCache extends Cache
	{
		#saveThrottleMs;
		#saveTimerId = null;
		#isDestroyed = false;
		/** @type {?RecentViewCachePendingSave} */
		#pendingSave = null;

		/**
		 * @param {string} name
		 * @param {{ saveThrottleMs?: number }} [options]
		 */
		constructor(name, options = {})
		{
			super({
				name,
			});

			this.#saveThrottleMs = options.saveThrottleMs ?? SAVE_THROTTLE_MS;
		}

		/**
		 * @desc Writes by the leading edge, but the last attempt is not lost: an attempt that came
		 * inside the window is performed when the window closes, with the data of the latest one.
		 * Under a coalescing scope the queue passes are rare, so a dropped attempt would leave the
		 * snapshot in the state the startup began with instead of the one it ended with.
		 * A destroyed instance writes nothing at all, see destructor().
		 * @param {Array<JNListWidgetSectionItem>} sections
		 * @param {Array<RecentWidgetItem|RecentItem>} itemList
		 */
		save(sections, itemList)
		{
			if (this.#isDestroyed)
			{
				logger.log(`${this.constructor.name}.save: the instance is destroyed, the write is skipped`);

				return Promise.resolve();
			}

			if (this.#saveTimerId)
			{
				this.#pendingSave = {
					sections,
					itemList,
					theme: AppTheme.id,
					epoch: DatabaseEpoch.get(),
					recentItemButtonContractProfile: buildCurrentRecentItemButtonContractProfile(),
				};

				return Promise.resolve();
			}

			this.#openSaveWindow();

			return this.#writeSnapshot(sections, itemList);
		}

		/**
		 * @desc The snapshot describes a state of the local database, so it is read only while that
		 * database is the one it was filled from: the generation is checked exactly like the theme.
		 * This is what makes a wipe of the database reach the snapshots of the lists no one opened in
		 * that session - folders and project tabs included - without walking any registry of them.
		 */
		get()
		{
			const state = super.get();
			if (!state)
			{
				return false;
			}

			if (state.theme !== AppTheme.id)
			{
				logger.log(`${this.constructor.name}.get: cached theme "${state.theme}" mismatches current "${AppTheme.id}", dropping cache`);
				void this.clear();

				return false;
			}

			const epoch = DatabaseEpoch.get();
			if (state.epoch !== epoch)
			{
				logger.log(`${this.constructor.name}.get: cached database generation "${state.epoch}" mismatches current "${epoch}", dropping cache`);
				void this.clear();

				return false;
			}

			if (!isRecentItemButtonContractProfileCompatible(state.recentItemButtonContractProfile))
			{
				logger.log(`${this.constructor.name}.get: cached item button contract profile is incompatible, dropping cache`);
				void this.clear();

				return false;
			}

			return state;
		}

		/**
		 * @desc Closes the write window together with the snapshot: a window left open would defer
		 * the first write after the clear by its full length, although nothing has been written yet.
		 */
		clear()
		{
			this.#cancelPendingSave();

			return super.clear();
		}

		/**
		 * @desc An instance belongs to a tab, and folder and nested project tabs are destroyed while
		 * the window may still be open, so no write of this instance may land after the destruction:
		 * neither the deferred one nor an immediate one from a pass that outlived the tab. The
		 * snapshot already in the storage is kept - it is read on the critical path of the next start,
		 * and a tab opened again builds its own instance.
		 */
		destructor()
		{
			this.#isDestroyed = true;
			this.#cancelPendingSave();
		}

		sortItemList(a, b)
		{
			if (a.sectionCode !== 'pinned' && b.sectionCode === 'pinned')
			{
				return 1;
			}

			if (a.sectionCode === 'pinned' && b.sectionCode !== 'pinned')
			{
				return -1;
			}

			if (a.sortValues?.order && b.sortValues?.order)
			{
				return b.sortValues.order - a.sortValues.order;
			}

			return 0;
		}

		/**
		 * @param {Array<JNListWidgetSectionItem>} sections
		 * @param {Array<RecentWidgetItem|RecentItem>} itemList
		 */
		#writeSnapshot(sections, itemList)
		{
			const uniqueItemList = uniqBy(itemList, (item) => String(item.id));

			const state = {
				theme: AppTheme.id,
				epoch: DatabaseEpoch.get(),
				// no reader since the show moved to the render queue: the queue takes `items` only.
				// Kept because the write chain carries sections through and their size is negligible
				sections,
				items: uniqueItemList
					.filter((item) => !isServiceRow(item))
					.sort(this.sortItemList)
					.slice(0, 15),
				recentItemButtonContractProfile: buildCurrentRecentItemButtonContractProfile(),
			};
			logger.log(`${this.constructor.name}.save:`, state);

			return super.save(state);
		}

		#openSaveWindow()
		{
			this.#saveTimerId = setTimeout(() => {
				this.#saveTimerId = null;
				this.#flushPendingSave();
			}, this.#saveThrottleMs);
		}

		#cancelPendingSave()
		{
			this.#pendingSave = null;

			if (!this.#saveTimerId)
			{
				return;
			}

			clearTimeout(this.#saveTimerId);
			this.#saveTimerId = null;
		}

		#flushPendingSave()
		{
			const pending = this.#pendingSave;
			this.#pendingSave = null;

			if (!pending)
			{
				return;
			}

			// the snapshot is bound to the theme and is dropped on mismatch when read, so items
			// prepared for the previous theme must not be stored under the current one
			if (pending.theme !== AppTheme.id)
			{
				logger.log(`${this.constructor.name}.save: the deferred write is dropped, the theme has changed`);

				return;
			}

			// same for the database: rows prepared before the wipe describe a database that is gone and
			// must not be stored under the generation that replaced it
			if (pending.epoch !== DatabaseEpoch.get())
			{
				logger.log(`${this.constructor.name}.save: the deferred write is dropped, the database has been wiped`);

				return;
			}

			// same for the item button contract: rows prepared under the previous profile carry a
			// `button` the current client no longer accepts, and the read side would only drop the
			// whole snapshot on the next start
			if (!isRecentItemButtonContractProfileCompatible(pending.recentItemButtonContractProfile))
			{
				logger.log(`${this.constructor.name}.save: the deferred write is dropped, the item button contract profile has changed`);

				return;
			}

			void this.save(pending.sections, pending.itemList);
		}
	}

	/**
	 * @return {RecentItemButtonContractProfile}
	 */
	function buildCurrentRecentItemButtonContractProfile()
	{
		return {
			platform: Application.getPlatform(),
			chatRecentItemButtonEnabled:
				Feature.nativeFeature.isFeatureEnabled(NativeFeatureName.chatRecentItemButton) === true,
			vibecodeButtonAvailable: Feature.isVibecodeButtonAvailable === true,
			vibecodeRecentActionAvailable: Feature.isVibecodeRecentActionAvailable === true,
		};
	}

	/**
	 * @param {*} profile
	 * @return {boolean}
	 */
	function isRecentItemButtonContractProfileCompatible(profile)
	{
		if (!Type.isPlainObject(profile))
		{
			return false;
		}

		const profileFields = Object.keys(profile);
		if (
			profileFields.length !== RECENT_ITEM_BUTTON_CONTRACT_PROFILE_FIELDS.length
			|| !RECENT_ITEM_BUTTON_CONTRACT_PROFILE_FIELDS.every((field) => profileFields.includes(field))
		)
		{
			return false;
		}

		if (
			!Type.isString(profile.platform)
			|| !Type.isBoolean(profile.chatRecentItemButtonEnabled)
			|| !Type.isBoolean(profile.vibecodeButtonAvailable)
			|| !Type.isBoolean(profile.vibecodeRecentActionAvailable)
		)
		{
			return false;
		}

		const currentProfile = buildCurrentRecentItemButtonContractProfile();

		return RECENT_ITEM_BUTTON_CONTRACT_PROFILE_FIELDS.every((field) => profile[field] === currentProfile[field]);
	}

	module.exports = {
		RecentViewCache,
	};
});
