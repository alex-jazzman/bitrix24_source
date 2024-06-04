export class VisibleMessagesManager
{
	#visibleMessages: Set = new Set();

	setMessageAsVisible(messageId: number): void
	{
		this.#visibleMessages.add(messageId);
	}

	setMessageAsNotVisible(messageId: number): void
	{
		this.#visibleMessages.delete(messageId);
	}

	getFirstMessageId(): number
	{
		if (this.#visibleMessages.size === 0)
		{
			return 0;
		}

		const [firstVisibleMessage] = [...this.#visibleMessages].sort((a, b) => a - b);

		return firstVisibleMessage;
	}
}
