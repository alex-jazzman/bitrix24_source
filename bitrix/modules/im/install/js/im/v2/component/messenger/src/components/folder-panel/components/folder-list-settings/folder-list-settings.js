import { Event, Runtime, Text } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { PopupManager } from 'main.popup';
import { FocusTrap } from 'ui.a11y';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { HeadlineXs } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { EventType, Layout } from 'im.v2.const';
import { Analytics, AnalyticsSection } from 'im.v2.lib.analytics';
import { EscEventAction } from 'im.v2.lib.esc-manager';
import { FolderManager } from 'im.v2.lib.folder';
import { Notifier } from 'im.v2.lib.notifier';
import { type ImModelFolder } from 'im.v2.model';
import { FolderService } from 'im.v2.provider.service.folder';

import { FolderListItemMenu } from '../../classes/list-item-menu';
import { FolderListSettingsItem } from './components/folder-list-settings-item';

import './css/folder-list-settings.css';

const CLOSE_ICON_SIZE = 24;

// The capture phase: the press past the panel is the only way the pointer has of giving the covered
// interface back, and an ancestor that stops the press travelling would take that way away in
// silence. One object for both sides so that the subscription is taken back with the options it was
// made with - a mismatch there leaves the handler on the document after the panel has closed.
const OUTSIDE_PRESS_OPTIONS = { capture: true };

