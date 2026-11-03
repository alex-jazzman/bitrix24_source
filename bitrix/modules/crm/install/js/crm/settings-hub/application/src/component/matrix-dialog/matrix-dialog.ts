import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Popup } from 'ui.vue3.components.popup';
import {
	Button as UiButton,
	AirButtonStyle,
	ButtonSize,
} from 'ui.vue3.components.button';

import {
	type RuntimeSettingsStateContext,
	useSettingsStateContext,
} from '../../context/settings-state';
import { type SettingId, type SettingMatrix } from '../../model/types';

import './matrix-dialog.css';

export const CrmSettingsHubMatrixDialog = defineComponent({
	name: 'CrmSettingsHubMatrixDialog',
	components: { Popup, UiButton },
	mixins: [locMixin],
	props: {
		settingId: {
			type: String as PropType<SettingId | null>,
			default: null,
		},
		matrix: {
			type: Object as PropType<SettingMatrix | null>,
			default: null,
		},
		open: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['close'],
	setup(): {
		settingsStateContext: RuntimeSettingsStateContext,
		AirButtonStyle: typeof AirButtonStyle,
		ButtonSize: typeof ButtonSize,
		}
	{
		return {
			settingsStateContext: useSettingsStateContext(),
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { initialSelectedIds: string[], selectedIds: string[] }
	{
		return {
			initialSelectedIds: [] as string[],
			selectedIds: [] as string[],
		};
	},
	computed: {
		pending(): boolean
		{
			return (
				this.settingId !== null
				&& this.settingsStateContext.isPending(this.settingId)
			);
		},
		controlsDisabled(): boolean
		{
			return (
				this.settingId === null
				|| this.settingsStateContext.get(this.settingId).canEdit !== true
				|| this.pending
			);
		},
		popupId(): string
		{
			return 'crm-settings-hub-application-matrix-dialog';
		},
		titleId(): string
		{
			return `${this.popupId}-title`;
		},
		popupOptions(): Object
		{
			return {
				id: this.popupId,
				className: 'crm-settings-hub-application-matrix-dialog',
				ariaLabelledBy: this.titleId,
				bindElement: window,
				width: 480,
				overlay: true,
				closeByEsc: true,
				autoHide: true,
				closeIcon: true,
				cacheable: false,
				padding: 0,
				animation: 'fading-slide',
			};
		},
		title(): string
		{
			return this.loc('CRM_SETTINGS_HUB_MATRIX_TITLE');
		},
		subtitle(): string
		{
			return this.loc('CRM_SETTINGS_HUB_MATRIX_SUBTITLE');
		},
		emptyText(): string
		{
			return this.loc('CRM_SETTINGS_HUB_MATRIX_EMPTY');
		},
		isDirty(): boolean
		{
			const initialSelectedIds = this.normalizeSelectedIds(this.initialSelectedIds);
			const selectedIds = this.normalizeSelectedIds(this.selectedIds);

			return (
				initialSelectedIds.length !== selectedIds.length
				|| initialSelectedIds.some((id, index) => id !== selectedIds[index])
			);
		},
	},
	watch: {
		open: {
			immediate: true,
			handler(isOpen: boolean): void
			{
				if (isOpen)
				{
					this.syncSelection();
				}
			},
		},
	},
	mounted(): void
	{
		this.markPopupTestIds();
	},
	updated(): void
	{
		this.markPopupTestIds();
	},
	methods: {
		normalizeSelectedIds(selectedIds: string[]): string[]
		{
			const selectedIdsSet = new Set(selectedIds);

			return this.matrix?.types
				.filter((type) => selectedIdsSet.has(type.id))
				.map((type) => type.id)
				?? []
			;
		},
		syncSelection(): void
		{
			const selectedIds = this.matrix?.types
				.filter((type) => type.checked === true)
				.map((type) => type.id)
				?? []
			;
			this.initialSelectedIds = [...selectedIds];
			this.selectedIds = [...selectedIds];
		},
		isSelected(id: string): boolean
		{
			return this.selectedIds.includes(id);
		},
		handleSelectionChange(id: string, event: Event): void
		{
			if (this.controlsDisabled)
			{
				return;
			}
			const checked = (event.target as HTMLInputElement).checked;

			this.selectedIds = this.normalizeSelectedIds(
				checked
					? [...new Set([...this.selectedIds, id])]
					: this.selectedIds.filter((selectedId) => selectedId !== id),
			);
		},
		async handleSave(): Promise<void>
		{
			const settingId = this.settingId;
			if (settingId === null || this.controlsDisabled)
			{
				return;
			}

			if (!this.isDirty)
			{
				this.handleCancel();

				return;
			}

			try
			{
				await this.settingsStateContext.update(
					settingId,
					this.normalizeSelectedIds(this.selectedIds),
				);
			}
			finally
			{
				this.handleCancel();
			}
		},
		handleCancel(): void
		{
			this.$emit('close');
		},
		markPopupTestIds(): void
		{
			const popup = this.$refs.popup as { container?: HTMLElement } | undefined;
			const container = popup?.container;
			if (container instanceof HTMLElement)
			{
				container.dataset.testid = this.popupId;
				const closeButton = container.querySelector<HTMLElement>('.popup-window-close-icon');
				if (closeButton !== null)
				{
					closeButton.dataset.testid = `${this.popupId}-close`;
				}
			}

			const overlay = document.getElementById(`popup-window-overlay-${this.popupId}`);
			if (overlay !== null)
			{
				overlay.dataset.testid = `${this.popupId}-overlay`;
			}
		},
	},
	template: `
		<Popup
			v-if="open && matrix"
			ref="popup"
			:id="popupId"
			:options="popupOptions"
			@close="handleCancel"
		>
			<div
				class="crm-settings-hub-application__matrix"
				data-testid="crm-settings-hub-application-matrix-dialog-content"
			>
				<div class="crm-settings-hub-application__matrix-header">
					<span :id="titleId" class="crm-settings-hub-application__matrix-title">{{ title }}</span>
					<span class="crm-settings-hub-application__matrix-subtitle">{{ subtitle }}</span>
				</div>
				<div
					v-if="matrix.types.length"
					class="crm-settings-hub-application__matrix-list"
					data-testid="crm-settings-hub-application-matrix-list"
				>
					<label
						v-for="type in matrix.types"
						:key="type.id"
						class="crm-settings-hub-application__matrix-row"
						:data-testid="'crm-settings-hub-application-matrix-row-' + type.id"
					>
						<input
							type="checkbox"
							class="crm-settings-hub-application__matrix-check"
							:data-testid="'crm-settings-hub-application-matrix-checkbox-' + type.id"
							:aria-label="type.name"
							:checked="isSelected(type.id)"
							:disabled="controlsDisabled"
							@change="handleSelectionChange(type.id, $event)"
						>
						<span class="crm-settings-hub-application__matrix-name">{{ type.name }}</span>
					</label>
				</div>
				<div
					v-else
					class="crm-settings-hub-application__matrix-empty"
					data-testid="crm-settings-hub-application-matrix-empty"
				>
					{{ emptyText }}
				</div>
				<div class="crm-settings-hub-application__matrix-actions">
					<UiButton
						:text="loc('UI_BUTTONS_SAVE_BTN_TEXT')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED_SUCCESS"
						:disabled="!isDirty || controlsDisabled"
						:loading="pending"
						:dataset="{ testid: 'crm-settings-hub-application-matrix-save' }"
						@click="handleSave"
					/>
					<UiButton
						:text="loc('UI_BUTTONS_CANCEL_BTN_TEXT')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.PLAIN"
						:disabled="pending"
						:dataset="{ testid: 'crm-settings-hub-application-matrix-cancel' }"
						@click="handleCancel"
					/>
				</div>
			</div>
		</Popup>
	`,
});
