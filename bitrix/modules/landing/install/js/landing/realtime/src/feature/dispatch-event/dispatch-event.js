export const dispatchEvent = (subscribers: Map, payload: Object): void => {
	const handlers = subscribers.get(payload.eventName);
	if (!handlers)
	{
		return;
	}

	[...handlers].forEach((handler) => {
		try
		{
			handler(payload);
		}
		catch (error)
		{
			// A page-level handler must not block other realtime subscribers.
		}
	});
};
