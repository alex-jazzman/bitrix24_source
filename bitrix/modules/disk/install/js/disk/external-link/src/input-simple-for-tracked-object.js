import { Runtime } from 'main.core';
import InputSimple from './input-simple';
import InputExtendedForTrackedObject from './input-extended-for-tracked-object';
import { BackendForTrackedObject } from './backend';

export default class InputSimpleForTrackedObject extends InputSimple
{
	constructor(objectId, data)
	{
		super(objectId, data);
	}

	getBackend()
	{
		return BackendForTrackedObject;
	}

	openSettingsPopup()
	{
		void Runtime.loadExtension('disk.sharing-access-popup')
			.then(({ SharingPopupDialog }) => {
				const realObjectId = parseInt(this.data?.objectId, 10);

				if (!realObjectId)
				{
					this.constructor.showPopup(this.objectId, this.data);
					return;
				}

				const popup = new SharingPopupDialog();
				popup.open({
					objectId: realObjectId,
					initialTab: 'public',
					onAfterHide: () => {
						void this.reload();
					},
				});
			})
			.catch(() => {
				this.constructor.showPopup(this.objectId, this.data);
			});
	}

	static getExtendedInputClass()
	{
		return InputExtendedForTrackedObject;
	}
}
