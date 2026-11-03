import { PopupManager } from 'main.popup';
import { Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { StickerPackForm, PackStickers } from 'im.v2.component.sticker';
import { StickerMenu, StickerPackMenu, BaseMenu } from 'im.v2.lib.menu';
import { StickerManager } from 'im.v2.lib.sticker';
import { Utils } from 'im.v2.lib.utils';
import { DraftManager } from 'im.v2.lib.draft';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { SendingService } from 'im.v2.provider.service.sending';
import { Color, EventType, PopupType, StickerPackType, TextareaPanelType } from 'im.v2.const';

import 'im.v2.css.classes';
import '../css/pack.css';

import type { JsonObject } from 'main.core';
import type { ImModelSticker, ImModelStickerPack } from 'im.v2.model';

const ICON_SIZE = 24;
// The roving focus of the grid lands on the button inside a sticker cell, never on the gridcell around
// it, so a return of focus has to name that button.
const STICKER_BUTTON_SELECTOR = '.bx-im-sticker-item__button';

// The menu hands focus back to the element it was opened from, but the grid around that element takes
// the arrival for an entry from outside and sends it to its own entry cell instead (WCAG 2.4.3). So the
// element takes focus back after the grid has had its say: this move starts inside the grid, and an
// entry from inside is never redirected.
function returnFocusInsideGrid(member: HTMLElement | null): void
{
	// Only focus the closing menu left inside the grid is ours to move: focus an item of the menu has
	// taken somewhere of its own - the confirm dialog of a destructive item - stays where it is, the
	// same rule the selector follows when it closes.
	const grid = member?.closest('[role="grid"]');
	if (grid?.contains(document.activeElement) === true)
	{
		member.focus({ preventScroll: true });
	}
}

// @vue/component
export const Pack = {
	name: 'StickerPack',
	components: { BIcon, StickerPackForm, PackStickers },
	inject: ['disableAutoHide', 'enableAutoHide'],
	props: {
		pack: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			showPackForm: false,
			isPackMenuOpen: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		Color: () => Color,
		ICON_SIZE: () => ICON_SIZE,
		canShowContextMenu(): boolean
		{
			return this.packItem.type === StickerPackType.custom || this.isRecentPack;
		},
		isRecentPack(): boolean
		{
			return StickerManager.isRecentPack(this.packItem);
		},
		packItem(): ImModelStickerPack
		{
			return this.pack;
		},
		packActionsLabel(): string
		{
			// A replacer function, not a string: a pack named with `$&` would otherwise rewrite its own
			// label instead of being put into it.
			return this.loc('IM_TEXTAREA_STICKER_PACK_ACTIONS_ARIA')
				.replace('#NAME#', () => this.packItem.name)
			;
		},
	},
	created()
	{
		// Random per-instance prefix: two popups open at once must not produce the same heading id.
		this.packTitleIdPrefix = `bx-im-sticker-pack-title-${Text.getRandom(8)}`;
	},
	methods: {
		onStickerClick({ sticker }: { sticker: ImModelSticker })
		{
			const draft = DraftManager.getInstance().drafts[this.dialogId] ?? {};
			const isReplyWithMediaAvailable = FeatureManager.isFeatureAvailable(Feature.isReplyWithMediaAvailable);
			const replyId = (isReplyWithMediaAvailable && draft.panelType === TextareaPanelType.reply)
				? draft.panelContext?.messageId
				: undefined;

			void SendingService.getInstance().sendMessageWithSticker({
				dialogId: this.dialogId,
				stickerParams: {
					id: sticker.id,
					packId: sticker.packId,
					packType: sticker.packType,
				},
				replyId,
			});

			if (replyId > 0)
			{
				EventEmitter.emit(EventType.textarea.closePanel, { dialogId: this.dialogId });
			}

			this.$emit('close');
		},
		openPackMenu(event: Event)
		{
			PopupManager.getPopupById(PopupType.stickerContextMenu)?.close();
			PopupManager.getPopupById(PopupType.stickerPackContextMenu)?.close();
			if (!this.stickerPackMenu)
			{
				this.stickerPackMenu = new StickerPackMenu();
				this.stickerPackMenu.subscribe(BaseMenu.events.close, () => {
					this.isPackMenuOpen = false;
					if (!this.showPackForm)
					{
						this.enableAutoHide();
						this.returnFocusToPackActions();
					}
				});
				this.stickerPackMenu.subscribe(StickerPackMenu.events.closeParentPopup, () => {
					this.$emit('close');
				});
				this.stickerPackMenu.subscribe(StickerPackMenu.events.showPackForm, () => {
					this.showPackForm = true;
				});
			}

			this.disableAutoHide();
			this.isPackMenuOpen = true;

			// The button, not whatever node of the icon inside it a click landed on: the menu anchors its
			// popup on this element and hands the focus back to it.
			this.stickerPackMenu.openMenu({
				pack: this.packItem,
				isRecent: this.isRecentPack,
				dialogId: this.dialogId,
			}, event.currentTarget);
		},
		// Shift+F10 and the context-menu key open the very menu a right click opens. No browser synthesizes
		// a contextmenu event out of Shift+F10, so without this the menu of a sticker has no keyboard path
		// at all; preventDefault stops the native menu - and, where the context-menu key does synthesize
		// contextmenu (chromium), stops the menu from opening twice.
		onStickerKeydown({ event, sticker }: { event: KeyboardEvent, sticker: ImModelSticker })
		{
			if (!Utils.key.isCombination(event, ['Shift+F10', 'ContextMenu']))
			{
				return;
			}

			event.preventDefault();
			this.openStickerMenu({ event, sticker });
		},
		openStickerMenu({ event, sticker }: { event: PointerEvent | KeyboardEvent, sticker: ImModelSticker })
		{
			PopupManager.getPopupById(PopupType.stickerContextMenu)?.close();
			if (!this.stickerMenu)
			{
				this.stickerMenu = new StickerMenu();
				this.stickerMenu.subscribe(StickerMenu.events.closeParentPopup, () => {
					this.$emit('close');
				});
				this.stickerMenu.subscribe(BaseMenu.events.close, () => {
					this.enableAutoHide();
					this.returnFocusToStickerButton();
				});
			}

			this.disableAutoHide();

			// The button inside the cell, read while the event is still being dispatched - `currentTarget`
			// is null by the time the menu closes. The menu anchors its popup on this button and hands the
			// focus back to it; a menu bound to the gridcell instead would leave the focus on the body
			// whenever the close finds it outside the grid.
			this.stickerMenuButton = event.currentTarget.querySelector(STICKER_BUTTON_SELECTOR);

			this.stickerMenu.openMenu({
				sticker,
				isRecent: this.isRecentPack,
				dialogId: this.dialogId,
			}, this.stickerMenuButton);
		},
		onStickerPackFormClose()
		{
			this.enableAutoHide();
			this.showPackForm = false;
		},
		returnFocusToPackActions(): void
		{
			returnFocusInsideGrid(this.$refs.packActions);
		},
		returnFocusToStickerButton(): void
		{
			returnFocusInsideGrid(this.stickerMenuButton);
		},
		getPackTitleId(): string
		{
			return `${this.packTitleIdPrefix}-${this.packItem.key}`;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			class="bx-im-sticker-pack__container"
			role="rowgroup"
			:aria-labelledby="getPackTitleId()"
		>
			<div class="bx-im-sticker-pack__header" role="row">
				<div class="bx-im-sticker-pack__header-cell" role="rowheader">
					<span
						class="bx-im-sticker-pack__header-title --ellipsis"
						:id="getPackTitleId()"
					>
						{{ packItem.name }}
					</span>
					<button
						v-if="canShowContextMenu"
						ref="packActions"
						type="button"
						class="bx-im-sticker-pack__header-actions --focus-visible"
						aria-haspopup="menu"
						:aria-expanded="isPackMenuOpen ? 'true' : 'false'"
						:aria-label="packActionsLabel"
						data-testid="im-textarea-sticker-pack-actions-btn"
						@click="openPackMenu"
						@keydown.enter.prevent="openPackMenu"
						@keydown.space.prevent="openPackMenu"
					>
						<BIcon
							:name="OutlineIcons.MORE_M"
							:size="ICON_SIZE"
							:color="Color.gray40"
							:hoverable="true"
							:aria-hidden="true"
						/>
					</button>
				</div>
			</div>
			<PackStickers 
				:pack="packItem"
				class="bx-im-sticker-pack__stickers"
				@clickSticker="onStickerClick"
				@stickerKeydown="onStickerKeydown"
				@openContextMenuSticker="openStickerMenu"
			/>
			<StickerPackForm v-if="showPackForm" :pack="packItem" @close="onStickerPackFormClose" />
		</div>
	`,
};
