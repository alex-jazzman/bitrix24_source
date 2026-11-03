/**
 * @module crm/ajax/stage
 */
jn.define('crm/ajax/stage', (require, exports, module) => {
	const { BaseAjax } = require('crm/ajax/base');

	const StageActions = {
		CREATE: 'create',
		UPDATE: 'update',
		DELETE: 'delete',
	};

	/**
	 * @class StageAjax
	 */
	class StageAjax extends BaseAjax
	{
		getEndpoint()
		{
			return 'crmmobile.Stage';
		}

		getTtl()
		{
			return 7 * 24 * 3600; // 7 days
		}

		/**
		 * @param {Number} entityTypeId
		 * @param {Number} categoryId
		 * @param {Object} fields
		 * @return {Promise<Object, void>}
		 */
		create(entityTypeId, categoryId, fields)
		{
			return this.fetch(StageActions.CREATE, {
				entityTypeId,
				categoryId,
				fields,
			});
		}

		/**
		 * @param {Number} entityTypeId
		 * @param {Number|null} categoryId funnel the stage is expected to stand in
		 * @param {Object} fields
		 * @return {Promise<Object, void>}
		 */
		update(entityTypeId, categoryId, fields)
		{
			return this.fetch(StageActions.UPDATE, {
				entityTypeId,
				categoryId,
				fields,
			});
		}

		/**
		 * @param {Number} entityTypeId
		 * @param {Number|null} categoryId funnel the stage is expected to stand in
		 * @param {String} statusId
		 * @return {Promise<Object, void>}
		 */
		delete(entityTypeId, categoryId, statusId)
		{
			return this.fetch(StageActions.DELETE, {
				entityTypeId,
				categoryId,
				statusId,
			});
		}
	}

	module.exports = {
		StageAjax: new StageAjax(),
		StageActions,
	};
});
