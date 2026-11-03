import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { CounterManager } from 'im.v2.lib.counter';

import './css/menu-item.css';

export const MenuItemIcon = {
	chat: 'chat',
	channel: 'channel',
	collab: 'collab',
	collabV2: 'collab-v2',
	conference: 'conference',
	upload: 'upload',
	file: 'file',
	task: 'task',
	meeting: 'meeting',
	summary: 'summary',
	vote: 'vote',
	aiText: 'ai-text',
	aiImage: 'ai-image',
	copilot: 'copilot',
	calendarSlot: 'calendar-slot',
	documentSign: 'document-sign',
	b24: 'b24',
	aiAssistant: 'ai-assistant',
	lock: 'lock',
	folder: 'folder',
};

// @vue/component
export const MenuItem = {
	name: 'MenuItem',
	components: { BIcon },
	props: {
		icon: {
			type: String,
			required: false,
			default: '',
		},
		title: {
			type: String,
			required: true,
		},
		subtitle: {
			type: String,
			required: false,
			default: '',
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false,
		},
		counter: {
			type: Number,
			required: false,
			default: 0,
		},
		withBottomBorder: {
			type: Boolean,
			required: false,
			default: false,
		},
		// When the after-content slot holds its own interactive control (e.g. the Copilot role
		// button), the button role moves from the container to the inner content. That keeps the
		// slotted control a sibling of the button instead of nested inside it (nested interactive
		// controls fail axe). Off by default, so every other menu item is unchanged.
		hasInteractiveAfterContent: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		formattedCounter(): string
		{
			if (this.counter === 0)
			{
				return '';
			}

			return CounterManager.formatCounter(this.counter);
		},
		preparedIcon(): string
		{
			return this.disabled ? MenuItemIcon.lock : this.icon;
		},
		containerClasses(): { [string]: boolean }
		{
			return {
				'--disabled': this.disabled,
				'--bottom-border': this.withBottomBorder,
			};
		},
		isAiAssistantItem(): boolean
		{
			if (!FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available))
			{
				return false;
			}

			return this.icon === MenuItemIcon.aiAssistant;
		},
	},
	methods: {
		handleActivationKeydown(event: KeyboardEvent): void
		{
			// Only the item itself reacts; keydowns bubbling up from nested focusable controls
			// (e.g. the Copilot role button) are handled by those controls, not the item.
			if (event.target !== event.currentTarget)
			{
				return;
			}

			if (event.key === 'Enter' || event.key === ' ')
			{
				// Synthesize the same native click the mouse path uses: the parent binds @click,
				// which falls through to this root element, so keyboard and mouse share one handler.
				event.preventDefault();
				this.$el.click();
			}
		},
		onContentKeydown(event: KeyboardEvent): void
		{
			// The content is the button only when it holds interactive after-content; otherwise the
			// container is the button and this keydown must stay inert.
			if (!this.hasInteractiveAfterContent)
			{
				return;
			}

			this.handleActivationKeydown(event);
		},
	},
	template: `
		<div
			class="bx-im-menu-item__container"
			:class="[containerClasses, { '--focus-visible': !hasInteractiveAfterContent }]"
			:role="hasInteractiveAfterContent ? null : 'button'"
			:tabindex="hasInteractiveAfterContent ? null : 0"
			@keydown="handleActivationKeydown"
		>
			<div
				class="bx-im-menu-item__content"
				:class="[{'--with-icon': !!preparedIcon}, { '--focus-visible': hasInteractiveAfterContent }]"
				:role="hasInteractiveAfterContent ? 'button' : null"
				:tabindex="hasInteractiveAfterContent ? 0 : null"
				@keydown="onContentKeydown"
			>
				<BIcon
					v-if="isAiAssistantItem"
					:name="OutlineIcons.BITRIX_GPT"
					class="bx-im-menu_item__ai-assistant-icon"
				/>
				<div v-else-if="preparedIcon" class="bx-im-menu_item__icon" :class="'--' + preparedIcon"></div>
				<div class="bx-im-menu-item__text-content" :class="{'--with-subtitle': !!subtitle}">
					<div class="bx-im-menu-item__title">
						<div 
							class="bx-im-menu-item__title_text"
							:class="{ '--ai-assistant': isAiAssistantItem }"
						>
							{{ title }}
						</div>
						<slot name="after-title"></slot>
						<div v-if="counter" class="bx-im-menu-item__title_counter">{{ formattedCounter }}</div>
					</div>
					<div v-if="subtitle" :title="subtitle" class="bx-im-menu-item__subtitle">{{ subtitle }}</div>
					<slot name="below-content"></slot>
				</div>
			</div>
			<slot name="after-content"></slot>
		</div>
	`,
};
