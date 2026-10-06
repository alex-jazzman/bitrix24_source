import { Event } from 'main.core';
import { FocusTrap } from 'ui.a11y';

import { useDataViewDefinitionStore } from '../stores/definition-store';
import { useDataViewMetaStore } from '../stores/meta-store';
import { DataViewEditorForm } from './editor-form';
import './data-view-editor.css';

const ADD_DIALOG_SELECTOR = '.bizproc-dataview-modal';
const DATE_PICKER_SELECTOR = '.ui-date-picker';

/**
 * The data view editor window. It is mounted into the app-layout {@code settings-table-settings} slot,
 * which reuses the data-inspector panel's geometry (same size/position, left of the node settings) and
 * owns its visibility and enter/leave animation via {@see useDataViewDefinitionStore}'s {@code isOpen};
 * this component only fills that host section. The inner {@see DataViewEditorForm} is remounted per
 * open (keyed by {@code instanceKey}) so its state resets, and carries the whole editor — header
 * included. Closes via ×, the form's "Cancel", or Escape (unless the nested "add parameter" dialog is
 * open).
 */
// @vue/component
export const DataViewEditorWindow = {
	name: 'DataViewEditorWindow',
	components: {
		DataViewEditorForm,
	},
	setup(): Object
	{
		return {
			store: useDataViewDefinitionStore(),
			metaStore: useDataViewMetaStore(),
		};
	},
	computed: {
		/**
		 * Whether the window has finished loading and is safe to drive: its source catalog has arrived
		 * and, when an existing view is being edited, its definition has finished hydrating. Surfaced as
		 * a data-ready flag so an e2e test waits on it — never opening the source picker before the
		 * catalog is there — instead of racing a loading skeleton.
		 */
		isReady(): boolean
		{
			return this.metaStore.hasSources && !this.store.isHydrating;
		},
	},
	mounted(): void
	{
		Event.bind(document, 'keydown', this.onKeydown);

		this.focusTrap = new FocusTrap(this.$el, {
			initialFocus: 'first-tabbable',
			restoreFocus: true,
		});
		this.focusTrap.activate();
	},
	beforeUnmount(): void
	{
		Event.unbind(document, 'keydown', this.onKeydown);

		if (this.focusTrap)
		{
			this.focusTrap.deactivate();
			this.focusTrap.destroy();
			this.focusTrap = null;
		}
	},
	methods: {
		close(): void
		{
			this.store.close();
		},
		onKeydown(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape' || !this.store.isOpen)
			{
				return;
			}

			// Let the nested "add parameter" dialog own Escape while it is open.
			if (document.querySelector(ADD_DIALOG_SELECTOR))
			{
				return;
			}

			// Same for a visible month picker popup (the hidden cached one keeps a null offsetParent).
			const datePicker = document.querySelector(DATE_PICKER_SELECTOR);
			if (datePicker && datePicker.offsetParent !== null)
			{
				return;
			}

			this.close();
		},
	},
	template: `
		<div
			class="bizproc-dataview-panel"
			role="dialog"
			aria-modal="true"
			:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_TITLE')"
			data-test-id="bizproc-dataview__panel"
			:data-ready="isReady ? 'true' : 'false'"
		>
			<DataViewEditorForm :key="store.instanceKey" />
		</div>
	`,
};
