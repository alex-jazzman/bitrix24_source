import { type JsonObject } from 'main.core';

import { TextContent } from 'im.v2.component.message.elements';
import { Parser } from 'im.v2.lib.parser';
import { type ImModelMessageTableBlockType } from 'im.v2.model';

import { BaseBlock } from '../base/base';

import './table.css';

// @vue/component
export const TableBlock = {
	name: 'TableBlock',
	components: { BaseBlock, TextContent },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			isNarrow: false,
			naturalWidth: 0,
		};
	},
	computed: {
		tableBlock(): ImModelMessageTableBlockType
		{
			return this.block;
		},
		columnCount(): number
		{
			return this.tableBlock.rows[0].length ?? 1;
		},
	},
	mounted()
	{
		this.naturalWidth = this.measureNaturalWidth();
		this.initResizeObserver();
	},
	beforeUnmount()
	{
		this.resizeObserver.disconnect();
	},
	methods: {
		initResizeObserver()
		{
			this.resizeObserver = new ResizeObserver(([entry]) => {
				this.isNarrow = entry.contentRect.width < this.naturalWidth;
			});
			this.resizeObserver.observe(this.$refs.container.closest('.bx-im-message-base__wrap'));
		},
		measureNaturalWidth(): number
		{
			const COLUMN_GAP = 10;
			const tbody = this.$refs.container.querySelector('tbody');
			const gridTemplateColumns = getComputedStyle(tbody).gridTemplateColumns.split(' ');
			const [firstColumn, secondColumn] = gridTemplateColumns.map((element) => {
				return parseFloat(element);
			});

			if (secondColumn)
			{
				return firstColumn + secondColumn + COLUMN_GAP;
			}

			return firstColumn;
		},
		getFormattedText(text: string): string
		{
			return Parser.decodeText(text);
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="tableBlock"
			:dialogId="dialogId"
		>
			<div
				:class="{ '--narrow': isNarrow }"
				:style="{ '--im-message-builder-table-cols': columnCount }"
				ref="container"
				class="bx-im-message-block-table__container"
			>
				<table class="bx-im-message-block-table__table">
					<tbody>
						<tr
							v-for="(row, rowIndex) in tableBlock.rows"
							:key="rowIndex"
						>
							<td
								v-for="(cell, cellIndex) in row"
								:key="cellIndex"
							>
								<TextContent
									:text="getFormattedText(cell.text)"
									class="--line-clamp-3"
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</BaseBlock>
	`,
};
