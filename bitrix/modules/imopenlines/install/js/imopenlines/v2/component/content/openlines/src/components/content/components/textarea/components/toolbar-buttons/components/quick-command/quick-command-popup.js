import { type PopupOptions } from 'main.popup';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { Utils } from 'im.v2.lib.utils';

import { QuickCommand, type QuickCommandItem } from 'imopenlines.v2.lib.quick-command';

import './css/quick-command-popup.css';

const POPUP_ID = 'imol-quick-command-popup';
const POPUP_CLASSNAME = 'bx-imol-quick-command-popup__container';
const TITLE_ID = 'imol-quick-command-popup__title';

// @vue/component
export const QuickCommandPopup = {
	name: 'QuickCommandPopup',
	components: { MessengerPopup, BIcon },
	directives: { hint },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['selectCommand', 'close'],
	data()
	{
		return {
			focusedIndex: 0,
		};
	},
	computed: {
		POPUP_ID: () => POPUP_ID,
		TITLE_ID: () => TITLE_ID,
		OutlineIcons: () => OutlineIcons,
		commandsWithDescription(): QuickCommandItem[]
		{
			const plainCommandItems = Object.values(QuickCommand);

			return plainCommandItems.filter((command) => command.descriptionCode);
		},
		hintsConfig(): HintParams
		{
			return {
				html: [
					this.loc('IMOL_CONTENT_TEXTAREA_QUICK_COMMAND_POPUP_HINT_NAVIGATE'),
					this.loc('IMOL_CONTENT_TEXTAREA_QUICK_COMMAND_POPUP_HINT_SELECT'),
					this.loc('IMOL_CONTENT_TEXTAREA_QUICK_COMMAND_POPUP_HINT_CLOSE'),
				].join('<br>'),
				position: 'top',
			};
		},
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				className: POPUP_CLASSNAME,
				width: 550,
				overlay: false,
				closeIcon: false,
				autoHide: true,
				borderRadius: '20px',
				bindOptions: { position: 'top' },
				angle: {
					offset: 35,
					position: 'bottom',
				},
				animation: 'fading',
			};
		},
	},
	mounted()
	{
		requestAnimationFrame(() => {
			this.$refs.commandItem?.[this.focusedIndex]?.focus();
		});
	},
	beforeUnmount()
	{
		const leaveEvent = new MouseEvent('mouseleave');
		this.$refs.hintIcon?.dispatchEvent(leaveEvent);
	},
	methods:
	{
		focusItem(index: number): void
		{
			this.focusedIndex = index;
			this.$refs.commandItem[index]?.focus();
		},
		focusNextItem(currentIndex: number): void
		{
			const items = this.$refs.commandItem ?? [];
			if (items.length === 0)
			{
				return;
			}

			const nextIndex = (currentIndex + 1) % items.length;
			this.focusItem(nextIndex);
		},
		focusPreviousItem(currentIndex: number): void
		{
			const items = this.$refs.commandItem ?? [];
			if (items.length === 0)
			{
				return;
			}
			const previousIndex = (currentIndex - 1 + items.length) % items.length;
			this.focusItem(previousIndex);
		},
		selectItem(commandItem: QuickCommandItem): void
		{
			this.$emit('selectCommand', `${commandItem.command} `, {
				replace: !commandItem.keepText,
				withNewLine: commandItem.keepText ?? false,
			});
		},
		updateFocusedIndex(index: number): void
		{
			this.focusedIndex = index;
		},
		handleKeydown(event: KeyboardEvent, commandItem: QuickCommandItem, index: number): void
		{
			const selectItemKeys = ['Enter', 'NumpadEnter', 'Space'];
			if (Utils.key.isCombination(event, selectItemKeys))
			{
				event.preventDefault();
				this.selectItem(commandItem);

				return;
			}

			const focusOnPreviousItemKeys = ['ArrowUp', 'Numpad8', 'Shift+Tab'];
			if (Utils.key.isCombination(event, focusOnPreviousItemKeys))
			{
				event.preventDefault();
				this.focusPreviousItem(index);

				return;
			}

			const focusOnNextItemKeys = ['ArrowDown', 'Numpad2', 'Tab'];
			if (Utils.key.isCombination(event, focusOnNextItemKeys))
			{
				event.preventDefault();
				this.focusNextItem(index);
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			:config="popupConfig"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-imol-quick-command-popup__header">
				<span :id="TITLE_ID">{{ loc('IMOL_CONTENT_TEXTAREA_QUICK_COMMAND_POPUP_TITLE') }}</span>
				<div class="bx-imol-quick-command-popup__header-actions">
					<span ref="hintIcon" v-hint="hintsConfig" class="bx-imol-quick-command-popup__hint-icon">
						<BIcon :name="OutlineIcons.QUESTION" />
					</span>
					<div class="bx-imol-quick-command-popup__close" @click="$emit('close')">
						<BIcon :name="OutlineIcons.CROSS_L" />
					</div>
				</div>
			</div>
			<div
				class="bx-imol-quick-command-popup__list"
				role="menu"
				:aria-labelledby="TITLE_ID"
			>
				<div
					v-for="(commandItem, index) in commandsWithDescription"
					:key="commandItem.id"
					:tabindex="index === focusedIndex ? 0 : -1"
					ref="commandItem"
					role="menuitem"
					class="bx-imol-quick-command-popup__item"
					@click="selectItem(commandItem)"
					@focus="updateFocusedIndex(index)"
					@keydown="handleKeydown($event, commandItem, index)"
				>
					<span class="bx-imol-quick-command-popup__item-command">{{ commandItem.command }}</span>
					<span
						class="bx-imol-quick-command-popup__item-description --ellipsis"
						:title="loc(commandItem.descriptionCode)"
					>
						{{ loc(commandItem.descriptionCode) }}
					</span>
				</div>
			</div>
		</MessengerPopup>
	`,
};
