/**
 * @module call/calls/incoming-call-hider
 */
jn.define('call/calls/incoming-call-hider', (require, exports, module) => {

	/**
	 * @class IncomingCallHider
	 */
	class IncomingCallHider
	{
		constructor()
		{
			// timeout to close incoming call modal
			this.timeout = null;
			// delay before incoming call modal closing
			this.delay = 30000;
		}

		async schedule()
		{
			this.cancel();

			return new Promise((resolve) => {
				this.timeout = setTimeout(() => {
					this.timeout = null;
					resolve();
				}, this.delay);
			});
		}

		cancel()
		{
			if (this.timeout !== null)
			{
				clearTimeout(this.timeout);
				this.timeout = null;
			}
		}
	}

	module.exports = { IncomingCallHider };
});
