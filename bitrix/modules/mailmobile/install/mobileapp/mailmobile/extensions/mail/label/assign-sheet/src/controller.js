/**
 * @module mail/label/assign-sheet/src/controller
 */
jn.define('mail/label/assign-sheet/src/controller', (require, exports, module) => {
	/**
	 * The brain of the assign sheet, free of the layout: it holds the labels of the mailbox, the
	 * marks of the message and drives an optimistic toggle over injected ports. A tap flips the mark
	 * at once and sends the write of a single message; an id missing from processedIds or an error
	 * puts the mark back and reports the failure.
	 */
	class LabelAssignmentController
	{
		/**
		 * @param {{
		 *     uidId: string,
		 *     currentLabelIds: number[]|null,
		 *     ports: {
		 *         loadLabels: function(): Promise<object[]>,
		 *         loadMessageLabels: function(string): Promise<number[]>,
		 *         assign: function(object): Promise<object>,
		 *         unassign: function(object): Promise<object>,
		 *         onChange: function(object): void,
		 *         onError: function(): void,
		 *     },
		 * }} params
		 */
		constructor({ uidId, currentLabelIds = null, ports })
		{
			this.uidId = uidId;
			this.preloadedLabelIds = Array.isArray(currentLabelIds) ? currentLabelIds.map(Number) : null;
			this.ports = ports;
			this.labels = [];
			this.assigned = new Set();
			this.writeQueues = new Map();
		}

		/**
		 * The list of labels always comes from the server; the marks come from the preloaded ids when
		 * the caller already knows them (the card passes chain.properties.labelIds[messageId]) and are
		 * read from the server only otherwise (the list row keeps no labels).
		 *
		 * @returns {Promise<{labels: object[], assigned: number[], requestedMessageLabels: boolean}>}
		 */
		async open()
		{
			this.labels = await this.ports.loadLabels();

			let requestedMessageLabels = false;
			let markedIds = this.preloadedLabelIds;
			if (markedIds === null)
			{
				requestedMessageLabels = true;
				markedIds = await this.ports.loadMessageLabels(this.uidId);
			}

			this.assigned = new Set((markedIds ?? []).map(Number));

			return {
				labels: this.labels,
				assigned: [...this.assigned],
				requestedMessageLabels,
			};
		}

		isAssigned(labelId)
		{
			return this.assigned.has(Number(labelId));
		}

		/**
		 * The marks as a fresh array: the surface that draws them keeps this value in its own state,
		 * so a toggle and a rollback are visible to it as a change.
		 *
		 * @returns {number[]}
		 */
		getAssignedIds()
		{
			return [...this.assigned];
		}

		hasLabels()
		{
			return this.labels.length > 0;
		}

		/**
		 * Flips the mark optimistically and sends the write of a single message. Resolves with the
		 * committed state; on a rollback it reports the failure through the error port.
		 *
		 * @returns {Promise<{assigned: boolean, committed: boolean}>}
		 */
		async toggle(labelId)
		{
			const id = Number(labelId);
			const nextAssigned = !this.assigned.has(id);
			this.#setAssigned(id, nextAssigned);

			return this.#enqueueWrite(id, () => this.#write(id, nextAssigned));
		}

		/**
		 * Writes of one label go one after another. Two quick taps otherwise send the assignment and
		 * the removal in parallel, and the order the server applies them in is not the order they were
		 * tapped in: the mark of the sheet and the binding of the message end up disagreeing.
		 *
		 * @returns {Promise<{assigned: boolean, committed: boolean}>}
		 */
		#enqueueWrite(id, write)
		{
			const previous = this.writeQueues.get(id);
			const request = previous ? previous.catch(() => {}).then(write) : write();
			this.writeQueues.set(id, request);

			return request.finally(() => {
				if (this.writeQueues.get(id) === request)
				{
					this.writeQueues.delete(id);
				}
			});
		}

		async #write(id, nextAssigned)
		{
			const write = nextAssigned ? this.ports.assign : this.ports.unassign;

			try
			{
				const response = await write({ labelIds: [id], ids: [this.uidId] });
				const processedIds = response?.processedIds ?? [];
				if (!processedIds.includes(this.uidId))
				{
					this.#rollback(id, !nextAssigned);

					return { assigned: this.assigned.has(id), committed: false };
				}
			}
			catch (error)
			{
				this.#rollback(id, !nextAssigned);

				return { assigned: this.assigned.has(id), committed: false };
			}

			this.ports.onChange({ labelId: id, assigned: nextAssigned });

			return { assigned: nextAssigned, committed: true };
		}

		#setAssigned(id, assigned)
		{
			if (assigned)
			{
				this.assigned.add(id);
			}
			else
			{
				this.assigned.delete(id);
			}
		}

		#rollback(id, previousAssigned)
		{
			this.#setAssigned(id, previousAssigned);
			this.ports.onError();
		}
	}

	module.exports = { LabelAssignmentController };
});
