import { type Uploader } from '../uploader';

export class Filter
{
	#uploader: Uploader;

	constructor(uploader: Uploader, filterOptions: { [key: string]: any } = {})
	{
		this.#uploader = uploader;
	}

	getUploader(): Uploader
	{
		return this.#uploader;
	}

	/**
	 * @abstract
	 */
	apply(...args: any[]): Promise<void>
	{
		throw new Error('You must implement apply() method.');
	}
}
