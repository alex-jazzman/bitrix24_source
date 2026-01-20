/**
 * @module layout/list-view-queue-worker
 */
jn.define('layout/list-view-queue-worker', (require, exports, module) => {
	const { AsyncQueue } = require('utils/async-queue');

	/**
	 * @class ListViewQueueWorker
	 */
	const DEFAULT_ANIMATION = 'automatic';

	class ListViewQueueWorker
	{
		#listViewRef = null;

		constructor()
		{
			this.asyncQueue = new AsyncQueue();
		}

		/**
		 * @return {ListView}
		 * @throws {Error} If listViewRef is not set
		 */
		get listViewRef()
		{
			if (!this.#listViewRef)
			{
				throw new Error('ListViewRef is not set. Call setListViewRef() first.');
			}

			return this.#listViewRef;
		}

		/**
		 * @return {ListView|null}
		 */
		getListViewRef()
		{
			return this.#listViewRef;
		}

		/**
		 * @param {ListView} ref
		 */
		setListViewRef(ref)
		{
			this.#listViewRef = ref;
		}

		/**
		 * @param {string} key
		 * @return {Object.<{section: number, index: number}>}
		 */
		getElementPosition(key)
		{
			return this.listViewRef.getElementPosition(key);
		}

		/**
		 * @param {number} section
		 * @param {number} index
		 * @param {boolean} animated
		 * @param {string} position
		 * @return {void}
		 */
		scrollTo(section, index, animated = false, position = 'middle')
		{
			return this.listViewRef.scrollTo(section, index, animated, position);
		}

		/**
		 * @param {boolean} animated
		 * @return {void}
		 */
		scrollToBegin(animated = false)
		{
			return this.listViewRef.scrollToBegin(animated);
		}

		/**
		 * @param {ListViewRow[]} items
		 * @param {number} sectionIndex
		 * @param {number} elementIndex
		 * @param {ListViewAnimate} animation
		 * @return {Promise<Object[]>}
		 */
		insertRows(items = [], sectionIndex = 0, elementIndex = 0, animation = DEFAULT_ANIMATION)
		{
			const preparedItems = this.#prepareAddArray(items);
			if (preparedItems.length === 0)
			{
				return Promise.resolve([]);
			}

			return this.asyncQueue.add({
				name: 'insertRows',
				task: () => Promise.resolve(
					this.listViewRef.insertRows(preparedItems, sectionIndex, elementIndex, animation),
				),
			}).run();
		}

		/**
		 * @param {ListViewRow[]} items
		 * @param {ListViewAnimate} animation
		 * @return {Promise<Object[]>}
		 */
		appendRows(items = [], animation = DEFAULT_ANIMATION)
		{
			const preparedItems = this.#prepareAddArray(items);
			if (preparedItems.length === 0)
			{
				return Promise.resolve([]);
			}

			return this.asyncQueue.add({
				name: 'appendRows',
				task: () => Promise.resolve(
					this.listViewRef.appendRows(preparedItems, animation),
				),
			}).run();
		}

		/**
		 * @param {ListViewRow[]} items
		 * @param {Number} sectionIndex
		 * @param {ListViewAnimate} animation
		 * @returns {Promise<Object[]>}
		 */
		appendRowsToSection(items = [], sectionIndex = 0, animation = DEFAULT_ANIMATION)
		{
			const preparedItems = this.#prepareAddArray(items);
			if (preparedItems.length === 0)
			{
				return Promise.resolve([]);
			}

			return this.asyncQueue.add({
				name: 'appendRowsToSection',
				task: () => Promise.resolve(
					this.listViewRef.appendRowsToSection(preparedItems, sectionIndex, animation),
				),
			}).run();
		}

		/**
		 * @param {ListViewRow[]} items
		 * @param {ListViewAnimate} animation
		 * @param {boolean} shouldRender
		 * @return {Promise<Object[]>}
		 */
		updateRows(items = [], animation = 'automatic', shouldRender = true)
		{
			const preparedItems = this.#prepareAddArray(items);

			if (preparedItems.length === 0)
			{
				return Promise.resolve([]);
			}

			return this.asyncQueue.add({
				name: 'updateRows',
				task: () => Promise.resolve(
					this.listViewRef.updateRows(preparedItems, animation, shouldRender),
				),
			}).run();
		}

		/**
		 * @param {string} key
		 * @param {Object} item
		 * @param {boolean} animation
		 * @param {boolean} shouldRender
		 * @return {Promise<Object[]>}
		 */
		updateRowByKey(key = null, item = null, animation = false, shouldRender = true)
		{
			if (!key || !item)
			{
				return Promise.reject(new Error('Key and item are required'));
			}

			return this.asyncQueue.add({
				name: 'updateRowByKey',
				task: () => Promise.resolve(
					this.listViewRef.updateRowByKey(key, item, animation, shouldRender),
				),
			}).run();
		}

		/**
		 * @param {string[]} keys
		 * @param {ListViewAnimate} animation
		 * @return {Promise<Object[]>}
		 */
		deleteRowsByKeys(keys = [], animation = DEFAULT_ANIMATION)
		{
			const preparedKeys = this.#prepareAddArray(keys);
			if (preparedKeys.length === 0)
			{
				return Promise.resolve([]);
			}

			return this.asyncQueue.add({
				name: 'deleteRowsByKeys',
				task: () => new Promise((resolve) => {
					this.listViewRef.deleteRowsByKeys(preparedKeys, animation, () => {
						resolve(preparedKeys);
					});
				}),
			}).run();
		}

		/**
		 * @param {number} section
		 * @param {number} index
		 * @param {ListViewAnimate} animation
		 * @return {Promise<Object[]>}
		 */
		deleteRow(section = 0, index = 0, animation = DEFAULT_ANIMATION)
		{
			return this.asyncQueue.add({
				name: 'deleteRow',
				task: () => new Promise((resolve) => {
					this.listViewRef.deleteRow(section, index, animation, resolve);
				}),
			}).run();
		}

		/**
		 * @param {*} values
		 * @return {Array}
		 */
		#prepareAddArray(values)
		{
			return Array.isArray(values) ? values : [values];
		}
	}

	module.exports = { ListViewQueueWorker };
});
