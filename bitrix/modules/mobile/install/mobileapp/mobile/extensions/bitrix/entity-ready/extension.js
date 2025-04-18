/**
 * @module entity-ready
 */
jn.define('entity-ready', (require, exports, module) => {
	class EntityReady
	{
		constructor()
		{
			this.readyEntitiesCollection = new Set();
			this.listenUnreadyEvent();
		}

		addCondition(entityId, condition)
		{
			if (typeof condition !== 'function')
			{
				condition = () => condition === true;
			}

			BX.addCustomEvent('EntityReady::checkReady', () => {
				if (condition())
				{
					BX.postComponentEvent('EntityReady::ready', [entityId]);
				}
			});
		}

		wait(entityId)
		{
			return new Promise((resolve) => {
				if (this.readyEntitiesCollection.has(entityId))
				{
					return resolve();
				}

				const readyHandler = (readyEntityId) => {
					this.readyEntitiesCollection.add(readyEntityId);

					if (readyEntityId === entityId)
					{
						resolve();
						BX.removeCustomEvent('EntityReady::ready', (readyEntityId) => readyHandler(readyEntityId));
					}
				};

				BX.addCustomEvent('EntityReady::ready', (entityId) => readyHandler(entityId));
				BX.postComponentEvent('EntityReady::checkReady', []);
			});
		}

		ready(entityId)
		{
			BX.postComponentEvent('EntityReady::ready', [entityId]);
		}

		unready(entityId)
		{
			BX.postComponentEvent('EntityReady::unready', [entityId]);
		}

		isReady(entityId)
		{
			return this.readyEntitiesCollection.has(entityId);
		}

		listenUnreadyEvent()
		{
			BX.addCustomEvent('EntityReady::unready', (entityId) => {
				this.readyEntitiesCollection.delete(entityId);
			});
		}
	}

	module.exports = {
		EntityReady: new EntityReady(),
	};
});
