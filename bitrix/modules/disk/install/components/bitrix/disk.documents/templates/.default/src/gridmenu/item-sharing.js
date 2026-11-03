import Item from './item';

export default class ItemSharing extends Item
{
	constructor(trackedObjectId, itemData)
	{
		super(trackedObjectId, itemData);

		const dataset = itemData.dataset || {};
		const objectId = dataset.objectId;
		const objectName = dataset.objectName;
		const mode = dataset.type;
		const uniqueCode = dataset.uniqueCode;
		const supportsSharingAccessPopup = dataset.supportsSharingAccessPopup === 'true';

		this.data.dataset = { ...dataset, testid: 'disk-documents-menu-sharing' };

		this.data['onclick'] = () => {
			this.emit('close');

			if (!supportsSharingAccessPopup)
			{
				BX.Runtime.loadExtension('disk.sharing-members-popup').then(({ SharingMembersPopup }) => {
					const popup = new SharingMembersPopup();
					popup.open({
						objectId: Number(objectId),
						objectName,
						mode,
					});
				});

				return;
			}

			BX.Runtime.loadExtension('disk.sharing-access-popup').then(({ SharingPopupDialog }) => {
				const popup = new SharingPopupDialog();
				popup.open({
					objectId: Number(objectId),
					uniqueCode,
				});
			});
		};
	}

	static detect(itemData)
	{
		return itemData['id'] === 'sharing';
	}
}
