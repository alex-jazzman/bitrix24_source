/**
 * @module layout/ui/reaction/service/storage/src/const
 */
jn.define('layout/ui/reaction/service/storage/src/const', (require, exports, module) => {
	const sharedStorageKey = 'reaction-picker';
	const storedCurrentUserReactionList = `user_reaction_list_${env.userId}`;

	module.exports = {
		sharedStorageKey,
		storedCurrentUserReactionList,
	};
});
