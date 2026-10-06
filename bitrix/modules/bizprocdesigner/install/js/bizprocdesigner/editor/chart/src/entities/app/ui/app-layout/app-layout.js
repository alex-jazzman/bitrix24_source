import { useFeature, useLoc } from '../../../../shared/composables';
import { FocusAnchor, setFocusAnchor } from '../../../../shared/utils/focus-rescue';

import './app-layout.css';

const SETTINGS_PANEL_CLASSNAMES = {
	base: 'editor-chart-app-layout__settings',
	withPreviewPanel: '--with-preview-panel',
};

const SETTINGS_DATA_INSPECTOR_PANEL_CLASSNAMES = {
	base: 'editor-chart-app-layout__settings-data-inspector',
	shifted: '--shifted',
};

const TOP_RIGHT_TOOLBAR_CLASSNAMES = {
	base: 'editor-chart-app-layout__top-right-toolbar',
	shifted: '--shifted',
	aboveInspectorOverlay: '--above-inspector-overlay',
};

const BOTTOM_RIGHT_TOOLBAR_CLASSNAMES = {
	base: 'editor-chart-app-layout__bottom-right-toolbar',
	shifted: '--shifted',
	margined: '--margined',
	aboveInspectorOverlay: '--above-inspector-overlay',
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
		isDataInspectorPanelShown: {
			type: Boolean,
			default: false,
		},
		isTableSettingsPanelShown: {
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
	setup(): { getMessage: (messageId: string, replacements?: Object) => string }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed: {
		// The inspector scrim makes the diagram inert; the editor toolbars stay reachable.
		isInspectorOverlayShown(): boolean
		{
			return this.showSettings && (this.isDataInspectorPanelShown || this.isTableSettingsPanelShown);
		},
		topRightClassNames(): { [string]: boolean }
		{
			return {
				[TOP_RIGHT_TOOLBAR_CLASSNAMES.base]: true,
				[TOP_RIGHT_TOOLBAR_CLASSNAMES.shifted]: this.showSettings,
				[TOP_RIGHT_TOOLBAR_CLASSNAMES.aboveInspectorOverlay]: this.isInspectorOverlayShown,
			};
		},
		bottomRightClassNames(): { [string]: boolean }
		{
			return {
				[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.base]: true,
				[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.shifted]: this.showSettings,
				[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.margined]: this.showDebugBar,
				[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.aboveInspectorOverlay]: this.isInspectorOverlayShown,
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
		// The section receives the rescued focus when the settings content is replaced, and the header
		// of the panel goes down with that content, so the name cannot be a reference into it.
		settingsPanelLabel(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_SETTINGS_PANEL_ARIA_LABEL');
		},
		settingsDataInspectorClassNames(): { [string]: boolean }
		{
			return {
				[SETTINGS_DATA_INSPECTOR_PANEL_CLASSNAMES.base]: true,
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
		},
	},
	methods: {
		setSettingsAnchor(element: ?HTMLElement): void
		{
			setFocusAnchor(FocusAnchor.settingsPanel, element);
		},
		setDataInspectorAnchor(element: ?HTMLElement): void
		{
			setFocusAnchor(FocusAnchor.dataInspectorPanel, element);
		},
	},
	template: `
		<div
			class="editor-chart-app-layout"
			:data-test-id="$testId('editorLayout')"
		>
			<transition name="fade-skeleton">
				<slot name="skeleton" />
			</transition>

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
						:ref="setSettingsAnchor"
						:class="settingsClassNames"
						:data-testid="$testId('bizprocdesigner-settings-panel')"
						:aria-label="settingsPanelLabel"
						tabindex="-1"
					>
						<slot name="settings"/>
					</section>
				</transition>

				<transition-group name="fade-inspector-panel">
					<template v-if="isInspectorOverlayShown && !isTableSettingsPanelShown">
						<section
							:ref="setDataInspectorAnchor"
							:class="settingsDataInspectorClassNames"
							:data-testid="$testId('bizprocdesigner-settings-data-inspector')"
							key="data-inspector-section"
						>
							<slot name="settings-data-inspector"/>
						</section>
						<div
							class="editor-chart-app-layout__settings-data-inspector-overlay"
							key="data-inspector-overlay"
						></div>
					</template>
				</transition-group>

				<transition-group name="fade-inspector-panel">
					<template v-if="isInspectorOverlayShown && isTableSettingsPanelShown">
						<section
							:class="settingsDataInspectorClassNames"
							key="table-settings-section"
						>
							<slot name="settings-table-settings"/>
						</section>
						<div
							class="editor-chart-app-layout__settings-data-inspector-overlay"
							key="table-settings-overlay"
						></div>
					</template>
				</transition-group>

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
