import './preview-header.css';

// @vue/component
export const PreviewHeader = {
	name: 'PreviewHeader',
	template: `
		<header class="bizproc-setuptemplateactivity-preview-header">
			<h3 class="bizproc-setuptemplateactivity-preview-header__title">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PREVIEW_HEADER_TITLE') }}
				<span class="bizproc-setuptemplateactivity-preview-header__tag-preview">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PREVIEW_HEADER_TAG') }}
				</span>
			</h3>
			<div class="bizproc-setuptemplateactivity-preview-header__line"></div>
		</header>
	`,
};
