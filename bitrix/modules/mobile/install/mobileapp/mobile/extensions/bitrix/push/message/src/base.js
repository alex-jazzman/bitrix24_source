/**
 * @module push/message/src/base
 */
jn.define('push/message/src/base', (require, exports, module) => {
	/**
	 * @class BaseMessage
	 */
	class BaseMessage
	{
		constructor({ id, type, title, body, payload, imageUrl })
		{
			this.id = id;
			this.type = type;
			this.title = title;
			this.body = body;
			this.payload = payload;
			this.imageUrl = imageUrl;
		}

		/**
		 * @returns {boolean}
		 */
		hasBody()
		{
			return this.body.length > 0;
		}
	}

	module.exports = {
		BaseMessage,
	};
});
