/**
 * @module layout/ui/reaction/service/storage/src/server
 */
jn.define('layout/ui/reaction/service/storage/src/server', (require, exports, module) => {
	const { Tourist } = require('tourist');
	const {
		storedCurrentUserReactionList,
	} = require('layout/ui/reaction/service/storage/src/const');

	class TouristStorage
	{
		static #init(fn)
		{
			return Tourist.ready()
				.then(fn)
				.catch(console.error);
		}

		static async set(value)
		{
			return TouristStorage.#init(() => {
				void Tourist.remember(storedCurrentUserReactionList, { context: value });
			});
		}

		static async get()
		{
			return TouristStorage.#init(() => {
				return Tourist.getContext(storedCurrentUserReactionList);
			});
		}
	}

	module.exports = {
		TouristStorage,
	};
});
