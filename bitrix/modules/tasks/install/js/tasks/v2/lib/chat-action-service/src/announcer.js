import { toPlainText } from './chat-hint';
import { announcerLoader } from './extension-loader';

export async function announce(text: string, politeness: 'assertive' | 'polite'): Promise<void>
{
	const announcer = (await announcerLoader.load())?.LiveAnnouncer;

	announcer?.announce(toPlainText(text), politeness);
}
