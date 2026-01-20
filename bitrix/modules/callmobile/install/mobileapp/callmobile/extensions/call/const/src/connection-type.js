/**
 * @module call/const/connection-type
 */
jn.define('call/const/connection-type', (require, exports, module) => {
	const ConnectionType = Object.freeze({
		peerToPeer: 0,
		server: 1,
	});

	module.exports = { ConnectionType };
});
