import { Loc } from 'main.core';

export const SliderHeader = {
	emits: ['save', 'cancel'],
	props: {
		isEditMode: {
			type: Boolean,
			default: false,
		},
		canSave: {
			type: Boolean,
			default: false,
		},
		isSaving: {
			type: Boolean,
			default: false,
		},
	},
	computed:
	{
		title()
		{
			if (this.isEditMode)
			{
				return Loc.getMessage('DATASET_IMPORT_EDIT_TITLE_MSGVER_1');
			}

			return Loc.getMessage('DATASET_IMPORT_TITLE_MSGVER_1');
		},
	},
	methods:
	{
		handleSave()
		{
			if (!this.canSave || this.isSaving)
			{
				return;
			}

			this.$emit('save');
		},
	},
	// language=Vue
	template: `
		<header class="biconnector-dataset-import-v2__header">
			<div class="biconnector-dataset-import-v2__header-actions">
				<button
					type="button"
					class="biconnector-dataset-import-v2__save-btn"
					:class="{
						'biconnector-dataset-import-v2__save-btn--disabled': !canSave || isSaving,
					}"
					:disabled="!canSave || isSaving"
					@click="handleSave"
				>
					{{ isEditMode
						? $Bitrix.Loc.getMessage('DATASET_IMPORT_V2_SAVE_BUTTON_EDIT')
						: $Bitrix.Loc.getMessage('DATASET_IMPORT_V2_SAVE_BUTTON_CREATE') }}
				</button>
			</div>
		</header>
	`,
};
