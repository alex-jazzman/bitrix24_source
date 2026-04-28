import { Dialog } from 'crm.vue3.dialog';

export const SegmentSelector = {
	components: {
		Dialog,
	},

	props: {
		segments: {
			type: Array,
			required: true,
		},
		currentSegmentId: {
			type: Number,
			required: true,
		},
	},

	created()
	{
		this.tabs = [
			{ id: 'segments', title: '' },
		];
	},

	computed: {
		items(): Array<Object>
		{
			const currentId = String(this.currentSegmentId);

			return this.segments.map((segment) => ({
				id: segment.id,
				title: segment.title,
				entityId: 'segment',
				tabs: 'segments',
				selected: String(segment.id) === currentId,
			}));
		},
	},

	// language=Vue
	template: `
		<Dialog
			:items="items"
			:tabs="tabs"
		/>
	`,
};
