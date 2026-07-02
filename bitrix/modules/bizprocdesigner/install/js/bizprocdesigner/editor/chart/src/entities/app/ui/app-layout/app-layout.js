import './app-layout.css';
import { useBlockDiagram } from 'ui.block-diagram';
import { useFeature, useLoc } from '../../../../shared/composables';

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
	margined: '--margined',
};

const DEBUG_BAR_TOOLBAR_CLASSNAMES = {
	base: 'editor-chart-app-layout__debug-bar-toolbar',
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
		showDebugBar: {
			type: Boolean,
			default: false,
		},
		catalogExpanded: {
			type: Boolean,
			default: true,
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
				[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.margined]: this.showDebugBar,
			};
		},
		debugBarClassNames(): { [string]: boolean }
		{
			return {
				[DEBUG_BAR_TOOLBAR_CLASSNAMES.base]: true,
				[DEBUG_BAR_TOOLBAR_CLASSNAMES.shifted]: this.showSettings,
			};
		},
		settingsClassNames(): { [string]: boolean }
		{
			return {
				[SETTINGS_PANEL_CLASSNAMES.base]: true,
				[SETTINGS_PANEL_CLASSNAMES.withPreviewPanel]: this.showPreviewPanel,
			};
		},
		debugBarStyle(): { [string]: string }
		{
			const CATALOG_WIDTH_COLLAPSED = 54;
			const CATALOG_WIDTH_EXPANDED = 330;
			const SETTINGS_WIDTH = 470;
			const SIDE_MARGINS = 40;
			const SIDE_PADDINGS = 10;
			const catalogWidth = this.catalogExpanded ? CATALOG_WIDTH_EXPANDED : CATALOG_WIDTH_COLLAPSED;
			const settingsWidth = this.showSettings ? SETTINGS_WIDTH + 10 : 0;

			const maxWidth = `calc(100vw - ${catalogWidth}px - ${settingsWidth}px - ${SIDE_MARGINS}px - ${SIDE_PADDINGS}px)`;

			return {
				width: maxWidth,
			};
		},
		isDebugBarAvailable(): boolean
		{
			const { isFeatureAvailable } = useFeature();

			return isFeatureAvailable('debugBar');
		}
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

				<section v-if="showDebugBar && isDebugBarAvailable" :class="debugBarClassNames" :style="debugBarStyle">
					<slot name="debug-bar-toolbar"/>
				</section>

				<section class="editor-chart-app-layout__top-middle-anchor">
					<slot name="top-middle-anchor"/>
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
