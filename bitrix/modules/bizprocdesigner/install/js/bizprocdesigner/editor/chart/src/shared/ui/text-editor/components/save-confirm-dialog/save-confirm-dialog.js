import { Type } from 'main.core';
import { AirButtonStyle, Button } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

// @vue/component
export const SaveConfirmDialog = {
	name: 'SaveConfirmDialog',
	emits: [
		'save',
		'abort',
		'close',
	],
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
		getDialog(): Dialog
		{
			if (!this.instance)
			{
				this.instance = this.createDialog();
			}

			return this.instance;
		},
		loc(locString: string): string
		{
			return this.$bitrix.Loc.getMessage(locString);
		},
		createDialog(): Dialog
		{
			const confirm = new Button({
				text: this.loc('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_CONFIRM_SAVE'),
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
			});

			const cancel = new Button({
				text: this.loc('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_CONFIRM_ABORT'),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
			});

			const options = {
				title: this.loc('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_CONFIRM_TITLE'),
				subtitle: this.loc('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_CONFIRM_DESCRIPTION'),
				centerButtons: [
					cancel,
					confirm,
				],
				events: {
					onHide: this.closePopup,
				},
				width: 395,
			};
			const dialog = new Dialog(options);
			cancel.bindEvent('click', () => {
				this.$emit('abort');
				dialog.hide();
			});
			confirm.bindEvent('click', () => {
				this.$emit('save');
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
		</div>
	`,
};
