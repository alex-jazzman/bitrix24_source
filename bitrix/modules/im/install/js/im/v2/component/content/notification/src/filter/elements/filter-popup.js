import { MessengerPopup } from 'im.v2.component.elements.popup';
import { NotificationFilterActionButtons } from './action-buttons';
import { NotificationFilterAuthorField } from '../fields/author-field';
import { NotificationFilterTypeField } from '../fields/type-field';
import { NotificationFilterDateField } from '../fields/date-field';
import 'im.v2.css.classes';

import './css/filter-popup.css';

import type { PopupOptions } from 'main.popup';
import type { JsonObject } from 'main.core';

const POPUP_ID = 'im-content-notification-filter-popup';

// @vue/component
export const NotificationFilterPopup = {
	name: 'NotificationFilterPopup',
	components: {
		MessengerPopup,
		NotificationFilterActionButtons,
		NotificationFilterAuthorField,
		NotificationFilterTypeField,
		NotificationFilterDateField,
	},
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
		schema: {
			type: Object,
			required: false,
			default: null,
		},
		filterData: {
			type: Object,
			default: () => ({
				searchTypes: [],
				searchDate: {},
				searchAuthors: [],
			}),
		},
	},
	emits: [
		'close',
		'search',
		'reset',
		'mounted',
		'popupStateChange',
	],
	data(): JsonObject
	{
		return {
			searchTypes: this.filterData.searchTypes,
			searchDate: this.filterData.searchDate,
			searchAuthors: this.filterData.searchAuthors,
		};
	},
	computed: {
		popupId: () => POPUP_ID,
		config(): PopupOptions
		{
			return {
				width: 560,
				height: 350,
				bindElement: this.bindElement,
				offsetTop: 10,
				autoHide: false,
				padding: 0,
				contentPadding: 0,
				bindOptions: {
					position: 'bottom',
				},
				className: 'bx-im-content-notification-filter-popup',
				animation: 'fading-slide',
			};
		},
	},
	mounted() {
		this.$emit('mounted', this.$refs.wrapper);
	},
	methods: {
		buildData(): JsonObject
		{
			return {
				searchTypes: this.searchTypes,
				searchDate: this.searchDate,
				searchAuthors: this.searchAuthors,
			};
		},
		onSearchClick(): void
		{
			this.$emit('search', this.buildData());
		},
		getContentElement(): HTMLElement
		{
			return this.$refs.wrapper;
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			:id="popupId"
		>
			<div
				class="bx-im-content-notification-filter-popup__wrapper"
				ref="wrapper"
			>
				<div class="bx-im-content-notification-filter-popup__fields-list bx-im-messenger__scope">
					<NotificationFilterAuthorField
						v-model="searchAuthors"
						@popupStateChange="$emit('popupStateChange', $event)"
					/>
					<NotificationFilterTypeField
						v-model="searchTypes"
						:schema="schema"
						@popupStateChange="$emit('popupStateChange', $event)"
					/>
					<NotificationFilterDateField
						v-model="searchDate"
						@popupStateChange="$emit('popupStateChange', $event)"
					/>
				</div>
				<NotificationFilterActionButtons
					@search="onSearchClick"
					@reset="this.$emit('reset')"
				/>
			</div>
		</MessengerPopup>
	`,
};
