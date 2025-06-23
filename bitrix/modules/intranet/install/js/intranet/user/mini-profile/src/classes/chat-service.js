import { Messenger } from 'im.public';

export class ChatService
{
	static openMessenger(userId: number): void
	{
		Messenger?.openChat(String(userId));
	}

	static call(userId: number, withVideo: boolean): void
	{
		Messenger?.startVideoCall(String(userId), withVideo);
	}
}
