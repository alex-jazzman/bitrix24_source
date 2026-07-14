import {Sharing} from './sharing';
import {ExternalLinkForTrackedObject} from 'disk.external-link';

class DocumentsExternalLinkForTrackedObject extends ExternalLinkForTrackedObject
{
	openSettingsPopup()
	{
		const supportsSharingAccessPopup = this.data?.supportsSharingAccessPopup === true;

		if (!supportsSharingAccessPopup)
		{
			return this.constructor.showPopup(this.objectId, this.data);
		}

		return super.openSettingsPopup();
	}
}

export class ExternalLink extends Sharing
{
	init()
	{
		this.actionName = 'getExternalLink';
	}

	showLoading()
	{
	}

	hideLoading()
	{
	}

	renderData(data)
	{
		this.node.innerHTML = '';
		const res = new DocumentsExternalLinkForTrackedObject(this.id, data);
		this.node.appendChild(res.getContainer());
	}
}
