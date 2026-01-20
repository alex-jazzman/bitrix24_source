import { Type } from 'main.core';
import { AirButtonStyle, Button } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import { mapActions, mapWritableState } from 'ui.vue3.pinia';
import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import './style.css';

// @vue/component
export const EditTemplateSettingsDialog = {
	name: 'EditTemplateSettingsDialog',
	emits: ['close'],
	computed: {
		...mapWritableState(useDiagramStore, [
			'template',
		]),
	},
	beforeMount(): void
	{
		this.localName = this.template?.NAME ?? '';
		this.localDescription = this.template?.DESCRIPTION ?? '';
	},
	mounted(): void
	{
		this.getDialog().setContent(this.$refs.content);
		this.getDialog().show();
	},
	unmounted(): void
	{
		this.instance?.hide();
	},
	methods: {
		...mapActions(useDiagramStore, [
			'updateTemplateData',
		]),
		loc(locString: string): string
		{
			return this.$bitrix.Loc.getMessage(locString);
		},
		getDialog(): Dialog
		{
			if (!this.instance)
			{
				this.instance = this.createDialog();
			}

			return this.instance;
		},
		createDialog(): Dialog
		{
			const confirm = new Button({
				text: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_BUTTON_SAVE'),
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
			});

			const cancel = new Button({
				text: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_BUTTON_CANCEL'),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
			});

			const options = {
				title: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_TITLE'),
				subtitle: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_DESCRIPTION'),
				centerButtons: [
					confirm,
					cancel,
				],
				events: {
					onHide: this.closePopup,
				},
				width: 495,
			};
			const dialog = new Dialog(options);
			cancel.bindEvent('click', () => {
				dialog.hide();
			});
			confirm.bindEvent('click', () => {
				this.template.NAME =
					Type.isStringFilled(this.localName)
						? this.localName
						: this.loc('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE')
				;
				this.template.DESCRIPTION = this.localDescription;
				this.updateTemplateData({
					NAME: this.template.NAME,
					DESCRIPTION: this.template.DESCRIPTION,
				});

				dialog.hide();
			});

			return dialog;
		},
		closePopup(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<div ref="content">
			<div class="bizproc-template-settings-lable">
				{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_SETTINGS_LABEL') }}
			</div>
			<div class="bizproc-template-settings-title">
				<div class="ui-ctl ui-ctl-textbox">
					<input
						v-model="localName"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE')"
						class="ui-ctl-element"
					>
				</div>
			</div>
			<div class="bizproc-template-settings-description">
				<div class="ui-ctl ui-ctl-textarea">
					<textarea
						v-model="localDescription"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DESCRIPTION_PLACEHOLDER')"
						class="ui-ctl-element"
					/>
				</div>
			</div>
		</div>
	`,
};
