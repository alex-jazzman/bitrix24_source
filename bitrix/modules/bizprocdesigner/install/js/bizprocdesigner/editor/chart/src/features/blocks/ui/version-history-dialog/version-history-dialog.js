import { Loc } from 'main.core';
import { AirButtonStyle, Button } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import { markRaw } from 'ui.vue3';

import { EditorChartTabs } from '../../../../shared/ui';
import { makeDialogDraggable } from '../../../../shared/utils';
import { ChangeHistoryPanel } from './change-history-panel';
import { VersionHistoryPanel } from './version-history-panel';
import './style.css';

// ui.system.dialog fixes the width (it passes width as both minWidth and maxWidth) and the
// popup only shifts a box that does not fit, so the viewport cap has to be applied here.
const DIALOG_WIDTH = 700;
const DIALOG_VIEWPORT_GAP = 32;

const HISTORY_TABS = Object.freeze({
	changes: 'bizprocdesigner-editor-history-tab-changes',
	versions: 'bizprocdesigner-editor-history-tab-versions',
});

const HISTORY_PANEL_ID = 'bizprocdesigner-editor-history-panel';

type HistoryTab = {
	id: string,
	title: string,
};

// @vue/component
export const VersionHistoryDialog = {
	name: 'VersionHistoryDialog',
	components: {
		ChangeHistoryPanel,
		EditorChartTabs,
		VersionHistoryPanel,
	},
	emits: ['close', 'view', 'restore'],
	setup(): Object
	{
		return { HISTORY_PANEL_ID };
	},
	data(): Object
	{
		return {
			instance: null,
			activeTabId: HISTORY_TABS.changes,
		};
	},
	computed: {
		tabs(): Map<string, HistoryTab>
		{
			return new Map([
				[
					HISTORY_TABS.changes,
					{
						id: HISTORY_TABS.changes,
						title: this.loc('BIZPROCDESIGNER_EDITOR_HISTORY_TAB_CHANGES'),
					},
				],
				[
					HISTORY_TABS.versions,
					{
						id: HISTORY_TABS.versions,
						title: this.loc('BIZPROCDESIGNER_EDITOR_HISTORY_TAB_VERSIONS'),
					},
				],
			]);
		},
		isVersionsTab(): boolean
		{
			return this.activeTabId === HISTORY_TABS.versions;
		},
	},
	mounted(): void
	{
		this.getDialog().setContent(this.$refs.content);
		this.getDialog().show();
		makeDialogDraggable(this.$refs.content);
	},
	unmounted(): void
	{
		this.instance?.hide();
	},
	methods: {
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode) ?? '';
		},
		getDialog(): Dialog
		{
			if (!this.instance)
			{
				this.instance = markRaw(this.createDialog());
			}

			return this.instance;
		},
		createDialog(): Dialog
		{
			const close = new Button({
				text: this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_BUTTON_CLOSE'),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				dataset: { testid: 'bizprocdesigner-editor-version-history-close' },
			});

			const dialog = new Dialog({
				title: this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_TITLE'),
				subtitle: this.loc('BIZPROCDESIGNER_EDITOR_VERSION_HISTORY_SUBTITLE'),
				centerButtons: [close],
				events: {
					onHide: this.closePopup,
				},
				width: Math.min(DIALOG_WIDTH, window.innerWidth - DIALOG_VIEWPORT_GAP),
				// The window is meant to stay open while a person edits the scheme, and every click on
				// the scheme lands outside it. Closing is left to the close button, the cross and Esc.
				closeByClickOutside: false,
			});

			close.bindEvent('click', () => {
				dialog.hide();
			});

			return dialog;
		},
		hideDialog(): void
		{
			this.getDialog().hide();
		},
		closePopup(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<div
			ref="content"
			class="bizprocdesigner-history"
			data-testid="bizprocdesigner-editor-version-history"
		>
			<EditorChartTabs
				v-model="activeTabId"
				:tabs="tabs"
				:panel-id="HISTORY_PANEL_ID"
				class="bizprocdesigner-history__tabs"
			/>
			<div
				:id="HISTORY_PANEL_ID"
				role="tabpanel"
				class="bizprocdesigner-history__panel"
				:aria-labelledby="activeTabId"
			>
				<KeepAlive>
					<VersionHistoryPanel
						v-if="isVersionsTab"
						tabindex="0"
						@view="$emit('view', $event)"
						@restore="$emit('restore', $event)"
					/>
					<ChangeHistoryPanel v-else tabindex="0" @access-denied="hideDialog"/>
				</KeepAlive>
			</div>
		</div>
	`,
};
