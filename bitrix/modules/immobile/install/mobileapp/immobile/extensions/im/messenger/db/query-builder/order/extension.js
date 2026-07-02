/**
 * @module im/messenger/db/query-builder/order
 */
jn.define('im/messenger/db/query-builder/order', (require, exports, module) => {
	const DIRECTION_ASC = 'ASC';
	const DIRECTION_DESC = 'DESC';

	const NULLS_FIRST = 'FIRST';
	const NULLS_LAST = 'LAST';

	/**
	 * @class OrderClause
	 */
	class OrderClause
	{
		/**
		 * @param {BaseField} field
		 * @param {'ASC'|'DESC'} direction
		 */
		constructor(field, direction)
		{
			this.field = field;
			this.direction = direction;
			this.nulls = null;
		}

		/**
		 * @return {this}
		 */
		nullsFirst()
		{
			this.nulls = NULLS_FIRST;

			return this;
		}

		/**
		 * @return {this}
		 */
		nullsLast()
		{
			this.nulls = NULLS_LAST;

			return this;
		}
	}

	/**
	 * @param {BaseField} field
	 * @return {OrderClause}
	 */
	const asc = (field) => new OrderClause(field, DIRECTION_ASC);

	/**
	 * @param {BaseField} field
	 * @return {OrderClause}
	 */
	const desc = (field) => new OrderClause(field, DIRECTION_DESC);

	module.exports = {
		OrderClause,
		DIRECTION_ASC,
		DIRECTION_DESC,
		NULLS_FIRST,
		NULLS_LAST,

		asc,
		desc,
	};
});
