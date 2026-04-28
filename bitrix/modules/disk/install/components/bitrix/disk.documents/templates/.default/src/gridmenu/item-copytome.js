
import { Options as GridOptions } from '../options';
import Item from './item';
import Backend from "../backend";


export default class ItemCopyToMe extends Item
{

	constructor(trackedObjectId, itemData)
	{
		super(trackedObjectId, itemData);

		if (!this.data['onclick'])
		{
			this.data['onclick'] = this.copyToMe.bind(this);
		}
	}

	copyToMe()
	{
		Backend.copyToMeAction(this.trackedObjectId)
			.then((response) => {
				if (response.status === 'success')
				{
					const commonGrid = GridOptions.getCommonGrid();
					commonGrid.reload();
				}
				else if (response.status === 'error')
				{
					this.showError(response.errors);
				}
			});
	}

	static detect(itemData)
	{
		return itemData['id'] === 'copyToMe';
	}

}