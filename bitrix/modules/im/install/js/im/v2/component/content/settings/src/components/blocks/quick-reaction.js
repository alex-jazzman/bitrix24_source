import { Type } from 'main.core';

import { DialogAlignment, Settings } from 'im.v2.const';
import { MessageDefaultReactionManager } from 'im.v2.component.message.elements';
import { ChatDialog } from 'im.v2.component.dialog.chat';
import { ThemeManager, type BackgroundStyle } from 'im.v2.lib.theme';

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { ReactionName, ReactionTitle } from 'ui.reaction.item';
import { Reaction } from 'ui.reaction.item.vue';
import { ReactionPicker } from 'ui.reaction.picker';

import './css/quick-reaction.css';

const SHOW_DELAY = 200;
const HIDE_DELAY = 200;

// @vue/component
export const ChatQuickReaction = {
	name: 'ChatQuickReaction',
	components: { Reaction, ChatDialog, BIcon },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		chevronDown(): string
		{
			return Outline.CHEVRON_DOWN_M;
		},
		alignment(): string
		{
			return this.$store.getters['application/settings/get'](
				Settings.appearance.alignment,
			);
		},
		alignmentClasses(): Record<string, boolean>
		{
			return {
				'--left-align': this.alignment === DialogAlignment.left,
				'--center-align': this.alignment === DialogAlignment.center,
			};
		},
		backgroundStyle(): BackgroundStyle
		{
			return ThemeManager.getCurrentBackgroundStyle();
		},
		currentReactionTitle(): string
		{
			return ReactionTitle[this.currentReaction] ?? '';
		},
		currentReaction(): string
		{
			const mainReaction = this.$store.getters['application/settings/get'](Settings.message.defaultReaction);

			if (Type.isStringFilled(mainReaction))
			{
				return mainReaction;
			}

			return ReactionName.like;
		},
	},
	beforeUnmount()
	{
		clearTimeout(this.showTimeout);
		this.clearHideTimer();
		this.reactionPicker?.hide();
	},
	created()
	{
		MessageDefaultReactionManager.getInstance().init();
		this.reactionPicker = null;
		this.showTimeout = null;
		this.hideTimeout = null;
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		startShowTimer()
		{
			this.clearHideTimer();

			if (this.reactionPicker?.isShown())
			{
				return;
			}

			this.showTimeout = setTimeout(() => {
				this.openReactionPicker();
			}, SHOW_DELAY);
		},
		clearShowTimer()
		{
			clearTimeout(this.showTimeout);
			this.startHideTimer();
		},
		openReactionPicker()
		{
			clearTimeout(this.showTimeout);
			this.clearHideTimer();

			if (this.reactionPicker?.isShown())
			{
				return;
			}

			this.reactionPicker = new ReactionPicker({
				target: this.$refs.reactionPickerButton,
			});

			this.subscribeToReactionPickerEvents();
			this.reactionPicker.show();
		},
		subscribeToReactionPickerEvents()
		{
			this.reactionPicker.subscribe('select', async (selectEvent) => {
				const { reaction } = selectEvent.getData();

				try
				{
					await MessageDefaultReactionManager.getInstance().changeDefaultReaction(reaction);
				}
				catch
				{
					return;
				}

				this.reactionPicker?.hide();
			});

			this.reactionPicker.subscribe('mouseleave', this.startHideTimer);

			this.reactionPicker.subscribe('mouseenter', () => {
				this.clearHideTimer();
			});

			this.reactionPicker.subscribe('hide', () => {
				this.clearHideTimer();
				this.reactionPicker = null;
			});
		},
		startHideTimer()
		{
			this.hideTimeout = setTimeout(() => {
				this.reactionPicker?.hide();
			}, HIDE_DELAY);
		},
		clearHideTimer()
		{
			clearTimeout(this.hideTimeout);
		},
	},
	template: `
		<div class="bx-im-settings-section-content__block-reaction">
			<div class="bx-im-settings-alignment-quick-reaction__preview">
				<div
					class="bx-im-content-chat__container bx-im-settings-quick-reaction__demo-chat_container"
					:class="alignmentClasses"
					:style="backgroundStyle"
				>
					<ChatDialog :dialogId="dialogId"/>
				</div>
				<div 
					class="bx-im-settings-quick-reaction__alignment"
					:class="alignmentClasses"
				>
					<div class="bx-im-settings-quick-reaction__selector-container">
						<div class="bx-im-settings-quick-reaction__selector">
							<Reaction
								:key="currentReaction"
								:name="currentReaction"
								class="bx-im-settings-quick-reaction__selector-icon"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="bx-im-settings-section-content__block_subtitle">
				{{ loc('IM_CONTENT_SETTINGS_OPTION_DESCRIPTION_QUICKREACTREACTION')}}
			</div>
			<div class="bx-im-settings-section-content__choice">
				<button 
					class="bx-im-settings-section-content__choice_button"
					type="button"
					ref="reactionPickerButton"
					@click="openReactionPicker"
					@mouseenter="startShowTimer"
					@mouseleave="clearShowTimer"
				>
					<Reaction
						:key="currentReaction"
						:name="currentReaction"
						class="bx-im-settings-section-content__choice_button-icon"
					/>
					<span class="bx-im-settings-section-content__choice_button-title">
						{{ currentReactionTitle }}
					</span>
					<BIcon :name="chevronDown" />
				</button>
			</div>
		</div>
	`,
};
