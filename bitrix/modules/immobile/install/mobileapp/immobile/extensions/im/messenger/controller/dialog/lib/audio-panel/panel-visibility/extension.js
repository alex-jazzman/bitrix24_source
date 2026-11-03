/**
 * @module im/messenger/controller/dialog/lib/audio-panel/panel-visibility
 */
jn.define('im/messenger/controller/dialog/lib/audio-panel/panel-visibility', (require, exports, module) => {
	/**
	 * The floating panel belongs to the native player, and several owners decide its
	 * visibility for the same player: the chat dialog, the comment dialog of a channel
	 * post, the audio tab of the sidebar. On a transition between two of them both speak
	 * at once - the arriving screen hides the panel because the playing row is on it, and
	 * the leaving one shows it because its own dialog is gone. Requests land a few
	 * milliseconds apart, so the user sees the panel blink.
	 *
	 * The arbiter collects requests per player within a short window and applies only the
	 * last one: the newest decision belongs to the screen that stays. The window is a
	 * frame long - it delays the panel imperceptibly and covers the measured gap between
	 * owners with room to spare.
	 *
	 * The applied state is deliberately not cached: the native side hides the panel on its
	 * own (for example, some time after a pause), so a repeated request must reach it.
	 */
	const COALESCE_DELAY = 20;

	class PanelVisibilityArbiter
	{
		#requests = new Map();

		/**
		 * @param {string} playerId
		 * @param {function} apply
		 */
		request(playerId, apply)
		{
			const pending = this.#requests.get(playerId);
			if (pending)
			{
				pending.apply = apply;

				return;
			}

			const request = { apply };
			request.timer = setTimeout(() => {
				this.#requests.delete(playerId);
				request.apply();
			}, COALESCE_DELAY);

			this.#requests.set(playerId, request);
		}

		/**
		 * Drops the pending request of a player that is going away, so its decision does
		 * not fire into a released native player.
		 *
		 * @param {string} playerId
		 */
		cancel(playerId)
		{
			const pending = this.#requests.get(playerId);
			if (!pending)
			{
				return;
			}

			clearTimeout(pending.timer);
			this.#requests.delete(playerId);
		}
	}

	module.exports = {
		panelVisibilityArbiter: new PanelVisibilityArbiter(),
	};
});
