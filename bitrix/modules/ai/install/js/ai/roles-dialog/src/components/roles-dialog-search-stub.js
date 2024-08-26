import '../css/roles-dialog-search-stub.css';

export const RolesDialogSearchStub = {
	template: `
		<div class="ai__roles-dialog_search-stub">
			<div class="ai__roles-dialog_search-stub-content">
				<div class="ai__roles-dialog_search-stub-image"></div>
				<div class="ai__roles-dialog_search-stub-text">
					{{ $Bitrix.Loc.getMessage('AI_COPILOT_ROLES_SEARCH_NO_RESULT_2') }}
				</div>
			</div>
		</div>
	`,
};
