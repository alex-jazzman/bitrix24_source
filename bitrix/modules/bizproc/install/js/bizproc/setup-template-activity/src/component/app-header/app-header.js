import './app-header.css';

// @vue/component
export const AppHeader = {
	name: 'AppHeader',
	template: `
		<header class="bizproc-setuptemplateactivity-app-header">
			<div class="bizproc-setuptemplateactivity-app-header__title-wrap">
				<h3 class="bizproc-setuptemplateactivity-app-header__title">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_APP_TITLE') }}
				</h3>
				<div class="bizproc-setuptemplateactivity-app-header__preview-btn">
					<slot name="preview-btn"/>
				</div>
			</div>

			<p class="bizproc-setuptemplateactivity-app-header__description">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_HEADER_DESCRIPTION') }}
			</p>
		</header>
	`,
};
