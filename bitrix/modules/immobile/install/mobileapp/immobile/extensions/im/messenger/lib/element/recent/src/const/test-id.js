/**
 * @module im/messenger/lib/element/recent/const/test-id
 */
jn.define('im/messenger/lib/element/recent/const/test-id', (require, exports, module) => {
	const CounterPrefix = Object.freeze({
		listItemCounter: 'list-item-counter',
	});

	const CounterValue = Object.freeze({
		unread: 'unread',
	});

	const CounterPostfix = Object.freeze({
		unmuted: 'unmuted',
		muted: 'muted',
		watch: 'watch',
	});

	const CounterSuffix = Object.freeze({
		comments: 'comments',
		posts: 'posts',
		messages: 'messages',
	});

	module.exports = {
		CounterPrefix,
		CounterValue,
		CounterPostfix,
		CounterSuffix,
	};
});
