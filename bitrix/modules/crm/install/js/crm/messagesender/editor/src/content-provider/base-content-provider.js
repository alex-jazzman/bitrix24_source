import { ContentProvider } from 'messageservice.message.editor';

/**
 * @abstract
 */
export class BaseContentProvider<CustomData: Object = Object> extends ContentProvider<CustomData>
{
	getSendData(): Object
	{
		return {};
	}

	resetSendData(): void {}
}
