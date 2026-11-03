import { Loc, ajax as Ajax } from 'main.core';
import { AirButtonStyle, Button } from 'ui.buttons';
import { formatFileName, showAirMessageBox } from 'disk.air-message-box';
import { Options as GridOptions } from '../options';
import Item from './item';

export default class ItemDelete extends Item
{
	object: {id: number, name: string};

	constructor(trackedObjectId, itemData)
	{
		super(trackedObjectId, itemData);
		this.object = {
			id: itemData['dataset']['objectId'],
			name: itemData['dataset']['objectName'],
		};

		this.data['onclick'] = this.handleClick.bind(this);
	}

	handleClick()
	{
		this.emit('close');

		showAirMessageBox({
			title: Loc.getMessage('DISK_DOCUMENTS_ACT_DELETE_TITLE'),
			message: formatFileName(Loc.getMessage('DISK_DOCUMENTS_ACT_DELETE_MESSAGE'), this.object.name),
			className: 'disk-air-message-box-equal-buttons',
			buttonsFactory: (messageBox) => {
				const cancelButton = messageBox.getCancelButton({
					style: AirButtonStyle.PLAIN_NO_ACCENT,
				});

				return [
					new Button({
						text: Loc.getMessage('DISK_DOCUMENTS_ACT_DELETE_OK_BUTTON'),
						useAirDesign: true,
						style: AirButtonStyle.FILLED,
						onclick: (button) => {
							button.setWaiting(true);
							this.deleteObject(messageBox, button);
						},
					}),
					cancelButton,
				];
			},
		});
	}

	// BX.Promise does not pass fulfillment down the chain, so the outcome is handled in a single then().
	deleteObject(messageBox, button): Promise
	{
		return Ajax.runAction('disk.api.commonActions.markDeleted', {
			analyticsLabel: 'folder.list.dd',
			data: {
				objectId: this.object.id,
			},
		}).then(() => {
			messageBox.close();
			GridOptions.getCommonGrid().removeItemById(this.trackedObjectId);
		}, () => {
			button.setWaiting(false);
		});
	}

	static detect(itemData)
	{
		return itemData['id'] === 'delete';
	}
}
