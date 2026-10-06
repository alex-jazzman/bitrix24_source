const PENDING_OPERATION_TYPES = new Set([
	'update_block',
	'add_block',
]);

const OPERATION_TYPE_ALIASES = {
	update_block: 'update_block',
	add_block: 'add_block',
	delete_block: 'delete_block',
	remove_block: 'delete_block',
	move_block: 'move_block',
	updateContent: 'update_block',
	addBlock: 'add_block',
	removeBlock: 'delete_block',
	deleteBlock: 'delete_block',
	moveBlock: 'move_block',
};

const DEFAULT_PENDING_STYLE_ID = 'landing-tailwind-runtime-pending-style';
const DEFAULT_PENDING_ATTRIBUTE = 'data-landing-tailwind-runtime-pending';
const DEFAULT_PENDING_VISIBILITY_ATTRIBUTE = 'data-landing-tailwind-runtime-previous-visibility';

export function normalizeOperation(operation: ?Object): ?Object
{
	if (!operation || typeof operation !== 'object')
	{
		return null;
	}

	const type = normalizeOperationType(operation.type || operation.action || operation.command);
	const blockId = normalizeBlockId(operation.blockId ?? operation.block_id ?? operation.id);
	if (!type || blockId === null)
	{
		return null;
	}

	return {
		type,
		blockId,
		raw: operation.raw || operation,
	};
}

export function normalizeOperations(operations: ?Array<Object>): Array<Object>
{
	if (!Array.isArray(operations))
	{
		return [];
	}

	return operations
		.map((operation) => normalizeOperation(operation))
		.filter(Boolean)
	;
}

export function isPendingOperation(operation: ?Object): boolean
{
	const normalizedOperation = normalizeOperation(operation);

	return Boolean(normalizedOperation && PENDING_OPERATION_TYPES.has(normalizedOperation.type));
}

export function getPendingBlockIds(operations: ?Array<Object>): Set<number>
{
	const pendingBlockIds = new Set();
	normalizeOperations(operations).forEach((operation) => {
		if (isPendingOperation(operation))
		{
			pendingBlockIds.add(operation.blockId);
		}
	});

	return pendingBlockIds;
}

export function createTailwindRuntimeBatchSync(TailwindRuntimeSync: Object): Function
{
	return class TailwindRuntimeBatchSync
		{
			constructor(options: Object = {})
			{
				this.landingId = options.landingId;
				this.targetWindow = options.targetWindow || null;
				this.targetDocument = options.targetDocument || this.targetWindow?.document || null;
				this.helpersBasePath = options.helpersBasePath || null;
				this.pendingStyleId = options.pendingStyleId || DEFAULT_PENDING_STYLE_ID;
				this.pendingAttribute = options.pendingAttribute || DEFAULT_PENDING_ATTRIBUTE;
				this.pendingVisibilityAttribute = options.pendingVisibilityAttribute || DEFAULT_PENDING_VISIBILITY_ATTRIBUTE;
				this.operations = normalizeOperations(options.operations || []);
			this.resolveBlockNode = typeof options.resolveBlockNode === 'function'
				? options.resolveBlockNode
				: () => null
			;
			this.onFailure = typeof options.onFailure === 'function' ? options.onFailure : null;
			this.logger = options.logger || null;
			this.finalRebuildRequired = options.finalRebuildRequired === true;
			this.pendingBlockIds = getPendingBlockIds(this.operations);
			this.failed = false;
			this.failureError = null;
			this.prepared = false;
		}

		prepare(): Promise<Set<number>>
		{
			if (this.failed)
			{
				return Promise.resolve(this.getPendingBlockIds());
			}

			this.prepared = true;
			this.#renderPendingStyle();
			this.pendingBlockIds.forEach((blockId) => {
				this.#markPendingBlock(blockId);
			});

			return Promise.resolve(this.getPendingBlockIds());
		}

		afterOperation(operation: Object): Promise<void>
		{
			if (this.failed)
			{
				return Promise.resolve();
			}

			const normalizedOperation = normalizeOperation(operation);
			if (
				!isPendingOperation(normalizedOperation)
				|| !this.pendingBlockIds.has(normalizedOperation.blockId)
			)
			{
				return Promise.resolve();
			}

				this.#markPendingBlock(normalizedOperation.blockId);

				return TailwindRuntimeSync
					.rebuildAndSaveForWindow(this.targetWindow, this.landingId, this.#getRuntimeOptions())
					.then(() => {
						if (this.failed)
						{
						return;
					}

					this.#unmarkPendingBlock(normalizedOperation.blockId);
					this.pendingBlockIds.delete(normalizedOperation.blockId);
					this.#renderPendingStyle();
				})
				.catch((error) => {
					this.fail(error);
				})
			;
		}

		finalize(): Promise<void>
		{
			if (this.failed)
			{
				return Promise.resolve();
			}

			if (this.pendingBlockIds.size <= 0 && !this.finalRebuildRequired)
			{
				this.#renderPendingStyle();

				return Promise.resolve();
				}

				return TailwindRuntimeSync
					.rebuildAndSaveForWindow(this.targetWindow, this.landingId, this.#getRuntimeOptions())
					.then(() => {
						if (this.failed)
						{
						return;
					}

					[...this.pendingBlockIds].forEach((blockId) => {
						this.#unmarkPendingBlock(blockId);
						this.pendingBlockIds.delete(blockId);
					});
					this.#renderPendingStyle();
				})
				.catch((error) => {
					this.fail(error);
				})
			;
		}

		fail(error: Error): void
		{
			if (this.failed)
			{
				return;
			}

			this.failed = true;
			this.failureError = error;
			this.#logFailure(error);

			if (this.onFailure)
			{
				try
				{
					this.onFailure(error, this);
				}
				catch (callbackError)
				{
					this.#logFailure(callbackError);
				}
			}
		}

		isFailed(): boolean
		{
			return this.failed;
		}

			getPendingBlockIds(): Set<number>
			{
				return new Set(this.pendingBlockIds);
			}

			#getRuntimeOptions(): Object
			{
				return {
					helpersBasePath: this.helpersBasePath,
				};
			}

			#markPendingBlock(blockId: number): void
			{
				TailwindRuntimeSync.markPendingNode(
					this.#resolveBlockNode(blockId),
				this.pendingAttribute,
				this.pendingVisibilityAttribute,
			);
		}

		#unmarkPendingBlock(blockId: number): void
		{
			TailwindRuntimeSync.unmarkPendingNode(
				this.#resolveBlockNode(blockId),
				this.pendingAttribute,
				this.pendingVisibilityAttribute,
			);
		}

		#resolveBlockNode(blockId: number): ?Element
		{
			try
			{
				return this.resolveBlockNode(blockId);
			}
			catch (error)
			{
				this.fail(error);

				return null;
			}
		}

		#renderPendingStyle(): void
		{
			TailwindRuntimeSync.renderPendingStyle(
				this.pendingBlockIds,
				this.targetDocument,
				this.pendingStyleId,
			);
		}

		#logFailure(error: Error): void
		{
			if (this.logger && typeof this.logger.error === 'function')
			{
				this.logger.error('TailwindRuntimeBatchSync failed.', error);
			}
		}
	};
}

function normalizeOperationType(type: ?string): ?string
{
	const normalizedType = OPERATION_TYPE_ALIASES[String(type || '')] || null;

	return normalizedType;
}

function normalizeBlockId(blockId: mixed): ?number
{
	const normalizedBlockId = Number(blockId);
	if (!Number.isFinite(normalizedBlockId) || normalizedBlockId <= 0)
	{
		return null;
	}

	return normalizedBlockId;
}
