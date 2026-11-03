/** @module tasks/checklist/view-model/support/src/memo */
jn.define('tasks/checklist/view-model/support/src/memo', (require, exports, module) => {
	/** @return {function(object): string} */
	const createRefKeyer = () => {
		const keys = new WeakMap();
		let seq = 0;

		return (ref) => {
			if (!keys.has(ref))
			{
				seq += 1;
				keys.set(ref, String(seq));
			}

			return keys.get(ref);
		};
	};

	module.exports = { createRefKeyer };
});
