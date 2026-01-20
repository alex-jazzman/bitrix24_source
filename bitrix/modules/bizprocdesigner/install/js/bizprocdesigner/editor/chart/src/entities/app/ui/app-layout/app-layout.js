import './app-layout.css';

const SETTINGS_PANEL_CLASSNAMES = {
	base: 'editor-chart-app-layout__settings',
	withPreviewPanel: '--with-preview-panel',
};

const TOP_RIGHT_TOOLBAR_CLASSNAMES = {
	base: 'editor-chart-app-layout__top-right-toolbar',
	shifted: '--shifted',
};

const BOTTOM_RIGHT_TOOLBAR_CLASSNAMES = {
	base: 'editor-chart-app-layout__bottom-right-toolbar',
	shifted: '--shifted',
};

// @vue/component
export const AppLayout = {
	name: 'AppLayout',
	props: {
		showSettings: {
			type: Boolean,
			default: false,
		},
		showPreviewPanel: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		topRightClassNames(): { [string]: boolean }
		{
			return {
				[TOP_RIGHT_TOOLBAR_CLASSNAMES.base]: true,
				[TOP_RIGHT_TOOLBAR_CLASSNAMES.shifted]: this.showSettings,
			};
		},
		bottomRightClassNames(): { [string]: boolean }
		{
			return {
				[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.base]: true,
				[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.shifted]: this.showSettings,
			};
		},
		settingsClassNames(): { [string]: boolean }
		{
			return {
				[SETTINGS_PANEL_CLASSNAMES.base]: true,
				[SETTINGS_PANEL_CLASSNAMES.withPreviewPanel]: this.showPreviewPanel,
			};
		},
	},
	template: `
		<div class="editor-chart-app-layout">
			<section class="editor-chart-app-layout__header">
				<slot name="header"/>
			</section>
			<main class="editor-chart-app-layout__content">
				<slot name="diagram"/>

				<section class="editor-chart-app-layout__catalog">
					<slot name="catalog"/>
				</section>

				<section :class="topRightClassNames">
					<slot name="top-right-toolbar"/>
				</section>

				<section :class="bottomRightClassNames">
					<slot name="bottom-right-toolbar"/>
				</section>

				<transition
					name="fade-settings-panel"
					enter-active-class="fade-settings-panel-enter-active"
					leave-active-class="fade-settings-panel-leave-active"
				>
					<section
						v-if="showSettings"
						:class="settingsClassNames"
					>
						<slot name="settings"/>
					</section>
				</transition>

				<transition name="fade-preview-panel">
					<section
						v-show="showPreviewPanel"
						class="editor-chart-app-layout__preview-panel"
					>
						<div class="editor-chart-app-layout__preview-panel-conatiner">
							<div
								id="preview-panel"
								class="editor-chart-app-layout__preview-panel-content"
							>
							</div>
						</div>
					</section>
				</transition>
			</main>
		</div>
	`,
};
