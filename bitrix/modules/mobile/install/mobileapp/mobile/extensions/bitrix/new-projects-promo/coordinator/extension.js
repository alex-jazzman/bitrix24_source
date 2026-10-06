/**
 * @module new-projects-promo/coordinator
 */
jn.define('new-projects-promo/coordinator', (require, exports, module) => {
	const { BackgroundUIManager } = require('background/ui-manager');
	const {
		COMPONENT_NAME,
		BACKGROUND_UI_MANAGER_CLOSE_EVENT,
		PRIORITY,
	} = require('new-projects-promo/const');
	const { setViewed, shouldShow } = require('new-projects-promo/api');
	const { openNewProjectsPromo } = require('new-projects-promo/component-opener');
	const { isSynced, isViewed, markSynced } = require('new-projects-promo/state');

	const NEGATIVE_ELIGIBILITY_TTL_MS = 60 * 1000;

	class NewProjectsPromoCoordinator
	{
		constructor()
		{
			/** @type {boolean} */
			this.pending = false;
			/** @type {boolean} */
			this.isShowing = false;
			/** @type {Promise<boolean>|null} */
			this.eligibilityPromise = null;
			/** @type {Promise<boolean>|null} */
			this.syncPromise = null;
			/** @type {number} */
			this.nextEligibilityCheckAt = 0;
			this.openDrawer = this.openDrawer.bind(this);
		}

		/**
		 * @return {Promise<void>}
		 */
		async onTrigger()
		{
			if (this.pending || this.isShowing)
			{
				return;
			}

			if (isViewed())
			{
				await this.syncViewed();

				return;
			}

			await this.checkAndSchedule();
		}

		/**
		 * @return {Promise<void>}
		 */
		async checkAndSchedule()
		{
			if (isViewed())
			{
				this.pending = false;
				await this.syncViewed();

				return;
			}

			if (this.eligibilityPromise)
			{
				await this.eligibilityPromise;

				if (isViewed())
				{
					this.pending = false;
					await this.syncViewed();
				}

				return;
			}

			if (Date.now() < this.nextEligibilityCheckAt)
			{
				return;
			}

			this.eligibilityPromise = shouldShow();
			let isEligible = false;

			try
			{
				isEligible = await this.eligibilityPromise;
			}
			catch (error)
			{
				isEligible = false;
			}
			finally
			{
				this.eligibilityPromise = null;
			}

			if (isViewed())
			{
				this.pending = false;
				await this.syncViewed();

				return;
			}

			this.nextEligibilityCheckAt = isEligible
				? 0
				: Date.now() + NEGATIVE_ELIGIBILITY_TTL_MS;

			if (this.isShowing)
			{
				return;
			}

			this.pending = isEligible === true;
			if (this.pending)
			{
				BackgroundUIManager.openComponent(
					COMPONENT_NAME,
					this.openDrawer,
					PRIORITY,
				);
			}
		}

		/**
		 * @return {void}
		 */
		onMounted()
		{
			this.pending = false;
			this.isShowing = true;
			void this.syncViewed();
		}

		/**
		 * @return {Promise<void>}
		 */
		async syncViewed()
		{
			if (!isViewed() || isSynced())
			{
				return;
			}

			if (this.syncPromise)
			{
				await this.syncPromise;

				return;
			}

			this.syncPromise = setViewed();

			try
			{
				const wasSynced = await this.syncPromise;
				if (wasSynced)
				{
					markSynced();
				}
			}
			catch (error)
			{
				console.error('NewProjectsPromoCoordinator.syncViewed:', error);
			}
			finally
			{
				this.syncPromise = null;
			}
		}

		/**
		 * @return {void}
		 */
		onCloseActiveComponent()
		{
			if (this.isShowing)
			{
				this.isShowing = false;

				return;
			}

			if (this.pending)
			{
				setTimeout(() => {
					this.pending = false;
					void this.checkAndSchedule();
				}, 0);
			}
		}

		/**
		 * @return {void}
		 */
		openDrawer()
		{
			try
			{
				openNewProjectsPromo();
			}
			catch (error)
			{
				this.pending = false;
				console.error('NewProjectsPromoCoordinator.openDrawer:', error);
				setTimeout(() => {
					BX.postComponentEvent(BACKGROUND_UI_MANAGER_CLOSE_EVENT, []);
				}, 0);
			}
		}
	}

	module.exports = {
		NewProjectsPromoCoordinator,
	};
});
