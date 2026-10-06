/**
 * @module im/messenger/controller/sidebar-v2/services/participants-service
 */
jn.define('im/messenger/controller/sidebar-v2/services/participants-service', (require, exports, module) => {
	const { getLogger } = require('im/messenger/lib/logger');
	const { RestMethod } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { SidebarDataProvider } = require('im/messenger/controller/sidebar-v2/services/data-provider');

	const logger = getLogger('sidebar--participants-service');

	const LIMIT = 50;

	/**
	 * @class ParticipantsService
	 */
	class ParticipantsService extends SidebarDataProvider
	{
		/**
		 * @type {?function(): void}
		 * Notifies the tab that the initial participants load has failed.
		 * The initial load is started by the controller as a batch (RestManager.callBatch),
		 * not by the tab, so the tab cannot wrap it in its own try/catch and
		 * subscribes to the error through this callback.
		 */
		#onLoadError = null;

		/**
		 * @public
		 * @param {?function(): void} handler
		 */
		setOnLoadError(handler)
		{
			this.#onLoadError = typeof handler === 'function' ? handler : null;
		}

		getInitialQueryHandler()
		{
			// RestManager calls the handler even for a failed batch method
			// (emit happens before the error check), so we handle the error here,
			// not only in .catch(callBatch). Without this, on a Member.tail failure
			// the tab would commit an empty page and hang in the loading state.
			// We check only .error(): in a batch the method result carries no .status
			// (unlike callMethod in loadPage), and RestManager detects a method error
			// exactly by .error() - otherwise a successful response would be falsely treated as a failure.
			return (response) => {
				if (response.error())
				{
					logger.error('getInitialQueryHandler.error', response.error(), response.ex);
					this.#notifyLoadError();

					return;
				}

				this.#handlePage(response.data());
			};
		}

		/**
		 * @private
		 */
		#notifyLoadError()
		{
			if (typeof this.#onLoadError === 'function')
			{
				this.#onLoadError();
			}
		}

		getInitialQueryMethod()
		{
			return RestMethod.imV2ChatMemberTail;
		}

		getInitialQueryParams()
		{
			const dialogModel = this.getDialogModel();
			const queryParams = {
				limit: LIMIT,
				dialogId: dialogModel.dialogId,
			};

			if (this.#shouldUseGroupSort(dialogModel))
			{
				queryParams.withGroupSort = true;
			}

			if (dialogModel.participantsCursor)
			{
				return {
					...queryParams,
					cursor: dialogModel.participantsCursor,
				};
			}

			return queryParams;
		}

		/**
		 * Grouped sorting of participants (owner -> managers -> guests -> others,
		 * newest on top) is enabled opt-in by the withGroupSort flag only for project
		 * collab chats. The backend applies the grouped mode unconditionally by the flag, so we
		 * keep the chat-type gate on the client: without it regular chats would get a different
		 * ordering (a regression). Symmetric to the web participants panel - the same order
		 * is required on both platforms. The flag is set in the single request
		 * builder, so it goes out both with the initial load and with pagination -
		 * pages do not drift apart from the grouped cursor.
		 *
		 * @param {DialoguesModelState} dialogModel
		 * @return {boolean}
		 */
		#shouldUseGroupSort(dialogModel)
		{
			return DialogHelper.createByModel(dialogModel)?.isCollab === true;
		}

		loadPage(offset = 0)
		{
			const dialogModel = this.getDialogModel();

			if (!dialogModel)
			{
				return Promise.resolve(false);
			}

			return new Promise((resolve, reject) => {
				BX.rest.callMethod(
					this.getInitialQueryMethod(),
					this.getInitialQueryParams(),
				).then((response) => {
					if (response.error() || response.status !== 200)
					{
						logger.error('getParticipantList.error', response.error(), response.ex);
						reject(response.error());

						return;
					}

					this.#handlePage(response.data());

					resolve(response);
				}).catch((error) => {
					this.logger.error('loadPage', error);

					reject(error);
				});
			});
		}

		#handlePage(data)
		{
			logger.info('SidebarServices.getParticipantList:', data);
			const { users, nextCursor } = data;

			const hasUsers = Array.isArray(users) && users.length > 0;
			const participants = hasUsers
				? users.map(({ id }) => id).filter((id) => id > 0)
				: [];

			const mutations = [];

			if (hasUsers)
			{
				mutations.push(this.store.dispatch('usersModel/merge', users));
			}

			// Always update the cursor and hasNextPage, even on an empty response -
			// otherwise hasNextPage stays true and onLoadMore loops on empty requests.
			mutations.push(
				this.store.dispatch('dialoguesModel/addParticipants', {
					participants,
					dialogId: this.getDialogId(),
					participantsCursor: nextCursor || null,
					hasNextPage: Boolean(nextCursor),
				}),
			);

			return Promise.all(mutations);
		}

		getDialogId()
		{
			const { dialogId } = this.props;

			return dialogId;
		}

		getDialogModel()
		{
			return this.store.getters['dialoguesModel/getById'](this.getDialogId());
		}

	}

	module.exports = {
		ParticipantsService,
	};
});
