/**
 * @module im/messenger/const/waiting-entity
 */
jn.define('im/messenger/const/waiting-entity', (require, exports, module) => {

	const WaitingEntity = {
		sync: {
			filler: {
				database: 'database',
				chat: 'chat',
				copilot: 'copilot',
			},
		},
	};

	module.exports = { WaitingEntity };
});
