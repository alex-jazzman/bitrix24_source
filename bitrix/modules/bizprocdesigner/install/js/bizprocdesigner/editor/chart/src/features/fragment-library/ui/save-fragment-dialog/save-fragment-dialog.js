import { Dom } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { AirButtonStyle, Button } from 'ui.buttons';
import { UI } from 'ui.notification';
// The Vue checkbox comes from the vanilla extension, which re-exports it and carries its styles:
// ui.system.checkbox.vue has no bundle of its own and crashes on load.
import { Vue as CheckboxVue, CheckboxSize } from 'ui.system.checkbox';
import { Dialog } from 'ui.system.dialog';
import { BInput } from 'ui.system.input.vue';
import { TextSm } from 'ui.system.typography.vue';
import { mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import {
	fragmentLibraryApi,
	FRAGMENT_NAME_MAX_LENGTH,
	FragmentLibraryErrorCode,
	isSurfaceRefusal,
} from '../../../../entities/fragment-library';
import { useLoc } from '../../../../shared/composables';
import { getErrorCode, handleResponseError } from '../../../../shared/utils/response';
import './style.css';

// Enough for the name of a fragment and its single checkbox; the window carries nothing else.
const DIALOG_WIDTH = 460;

const NOTIFICATION_DELAY_MS = 4000;

/**
 * The refusals of saving this window says better than the server does: the server names blocks of a
 * template, while the person is looking at a selection of nodes. Everything outside this map travels on to
 * the shared handler with the message the server sent.
 */
const SAVE_ERROR_MESSAGE_IDS = Object.freeze({
	[FragmentLibraryErrorCode.emptySelection]: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_ERROR_EMPTY_SELECTION',
	[FragmentLibraryErrorCode.tooLarge]: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_ERROR_TOO_LARGE',
	[FragmentLibraryErrorCode.tooDeep]: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_ERROR_TOO_DEEP',
});

let dialogUidSeq = 0;

/**
 * The selection of the scheme on its way into the library (API-02). The name and the visibility live here
 * until the server accepts them: nothing of this window reaches the store of the diagram, so a refusal
 * costs the person the request and not the text they typed.
 */
// @vue/component
export const SaveFragmentDialog = {
	name: 'SaveFragmentDialog',
	components: {
		BInput,
		Checkbox: CheckboxVue.Checkbox,
		TextSm,
	},
	props: {
		/** @type Block[] */
		blocks: {
			type: Array,
			required: true,
		},
		/** @type Connection[] */
		connections: {
			type: Array,
			required: true,
		},
	},
	emits: ['close'],
	setup(): Object
	{
		dialogUidSeq += 1;

		return {
			...useLoc(),
			checkboxSize: CheckboxSize.Md,
			// The caption toggles the checkbox through `for`, so the input needs an id of its own.
			sharedInputId: `bizprocdesigner-save-fragment-shared-${dialogUidSeq}`,
		};
	},
	data(): Object
	{
		return {
			name: '',
			// AC-011: the fragment is offered to everybody unless its author says otherwise.
			isShared: true,
			nameError: '',
			isSaving: false,
		};
	},
	computed: {
		...mapState(useDiagramStore, [
			'templateId',
			'documentTypeSigned',
		]),
	},
	watch: {
		// A refusal belongs to the text that earned it, so the next keystroke takes the mark off it.
		name(value: string): void
		{
			this.nameError = '';
			this.setSubmitDisabled(value.trim() === '');
		},
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
				text: this.getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_DIALOG_BUTTON_SAVE'),
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
				disabled: true,
				dataset: { testid: 'bizprocdesigner-save-fragment-submit' },
			});
			this.confirmButton = confirm;

			const cancel = new Button({
				text: this.getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_DIALOG_BUTTON_CANCEL'),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				dataset: { testid: 'bizprocdesigner-save-fragment-cancel' },
			});

			const dialog = new Dialog({
				title: this.getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_DIALOG_TITLE'),
				centerButtons: [
					confirm,
					cancel,
				],
				events: {
					onHide: this.closePopup,
				},
				width: DIALOG_WIDTH,
				// Closing by a click outside is what kills the checkbox of the visibility: to keep such a
				// click from closing itself, ui.system.dialog answers the auto-hide of the popup with
				// preventDefault() on EVERY click inside the window, and a checkbox has nothing left to
				// toggle by. Without the auto-hide the handler is not even bound (main.popup binds it only
				// for a popup that has it on and carries no overlay), and the control works. The window
				// still closes by Escape and by its own button of cancelling, and a form with a typed name
				// is better off not being dismissed by a stray click anyway.
				closeByClickOutside: false,
			});

			cancel.bindEvent('click', () => {
				dialog.hide();
			});
			confirm.bindEvent('click', () => {
				void this.save(dialog, confirm);
			});

			return dialog;
		},
		/**
		 * The state of the button of saving, both halves of it. `setDisabled()` of ui.buttons carries only the
		 * attribute: it takes the class of the refused look off through `setState(null)`, which removes the class
		 * the state field holds - and that field stays empty, because the class was put on by the render of the
		 * button and never by `setState()`. So a button re-enabled by it works and goes on being painted as
		 * refused. Until the module of the buttons syncs the two itself, the class is carried here.
		 */
		setSubmitDisabled(isDisabled: boolean): void
		{
			const button = this.confirmButton;
			if (!button)
			{
				return;
			}

			button.setDisabled(isDisabled);
			Dom.toggleClass(button.getContainer(), 'ui-btn-disabled', isDisabled);
		},
		async save(dialog: Dialog, saveButton: Button): Promise<void>
		{
			// The window outlives the request, so the button stays clickable: without the flag every
			// extra click sends the same selection again and saves a second fragment.
			if (this.isSaving)
			{
				return;
			}

			// The disabled button stops the click on itself, but a click on its inner node still bubbles
			// to the handler, so the empty name is refused here as well and not by the look alone.
			const name = this.name.trim();
			if (name === '')
			{
				return;
			}

			if (name.length > FRAGMENT_NAME_MAX_LENGTH)
			{
				this.nameError = this.getMessage(
					'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_DIALOG_NAME_ERROR_TOO_LONG',
					{ '#LIMIT#': FRAGMENT_NAME_MAX_LENGTH },
				);

				return;
			}

			this.isSaving = true;
			saveButton.setWaiting();

			try
			{
				await fragmentLibraryApi.save({
					name,
					isShared: this.isShared,
					templateId: this.templateId,
					documentTypeSigned: this.documentTypeSigned,
					blocks: this.blocks,
					connections: this.connections,
				});
			}
			catch (error)
			{
				// Nothing a refusal names is fixable in this window, so it closes on a refusal too.
				this.reportRefusal(error);
				dialog.hide();

				return;
			}
			finally
			{
				this.isSaving = false;
				saveButton.setWaiting(false);
			}

			this.notify(this.getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_SUCCESS'));
			dialog.hide();
		},
		reportRefusal(error: Object): void
		{
			const code = getErrorCode(error);

			// A refusal by the switch of the feature or by the tariff is not a message to the person: the
			// entry point is not shown at all while the feature is off, so such an answer means the client
			// and the server disagree about the surface and the page has to be reloaded out of it.
			if (isSurfaceRefusal(code))
			{
				return;
			}

			const messageId = SAVE_ERROR_MESSAGE_IDS[code] ?? null;

			if (messageId === null)
			{
				handleResponseError(error);

				return;
			}

			this.notify(this.getMessage(messageId), 'assertive');
		},
		/**
		 * The window closes on both outcomes, so the notification is the whole answer the person gets:
		 * `UI.Notification.Center` draws it and says nothing, and the announcement is what carries the
		 * same text to a screen reader.
		 */
		notify(content: string, politeness: string = 'polite'): void
		{
			UI.Notification.Center.notify({
				content,
				autoHideDelay: NOTIFICATION_DELAY_MS,
			});

			LiveAnnouncer.announce(content, politeness);
		},
		closePopup(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<div
			ref="content"
			class="bizprocdesigner-save-fragment"
			data-testid="bizprocdesigner-save-fragment"
		>
			<BInput
				v-model="name"
				:label="getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_DIALOG_NAME_LABEL')"
				:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_DIALOG_NAME_PLACEHOLDER')"
				:error="nameError"
				stretched
				data-testid="bizprocdesigner-save-fragment-name"
			/>
			<div class="bizprocdesigner-save-fragment__shared">
				<Checkbox
					:id="sharedInputId"
					v-model="isShared"
					:size="checkboxSize"
					data-testid="bizprocdesigner-save-fragment-shared"
				/>
				<TextSm
					tag="label"
					:for="sharedInputId"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_SAVE_DIALOG_SHARED_LABEL') }}
				</TextSm>
			</div>
		</div>
	`,
};
