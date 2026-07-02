import { type PopupOptions } from 'main.popup';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { MessengerPopup } from 'im.v2.component.elements.popup';

import { type QuickReplySaveFormData } from 'imopenlines.v2.provider.service';
import { ALL_SECTIONS_ID } from 'imopenlines.v2.lib.quick-reply';

import { QuickReplySearch } from './quick-reply-search';
import { QuickReplyList } from './quick-reply-list';
import { QuickReplyCreateForm } from './quick-reply-create-form';
import { QuickReplySuccess } from './quick-reply-success';
import { QuickReplyFilters } from './quick-reply-filters';

import './css/quick-reply-popup.css';

const POPUP_ID = 'imol-quick-reply-popup';
const POPUP_CLASSNAME = 'bx-imol-quick-reply-popup__container';

// @vue/component
export const QuickReplyPopup = {
	name: 'QuickReplyPopup',
	components: {
		MessengerPopup,
		BIcon,
		QuickReplySearch,
		QuickReplyList,
		QuickReplyCreateForm,
		QuickReplySuccess,
		QuickReplyFilters,
	},
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
		filteredReplies: {
			type: Array,
			default: () => [],
		},
		sections: {
			type: Array,
			default: () => [],
		},
		activeSectionId: {
			type: Number,
			default: ALL_SECTIONS_ID,
		},
		isSaving: {
			type: Boolean,
			default: false,
		},
		isLoadingNextPage: {
			type: Boolean,
			default: false,
		},
		hasNextPage: {
			type: Boolean,
			default: false,
		},
		highlightedReplyId: {
			type: Number,
			default: 0,
		},
		savedAsEdit: {
			type: Boolean,
			default: false,
		},
		isFormOpen: {
			type: Boolean,
			default: false,
		},
		editingReply: {
			type: Object,
			default: null,
		},
		manageUrl: {
			type: String,
			default: '',
		},
		permissions: {
			type: Object,
			default: () => ({
				canCreate: false,
			}),
		},
	},
	emits: [
		'close',
		'select',
		'queryChange',
		'loadNextPage',
		'filter',
		'save',
		'successHide',
		'replyAdd',
		'replyEdit',
		'formClose',
	],
	computed: {
		POPUP_ID: () => POPUP_ID,
		OutlineIcons: () => OutlineIcons,
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				className: POPUP_CLASSNAME,
				width: 450,
				height: 350,
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
	methods: {
		saveForm(data: QuickReplySaveFormData): void
		{
			this.$emit('save', data);
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
			<div class="bx-imol-quick-reply-popup__header">
				<span>{{ loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_POPUP_TITLE') }}</span>
				<div class="bx-imol-quick-reply-popup__close" @click="$emit('close')">
					<BIcon :name="OutlineIcons.CROSS_L" />
				</div>
			</div>
			<template v-if="isFormOpen">
				<QuickReplyCreateForm
					:sections="sections"
					:editReply="editingReply"
					:defaultSectionId="activeSectionId"
					:isSaving="isSaving"
					@close="$emit('formClose')"
					@save="saveForm"
				/>
			</template>
			<template v-else>
				<QuickReplySuccess :isSaving="isSaving" :isEdit="savedAsEdit" @hide="$emit('successHide')" />
				<QuickReplyFilters
					:sections="sections"
					:activeSectionId="activeSectionId"
					@select="$emit('filter', $event)"
				/>
				<QuickReplySearch
					:manageUrl="manageUrl"
					:permissions="permissions"
					@queryChange="$emit('queryChange', $event)"
					@add="$emit('replyAdd')"
				/>
				<QuickReplyList
					:replies="filteredReplies"
					:highlightedId="highlightedReplyId"
					:isLoadingNextPage="isLoadingNextPage"
					:hasNextPage="hasNextPage"
					@select="$emit('select', $event)"
					@edit="$emit('replyEdit', $event)"
					@loadNextPage="$emit('loadNextPage')"
				/>
			</template>
		</MessengerPopup>
	`,
};
