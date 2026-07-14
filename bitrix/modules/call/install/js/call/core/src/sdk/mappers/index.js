export type RawMessage = {
	message: string,
	senderSid: string,
};

export type Message = {
	text: string,
	from: string,
	timestamp: number,
};

export const createMessage = (rawMessage: RawMessage): Message => {
	return {
		text: rawMessage.message,
		from: rawMessage.senderSid,
		timestamp: Math.floor(Date.now() / 1000),
	};
};
