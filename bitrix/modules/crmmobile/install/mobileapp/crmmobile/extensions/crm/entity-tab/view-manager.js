/**
 * @bxjs_lang_path extension.php
 * @module crm/entity-tab/view-manager
 */

jn.define('crm/entity-tab/view-manager', (require, exports, module) => {
	const { NotifyManager } = require('notify-manager');

	const ItemViewType = {
		Default: 'default',
		Compact: 'compact',
	};

	class ItemsViewManager
	{
		static createFromEntityTypeObject(entityTypeObject, saveViewTypePath)
		{
			const data = { saveViewTypePath };
			if (entityTypeObject)
			{
				data.viewType = entityTypeObject.data.viewType;
				data.compactViewAvailable = entityTypeObject.data.compactViewAvailable;
				data.entityTypeId = entityTypeObject.id;
			}
			else
			{
				data.viewType = null;
				data.compactViewAvailable = false;
				data.entityTypeId = null;
			}

			return new ItemsViewManager(data);
		}

		constructor({ entityTypeId, viewType, compactViewAvailable, saveViewTypePath })
		{
			this.entityTypeId = entityTypeId;
			this.viewType = (viewType === ItemViewType.Compact ? ItemViewType.Compact : ItemViewType.Default);
			this.compactViewAvailable = compactViewAvailable === true;
			this.savePath = saveViewTypePath;
		}

		getViewType()
		{
			return this.viewType;
		}

		isCompactView()
		{
			return (this.viewType === ItemViewType.Compact);
		}

		isCompactViewAvailable()
		{
			return this.compactViewAvailable;
		}

		async setViewType(callback)
		{
			const previousType = this.viewType;
			const type = (
				previousType === ItemViewType.Compact
					? ItemViewType.Default
					: ItemViewType.Compact
			);

			this.viewType = type;

			const data = {
				entityTypeId: this.entityTypeId,
				type,
			};

			try
			{
				const response = await BX.ajax.runAction(this.savePath, { data });

				if (response.errors.length > 0)
				{
					this.viewType = previousType;
					NotifyManager.showErrors(response.errors);

					return;
				}

				if (callback)
				{
					callback(type);
				}
			}
			catch (response)
			{
				this.viewType = previousType;
				console.error(response);
				NotifyManager.showErrors(response?.errors);
			}
		}
	}

	module.exports = { ItemViewType, ItemsViewManager };
});
