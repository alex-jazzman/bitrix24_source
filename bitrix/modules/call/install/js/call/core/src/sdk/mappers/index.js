export type RawMessage = {
	message: string,
	senderSid: string,
};

export type Message = {
	content: any,
	error: any,
	from: string,
	timestamp: number,
};

export const createMessage = (rawMessage: RawMessage): Message => {
	let content = null;
	let error = '';

	try
	{
		content = JSON.parse(rawMessage.message);
	}
	catch (err)
	{
		error = err;
	}

	return {
		content,
		error,
		from: rawMessage.senderSid,
		timestamp: Math.floor(Date.now() / 1000),
	};
};
