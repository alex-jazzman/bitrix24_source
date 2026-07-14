import { h } from 'ui.vue3';
import { AbsencePopupInstance } from './absence-popup-instance';

export { loadUsersAbsenceInfo } from './lib/load-users-absence-info';

// @vue/component
export const AbsencePopup = {
	name: 'AbsencePopup',
	components: {
		AbsencePopupContent: AbsencePopupInstance,
	},
	props: {
		getBindElement: {
			type: Function,
			required: true,
		},
		userId: {
			type: Number,
			required: true,
		},
		delay: {
			type: Number,
			default: 0,
		},
	},
	emits: ['open', 'close'],
	data(): { shown: boolean }
	{
		return {
			shown: false,
		};
	},
	mounted(): void
	{
		this.showPopup();
	},
	methods: {
		showPopup(): void
		{
			setTimeout(() => {
				this.shown = true;
				this.$emit('open', this.userId);
			}, this.delay);
		},
	},
	render(): Object
	{
		if (!this.shown)
		{
			return null;
		}

		return h(AbsencePopupInstance, {
			shown: this.shown,
			userId: this.userId,
			bindElement: this.getBindElement(),
			'onUpdate:shown': (shown: boolean) => {
				this.shown = shown;

				if (!shown)
				{
					this.$emit('close', this.userId);
				}
			},
		});
	},
};
