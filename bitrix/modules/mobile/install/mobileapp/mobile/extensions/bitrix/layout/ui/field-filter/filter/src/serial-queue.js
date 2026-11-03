/**
 * @module layout/ui/field-filter/filter/src/serial-queue
 */
jn.define('layout/ui/field-filter/filter/src/serial-queue', (require, exports, module) => {
	/**
	 * The requests one owner has in flight, in the order they were asked for.
	 *
	 * @type {WeakMap<object, Promise>}
	 */
	const queues = new WeakMap();

	/**
	 * Sends the requests of one owner one after another: the next one leaves once the previous has been
	 * answered.
	 *
	 * Two requests over one thing are answered in whatever order the network gives them back, and the
	 * server is then left holding the answer to the older one - the set of fields the user has already
	 * changed, the preset they have already deleted. Queued and not refused: a second tap is a second
	 * action of the user, and the wait it pays for is one request of the first.
	 *
	 * Each caller is answered with its own result, and a request that fails answers only the one who
	 * asked for it: the queue outlives it, or one lost connection would leave the screen unable to send
	 * anything at all.
	 *
	 * @param {object} owner whose requests are ordered against each other
	 * @param {function(): Promise} request
	 * @return {Promise}
	 */
	const runInOrder = (owner, request) => {
		const previous = (queues.get(owner) ?? Promise.resolve());
		const current = previous.then(request);

		queues.set(owner, current.catch(() => {}));

		return current;
	};

	module.exports = { runInOrder };
});
