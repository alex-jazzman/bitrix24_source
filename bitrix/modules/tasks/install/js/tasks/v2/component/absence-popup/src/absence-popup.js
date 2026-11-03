import { h } from 'ui.vue3';

import { Model } from 'tasks.v2.const';
import { AbsencePopupInstance } from './absence-popup-instance';
import { announceAbsentParticipant } from './lib/absence-announcer';

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
		this.announceAbsence();
	},
	methods: {
		showPopup(): void
		{
			setTimeout(() => {
				this.shown = true;
				this.$emit('open', this.userId);
			}, this.delay);
		},
		announceAbsence(): void
		{
			const user = this.$store.getters[`${Model.Users}/getById`](this.userId);
			if (!user?.name)
			{
				return;
			}

			announceAbsentParticipant(user.name);
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
