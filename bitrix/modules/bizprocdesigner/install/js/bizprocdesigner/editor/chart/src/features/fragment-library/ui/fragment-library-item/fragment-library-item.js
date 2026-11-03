import { Dom } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { Outline } from 'ui.icon-set.api.vue';
import { UI } from 'ui.notification';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { BInput } from 'ui.system.input.vue';
import { TextMd } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize, ButtonState } from 'ui.vue3.components.button';

import {
	fragmentLibraryApi,
	FRAGMENT_NAME_MAX_LENGTH,
	FragmentLibraryErrorCode,
	isSurfaceRefusal,
	useFragmentLibraryStore,
	type FragmentChanges,
} from '../../../../entities/fragment-library';
import { useLoc } from '../../../../shared/composables';
import { MenuButton } from '../../../../shared/ui';
import { focusFirstAvailable } from '../../../../shared/utils/focus';
import { getErrorCode, handleResponseError } from '../../../../shared/utils/response';
import './style.css';

const NOTIFICATION_DELAY_MS = 4000;

// The window the rows live in: the receiver of the focus when the deleted row was the last one.
const WINDOW_SELECTOR = '.bizprocdesigner-fragment-library';

// The popup that wraps the content of the window, the way ui.system.dialog mounts it.
const POPUP_SELECTOR = '.popup-window';

const MESSAGE_IDS = Object.freeze({
	insert: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_ACTION_INSERT',
	actions: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_ACTIONS_LABEL',
	rename: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_ACTION_RENAME',
	share: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_ACTION_SHARE',
	unshare: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_ACTION_UNSHARE',
	remove: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_ACTION_DELETE',
	renameSave: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_RENAME_SAVE',
	renameCancel: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_RENAME_CANCEL',
	renameTooLong: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_RENAME_ERROR_TOO_LONG',
	nameInput: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_NAME_INPUT_ARIA_LABEL',
	shared: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_VISIBILITY_SHARED',
	deleteTitle: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_DELETE_CONFIRM_TITLE',
	deleteMessage: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_DELETE_CONFIRM_MESSAGE',
	deleteOk: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_DELETE_CONFIRM_OK',
	deleteCancel: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_DELETE_CONFIRM_CANCEL',
	outdated: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_ERROR_OUTDATED',
	deletedAnnounce: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_DELETED_ANNOUNCE',
	sharedAnnounce: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_SHARED_ANNOUNCE',
	unsharedAnnounce: 'BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_ITEM_UNSHARED_ANNOUNCE',
});

/**
 * A row of the library and everything that can be done to it. The verdicts of DTO-01 decide what is drawn:
 * an action the server would refuse is absent, not disabled. Every request goes out against the row as the
 * server holds it now, and a refusal re-reads the first page: the window stays open while other people
 * rename and delete beside it.
 */
