import { Runtime } from 'main.core';
import Input from './input';
import InputExtended from './input-extended';


export default class InputSimple extends Input
{
	constructor(objectId, data, options)
	{
		super(objectId, data, options);
	}

	static getExtendedInputClass()
	{
		return InputExtended;
	}

	openSettingsPopup(): mixed
	{
		const objectId = this.getSharingAccessPopupObjectId();
		if (objectId === null)
		{
			return super.openSettingsPopup();
		}

		if (!this.canEditSettings())
		{
			return null;
		}

		return Runtime.loadExtension('disk.sharing-access-popup').then(
			({ SharingPopupDialog }) => {
				return new SharingPopupDialog().open({
					objectId,
					initialTab: 'public',
					onAfterHide: () => {
						void this.reload();
					},
				});
			},
			// only an unreachable extension falls back: a failure inside the popup itself has to
			// stay visible instead of turning into a silent switch to the legacy settings
			() => super.openSettingsPopup(),
		);
	}

	// null - the modern popup does not apply to this object and the extended one opens instead
	getSharingAccessPopupObjectId(): ?number
	{
		return null;
	}

	static showPopup(objectId, data = null)
	{
		const className = this.getExtendedInputClass();
		const res = new className(objectId, data);

		if (data === null)
		{
			res.reload();
		}
		else // This behaviour is appropriate for current task
		{
			res.showSettings();
		}
		res.show();
	}
}
