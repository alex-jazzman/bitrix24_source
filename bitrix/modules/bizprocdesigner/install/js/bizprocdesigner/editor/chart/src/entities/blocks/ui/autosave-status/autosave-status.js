import './autosave-status.css';
import { hint } from 'ui.vue3.directives.hint';

// @vue/component
export const AutosaveStatus = {
	name: 'bizprocdisginer-top-panel-autosave-status',
	directives: {
		hint,
	},
	props: {
		isOnline: {
			type: Boolean,
			required: true,
		},
	},
	template: `
		<div>
			<div
				v-if="isOnline"
				v-hint="{
					text: this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_SAVED_HINT'),
					popupOptions: {
						width: 339,
						offsetTop: 20,
						background: '#085DC1',
					},
				}"
				class="bizprocdesigner-editor-header-save-status-box bizprocdesigner-editor-header-online"
			>
				<div class="ui-icon-set --o-circle-check"></div>
				{{$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_SAVED')}}
			</div>
			<div
				v-else
				v-hint="{
					text: $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED_HINT'),
					popupOptions: {
						width: 339,
						background: '#085DC1',
					},
				}"
				class="bizprocdesigner-editor-header-save-status-box bizprocdesigner-editor-header-offline"
			>
				<div class="ui-icon-set --o-circle-cross"></div>
				{{$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED')}}
			</div>
		</div>
	`,
};
