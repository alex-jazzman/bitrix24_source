import { defineComponent } from 'ui.vue3';

import { ViewMode } from '../../const/picker';
import { useSessionStore } from '../../model/session/session';

import './picker-layout.css';

// The window frame: sidebar plus a work area of header, body and footer. In table
// mode the body drops the preview column and the list spans the full width; the
// active object stays in the model, so switching back restores the preview.
//
// A list with nothing in it drops the column too. An empty folder, a search that found
// nothing and a failed load have no file to describe, so the panel stood there repeating
// its own "pick a file" next to a picture saying the same thing — two placeholders for one
// absence. The message of the list then has the whole plate to itself.
//
// The header is a row of the frame rather than the top of the plate: the path and the controls
// stand on the dialog's glass, in the same token context as the disks beside them. The
// blurred-bg context keeps the theme wallpaper off the buttons there: the dialog paints its own.
export const PickerLayout = defineComponent({
	name: 'DiskPickerLayout',
	computed: {
		isTable(): boolean
		{
			return useSessionStore().viewMode === ViewMode.Table;
		},
		// Loading is not emptiness: the skeletons of the list stand beside the panel as before,
		// and the column must not jump out and back while a folder opens.
		hasContent(): boolean
		{
			const session = useSessionStore();

			return session.contentLoading || (session.contentError === null && session.emptyReason === null);
		},
	},
	template: `
		<div
			class="disk-picker-layout --ui-context-content-light"
			:class="{ '--table': isTable, '--no-preview': !hasContent }"
		>
			<div class="disk-picker-layout__sidebar --ui-context-edge-dark">
				<slot name="sidebar"/>
			</div>
			<div class="disk-picker-layout__header --ui-context-edge-dark --air-context-blurred-bg">
				<slot name="header"/>
			</div>
			<div class="disk-picker-layout__workarea">
				<div class="disk-picker-layout__body">
					<div class="disk-picker-layout__list">
						<slot name="list"/>
					</div>
					<div v-if="hasContent" class="disk-picker-layout__preview">
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
