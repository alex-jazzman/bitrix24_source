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
		const supportsSharingAccessPopup = dataset.supportsSharingAccessPopup === 'true';

		this.data['onclick'] = () => {
			this.emit('close');

			if (!supportsSharingAccessPopup)
			{
				const legacyMethodByMode = {
					'without-edit': 'showSharingDetailWithoutEdit',
					'with-change-rights': 'showSharingDetailWithChangeRights',
					'with-sharing': 'showSharingDetailWithSharing',
				};
				const legacyMethod = legacyMethodByMode[mode] ?? 'showSharingDetailWithChangeRights';

				BX.Runtime.loadExtension('disk.sharing-legacy-popup').then(({ LegacyPopup }) => {
					const popup = new LegacyPopup();
					popup[legacyMethod]({
						object: {
							id: Number(objectId),
							name: objectName,
							isFolder: false,
						},
					});
				});

				return;
			}

			BX.Runtime.loadExtension('disk.sharing-access-popup').then(({ SharingPopupDialog }) => {
				const popup = new SharingPopupDialog();
				popup.open({
					objectId: Number(objectId),
				});
			});
		};
	}

	static detect(itemData)
	{
		return itemData['id'] === 'sharing';
	}
}
