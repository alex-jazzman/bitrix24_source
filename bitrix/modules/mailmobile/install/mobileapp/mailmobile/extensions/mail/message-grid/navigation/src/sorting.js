/**
 * @module mail/message-grid/navigation/src/sorting
 */
jn.define('mail/message-grid/navigation/src/sorting', (require, exports, module) => {
	const { BaseListSorting } = require('layout/ui/list/base-sorting');

	/**
	 * @class MessageGridSorting
	 * @extends BaseListSorting
	 */
	class MessageGridSorting extends BaseListSorting
	{
		/**
		 * @public
		 * @static
		 * @returns {Object}
		 */
		static get types()
		{
			return {
				RECEIVE_DATE: 'RECEIVE_DATE',
				UPDATE_TIME: 'UPDATE_TIME',
				CREATE_TIME: 'CREATE_TIME',
				NAME: 'NAME',
				SIZE: 'SIZE',
				ID: 'ID',
			};
		}

		static get typeToProperty()
		{
			return {
				[MessageGridSorting.types.RECEIVE_DATE]: 'date',
				[MessageGridSorting.types.UPDATE_TIME]: 'updateTime',
				[MessageGridSorting.types.CREATE_TIME]: 'createTime',
				[MessageGridSorting.types.NAME]: 'name',
				[MessageGridSorting.types.SIZE]: 'size',
				[MessageGridSorting.types.ID]: 'id',
			};
		}

		/**
		 * @param {Object} data
		 */
		constructor(data = {})
		{
			super({
				types: MessageGridSorting.types,
				type: data.type,
				isASC: data.isASC,
				noPropertyValue: data.noPropertyValue ?? Infinity,
			});

			this.fallbackType = data.fallbackType;
		}

		/**
		 * @private
		 * @param {object} item
		 * @return {number}
		 */
		getPropertyValue = (item) => {
			let value = item[MessageGridSorting.typeToProperty[this.type]];

			if (this.type === MessageGridSorting.types.NAME)
			{
				value = value.toLowerCase();
			}

			return value === null ? undefined : value;
		};

		/**
		 * @private
		 * @param {Object} item
		 * @return {number}
		 */
		getSortingSection(item)
		{
			if (!item.typeMail)
			{
				return 0;
			}

			return 1;
		}

		getSortItemsCallback()
		{
			return this.createSortItemsCallback;
		}

		createSortItemsCallback()
		{
			return (a, b) => {
				const aSection = this.getSortingSection(a) ?? 0;
				const bSection = this.getSortingSection(b) ?? 0;

				if (aSection !== bSection)
				{
					return Math.sign(aSection - bSection);
				}

				const aSortProperty = this.getPropertyValue(a) ?? this.noPropertyValue;
				const bSortProperty = this.getPropertyValue(b) ?? this.noPropertyValue;

				if (aSortProperty === bSortProperty)
				{
					if (this.fallbackType)
					{
						const prevType = this.type;
						this.type = this.fallbackType;
						const aFallback = this.getPropertyValue(a) ?? this.noPropertyValue;
						const bFallback = this.getPropertyValue(b) ?? this.noPropertyValue;
						this.type = prevType;

						if (aFallback !== bFallback)
						{
							return (aFallback < bFallback ? -1 : 1) * (this.isASC ? 1 : -1);
						}
					}

					if (this.type !== MessageGridSorting.types.NAME)
					{
						const aName = a.name ?? this.noPropertyValue;
						const bName = b.name ?? this.noPropertyValue;

						return aName.localeCompare(bName, 'en', { numeric: true });
					}
				}

				if (this.type === MessageGridSorting.types.NAME)
				{
					return aSortProperty.localeCompare(bSortProperty, 'en', { numeric: true }) * (this.isASC ? 1 : -1);
				}

				return (aSortProperty < bSortProperty ? -1 : 1) * (this.isASC ? 1 : -1);
			};
		}
	}

	module.exports = { MessageGridSorting };
});
