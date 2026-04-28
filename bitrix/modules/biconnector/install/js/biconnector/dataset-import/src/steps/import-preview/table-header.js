import '../../css/dataset-preview-table.css';
import { hint } from 'ui.vue3.directives.hint';
import { BIcon, Set } from 'ui.icon-set.api.vue';

export const TableHeader = {
	directives: {
		hint,
	},
	components: {
		BIcon,
	},
	props: {
		fields: {
			type: Array,
			required: false,
			default: [],
		},
		columnVisibility: {
			type: Array,
			required: false,
			default: [],
		},
		sourceType: {
			type: String,
			required: false,
			default: '',
		},
	},
	computed: {
		visibleFields()
		{
			return this.fields.filter((_, index) => this.columnVisibility[index]);
		},
		sourceTypeCsv(): boolean
		{
			return this.sourceType === 'csv';
		},
		hintOptions(): Object
		{
			return {
				text: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_PREVIEW_COLUMN_DATETIME_HINT'),
				popupOptions: {
					bindOptions: {
						position: 'bottom',
					},
					angle: {
						position: 'top',
					},
					width: 300,
					offsetLeft: 10,
					autoHide: false,
				},
			};
		},
		set(): Set
		{
			return Set;
		},
	},
	methods: {
		isHintVisible(field: Object): boolean
		{
			return this.sourceTypeCsv && field.type === 'datetime';
		},
	},
	// language=Vue
	template: `
		<thead>
			<tr class="dataset-preview-table__header-row">
				<th
					class="dataset-preview-table__header"
					v-for="field in visibleFields"
				>
					<div class="dataset-preview-table__header-content">
						<span
							class="dataset-preview-table__header-title"
							:title="field.name"
						>{{ field.name }}</span>
						<span
							v-if="isHintVisible(field)"
							class="dataset-preview-table__header-hint"
							v-hint="hintOptions"
						>
							<BIcon
								:name="set.INFO_1"
								:size="20"
								color="#B5BABE"
							></BIcon>
						</span>
					</div>
				</th>
			</tr>
		</thead>
	`,
};
