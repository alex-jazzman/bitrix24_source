import './logo-title.css';

// @vue/component
export const LogoTitle = {
	name: 'LogoTitle',
	props: {
		companyName: {
			type: String,
			default: '',
		},
	},
	template: `
		<div class="editor-chart-logo-title">
			<span class="editor-chart-logo-title__company-name">
				{{ companyName }}
			</span>
			<span class="editor-chart-logo-title__tool-name">
				{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TOOLNAME') }}
			</span>
		</div>
	`,
};
