import { SidePanel as SidePanelMain } from 'main.sidepanel';
import { DateTimeFormat } from 'main.date';
import { mapGetters } from 'ui.vue3.vuex';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import { lazyload } from 'ui.vue3.directives.lazyload';
import { hint } from 'ui.vue3.directives.hint';
import 'ui.icon-set.main';

import { Button, ButtonSize, ButtonColor } from 'booking.component.button';
import { Duration } from 'booking.lib.duration';
import { Model } from 'booking.const';
import { Loader } from 'booking.component.loader';
import type { ClientData, ClientModel } from 'booking.model.clients';

import { Note } from './note/note';
import { Empty } from './empty/empty';
import { EditClientButton } from './edit-client-button/edit-client-button';
import './client.css';

export type { AddClientsPayload } from './empty/empty';
export type { UpdateClientsPayload } from './edit-client-button/edit-client-button';
export type { UpdateNotePayload } from './note/note';

const SidePanel = SidePanelMain || BX.SidePanel;

const TimeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
const DateFormat = DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT');

// @vue/component
export const Client = {
	name: 'ActionsPopupClient',
	directives: { lazyload, hint },
	components: {
		Button,
		Icon,
		Loader,
		Empty,
		Note,
		EditClientButton,
	},
	props: {
		id: {
			type: [Number, String],
			required: true,
		},
		/**
		 * @type ClientData
		 */
		primaryClientData: {
			type: Object,
			default: null,
		},
		/**
		 * @type ClientData
		 */
		clients: {
			type: Array,
			default: () => [],
		},
		note: {
			type: String,
			default: '',
		},
		dataId: {
			type: [Number, String],
			default: '',
		},
		dataElementPrefix: {
			type: String,
			default: '',
		},
		dataAttributes: {
			type: Object,
			default: null,
		},
		dateFromTs: {
			type: Number,
			default: null,
		},
		dateToTs: {
			type: Number,
			default: null,
		},
	},
	emits: [
		'freeze',
		'unfreeze',
		'addClients',
		'updateClients',
		'updateNote',
	],
	setup(): Object
	{
		return {
			ButtonSize,
			ButtonColor,
		};
	},
	data(): Object
	{
		return {
			isLoading: true,
		};
	},
	computed: {
		...mapGetters({
			offset: `${Model.Interface}/offset`,
		}),
		booking(): Object | null
		{
			return this.$store.getters[`${Model.Bookings}/getById`](this.id);
		},
		client(): ClientModel | null
		{
			const clientData: ClientData = this.primaryClientData;

			return clientData ? this.$store.getters['clients/getByClientData'](clientData) : null;
		},
		clientPhone(): string
		{
			const client: ClientModel = this.client;

			return (
				client.phones.length > 0
					? client.phones[0]
					: this.loc('BB_ACTIONS_POPUP_CLIENT_PHONE_LABEL')
			);
		},
		itemTimeFormatted(): string
		{
			if (!this.dateFromTs || !this.dateToTs)
			{
				return '';
			}

			const durationMs = this.dateToTs - this.dateFromTs;
			const isLong = durationMs >= Duration.getUnitDurations().d;

			const fromSeconds = (this.dateFromTs + this.offset) / 1000;
			const toSeconds = (this.dateToTs + this.offset) / 1000;

			const fromFormatted = isLong
				? `${DateTimeFormat.format(DateFormat, fromSeconds)} ${DateTimeFormat.format(TimeFormat, fromSeconds)}`
				: DateTimeFormat.format(TimeFormat, fromSeconds);

			const toFormatted = isLong
				? `${DateTimeFormat.format(DateFormat, toSeconds)} ${DateTimeFormat.format(TimeFormat, toSeconds)}`
				: DateTimeFormat.format(TimeFormat, toSeconds);

			return this.loc('BOOKING_ACTIONS_POPUP_CLIENT_TIME_RANGE', {
				'#FROM#': fromFormatted,
				'#TO#': toFormatted,
			});
		},
		clientAvatar(): string
		{
			const client: ClientModel = this.client;

			return client.image;
		},
		clientStatus(): string
		{
			if (!this.client.isReturning)
			{
				return this.loc('BB_ACTIONS_POPUP_CLIENT_STATUS_FIRST');
			}

			return this.loc('BB_ACTIONS_POPUP_CLIENT_STATUS_RETURNING');
		},
		userIcon(): string
		{
			return IconSet.PERSON;
		},
		personSize(): number
		{
			return 26;
		},
		callIcon(): string
		{
			return IconSet.TELEPHONY_HANDSET_1;
		},
		messageIcon(): string
		{
			return IconSet.CHATS_1;
		},
		iconSize(): number
		{
			return 20;
		},
		iconColor(): string
		{
			return 'var(--ui-color-palette-gray-20)';
		},
		imageTypeClass(): string[] | string
		{
			return '--user';
		},
		soonHint(): Object
		{
			return {
				text: this.loc('BOOKING_BOOKING_SOON_HINT'),
				popupOptions: {
					offsetLeft: -60,
				},
			};
		},
	},
	async mounted()
	{
		this.isLoading = false;
	},
	methods: {
		openClient(): void
		{
			const entity = this.client.type.code.toLowerCase();

			SidePanel.Instance.open(`/crm/${entity}/details/${this.client.id}/`);
		},
	},
	template: `
		<div class="booking-actions-popup__item booking-actions-popup__item-client">
			<div class="booking-actions-popup__item-client-client">
				<Loader v-if="isLoading" class="booking-actions-popup__item-client-loader"/>
				<template v-else-if="client">
					<div class="booking-actions-popup__item-client-icon-container">
						<div
							v-if="clientAvatar"
							class="booking-actions-popup-user__avatar"
							:class="imageTypeClass"
						>
							<img
								v-lazyload
								:data-lazyload-src="clientAvatar"
								class="booking-actions-popup-user__source"
								alt="user avatar"
							/>
						</div>
						<div v-else class="booking-actions-popup__item-client-icon">
							<Icon :name="userIcon" :size="personSize" :color="iconColor"/>
						</div>
					</div>
					<div class="booking-actions-popup__item-client-info">
						<div class="booking-actions-popup__item-client-info-label" :title="client.name">
							{{ client.name }}
						</div>
						<div class="booking-actions-popup-item-info">
							<div class="booking-actions-popup-item-subtitle">
								{{ clientStatus }}
							</div>
							<div class="booking-actions-popup-item-subtitle">
								{{ clientPhone }}
							</div>
							<div v-if="itemTimeFormatted" class="booking-actions-popup-item-subtitle">
								{{ itemTimeFormatted }}
							</div>
						</div>
						<div class="booking-actions-popup-item-buttons booking-actions-popup__item-client-info-btn">
							<Button
								:data-element="dataElementPrefix + '-menu-client-open'"
								v-bind="dataAttributes"
								class="booking-actions-popup-item-client-open-button"
								:text="loc('BB_ACTIONS_POPUP_CLIENT_BTN_LABEL')"
								:size="ButtonSize.EXTRA_SMALL"
								:color="ButtonColor.LIGHT_BORDER"
								:round="true"
								@click="openClient"
							/>
							<EditClientButton
								:id
								:clients
								:dataElementPrefix
								:dataAttributes
								@visible="$emit('freeze')"
								@invisible="$emit('unfreeze')"
								@updateClients="$emit('updateClients', $event)"
							/>
						</div>
					</div>
					<div v-hint="soonHint" class="booking-actions-popup__item-client-action">
						<Icon :name="callIcon" :size="iconSize" :color="iconColor"/>
						<Icon :name="messageIcon" :size="iconSize" :color="iconColor"/>
					</div>
				</template>
				<template v-else>
					<Empty
						:id
						:itemTimeFormatted
						@popupShown="$emit('freeze')"
						@popupClosed="$emit('unfreeze')"
						@addClients="$emit('addClients', $event)"
					/>
				</template>
			</div>
			<Note
				:id
				:dataId
				:dataElementPrefix
				:note
				:dataAttributes
				@popupShown="$emit('freeze')"
				@popupClosed="$emit('unfreeze')"
				@updateNote="$emit('updateNote', $event)"
			/>
		</div>
	`,
};
