import { defineComponent } from 'ui.vue3';

import { ViewMode } from '../../const/picker';
import { useSessionStore } from '../../model/session/session';

import './picker-layout.css';

// The window frame: sidebar plus a work area of header, body and footer. In table
// mode the body drops the preview column and the list spans the full width; the
// active object stays in the model, so switching back restores the preview.
export const PickerLayout = defineComponent({
	name: 'DiskPickerLayout',
	computed: {
		isTable(): boolean
		{
			return useSessionStore().viewMode === ViewMode.Table;
		},
	},
	template: `
		<div class="disk-picker-layout" :class="{ '--table': isTable }">
			<div class="disk-picker-layout__sidebar">
				<slot name="sidebar"/>
			</div>
			<div class="disk-picker-layout__workarea">
				<div class="disk-picker-layout__header">
					<slot name="header"/>
				</div>
				<div class="disk-picker-layout__body">
					<div class="disk-picker-layout__list">
						<slot name="list"/>
					</div>
					<div class="disk-picker-layout__preview">
						<slot name="preview"/>
					</div>
				</div>
				<div class="disk-picker-layout__footer">
					<slot name="footer"/>
				</div>
			</div>
		</div>
	`,
});
