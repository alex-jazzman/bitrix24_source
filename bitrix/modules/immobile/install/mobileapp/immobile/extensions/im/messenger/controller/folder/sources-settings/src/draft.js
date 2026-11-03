/**
 * @module im/messenger/controller/folder/sources-settings/draft
 */
jn.define('im/messenger/controller/folder/sources-settings/draft', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * The composition the user is editing on the sources settings screen: the items of the
	 * getSources answer, the state being changed and the baseline it is compared against.
	 * Holds data only: no layout, no store, no services, so that the rules that are easy
	 * to break stay testable while the native screen around them is not.
	 */
	class FolderSourcesDraft
	{
		#items;
		#enabled;
		#baseline;

		/**
		 * The baseline is taken here, once. A composition changed on another device while
		 * the screen is open stays unnoticed, and the choice being made survives.
		 *
		 * @param {Array<{folderId: number, code: string, enabled: boolean, togglable: boolean}>} items
		 *   source items of the getSources answer, in the order the server built them
		 */
		constructor(items)
		{
			this.#items = Type.isArray(items) ? [...items] : [];
			this.#enabled = new Map(this.#items.map((item) => [item.folderId, Boolean(item.enabled)]));
			this.#baseline = new Map(this.#enabled);
		}

		/**
		 * The items in the order of the answer: the draft never sorts them. The enabled flag
		 * is the one of the draft, not the one the server sent.
		 *
		 * @return {Array<{folderId: number, code: string, enabled: boolean, togglable: boolean}>}
		 */
		getItems()
		{
			return this.#items.map((item) => ({
				...item,
				enabled: Boolean(this.#enabled.get(item.folderId)),
			}));
		}

		/**
		 * @param {number} folderId - the key of the state; the code never is, a showcase item
		 *   carries a code of its own
		 */
		toggle(folderId)
		{
			const item = this.#items.find((candidate) => candidate.folderId === folderId);

			// A locked switcher does not flip itself, but it does call back on every tap
			if (!item || !item.togglable)
			{
				return;
			}

			this.#enabled.set(folderId, !this.#enabled.get(folderId));
		}

		/**
		 * @return {boolean}
		 */
		isChanged()
		{
			for (const [folderId, enabled] of this.#baseline)
			{
				if (this.#enabled.get(folderId) !== enabled)
				{
					return true;
				}
			}

			return false;
		}

		/**
		 * The whole set the screen shows as enabled, in the order of the answer. A locked item
		 * never travels, neither on nor off: the mandatory base of the folder is the business
		 * of the server alone.
		 *
		 * @return {Array<string>}
		 */
		getCodesToSend()
		{
			return this.#items
				.filter((item) => item.togglable && this.#enabled.get(item.folderId))
				.map((item) => item.code)
			;
		}

		/**
		 * Applies what the server saved and moves the baseline forward, so that a repeated save
		 * stays off until something changes again. The answer is applied rather than the set
		 * that was sent: the server may write the mandatory source back or drop a code it does
		 * not know, and the screen owes the composition that really got saved. Called after a
		 * successful update alone: after a refusal the baseline stays where it was and the
		 * choice can be sent again.
		 *
		 * @param {Array<string>} appliedCodes - the composition of the updateSources answer
		 */
		markSaved(appliedCodes)
		{
			const applied = new Set(Type.isArray(appliedCodes) ? appliedCodes : []);

			this.#items.forEach((item) => {
				if (item.togglable)
				{
					this.#enabled.set(item.folderId, applied.has(item.code));
				}
			});

			this.#baseline = new Map(this.#enabled);
		}
	}

	module.exports = { FolderSourcesDraft };
});
