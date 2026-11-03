import InputSimple from './input-simple';
import InputExtendedForUnifiedLink from './input-extended-for-unified-link';
import {BackendForUnifiedLink} from './backend';

export default class InputSimpleForUnifiedLink extends InputSimple
{
	constructor(objectId, data, options)
	{
		super(objectId, data, options);
	}

	getBackend()
	{
		return BackendForUnifiedLink;
	}

	static getExtendedInputClass()
	{
		return InputExtendedForUnifiedLink;
	}
}
