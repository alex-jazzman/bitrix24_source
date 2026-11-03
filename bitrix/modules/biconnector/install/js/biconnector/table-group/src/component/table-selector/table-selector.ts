import type { BaseEvent } from 'main.core.events';
import { Dialog, type Item } from 'ui.entity-selector';
import type { BitrixVueComponentProps, PropType } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';
import { getTableIconPath, getTableLabel } from '../../const/table-view';
import { type Table } from '../../const/type';

// The catalogue reaches the popup whole, so the dialog needs no provider of its own and asks the server nothing.
const TABLE_ENTITY_ID = 'biconnector-table';

export const TableSelector: BitrixVueComponentProps = {
	name: 'BIConnectorTableGroupTableSelector',
	components: {
		UiButton,
	},
	props: {
		tables: {
			type: Array as PropType<Table[]>,
			required: true,
		},
	},
	emits: [
		'onTablesChange',
		'onTableDeselect',
	],
	setup(): Object
	{
		return { AirButtonStyle, ButtonIcon, ButtonSize };
	},
	data(): Object
	{
		return {
			bypassDeselectHandler: false,
		};
	},
	created(): void
	{
		// The dialog must stay out of the reactive state: its private fields break through Vue's proxy.
		this.dialog = null;
	},
	mounted(): void
	{
		this.initDialog();
	},
	beforeUnmount(): void
	{
		this.dialog?.destroy();
	},
	methods: {
		initDialog(): void
		{
			const groupTableCodes: Set<string> = new Set(this.$store.getters.groupTableCodes);

			this.dialog = new Dialog({
				id: 'biconnector-table-group-selector',
				targetNode: this.$refs.addTableButton,
				width: 400,
				height: 370,
				dropdownMode: true,
				enableSearch: true,
				entities: [
					{
						id: TABLE_ENTITY_ID,
						dynamicLoad: false,
						dynamicSearch: false,
					},
				],
				// An item outside a tab lands in the collection of the dialog and in no list: the
				// dropdown then opens empty and the catalog answers only the search.
				items: this.tables.map((table: Table) => ({
					id: table.code,
					entityId: TABLE_ENTITY_ID,
					tabs: 'recents',
					title: getTableLabel(table),
					avatar: getTableIconPath(table.type),
					avatarOptions: { bgSize: 'contain' },
					selected: groupTableCodes.has(table.code),
				})),
				events: {
					'Item:onSelect': (event: BaseEvent): void => {
						const item: Item = event.getData().item;
						this.$store.commit('addTable', item.getId());
						this.$emit('onTablesChange');
					},
					'Item:onDeselect': (event: BaseEvent): void => {
						if (this.bypassDeselectHandler)
						{
							return;
						}

						const item: Item = event.getData().item;
						this.$store.commit('removeTable', item.getId());
						this.$emit('onTableDeselect', { code: item.getId() });
						this.$emit('onTablesChange');
					},
				},
			});
		},
		handleAddClick(): void
		{
			this.dialog.show();
		},
		deselect(tableCode: string): void
		{
			// The row of the list has removed the table already: the dialog only drops its mark.
			this.bypassDeselectHandler = true;
			this.dialog?.getItem({ entityId: TABLE_ENTITY_ID, id: tableCode })?.deselect();
			this.bypassDeselectHandler = false;
		},
	},
	// language=Vue
	template: `
		<div class="biconnector-table-group__add-table" ref="addTableButton">
			<UiButton
				:text="$Bitrix.Loc.getMessage('BI_TABLE_GROUP_ADD_TABLE')"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.TINTED"
				:leftIcon="ButtonIcon.ADD"
				@click="handleAddClick"
			/>
		</div>
	`,
};
