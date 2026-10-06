import { Loc, Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { AirButtonStyle } from 'ui.vue3.components.button';
import { type MenuItemOptions, type MenuOptions } from 'ui.vue3.components.menu';
import { splitSource } from 'bizproc.dataview';

import { MenuButton } from '../../../shared/ui';

/** Storage names longer than this are shortened with an ellipsis inside chips (mockup rule). */
const SOURCE_LABEL_MAX_LENGTH = 16;

// @vue/component
export const ColumnEditor = {
	name: 'BizprocDataViewColumnEditor',
	components: {
		Chip,
		MenuButton,
	},
	props: {
		/**
		 * A column either reads a field of a picked source, or is a stamp — the template constant
		 * pinned to every row, which carries `kind`/`constant` instead of a `source`.
		 *
		 * @type Array<
		 *     { code: string, title: string, source: string }
		 *     | { code: string, title: string, kind: 'constant',
		 *         constant: { module: string, entity: string, params: Object } }
		 * >
		 */
		columns: {
			type: Array,
			default: (): Array<Object> => [],
		},
		/** @type { [alias: string]: string } human labels for source aliases. */
		sourceLabels: {
			type: Object,
			default: (): Object => ({}),
		},
		// Whether a column can be dropped from its menu. Off for an aggregate, whose columns are results
		// (grouping fields + totals) governed by the panel, not removable one by one from the header.
		removable: {
			type: Boolean,
			default: true,
		},
		// Whether a column opens the "modify value" dialog. Off while the flags behind the formula builder
		// are, since a formula is all the dialog holds.
		modifiable: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['edit', 'modify', 'remove'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ChipDesign,
			ChipSize,
			Outline,
		};
	},
	methods: {
		sourceLabel(column: Object): string
		{
			const { alias } = splitSource(column.source);

			return Type.isStringFilled(this.sourceLabels[alias]) ? this.sourceLabels[alias] : alias;
		},
		sourceLabelShort(column: Object): string
		{
			const label = this.sourceLabel(column);

			return label.length > SOURCE_LABEL_MAX_LENGTH
				? `${label.slice(0, SOURCE_LABEL_MAX_LENGTH - 1)}…`
				: label;
		},
		/**
		 * What the column offers in its menu. A result column of an aggregate comes from the backend
		 * rather than from a picked field: there is nothing to reopen the parameter dialog with, nothing
		 * to bind a formula to, and the grouping governs its removal — so its menu stays empty, and the
		 * grouping itself is edited in the panel. A stamp carries a constant instead of a source value,
		 * which no formula replaces, so it is left without the item too.
		 */
		menuItems(column: Object): Array<MenuItemOptions>
		{
			const items = [];
			if (Type.isStringFilled(column.source) || column.kind === 'constant')
			{
				items.push({
					title: Loc.getMessage('BIZPROC_JS_DATAVIEW_COLUMN_EDIT'),
					icon: Outline.EDIT_M,
					dataset: { testId: `bizproc-dataview__chip-edit-${column.code}` },
					onClick: () => this.$emit('edit', column),
				});
			}

			if (this.modifiable && Type.isStringFilled(column.source))
			{
				items.push({
					title: Loc.getMessage('BIZPROC_JS_DATAVIEW_COLUMN_MODIFY'),
					icon: Outline.SIGMA_SUMM,
					dataset: { testId: `bizproc-dataview__chip-modify-${column.code}` },
					onClick: () => this.$emit('modify', column),
				});
			}

			if (this.removable || column.kind === 'constant')
			{
				items.push({
					title: Loc.getMessage('BIZPROC_JS_DATAVIEW_COLUMN_REMOVE'),
					icon: Outline.TRASHCAN,
					design: 'alert',
					dataset: { testId: `bizproc-dataview__chip-remove-${column.code}` },
					onClick: () => this.$emit('remove', column.code),
				});
			}

			return items;
		},
		menuOptions(column: Object): MenuOptions
		{
			return { items: this.menuItems(column) };
		},
		/** A column with nothing to offer keeps no button: an empty menu is a dead end to open. */
		hasMenu(column: Object): boolean
		{
			return this.menuItems(column).length > 0;
		},
		menuLabel(column: Object): string
		{
			return Loc.getMessage('BIZPROC_JS_DATAVIEW_COLUMN_MENU', { '#NAME#': column.title });
		},
	},
	template: `
		<thead class="bizproc-dataview-grid__head">
			<tr>
				<th class="bizproc-dataview-grid__id-cell" scope="col">ID</th>
				<th
					v-for="column in columns"
					:key="column.code"
					scope="col"
				>
					<div class="bizproc-dataview-column" :data-test-id="'bizproc-dataview__chip-' + column.code">
						<span class="bizproc-dataview-column__name" :title="column.title">{{ column.title }}</span>
						<span
							v-if="column.formula"
							class="text-3xs"
							:title="column.formula"
							style="color: var(--ui-color-base-4); white-space: nowrap;"
						>ƒ</span>
						<Chip
							v-if="column.source"
							class="bizproc-dataview-column__source"
							:text="sourceLabelShort(column)"
							:title="sourceLabel(column)"
							:design="ChipDesign.TintedNoAccent"
							:size="ChipSize.Xs"
							:data-test-id="'bizproc-dataview__chip-source-' + column.code"
						/>
						<span
							v-if="hasMenu(column)"
							class="bizproc-dataview-column__menu"
							:data-test-id="'bizproc-dataview__chip-menu-' + column.code"
						>
							<MenuButton
								:icon="Outline.MORE_M"
								:buttonStyle="AirButtonStyle.PLAIN_NO_ACCENT"
								:options="menuOptions(column)"
								:ariaLabel="menuLabel(column)"
							/>
						</span>
					</div>
				</th>
				<td class="bizproc-dataview-grid__fill-cell"></td>
			</tr>
		</thead>
	`,
};
