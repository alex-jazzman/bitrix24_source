import { type JsonObject } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { MessengerPopup } from 'im.v2.component.elements.popup';

import { type ImolModelCrmForm } from 'imopenlines.v2.model';

import { CrmFormSearch } from './crm-form-search';

import './css/crm-form-popup.css';

const POPUP_ID = 'imol-crm-form-popup';
const POPUP_CLASSNAME = 'bx-imol-crm-form-popup__container';

// @vue/component
export const CrmFormPopup = {
	name: 'CrmFormPopup',
	components: { MessengerPopup, CrmFormSearch, BIcon },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
		forms: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['selectForm', 'close'],
	data(): JsonObject
	{
		return {
			searchQuery: '',
		};
	},
	computed: {
		POPUP_ID: () => POPUP_ID,
		OutlineIcons: () => OutlineIcons,
		list(): ImolModelCrmForm[]
		{
			if (this.searchQuery === '')
			{
				return this.forms;
			}

			const query = this.searchQuery.toLowerCase();

			return this.forms.filter((form: ImolModelCrmForm) => {
				return form.name.toLowerCase().includes(query);
			});
		},
		isListEmpty(): boolean
		{
			return this.list.length === 0;
		},
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				className: POPUP_CLASSNAME,
				width: 500,
				height: 216,
				overlay: false,
				autoHide: true,
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
		onSearchUpdate(query: string): void
		{
			this.searchQuery = query;
		},
		onFormClick(form: ImolModelCrmForm): void
		{
			this.$emit('selectForm', form);
		},
		onSearchSubmit(): void
		{
			const selectedForm = this.list[0];
			if (selectedForm)
			{
				this.$emit('selectForm', selectedForm);
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
			<CrmFormSearch @updateQuery="onSearchUpdate" @submit="onSearchSubmit" />
			<div class="bx-imol-crm-form-popup__list">
				<template v-if="isListEmpty">
					<div class="bx-imol-crm-form-popup__empty">
						{{ loc('IMOL_CONTENT_TEXTAREA_CRM_FORM_POPUP_EMPTY') }}
					</div>
				</template>
				<template v-else>
					<div
						v-for="form in list"
						:key="form.id"
						@click="onFormClick(form)"
						class="bx-imol-crm-form-popup__item"
					>
						<div class="bx-imol-crm-form-popup__item-icon">
							<BIcon :name="OutlineIcons.ARROW_RIGHT_M" />
						</div>
						<span class="bx-imol-crm-form-popup__item-title --ellipsis">{{ form.name }}</span>
					</div>
				</template>
			</div>
		</MessengerPopup>
	`,
};
