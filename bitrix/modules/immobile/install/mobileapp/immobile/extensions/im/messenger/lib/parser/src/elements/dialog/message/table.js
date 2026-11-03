/**
 * @module im/messenger/lib/parser/elements/dialog/message/table
 */
jn.define('im/messenger/lib/parser/elements/dialog/message/table', (require, exports, module) => {

	/**
	 * Structural table element (DTO-02). Carries only data - header/row cells whose
	 * `text` is plain text or the inline BB subset ([b] [i] [s] [u] [url] [icode], no [img]).
	 * Presentation lives in the native renderer, not here (SoC, like Code).
	 *
	 * @class Table
	 */
	class Table
	{
		/**
		 * @param {Array<{ text: string }>} [header] - header cells (separate from data rows)
		 * @param {Array<Array<{ text: string }>>} [rows] - data rows; may be [] (header-only)
		 */
		constructor(header = [], rows = [])
		{
			this.type = Table.getType();
			this.header = header;
			this.rows = rows;
		}

		static getType()
		{
			return 'table';
		}
	}

	module.exports = {
		Table,
	};
});
