import InputSimple from './input-simple';
import InputExtendedForTrackedObject from './input-extended-for-tracked-object';
import { BackendForTrackedObject } from './backend';

export default class InputSimpleForTrackedObject extends InputSimple
{
	constructor(objectId, data, options)
	{
		super(objectId, data, options);
	}

	getBackend()
	{
		return BackendForTrackedObject;
	}

	getSharingAccessPopupObjectId(): ?number
	{
		// the popup works with the real disk object, not with the tracked one
		const realObjectId = parseInt(this.data?.objectId, 10);

		return realObjectId > 0 ? realObjectId : null;
	}

	static getExtendedInputClass()
	{
		return InputExtendedForTrackedObject;
	}
}
