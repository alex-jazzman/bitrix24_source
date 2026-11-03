import { Text } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Vue as CheckboxVue } from 'ui.system.checkbox';

import { ChatType, TabId } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';
import { StructureTarget } from 'im.v2.lib.entity-selector-config';
import { type ImModelChat } from 'im.v2.model';

import { TabsWrapper } from '../../elements/tabs-wrapper/tabs-wrapper';

import './header.css';

const CLOSE_ICON_SIZE = 24;

// Take the Vue component from the parent ui.system.checkbox extension: it creates
// the BX.UI.System.Checkbox namespace and re-exports the Vue component (export * as Vue).
// A direct import from ui.system.checkbox.vue crashes at runtime - it has an empty rel.
const Checkbox = CheckboxVue.Checkbox;

// @vue/component
export const AddToChatHeader = {
	name: 'AddToChatHeader',
	components: { BIcon, Checkbox, TabsWrapper },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		/** @type TagSelector */
		tagSelector: {
			type: Object,
			required: true,
		},
		activeTabId: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		structureTarget: {
			type: String,
			default: StructureTarget.chat,
		},
		offersStructureNodes: {
			type: Boolean,
			default: false,
		},
		canInviteGuests: {
			type: Boolean,
			default: false,
		},
		showHistory: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['update:activeTabId', 'update:showHistory', 'close'],
	setup(): Object
	{
		// two invitation windows can stand open at once, so the ids are per instance
		const suffix = Text.getRandom().toLowerCase();

		return {
			historyCheckboxId: `bx-im-add-to-chat-show-history-${suffix}`,
			hintId: `bx-im-add-to-chat-hint-${suffix}`,
		};
	},
	computed: {
		Outline: () => Outline,
		CLOSE_ICON_SIZE: () => CLOSE_ICON_SIZE,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isEmployeesTab(): boolean
		{
			return this.activeTabId === TabId.employees;
		},
		isChat(): boolean
		{
			return this.dialog.type !== ChatType.user;
		},
		isCollab(): boolean
		{
			return this.dialog.type === ChatType.collab;
		},
		isOpenLines(): boolean
		{
			return this.dialog.type === ChatType.lines;
		},
		isChannel(): boolean
		{
			return ChannelManager.isChannel(this.dialogId);
		},
		showHistoryOption(): boolean
		{
			return !this.isCollab && this.isChat && !this.isChannel && !this.isOpenLines;
		},
		showStructureHint(): boolean
		{
			// the hint speaks of connecting a department to the chat, and a collab links to its project instead
			if (this.structureTarget === StructureTarget.collabProject)
			{
				return false;
			}

			return this.offersStructureNodes;
		},
		historyHintId(): string | null
		{
			return this.showStructureHint ? this.hintId : null;
		},
		hintPhraseCode(): string
		{
			return this.showHistoryOption
				? 'IM_ENTITY_SELECTOR_ADD_TO_CHAT_STRUCTURE_AND_HISTORY_HINT'
				: 'IM_ENTITY_SELECTOR_ADD_TO_CHAT_STRUCTURE_HINT';
		},
	},
	mounted()
	{
		this.tagSelector.renderTo(this.$refs.field);
	},
	methods: {
		onTabSwitch(tabId: string)
		{
			this.$emit('update:activeTabId', tabId);
		},
		onHistoryChange(nextValue: boolean)
		{
			this.$emit('update:showHistory', nextValue);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-add-to-chat-header__container" data-testid="im-add-to-chat-header">
			<div class="bx-im-add-to-chat-header__title-bar">
				<div class="bx-im-add-to-chat-header__title" data-testid="im-add-to-chat-title">
					{{ title }}
				</div>
				<button
					type="button"
					class="bx-im-add-to-chat-header__close"
					:aria-label="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CLOSE_BUTTON')"
					data-testid="im-add-to-chat-close"
					@click="$emit('close')"
				>
					<BIcon :name="Outline.CROSS_L" :size="CLOSE_ICON_SIZE"/>
				</button>
			</div>
			<TabsWrapper
				v-if="canInviteGuests"
				:activeTabId="activeTabId"
				data-testid="im-add-to-chat-tabs"
				@onTabSwitch="onTabSwitch"
			/>
			<div v-show="isEmployeesTab" class="bx-im-add-to-chat-header__field" ref="field"></div>
			<div
				v-if="showHistoryOption"
				v-show="isEmployeesTab"
				class="bx-im-add-to-chat-header__history"
			>
				<Checkbox
					:id="historyCheckboxId"
					:modelValue="showHistory"
					:aria-describedby="historyHintId"
					data-testid="im-add-to-chat-history"
					@update:modelValue="onHistoryChange"
				/>
				<label :for="historyCheckboxId">
					{{ loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SHOW_HISTORY_MSGVER_1') }}
				</label>
			</div>
			<div
				v-if="showStructureHint"
				v-show="isEmployeesTab"
				:id="hintId"
				class="bx-im-add-to-chat-header__hint"
				data-testid="im-add-to-chat-hint"
			>
				{{ loc(hintPhraseCode) }}
			</div>
		</div>
	`,
};
