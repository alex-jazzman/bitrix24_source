import Item from '../item';

export default class Task extends Item
{
	showSlider(): void
	{
		BX.CrmActivityEditor.getDefault().addTask(
			{
				ownerType: BX.CrmEntityType.resolveName(this.getEntityTypeId()),
				ownerID: this.getEntityId(),
				ownerTitle: this.getOwnerTitle(),
				fromTimeline: true,
			},
		);
	}

	getOwnerTitle(): String
	{
		const ownerInfo = BX.CrmTimelineManager?.getDefault?.()?.getOwnerInfo?.();
		const ownerTitle = ownerInfo?.TITLE;
		if (BX.type.isNotEmptyString(ownerTitle))
		{
			return ownerTitle;
		}

		if (!BX.Crm || !BX.Crm.EntityEditor || !BX.Crm.EntityEditor.getDefault)
		{
			return '';
		}

		const entityEditor = BX.Crm.EntityEditor.getDefault();
		const model = entityEditor?.getModel?.();
		if (!model)
		{
			return '';
		}

		const entityId = parseInt(model.getEntityId(), 10);
		if (model.getEntityTypeId() !== this.getEntityTypeId() || entityId !== this.getEntityId())
		{
			return '';
		}

		const title = model.getCaption?.();

		return BX.type.isNotEmptyString(title) ? title : '';
	}

	supportsLayout(): Boolean
	{
		return false;
	}
}
