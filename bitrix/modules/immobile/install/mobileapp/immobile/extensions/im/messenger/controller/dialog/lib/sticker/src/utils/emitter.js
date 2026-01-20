/**
 * @module im/messenger/controller/dialog/lib/sticker/src/utils/emitter
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/utils/emitter', (require, exports, module) => {
	const emitter = new JNEventEmitter();

	/**
	 * @type {{emitter: StickerEventEmitter}}
	 */
	module.exports = { emitter };
});
