import InputSimple from './input-simple';

export default class InputSimpleForObject extends InputSimple
{
	getSharingAccessPopupObjectId(): ?number
	{
		// the server decides whether the modern popup applies; the client does not compute it
		return this.data?.supportsSharingAccessPopup === true ? this.objectId : null;
	}
}
