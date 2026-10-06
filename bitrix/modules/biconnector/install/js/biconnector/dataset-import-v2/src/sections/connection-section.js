import { Dom, Event, Loc, Runtime, Tag, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';
import { SidePanel } from 'ui.sidepanel';

import { MascotVideo } from './mascot-video';
import '../css/connection-section.css';

const CONNECTION_ENTITY_ID = 'biconnector-external-connection';
const TABLE_ENTITY_ID = 'biconnector-external-table';
const CONNECTION_SLIDER = '/bitrix/components/bitrix/biconnector.externalconnection/slider.php';

export const ConnectionSection = {
	components: { MascotVideo },
	inject: ['appParams'],
	emits: ['continue', 'replace'],
	props: {
		isEditing: {
			type: Boolean,
			required: false,
			default: false,
		},
		isReselect: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	data()
	{
		return {
			titleMessage: Loc.getMessage('DATASET_IMPORT_V2_CONNECTION_SECTION_TITLE'),
			emptyHint: Loc.getMessage('DATASET_IMPORT_V2_CONNECTION_SECTION_EMPTY_HINT'),
			continueLabel: Loc.getMessage('DATASET_IMPORT_V2_CONNECTION_SECTION_CONTINUE'),
			replaceLabel: Loc.getMessage('DATASET_IMPORT_V2_FILE_SECTION_REPLACE'),
			connectionLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_FIELD'),
			tableLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_TABLE_FIELD'),
		};
	},
	computed:
	{
		...mapGetters(['isEditMode', 'connectionProperties', 'datasetProperties']),
		connections()
		{
			return this.appParams?.connections ?? [];
		},
		selectedConnectionId()
		{
			return this.connectionProperties?.connectionId ?? 0;
		},
		selectedConnectionType()
		{
			return this.connectionProperties?.connectionType ?? '';
		},
		selectedConnectionName()
		{
			return this.connectionProperties?.connectionName ?? '';
		},
		selectedTableName()
		{
			return this.connectionProperties?.tableName ?? '';
		},
		datasetName()
		{
			return this.datasetProperties?.name ?? '';
		},
		headerTitle()
		{
			if (this.showSummary && !this.showSelectors && this.datasetName)
			{
				return this.datasetName;
			}

			return this.titleMessage;
		},
		selectedConnectionAvatar()
		{
			const id = this.selectedConnectionId;
			if (id > 0)
			{
				const connection = this.connections.find((item) => parseInt(item.ID, 10) === id);
				if (connection && connection.AVATAR)
				{
					return connection.AVATAR;
				}
			}

			return `/bitrix/images/biconnector/database-connections/${this.selectedConnectionType}.svg`;
		},
		hasSelectedTable()
		{
			return this.selectedConnectionId > 0 && this.selectedTableName !== '';
		},
		showSelectors()
		{
			return !this.isEditMode && this.isEditing;
		},
		showSummary()
		{
			return this.isEditMode || this.hasSelectedTable;
		},
		canContinue()
		{
			return this.hasSelectedTable;
		},
		actionLabel()
		{
			return this.isReselect ? this.replaceLabel : this.continueLabel;
		},
	},
	watch:
	{
		selectedConnectionId(newConnectionId)
		{
			if (!this.tableSelector)
			{
				return;
			}
			this.tableSelector.removeTags();
			this.tableSelector.getDialog().removeItems();
			if (!newConnectionId)
			{
				this.tableSelector.setLocked(true);

				return;
			}
			this.tableSelector.getDialog().getEntity(TABLE_ENTITY_ID).options.connectionId = newConnectionId;
			this.tableSelector.setLocked(false);
		},
	},
	created()
	{
		// selector instances must stay out of reactive state: a Vue proxy breaks private #field access
		this.connectionSelector = null;
		this.tableSelector = null;
	},
	async mounted()
	{
		this.onSliderMessage = (event) => this.handleSliderMessage(event);
		EventEmitter.subscribe('SidePanel.Slider:onMessage', this.onSliderMessage);
		if (!this.isEditMode)
		{
			const { TagSelector } = await Runtime.loadExtension('ui.entity-selector');
			this.TagSelector = TagSelector;
			this.initConnectionSelector();
			this.initTableSelector();
		}
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe('SidePanel.Slider:onMessage', this.onSliderMessage);
	},
	methods:
	{
		preparedConnectionItems()
		{
			return this.connections.map((item) => {
				const options = {
					id: item.ID,
					title: item.TITLE,
					entityId: CONNECTION_ENTITY_ID,
					tabs: 'connections',
					link: `${CONNECTION_SLIDER}?sourceId=${item.ID}&closeAfterCreate=Y`,
					linkTitle: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_ABOUT'),
					customData: {
						connectionType: item.TYPE,
						isSupportMapping: item.IS_SUPPORT_MAPPING ?? false,
					},
				};
				if (item.AVATAR)
				{
					options.avatar = item.AVATAR;
				}

				if (this.selectedConnectionId)
				{
					options.selected = item.ID === String(this.selectedConnectionId);
				}

				return options;
			});
		},
		initConnectionSelector()
		{
			if (!this.$refs.connectionSelector)
			{
				return;
			}
			const selector = new this.TagSelector({
				id: CONNECTION_ENTITY_ID,
				multiple: false,
				addButtonCaption: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_SELECT'),
				addButtonCaptionMore: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_CHANGE'),
				dialogOptions: {
					id: CONNECTION_ENTITY_ID,
					items: this.preparedConnectionItems(),
					enableSearch: true,
					dropdownMode: true,
					popupOptions: {
						className: 'biconnector-dataset-entity-selector-popup',
					},
					showAvatars: true,
					compactView: false,
					multiple: false,
					width: 460,
					height: 420,
					tabs: [{
						id: 'connections',
						stubOptions: {
							title: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_EMPTY_TITLE'),
							subtitle: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_EMPTY_SUBTITLE'),
						},
					}],
					entities: [{ id: CONNECTION_ENTITY_ID }],
				},
				events: {
					onTagAdd: (event) => this.onConnectionSelected(event),
					onTagRemove: () => this.onConnectionDeselected(),
				},
			});
			Dom.addClass(selector.getDialog().getContainer(), 'biconnector-dataset-entity-selector');
			selector.renderTo(this.$refs.connectionSelector);

			const footer = Tag.render`
				<span class="ui-selector-footer-link ui-selector-footer-link-add">
					${Text.encode(Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_CREATE'))}
				</span>
			`;
			Event.bind(footer, 'click', () => this.openConnectionSlider(0));
			selector.getDialog().getTab('connections').setFooter(footer);

			this.connectionSelector = selector;
		},
		initTableSelector()
		{
			if (!this.$refs.tableSelector)
			{
				return;
			}
			const selector = new this.TagSelector({
				id: TABLE_ENTITY_ID,
				multiple: false,
				addButtonCaption: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_SELECT'),
				addButtonCaptionMore: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_CHANGE'),
				dialogOptions: {
					id: TABLE_ENTITY_ID,
					enableSearch: true,
					dropdownMode: true,
					popupOptions: {
						className: 'biconnector-dataset-entity-selector-popup',
					},
					showAvatars: false,
					compactView: true,
					multiple: false,
					dynamicLoad: true,
					width: 460,
					height: 420,
					tabs: [{
						id: 'tables',
						stub: true,
						stubOptions: {
							title: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_TABLE_STUB_TITLE'),
							subtitle: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_TABLE_STUB_SUBTITLE'),
						},
					}],
					entities: [{
						id: TABLE_ENTITY_ID,
						dynamicLoad: false,
						dynamicSearch: true,
						options: {
							...(this.selectedConnectionId && { connectionId: this.selectedConnectionId }),
						},
					}],
				},
				events: {
					onTagAdd: (event) => this.onTableSelected(event),
					onTagRemove: () => this.onTableDeselected(),
				},
			});
			Dom.addClass(selector.getDialog().getContainer(), 'biconnector-dataset-entity-selector');
			selector.setLocked(this.selectedConnectionId <= 0);
			selector.renderTo(this.$refs.tableSelector);

			this.tableSelector = selector;
		},
		onConnectionSelected(event)
		{
			const tag = event.data.tag;
			const dialogItems = event.target.getDialog().getItems();
			dialogItems.forEach((item) => {
				if (item.getId() === tag.getId())
				{
					tag.customData = item.getCustomData();
				}
			});

			const connectionId = parseInt(tag.getId(), 10);
			this.$store.commit('setConnectionProperties', {
				connectionId,
				connectionType: tag.getCustomData().get('connectionType'),
				connectionName: tag.getTitle(),
				connectionIsSupportMapping: Boolean(tag.getCustomData().get('isSupportMapping')),
				tableName: '',
			});
		},
		onConnectionDeselected()
		{
			this.$store.commit('setConnectionProperties', {
				connectionId: 0,
				connectionType: '',
				connectionName: '',
				connectionIsSupportMapping: false,
				tableName: '',
			});
		},
		onTableSelected(event)
		{
			const tag = event.data.tag;
			const dialogItems = event.target.getDialog().getItems();
			dialogItems.forEach((item) => {
				if (item.getId() === tag.getId())
				{
					tag.customData = item.getCustomData();
				}
			});

			this.$store.commit('setConnectionProperties', {
				...this.connectionProperties,
				tableName: tag.getTitle(),
			});
			this.$store.commit('setDatasetProperties', {
				id: 0,
				name: tag.getCustomData().get('datasetName') ?? '',
				externalCode: tag.getId(),
				externalName: tag.getTitle(),
			});
		},
		onTableDeselected()
		{
			this.$store.commit('setConnectionProperties', {
				...this.connectionProperties,
				tableName: '',
			});
			this.$store.commit('setDatasetProperties', {
				id: 0,
				name: '',
				externalCode: '',
				externalName: '',
			});
			this.$store.commit('setFieldsSettings', []);
			this.$store.commit('setPreviewData', []);
		},
		onContinue()
		{
			if (!this.canContinue)
			{
				return;
			}
			this.$emit('continue');
		},
		onReplace()
		{
			this.$emit('replace');
		},
		openConnectionSlider(connectionId)
		{
			const link = connectionId
				? `${CONNECTION_SLIDER}?sourceId=${connectionId}&closeAfterCreate=Y`
				: `${CONNECTION_SLIDER}?closeAfterCreate=Y`
			;
			SidePanel.Instance.open(link, {
				width: 564,
				allowChangeHistory: false,
				cacheable: false,
			});
		},
		handleSliderMessage(event)
		{
			const [messageEvent] = event.getData();
			if (messageEvent.getEventId() !== 'BIConnector:ExternalConnection:onConnectionSave')
			{
				return;
			}
			const connection = messageEvent.data?.connection;
			if (!connection)
			{
				return;
			}

			const dialog = this.connectionSelector?.getDialog();
			if (!dialog)
			{
				return;
			}

			const connectionId = String(connection.id);
			const connectionName = Text.decode(connection.name ?? '');
			let item = dialog.getItem({
				id: connectionId,
				entityId: CONNECTION_ENTITY_ID,
			});
			if (item)
			{
				item.setTitle({ text: connectionName, type: 'text' });
				if (item.isSelected())
				{
					this.connectionSelector.removeTags();
					item.deselect();
					item.select();
				}
			}
			else
			{
				item = dialog.addItem({
					id: connectionId,
					title: connectionName,
					entityId: CONNECTION_ENTITY_ID,
					tabs: 'connections',
					link: `${CONNECTION_SLIDER}?sourceId=${connectionId}&closeAfterCreate=Y`,
					linkTitle: Loc.getMessage('DATASET_IMPORT_V2_CARD_CONNECTION_ABOUT'),
					avatar: connection.avatar
						?? `/bitrix/images/biconnector/database-connections/${connection.type}.svg`,
					customData: {
						connectionType: connection.type ?? '',
						isSupportMapping: Boolean(connection.isSupportMapping ?? false),
					},
				});
				item.select();
			}
			dialog.hide();
		},
	},
	// language=Vue
	template: `
		<section
			class="biconnector-dataset-import-v2-connection-section"
			:class="{
				'biconnector-dataset-import-v2-connection-section--empty': showSelectors,
			}"
		>
			<header class="biconnector-dataset-import-v2-connection-section__header">
				<span class="biconnector-dataset-import-v2-connection-section__header-icon ui-icon-set --o-link-settings"></span>
				<span class="biconnector-dataset-import-v2-connection-section__header-title ui-typography-text-md">{{ headerTitle }}</span>
				<template v-if="showSummary && !showSelectors">
					<button
						type="button"
						class="biconnector-dataset-import-v2-connection-section__chip"
						@click="openConnectionSlider(selectedConnectionId)"
					>
						<span
							class="biconnector-dataset-import-v2-connection-section__chip-avatar"
							:style="{ backgroundImage: 'url(' + selectedConnectionAvatar + ')' }"
						></span>
						<span class="biconnector-dataset-import-v2-connection-section__chip-name ui-typography-text-sm">{{ selectedConnectionName }}</span>
					</button>
					<span
						v-if="!isEditMode"
						class="biconnector-dataset-import-v2-connection-section__divider"
					></span>
					<button
						v-if="!isEditMode"
						type="button"
						class="biconnector-dataset-import-v2-connection-section__replace ui-typography-text-sm"
						@click="onReplace"
					>{{ replaceLabel }}</button>
				</template>
			</header>

			<div
				v-show="showSelectors"
				class="biconnector-dataset-import-v2-connection-section__body"
			>
				<MascotVideo v-if="showSelectors" :playing="false" />
				<p class="biconnector-dataset-import-v2-connection-section__empty-text ui-typography-text-sm">{{ emptyHint }}</p>
				<div class="biconnector-dataset-import-v2-connection-section__form">
					<label class="biconnector-dataset-import-v2-connection-section__field">
						<span class="biconnector-dataset-import-v2-connection-section__field-label ui-typography-text-sm">{{ connectionLabel }}</span>
						<div ref="connectionSelector" class="biconnector-dataset-import-v2-connection-section__selector"></div>
					</label>
					<label class="biconnector-dataset-import-v2-connection-section__field">
						<span class="biconnector-dataset-import-v2-connection-section__field-label ui-typography-text-sm">{{ tableLabel }}</span>
						<div ref="tableSelector" class="biconnector-dataset-import-v2-connection-section__selector"></div>
					</label>
				</div>
				<button
					type="button"
					class="biconnector-dataset-import-v2-connection-section__continue"
					:disabled="!canContinue"
					@click="onContinue"
				>{{ actionLabel }}</button>
			</div>
		`,
};
