import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Utils } from 'im.v2.lib.utils';

import './css/link-input.css';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 34;

// @vue/component
export const LinkInput = {
	name: 'LinkInput',
	components: { BInput, BIcon },
	emits: ['insertLink', 'close'],
	data(): JsonObject
	{
		return {
			linkUrl: '',
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		InputSize: () => InputSize,
		InputDesign: () => InputDesign,
		ICON_SIZE: () => ICON_SIZE,
		isValidLink(): boolean
		{
			if (this.linkUrl === '')
			{
				return false;
			}

			return Utils.text.checkUrl(this.linkUrl);
		},
		acceptIconClass(): { [key: string]: boolean }
		{
			return {
				'--disabled': !this.isValidLink,
				'--active': this.isValidLink,
			};
		},
	},
	methods: {
		onAccept()
		{
			this.$emit('insertLink', this.linkUrl);
		},
		onClose()
		{
			this.$emit('close');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-format-toolbar-link__container">
			<div class="bx-im-format-toolbar-link__content">
				<BInput
					v-model="linkUrl"
					:design="InputDesign.Primary"
					:label="loc('IM_TEXTAREA_FORMAT_TOOLBAR_LINK_LABEL')"
					:labelInline="true"
					:placeholder="loc('IM_TEXTAREA_FORMAT_TOOLBAR_LINK_PLACEHOLDER')"
					:size="InputSize.Md"
					:active="true"
					class="bx-im-format-toolbar-link__input"
					@keydown.enter="onAccept"
				/>
				<BIcon
					:name="OutlineIcons.CHECK_S"
					:size="ICON_SIZE"
					:hoverableAlt="true"
					class="bx-im-format-toolbar-link__action --accept"
					:class="acceptIconClass"
					@mousedown.prevent
					@click="onAccept"
				/>
				<BIcon
					:name="OutlineIcons.CROSS_S"
					:size="ICON_SIZE"
					:hoverableAlt="true"
					class="bx-im-format-toolbar-link__action"
					@mousedown.prevent
					@click="onClose"
				/>
			</div>
		</div>
	`,
};
