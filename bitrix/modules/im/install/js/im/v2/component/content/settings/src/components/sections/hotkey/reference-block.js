import { ReferenceHeader } from './reference-header';
import { ReferenceRow } from './reference-row';

import '../css/hotkey-reference.css';

// @vue/component
export const ReferenceBlock = {
	name: 'ReferenceBlock',
	components: { ReferenceHeader, ReferenceRow },
	props:
	{
		block: {
			type: Object,
			required: true,
		},
	},
	computed:
	{
		titleId(): string
		{
			return `bx-im-settings-hotkey-reference-title-${this.block.id}`;
		},
	},
	template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div :id="titleId" class="bx-im-settings-section-content__block_title">{{ block.title }}</div>
				<div class="bx-im-settings-hotkey-reference__scroll">
					<div
						class="bx-im-settings-hotkey-reference"
						:class="{ '--two-columns': block.columns.length === 2 }"
						role="table"
						:aria-labelledby="titleId"
					>
						<ReferenceHeader :columns="block.columns" />
						<ReferenceRow
							v-for="row in block.rows"
							:key="row.action"
							:action="row.action"
							:cells="row.cells"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};
