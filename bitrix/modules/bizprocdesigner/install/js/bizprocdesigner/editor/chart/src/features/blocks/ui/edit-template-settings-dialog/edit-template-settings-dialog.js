import { Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { AirButtonStyle, Button } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import { mapActions, mapState, mapWritableState } from 'ui.vue3.pinia';
import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { getErrorCode, getErrorMessage, handleResponseError } from '../../../../shared/utils/response';
import { TemplateDescriptionField } from '../template-description-field/template-description-field';
import './style.css';

// Wide enough to give the description editor a comfortable working area. Not driven by the
// toolbar: its buttons already fit on a single row well below this width.
const DIALOG_WIDTH = 600;

// API-01: the server rejects a description over its length limit with this code. Branching on
// the code (never on the message) keeps the check independent of the wording and of the locale.
// The code itself says nothing about the field, hence the extra condition in isDescriptionRejected().
const INVALID_PARAM_ARG_ERROR_CODE = 'INVALID_PARAM_ARG';

// @vue/component
export const EditTemplateSettingsDialog = {
	name: 'EditTemplateSettingsDialog',
	components: {
		TemplateDescriptionField,
	},
	emits: ['close'],
	data(): Object
	{
		return {
			localName: '',
			localDescription: '',
			isSaving: false,
		};
	},
	computed: {
		// The template stays writable here: unlike applyTemplateMetadata(), which writes the store
		// before the request, this window writes it only once the server has accepted the values.
		...mapWritableState(useDiagramStore, [
			'template',
		]),
		...mapState(useDiagramStore, [
			'copilotOptions',
			'isWriteLocked',
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
			// The dataset key is lower-case on purpose: dataset.testid renders as data-testid, the
			// attribute page.getByTestId() looks for. A camel-cased testId would render data-test-id.
			const confirm = new Button({
				text: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_BUTTON_SAVE'),
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
				dataset: { testid: 'bizprocdesigner-template-settings-save' },
			});

			const cancel = new Button({
				text: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_BUTTON_CANCEL'),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				dataset: { testid: 'bizprocdesigner-template-settings-cancel' },
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
				width: DIALOG_WIDTH,
			};
			const dialog = new Dialog(options);
			cancel.bindEvent('click', () => {
				dialog.hide();
			});
			confirm.bindEvent('click', () => {
				this.saveSettings(dialog, confirm);
			});

			return dialog;
		},
		// The store is written only after the request came back without an error: a rejected
		// description left in the store would still reach the server with the next draft publish,
		// which carries the whole template and does not check the length. A refusal the editor
		// answers for itself arrives as `false` rather than an error and stops the write just the
		// same: those values never reached the server either.
		async saveSettings(dialog: Dialog, saveButton: Button): Promise<void>
		{
			// The window now outlives the request, so the button stays clickable: without the
			// flag every extra click sends the payload again and repeats the balloon, the
			// announcement and the focus jump into the editor.
			if (this.isSaving)
			{
				return;
			}

			// A locked editor accepts no write, and the store must not take one either: in version
			// view mode this.template carries a past version, and the metadata of the current one
			// would silently overwrite it. Nothing is left to fix here, so the window just closes.
			if (this.isWriteLocked)
			{
				dialog.hide();

				return;
			}

			// The field stays editable for the whole request, so every branch of the answer reads
			// this snapshot instead of the live value: the answer belongs to what was sent, and a
			// keystroke that arrived meanwhile must not pass for a value the server has seen.
			const submitted = Object.freeze({
				NAME: Type.isStringFilled(this.localName)
					? this.localName
					: this.loc('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE'),
				DESCRIPTION: this.localDescription,
			});

			this.isSaving = true;
			saveButton.setWaiting();

			let isSaved = false;

			try
			{
				// The refusals the editor answers for itself - a deleted template, a lost right to
				// write, a lease taken elsewhere - leave the window nothing to fix, and the store
				// says so with `false`. Everything else comes back as an error, because the only
				// refusal fixable right here is read off it.
				isSaved = await this.updateTemplateData(submitted, true);
			}
			catch (error)
			{
				handleResponseError(error);

				// The description over the limit is the only rejection the user can fix right
				// here, so the window stays open and keeps the text instead of losing it.
				if (this.isDescriptionRejected(error, submitted.DESCRIPTION))
				{
					this.reportDescriptionRejected(error, submitted.DESCRIPTION);
				}
				else
				{
					dialog.hide();
				}

				return;
			}
			finally
			{
				this.isSaving = false;
				saveButton.setWaiting(false);
			}

			if (!isSaved)
			{
				dialog.hide();

				return;
			}

			this.template.NAME = submitted.NAME;
			this.template.DESCRIPTION = submitted.DESCRIPTION;

			dialog.hide();
		},
		// INVALID_PARAM_ARG is a code shared by the whole bizproc api, so the field must not be
		// marked on the code alone. Diagram.updateTemplate validates a single argument, the
		// description, and an empty one it never rejects: with nothing sent the refusal belongs
		// to another field and only the balloon carries it. The verdict is read off the sent
		// description, not off the field: a text cleared while the request was in flight would
		// otherwise disown the refusal, close the window and drop the edit with it.
		isDescriptionRejected(error: Object, sentDescription: string): boolean
		{
			return getErrorCode(error) === INVALID_PARAM_ARG_ERROR_CODE
				&& Type.isStringFilled(sentDescription)
			;
		},
		// The balloon that shows the message lives outside the window and carries no live region,
		// so on its own the rejection reaches neither a screen reader nor the field it is about.
		reportDescriptionRejected(error: Object, sentDescription: string): void
		{
			// The field stayed editable for the whole request, so by now it may hold another text.
			// The refusal belongs to the one that was sent: marking the field would blame the new
			// text for the verdict on the old, and the focus is already where the user put it by
			// typing. The balloon has carried the message, so there is nothing left to add here.
			if (this.localDescription !== sentDescription)
			{
				return;
			}

			const message = (getErrorMessage(error) ?? '').trim();

			// A rejection without a text explains nothing: announcing it and marking the field
			// would leave the user with a broken field and silence. The window still stays open
			// with the text in it, so the focus has to come back into it all the same: waiting on
			// the save button put a real disabled on it, and the browser took the focus off.
			if (message === '')
			{
				this.$refs.descriptionField?.focus();

				return;
			}

			LiveAnnouncer.announce(message, 'assertive');
			this.$refs.descriptionField?.showError(message);
		},
		closePopup(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<div
			ref="content"
			class="bizproc-template-settings"
			data-testid="bizprocdesigner-template-settings"
		>
			<div class="bizproc-template-settings-lable">
				{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_SETTINGS_LABEL') }}
			</div>
			<div class="bizproc-template-settings-title">
				<div class="ui-ctl ui-ctl-textbox">
					<input
						v-model="localName"
						:disabled="isWriteLocked"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE')"
						class="ui-ctl-element"
						data-testid="bizprocdesigner-template-settings-name"
					>
				</div>
			</div>
			<div
				class="bizproc-template-settings-description"
				data-testid="bizprocdesigner-template-settings-description"
			>
				<TemplateDescriptionField
					ref="descriptionField"
					v-model:text="localDescription"
					:copilotOptions="copilotOptions"
					:placeholder="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DESCRIPTION_PLACEHOLDER')"
				/>
			</div>
		</div>
	`,
};
