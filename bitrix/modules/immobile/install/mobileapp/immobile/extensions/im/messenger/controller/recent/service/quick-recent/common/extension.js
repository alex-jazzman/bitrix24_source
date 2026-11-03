/**
 * @module im/messenger/controller/recent/service/quick-recent/common
 */
jn.define('im/messenger/controller/recent/service/quick-recent/common', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { QuickRecentLoader } = require('im/messenger/lib/quick-recent-load');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IQuickRecentService}
	 * @class CommonQuickRecent
	 */
	class CommonQuickRecent extends BaseUiRecentService
	{
		#isNotEmptySnapshotRendered = false;

		onInit()
		{
			this.logger.log('onInit');
		}

		async onUiReady(ui)
		{
			this.ui = ui;
		}

		/**
		 * @return {Promise<void>}
		 */
		async renderList()
		{
			const perfPoint = new PerfPoint('quick-recent', this.recentLocator.get('id')).start();

			try
			{
				perfPoint.startPoint('ui-ready-wait');
				await this.uiReadyPromise;
				perfPoint.endPoint('ui-ready-wait');

				perfPoint.startPoint('render');
				this.#build();
				this.logger.log(`renderList quickRecent for ${this.recentLocator.get('id')} created, try rendering...`);
				// the show is awaited so that the pass takes the snapshot out of the render queue
				// before the first page from the local database replaces it there
				this.#isNotEmptySnapshotRendered = await this.#render();
				perfPoint.endPoint('render');
			}
			catch (error)
			{
				this.logger.error('renderList catch', error);
			}
			finally
			{
				// closes the sub-point the error interrupted; an already closed key is ignored
				perfPoint.endPoint('ui-ready-wait');
				perfPoint.endPoint('render');
				perfPoint.end();
			}
		}

		/**
		 * @desc Tells whether a non-empty cache snapshot of this tab went into the render queue, so
		 * the list will not stay empty. Returns the result of the show and does not read the cache:
		 * a repeated read drops the snapshot when the theme has changed.
		 * @return {boolean}
		 */
		isNotEmptySnapshotRendered()
		{
			return this.#isNotEmptySnapshotRendered;
		}

		/**
		 * @desc Drops the stored snapshot of this tab. Called when the local database no longer backs
		 * it - a wipe or an empty authoritative first page - so that the next start does not bring
		 * back chats that are gone. What is already on the screen is left alone: the snapshot is the
		 * only thing the user has until the server answers.
		 */
		invalidateSnapshot()
		{
			try
			{
				if (!this.quickRecent)
				{
					this.#build();
				}

				this.quickRecent.clearCache();
				this.logger.log(`invalidateSnapshot: snapshot of ${this.recentLocator.get('id')} dropped`);
			}
			catch (error)
			{
				this.logger.error('invalidateSnapshot catch', error);
			}
		}

		#build()
		{
			this.quickRecent = new QuickRecentLoader(this.ui, `${this.recentLocator.get('id')}/recent`);
		}

		/**
		 * @desc Shows the snapshot through the render queue, so the rendered collection knows what
		 * is on the screen and the next pass is compared with it instead of with emptiness.
		 * An absent or empty snapshot puts nothing in the queue and makes no pass: a full replace
		 * wipes the queue, so a literal empty set would cost an extra native call on the first launch.
		 * The pass is not marked, so a scope already active here suppresses it: the snapshot waits
		 * in the queue and reaches the screen only if a later pass still finds it there. That is
		 * what keeps the start quiet, because data already replaced by a fresher set never flashes.
		 * @return {Promise<boolean>} true when a non-empty snapshot went into the render queue, which
		 * is weaker than being on the screen: a suppressed pass leaves the snapshot waiting there
		 */
		async #render()
		{
			const snapshot = this.quickRecent.getCachedSnapshot();
			if (!snapshot || !Type.isArrayFilled(snapshot.items))
			{
				return false;
			}

			if (!this.recentLocator.has('render'))
			{
				this.logger.log('#render: render service is not defined, skipping');

				return false;
			}

			const renderService = this.recentLocator.get('render');
			renderService.setPreparedItems(snapshot.items);
			await renderService.renderInstant();

			return true;
		}

		/**
		 * @param {Array<JNListWidgetSectionItem>} sections
		 * @param {Array<RecentWidgetItem|RecentItem>} items
		 */
		async save(sections, items)
		{
			this.quickRecent.saveCache(sections, items);
		}

		subscribeEvents()
		{
			this.logger.log('subscribeEvents');
		}

		unsubscribeEvents()
		{
			this.logger.log('unsubscribeEvents');
			// the loader is absent when the tab was destroyed before the snapshot show reached its build
			this.quickRecent?.destructor();
		}
	}

	module.exports = CommonQuickRecent;
});