// @vue/component
export const FragmentLibraryItem = {
	name: 'FragmentLibraryItem',
	components: {
		BInput,
		Chip,
		MenuButton,
		TextMd,
		UiButton,
	},
	props: {
		/** @type FragmentListItem */
		item: {
			type: Object,
			required: true,
		},
		/** Resolved by the window, which reads the names of the authors of the whole page at once. */
		authorName: {
			type: String,
			default: '',
		},
		/** This very fragment is being added to the canvas right now: the window holds who waits. */
		isInserting: {
			type: Boolean,
			default: false,
		},
		/**
		 * The canvas refuses an insertion right now, and the window is the one that knows it. Marked and
		 * dimmed instead of natively disabled: the person who left the focus on this button keeps it when
		 * the template goes busy under them, and the press is refused by the handler.
		 */
		isInsertDisabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['insert'],
	setup(): Object
	{
		return {
			...useLoc(),
			AirButtonStyle,
			ButtonSize,
			ButtonState,
			ChipDesign,
			ChipSize,
			MESSAGE_IDS,
			Outline,
			store: useFragmentLibraryStore(),
		};
	},
	data(): Object
	{
		return {
			isRenaming: false,
			nameDraft: '',
			nameError: '',
			isBusy: false,
		};
	},
	computed: {
		// The menu is absent when neither verdict allows anything: an empty menu promises actions that
		// are not there.
		hasMenu(): boolean
		{
			return this.item.canEdit === true || this.item.canDelete === true;
		},
		menuOptions(): Object
		{
			const editItems = this.item.canEdit === true
				? [
					{
						title: this.getMessage(MESSAGE_IDS.rename),
						icon: Outline.EDIT_M,
						dataset: { testid: this.actionTestId('rename') },
						onClick: () => this.startRenaming(),
					},
					{
						title: this.getMessage(this.item.isShared ? MESSAGE_IDS.unshare : MESSAGE_IDS.share),
						icon: this.item.isShared ? Outline.PERSON : Outline.GROUP,
						dataset: { testid: this.actionTestId('visibility') },
						onClick: () => {
							void this.changeVisibility();
						},
					},
				]
				: []
			;

			const deleteItems = this.item.canDelete === true
				? [{
					title: this.getMessage(MESSAGE_IDS.remove),
					icon: Outline.TRASHCAN,
					design: 'alert',
					dataset: { testid: this.actionTestId('delete') },
					onClick: () => this.confirmDeletion(),
				}]
				: []
			;

			return { items: [...editItems, ...deleteItems] };
		},
	},
	watch: {
		isInsertDisabled(): void
		{
			this.syncInsertAvailability();
		},
		// Leaving the renaming builds the button anew, so the mark is written to the new one.
		isRenaming(): void
		{
			void this.$nextTick(() => this.syncInsertAvailability());
		},
	},
	mounted(): void
	{
		this.syncInsertAvailability();
	},
	methods: {
		actionTestId(action: string): string
		{
			return `bizprocdesigner-fragment-library-${action}-${this.item.id}`;
		},
		/**
		 * UiButton builds its native button imperatively, so an attribute bound in the template never
		 * reaches it and has to be written to the button element on every change.
		 */
		syncInsertAvailability(): void
		{
			this.$refs.insertButton?.button?.setProps({
				'aria-disabled': this.isInsertDisabled ? 'true' : null,
			});
		},
		handleInsert(): void
		{
			if (this.isInsertDisabled)
			{
				return;
			}

			this.$emit('insert', this.item.id);
		},
		/**
		 * The menu closes on its way out and takes the focus with it, so the field the row has just
		 * turned into receives it: without that the focus lands on <body> and the mode the row entered
		 * is announced to nobody.
		 */
		startRenaming(): void
		{
			this.nameDraft = this.item.name;
			this.nameError = '';
			this.isRenaming = true;

			void this.$nextTick(() => this.$refs.nameInput?.focus());
		},
		cancelRenaming(): void
		{
			this.isRenaming = false;
			this.nameError = '';
		},
		async applyName(): Promise<void>
		{
			const name = this.nameDraft.trim();
			if (name === '')
			{
				return;
			}

			if (name.length > FRAGMENT_NAME_MAX_LENGTH)
			{
				this.nameError = this.getMessage(
					MESSAGE_IDS.renameTooLong,
					{ '#LIMIT#': FRAGMENT_NAME_MAX_LENGTH },
				);

				return;
			}

			if (name !== this.item.name && !await this.applyChanges({ name }))
			{
				return;
			}

			this.cancelRenaming();
		},
		async changeVisibility(): Promise<void>
		{
			const isShared = !this.item.isShared;
			const name = this.item.name;

			// The list changes silently otherwise: the chip of the row appears or goes, and the item of
			// the menu under the focus keeps the name it had.
			if (await this.applyChanges({ isShared }))
			{
				LiveAnnouncer.announce(this.getMessage(
					isShared ? MESSAGE_IDS.sharedAnnounce : MESSAGE_IDS.unsharedAnnounce,
					{ '#NAME#': name },
				));
			}
		},
		async applyChanges(changes: FragmentChanges): Promise<boolean>
		{
			if (this.isBusy)
			{
				return false;
			}

			this.isBusy = true;
			try
			{
				const item = await fragmentLibraryApi.update(this.item.id, changes);
				if (item === null)
				{
					await this.store.loadFirstPage();

					return true;
				}

				this.store.applyItem(item);

				return true;
			}
			catch (error)
			{
				await this.reportRefusal(error);

				return false;
			}
			finally
			{
				this.isBusy = false;
			}
		},
		/**
		 * The name is untrusted text written by another person, so it reaches the confirmation as a node
		 * whose text content it is: `ui.dialogs.messagebox` hands a string message to `innerHTML`
		 * (`main/install/js/main/popup/src/popup/popup.ts`, `setContent`).
		 *
		 * The confirmation is assembled instead of being asked for by `MessageBox.confirm()`: that
		 * shortcut builds its popup without `closeByEsc`, so Escape reached the window underneath and
		 * closed the library, leaving the confirmation standing over nothing. `MessageBox.alert()`
		 * passes the same option on its own.
		 */
		confirmDeletion(): void
		{
			const message = Dom.create('span', {
				text: this.getMessage(MESSAGE_IDS.deleteMessage, { '#NAME#': this.item.name }),
			});

			const confirmation = MessageBox.create({
				message,
				title: this.getMessage(MESSAGE_IDS.deleteTitle),
				okCaption: this.getMessage(MESSAGE_IDS.deleteOk),
				cancelCaption: this.getMessage(MESSAGE_IDS.deleteCancel),
				buttons: MessageBoxButtons.OK_CANCEL,
				popupOptions: { closeByEsc: true },
				onOk: (messageBox) => {
					messageBox.close();
					void this.remove();
				},
				onCancel: (messageBox) => {
					messageBox.close();
				},
			});

			// ui.dialogs.messagebox builds the buttons of the confirmation itself, so the hooks for the
			// tests are put on them from the outside.
			confirmation.getOkButton().setDataSet({ testid: this.actionTestId('delete-confirm') });
			confirmation.getCancelButton().setDataSet({ testid: this.actionTestId('delete-cancel') });

			confirmation.show();
		},
		async remove(): Promise<void>
		{
			if (this.isBusy)
			{
				return;
			}

			const name = this.item.name;

			this.isBusy = true;
			try
			{
				await fragmentLibraryApi.remove(this.item.id);
				this.passFocusOn();
				this.store.removeItem(this.item.id);
				LiveAnnouncer.announce(this.getMessage(MESSAGE_IDS.deletedAnnounce, { '#NAME#': name }));
			}
			catch (error)
			{
				await this.reportRefusal(error);
			}
			finally
			{
				this.isBusy = false;
			}
		},
		/**
		 * The confirmation takes the focus down with itself, so by the time the answer of the server
		 * arrives the focus is either on <body> or back on the popup main.popup handed it to. The
		 * neighbouring row receives it, and the window itself when the row deleted was the last one.
		 * A focus the person has moved elsewhere in the meantime is left where they put it.
		 *
		 * The surface of this window is the popup and not only its content: the popup wraps the content
		 * and is where the focus lands, so a check against the content alone reads it as another place.
		 */
		passFocusOn(): void
		{
			const row = this.$el;
			const libraryWindow = row?.closest(WINDOW_SELECTOR) ?? null;
			if (libraryWindow === null)
			{
				return;
			}

			const surface = row.closest(POPUP_SELECTOR) ?? libraryWindow;
			const active = document.activeElement ?? document.body;

			if (active !== document.body && !surface.contains(active))
			{
				return;
			}

			const neighbour = row.nextElementSibling ?? row.previousElementSibling ?? null;

			focusFirstAvailable(neighbour?.querySelector('button'), libraryWindow);
		},
		/**
		 * The row the action was aimed at may have been renamed or deleted beside this window, so every
		 * refusal re-reads the first page. A disagreement about the surface is not fixable here: the
		 * window is told about it and says the page has to be reloaded out of it.
		 */
		async reportRefusal(error: Object): Promise<void>
		{
			const code = getErrorCode(error);
			if (isSurfaceRefusal(code))
			{
				this.store.markSurfaceUnavailable(code);

				return;
			}

			if (code === FragmentLibraryErrorCode.accessDenied)
			{
				UI.Notification.Center.notify({
					content: this.getMessage(MESSAGE_IDS.outdated),
					autoHideDelay: NOTIFICATION_DELAY_MS,
				});
			}
			else
			{
				handleResponseError(error);
			}

			await this.store.loadFirstPage();
		},
	},
	template: `
		<tr
			class="bizprocdesigner-fragment-library-item"
			:data-testid="'bizprocdesigner-fragment-library-row-' + item.id"
		>
			<th scope="row">
				<div class="bizprocdesigner-fragment-library-item__name">
					<BInput
						v-if="isRenaming"
						ref="nameInput"
						v-model="nameDraft"
						:ariaLabel="getMessage(MESSAGE_IDS.nameInput)"
						:error="nameError"
						stretched
						:data-testid="actionTestId('name-input')"
					/>
					<template v-else>
						<TextMd wrap="break-words" :data-testid="actionTestId('name')">{{ item.name }}</TextMd>
						<Chip
							v-if="item.isShared"
							tabindex="-1"
							:text="getMessage(MESSAGE_IDS.shared)"
							:size="ChipSize.Xs"
							:design="ChipDesign.TintedNoAccent"
							:data-testid="actionTestId('shared')"
						/>
					</template>
				</div>
			</th>
			<td><TextMd wrap="break-words">{{ authorName }}</TextMd></td>
			<td><TextMd>{{ item.nodeCount }}</TextMd></td>
			<td>
				<div class="bizprocdesigner-fragment-library-item__actions">
					<template v-if="isRenaming">
						<UiButton
							:text="getMessage(MESSAGE_IDS.renameSave)"
							:size="ButtonSize.EXTRA_SMALL"
							:style="AirButtonStyle.FILLED"
							:dataset="{ testid: actionTestId('rename-save') }"
							@click="applyName"
						/>
						<UiButton
							:text="getMessage(MESSAGE_IDS.renameCancel)"
							:size="ButtonSize.EXTRA_SMALL"
							:style="AirButtonStyle.PLAIN"
							:dataset="{ testid: actionTestId('rename-cancel') }"
							@click="cancelRenaming"
						/>
					</template>
					<template v-else>
						<UiButton
							ref="insertButton"
							:text="getMessage(MESSAGE_IDS.insert)"
							:size="ButtonSize.EXTRA_SMALL"
							:style="AirButtonStyle.FILLED"
							:loading="isInserting"
							:state="isInsertDisabled ? ButtonState.DISABLED : null"
							:dataset="{ testid: actionTestId('insert') }"
							@click="handleInsert"
						/>
						<span v-if="hasMenu" class="bizprocdesigner-fragment-library-item__menu">
							<MenuButton
								:icon="Outline.MORE_M"
								:buttonStyle="AirButtonStyle.PLAIN_NO_ACCENT"
								:options="menuOptions"
								:ariaLabel="getMessage(MESSAGE_IDS.actions)"
								:dataset="{ testid: actionTestId('menu') }"
							/>
						</span>
					</template>
				</div>
			</td>
		</tr>
	`,
};
