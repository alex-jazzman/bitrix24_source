import { Loc } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Alert } from 'ui.system.alert.vue';
import { AlertDesign } from 'ui.system.alert';
import { TextSm } from 'ui.system.typography.vue';

import { type EditorError, type EditorStore } from '../model/editor-store';

export type EditorActionsInstance = {
	focusErrors(): void;
};

export const EditorActions = defineComponent({
	name: 'CrmMailTemplateEditorActions',
	components: { UiButton, Alert, TextSm },
	props: {
		store: {
			type: Object as PropType<EditorStore>,
			required: true,
		},
	},
	emits: ['save', 'cancel'],
	expose: ['focusErrors'],
	setup()
	{
		return { Loc, AirButtonStyle, ButtonSize, AlertDesign };
	},
	computed: {
		errors(): EditorError[]
		{
			const fields = new Set(['title', 'entityTypeId', 'access', 'isActive', 'emailFrom', 'subject']);

			return this.store.state.errors.filter((error) => !fields.has(error.field ?? ''));
		},
	},
	methods: {
		focusErrors(): void
		{
			(this.$refs.errors as HTMLElement | undefined)?.focus();
		},
		handleSave(): void
		{
			if (this.store.canSave)
			{
				this.$emit('save');
			}
		},
		handleCancel(): void
		{
			if (!this.store.state.busy)
			{
				this.$emit('cancel');
			}
		},
	},
	template: `
		<div class="crm-mail-template-editor__actions" data-testid="crm-mail-template-editor-actions">
			<div
				v-if="errors.length > 0"
				ref="errors"
				class="crm-mail-template-editor__errors"
				role="alert"
				tabindex="-1"
				data-testid="crm-mail-template-save-errors"
			>
				<Alert :design="AlertDesign.tintedAlert">
					<TextSm
						v-for="(error, index) in errors"
						:key="index"
						tag="div"
						class="crm-mail-template-editor__error"
						wrap="break-words"
					>{{ error.message }}</TextSm>
				</Alert>
			</div>
			<div class="crm-mail-template-editor__buttons">
				<UiButton
					:text="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SAVE')"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.LARGE"
					:disabled="!store.canSave"
					:loading="store.state.busy"
					:dataset="{ testid: 'crm-mail-template-save' }"
					type="button"
					@click="handleSave"
				/>
				<UiButton
					:text="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_CANCEL')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.LARGE"
					:disabled="store.state.busy"
					:dataset="{ testid: 'crm-mail-template-cancel' }"
					type="button"
					@click="handleCancel"
				/>
			</div>
		</div>
	`,
});
