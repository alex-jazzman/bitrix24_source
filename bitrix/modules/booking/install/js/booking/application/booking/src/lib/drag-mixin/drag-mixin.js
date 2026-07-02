import { Drag } from 'booking.lib.drag';
import { DraggedElementKind } from 'booking.const';

export const DragMixin = {
	beforeUnmount(): void
	{
		this.dragManager?.destroy();
	},
	methods: {
		setupDrag(): void
		{
			let dataId = null;
			let dataKind = null;

			if (this.editingBookingId)
			{
				dataId = this.editingBookingId;
				dataKind = DraggedElementKind.Booking;
			}

			if (this.editingWaitListItemId)
			{
				dataId = this.editingWaitListItemId;
				dataKind = DraggedElementKind.WaitListItem;
			}

			this.createDragManager(dataId, dataKind);
		},
		createDragManager(id: number | string = '', kind: $Values<typeof DraggedElementKind> = null): void
		{
			this.dragManager?.destroy();
			this.dragManager = null;

			if (this.isFeatureEnabled && this.$el.parentElement)
			{
				const dataId = id ? `[data-id="${id}"]` : '';
				const dataKind = kind ? `[data-kind="${kind}"]` : '';

				this.dragManager = new Drag({
					container: this.$el.parentElement,
					draggable: `.booking--draggable-item${dataId}${dataKind}`,
				});
			}
		},
	},
};
