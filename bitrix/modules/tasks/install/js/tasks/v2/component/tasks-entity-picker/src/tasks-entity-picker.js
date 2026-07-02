import { TasksPopup } from 'tasks.v2.component.tasks-popup';
import { EntitySelectorDialog } from 'tasks.v2.lib.entity-selector-dialog';

import './tasks-entity-picker.css';

const idPopupEntityPicker = 'entityDemonstratorPopup';

// @vue/component
export const TasksEntityPicker = {
	name: 'TasksEntityPicker',
	components: {
		TasksPopup,
	},
	props: {
		isOpened: {
			type: Boolean,
			default: false,
		},
		optionsPopup: {
			type: Object,
			default: null,
		},
		optionsEntityPicker: {
			type: Object,
			default: null,
		},
	},
	emits: [
		'select',
		'close',
	],
	data(): Object
	{
		return {
			isOpenedPopup: false,
			intervalRefreshPopupLegacyWorkaround: null,
		};
	},
	computed: {
		optionsPopupDefault(): any
		{
			return {
				id: idPopupEntityPicker,
			};
		},
		optionsPopupFilled(): any
		{
			return {
				...this.optionsPopupDefault,
				...this.optionsPopup,
			};
		},
	},
	watch: {
		async isOpened(value): void {
			if (value)
			{
				this.isOpenedPopup = true;
				this.buildEntityPicker();
				await this.$nextTick();
				// cant use $ref.<popup>.$el because of teleport in popup
				const popup = document.getElementById(idPopupEntityPicker);
				const popupContent = popup.querySelector('.tasks-popup__content');
				const popupLegacy = this.dialog.getPopup();
				popupLegacy.setTargetContainer(popupContent);
				popupLegacy.show();
				this.freezePopupLegacy();
				const popupRef = this.$refs.entityDemonstratorPopup;
				popupRef.setCoordsForPopup();
			}
			else
			{
				this.closeEntityPickerDialog();
			}
		},
	},
	async mounted(): void
	{
		this.buildEntityPicker();
		// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
		this.intervalRefreshPopupLegacyWorkaround = setInterval(() => {
			this.freezePopupLegacy();
		}, 100);
	},
	async beforeUnmount(): void
	{
		// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
		if (this.intervalRefreshPopupLegacyWorkaround)
		{
			clearInterval(this.intervalRefreshPopupLegacyWorkaround);
		}
	},
	methods: {
		closePopup(): void
		{
			this.$emit('close');
		},
		freezePopupLegacy()
		{
			const popupLegacy = this.dialog.getPopup();
			popupLegacy.setAutoHide(false);
			popupLegacy.setClosingByEsc(false);
		},
		handleAfterCloseEntityPickerDialog()
		{
			setTimeout(() => {
				if (this.isOpened)
				{
					this.closePopup();
				}
				this.isOpenedPopup = false;
			}, 100);
		},
		buildEntityPicker(): void {
			this.dialog ??= new EntitySelectorDialog({
				offsetTop: 0,
				events: {
					'Item:onSelect': (event: BaseEvent): void => {
						this.$emit('select', this.dialog);
					},
				},
				...this.optionsEntityPicker,
				popupOptions: {
					events: {
						onAfterClose: this.handleAfterCloseEntityPickerDialog,
					},
					...(this.optionsEntityPicker.popupOptions),
				},
			});
			this.freezePopupLegacy();
			this.dialog.load();
		},
		closeEntityPickerDialog(): void {
			if (this.intervalRefreshPopupLegacyWorkaround)
			{
				clearInterval(this.intervalRefreshPopupLegacyWorkaround);
			}

			const popupLegacy = this.dialog.getPopup();
			popupLegacy.close();
		},
		handleCloseDemonstratorPopup(): void
		{
			this.closePopup();
		},
	},
	template: `
		<TasksPopup
			v-if="isOpenedPopup"
			ref="entityDemonstratorPopup"
			:options="optionsPopupFilled"
			@close="handleCloseDemonstratorPopup"
		>
		</TasksPopup>
	`,
};
