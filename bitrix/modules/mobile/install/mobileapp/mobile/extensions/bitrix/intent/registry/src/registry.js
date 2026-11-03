/**
 * @module intent/registry/src/registry
 */
jn.define('intent/registry/src/registry', (require, exports, module) => {
	/**
	 * Intent code of the portal mapped to the action that opens its section. Single source of truth
	 * for both entries: the native slot of the last notification and the portal address route.
	 *
	 * Kept free of requires on purpose: the mapping is testable without the module environment.
	 */
	class IntentRegistry
	{
		/**
		 * @param {IntentActionEntry[]} [entries] mapping of the codes to the section actions
		 */
		constructor(entries = [])
		{
			this.actions = new Map();
			this.bridgeApplied = false;

			entries.forEach(({ codes, action }) => this.register(codes, action));
		}

		/**
		 * @param {string|string[]} codes one code, or several names of the same section
		 * @param {IntentAction} action
		 * @return {IntentRegistry}
		 */
		register(codes, action)
		{
			[codes].flat().forEach((code) => {
				this.actions.set(code, action);
			});

			return this;
		}

		/**
		 * @return {string[]}
		 */
		getCodes()
		{
			return [...this.actions.keys()];
		}

		/**
		 * @param {string} code
		 * @return {?IntentAction}
		 */
		get(code)
		{
			return this.actions.get(code) ?? null;
		}

		/**
		 * @param {string} code
		 * @return {boolean} the code is known and its action applied
		 */
		apply(code)
		{
			const action = this.get(code);
			if (!action)
			{
				return false;
			}

			action();

			return true;
		}

		/**
		 * Entry of the application layer start. Reading the slot does not clear it on every platform,
		 * so the code coming from it is applied at most once per start.
		 *
		 * @return {boolean} the code from the slot is known and its action applied
		 */
		applyFromBridge()
		{
			if (this.bridgeApplied)
			{
				return false;
			}

			const code = this.resolveFromBridge();
			if (code === null)
			{
				return false;
			}

			this.bridgeApplied = true;

			return this.apply(code);
		}

		/**
		 * Reading is platform-dependent: iOS answers only the name it was asked for and clears the
		 * value on a match, Android ignores the name and keeps the value. So the name that happened
		 * to be asked first proves nothing — the code is taken from the answer itself.
		 *
		 * @return {?string} code of the registry the native slot answers with
		 */
		resolveFromBridge()
		{
			for (const name of this.getCodes())
			{
				const { intent } = Application.getLastNotification(name) ?? {};

				if (intent)
				{
					return this.actions.has(intent) ? intent : null;
				}
			}

			return null;
		}
	}

	module.exports = { IntentRegistry };
});
