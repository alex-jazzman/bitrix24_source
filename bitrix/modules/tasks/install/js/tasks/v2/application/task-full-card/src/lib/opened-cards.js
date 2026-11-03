import { isSameTaskId } from './is-same-task-id';

type TaskId = number | string;

class OpenedCards
{
	#taskIds: Map<Object, TaskId> = new Map();
	#bootstrappedCards: Set<Object> = new Set();
	#mountedCards: Set<Object> = new Set();

	add(card: Object, taskId: TaskId): void
	{
		this.#taskIds.set(card, taskId);
	}

	remove(card: Object): void
	{
		this.#taskIds.delete(card);
		this.#bootstrappedCards.delete(card);
		this.#mountedCards.delete(card);
	}

	// a card is bootstrapped once it either announces its task or gives up on loading it
	markBootstrapped(card: Object): void
	{
		if (this.#taskIds.has(card))
		{
			this.#bootstrappedCards.add(card);
		}
	}

	// unlike bootstrapped, mounted covers only a card that announced its task, never one that failed to load it
	markMounted(card: Object): void
	{
		if (this.#taskIds.has(card))
		{
			this.#mountedCards.add(card);
		}
	}

	has(taskId: TaskId): boolean
	{
		return [...this.#taskIds.values()].some((currentTaskId: TaskId) => isSameTaskId(taskId, currentTaskId));
	}

	isBootstrapped(taskId: TaskId): boolean
	{
		return this.#hasCardOfTask(this.#bootstrappedCards, taskId);
	}

	isMounted(taskId: TaskId): boolean
	{
		return this.#hasCardOfTask(this.#mountedCards, taskId);
	}

	#hasCardOfTask(cards: Set<Object>, taskId: TaskId): boolean
	{
		return [...cards].some((card: Object) => {
			const currentTaskId = this.#taskIds.get(card);

			return currentTaskId !== undefined && isSameTaskId(taskId, currentTaskId);
		});
	}
}

// entries are keyed by card, so two cards of the same task neither overwrite nor remove each other
export const openedCards = new OpenedCards();