// @vue/component
export const FolderListSettings = {
	name: 'FolderListSettings',
	components: { BIcon, HeadlineXs, UiButton, FolderListSettingsItem },
	emits: ['close'],
	data()
	{
		return {
			// The order the user built by dragging, in ids alone. The rows themselves stay in the model:
			// a copy of them here would keep showing a folder deleted while the panel is open.
			draggedIds: [],
			isSaving: false,
			isCreatingFolder: false,
			// The heading names the panel, so it needs an anchor of its own: two panels share the DOM
			// for the length of the leave transition and a fixed id would be there twice.
			titleId: `bx-im-folder-list-title-${Text.getRandom()}`,
		};
	},
	computed: {
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		OutlineIcons: () => OutlineIcons,
		CLOSE_ICON_SIZE: () => CLOSE_ICON_SIZE,
		folderList(): ImModelFolder[]
		{
			return this.$store.getters['recent/folders/getVisibleList'];
		},
		// The rows of the panel: the registry, put into the order the user dragged. Everything the
		// registry no longer has leaves on its own, and a folder it gained joins the tail - the order
		// the user built is his until he saves it, and it says nothing about the folders he never moved.
		orderedFolders(): ImModelFolder[]
		{
			const registry = new Map(this.folderList.map((folder) => [folder.id, folder]));
			const dragged = this.draggedIds
				.map((folderId) => registry.get(folderId))
				.filter(Boolean);
			const draggedIds = new Set(dragged.map((folder) => folder.id));

			return [...dragged, ...this.folderList.filter((folder) => !draggedIds.has(folder.id))];
		},
		layoutName(): string
		{
			return this.$store.getters['application/getLayout'].name;
		},
	},
	watch: {
		// The panel opened the create screen itself and stays over the list while the form next door is
		// being filled in - the folder taking shape there belongs to the list it shows. It leaves with
		// that screen: the created folder opens its own chats, and the panel is done.
		layoutName(layoutName: string)
		{
			if (layoutName === Layout.createFolder)
			{
				this.stepAsideForCreation();

				return;
			}

			if (this.isCreatingFolder)
			{
				this.closePanel();
			}
		},
	},
	created()
	{
		this.itemMenu = new FolderListItemMenu();
		this.itemMenu.subscribe(FolderListItemMenu.events.closeList, this.closePanel);

		this.getEmitter().subscribe(EventType.key.onBeforeEscape, this.onBeforeEscape);
	},
	mounted()
	{
		this.startFocusTrap();
		this.startOutsideClickHandling();
		void this.$nextTick(() => this.initDraggable());
	},
	beforeUnmount()
	{
		this.stopEscapeHandling();
		this.stopFocusTrap();
		this.stopOutsideClickHandling();
		this.draggable?.destroy();
		this.itemMenu?.destroy();
	},
	methods: {
		// The menu is bound to the button and not to the point of the click: a click made with the
		// keyboard carries no coordinates and would put the menu in the corner of the window. Bound to
		// the node, ui.system.menu also keeps `aria-expanded` on the button in step with itself.
		onItemMenuClick(folder: ImModelFolder, trigger: HTMLElement)
		{
			this.itemMenu.openMenu({ folderId: folder.id, folderType: folder.type }, trigger);
		},
		// Esc has to be answered here: left alone it travels on through EscManager and clears the
		// layout underneath, leaving the panel standing over a screen it did not ask for.
		onBeforeEscape(): string
		{
			this.closePanel();

			return EscEventAction.handled;
		},
		closePanel()
		{
			// the leave transition holds `beforeUnmount` back for its whole duration, so the key, the
			// focus and the pointer are all given up here: the next Esc travels on instead of reaching a
			// panel already closing, the covered interface comes back the moment the panel is closed, and
			// a click meant for it is not read as a click past a panel that is no longer there
			this.stopEscapeHandling();
			this.stopFocusTrap();
			this.stopOutsideClickHandling();
			this.$emit('close');
		},
		stopEscapeHandling()
		{
			this.getEmitter().unsubscribe(EventType.key.onBeforeEscape, this.onBeforeEscape);
		},
		// The panel is drawn over the strip and over the chat list, and the slider that used to carry
		// this screen took its focus trap away with it: holding the focus is the panel's own job now.
		// The focus goes to the panel itself so that its role and its name are announced first.
		startFocusTrap()
		{
			this.focusTrap = new FocusTrap(this.$el, {
				initialFocus: 'container',
				restoreFocus: true,
				isolateOutside: true,
			});
			this.focusTrap.activate();
		},
		stopFocusTrap()
		{
			this.focusTrap?.destroy();
			this.focusTrap = null;
		},
		// The trap leaves everything around the panel `inert`, so a click past it reaches no control of
		// its own and the interface reads as broken. Closing the panel is what the slider used to do with
		// its backdrop, and it is the pointer half of what Esc already does.
		// The pointer press and not the click: the click of the menu item that opens the panel is still
		// travelling when the panel mounts, and a handler bound to it would answer its own opening.
		startOutsideClickHandling()
		{
			Event.bind(document, 'mousedown', this.onOutsideClick, OUTSIDE_PRESS_OPTIONS);
		},
		stopOutsideClickHandling()
		{
			Event.unbind(document, 'mousedown', this.onOutsideClick, OUTSIDE_PRESS_OPTIONS);
		},
		onOutsideClick(event: MouseEvent)
		{
			// A popup takes the press before the panel does - the row menu lives outside the panel, and
			// the layers unwind one at a time, the same order Esc unwinds them in.
			if (PopupManager.isAnyPopupShown())
			{
				return;
			}

			// The path and not the target: a row travels by its handle, and the press that starts the
			// drag belongs to the panel however far the pointer goes afterwards.
			if (event.composedPath().includes(this.$el))
			{
				return;
			}

			this.closePanel();
		},
		onCreateClick()
		{
			Analytics.getInstance().folder.onClickCreateFolder(AnalyticsSection.folderList);

			// The panel is not closed here: it follows the create screen, and the screen may never open
			// at all - the creation is turned down on the limit of folders.
			FolderManager.startCreation();
		},
		// The create screen opens next door, in the content area, and the panel gives up being a modal
		// layer for it to be reachable at all: the trap leaves everything around the panel inert, the
		// press past the panel closes it, and Esc belongs to the form now. The panel itself stays.
		stepAsideForCreation()
		{
			this.isCreatingFolder = true;
			this.stopEscapeHandling();
			this.stopFocusTrap();
			this.stopOutsideClickHandling();
		},
		async initDraggable()
		{
			if (!this.$refs.itemsContainer)
			{
				return;
			}

			const { Draggable } = await Runtime.loadExtension('ui.draganddrop.draggable');

			const container = this.$refs.itemsContainer;
			if (!container)
			{
				return;
			}

			this.draggable = new Draggable({
				container,
				draggable: '.bx-im-folder-list-item__container',
				dragElement: '.bx-im-folder-list-item__handle-icon',
				type: Draggable.CLONE,
				transitionDuration: 0,
			});
			this.draggable.subscribe('end', () => this.syncOrderFromDom());
		},
		// The drag moves the rows in the DOM, and the ids read back from there are the whole of what the
		// panel keeps of it: the rows are drawn from the registry either way.
		syncOrderFromDom()
		{
			const container = this.$refs.itemsContainer;
			if (!container)
			{
				return;
			}

			this.draggedIds = [...container.querySelectorAll('[data-folder-id]')]
				.map((node) => Number(node.dataset.folderId));
		},
		async onSave()
		{
			const orderedIds = this.orderedFolders.map((folder) => folder.id);
			if (this.isOrderUnchanged(orderedIds))
			{
				this.closePanel();

				return;
			}

			this.isSaving = true;
			try
			{
				await (new FolderService()).sort(orderedIds);
			}
			catch
			{
				// The sort reports nothing of its own, and the panel is the only surface the user can
				// see: left silent, a refusal reads as a save that simply did nothing. The order the
				// user built stays on screen, so the button can be pressed again.
				Notifier.onDefaultError();

				return;
			}
			finally
			{
				this.isSaving = false;
			}

			this.closePanel();
		},
		// Against the registry as it stands now and not against the list the panel opened with: a folder
		// deleted or created next door is no reordering of the rows the user never touched, and the
		// server has that order already.
		isOrderUnchanged(orderedIds: number[]): boolean
		{
			const registryIds = this.folderList.map((folder) => folder.id);

			return orderedIds.length === registryIds.length
				&& orderedIds.every((folderId, index) => folderId === registryIds[index]);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			class="bx-im-folder-list__panel"
			role="dialog"
			aria-modal="true"
			:aria-labelledby="titleId"
			data-testid="folder-list-settings-panel"
		>
			<div class="bx-im-folder-list__header" data-testid="folder-list-settings-header">
				<HeadlineXs
					tag="h2"
					:id="titleId"
					data-testid="folder-list-settings-title"
				>
					{{ loc('IM_MESSENGER_FOLDER_LIST_TITLE') }}
				</HeadlineXs>
				<div class="bx-im-folder-list__header-actions">
					<UiButton
						:size="ButtonSize.EXTRA_SMALL"
						:style="AirButtonStyle.OUTLINE"
						:text="loc('IM_MESSENGER_FOLDER_LIST_CREATE_BUTTON')"
						:dataset="{ testid: 'folder-list-settings-create-btn' }"
						@click="onCreateClick"
					/>
					<button
						type="button"
						class="bx-im-folder-list__close-button --focus-visible"
						:aria-label="loc('IM_MESSENGER_FOLDER_LIST_CLOSE_ARIA_LABEL')"
						data-testid="folder-list-settings-close-btn"
						@click="closePanel"
					>
						<BIcon :name="OutlineIcons.CROSS_L" :size="CLOSE_ICON_SIZE" :hoverable="true" />
					</button>
				</div>
			</div>
			<!-- A tab stop of its own: the system rows carry no control at all, so a list too long for
				the panel would keep its tail out of reach of the keyboard and of the arrow keys. A stop
				has to show and to say what it is, so the area carries the ring of the shared utility and
				is grouped and named the way the table of a message is. -->
			<div
				class="bx-im-folder-list__container --focus-visible"
				tabindex="0"
				role="group"
				:aria-label="loc('IM_MESSENGER_FOLDER_LIST_CONTENT_ARIA_LABEL')"
				data-testid="folder-list-settings-content"
			>
				<div class="bx-im-folder-list__image" data-testid="folder-list-settings-image"></div>
				<div
					class="bx-im-folder-list__items"
					role="list"
					ref="itemsContainer"
					data-testid="folder-list-settings-items"
				>
					<FolderListSettingsItem
						v-for="folder in orderedFolders"
						:key="folder.id"
						:item="folder"
						@menuClick="onItemMenuClick(folder, $event)"
					/>
				</div>
			</div>
			<div class="bx-im-folder-list__footer" data-testid="folder-list-settings-footer">
				<UiButton
					:size="ButtonSize.MEDIUM"
					:loading="isSaving"
					:text="loc('IM_MESSENGER_FOLDER_LIST_SAVE')"
					:dataset="{ testid: 'folder-list-settings-save-btn' }"
					@click="onSave"
				/>
				<UiButton
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:text="loc('IM_MESSENGER_FOLDER_LIST_CANCEL')"
					:dataset="{ testid: 'folder-list-settings-cancel-btn' }"
					@click="closePanel"
				/>
			</div>
		</div>
	`,
};
