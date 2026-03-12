/**
 * @module im/messenger/controller/recent/service/render/lib/queue/const
 */
jn.define('im/messenger/controller/recent/service/render/lib/queue/const', (require, exports, module) => {
	const QueueOperation = {
		setItems: 'setItems',
		setPreparedItems: 'setPreparedItems',
		removeItems: 'removeItems',
		removeItemsByIds: 'removeItemsByIds',
		upsertItems: 'upsertItems',
		upsertPreparedItems: 'upsertPreparedItems',
	};

	module.exports = { QueueOperation };
});
