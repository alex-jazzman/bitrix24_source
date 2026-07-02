/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {};
(function (exports, ui_vue3, ui_vue3_pinia, ui_blockDiagram, bizprocdesigner_feature, pull_client, main_core, ui_vue3_components_button, ui_iconSet_api_core, main_core_events, ui_notification, ui_iconSet_api_vue, ui_loader, ui_vue3_components_menu, ui_buttons, ui_vue3_directives_hint, ui_system_typography_vue, main_popup, ui_vue3_components_popup, ui_entitySelector, window$1, ui_dialogs_messagebox, ui_feedback_form, ui_system_dialog) {
	'use strict';

	function initAiUpdatePull(callback) {
		pull_client.PULL.subscribe({
			moduleId: 'bizprocdesigner',
			command: 'bizprocdesigner_ai_draft_updated',
			callback: async pushData => {
				callback(pushData);
			}
		});
	}

	function getConnectionKey(connection) {
		return `${connection.sourceBlockId}_${connection.sourcePortId}_${connection.targetBlockId}_${connection.targetPortId}`;
	}
	function isBlockConnection(connection, block) {
		return connection.sourceBlockId === block.id || connection.targetBlockId === block.id;
	}
	function getConnectionMap(connections) {
		return new Map(connections.map(conn => [getConnectionKey(conn), conn]));
	}
	function makeAnimationQueue(currentBlocks, currentConnections, newBlocks, newConnections) {
		const animatedItems = [];
		const currentBlockMap = new Map(currentBlocks.map(block => [block.id, block]));
		const newBlockMap = new Map(newBlocks.map(block => [block.id, block]));
		const currentConnectionMap = getConnectionMap(currentConnections);
		const newConnectionMap = getConnectionMap(newConnections);
		const handledConnections = new Set();

		// Remove not present in new blocks
		for (const [id, block] of currentBlockMap.entries()) {
			if (!newBlockMap.has(id)) {
				animatedItems.push({
					type: ui_blockDiagram.ANIMATED_TYPES.REMOVE_BLOCK,
					item: block
				});
				// Remove block dependent connections
				for (const [connectionId, conn] of currentConnectionMap.entries()) {
					if (!handledConnections.has(connectionId) && isBlockConnection(conn, block)) {
						handledConnections.add(connectionId);
					}
				}
			}
		}

		// remove other not present connections
		for (const [connectionId, conn] of currentConnectionMap.entries()) {
			if (!handledConnections.has(connectionId) && !newConnectionMap.has(connectionId)) {
				animatedItems.push({
					type: ui_blockDiagram.ANIMATED_TYPES.REMOVE_CONNECTION,
					item: conn
				});
				handledConnections.add(connectionId);
			}
		}

		// Append new blocks
		for (const [id, block] of newBlockMap.entries()) {
			if (!currentBlockMap.has(id)) {
				animatedItems.push({
					type: ui_blockDiagram.ANIMATED_TYPES.BLOCK,
					item: block
				});
				// append dependent block connections
				for (const [connectionId, conn] of newConnectionMap.entries()) {
					if (!currentConnectionMap.has(connectionId) && !handledConnections.has(connectionId) && isBlockConnection(conn, block)) {
						animatedItems.push({
							type: ui_blockDiagram.ANIMATED_TYPES.CONNECTION,
							item: conn
						});
						handledConnections.add(connectionId);
					}
				}
			}
		}

		// append new connections for existed blocks
		for (const [connectionId, conn] of newConnectionMap.entries()) {
			if (!currentConnectionMap.has(connectionId) && !handledConnections.has(connectionId)) {
				animatedItems.push({
					type: ui_blockDiagram.ANIMATED_TYPES.CONNECTION,
					item: conn
				});
				handledConnections.add(connectionId);
			}
		}
		return animatedItems;
	}

	function useFeature() {
		return {
			isFeatureAvailable: featureCode => {
				return bizprocdesigner_feature.Feature.instance().isAvailable(featureCode);
			}
		};
	}

	function useLoc() {
		const app = ui_vue3.getCurrentInstance()?.appContext.app;
		const bitrix = app?.config?.globalProperties?.$bitrix ?? null;
		return {
			getMessage: (messageId, replacements) => {
				return bitrix?.Loc?.getMessage(messageId, replacements);
			}
		};
	}

	const renderPropertyDialog = async (contentContainer, formData) => {
		if (main_core.Type.isUndefined(window.rootActivity)) {
			return null;
		}
		const {
			getMessage
		} = useLoc();
		const contentUrl = `/bitrix/tools/bizproc_activity_settings.php?mode=public&bxpublic=Y&lang=${getMessage('LANGUAGE_ID')}&app=vue`;
		const content = await fetch(contentUrl, {
			method: 'POST',
			body: formData
		});
		const form = main_core.Tag.render`
		<form
			id="form-settings"
			class="bx-core-adm-dialog node-settings-form"
			name="bx_popup_form">
		</form>
	`;
		main_core.Dom.append(form, contentContainer);
		await main_core.Runtime.html(form, await content.text());
		return form;
	};
	const createFormData = ({
		id,
		documentType,
		activity,
		workflow
	}) => {
		const {
			parameters,
			variables,
			template,
			constants
		} = workflow;
		const postData = {
			id,
			decode: 'Y',
			module_id: documentType[0],
			entity: documentType[1],
			document_type: documentType[2],
			activity,
			arWorkflowParameters: JSON.stringify(parameters),
			arWorkflowVariables: JSON.stringify(variables),
			arWorkflowTemplate: JSON.stringify(template),
			arWorkflowConstants: JSON.stringify(constants),
			current_site_id: 's1',
			can_be_activated: 'Y',
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			sessid: BX.bitrix_sessid()
		};
		const dialog = new BX.CDialog({
			// temporary dialog
			content: '<div class="for-camp"></div>',
			width: 400,
			height: 200
		});
		dialog.Show();
		const formData = new FormData();
		Object.entries(postData).forEach(([key, value]) => {
			formData.append(key, value);
		});
		return formData;
	};
	function usePropertyDialog() {
		return {
			createFormData,
			renderPropertyDialog
		};
	}

	const useAppStore = ui_vue3_pinia.defineStore('bizprocdesigner-app-store', {
		state: () => ({
			isShownRightPanel: false,
			isShownPreviewPanel: false,
			isShownDebugBar: false
		}),
		actions: {
			showRightPanel() {
				this.isShownRightPanel = true;
			},
			hideRightPanel() {
				this.isShownRightPanel = false;
				this.isShownPreviewPanel = false;
			},
			setShowPreviewPanel(isShow) {
				this.isShownPreviewPanel = isShow;
			},
			showPreviewPanel() {
				this.isShownPreviewPanel = true;
			},
			hidePreviewPanel() {
				this.isShownPreviewPanel = false;
			},
			showDebugBar() {
				this.isShownDebugBar = true;
			},
			hideDebugBar() {
				this.isShownDebugBar = false;
			},
			toggleDebugBar() {
				this.isShownDebugBar = !this.isShownDebugBar;
			},
			setDebugEnabled(value) {
				this.isShownDebugBar = value;
			}
		}
	});

	const SETTINGS_PANEL_CLASSNAMES = {
		base: 'editor-chart-app-layout__settings',
		withPreviewPanel: '--with-preview-panel'
	};
	const TOP_RIGHT_TOOLBAR_CLASSNAMES = {
		base: 'editor-chart-app-layout__top-right-toolbar',
		shifted: '--shifted'
	};
	const BOTTOM_RIGHT_TOOLBAR_CLASSNAMES = {
		base: 'editor-chart-app-layout__bottom-right-toolbar',
		shifted: '--shifted',
		margined: '--margined'
	};
	const DEBUG_BAR_TOOLBAR_CLASSNAMES = {
		base: 'editor-chart-app-layout__debug-bar-toolbar',
		shifted: '--shifted'
	};

	// @vue/component
	const AppLayout$1 = {
		name: 'AppLayout',
		props: {
			showSettings: {
				type: Boolean,
				default: false
			},
			showPreviewPanel: {
				type: Boolean,
				default: false
			},
			showDebugBar: {
				type: Boolean,
				default: false
			},
			catalogExpanded: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			topRightClassNames() {
				return {
					[TOP_RIGHT_TOOLBAR_CLASSNAMES.base]: true,
					[TOP_RIGHT_TOOLBAR_CLASSNAMES.shifted]: this.showSettings
				};
			},
			bottomRightClassNames() {
				return {
					[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.base]: true,
					[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.shifted]: this.showSettings,
					[BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.margined]: this.showDebugBar
				};
			},
			debugBarClassNames() {
				return {
					[DEBUG_BAR_TOOLBAR_CLASSNAMES.base]: true,
					[DEBUG_BAR_TOOLBAR_CLASSNAMES.shifted]: this.showSettings
				};
			},
			settingsClassNames() {
				return {
					[SETTINGS_PANEL_CLASSNAMES.base]: true,
					[SETTINGS_PANEL_CLASSNAMES.withPreviewPanel]: this.showPreviewPanel
				};
			},
			debugBarStyle() {
				const CATALOG_WIDTH_COLLAPSED = 54;
				const CATALOG_WIDTH_EXPANDED = 330;
				const SETTINGS_WIDTH = 470;
				const SIDE_MARGINS = 40;
				const SIDE_PADDINGS = 10;
				const catalogWidth = this.catalogExpanded ? CATALOG_WIDTH_EXPANDED : CATALOG_WIDTH_COLLAPSED;
				const settingsWidth = this.showSettings ? SETTINGS_WIDTH + 10 : 0;
				const maxWidth = `calc(100vw - ${catalogWidth}px - ${settingsWidth}px - ${SIDE_MARGINS}px - ${SIDE_PADDINGS}px)`;
				return {
					width: maxWidth
				};
			},
			isDebugBarAvailable() {
				const {
					isFeatureAvailable
				} = useFeature();
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
	`
	};

	// @vue/component
	const AppHeader$1 = {
		name: 'AppHeader',
		template: `
		<header class="editor-chart-app-header">
			<div class="editor-chart-app-header__left-column">
				<slot name="left"/>
			</div>
			<div class="editor-chart-app-header__right-column">
				<slot name="right"/>
			</div>
		</header>
	`
	};

	// @vue/component
	const LogoLayout = {
		name: 'LogoLayout',
		template: `
		<div class="editor-chart-logo-layout">
			<div class="editor-chart-logo-layout__back-btn">
				<slot name="back-btn"/>
			</div>
			<div class="editor-chart-logo-layout__logo-title">
				<slot name="title"/>
			</div>
		</div>
	`
	};

	const DEFAULT_BACK_URL = '/bizproc/templateprocesses/';

	// @vue/component
	const LogoBackBtn = {
		name: 'LogoBackBtn',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			backUrl: {
				type: String,
				default: DEFAULT_BACK_URL
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_core.Outline
			};
		},
		template: `
		<UiButton
			:leftIcon="Outline.HOME"
			:style="AirButtonStyle.PLAIN"
			:link="backUrl"
		/>
	`
	};

	// @vue/component
	const LogoTitle = {
		name: 'LogoTitle',
		props: {
			companyName: {
				type: String,
				default: ''
			}
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
	`
	};

	// @vue/component
	const AppHeaderDivider = {
		name: 'AppHeaderDivider',
		template: `
		<div class="editor-chart-app-header-divider"/>
	`
	};

	const BLOCK_TYPES$2 = {
		SIMPLE: 'simple',
		TRIGGER: 'trigger',
		COMPLEX: 'complex',
		FRAME: 'frame',
		TOOL: 'tool',
		SERVICES: 'services',
		OPERATORS: 'operators'
	};
	const BLOCK_SLOT_NAMES = {
		SIMPLE: `block:${BLOCK_TYPES$2.SIMPLE}`,
		TRIGGER: `block:${BLOCK_TYPES$2.TRIGGER}`,
		COMPLEX: `block:${BLOCK_TYPES$2.COMPLEX}`,
		FRAME: `block:${BLOCK_TYPES$2.FRAME}`,
		TOOL: `block:${BLOCK_TYPES$2.TOOL}`,
		SERVICES: `block:${BLOCK_TYPES$2.SERVICES}`,
		OPERATORS: `block:${BLOCK_TYPES$2.OPERATORS}`
	};
	const CONNECTION_SLOT_NAMES = {
		AUX: 'connection:aux'
	};
	const TEMPLATE_PUBLISH_STATUSES = {
		MAIN: 'main',
		USER: 'user',
		FULL: 'full'
	};
	const BLOCK_COLOR_NAMES = {
		WHITE: 'white',
		ORANGE: 'orange',
		BLUE: 'blue'
	};
	const FRAME_TEXT_ALIGN_OPTIONS = {
		NONE: 'none',
		LEFT: 'left',
		TOP: 'top',
		BOTTOM: 'bottom',
		RIGHT: 'right'
	};
	const FRAME_COLOR_NAMES = {
		GREY: 'grey',
		ORANGE: 'orange',
		GREEN: 'green',
		BLUE: 'blue',
		PURPLE: 'purple',
		PINK: 'pink'
	};
	const FRAME_BG_COLORS = {
		[FRAME_COLOR_NAMES.GREY]: 'var(--designer-bp-frame-grey-bg)',
		[FRAME_COLOR_NAMES.ORANGE]: 'var(--designer-bp-frame-orange-bg)',
		[FRAME_COLOR_NAMES.GREEN]: 'var(--designer-bp-frame-green-bg)',
		[FRAME_COLOR_NAMES.BLUE]: 'var(--designer-bp-frame-blue-bg)',
		[FRAME_COLOR_NAMES.PURPLE]: 'var(--designer-bp-frame-purple-bg)',
		[FRAME_COLOR_NAMES.PINK]: 'var(--designer-bp-frame-pink-bg)'
	};
	const FRAME_BORDER_COLORS = {
		[FRAME_COLOR_NAMES.GREY]: 'var(--designer-bp-frame-grey-br)',
		[FRAME_COLOR_NAMES.ORANGE]: 'var(--designer-bp-frame-orange-br)',
		[FRAME_COLOR_NAMES.GREEN]: 'var(--designer-bp-frame-green-br)',
		[FRAME_COLOR_NAMES.BLUE]: 'var(--designer-bp-frame-blue-br)',
		[FRAME_COLOR_NAMES.PURPLE]: 'var(--designer-bp-frame-purple-br)',
		[FRAME_COLOR_NAMES.PINK]: 'var(--designer-bp-frame-pink-br)'
	};
	const BLOCK_TOAST_TYPES = Object.freeze({
		ACTIVITY_PUBLIC_ERROR: 'activity-public-error'
	});
	const ICON_BG_COLORS = {
		0: 'var(--designer-bp-ai-bg)',
		1: 'var(--designer-bp-entities-bg)',
		2: 'var(--designer-bp-employe-bg)',
		3: 'var(--designer-bp-technical-bg)',
		4: 'var(--designer-bp-communication-bg)',
		5: 'var(--designer-bp-storage-bg)',
		6: 'var(--designer-bp-afiliate-bg)',
		7: 'var(--designer-bp-ai-bg)',
		8: 'var(--designer-bp-ai-bg)'
	};
	const BLOCK_TOP_CONTEXT_MENU_PREFIX_NAME = 'block_top_menu_';

	const post$2 = async (action, data) => {
		const response = await main_core.ajax.runAction(`bizprocdesigner.v2.${action}`, {
			method: 'POST',
			json: data || {}
		});
		if (response.status === 'success') {
			return response.data;
		}
		return null;
	};
	const editorAPI = {
		getCatalogData: () => {
			return post$2('Catalog.get');
		},
		getDiagramData: async params => {
			return post$2('Diagram.get', params);
		},
		updateTemplateData: data => {
			return post$2('Diagram.updateTemplate', data);
		},
		publicDiagramData: data => {
			return post$2('Diagram.publicate', data);
		},
		publicDiagramDataDraft: data => {
			return post$2('Diagram.publicateDraft', data);
		},
		getNodeSettingsControls: data => {
			return post$2('Activity.getSettingsControls', data);
		},
		saveNodeSettings: data => {
			return post$2('Activity.SaveSettings', data);
		}
	};

	const createUniqueId = () => {
		const randomNumber = () => Math.floor(1000 + Math.random() * 9000);
		return `A${randomNumber()}_${randomNumber()}_${randomNumber()}_${randomNumber()}`;
	};

	function updateIdUrl(templateId) {
		const url = new URL(window.location.href);
		url.searchParams.set('ID', templateId);
		url.searchParams.delete('START_TRIGGER');
		history.replaceState(null, '', url.toString());
	}

	function handleResponseError(response) {
		if (response.errors?.length > 0) {
			const [error] = response.errors;
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Text.encode(error.message),
				autoHideDelay: 4000
			});
		} else {
			console.error(response);
		}
	}

	function deepEqual(a, b) {
		if (a === b) {
			return true;
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
		if (typeof a !== typeof b) {
			return false;
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
		if (typeof a !== 'object' || a === null || b === null) {
			return false;
		}
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (keysA.length !== keysB.length) {
			return false;
		}
		for (const key of keysA) {
			if (!deepEqual(a[key], b[key])) {
				return false;
			}
		}
		return true;
	}

	const parsePortTitle = title => {
		if (!title) {
			return null;
		}
		const [label, num] = title.split(/(\d+)/);
		return {
			label,
			id: Number(num)
		};
	};

	function isBlockPropertiesDifferent(currentBlock, newBlock) {
		if (currentBlock.node.title !== newBlock.node.title) {
			return true;
		}
		for (const [key] of Object.entries(newBlock?.activity?.Properties ?? {})) {
			const currentBlockProperty = currentBlock?.activity?.Properties?.[key] ?? null;
			const newBlockProperty = newBlock.activity.Properties[key];
			if (!deepEqual(currentBlockProperty, newBlockProperty)) {
				return true;
			}
		}
		return false;
	}
	function getBlockMap(blocks) {
		return new Map(blocks.map(block => [block.id, block]));
	}
	function getBlockUserTitle(block) {
		const activityTitle = block.activity?.Properties?.Title;
		const defaultNodeTitle = block.node?.title;
		return activityTitle === defaultNodeTitle ? null : activityTitle;
	}
	function getContextMenuName(blockId) {
		return `${BLOCK_TOP_CONTEXT_MENU_PREFIX_NAME}_${blockId}`;
	}

	function safeParse(input) {
		try {
			return JSON.parse(input);
		} catch (e) {
			console.error('JSON parse error', e);
			return null;
		}
	}
	function parseItemsFromBlocksJson(input) {
		let blocks = input;
		if (main_core.Type.isStringFilled(input)) {
			blocks = safeParse(input);
		}
		if (main_core.Type.isArray(blocks)) {
			return blocks.flatMap(block => block.items || []);
		}
		return [];
	}

	const BLOCK_TYPES$1 = Object.freeze({
		SIMPLE: 'simple',
		TRIGGER: 'trigger',
		COMPLEX: 'complex',
		TOOL: 'tool',
		FRAME: 'frame',
		SERVICES: 'services',
		OPERATORS: 'operators'
	});
	const BLOCK_TYPES_WITHOUT_SETTINGS = [BLOCK_TYPES$1.FRAME];
	const PORT_TYPES = Object.freeze({
		input: 'input',
		output: 'output',
		aux: 'aux',
		topAux: 'topAux',
		inputRelation: 'inputRelation',
		outputRelation: 'outputRelation'
	});
	const ACTIVATION_STATUS = Object.freeze({
		ACTIVE: 'Y',
		INACTIVE: 'N'
	});
	const PROPERTY_TYPES = Object.freeze({
		DOCUMENT: 'document'
	});
	const SHARED_TOAST_TYPES = Object.freeze({
		WARNING: 'warning'
	});
	const COMPLEX_NODE_PORT_LABELS = Object.freeze({
		inputRule: 'G',
		outputRule: 'E',
		relation: 'NG',
		aux: 'T'
	});
	const BX_FLAG_NO = 'N';

	const validationInputOutputRule = newConnection => {
		const {
			type: sourceType
		} = newConnection.sourcePort;
		const {
			type: targetType
		} = newConnection.targetPort;
		const isSourcePortInputOrOutput = sourceType === PORT_TYPES.input || sourceType === PORT_TYPES.output;
		const isTargetPortInputOrOutput = targetType === PORT_TYPES.input || targetType === PORT_TYPES.output;
		return isSourcePortInputOrOutput && isTargetPortInputOrOutput && sourceType !== targetType;
	};
	const validationAuxRule = newConnection => {
		const {
			type: sourceType
		} = newConnection.sourcePort;
		const {
			type: targetType
		} = newConnection.targetPort;
		const isSourcePortInputOrOutput = sourceType === PORT_TYPES.aux || sourceType === PORT_TYPES.topAux;
		const isTargetPortInputOrOutput = targetType === PORT_TYPES.aux || targetType === PORT_TYPES.topAux;
		return isSourcePortInputOrOutput && isTargetPortInputOrOutput && sourceType !== targetType;
	};

	const AUX = 'aux';
	function normalyzeInputOutputConnection(newConnection) {
		const {
			id,
			sourceBlockId,
			sourcePortId,
			sourcePort,
			targetBlockId,
			targetPortId
		} = newConnection;
		if (sourcePort.type === PORT_TYPES.output) {
			return {
				id,
				sourceBlockId,
				sourcePortId,
				targetBlockId,
				targetPortId
			};
		}
		return {
			id,
			sourceBlockId: targetBlockId,
			sourcePortId: targetPortId,
			targetBlockId: sourceBlockId,
			targetPortId: sourcePortId
		};
	}
	function normalyzeAuxConnection(newConnection) {
		const {
			id,
			sourceBlockId,
			sourcePortId,
			sourcePort,
			targetBlockId,
			targetPortId
		} = newConnection;
		if (sourcePort.type === PORT_TYPES.aux) {
			return {
				id,
				sourceBlockId,
				sourcePortId,
				targetBlockId,
				targetPortId,
				type: AUX
			};
		}
		return {
			id,
			sourceBlockId: targetBlockId,
			sourcePortId: targetPortId,
			targetBlockId: sourceBlockId,
			targetPortId: sourcePortId,
			type: AUX
		};
	}

	function addActivityIdsToSet(activity, activityIds) {
		if (!main_core.Type.isObject(activity)) {
			return;
		}
		if (main_core.Type.isStringFilled(activity?.Name)) {
			activityIds.add(activity.Name);
		}
		if (main_core.Type.isArrayFilled(activity?.Children)) {
			activity.Children.forEach(child => addActivityIdsToSet(child, activityIds));
		}
	}
	function cloneBLocksWithNewIds(target) {
		const {
			blocks
		} = target;
		const activityIds = findBlocksIds(blocks);
		const replaceMap = makeReplaceMap(activityIds);
		return cloneAndReplaceBlocksActivityIds(target, replaceMap);
	}
	function findBlocksIds(blocks) {
		const activityIds = new Set();
		blocks.forEach(block => {
			if (main_core.Type.isStringFilled(block?.id)) {
				activityIds.add(block.id);
			}
			addActivityIdsToSet(block?.activity, activityIds);
		});
		return activityIds;
	}
	function makeReplaceMap(activityIds) {
		const replaceMap = new Map();
		activityIds.forEach(id => {
			replaceMap.set(id, createUniqueId());
		});
		return replaceMap;
	}
	function cloneAndReplaceBlocksActivityIds(target, replaceMap) {
		let serialized = JSON.stringify(target);
		for (const [pattern, replacement] of replaceMap.entries()) {
			serialized = serialized.replaceAll(`"${pattern}"`, `"${replacement}"`);
		}
		return JSON.parse(serialized);
	}

	const BLOCK_TYPES = {
		SetupTemplateActivity: 'SetupTemplateActivity'
	};
	const diagramStore = ui_vue3_pinia.defineStore('bizprocdesigner-editor-diagram', {
		state: () => ({
			templateId: 0,
			draftId: 0,
			documentType: [],
			documentTypeSigned: '',
			companyName: '',
			template: {},
			blocks: [],
			connections: [],
			isOnline: true,
			blockCurrentTimestamps: {},
			blockSavedTimestamps: {},
			blockCurrentPublishErrors: {},
			connectionCurrentTimestamps: {},
			connectionSavedTimestamps: {},
			templatePublishStatus: TEMPLATE_PUBLISH_STATUSES.MAIN
		}),
		getters: {
			diagramData: state => ({
				templateId: state.templateId,
				draftId: state.draftId,
				documentType: state.documentType,
				documentTypeSigned: state.documentTypeSigned,
				companyName: state.companyName,
				template: state.template,
				blocks: state.blocks,
				connections: state.connections,
				isOnline: state.isOnline,
				blockCurrentTimestamps: state.blockCurrentTimestamps,
				blockSavedTimestamps: state.blockSavedTimestamps,
				connectionCurrentTimestamps: state.connectionCurrentTimestamps,
				connectionSavedTimestamps: state.connectionSavedTimestamps
			})
		},
		actions: {
			initEventListeners() {
				main_core_events.EventEmitter.subscribe('Bizproc:onConstantsUpdated', this.updateTemplateConstants.bind(this));
			},
			getBlockAncestors(block) {
				const inputs = this.getInputConnections(block);
				return inputs.map(connection => this.blocks.find(b => b.id === connection.sourceBlockId));
			},
			getBlockAncestorsByInputPortId(block, portId) {
				return this.getInputConnections(block).filter(connection => connection.targetPortId === portId).map(connection => this.blocks.find(b => b.id === connection.sourceBlockId));
			},
			getInputConnections(block) {
				return this.connections.filter(connection => connection.targetBlockId === block.id);
			},
			getAllBlockAncestors(block, targetPortId) {
				const stack = [];
				const blocks = new Map([[block.id, block]]);
				let inputs = this.getInputConnections(block);
				if (targetPortId) {
					inputs = inputs.filter(connection => connection.targetPortId === targetPortId);
				}
				stack.push(...inputs);
				while (stack.length > 0) {
					const connection = stack.shift();
					this.blocks.filter(b => b.id === connection.sourceBlockId).forEach(b => {
						if (!blocks.has(b.id)) {
							blocks.set(b.id, b);
							stack.push(...this.getInputConnections(b));
						}
					});
				}
				blocks.delete(block.id);
				return [...blocks.values()];
			},
			async refreshDiagramData(params) {
				const diagramData = await editorAPI.getDiagramData(params);
				this.templateId = diagramData?.templateId ?? 0;
				this.draftId = diagramData?.draftId ?? 0;
				this.companyName = diagramData?.companyName ?? '';
				this.documentType = diagramData?.documentType ?? [];
				this.documentTypeSigned = diagramData?.documentTypeSigned ?? '';
				this.template = diagramData?.template ?? {};
				this.blocks = diagramData?.blocks ?? [];
				this.connections = diagramData?.connections ?? [];
				const now = Date.now();
				for (const block of this.blocks) {
					this.blockCurrentTimestamps[block.id] = block.node.updated ?? now;
				}
				for (const block of diagramData.publishedBlocks) {
					this.blockSavedTimestamps[block.id] = block.node.published ?? now;
				}
				for (const connection of this.connections) {
					this.connectionCurrentTimestamps[connection.id] = connection.createdAt ?? now;
				}
				for (const connection of diagramData.publishedConnection) {
					this.connectionSavedTimestamps[connection.id] = connection.createdAt ?? now;
				}
			},
			getDeleteHandlerForBlockType(blockType) {
				if (blockType === BLOCK_TYPES.SetupTemplateActivity) {
					return this.handleDeletingConstants;
				}
				return null;
			},
			handleDeletingConstants(block) {
				const rawConstants = block.activity?.Properties?.blocks;
				const constants = this.template?.CONSTANTS;
				if (!constants) {
					return;
				}
				const items = parseItemsFromBlocksJson(rawConstants);
				items.filter(item => item?.itemType === 'constant' && item.id in constants).forEach(item => {
					delete constants[item.id];
				});
			},
			deleteConnectionByBlockIdAndPortId(blockId, portId) {
				this.connections = this.connections.filter(connection => {
					const {
						sourceBlockId,
						sourcePortId,
						targetBlockId,
						targetPortId
					} = connection;
					const isSource = sourceBlockId === blockId && sourcePortId === portId;
					const isTarget = targetBlockId === blockId && targetPortId === portId;
					return !isSource && !isTarget;
				});
			},
			deleteBlockById(blockId) {
				const blockIndex = this.blocks.findIndex(block => block.id === blockId);
				if (blockIndex === -1) {
					return;
				}
				const blockToDelete = this.blocks[blockIndex];
				const blockType = blockToDelete.activity?.Type;
				const handler = this.getDeleteHandlerForBlockType(blockType);
				if (handler) {
					handler.call(this, blockToDelete);
				}
				Object.values(this.blocks[blockIndex].ports).filter(ports => main_core.Type.isArray(ports)).forEach(ports => {
					ports.forEach(({
						id
					}) => {
						this.deleteConnectionByBlockIdAndPortId(blockId, id);
					});
				});
				this.blocks.splice(blockIndex, 1);
				delete this.blockCurrentTimestamps[blockId];
			},
			setBlockCurrentTimestamp(block) {
				this.blockCurrentTimestamps[block.id] = Date.now();
			},
			setConnectionCurrentTimestamp(connectionId) {
				this.connectionCurrentTimestamps[connectionId] = Date.now();
			},
			updateBlockActivityField(id, activity) {
				const block = this.blocks.find(b => b.id === id);
				if (block) {
					block.activity = activity;
				}
				this.updateBlockTimestamp(block);
				this.clearBlockErrorStatus(id);
			},
			updateBlockId(oldId, newId) {
				if (oldId === newId) {
					return;
				}
				const block = this.blocks.find(b => b.id === oldId);
				if (block) {
					this.blockCurrentTimestamps[newId] = this.blockCurrentTimestamps[block.id];
					this.blockSavedTimestamps[newId] = this.blockSavedTimestamps[block.id];
					delete this.blockCurrentTimestamps[block.id];
					delete this.blockSavedTimestamps[block.id];
					block.id = newId;
				}
				this.connections.forEach((connection, index) => {
					let updated = false;
					if (connection.sourceBlockId === oldId) {
						this.connections[index].sourceBlockId = newId;
						updated = true;
					}
					if (connection.targetBlockId === oldId) {
						this.connections[index].targetBlockId = newId;
						updated = true;
					}
					if (updated) {
						this.connections[index].id = `${this.connections[index].sourceBlockId}_${this.connections[index].targetBlockId}`;
					}
				});
			},
			setBlocks(blocks) {
				this.blocks = blocks;
			},
			setConnections(connections) {
				this.connections = connections;
			},
			setBlockUnpublished(needBlock) {
				const blockIndex = this.blocks.findIndex(block => block.id === needBlock.id);
				if (blockIndex === -1) {
					return;
				}
				this.blocks[blockIndex].node.publicationState = false;
			},
			setPorts(blockId, ports) {
				const block = this.blocks.find(b => b.id === blockId);
				if (!block) {
					return;
				}
				block.ports = ports;
			},
			async updateTemplateData(data) {
				await editorAPI.updateTemplateData({
					templateId: this.templateId,
					data
				});
			},
			async publicDraft() {
				const requestData = {
					...this.diagramData,
					blocks: this.blocks.map(block => ({
						...block,
						node: {
							...block.node,
							updated: this.blockCurrentTimestamps[block.id]
						}
					})),
					connections: this.connections.map(connection => ({
						...connection,
						createdAt: this.connectionCurrentTimestamps[connection.id]
					}))
				};
				const {
					templateDraftId
				} = await editorAPI.publicDiagramDataDraft(requestData);
				if (main_core.Type.isNumber(templateDraftId)) {
					this.draftId = templateDraftId;
				}
			},
			async publicTemplate() {
				const now = Date.now();
				const requestData = {
					...this.diagramData,
					blocks: this.blocks.map(block => ({
						...block,
						node: {
							...block.node,
							updated: now,
							published: now
						}
					})),
					connections: this.connections.map(connection => ({
						...connection,
						createdAt: this.connectionCurrentTimestamps[connection.id]
					}))
				};
				try {
					const {
						templateId
					} = await editorAPI.publicDiagramData(requestData);
					this.blockCurrentPublishErrors = {};
					if (main_core.Type.isNumber(templateId)) {
						this.blockSavedTimestamps = {
							...this.blockCurrentTimestamps
						};
						this.connectionSavedTimestamps = {
							...this.connectionCurrentTimestamps
						};
						this.templateId = templateId;
						this.draftId = 0;
					}
				} catch (e) {
					if (main_core.Type.isArrayFilled(e.data?.activityErrors)) {
						this.setBlocksErrorStatus(e.data.activityErrors);
					}
					throw e;
				}
			},
			setBlocksErrorStatus(activityErrors) {
				this.blockCurrentPublishErrors = {};
				activityErrors.forEach(error => {
					const {
						activityName,
						code
					} = error;
					if (!main_core.Type.isStringFilled(activityName)) {
						return;
					}
					this.blockCurrentPublishErrors[activityName] = {
						code
					};
				});
			},
			clearBlockErrorStatus(blockId) {
				delete this.blockCurrentPublishErrors[blockId];
			},
			updateStatus(isOnline) {
				this.isOnline = isOnline;
			},
			updateBlockTimestamp(block) {
				this.blockCurrentTimestamps[block.id] = Date.now();
			},
			setBlockCurrentTimestamps(blockCurrentTimestamps) {
				Object.keys(this.blockCurrentTimestamps).forEach(key => delete this.blockCurrentTimestamps[key]);
				Object.assign(this.blockCurrentTimestamps, blockCurrentTimestamps ?? {});
			},
			setConnectionCurrentTimestamps(connectionCurrentTimestamps) {
				Object.keys(this.connectionCurrentTimestamps).forEach(key => delete this.connectionCurrentTimestamps[key]);
				Object.assign(this.connectionCurrentTimestamps, connectionCurrentTimestamps ?? {});
			},
			setDiagramData(diagramData) {
				this.templateId = diagramData.templateId;
				this.documentType = diagramData.documentType;
				this.companyName = diagramData.companyName;
				this.template = diagramData.template;
				this.blocks = diagramData.blocks;
				this.connections = diagramData.connections;
			},
			updateExistedBlockProperties(newBlocks) {
				const currentBlockMap = getBlockMap(this.blocks);
				for (const newBlock of newBlocks) {
					const currentBlock = currentBlockMap.get(newBlock.id);
					if (currentBlock && currentBlock.activity && currentBlock.activity.Properties && isBlockPropertiesDifferent(currentBlock, newBlock)) {
						for (const [key] of Object.entries(newBlock.activity.Properties)) {
							currentBlock.activity.Properties[key] = newBlock.activity.Properties[key];
						}
						currentBlock.node.title = newBlock.node.title;
					}
				}
			},
			updateNodeTitle(blockId, title) {
				const block = this.blocks.find(b => b.id === blockId);
				if (!block) {
					return;
				}
				block.node.title = title;
			},
			updateTemplateConstants(event) {
				const {
					constantsToUpdate,
					deletedConstantIds
				} = event.getData();
				if (!this.template.CONSTANTS) {
					this.template.CONSTANTS = {};
				}
				let updatedConstants = {
					...this.template.CONSTANTS
				};
				if (main_core.Type.isArrayFilled(deletedConstantIds)) {
					for (const id of deletedConstantIds) {
						delete updatedConstants[id];
					}
				}
				updatedConstants = {
					...updatedConstants,
					...constantsToUpdate
				};
				this.template.CONSTANTS = updatedConstants;
			},
			setSizeAutosizedBlock(blockId, width, height) {
				const blockIndex = this.blocks.findIndex(block => block.id === blockId);
				if (blockIndex < 0) {
					return;
				}
				this.blocks[blockIndex].dimensions.width = width;
				this.blocks[blockIndex].dimensions.height = height;
			},
			async toggleBlockActivation(blockId, skipDraft = false) {
				const block = this.blocks.find(b => b.id === blockId);
				if (!block) {
					return;
				}
				const newActivatedState = block.activity.Activated === 'Y' ? 'N' : 'Y';
				const actionLabel = newActivatedState === 'N' ? main_core.Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_OFF') ?? '' : main_core.Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_ON') ?? '';
				const applyChanges = () => {
					block.activity.Activated = newActivatedState;
					this.updateBlockActivityField(blockId, block.activity);
					ui_notification.UI.Notification.Center.notify({
						content: actionLabel,
						autoHideDelay: 4000
					});
				};
				if (skipDraft) {
					applyChanges();
					return;
				}
				try {
					applyChanges();
					await this.publicDraft();
				} catch (error) {
					handleResponseError(error);
				}
			},
			updateBlockPublishStatus(block) {
				try {
					this.setBlockCurrentTimestamp(block);
					this.publicDraft();
					this.updateStatus(true);
				} catch {
					this.updateStatus(false);
				}
			},
			addBlock(block) {
				this.blocks.push(block);
			}
		}
	});

	const useBufferStore = ui_vue3_pinia.defineStore('bizprocdesigner-editor-buffer', {
		state: () => ({
			copied: null
		}),
		getters: {
			isBufferEmpty() {
				return this.copied === null;
			}
		},
		actions: {
			setBufferContent(content) {
				this.copied = JSON.parse(JSON.stringify(content));
			},
			getBufferContent() {
				if (!this.copied) {
					return null;
				}
				return cloneBLocksWithNewIds(this.copied);
			}
		}
	});

	// @vue/component
	const BlockDiagram$1 = {
		name: 'BlockDiagram',
		components: {
			UiBlockDiagram: ui_blockDiagram.BlockDiagram
		},
		props: {
			/** @type Array<Block> */
			blocks: {
				type: Array,
				default: () => []
			},
			/** @type Array<Connection> */
			connections: {
				type: Array,
				default: () => []
			},
			disabled: {
				type: Boolean,
				default: false
			},
			enableGrouping: {
				type: Boolean,
				default: false
			},
			/** @type Array<MenuItemOptions> */
			contextMenuItems: {
				type: Array,
				default: () => []
			}
		},
		emits: ['update:blocks', 'update:connections', 'blockTransitionEnd'],
		setup(props) {
			return {
				blockSlotNamesMap: BLOCK_SLOT_NAMES,
				connectionSlotNamesMap: CONNECTION_SLOT_NAMES
			};
		},
		computed: {
			blockSlotNames() {
				return Object.values(this.blockSlotNamesMap);
			},
			connectionSlotNames() {
				return Object.values(this.connectionSlotNamesMap);
			}
		},
		template: `
		<UiBlockDiagram
			:blocks="blocks"
			:connections="connections"
			:disabled="disabled"
			:enableGrouping="enableGrouping"
			:contextMenuItems="contextMenuItems"
			@update:blocks="$emit('update:blocks', $event)"
			@update:connections="$emit('update:connections', $event)"
			@blockTransitionEnd="$emit('blockTransitionEnd', $event)"
		>
			<template
				v-for="slotName in blockSlotNames"
				#[slotName]="{ block }"
			>
				<slot
					:name="slotName"
					:block="block"
				/>
			</template>

			<template
				v-for="slotName in connectionSlotNames"
				#[slotName]="{ connection }"
			>
				<slot
					:name="slotName"
					:connection="connection"
				/>
			</template>

			<template #group-selection-box>
				<slot name="group-selection-box"/>
			</template>
		</UiBlockDiagram>
	`
	};

	const BLOCK_CONTAINER_CLASS_NAMES = {
		base: 'editor-chart-block-container',
		highlighted: '--highlighted',
		deactivated: '--deactivated',
		hoverable: '--hoverable'};

	// @vue/component
	const BlockContainer = {
		name: 'BlockContainer',
		props: {
			/** @type Block */
			block: {
				type: Object,
				default: null
			},
			/** @type Array<MenuItemOptions> */
			contextMenuItems: {
				type: Array,
				default: () => []
			},
			width: {
				type: Number,
				default: null
			},
			height: {
				type: Number,
				default: null
			},
			highlighted: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			hoverable: {
				type: Boolean,
				default: true
			},
			backgroundColor: {
				type: String,
				default: null
			},
			borderColor: {
				type: String,
				default: null
			}
		},
		setup(props) {
			const {
				isOpen: isOpenContextMenu,
				showMenu,
				closeContextMenu
			} = ui_blockDiagram.useContextMenu();
			const isBlockActivated = ui_vue3.computed(() => {
				if (!props.block?.activity?.Activated) {
					return true;
				}
				return props.block.activity.Activated !== BX_FLAG_NO;
			});
			const blockContainerClassNames = ui_vue3.computed(() => ({
				[BLOCK_CONTAINER_CLASS_NAMES.base]: true,
				[BLOCK_CONTAINER_CLASS_NAMES.highlighted]: props.highlighted,
				[BLOCK_CONTAINER_CLASS_NAMES.deactivated]: !ui_vue3.toValue(isBlockActivated),
				[BLOCK_CONTAINER_CLASS_NAMES.hoverable]: props.hoverable
			}));
			const blockContainerStyle = ui_vue3.computed(() => {
				const style = {};
				if (props.width !== null) {
					style.width = `${props.width}px`;
				}
				if (props.height !== null) {
					style.height = `${props.height}px`;
				}
				if (props.backgroundColor !== null) {
					style.backgroundColor = props.backgroundColor;
				}
				if (props.borderColor !== null && !props.highlighted) {
					style.borderColor = props.borderColor;
				}
				return style;
			});
			function onShowContextMenu(event) {
				event.preventDefault();
				if (props.disabled) {
					return;
				}
				showMenu({
					clientX: event.clientX,
					clientY: event.clientY
				}, {
					items: props.contextMenuItems
				});
			}
			return {
				isOpenContextMenu,
				isBlockActivated,
				blockContainerClassNames,
				blockContainerStyle,
				onShowContextMenu,
				closeContextMenu
			};
		},
		template: `
		<div
			:class="blockContainerClassNames"
			:style="blockContainerStyle"
			@mousedown="closeContextMenu"
			@contextmenu.stop="onShowContextMenu"
		>
			<slot
				:isOpenContextMenu="isOpenContextMenu"
				:isBlockActivated="isBlockActivated"
			/>
		</div>
	`
	};

	const ICON_BUTTON_CLASS_NAMES = {
		base: 'editor-chart-icon-button',
		disabled: '--disabled'
	};
	const ICON_CLASS_NAMES$3 = {
		base: 'editor-chart-icon-button__icon',
		active: '--active'
	};

	// @vue/component
	const IconButton = {
		name: 'icon-button',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			iconName: {
				type: String,
				default: ''
			},
			size: {
				type: [Number, String],
				default: 18
			},
			color: {
				type: String,
				default: 'var(--ui-color-gray-60)'
			},
			active: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				size,
				active,
				disabled
			} = ui_vue3.toRefs(props);
			const iconButtonClassNames = ui_vue3.computed(() => ({
				[ICON_BUTTON_CLASS_NAMES.base]: true,
				[ICON_BUTTON_CLASS_NAMES.disabled]: ui_vue3.toValue(disabled)
			}));
			const iconButtonStyle = ui_vue3.computed(() => ({
				width: `${ui_vue3.toValue(size)}px`,
				height: `${ui_vue3.toValue(size)}px`
			}));
			const iconClassNames = ui_vue3.computed(() => ({
				[ICON_CLASS_NAMES$3.base]: true,
				[ICON_CLASS_NAMES$3.active]: ui_vue3.toValue(active)
			}));
			return {
				iconButtonClassNames,
				iconButtonStyle,
				iconClassNames
			};
		},
		template: `
		<button
			:class="iconButtonClassNames"
			:style="iconButtonStyle"
		>
			<slot>
				<BIcon
					:class="iconClassNames"
					:name="iconName"
					:color="color"
					:size="size"
				/>
			</slot>
		</button>
	`
	};

	// @vue/component
	const IconDivider = {
		name: 'icon-divider',
		props: {
			size: {
				type: [Number, String],
				default: 16
			},
			color: {
				type: String,
				default: 'var(--ui-color-gray-20)'
			}
		},
		setup(props) {
			const {
				size,
				color
			} = ui_vue3.toRefs(props);
			const containerStyle = ui_vue3.computed(() => ({
				height: `${ui_vue3.toValue(size)}px`
			}));
			const lineStyle = ui_vue3.computed(() => ({
				height: `${Math.round(ui_vue3.toValue(size) / 2)}px`,
				background: ui_vue3.toValue(color)
			}));
			return {
				containerStyle,
				lineStyle
			};
		},
		template: `
		<div
			class="ui-block-diagram-icon-divider"
			:style="containerStyle"
		>
			<div
				class="ui-block-diagram-icon-divider-line"
				:style="lineStyle"
			/>
		</div>
	`
	};

	const LOADER_TYPE = 'BULLET';

	// @vue/component
	const Loader = {
		name: 'EditorChartLoader',
		mounted() {
			this.loader = new ui_loader.Loader({
				target: this.$refs['editor-chart-loader'],
				type: LOADER_TYPE
			});
			this.loader.render();
			this.loader.show();
		},
		beforeUnmount() {
			this.loader.hide();
			this.loader = null;
		},
		template: `
		<div ref="editor-chart-loader"></div>
	`
	};

	// @vue/component
	const MenuButton = {
		name: 'ui-top-panel-menu-button',
		components: {
			UiButton: ui_vue3_components_button.Button,
			BMenu: ui_vue3_components_menu.BMenu
		},
		props: {
			text: {
				type: String,
				default: null
			},
			icon: {
				type: String,
				default: null
			},
			buttonStyle: {
				type: String,
				default: null
			},
			/** @type MenuOptions */
			options: {
				type: {},
				default: () => ({})
			}
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			menuOptions() {
				return {
					bindElement: this.$refs.button.button.button,
					autoHide: true,
					offsetLeft: this.$refs.button.button.button.offsetWidth / 2 - 120,
					width: 240,
					...this.options
				};
			}
		},
		template: `
		<UiButton
			:text="text"
			:leftIcon="icon"
			:style="buttonStyle"
			ref="button"
			@click="isMenuShown = true"
		/>
		<BMenu
			v-if="isMenuShown"
			:options="menuOptions"
			@close="isMenuShown = false"
		/>
	`
	};

	// @vue/component
	const SplitButton = {
		name: 'split-button',
		props: {
			id: {
				type: String,
				default: ''
			},
			text: {
				type: String,
				default: ''
			},
			icon: {
				type: String,
				default: null
			},
			style: {
				type: String,
				default: null
			},
			loading: Boolean
		},
		emits: ['click', 'mainClick', 'menuClick'],
		data() {
			return {
				isMounted: false
			};
		},
		watch: {
			icon(icon) {
				const classes = this.button.getContainer().classList;
				classes.forEach(className => {
					if (className.startsWith('ui-btn-icon-')) {
						main_core.Dom.removeClass(this.button.getContainer(), className);
					}
				});
				if (icon && !icon.startsWith('ui-btn-icon')) {
					main_core.Dom.addClass(this.button.getContainer(), '--with-icon');
					return;
				}
				this.button.setProperty('icon', icon, ui_vue3_components_button.ButtonIcon);
				main_core.Dom.removeClass(this.button.getContainer(), '--with-icon');
				main_core.Dom.toggleClass(this.button.getContainer(), ['ui-icon-set__scope', icon], Boolean(icon));
			},
			loading: {
				handler(loading) {
					if (loading !== this.button?.isWaiting()) {
						this.button?.setWaiting(loading);
					}
				},
				immediate: true
			},
			style(style) {
				this.button.setStyle(style);
			}
		},
		created() {
			const button = new ui_buttons.SplitButton({
				id: this.id,
				text: this.text,
				useAirDesign: true,
				style: this.style,
				onclick: () => {
					this.$emit('click');
				},
				mainButton: {
					onclick: () => {
						this.$emit('mainClick');
					}
				},
				menuButton: {
					onclick: () => {
						this.$emit('menuClick');
					}
				}
			});
			if (this.icon) {
				button.addClass(`${this.icon} ui-icon-set__scope --with-left-icon`);
			}
			this.button = button;
		},
		mounted() {
			const button = this.button?.render();
			this.$refs.button.after(button);
			this.isMounted = true;
		},
		unmounted() {
			this.button?.getContainer()?.remove();
		},
		template: `
		<button v-if="!isMounted" ref="button"></button>
	`
	};

	const BLOCK_LAYOUT_CLASS_NAMES = {
		base: 'editor-chart-block-layout',
		hoverable: '--hoverable',
		openedMenu: '--opened-menu'
	};
	const TOP_MENU_CLASS_NAMES = {
		base: 'editor-chart-block-layout__top-menu',
		show: '--show',
		hide: '--hide'
	};
	const STATUS_CLASS_NAMES = {
		base: 'editor-chart-block-layout__status',
		hide: '--hide'
	};
	const CONTENT_CLASS_NAMES$1 = {
		base: 'editor-chart-block-layout__content',
		hasHeader: '--has-header'
	};
	const BLOCK_LAYOUT_SLOT_NAMES = {
		TOP_MENU_TITLE: 'top-menu-title',
		TOP_MENU: 'top-menu',
		HEADER: 'header',
		DEFAULT: 'default',
		LEFT: 'left',
		STATUS: 'status'
	};

	// @vue/component
	const BlockLayout = {
		name: 'block-layout',
		components: {
			IconButton
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			showTopMenu: {
				type: Boolean,
				default: false
			},
			dragged: {
				type: Boolean,
				default: false
			},
			resized: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			isActivationVisible: {
				type: Boolean,
				default: true
			},
			hoverable: {
				type: Boolean,
				default: true
			}
		},
		setup(props, ctx) {
			const slots = ui_vue3.useSlots();
			const {
				highlitedBlockIds,
				isSelectionActive
			} = ui_blockDiagram.useBlockDiagram();
			const isGroupSelected = ui_vue3.computed(() => {
				return (ui_vue3.toValue(highlitedBlockIds) || []).length > 1;
			});
			const blockLayoutClassNames = ui_vue3.computed(() => {
				const isHoverEnabled = props.hoverable && !ui_vue3.toValue(isSelectionActive) && !isGroupSelected;
				return {
					[BLOCK_LAYOUT_CLASS_NAMES.base]: true,
					[BLOCK_LAYOUT_CLASS_NAMES.hoverable]: isHoverEnabled,
					[BLOCK_LAYOUT_CLASS_NAMES.openedMenu]: props.showTopMenu
				};
			});
			const topMenuClassNames = ui_vue3.computed(() => {
				const isMenuHidden = props.dragged || props.resized || ui_vue3.toValue(isSelectionActive) || ui_vue3.toValue(isGroupSelected);
				return {
					[TOP_MENU_CLASS_NAMES.base]: true,
					[TOP_MENU_CLASS_NAMES.show]: props.showTopMenu,
					[TOP_MENU_CLASS_NAMES.hide]: isMenuHidden
				};
			});
			const statusClassNames = ui_vue3.computed(() => ({
				[STATUS_CLASS_NAMES.base]: true,
				[STATUS_CLASS_NAMES.hide]: props.dragged || props.resized || !slots.status
			}));
			const contentClassNames = ui_vue3.computed(() => {
				return {
					[CONTENT_CLASS_NAMES$1.base]: true,
					[CONTENT_CLASS_NAMES$1.hasHeader]: ctx.slots.header
				};
			});
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				slotNames: BLOCK_LAYOUT_SLOT_NAMES,
				blockLayoutClassNames,
				topMenuClassNames,
				statusClassNames,
				contentClassNames
			};
		},
		template: `
		<div
			:class="blockLayoutClassNames"
			ref="editorBlockMenu"
		>
			<div 
				:class="topMenuClassNames"
				@mousedown.stop
			>
				<div
					v-if="!disabled"
					class="editor-chart-block-layout__top-menu-title"
				>
					<slot name="top-menu-title"/>
				</div>
				<div
					v-if="!disabled"
					class="editor-chart-block-layout__top-menu-content">
					<slot
						name="top-menu"
					/>
				</div>
			</div>
			<div
				v-if="$slots.header"
				class="editor-chart-block-layout__header"
			>
				<slot name="header"/>
			</div>
			<div
				v-if="$slots.default"
				:class="contentClassNames"
			>
				<slot/>
			</div>
			<div
				v-if="$slots.left"
				class="editor-chart-block-layout__left-content"
			>
				<slot name="left"/>
			</div>
			<div :class="statusClassNames">
				<slot name="status"/>
			</div>
		</div>
	`
	};

	const BLOCK_SWITCHER_CLASS_NAMES = {
		base: 'editor-chart-block-switcher',
		on: 'editor-chart-block-switcher__on'
	};
	const ICON_CLASS_NAMES$2 = {
		base: 'editor-chart-block-switcher__icon',
		on: '--on'
	};
	const SWITCHER_LABEL_ON = 'on';
	const SWITCHER_LABEL_OFF = 'off';

	// @vue/component
	const BlockSwitcher = {
		name: 'block-switcher',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			on: {
				type: Boolean,
				default: true
			}
		},
		emits: ['click'],
		setup(props, {
			emit
		}) {
			const blockSwitcherClassNames = ui_vue3.computed(() => ({
				[BLOCK_SWITCHER_CLASS_NAMES.base]: true,
				[BLOCK_SWITCHER_CLASS_NAMES.on]: props.on
			}));
			const iconClassNames = ui_vue3.computed(() => ({
				[ICON_CLASS_NAMES$2.base]: true,
				[ICON_CLASS_NAMES$2.on]: props.on
			}));
			const switcherLabel = ui_vue3.computed(() => {
				return props.on ? SWITCHER_LABEL_ON : SWITCHER_LABEL_OFF;
			});
			const handleClick = () => {
				emit('click');
			};
			return {
				blockSwitcherClassNames,
				iconClassNames,
				switcherLabel,
				handleClick
			};
		},
		template: `
		<div
			:class="blockSwitcherClassNames"
			@click="handleClick"
		>
			<BIcon
				:class="iconClassNames"
				:size="14"
				name="o-power" 
			/>
			<div class="editor-chart-block-switcher__label-wrap">
				<p class="editor-chart-block-switcher__label">
					{{ switcherLabel }}
				</p>
			</div>
		</div>
	`
	};

	const BLOCK_HEADER_CLASS_NAMES = {
		base: 'editor-chart-block-header',
		deactivated: '--deactivated'
	};

	// @vue/component
	const BlockHeader = {
		name: 'block-header',
		props: {
			block: {
				type: Object,
				required: true
			},
			subIconExternal: {
				type: Boolean,
				default: false
			},
			title: {
				type: String,
				default: ''
			},
			deactivated: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			blockHeaderClassNames() {
				return {
					[BLOCK_HEADER_CLASS_NAMES.base]: true,
					[BLOCK_HEADER_CLASS_NAMES.deactivated]: this.deactivated
				};
			}
		},
		template: `
		<div :class="blockHeaderClassNames">
			<div class="editor-chart-block-header__icon-wrapper">
				<slot name="icon"/>
			</div>

			<template v-if="$slots.subIcon">
				<span class="editor-chart-block-header__divider" aria-hidden="true"></span>
				<div :class="[
						'editor-chart-block-header__icon-wrapper',
						'editor-chart-block-header__icon-wrapper--sub',
						{ 'editor-chart-block-header__icon-wrapper--sub-external': subIconExternal }
					]">
					<slot name="subIcon"/>
				</div>
			</template>

			<p class="editor-chart-block-header__title">{{ title || block.node?.title }}</p>
		</div>
	`
	};

	const ICON_CLASS_NAMES$1 = {
		base: 'editor-chart-block-icon',
		deactivated: '--deactivated'
	};
	const ICON_BG_COLOR_CLASS_NAMES = {
		bgColor_1: '--background-color-1',
		bgColor_2: '--background-color-2',
		bgColor_3: '--background-color-3',
		bgColor_4: '--background-color-4',
		bgColor_5: '--background-color-5',
		bgColor_6: '--background-color-6',
		bgColor_7: '--background-color-7',
		bgColor_8: '--background-color-8'
	};
	const ICON_COLORS$2 = {
		0: 'var(--designer-bp-ai-icons)',
		1: 'var(--designer-bp-entities-icons)',
		2: 'var(--designer-bp-employe-icons)',
		3: 'var(--designer-bp-technical-icons)',
		4: 'var(--designer-bp-communication-icons)',
		5: 'var(--designer-bp-storage-icons)',
		6: 'var(--designer-bp-afiliate-icons)',
		7: 'var(--ui-color-palette-white-base)',
		8: 'var(--ui-color-palette-white-base)'
	};
	const DEFAULT_ICON_NAME$2 = ui_iconSet_api_vue.Outline.FILE;

	// @vue/component
	const BlockIcon = {
		name: 'block-icon',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			iconName: {
				type: String,
				default: DEFAULT_ICON_NAME$2
			},
			iconColorIndex: {
				type: Number,
				default: 0
			},
			customColor: {
				type: String,
				default: null
			},
			iconSize: {
				type: Number,
				default: 32
			},
			deactivated: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const iconSet = ui_iconSet_api_vue.Outline;
			const iconClassNames = ui_vue3.computed(() => {
				const bgColorClassNamesMap = Object.keys(ICON_BG_COLOR_CLASS_NAMES).reduce((bgColorMap, key, index) => {
					return {
						...bgColorMap,
						[ICON_BG_COLOR_CLASS_NAMES[key]]: props.iconColorIndex === index && !props.deactivated
					};
				}, {});
				return {
					[ICON_CLASS_NAMES$1.base]: true,
					[ICON_CLASS_NAMES$1.deactivated]: props.deactivated,
					...bgColorClassNamesMap
				};
			});
			function getIconName(name) {
				if (name && Object.prototype.hasOwnProperty.call(iconSet, name)) {
					return iconSet[name];
				}
				return DEFAULT_ICON_NAME$2;
			}
			function getIconColor(colorIndex) {
				if (colorIndex !== false && ICON_COLORS$2[colorIndex]) {
					return ICON_COLORS$2[colorIndex];
				}
				return null;
			}
			return {
				iconClassNames,
				getIconName,
				getIconColor
			};
		},
		template: `
		<div :class="iconClassNames">
			<BIcon
				:name="getIconName(iconName)" 
				:size="iconSize"
				:color="customColor || getIconColor(iconColorIndex)"
				class="editor-chart-block-icon__icon"
			/>
		</div>
	`
	};

	const CONTENT_CLASS_NAMES = {
		base: 'editor-chart-block-content',
		deactivated: '--deactivated'
	};
	const CONTENT_BG_COLORS_CLASS_NAMES = {
		bgColor_1: '--background-color-1',
		bgColor_2: '--background-color-2',
		bgColor_3: '--background-color-3',
		bgColor_4: '--background-color-4',
		bgColor_5: '--background-color-5',
		bgColor_6: '--background-color-6',
		bgColor_7: '--background-color-7',
		bgColor_8: '--background-color-8'
	};
	const BlockContent = {
		name: 'BlockContent',
		props: {
			colorIndex: {
				type: Number,
				default: null
			},
			deactivated: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			contentClassName() {
				const bgColorsClassNames = Object.keys(CONTENT_BG_COLORS_CLASS_NAMES).reduce((colorsMap, colorKey, index) => {
					return {
						...colorsMap,
						[CONTENT_BG_COLORS_CLASS_NAMES[colorKey]]: this.colorIndex === index && !this.deactivated
					};
				}, {});
				return {
					[CONTENT_CLASS_NAMES.base]: true,
					[CONTENT_CLASS_NAMES.deactivated]: this.deactivated,
					...bgColorsClassNames
				};
			}
		},
		template: `
		<div :class="contentClassName">
			<slot/>
		</div>
	`
	};

	const PortsGrid = {
		name: 'PortsGrid',
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			leftTypes: {
				type: [Array, String],
				default: () => []
			},
			rightTypes: {
				type: [Array, String],
				default: () => []
			}
		},
		computed: {
			portsMap() {
				return this.block.ports.reduce((portsMap, port) => {
					if (portsMap.has(port.type)) {
						portsMap.get(port.type).push(port);
					} else {
						portsMap.set(port.type, [port]);
					}
					return portsMap;
				}, new Map());
			},
			leftPorts() {
				if (main_core.Type.isArray(this.leftTypes)) {
					return this.leftTypes.reduce((accPorts, portType) => {
						if (this.portsMap.has(portType)) {
							accPorts.push(...this.portsMap.get(portType));
						}
						return accPorts;
					}, []);
				}
				return this.portsMap.get(this.leftTypes) ?? [];
			},
			rightPorts() {
				if (main_core.Type.isArray(this.rightTypes)) {
					return this.rightTypes.reduce((accPorts, portType) => {
						if (this.portsMap.has(portType)) {
							accPorts.push(...this.portsMap.get(portType));
						}
						return accPorts;
					}, []);
				}
				return this.portsMap.get(this.rightTypes) ?? [];
			}
		},
		template: `
		<div class="editor-chart-ports-grid">
			<div class="editor-chart-ports-grid__column">
				<div
					v-for="(port, index) in leftPorts"
					:key="port.id"
					class="editor-chart-ports-grid__line"
				>
					<div class="editor-chart-ports-grid__port-wrap --left">
						<slot
							:port="port"
							:index="index"
							name="portLeft"
						/>
					</div>
					<p class="editor-chart-ports-grid__port-title --left">{{ port.title }}</p>
				</div>
			</div>
			<div class="editor-chart-ports-grid__column">
				<div
					v-for="(port, index) in rightPorts"
					:key="port.id"
					class="editor-chart-ports-grid__line"
				>
					<div class="editor-chart-ports-grid__port-wrap --right">
						<slot
							:port="port"
							:index="index"
							name="portRight"
						/>
					</div>
					<p class="editor-chart-ports-grid__port-title --right">{{ port.title }}</p>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const PortsLayout = {
		name: 'PortsLayout',
		components: {
			Port: ui_blockDiagram.Port
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			topPortTypes: {
				type: [Array, String],
				default: () => []
			},
			bottomPortTypes: {
				type: [Array, String],
				default: () => []
			},
			leftPortTypes: {
				type: [Array, String],
				default: () => []
			},
			rightPortTypes: {
				type: [Array, String],
				default: () => []
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				validationInputOutputRule,
				normalyzeInputOutputConnection,
				validationAuxRule,
				normalyzeAuxConnection
			};
		},
		computed: {
			portsMap() {
				return this.block.ports.reduce((portsMap, port) => {
					if (portsMap.has(port.type)) {
						portsMap.get(port.type).push(port);
					} else {
						portsMap.set(port.type, [port]);
					}
					return portsMap;
				}, new Map());
			},
			topPorts() {
				if (main_core.Type.isArray(this.topPortTypes)) {
					return this.topPortTypes.reduce((accPorts, portType) => {
						if (this.portsMap.has(portType)) {
							accPorts.push(...this.portsMap.get(portType));
						}
						return accPorts;
					}, []);
				}
				return this.portsMap.get(this.topPortTypes) ?? [];
			},
			hasTopPorts() {
				return this.topPorts.length > 0;
			},
			bottomPorts() {
				if (main_core.Type.isArray(this.bottomPortTypes)) {
					return this.bottomPortTypes.reduce((accPorts, portType) => {
						if (this.portsMap.has(portType)) {
							accPorts.push(...this.portsMap.get(portType));
						}
						return accPorts;
					}, []);
				}
				return this.portsMap.get(this.bottomPortTypes) ?? [];
			},
			hasBottomPorts() {
				return this.bottomPorts.length > 0;
			},
			leftPorts() {
				if (main_core.Type.isArray(this.leftPortTypes)) {
					return this.leftPortTypes.reduce((accPorts, portType) => {
						if (this.portsMap.has(portType)) {
							accPorts.push(...this.portsMap.get(portType));
						}
						return accPorts;
					}, []);
				}
				return this.portsMap.get(this.leftPortTypes) ?? [];
			},
			hasLeftPorts() {
				return this.leftPorts.length > 0;
			},
			rightPorts() {
				if (main_core.Type.isArray(this.rightPortTypes)) {
					return this.rightPortTypes.reduce((accPorts, portType) => {
						if (this.portsMap.has(portType)) {
							accPorts.push(...this.portsMap.get(portType));
						}
						return accPorts;
					}, []);
				}
				return this.portsMap.get(this.rightPortTypes) ?? [];
			},
			hasRightPorts() {
				return this.rightPorts.length > 0;
			}
		},
		template: `
		<div class="editor-chart-ports-inout-center">
			<slot/>

			<div
				v-if="hasTopPorts"
				class="editor-chart-ports-inout-center__ports-container --top"
			>
				<div
					v-for="(topPort, index) in topPorts"
					:key="topPort.id"
					class="editor-chart-ports-inout-center__port-wrap"
				>
					<slot
						:port="topPort"
						:index="index"
						name="top"
					>
						<Port
							:block="block"
							:port="topPort"
							:disabled="disabled"
							:styled="false"
							:validationRules="[validationInputOutputRule]"
							:normalyzeConnectionFn="normalyzeInputOutputConnection"
							:index="index"
							position="top"
						/>
					</slot>
				</div>
			</div>

			<div
				v-if="hasBottomPorts"
				class="editor-chart-ports-inout-center__ports-container --bottom"
			>
				<div
					v-for="(bottomPort, index) in bottomPorts"
					:key="bottomPort.id"
					class="editor-chart-ports-inout-center__port-wrap"
				>
					<slot
						:port="bottomPort"
						:index="index"
						name="bottom"
					>
						<Port
							:block="block"
							:port="bottomPort"
							:disabled="disabled"
							:styled="false"
							:validationRules="[validationInputOutputRule]"
							:normalyzeConnectionFn="normalyzeInputOutputConnection"
							:index="index"
							position="bottom"
						/>
					</slot>
				</div>
			</div>

			<div
				v-if="hasLeftPorts"
				class="editor-chart-ports-inout-center__ports-container --left"
			>
				<div
					v-for="(leftPort, index) in leftPorts"
					:key="leftPort.id"
					class="editor-chart-ports-inout-center__port-wrap"
				>
					<slot
						:port="leftPort"
						:index="index"
						name="left"
					>
						<Port
							:block="block"
							:port="leftPort"
							:disabled="disabled"
							:styled="false"
							:validationRules="[validationInputOutputRule]"
							:normalyzeConnectionFn="normalyzeInputOutputConnection"
							:index="index"
							position="left"
						/>
					</slot>
				</div>
			</div>


			<div
				v-if="hasRightPorts"
				class="editor-chart-ports-inout-center__ports-container --right"
			>
				<div
					v-for="(rightPort, index) in rightPorts"
					:key="rightPort.id"
					class="editor-chart-ports-inout-center__port-wrap"
				>
					<slot
						:port="rightPort"
						:index="index"
						name="right"
					>
						<Port
							:block="block"
							:port="rightPort"
							:disabled="disabled"
							:styled="false"
							:validationRules="[validationInputOutputRule]"
							:normalyzeConnectionFn="normalyzeInputOutputConnection"
							:index="index"
							position="right"
						/>
					</slot>
				</div>
			</div>
		</div>
	`
	};

	const PortInout = {
		name: 'PortInout',
		components: {
			Port: ui_blockDiagram.Port
		},
		props: {
			/** @type DiagramBlock */
			block: {
				type: Object,
				required: true
			},
			/** @type DiagramPort */
			port: {
				type: Object,
				required: true
			},
			/** @type DiagramPortPosition */
			position: {
				type: String,
				required: true,
				validator(position) {
					return Object.values(ui_blockDiagram.PORT_POSITION).includes(position);
				}
			},
			index: {
				type: Number,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				validationInputOutputRule,
				normalyzeInputOutputConnection
			};
		},
		template: `
		<Port
			:block="block"
			:port="port"
			:disabled="disabled"
			:validationRules="[validationInputOutputRule]"
			:normalyzeConnectionFn="normalyzeInputOutputConnection"
			:index="index"
			:position="position"
		/>
	`
	};

	const PORT_AUX_CLASS_NAMES = {
		base: 'editor-chart-port-aux',
		active: '--active',
		disabled: '--disabled',
		inactive: '--inactive'
	};
	const PortAux = {
		name: 'PortAux',
		components: {
			Port: ui_blockDiagram.Port
		},
		props: {
			/** @type DiagramBlock */
			block: {
				type: Object,
				required: true
			},
			/** @type DiagramPort */
			port: {
				type: Object,
				required: true
			},
			/** @type DiagramPortPosition */
			position: {
				type: String,
				required: true,
				validator(position) {
					return Object.values(ui_blockDiagram.PORT_POSITION).includes(position);
				}
			},
			index: {
				type: Number,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			inactive: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				SOURCE_PORT_STUB_SLOT_NAME: ui_blockDiagram.SOURCE_PORT_STUB_SLOT_NAME,
				TARGET_PORT_STUB_SLOT_NAME: ui_blockDiagram.TARGET_PORT_STUB_SLOT_NAME,
				validationAuxRule,
				normalyzeAuxConnection
			};
		},
		methods: {
			getPortAuxClassNames(isActive, isDisabled) {
				return {
					[PORT_AUX_CLASS_NAMES.base]: true,
					[PORT_AUX_CLASS_NAMES.active]: isActive,
					[PORT_AUX_CLASS_NAMES.disabled]: isDisabled,
					[PORT_AUX_CLASS_NAMES.inactive]: this.inactive
				};
			}
		},
		template: `
		<Port
			:block="block"
			:port="port"
			:disabled="disabled"
			:validationRules="[validationAuxRule]"
			:normalyzeConnectionFn="normalyzeAuxConnection"
			:index="index"
			:position="position"
		>
			<template #port="{ isActive, isDisabled }">
				<div :class="getPortAuxClassNames(isActive, isDisabled)"/>
			</template>

			<template #[SOURCE_PORT_STUB_SLOT_NAME]>
				<div class="editor-chart-port-aux__stub"/>
			</template>

			<template #[TARGET_PORT_STUB_SLOT_NAME]>
				<div class="editor-chart-port-aux__stub"/>
			</template>
		</Port>
	`
	};

	// @vue/component
	const BlockStatusNotPublished = {
		name: 'block-status-not-published',
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		template: `
		<p class="editor-chart-block-status-not-published">
			{{ getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_NOT_PUBLISHED_STATUS') }}
		</p>
	`
	};

	// @vue/component
	const BlockStatusPublishError = {
		name: 'BlockStatusPublishError',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline
		},
		template: `
		<div class="editor-chart-block-status-publish-error">
			<div class="editor-chart-block-status-publish-error__icon">
				<BIcon :name="Outline.ALERT_ACCENT" :size="16"/>
			</div>
			{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_PUBLISH_ERROR') }}
		</div>
	`
	};

	const NOT_REALLY_COMPLEX_BLOCK = new Set(['ForEachActivity', 'IfElseBranchActivity', 'IfElseActivity', 'WhileActivity', 'ApproveActivity', 'RequestInformationOptionalActivity', 'ListenActivity']);
	const MAX_AUX_COUNT$1 = 5;
	const MIN_RULE_ITEMS_COUNT = 5;
	const RESERVED_INPUT_RULES_TITLES = Array.from({
		length: MIN_RULE_ITEMS_COUNT
	}, (_, i) => {
		return `${COMPLEX_NODE_PORT_LABELS.inputRule}${i + 1}`;
	});
	const RESERVED_OUTPUT_RULES_TITLES = Array.from({
		length: MIN_RULE_ITEMS_COUNT
	}, (_, i) => {
		return `${COMPLEX_NODE_PORT_LABELS.outputRule}${i + 1}`;
	});
	const BLOCK_COMPLEX_CLASS_NAMES = {
		base: 'block-complex',
		deactivated: '--deactivated'
	};

	// @vue/component
	const BlockComplexContent = {
		name: 'BlockComplexContent',
		components: {
			BxText: ui_system_typography_vue.Text
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			/** @type Array<TPort> */
			ports: {
				type: Array,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			deactivated: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			const {
				updatePort,
				newConnection,
				addConnection
			} = ui_blockDiagram.useBlockDiagram();
			const {
				getMessage
			} = useLoc();
			const {
				isFeatureAvailable
			} = useFeature();
			return {
				updatePort,
				newConnection,
				addConnection,
				getMessage,
				isFeatureAvailable
			};
		},
		computed: {
			blockComplexClassNames() {
				return {
					[BLOCK_COMPLEX_CLASS_NAMES.base]: true,
					[BLOCK_COMPLEX_CLASS_NAMES.deactivated]: this.deactivated
				};
			},
			inputPorts() {
				return this.ports.filter(port => port.type === PORT_TYPES.input || port.type === PORT_TYPES.inputRelation);
			},
			outputPorts() {
				return this.ports.filter(port => port.type === PORT_TYPES.output);
			},
			rulePorts() {
				return this.ports.filter(port => port.type === PORT_TYPES.input);
			},
			relationPorts() {
				return this.ports.filter(port => port.type === PORT_TYPES.inputRelation);
			},
			inputPortsLength() {
				return this.inputPorts.length;
			},
			outputPortsLength() {
				return this.outputPorts.length;
			},
			auxPorts() {
				return this.block.ports.filter(port => port.type === PORT_TYPES.aux);
			},
			auxPortsLength() {
				return this.auxPorts.length;
			},
			auxPortItems() {
				if (this.block.node?.shouldShowAuxPorts !== true) {
					return [];
				}
				const realPorts = this.auxPorts;
				const items = [];
				for (let i = 1; i <= MAX_AUX_COUNT$1; i++) {
					const title = `${COMPLEX_NODE_PORT_LABELS.aux}${i}`;
					const port = realPorts.find(p => p.title === title);
					items.push(port ?? {
						id: createUniqueId(),
						title
					});
				}
				return items;
			},
			showRelationSection() {
				return this.isRelationFeatureAvailable && this.block.node?.shouldShowAuxPorts !== true;
			},
			showAuxSection() {
				return this.block.node?.shouldShowAuxPorts === true;
			},
			isRelationFeatureAvailable() {
				return this.isFeatureAvailable(bizprocdesigner_feature.FeatureCode.complexNodeConnections) && this.isReallyComplexBlock;
			},
			isReallyComplexBlock() {
				return !NOT_REALLY_COMPLEX_BLOCK.has(this.block.activity.Type);
			},
			reservedInputRules() {
				return RESERVED_INPUT_RULES_TITLES.map(title => {
					const port = this.rulePorts.find(p => p.title === title);
					if (port) {
						return port;
					}
					return {
						id: createUniqueId(),
						title
					};
				});
			},
			restInputRules() {
				return this.rulePorts.filter(p => {
					return !RESERVED_INPUT_RULES_TITLES.includes(p.title);
				});
			},
			lastInputRulePlaceholder() {
				let lastRule = null;
				if (this.restInputRules.length > 0) {
					lastRule = this.restInputRules[this.restInputRules.length - 1];
				} else if (this.reservedInputRules[this.reservedInputRules.length - 1].type) {
					lastRule = this.reservedInputRules[this.reservedInputRules.length - 1];
				}
				if (!lastRule) {
					return null;
				}
				const {
					label,
					id
				} = parsePortTitle(lastRule.title);
				const title = `${label}${id + 1}`;
				return {
					id: createUniqueId(),
					title
				};
			},
			allInputRules() {
				if (!this.isReallyComplexBlock) {
					return this.rulePorts;
				}
				return this.lastInputRulePlaceholder ? [...this.reservedInputRules, ...this.restInputRules, this.lastInputRulePlaceholder] : [...this.reservedInputRules, ...this.restInputRules];
			},
			relationPlaceholder() {
				const lastRelationPort = this.relationPorts[this.relationPorts.length - 1];
				const {
					label,
					id
				} = parsePortTitle(lastRelationPort?.title) ?? {
					label: COMPLEX_NODE_PORT_LABELS.relation,
					id: 0
				};
				const title = `${label}${id + 1}`;
				return {
					id: createUniqueId(),
					title
				};
			},
			reservedOutputRules() {
				return RESERVED_OUTPUT_RULES_TITLES.map(title => {
					const port = this.outputPorts.find(p => p.title === title);
					if (port) {
						return port;
					}
					return {
						id: createUniqueId(),
						title
					};
				});
			},
			restOutputRules() {
				return this.outputPorts.filter(p => {
					return !RESERVED_OUTPUT_RULES_TITLES.includes(p.title);
				});
			},
			lastOutputRulePlaceholder() {
				let lastRule = null;
				if (this.restOutputRules.length > 0) {
					lastRule = this.restOutputRules[this.restOutputRules.length - 1];
				} else if (this.reservedOutputRules[this.reservedOutputRules.length - 1].type) {
					lastRule = this.reservedOutputRules[this.reservedOutputRules.length - 1];
				}
				if (!lastRule) {
					return null;
				}
				const {
					label,
					id
				} = parsePortTitle(lastRule.title);
				const title = `${label}${id + 1}`;
				return {
					id: createUniqueId(),
					title
				};
			},
			allOutputRules() {
				if (!this.isReallyComplexBlock) {
					return this.outputPorts;
				}
				return this.lastOutputRulePlaceholder ? [...this.reservedOutputRules, ...this.restOutputRules, this.lastOutputRulePlaceholder] : [...this.reservedOutputRules, ...this.restOutputRules];
			},
			ruleTypes() {
				return [{
					id: 'input-rules',
					items: this.allInputRules,
					label: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE'),
					position: 'left'
				}, {
					id: 'output-rules',
					items: this.allOutputRules,
					label: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE'),
					position: 'right',
					classList: ['--right']
				}];
			}
		},
		watch: {
			inputPortsLength() {
				this.$nextTick(() => {
					this.inputPorts.forEach((port, index) => {
						this.updatePort(this.block.id, port.id, index);
					});
				});
			},
			outputPortsLength() {
				this.$nextTick(() => {
					this.outputPorts.forEach((port, index) => {
						this.updatePort(this.block.id, port.id, index);
					});
				});
			},
			inputPorts(newInputPorts, oldInputPorts) {
				if (!this.newConnection) {
					return;
				}
				const oldPortsIds = new Set(oldInputPorts.map(port => port.id));
				const addedPort = newInputPorts.find(port => !oldPortsIds.has(port.id));
				if (!addedPort) {
					return;
				}
				this.addConnection({
					...this.newConnection,
					targetBlockId: this.block.id,
					targetPort: addedPort,
					targetPortId: addedPort.id
				});
			},
			auxPortsLength() {
				this.$nextTick(() => {
					this.auxPorts.forEach((port, index) => {
						this.updatePort(this.block.id, port.id, index);
					});
				});
			},
			auxPorts(newAuxPorts, oldAuxPorts) {
				if (!this.newConnection) {
					return;
				}
				const oldPortsIds = new Set(oldAuxPorts.map(port => port.id));
				const addedPort = newAuxPorts.find(port => !oldPortsIds.has(port.id));
				if (addedPort) {
					this.addConnection(normalyzeAuxConnection({
						...this.newConnection,
						targetBlockId: this.block.id,
						targetPortId: addedPort.id
					}));
				}
			}
		},
		template: `
		<div :class="blockComplexClassNames">
			<slot
				name="header"
				:title="title"
			/>
			<div class="block-complex__content">
				<div class="block-complex__content_row block-complex__content_rules">
					<div
						v-for="ruleType in ruleTypes"
						:key="ruleType.id"
						class="block-complex__content_col"
						:class="ruleType.classList"
					>
						<span class="block-complex__content_label">
							{{ ruleType.label }}
						</span>
						<div
							v-for="(item, index) in ruleType.items"
							:key="item.id"
							class="block-complex__content_col-value"
						>
							<slot
								:name="item.type ? 'port' : 'portPlaceholder'"
								:item="item"
								:index="index"
								:disabled="disabled"
								:position="ruleType.position"
								:isOutput="ruleType.id === 'output-rules'"
							/>
						</div>
					</div>
				</div>
				<div
					v-if="showRelationSection"
					class="block-complex__content_connections"
				>
					<span class="block-complex__content_label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_CONNECTIONS_TITLE') }}
					</span>
					<div class="block-complex__content_row">
						<div class="block-complex__content_col">
							<div
								v-for="(port, index) in relationPorts"
								:key="port.id"
								class="block-complex__content_col-value"
							>
								<slot
									name="port"
									:item="port"
									:index="index"
									:disabled="disabled"
									position="left"
								/>
							</div>
							<div
								class="block-complex__content_col-value"
								:key="relationPlaceholder.id"
							>
								<slot
									name="portPlaceholder"
									:item="relationPlaceholder"
								/>
							</div>
						</div>
					</div>
				</div>
				<div
					v-if="showAuxSection"
					class="block-complex__aux-section"
				>
					<slot name="auxSectionLabel" />
					<div class="block-complex__aux-ports">
						<div
							v-for="(item, index) in auxPortItems"
							:key="item.id"
							class="block-complex__aux-port-item"
							:class="{ '--inactive': !item.type || item.isActive === false }"
						>
							<BxText
								size='sm'
								class="block-complex__aux-port-title"
							>
								{{ item.title }}
							</BxText>
							<div class="block-complex__aux-port-point">
								<slot
									:name="item.type ? 'auxPort' : 'auxPortPlaceholder'"
									:item="item"
									:index="index"
									:disabled="disabled"
									:isActive="item.isActive !== false"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const BlockTopTitle = {
		name: 'BlockTopTitle',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			title: {
				type: String,
				required: false,
				default: ''
			},
			description: {
				type: String,
				required: false,
				default: ''
			}
		},
		setup() {
			const {
				zoom,
				transformX,
				transformY
			} = ui_blockDiagram.useBlockDiagram();
			return {
				zoom,
				transformX,
				transformY
			};
		},
		data() {
			return {
				popupInstance: null,
				isOverflowing: false,
				resizeObserver: null
			};
		},
		computed: {
			displayText() {
				if (this.title) {
					return this.title;
				}
				return this.description || '';
			},
			tooltipContent() {
				return main_core.Tag.render`
				<div class="editor-chart-tooltip">
					 <h3 class="editor-chart-tooltip__title">${main_core.Text.encode(this.title)}</h3>
					 <p class="editor-chart-tooltip__description">${main_core.Text.encode(this.description)}</p>
				</div>
			`;
			},
			shouldShowTooltip() {
				return this.isOverflowing || Boolean(this.title && this.description);
			},
			hintOptions() {
				if (!this.shouldShowTooltip) {
					return null;
				}
				return {
					text: this.tooltipContent,
					popupOptions: {
						offsetTop: -10,
						bindOptions: {
							position: 'top'
						},
						angle: {
							position: 'bottom',
							offset: 154
						},
						className: 'editor-chart-tooltip-content',
						width: 340,
						background: 'var(--ui-color-accent-soft-element-blue)',
						events: {
							onShow: event => {
								const popup = event.getTarget();
								if (popup) {
									this.popupInstance = ui_vue3.markRaw(popup);
									requestAnimationFrame(() => {
										this.applyInitialScale(popup);
									});
								}
							},
							onClose: () => {
								this.popupInstance = null;
							}
						}
					}
				};
			}
		},
		watch: {
			zoom: 'closePopup',
			transformX: 'closePopup',
			transformY: 'closePopup',
			displayText() {
				this.$nextTick(() => {
					this.checkOverflow();
				});
			}
		},
		mounted() {
			this.checkOverflow();
			if (this.$refs.textContainer && main_core.Type.isFunction(ResizeObserver)) {
				this.resizeObserver = new ResizeObserver(() => {
					this.checkOverflow();
				});
				this.resizeObserver.observe(this.$refs.textContainer);
			}
		},
		beforeUnmount() {
			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
				this.resizeObserver = null;
			}
		},
		methods: {
			checkOverflow() {
				const element = this.$refs.textContainer;
				if (element) {
					this.isOverflowing = element.scrollWidth > element.clientWidth;
				}
			},
			closePopup() {
				if (this.popupInstance) {
					this.popupInstance.close();
					this.popupInstance = null;
				}
			},
			applyInitialScale(popup) {
				if (!this.zoom || !popup) {
					return;
				}
				const container = popup.getPopupContainer();
				const bind = popup.bindElement;
				if (!container || !bind) {
					return;
				}
				if (this.zoom === 1) {
					this.applyDefaultScale(container, bind);
				} else {
					this.applyZoomedScale(container, bind, this.zoom);
				}
			},
			getOffsetAnchor(bind) {
				if (this.isOverflowing && this.$refs.textContainer) {
					return this.$refs.textContainer;
				}
				return bind;
			},
			getCenterOffset(container, bind) {
				const popupRect = container.getBoundingClientRect();
				const anchor = this.getOffsetAnchor(bind);
				const bindRect = anchor.getBoundingClientRect();
				const bindCenterX = bindRect.left + bindRect.width / 2;
				const popupCenterX = popupRect.left + popupRect.width / 2;
				return bindCenterX - popupCenterX;
			},
			applyDefaultScale(container, bind) {
				const dx = this.getCenterOffset(container, bind);
				main_core.Dom.style(container, 'transform', `translate(${dx}px, 0)`);
				main_core.Dom.style(container, 'transformOrigin', '0 0');
			},
			applyZoomedScale(container, bind, scale) {
				main_core.Dom.style(container, 'transformOrigin', 'center bottom');
				const dx = this.getCenterOffset(container, bind);
				const adjustedDx = dx / scale;
				main_core.Dom.style(container, 'transform', `scale(${scale}) translate(${adjustedDx}px, 0)`);
			}
		},
		template: `
		<h3 class="editor-chart-block-top-title" ref="textContainer">
			<span v-if="displayText" v-hint="hintOptions">{{ displayText }}</span>
		</h3>
	`
	};

	// @vue/component
	const TemplateNameInput = {
		name: 'TemplateNameInput',
		components: {
			UiButton: ui_vue3_components_button.Button,
			MenuButton
		},
		props: {
			title: {
				type: String,
				default: ''
			},
			/** @type MenuOptions */
			dropdownOptions: {
				type: [Object],
				default: () => ({})
			}
		},
		emits: ['update:title'],
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_core.Outline,
				Type: main_core.Type
			};
		},
		data() {
			return {
				isEditing: false,
				editedTitle: this.title
			};
		},
		computed: {
			preparedOptions() {
				const options = this.dropdownOptions;
				const items = main_core.Type.isArrayFilled(options.items) ? options.items : [];
				const preparedItems = main_core.Type.isArrayFilled(items) ? this.prepareItems(items) : items;
				return {
					...options,
					items: [this.getEditingMenuItems(), ...preparedItems]
				};
			}
		},
		watch: {
			isEditing(isEditing) {
				if (isEditing) {
					main_core.Event.bind(document, 'click', this.onClickOutside, {
						capture: true
					});
				} else {
					main_core.Event.unbind(document, 'click', this.onClickOutside, {
						capture: true
					});
				}
			}
		},
		methods: {
			getEditingMenuItems() {
				return {
					title: this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_CHANGE'),
					icon: ui_iconSet_api_core.Outline.EDIT_M,
					onClick: this.onStartEditing
				};
			},
			onStartEditing() {
				this.isEditing = true;
				this.editedTitle = this.title;
				this.$nextTick(() => {
					this.$refs?.editInput?.focus();
				});
			},
			onSaveTitle() {
				this.$emit('update:title', this.editedTitle);
				this.isEditing = false;
			},
			onCancelEditing() {
				this.isEditing = false;
			},
			prepareItems(items) {
				return items.map(item => {
					if (main_core.Type.isString(item.onClick) && main_core.Type.isFunction(this[item.onClick])) {
						return {
							...item,
							onClick: this[item.onClick].bind(this)
						};
					}
					return item;
				});
			},
			onClickOutside(event) {
				if (!this.$el.contains(event.target)) {
					this.onCancelEditing();
				}
			}
		},
		template: `
		<div
			v-if="!isEditing"
			class="ui-top-panel-editable-title-box"
		>
			<div class="ui-top-panel-editable-title">
				<span @click="onStartEditing">{{ title }}</span>
			</div>
			<MenuButton
				:options="preparedOptions"
				:icon="Outline.CHEVRON_DOWN_M"
				:buttonStyle="AirButtonStyle.PLAIN_NO_ACCENT"
			/>
		</div>
		<div
			v-else
			class="ui-top-panel-editable-title-edit-box"
		>
			<input
				v-model="editedTitle"
				ref="editInput"
				class="ui-top-panel-editable-title-edit-input"
				@keydown.enter.prevent="onSaveTitle"
			/>
			<div class="ui-top-panel-editable-title-edit-buttons">
				<UiButton
					:leftIcon="Outline.CHECK_M"
					:size="ButtonSize.EXTRA_EXTRA_SMALL"
					@click="onSaveTitle"
				/>
				<UiButton
					:leftIcon="Outline.CROSS_L"
					:size="ButtonSize.EXTRA_EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					@click="onCancelEditing"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const AutosaveStatus$1 = {
		name: 'bizprocdisginer-top-panel-autosave-status',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			isOnline: {
				type: Boolean,
				required: true
			}
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
	`
	};

	// @vue/components
	const DropdownMenuButton = {
		name: 'DropdownMenuButton',
		components: {
			SplitButton
		},
		props: {
			text: {
				type: String,
				default: ''
			},
			icon: {
				type: String,
				default: ''
			},
			loading: {
				type: Boolean,
				default: false
			},
			style: {
				type: String,
				default: null
			}
		},
		emits: ['change'],
		data() {
			return {
				isOpen: false
			};
		},
		mounted() {
			main_core.Event.bind(document, 'mousedown', this.handleClickOutside);
		},
		beforeUnmount() {
			main_core.Event.unbind(document, 'mousedown', this.handleClickOutside);
		},
		methods: {
			onToggleDropdown() {
				this.isOpen = !this.isOpen;
			},
			handleClickOutside(event) {
				const dropdown = this.$el;
				if (dropdown && !dropdown?.contains(event.target)) {
					this.isOpen = false;
				}
			}
		},
		template: `
		<div class="editor-chart-dropdown-menu-button">
			<SplitButton
				:text="text"
				:icon="icon"
				:loading="loading"
				:style="style"
				@mainClick="$emit('change')"
				@menuClick="onToggleDropdown"
			/>
			<transition name="slide-fade">
				<div v-if="isOpen"
					class="editor-chart-dropdown-menu-button__menu-content"
					ref="dropdownMenu"
				>
					<ul class="editor-chart-dropdown-menu-button__list">
						<slot/>
					</ul>
					<div class="editor-chart-dropdown-menu-button__footer">
						<a
							href="#"
							class="editor-chart-dropdown-menu-button__help-link"
						>
							{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLICATION_LINK') }}
						</a>
					</div>
				</div>
			</transition>
		</div>
	`
	};

	// @vue/component
	const DropdownMenuOption = {
		name: 'DropdownMenuOption',
		props: {
			title: {
				type: String,
				default: ''
			},
			description: {
				type: String,
				default: ''
			},
			isActive: {
				type: Boolean,
				default: false
			},
			notReleased: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<li
			class="editor-chart-dropdown-menu-option"
			:class="{ '--selected': isActive }"
		>
			<div class="editor-chart-dropdown-menu-option__content">
				<div class="editor-chart-dropdown-menu-option__title">
					{{ title }}
				</div>
				<div class="editor-chart-dropdown-menu-option__description">
					{{ description }}
				</div>
			</div>
			<div class="editor-chart-dropdown-menu-option__icon">
				<slot name="icon"/>
				<div
					v-if="notReleased"
					class="editor-chart-dropdown-menu-option__not-released-badge"
				>
					{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NOT_RELEASE_BADGE') }}
				</div>
			</div>
		</li>
	`
	};

	const COLORS$2 = {
		active: {
			lightBlue: '#C4E6FF',
			primaryBlue: '#0075FF',
			secondaryBlue: '#9BD4FF',
			successGreen: '#1BCE7B'
		},
		inactive: {
			lightBlue: '#F0F0F0',
			primaryBlue: '#C8C9CD',
			secondaryBlue: '#C8C9CD',
			successGreen: '#C8C9CD'
		}
	};

	// @vue/components
	const WorkflowIcon = {
		name: 'WorkflowIcon',
		props: {
			active: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			colors() {
				return this.active ? COLORS$2.active : COLORS$2.inactive;
			}
		},
		template: `
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="71"
			height="67"
			viewBox="0 0 71 67"
			fill="none"
		>
			<g opacity="0.8">
				<path
					d="M15.2749 17.5718C15.2749 14.8644 17.3577 12.724 19.9013 12.7906L51.5805 13.6078C53.7929 13.6655 55.5715 15.7302 55.5715 18.2217V45.8523C55.5715 48.3437 53.7929 50.4571 51.5805 50.5741L19.9013 52.2447C17.3559 52.3797 15.2749 50.2951 15.2749 47.5877V17.5718Z"
					:fill="colors.lightBlue"
				/>
			</g>
			<path
				opacity="0.5"
				d="M26.2736 39.6436C26.2736 39.3952 26.549 39.2494 26.7362 39.3988L27.2439 39.8074V40.0649H27.3033C27.4563 40.0595 27.5805 40.1891 27.5805 40.3547C27.5805 40.5203 27.4563 40.6571 27.3033 40.6625H27.2439V40.9235L26.7362 41.361C26.5508 41.5212 26.2736 41.3934 26.2736 41.145V40.6823C26.1134 40.6769 25.9568 40.6607 25.8038 40.6319C25.6525 40.6049 25.5535 40.4483 25.5841 40.2863C25.6147 40.1225 25.7606 40.0127 25.9136 40.0415C26.0324 40.0631 26.153 40.0775 26.2754 40.0829V39.6418L26.2736 39.6436ZM29.6633 40.5923L28.8784 40.6157C28.7254 40.6211 28.6012 40.4897 28.6012 40.3259C28.6012 40.1621 28.7254 40.0235 28.8784 40.0199L29.6633 39.9965V40.5923ZM23.5536 38.6175C23.6832 38.5221 23.8578 38.5545 23.9442 38.6895C24.171 39.0442 24.4608 39.3484 24.7993 39.5806L24.8425 39.6184C24.9343 39.7156 24.9505 39.8722 24.8767 39.9947C24.7903 40.1351 24.6157 40.1765 24.486 40.0883L24.3384 39.9821C24.0018 39.7246 23.7084 39.4042 23.4744 39.0388C23.3879 38.902 23.4221 38.7147 23.5518 38.6175H23.5536ZM23.1395 35.8381C23.2961 35.8345 23.4221 35.9677 23.4221 36.1333V36.8606C23.4221 37.082 23.4419 37.298 23.4816 37.5068L23.487 37.568C23.487 37.7085 23.3933 37.8363 23.2583 37.8669C23.1053 37.9029 22.9559 37.8003 22.9271 37.6382L22.8965 37.451C22.8695 37.2638 22.8569 37.0694 22.8569 36.8732V36.1441C22.8569 35.9767 22.9829 35.8399 23.1395 35.8363V35.8381ZM23.1395 32.9236C23.2961 32.9218 23.4221 33.055 23.4221 33.2207V34.677L23.4167 34.7382C23.3897 34.8768 23.2763 34.9812 23.1395 34.9848C23.0027 34.9866 22.8893 34.8858 22.8623 34.749L22.8569 34.6878V33.2297C22.8569 33.0622 22.9829 32.9254 23.1395 32.9236ZM23.9136 30.3584C23.9136 30.695 23.7102 30.9831 23.4221 31.1001V31.7661L23.4167 31.8273C23.3897 31.9641 23.2763 32.0704 23.1395 32.0722C23.0027 32.0722 22.8893 31.9713 22.8623 31.8345L22.8569 31.7733V31.0983C22.5797 30.9831 22.3853 30.7022 22.3853 30.3728L23.9136 30.3584Z"
				:fill="colors.primaryBlue"
				fill-opacity="0.78"
			/>
			<path
				d="M18.7524 21.2727C18.7524 19.5968 19.8703 18.2539 21.2403 18.2737L46.8331 18.6553C48.0608 18.6733 49.0527 19.9658 49.0527 21.5409V27.2709C49.0527 28.846 48.0626 30.1331 46.8331 30.1439L21.2403 30.3797C19.8685 30.3923 18.7524 29.044 18.7524 27.3663V21.2709V21.2727Z"
				fill="white"
			/>
			<path
				opacity="0.5"
				d="M24.583 24.3347C24.583 23.6686 25.0733 23.1322 25.6766 23.1358L43.4199 23.233C43.9781 23.2366 44.4301 23.755 44.4301 24.3941C44.4301 25.0331 43.9781 25.548 43.4199 25.548L25.6766 25.5408C25.0733 25.5408 24.583 25.0007 24.583 24.3365V24.3347Z"
				:fill="colors.secondaryBlue"
				fill-opacity="var(--opacity-80)"
			/>
			<path
				d="M27.2441 37.4979C27.2441 35.849 28.3242 34.4934 29.6492 34.47L50.3996 34.1028C51.6093 34.0812 52.585 35.3323 52.585 36.8967V42.5834C52.585 44.1477 51.6093 45.4564 50.3996 45.5068L29.6492 46.3763C28.3242 46.4321 27.2441 45.1414 27.2441 43.4924V37.4997V37.4979Z"
				fill="white"
			/>
			<path
				opacity="0.5"
				d="M38.6587 40.1545C38.6587 39.5083 39.1375 38.9736 39.7244 38.9574L48.5362 38.7162C49.1014 38.7 49.5587 39.2004 49.5587 39.8305C49.5587 40.4606 49.1014 40.988 48.5362 41.006L39.7244 41.2904C39.1357 41.3102 38.6587 40.8008 38.6587 40.1563V40.1545Z"
				:fill="colors.secondaryBlue"
				fill-opacity="0.8"
			/>
			<path
				opacity="0.7"
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M33.2891 44.2326C33.2891 44.2321 33.2895 44.2317 33.29 44.2317C35.2698 44.1556 36.8624 42.3556 36.8624 40.2084C36.8624 38.0608 35.2693 36.356 33.2891 36.3992C31.3089 36.4424 29.6636 38.2444 29.6636 40.4244C29.6636 42.6041 31.2922 44.3068 33.2882 44.2336C33.2887 44.2336 33.2891 44.2331 33.2891 44.2326Z"
				:fill="colors.successGreen"
				fill-opacity="0.78"
			/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M35.057 38.7832C34.9022 38.6194 34.652 38.6248 34.4971 38.7976L32.7708 40.7274L32.0795 39.9965C31.9229 39.8309 31.6691 39.8381 31.5125 40.0127C31.3559 40.1873 31.3559 40.4628 31.5125 40.6284L32.4882 41.6581C32.6448 41.8219 32.8968 41.8147 33.0516 41.6401L35.057 39.3953C35.2118 39.2224 35.2118 38.9488 35.057 38.785V38.7832Z"
				fill="white"
			/>
			<path
				d="M47.9009 41.2902C47.9009 38.7574 49.7244 36.662 51.9548 36.6116L62.2716 36.3739C64.3849 36.3253 66.0843 38.2605 66.0843 40.6961V52.2712C66.0843 54.7068 64.3849 56.7968 62.2716 56.939L51.9548 57.6392C49.7244 57.7904 47.9009 55.8607 47.9009 53.3278V41.292V41.2902Z"
				:fill="colors.primaryBlue"
				fill-opacity="0.78"
			/>
			<path
				xmlns="http://www.w3.org/2000/svg"
				d="M47.8608 41.2382C47.8608 38.709 49.6808 36.6172 51.9076 36.5668L62.2063 36.331C64.3161 36.2824 66.0119 38.2157 66.0119 40.6478V52.2066C66.0119 54.6386 64.3161 56.725 62.2063 56.8672L51.9076 57.5621C49.6808 57.7115 47.8608 55.7853 47.8608 53.2561V41.2364V41.2382Z"
				:fill="colors.primaryBlue"
				fill-opacity="0.78"
			/>
			<g filter="url(#filter1_d_2398_58856)">
				<path
					xmlns="http://www.w3.org/2000/svg"
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M59.0084 45.4018C59.0084 45.3644 59.0119 45.327 59.0191 45.2897C59.0725 45.0405 59.286 44.8803 59.4978 44.9337L61.3275 45.3947C61.5019 45.4392 61.6229 45.6171 61.6229 45.8289V50.072L62.091 50.0471C62.1907 50.0418 62.2726 50.1308 62.2726 50.2465V51.3589C62.2726 51.4745 62.1907 51.5724 62.091 51.5778L51.8482 52.1562C51.7431 52.1616 51.6577 52.0708 51.6577 51.9533V50.8142C51.6577 50.6968 51.7431 50.5953 51.8482 50.59L52.3358 50.5633V42.9812C52.3358 42.5968 52.5761 42.2622 52.9036 42.1892L57.5827 41.1445C57.6183 41.1373 57.6539 41.132 57.6895 41.1302C58.0544 41.1178 58.3498 41.4541 58.3498 41.8813V50.2447L59.0084 50.2091V45.4018ZM55.2369 50.3337V47.9434L54.0356 48.0003V50.3977L55.2369 50.3337ZM57.0577 49.2159V47.8562L55.8652 47.9131V49.2765L57.0577 49.2159ZM60.8612 47.6088L59.6883 47.6639V49.0166L60.8612 48.9579V47.6088ZM57.0577 43.7074L55.8652 43.7537V45.117L57.0577 45.0672V43.7074ZM55.2369 43.7786L54.0356 43.8249V45.1936L55.2369 45.1437V43.7786ZM57.0577 45.7827L55.8652 45.8343V47.1976L57.0577 47.1425V45.7827ZM55.2369 45.861L54.0356 45.9126V47.2813L55.2369 47.2261V45.861Z"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
			</g>
			<path
				xmlns="http://www.w3.org/2000/svg"
				d="M65.3957 52.2278V40.6525C65.3957 38.54 63.9889 37.0067 62.3711 36.9481L62.2137 36.9466L51.8971 37.1845C50.068 37.2258 48.4456 38.9784 48.4456 41.2464V53.2839C48.4456 55.5388 50.0415 57.102 51.8413 56.98L62.158 56.2799L62.3184 56.2641C63.9682 56.0547 65.3955 54.3492 65.3957 52.2278ZM66.0122 52.2278L66.0077 52.4543C65.9062 54.7916 64.2469 56.7571 62.1994 56.8949L51.8828 57.5957L51.675 57.6033C49.6091 57.6243 47.9398 55.8574 47.8344 53.5195L47.8291 53.2839V41.2464C47.8291 38.7928 49.5404 36.7497 51.675 36.5785L51.8828 36.568L62.1994 36.3301L62.3966 36.3316C64.4177 36.4032 66.0122 38.293 66.0122 40.6525V52.2278Z"
				fill="white"
				fill-opacity="0.18"
			/>
			<path
				d="M5.479 6.25911C5.479 3.49227 7.6554 1.35548 10.3142 1.48509L22.0171 2.05574C24.5301 2.17815 26.5499 4.42835 26.5499 7.08359V19.0997C26.5499 21.7549 24.5301 23.8953 22.0171 23.8827L10.3142 23.8215C7.6554 23.8071 5.479 21.5533 5.479 18.7864V6.25911Z"
				:fill="colors.successGreen"
				fill-opacity="0.78"
			/>
			<path
				d="M5.479 18.7867V6.25913C5.47916 3.49251 7.65539 1.3556 10.314 1.48508L22.0173 2.05643C24.5302 2.17897 26.5497 4.42901 26.5497 7.08416V19.0998L26.5437 19.3475C26.4228 21.8869 24.4516 23.895 22.0173 23.8829L22.0203 23.2664C24.157 23.277 25.9332 21.4487 25.9332 19.0998V7.08416C25.9332 4.79933 24.2507 2.89929 22.1882 2.68725L21.9872 2.67219L10.2839 2.10159C7.99746 1.99029 6.09568 3.82433 6.09552 6.25913V18.7867C6.09552 21.2337 8.01739 23.193 10.3178 23.2054L22.0203 23.2664L22.0173 23.8829L10.314 23.8219C7.73846 23.8079 5.61533 21.6924 5.48503 19.0449L5.479 18.7867Z"
				fill="white"
				fill-opacity="0.24"
			/>
			<g filter="url(#filter2_d_2398_58856)">
				<path
					d="M11.4088 14.3314L14.0622 15.0298C14.2548 15.0802 14.2963 15.3467 14.1306 15.4529L13.299 15.9767C14.037 16.8084 15.0811 17.3358 16.2332 17.3556C16.8021 17.3664 17.3403 17.253 17.8282 17.0388C17.9164 16.9992 18.0226 17.0226 18.0874 17.1L19.0577 18.2485C19.1495 18.3565 19.1261 18.5239 19.0055 18.5905C18.1846 19.0478 17.2413 19.2998 16.235 19.2854C14.4205 19.2602 12.7877 18.3709 11.6968 16.9902L10.8633 17.5158C10.6941 17.6221 10.4817 17.4618 10.5267 17.2602L11.1424 14.5006C11.1694 14.3764 11.29 14.3008 11.4106 14.3332L11.4088 14.3314ZM18.2098 7.78058C18.2098 7.62216 18.3592 7.51776 18.4978 7.58436C20.5698 8.58525 22.0153 10.7904 22.0153 13.3035C22.0153 14.0757 21.8785 14.812 21.6301 15.4853L22.5338 16.0163C22.7012 16.1153 22.6778 16.3781 22.4942 16.4339L19.974 17.1954C19.8605 17.2296 19.7381 17.1594 19.7039 17.0388L18.9335 14.344C18.8777 14.1477 19.0739 13.9839 19.2431 14.0829L20.0172 14.5384C20.1414 14.1351 20.2098 13.7049 20.2098 13.2549C20.2098 11.7499 19.4537 10.407 18.3178 9.63474C18.2512 9.58974 18.2098 9.51233 18.2098 9.43133V7.78238V7.78058ZM15.3998 6.11183C15.3998 5.90661 15.6374 5.813 15.776 5.96422L17.6716 8.0254C17.7562 8.11721 17.7562 8.26302 17.6716 8.34943L15.776 10.2738C15.6374 10.4142 15.3998 10.3044 15.3998 10.0992V9.00829H15.3908C13.7166 9.32512 12.4205 10.7454 12.2171 12.551C12.2081 12.6374 12.1541 12.713 12.0749 12.7436L10.6131 13.3125C10.4727 13.3665 10.3161 13.2621 10.3125 13.1037C10.3125 13.0676 10.3125 13.0316 10.3125 12.9956C10.3125 9.89397 12.4997 7.40615 15.3277 7.05691C15.3511 7.05331 15.3745 7.05691 15.398 7.06052V6.11183H15.3998Z"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
			</g>
		</svg>
	`
	};

	const COLORS$1 = {
		active: {
			lightBlue: '#C4E6FF',
			primaryBlue: '#0075FF',
			secondaryBlue: '#9BD4FF',
			successGreen: '#1BCE7B'
		},
		inactive: {
			lightBlue: '#F0F0F0',
			primaryBlue: '#C8C9CD',
			secondaryBlue: '#C8C9CD',
			successGreen: '#C8C9CD'
		}
	};

	// @vue/component
	const PersonIcon = {
		name: 'PersonIcon',
		props: {
			active: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			colors() {
				return this.active ? COLORS$1.active : COLORS$1.inactive;
			}
		},
		template: `
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="71"
			height="67"
			viewBox="0 0 71 67"
			fill="none"
		>
			<g opacity="0.8">
				<path
					d="M15.2749 17.5718C15.2749 14.8644 17.3577 12.724 19.9013 12.7906L51.5805 13.6078C53.7929 13.6655 55.5715 15.7302 55.5715 18.2217V45.8523C55.5715 48.3437 53.7929 50.4571 51.5805 50.5741L19.9013 52.2447C17.3559 52.3797 15.2749 50.2951 15.2749 47.5877V17.5718Z"
					:fill="colors.lightBlue"
				/>
			</g>
			<path
				opacity="0.5"
				d="M26.2736 39.6436C26.2736 39.3952 26.549 39.2494 26.7362 39.3988L27.2439 39.8074V40.0649H27.3033C27.4563 40.0595 27.5805 40.1891 27.5805 40.3547C27.5805 40.5203 27.4563 40.6571 27.3033 40.6625H27.2439V40.9235L26.7362 41.361C26.5508 41.5212 26.2736 41.3934 26.2736 41.145V40.6823C26.1134 40.6769 25.9568 40.6607 25.8038 40.6319C25.6525 40.6049 25.5535 40.4483 25.5841 40.2863C25.6147 40.1225 25.7606 40.0127 25.9136 40.0415C26.0324 40.0631 26.153 40.0775 26.2754 40.0829V39.6418L26.2736 39.6436ZM29.6633 40.5923L28.8784 40.6157C28.7254 40.6211 28.6012 40.4897 28.6012 40.3259C28.6012 40.1621 28.7254 40.0235 28.8784 40.0199L29.6633 39.9965V40.5923ZM23.5536 38.6175C23.6832 38.5221 23.8578 38.5545 23.9442 38.6895C24.171 39.0442 24.4608 39.3484 24.7993 39.5806L24.8425 39.6184C24.9343 39.7156 24.9505 39.8722 24.8767 39.9947C24.7903 40.1351 24.6157 40.1765 24.486 40.0883L24.3384 39.9821C24.0018 39.7246 23.7084 39.4042 23.4744 39.0388C23.3879 38.902 23.4221 38.7147 23.5518 38.6175H23.5536ZM23.1395 35.8381C23.2961 35.8345 23.4221 35.9677 23.4221 36.1333V36.8606C23.4221 37.082 23.4419 37.298 23.4816 37.5068L23.487 37.568C23.487 37.7085 23.3933 37.8363 23.2583 37.8669C23.1053 37.9029 22.9559 37.8003 22.9271 37.6382L22.8965 37.451C22.8695 37.2638 22.8569 37.0694 22.8569 36.8732V36.1441C22.8569 35.9767 22.9829 35.8399 23.1395 35.8363V35.8381ZM23.1395 32.9236C23.2961 32.9218 23.4221 33.055 23.4221 33.2207V34.677L23.4167 34.7382C23.3897 34.8768 23.2763 34.9812 23.1395 34.9848C23.0027 34.9866 22.8893 34.8858 22.8623 34.749L22.8569 34.6878V33.2297C22.8569 33.0622 22.9829 32.9254 23.1395 32.9236ZM23.9136 30.3584C23.9136 30.695 23.7102 30.9831 23.4221 31.1001V31.7661L23.4167 31.8273C23.3897 31.9641 23.2763 32.0704 23.1395 32.0722C23.0027 32.0722 22.8893 31.9713 22.8623 31.8345L22.8569 31.7733V31.0983C22.5797 30.9831 22.3853 30.7022 22.3853 30.3728L23.9136 30.3584Z"
				:fill="colors.primaryBlue"
				fill-opacity="0.78"
			/>
			<path
				d="M18.7524 21.2727C18.7524 19.5968 19.8703 18.2539 21.2403 18.2737L46.8331 18.6553C48.0608 18.6733 49.0527 19.9658 49.0527 21.5409V27.2709C49.0527 28.846 48.0626 30.1331 46.8331 30.1439L21.2403 30.3797C19.8685 30.3923 18.7524 29.044 18.7524 27.3663V21.2709V21.2727Z"
				fill="white"
			/>
			<path
				opacity="0.5"
				d="M24.583 24.3347C24.583 23.6686 25.0733 23.1322 25.6766 23.1358L43.4199 23.233C43.9781 23.2366 44.4301 23.755 44.4301 24.3941C44.4301 25.0331 43.9781 25.548 43.4199 25.548L25.6766 25.5408C25.0733 25.5408 24.583 25.0007 24.583 24.3365V24.3347Z"
				:fill="colors.secondaryBlue"
				fill-opacity="var(--opacity-80)"
			/>
			<path
				d="M27.2441 37.4979C27.2441 35.849 28.3242 34.4934 29.6492 34.47L50.3996 34.1028C51.6093 34.0812 52.585 35.3323 52.585 36.8967V42.5834C52.585 44.1477 51.6093 45.4564 50.3996 45.5068L29.6492 46.3763C28.3242 46.4321 27.2441 45.1414 27.2441 43.4924V37.4997V37.4979Z"
				fill="white"
			/>
			<path
				opacity="0.5"
				d="M38.6587 40.1545C38.6587 39.5083 39.1375 38.9736 39.7244 38.9574L48.5362 38.7162C49.1014 38.7 49.5587 39.2004 49.5587 39.8305C49.5587 40.4606 49.1014 40.988 48.5362 41.006L39.7244 41.2904C39.1357 41.3102 38.6587 40.8008 38.6587 40.1563V40.1545Z"
				:fill="colors.secondaryBlue"
				fill-opacity="0.8"
			/>
			<path
				opacity="0.7"
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M33.2891 44.2326C33.2891 44.2321 33.2895 44.2317 33.29 44.2317C35.2698 44.1556 36.8624 42.3556 36.8624 40.2084C36.8624 38.0608 35.2693 36.356 33.2891 36.3992C31.3089 36.4424 29.6636 38.2444 29.6636 40.4244C29.6636 42.6041 31.2922 44.3068 33.2882 44.2336C33.2887 44.2336 33.2891 44.2331 33.2891 44.2326Z"
				:fill="colors.successGreen"
				fill-opacity="0.78"
			/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M35.057 38.7832C34.9022 38.6194 34.652 38.6248 34.4971 38.7976L32.7708 40.7274L32.0795 39.9965C31.9229 39.8309 31.6691 39.8381 31.5125 40.0127C31.3559 40.1873 31.3559 40.4628 31.5125 40.6284L32.4882 41.6581C32.6448 41.8219 32.8968 41.8147 33.0516 41.6401L35.057 39.3953C35.2118 39.2224 35.2118 38.9488 35.057 38.785V38.7832Z"
				fill="white"
			/>
			<path
				d="M47.9009 41.2902C47.9009 38.7574 49.7244 36.662 51.9548 36.6116L62.2716 36.3739C64.3849 36.3253 66.0843 38.2605 66.0843 40.6961V52.2712C66.0843 54.7068 64.3849 56.7968 62.2716 56.939L51.9548 57.6392C49.7244 57.7904 47.9009 55.8607 47.9009 53.3278V41.292V41.2902Z"
				:fill="colors.primaryBlue"
				fill-opacity="0.78"
			/>
			<path
				d="M65.4675 52.2717V40.6964C65.4675 38.584 64.0607 37.0506 62.4428 36.992L62.2855 36.9905L51.9688 37.2284C50.1397 37.2697 48.5174 39.0223 48.5174 41.2903V53.3278C48.5174 55.5828 50.1133 57.1459 51.9131 57.0239L62.2298 56.3238L62.3901 56.308C64.04 56.0986 65.4673 54.3931 65.4675 52.2717ZM66.084 52.2717L66.0795 52.4983C65.9779 54.8355 64.3187 56.8011 62.2712 56.9389L51.9545 57.6397L51.7468 57.6472C49.6809 57.6683 48.0116 55.9013 47.9061 53.5635L47.9009 53.3278V41.2903C47.9009 38.8368 49.6122 36.7937 51.7468 36.6224L51.9545 36.6119L62.2712 36.374L62.4684 36.3755C64.4895 36.4472 66.084 38.3369 66.084 40.6964V52.2717Z"
				fill="white"
				fill-opacity="0.18"
			/>
			<g filter="url(#filter1_d_2398_58856)">
				<path
					d="M55.5823 41.3313C55.5985 41.3115 55.6183 41.2917 55.6381 41.2755C55.7929 41.1476 56.0143 41.0144 56.2772 40.9082C56.5346 40.8038 56.8064 40.7372 57.0476 40.73C57.9189 40.7012 58.549 41.0936 58.9594 41.6877C59.368 42.2853 59.5588 43.0936 59.5444 43.9073C59.53 44.721 59.3068 45.5472 58.882 46.1755C58.4625 46.8073 57.8433 47.2394 57.0476 47.2754C55.7119 47.3366 54.882 46.2583 54.621 44.9442C54.369 43.6625 54.675 42.1647 55.5823 41.3295V41.3313Z"
					fill="white"
					fill-opacity="0.9"
				/>
				<path
					d="M57.0548 48.4957C59.0565 48.3985 61.2599 49.0267 61.4328 51.9034C61.4328 52.114 61.2833 52.2922 61.0997 52.303L52.9306 52.7729C52.7398 52.7837 52.585 52.6198 52.585 52.4056C52.765 49.4552 55.035 48.5947 57.0548 48.4957Z"
					fill="white"
					fill-opacity="0.9"
				/>
			</g>
			<path
				d="M5.479 6.25911C5.479 3.49227 7.6554 1.35548 10.3142 1.48509L22.0171 2.05574C24.5301 2.17815 26.5499 4.42835 26.5499 7.08359V19.0997C26.5499 21.7549 24.5301 23.8953 22.0171 23.8827L10.3142 23.8215C7.6554 23.8071 5.479 21.5533 5.479 18.7864V6.25911Z"
				:fill="colors.successGreen"
				fill-opacity="0.78"
			/>
			<path
				d="M5.479 18.7867V6.25913C5.47916 3.49251 7.65539 1.3556 10.314 1.48508L22.0173 2.05643C24.5302 2.17897 26.5497 4.42901 26.5497 7.08416V19.0998L26.5437 19.3475C26.4228 21.8869 24.4516 23.895 22.0173 23.8829L22.0203 23.2664C24.157 23.277 25.9332 21.4487 25.9332 19.0998V7.08416C25.9332 4.79933 24.2507 2.89929 22.1882 2.68725L21.9872 2.67219L10.2839 2.10159C7.99746 1.99029 6.09568 3.82433 6.09552 6.25913V18.7867C6.09552 21.2337 8.01739 23.193 10.3178 23.2054L22.0203 23.2664L22.0173 23.8829L10.314 23.8219C7.73846 23.8079 5.61533 21.6924 5.48503 19.0449L5.479 18.7867Z"
				fill="white"
				fill-opacity="0.24"
			/>
			<g filter="url(#filter2_d_2398_58856)">
				<path
					d="M11.4088 14.3314L14.0622 15.0298C14.2548 15.0802 14.2963 15.3467 14.1306 15.4529L13.299 15.9767C14.037 16.8084 15.0811 17.3358 16.2332 17.3556C16.8021 17.3664 17.3403 17.253 17.8282 17.0388C17.9164 16.9992 18.0226 17.0226 18.0874 17.1L19.0577 18.2485C19.1495 18.3565 19.1261 18.5239 19.0055 18.5905C18.1846 19.0478 17.2413 19.2998 16.235 19.2854C14.4205 19.2602 12.7877 18.3709 11.6968 16.9902L10.8633 17.5158C10.6941 17.6221 10.4817 17.4618 10.5267 17.2602L11.1424 14.5006C11.1694 14.3764 11.29 14.3008 11.4106 14.3332L11.4088 14.3314ZM18.2098 7.78058C18.2098 7.62216 18.3592 7.51776 18.4978 7.58436C20.5698 8.58525 22.0153 10.7904 22.0153 13.3035C22.0153 14.0757 21.8785 14.812 21.6301 15.4853L22.5338 16.0163C22.7012 16.1153 22.6778 16.3781 22.4942 16.4339L19.974 17.1954C19.8605 17.2296 19.7381 17.1594 19.7039 17.0388L18.9335 14.344C18.8777 14.1477 19.0739 13.9839 19.2431 14.0829L20.0172 14.5384C20.1414 14.1351 20.2098 13.7049 20.2098 13.2549C20.2098 11.7499 19.4537 10.407 18.3178 9.63474C18.2512 9.58974 18.2098 9.51233 18.2098 9.43133V7.78238V7.78058ZM15.3998 6.11183C15.3998 5.90661 15.6374 5.813 15.776 5.96422L17.6716 8.0254C17.7562 8.11721 17.7562 8.26302 17.6716 8.34943L15.776 10.2738C15.6374 10.4142 15.3998 10.3044 15.3998 10.0992V9.00829H15.3908C13.7166 9.32512 12.4205 10.7454 12.2171 12.551C12.2081 12.6374 12.1541 12.713 12.0749 12.7436L10.6131 13.3125C10.4727 13.3665 10.3161 13.2621 10.3125 13.1037C10.3125 13.0676 10.3125 13.0316 10.3125 12.9956C10.3125 9.89397 12.4997 7.40615 15.3277 7.05691C15.3511 7.05331 15.3745 7.05691 15.398 7.06052V6.11183H15.3998Z"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
			</g>
		</svg>
	`
	};

	const COLORS = {
		active: {
			lightBlue: '#C4E6FF',
			primaryBlue: '#0075FF',
			secondaryBlue: '#9BD4FF',
			successGreen: '#1BCE7B'
		},
		inactive: {
			lightBlue: '#F0F0F0',
			primaryBlue: '#C8C9CD',
			secondaryBlue: '#C8C9CD',
			successGreen: '#C8C9CD'
		}
	};

	// @vue/components
	const StopIcon = {
		name: 'StopIcon',
		props: {
			active: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			colors() {
				return this.active ? COLORS.active : COLORS.inactive;
			}
		},
		template: `
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="71"
			height="67"
			viewBox="0 0 71 67"
			fill="none"
		>
			<g opacity="0.8">
				<path
					d="M15.2749 17.5718C15.2749 14.8644 17.3577 12.724 19.9013 12.7906L51.5805 13.6078C53.7929 13.6655 55.5715 15.7302 55.5715 18.2217V45.8523C55.5715 48.3437 53.7929 50.4571 51.5805 50.5741L19.9013 52.2447C17.3559 52.3797 15.2749 50.2951 15.2749 47.5877V17.5718Z"
					:fill="colors.lightBlue"
				/>
			</g>
			<path
				opacity="0.5"
				d="M26.2736 39.6436C26.2736 39.3952 26.549 39.2494 26.7362 39.3988L27.2439 39.8074V40.0649H27.3033C27.4563 40.0595 27.5805 40.1891 27.5805 40.3547C27.5805 40.5203 27.4563 40.6571 27.3033 40.6625H27.2439V40.9235L26.7362 41.361C26.5508 41.5212 26.2736 41.3934 26.2736 41.145V40.6823C26.1134 40.6769 25.9568 40.6607 25.8038 40.6319C25.6525 40.6049 25.5535 40.4483 25.5841 40.2863C25.6147 40.1225 25.7606 40.0127 25.9136 40.0415C26.0324 40.0631 26.153 40.0775 26.2754 40.0829V39.6418L26.2736 39.6436ZM29.6633 40.5923L28.8784 40.6157C28.7254 40.6211 28.6012 40.4897 28.6012 40.3259C28.6012 40.1621 28.7254 40.0235 28.8784 40.0199L29.6633 39.9965V40.5923ZM23.5536 38.6175C23.6832 38.5221 23.8578 38.5545 23.9442 38.6895C24.171 39.0442 24.4608 39.3484 24.7993 39.5806L24.8425 39.6184C24.9343 39.7156 24.9505 39.8722 24.8767 39.9947C24.7903 40.1351 24.6157 40.1765 24.486 40.0883L24.3384 39.9821C24.0018 39.7246 23.7084 39.4042 23.4744 39.0388C23.3879 38.902 23.4221 38.7147 23.5518 38.6175H23.5536ZM23.1395 35.8381C23.2961 35.8345 23.4221 35.9677 23.4221 36.1333V36.8606C23.4221 37.082 23.4419 37.298 23.4816 37.5068L23.487 37.568C23.487 37.7085 23.3933 37.8363 23.2583 37.8669C23.1053 37.9029 22.9559 37.8003 22.9271 37.6382L22.8965 37.451C22.8695 37.2638 22.8569 37.0694 22.8569 36.8732V36.1441C22.8569 35.9767 22.9829 35.8399 23.1395 35.8363V35.8381ZM23.1395 32.9236C23.2961 32.9218 23.4221 33.055 23.4221 33.2207V34.677L23.4167 34.7382C23.3897 34.8768 23.2763 34.9812 23.1395 34.9848C23.0027 34.9866 22.8893 34.8858 22.8623 34.749L22.8569 34.6878V33.2297C22.8569 33.0622 22.9829 32.9254 23.1395 32.9236ZM23.9136 30.3584C23.9136 30.695 23.7102 30.9831 23.4221 31.1001V31.7661L23.4167 31.8273C23.3897 31.9641 23.2763 32.0704 23.1395 32.0722C23.0027 32.0722 22.8893 31.9713 22.8623 31.8345L22.8569 31.7733V31.0983C22.5797 30.9831 22.3853 30.7022 22.3853 30.3728L23.9136 30.3584Z"
				:fill="colors.primaryBlue"
				fill-opacity="0.78"
			/>
			<path
				d="M18.7524 21.2727C18.7524 19.5968 19.8703 18.2539 21.2403 18.2737L46.8331 18.6553C48.0608 18.6733 49.0527 19.9658 49.0527 21.5409V27.2709C49.0527 28.846 48.0626 30.1331 46.8331 30.1439L21.2403 30.3797C19.8685 30.3923 18.7524 29.044 18.7524 27.3663V21.2709V21.2727Z"
				fill="white"
			/>
			<path
				opacity="0.5"
				d="M24.583 24.3347C24.583 23.6686 25.0733 23.1322 25.6766 23.1358L43.4199 23.233C43.9781 23.2366 44.4301 23.755 44.4301 24.3941C44.4301 25.0331 43.9781 25.548 43.4199 25.548L25.6766 25.5408C25.0733 25.5408 24.583 25.0007 24.583 24.3365V24.3347Z"
				:fill="colors.secondaryBlue"
				fill-opacity="var(--opacity-80)"
			/>
			<path
				d="M27.2441 37.4979C27.2441 35.849 28.3242 34.4934 29.6492 34.47L50.3996 34.1028C51.6093 34.0812 52.585 35.3323 52.585 36.8967V42.5834C52.585 44.1477 51.6093 45.4564 50.3996 45.5068L29.6492 46.3763C28.3242 46.4321 27.2441 45.1414 27.2441 43.4924V37.4997V37.4979Z"
				fill="white"
			/>
			<path
				opacity="0.5"
				d="M38.6587 40.1545C38.6587 39.5083 39.1375 38.9736 39.7244 38.9574L48.5362 38.7162C49.1014 38.7 49.5587 39.2004 49.5587 39.8305C49.5587 40.4606 49.1014 40.988 48.5362 41.006L39.7244 41.2904C39.1357 41.3102 38.6587 40.8008 38.6587 40.1563V40.1545Z"
				:fill="colors.secondaryBlue"
				fill-opacity="0.8"
			/>
			<path
				opacity="0.7"
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M33.2891 44.2326C33.2891 44.2321 33.2895 44.2317 33.29 44.2317C35.2698 44.1556 36.8624 42.3556 36.8624 40.2084C36.8624 38.0608 35.2693 36.356 33.2891 36.3992C31.3089 36.4424 29.6636 38.2444 29.6636 40.4244C29.6636 42.6041 31.2922 44.3068 33.2882 44.2336C33.2887 44.2336 33.2891 44.2331 33.2891 44.2326Z"
				:fill="colors.successGreen"
				fill-opacity="0.78"
			/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M35.057 38.7832C34.9022 38.6194 34.652 38.6248 34.4971 38.7976L32.7708 40.7274L32.0795 39.9965C31.9229 39.8309 31.6691 39.8381 31.5125 40.0127C31.3559 40.1873 31.3559 40.4628 31.5125 40.6284L32.4882 41.6581C32.6448 41.8219 32.8968 41.8147 33.0516 41.6401L35.057 39.3953C35.2118 39.2224 35.2118 38.9488 35.057 38.785V38.7832Z"
				fill="white"
			/>
			<path
				d="M47.9009 41.2902C47.9009 38.7574 49.7244 36.662 51.9548 36.6116L62.2716 36.3739C64.3849 36.3253 66.0843 38.2605 66.0843 40.6961V52.2712C66.0843 54.7068 64.3849 56.7968 62.2716 56.939L51.9548 57.6392C49.7244 57.7904 47.9009 55.8607 47.9009 53.3278V41.292V41.2902Z"
				:fill="colors.primaryBlue"
				fill-opacity="0.78"
			/>
			<path
				xmlns="http://www.w3.org/2000/svg"
				d="M47.8608 41.2382C47.8608 38.709 49.6808 36.6172 51.9076 36.5668L62.2063 36.331C64.3161 36.2824 66.0119 38.2157 66.0119 40.6478V52.2066C66.0119 54.6386 64.3161 56.725 62.2063 56.8672L51.9076 57.5621C49.6808 57.7115 47.8608 55.7853 47.8608 53.2561V41.2364V41.2382Z"
				:fill="colors.primaryBlue"
				fill-opacity="0.78"
			/>
			<g filter="url(#filter1_d_2398_58856)">
				<path
					xmlns="http://www.w3.org/2000/svg"
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M59.0084 45.4018C59.0084 45.3644 59.0119 45.327 59.0191 45.2897C59.0725 45.0405 59.286 44.8803 59.4978 44.9337L61.3275 45.3947C61.5019 45.4392 61.6229 45.6171 61.6229 45.8289V50.072L62.091 50.0471C62.1907 50.0418 62.2726 50.1308 62.2726 50.2465V51.3589C62.2726 51.4745 62.1907 51.5724 62.091 51.5778L51.8482 52.1562C51.7431 52.1616 51.6577 52.0708 51.6577 51.9533V50.8142C51.6577 50.6968 51.7431 50.5953 51.8482 50.59L52.3358 50.5633V42.9812C52.3358 42.5968 52.5761 42.2622 52.9036 42.1892L57.5827 41.1445C57.6183 41.1373 57.6539 41.132 57.6895 41.1302C58.0544 41.1178 58.3498 41.4541 58.3498 41.8813V50.2447L59.0084 50.2091V45.4018ZM55.2369 50.3337V47.9434L54.0356 48.0003V50.3977L55.2369 50.3337ZM57.0577 49.2159V47.8562L55.8652 47.9131V49.2765L57.0577 49.2159ZM60.8612 47.6088L59.6883 47.6639V49.0166L60.8612 48.9579V47.6088ZM57.0577 43.7074L55.8652 43.7537V45.117L57.0577 45.0672V43.7074ZM55.2369 43.7786L54.0356 43.8249V45.1936L55.2369 45.1437V43.7786ZM57.0577 45.7827L55.8652 45.8343V47.1976L57.0577 47.1425V45.7827ZM55.2369 45.861L54.0356 45.9126V47.2813L55.2369 47.2261V45.861Z"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
			</g>
			<path
				xmlns="http://www.w3.org/2000/svg"
				d="M65.3957 52.2278V40.6525C65.3957 38.54 63.9889 37.0067 62.3711 36.9481L62.2137 36.9466L51.8971 37.1845C50.068 37.2258 48.4456 38.9784 48.4456 41.2464V53.2839C48.4456 55.5388 50.0415 57.102 51.8413 56.98L62.158 56.2799L62.3184 56.2641C63.9682 56.0547 65.3955 54.3492 65.3957 52.2278ZM66.0122 52.2278L66.0077 52.4543C65.9062 54.7916 64.2469 56.7571 62.1994 56.8949L51.8828 57.5957L51.675 57.6033C49.6091 57.6243 47.9398 55.8574 47.8344 53.5195L47.8291 53.2839V41.2464C47.8291 38.7928 49.5404 36.7497 51.675 36.5785L51.8828 36.568L62.1994 36.3301L62.3966 36.3316C64.4177 36.4032 66.0122 38.293 66.0122 40.6525V52.2278Z"
				fill="white"
				fill-opacity="0.18"
			/>
			<path
				xmlns="http://www.w3.org/2000/svg"
				d="M5.479 6.24833C5.479 3.48688 7.6482 1.35549 10.3016 1.4851L21.9721 2.05395C24.4797 2.17637 26.4923 4.42116 26.4923 7.0692V19.0547C26.4923 21.7027 24.4779 23.8377 21.9721 23.8251L10.3016 23.7639C7.65 23.7495 5.479 21.5011 5.479 18.7414L5.479 6.24833Z"
				:fill="colors.successGreen"
				fill-opacity="0.78"
			/>
			<path
				xmlns="http://www.w3.org/2000/svg"
				d="M5.479 18.7415V6.24861C5.47903 3.48719 7.64856 1.35549 10.302 1.4851L21.9721 2.05419C24.4797 2.17663 26.4925 4.42186 26.4925 7.06988V19.0547L26.4865 19.3016C26.366 21.8343 24.3997 23.8379 21.9721 23.8257L21.9751 23.2085C24.1046 23.2192 25.876 21.3965 25.876 19.0547V7.06988C25.876 4.79165 24.1994 2.89728 22.1423 2.68577L21.942 2.66996L10.2719 2.10162C7.99098 1.9902 6.09555 3.81866 6.09552 6.24861V18.7415C6.09552 21.1815 8.01184 23.135 10.305 23.1475L21.9751 23.2085L21.9721 23.8257L10.302 23.764C7.73322 23.75 5.61488 21.6398 5.48503 18.999L5.479 18.7415Z"
				fill="white"
				fill-opacity="0.24"
			/>
			<g
				xmlns="http://www.w3.org/2000/svg"
				filter="url(#filter1_d_2398_60753)"
			>
				<path
					d="M11.3891 14.2954L11.3928 14.2969L13.2537 14.7869C13.4103 15.0803 13.6068 15.3503 13.8318 15.5879L13.277 15.9387C14.0132 16.7667 15.0539 17.2941 16.2023 17.314C16.7693 17.3248 17.3061 17.212 17.7921 16.9978C17.8802 16.9582 17.9847 16.9811 18.0495 17.0565L19.0161 18.2015C19.1079 18.3095 19.0847 18.4774 18.9642 18.544C18.1451 18.9994 17.2052 19.2509 16.2007 19.2365C14.3917 19.2113 12.7624 18.3244 11.6751 16.9474L10.8456 17.4713C10.6764 17.5775 10.4634 17.4169 10.5083 17.2154L11.1226 14.4625C11.1497 14.3385 11.2704 14.2648 11.3891 14.2954Z"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
				<path
					d="M18.1753 7.76436C18.1753 7.60604 18.325 7.50141 18.4636 7.56789C20.5301 8.56514 21.9721 10.767 21.9722 13.2709C21.9722 14.0413 21.8349 14.7764 21.5883 15.4479L22.4901 15.977C22.6575 16.076 22.6327 16.3367 22.451 16.3926L19.9382 17.1521C19.8248 17.1863 19.7037 17.1162 19.6695 16.9955L19.0899 14.9721C19.2303 14.7237 19.3422 14.4556 19.4196 14.1712L19.9811 14.5024C20.1053 14.101 20.1716 13.6708 20.1716 13.2227C20.1716 11.7214 19.4176 10.3821 18.2837 9.61165C18.217 9.56665 18.1753 9.48866 18.1753 9.40765V7.76436Z"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
				<path
					d="M17.4315 11.2376C17.723 11.2464 17.9547 11.4857 17.9547 11.7774V14.5144C17.9547 14.8162 17.7069 15.0596 17.4052 15.0542L14.9798 15.0105C14.6857 15.005 14.4506 14.7649 14.4506 14.4708V11.7043C14.4506 11.4 14.7019 11.1554 15.0061 11.1646L17.4315 11.2376Z"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
				<path
					d="M15.3712 6.09924C15.3712 5.89407 15.6067 5.8023 15.7453 5.9517L17.6355 8.00751C17.72 8.09925 17.7199 8.24478 17.6355 8.3312L16.3844 9.60036C16.3232 9.59496 16.2637 9.59162 16.2007 9.58982C15.9145 9.58082 15.6354 9.60812 15.3689 9.67112V8.98836H15.3599C13.6912 9.30522 12.3969 10.7203 12.1953 12.5203C12.1863 12.6067 12.1326 12.6809 12.0553 12.7115L10.5987 13.2784C10.4583 13.3324 10.3016 13.228 10.2998 13.0714V12.9652C10.2998 9.87256 12.4818 7.39018 15.3027 7.04095C15.326 7.03741 15.3497 7.04113 15.3712 7.04472V6.09924Z"
					fill="white"
					fill-opacity="0.9"
					shape-rendering="crispEdges"
				/>
			</g>
		</svg>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/components
	const ConnectionAux = {
		name: 'connection-aux',
		components: {
			Connection: ui_blockDiagram.Connection,
			DeleteConnectionBtn: ui_blockDiagram.DeleteConnectionBtn
		},
		props: {
			/** @type TConnection */
			connection: {
				type: Object,
				required: true
			}
		},
		template: `
		<Connection
			:stroke-dasharray="5"
			:connection="connection"
			:key="connection.id"
		>
			<template #default="{ isDisabled }">
				<DeleteConnectionBtn
					:connectionId="connection.id"
					:disabled="isDisabled"
				/>
			</template>
		</Connection>
	`
	};

	const OPTION_ITEM_CLASS_NAMES$1 = {
		BASE: 'editor-chart-menu-top-btn__item',
		CHANGED: '--changed'
	};
	const OFFSET_LEFT_COLOR_MENU$1 = 70;
	const OFFSET_TOP_COLOR_MENU$1 = 130;
	const POPUP_MIN_WIDTH$1 = 145;

	// @vue/component
	const ColorMenuTopBtn = {
		name: 'ColorMenuTopBtn',
		components: {
			IconButton
		},
		props: {
			colorName: {
				type: String,
				required: true
			},
			options: {
				type: Array,
				default: () => []
			},
			contextMenuName: {
				type: String,
				default: null
			}
		},
		emits: ['update:colorName', 'update:open'],
		setup(props) {
			const {
				isOpen,
				showPopup
			} = ui_blockDiagram.useContextMenu(props.contextMenuName);
			const {
				zoom
			} = ui_blockDiagram.useBlockDiagram();
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				isOpen,
				zoom,
				showPopup
			};
		},
		data() {
			return {
				optionElements: new Map()
			};
		},
		watch: {
			colorName(newColorName, oldColorName) {
				main_core.Dom.removeClass(this.optionElements.get(oldColorName), OPTION_ITEM_CLASS_NAMES$1.CHANGED);
				main_core.Dom.addClass(this.optionElements.get(newColorName), OPTION_ITEM_CLASS_NAMES$1.CHANGED);
			},
			options: {
				handler(newOptions, oldOptions = []) {
					oldOptions.forEach(option => this.optionElements.delete(option));
					newOptions.forEach(option => this.optionElements.set(option, this.getMenuItem(option)));
				},
				immediate: true
			},
			isOpen(isOpen) {
				this.$emit('update:open', isOpen);
			}
		},
		methods: {
			getMenuItemClassNames(colorName) {
				const classNames = [OPTION_ITEM_CLASS_NAMES$1.BASE, `--${colorName}`];
				if (this.colorName === colorName) {
					classNames.push(OPTION_ITEM_CLASS_NAMES$1.CHANGED);
				}
				return classNames.join(' ');
			},
			getMenuItem(colorName) {
				const menuItem = main_core.Tag.render`
				<button class="${this.getMenuItemClassNames(colorName)}">
					<div class="editor-chart-menu-top-btn__icon-check-wrap">
						<div
							class="ui-icon-set --circle-check editor-chart-menu-top-btn__icon-check"
							style="--ui-icon-set__icon-size: 14px;"
						>
						</div>
					</div>
				</button>
			`;
				main_core.Event.bind(menuItem, 'click', () => {
					this.$emit('update:colorName', colorName);
				});
				return menuItem;
			},
			getMenuContent() {
				const content = main_core.Tag.render`
				<div class="editor-chart-menu-top-btn__menu">
				</div>
			`;
				this.options.forEach(option => {
					main_core.Dom.append(this.optionElements.get(option), content);
				});
				return content;
			},
			onOpenColorMenu() {
				const {
					top = 0,
					left = 0
				} = this.$refs.colorMenuBtn?.$el?.getBoundingClientRect() ?? {};
				this.showPopup({
					clientX: left - OFFSET_LEFT_COLOR_MENU$1 * this.zoom,
					clientY: top - OFFSET_TOP_COLOR_MENU$1 * this.zoom
				}, {
					content: this.getMenuContent(),
					minWidth: POPUP_MIN_WIDTH$1
				});
			}
		},
		template: `
		<IconButton
			ref="colorMenuBtn"
			:active="isOpen"
			:icon-name="iconSet.PALETTE"
			:color="'var(--ui-color-palette-gray-40)'"
			@click="onOpenColorMenu"
		/>
	`
	};

	// @vue/component
	const BlockComplexPortPlaceholder = {
		name: 'block-complex-port-placeholder',
		props: {
			title: {
				type: String,
				required: true
			},
			isOutput: {
				type: Boolean,
				default: false
			}
		},
		emits: ['addPort'],
		setup() {
			const {
				newConnection
			} = ui_blockDiagram.useBlockDiagram();
			return {
				newConnection
			};
		},
		methods: {
			onMouseUp() {
				if (!this.newConnection || this.isOutput) {
					return;
				}
				this.$emit('addPort', this.title);
			}
		},
		template: `
		<div
			class="ui-block-diagram-port"
			@mouseup="onMouseUp"
		></div>
		<span
			class="complex-block-port-placeholder-title"
			:class="{ '--output': isOutput }"
		>
			{{ title }}
		</span>
	`
	};

	const OFFSET_LEFT_COLOR_MENU = 112;
	const OFFSET_TOP_COLOR_MENU = 90;
	const POPUP_MIN_WIDTH = 224;
	const TEXT_ALIGN_OPTIONS = {
		NONE: 'none',
		LEFT: 'left',
		TOP: 'top',
		BOTTOM: 'bottom',
		RIGHT: 'right'
	};
	const ALIGN_ICONS_MAP = {
		[TEXT_ALIGN_OPTIONS.NONE]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.700391"
				y="0.699902"
				width="32.9"
				height="32.9"
				rx="5.95"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				x="8.01465"
				y="24.9844"
				width="24"
				height="1.84"
				rx="0.92"
				transform="rotate(-45 8.01465 24.9844)"
				fill="#A8ADB4"
			/>
		</svg>
	`,
		[TEXT_ALIGN_OPTIONS.LEFT]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.700391"
				y="0.699902"
				width="32.9"
				height="32.9"
				rx="5.95"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				x="5.25"
				y="6.05029"
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				fill="#A8ADB4"
			/>
			<rect
				x="5.25"
				y="10.645"
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				fill="#A8ADB4"
			/>
			<rect
				x="5.25"
				y="15.2397"
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				fill="#A8ADB4"
			/>
		</svg>
	`,
		[TEXT_ALIGN_OPTIONS.TOP]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="-0.7"
				y="0.7"
				width="32.9"
				height="32.9"
				rx="5.95"
				transform="matrix(1 0 0 -1 1.40039 34.2999)"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				width="20.8359"
				height="1.84"
				rx="0.92"
				transform="matrix(1 0 0 -1 6.73242 12.853)"
				fill="#A8ADB4"
			/>
			<rect
				width="20.8359"
				height="1.84"
				rx="0.92"
				transform="matrix(1 0 0 -1 6.73242 8.27734)"
				fill="#A8ADB4"
			/>
		</svg>
	`,
		[TEXT_ALIGN_OPTIONS.BOTTOM]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.700391"
				y="0.699902"
				width="32.9"
				height="32.9"
				rx="5.95"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				x="6.73242"
				y="21.4468"
				width="20.8359"
				height="1.84"
				rx="0.92"
				fill="#A8ADB4"
			/>
			<rect
				x="6.73242"
				y="26.0225"
				width="20.8359"
				height="1.84"
				rx="0.92"
				fill="#A8ADB4"
			/>
		</svg>
	`,
		[TEXT_ALIGN_OPTIONS.RIGHT]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.7"
				y="-0.7"
				width="32.9"
				height="32.9"
				rx="5.95"
				transform="matrix(-1 0 0 1 34.3004 1.3999)"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				transform="matrix(-1 0 0 1 29.0508 6.05029)"
				fill="#A8ADB4"
			/>
			<rect
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				transform="matrix(-1 0 0 1 29.0508 10.645)"
				fill="#A8ADB4"
			/>
			<rect
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				transform="matrix(-1 0 0 1 29.0508 15.2397)"
				fill="#A8ADB4"
			/>
		</svg>
	`
	};
	const OPTION_ITEM_CLASS_NAMES = {
		BASE: 'editor-chart-text-align-menu-top-btn__item',
		CHANGED: '--changed'
	};

	// @vue/component
	const TextAlignMenuTopBtn = {
		name: 'TextAlignMenuTopBtn',
		components: {
			IconButton
		},
		props: {
			/** @type BlockFrameTextAlign */
			textAlign: {
				type: String,
				required: true
			},
			/** @type Array<BlockFrameTextAlign> */
			options: {
				type: Array,
				default: () => [TEXT_ALIGN_OPTIONS.NONE, TEXT_ALIGN_OPTIONS.LEFT, TEXT_ALIGN_OPTIONS.TOP, TEXT_ALIGN_OPTIONS.BOTTOM, TEXT_ALIGN_OPTIONS.RIGHT]
			},
			contextMenuName: {
				type: String,
				default: null
			}
		},
		emits: ['update:textAlign', 'update:open'],
		setup(props) {
			const {
				isOpen,
				showPopup
			} = ui_blockDiagram.useContextMenu(props.contextMenuName);
			const {
				zoom
			} = ui_blockDiagram.useBlockDiagram();
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				isOpen,
				zoom,
				showPopup
			};
		},
		data() {
			return {
				optionElements: new Map()
			};
		},
		watch: {
			textAlign(newColorName, oldColorName) {
				main_core.Dom.removeClass(this.optionElements.get(oldColorName), OPTION_ITEM_CLASS_NAMES.CHANGED);
				main_core.Dom.addClass(this.optionElements.get(newColorName), OPTION_ITEM_CLASS_NAMES.CHANGED);
			},
			options: {
				handler(newOptions, oldOptions = []) {
					oldOptions.forEach(option => this.optionElements.delete(option));
					newOptions.forEach(option => this.optionElements.set(option, this.getMenuItem(option)));
				},
				immediate: true
			},
			isOpen(isOpen) {
				this.$emit('update:open', isOpen);
			}
		},
		methods: {
			getMenuItemClassNames(textAlign) {
				const classNames = [OPTION_ITEM_CLASS_NAMES.BASE];
				if (this.textAlign === textAlign) {
					classNames.push(OPTION_ITEM_CLASS_NAMES.CHANGED);
				}
				return classNames.join(' ');
			},
			getMenuItem(textAlign) {
				const menuItem = main_core.Tag.render`
				<button class="${this.getMenuItemClassNames(textAlign)}">
					<div class="editor-chart-text-align-menu-top-btn__icon-wrap">
						${ALIGN_ICONS_MAP[textAlign]}
					</div>
					<div class="editor-chart-text-align-menu-top-btn__icon-check-wrap">
						<div
							class="ui-icon-set --circle-check editor-chart-text-align-menu-top-btn__icon-check"
							style="--ui-icon-set__icon-size: 14px;"
						>
						</div>
					</div>
				</button>
			`;
				main_core.Event.bind(menuItem, 'click', () => {
					this.$emit('update:textAlign', textAlign);
				});
				return menuItem;
			},
			getMenuContent() {
				const content = main_core.Tag.render`
				<div class="editor-chart-text-align-menu-top-btn__menu">
				</div>
			`;
				this.options.forEach(option => {
					main_core.Dom.append(this.optionElements.get(option), content);
				});
				return content;
			},
			onOpenMenu() {
				const {
					top = 0,
					left = 0
				} = this.$refs.alignMenuBtn?.$el?.getBoundingClientRect() ?? {};
				this.showPopup({
					clientX: left - OFFSET_LEFT_COLOR_MENU * this.zoom,
					clientY: top - OFFSET_TOP_COLOR_MENU * this.zoom
				}, {
					content: this.getMenuContent(),
					minWidth: POPUP_MIN_WIDTH
				});
			}
		},
		template: `
		<IconButton
			ref="alignMenuBtn"
			:active="isOpen"
			:icon-name="iconSet.TEXT"
			:color="'var(--ui-color-palette-gray-40)'"
			@click="onOpenMenu"
		/>
	`
	};

	const CONTENT_SEPARATOR_CLASS_NAMES = {
		base: 'chart-editor-content-separator',
		column: '--column'
	};
	const CONTENT_WRAPPER_CLASS_NAMES = {
		base: 'chart-editor-content-separator__wrapper',
		column: '--column'
	};
	const SEPARATOR_CLASS_NAMES = {
		base: 'chart-editor-content-separator__separator',
		column: '--column'
	};
	const SLOT_NAMES = {
		CONTENT: 'content',
		VIEW: 'view'
	};
	const SEPARATOR_SIZE = 13;

	// @vue/component
	const ContentSeparator = {
		name: 'ContentSeparator',
		props: {
			blockId: {
				type: String,
				required: true
			},
			width: {
				type: Number,
				default: 100
			},
			height: {
				type: Number,
				default: 100
			},
			contentPosition: {
				type: String,
				default: FRAME_TEXT_ALIGN_OPTIONS.RIGHT,
				required: true
			},
			separatorPosition: {
				type: Number,
				default: 0
			}
		},
		emits: ['update:separatorPosition'],
		setup() {
			const highlightedBlocks = ui_blockDiagram.useHighlightedBlocks();
			return {
				highlightedBlocks
			};
		},
		data() {
			return {
				isResizing: false,
				containerWidth: 0,
				containerHeight: 0,
				containerX: 0,
				containerY: 0,
				firstPartSize: 0,
				secondPartSize: 0
			};
		},
		computed: {
			isColumn() {
				return [FRAME_TEXT_ALIGN_OPTIONS.TOP, FRAME_TEXT_ALIGN_OPTIONS.BOTTOM].includes(this.contentPosition);
			},
			isNone() {
				return this.contentPosition === FRAME_TEXT_ALIGN_OPTIONS.NONE;
			},
			contentSeparatorClassNames() {
				return {
					[CONTENT_SEPARATOR_CLASS_NAMES.base]: true,
					[CONTENT_SEPARATOR_CLASS_NAMES.column]: this.isColumn
				};
			},
			contentWrapperClassNames() {
				return {
					[CONTENT_WRAPPER_CLASS_NAMES.base]: true,
					[CONTENT_WRAPPER_CLASS_NAMES.column]: this.isColumn
				};
			},
			contentSeparatorStyle() {
				return {
					width: `${this.width}px`,
					height: `${this.height}px`
				};
			},
			separatorClassNames() {
				return {
					[SEPARATOR_CLASS_NAMES.base]: true,
					[SEPARATOR_CLASS_NAMES.column]: this.isColumn
				};
			},
			firstPartSlotName() {
				return [FRAME_TEXT_ALIGN_OPTIONS.TOP, FRAME_TEXT_ALIGN_OPTIONS.LEFT].includes(this.contentPosition) ? SLOT_NAMES.CONTENT : SLOT_NAMES.VIEW;
			},
			secondPartSlotName() {
				return [FRAME_TEXT_ALIGN_OPTIONS.BOTTOM, FRAME_TEXT_ALIGN_OPTIONS.RIGHT].includes(this.contentPosition) ? SLOT_NAMES.CONTENT : SLOT_NAMES.VIEW;
			},
			firstPartStyle() {
				if (this.isColumn) {
					return {
						height: `${this.firstPartSize}%`,
						width: '100%'
					};
				}
				return {
					width: `${this.firstPartSize}%`,
					height: '100%'
				};
			},
			secondPartStyle() {
				if (this.isColumn) {
					return {
						height: `${this.secondPartSize}%`,
						width: '100%'
					};
				}
				return {
					width: `${this.secondPartSize}%`,
					height: '100%'
				};
			},
			contentNoneStyle() {
				return {
					width: `${this.containerWidth}px`,
					height: `${this.containerHeight}px`
				};
			},
			firstPartSlotWidthProp() {
				if (this.isColumn) {
					return this.containerWidth;
				}
				return this.firstPartSize;
			},
			firstPartSlotHeightProp() {
				if (this.isColumn) {
					return this.firstPartSize;
				}
				return this.containerHeight;
			},
			secondPartSlotWidthProp() {
				if (this.isColumn) {
					return this.containerWidth;
				}
				return this.secondPartSize;
			},
			secondPartSlotHeightProp() {
				if (this.isColumn) {
					return this.secondPartSize;
				}
				return this.containerHeight;
			}
		},
		watch: {
			width(newWidth, oldWidth) {
				this.containerWidth = newWidth;
				if (this.isColumn) {
					return;
				}
				const newPercent = newWidth / 100;
				const oldPercent = oldWidth / 100;
				const oldSeparatorPositionPercent = this.separatorPosition / oldPercent;
				this.$emit('update:separatorPosition', oldSeparatorPositionPercent * newPercent);
			},
			height(newHeight, oldHeight) {
				this.containerHeight = newHeight;
				if (!this.isColumn) {
					return;
				}
				const newPercent = newHeight / 100;
				const oldPercent = oldHeight / 100;
				const oldSeparatorPositionPercent = this.separatorPosition / oldPercent;
				this.$emit('update:separatorPosition', oldSeparatorPositionPercent * newPercent);
			},
			contentPosition(newContentPosition) {
				this.$nextTick(() => {
					this.setPartWheelHandlers(newContentPosition);
				});
			},
			isResizing(value) {
				if (value) {
					this.highlightedBlocks.clear();
					this.highlightedBlocks.add(this.blockId);
				}
			}
		},
		mounted() {
			this.updateContainerRect();
			this.resize(this.isColumn ? this.containerHeight : this.containerWidth, this.separatorPosition);
			this.setPartWheelHandlers(this.contentPosition);
		},
		unmounted() {
			main_core.Event.unbind(this.$refs.firstPartContainer, 'wheel', this.onWheelContent);
			main_core.Event.unbind(this.$refs.secondPartContainer, 'wheel', this.onWheelContent);
			main_core.Event.unbind(this.$refs.noneAlignPartContainer, 'wheel', this.onWheelContent);
		},
		methods: {
			setPartWheelHandlers(contentPosition) {
				const {
					firstPartContainer = null,
					secondPartContainer = null,
					noneAlignPartContainer = null
				} = this.$refs;
				const isFirstPartContainer = [FRAME_TEXT_ALIGN_OPTIONS.TOP, FRAME_TEXT_ALIGN_OPTIONS.LEFT].includes(contentPosition) && firstPartContainer !== null;
				const isSecondPartContainer = [FRAME_TEXT_ALIGN_OPTIONS.BOTTOM, FRAME_TEXT_ALIGN_OPTIONS.RIGHT].includes(contentPosition) && secondPartContainer !== null;
				main_core.Event.unbind(firstPartContainer, 'wheel', this.onWheelContent);
				main_core.Event.unbind(secondPartContainer, 'wheel', this.onWheelContent);
				main_core.Event.unbind(noneAlignPartContainer, 'wheel', this.onWheelContent);
				if (isFirstPartContainer) {
					main_core.Event.bind(firstPartContainer, 'wheel', this.onWheelContent);
				} else if (isSecondPartContainer) {
					main_core.Event.bind(secondPartContainer, 'wheel', this.onWheelContent);
				} else {
					main_core.Event.bind(noneAlignPartContainer, 'wheel', this.onWheelContent);
				}
			},
			onWheelContent(event) {
				event.stopPropagation();
			},
			resize(containerSize, cursorPosition) {
				const percent = containerSize / 100;
				const separatorSizeAsPercent = SEPARATOR_SIZE / percent;
				let preparedCursorPosition = cursorPosition < SEPARATOR_SIZE ? SEPARATOR_SIZE : cursorPosition;
				preparedCursorPosition = cursorPosition > containerSize ? containerSize : preparedCursorPosition;
				this.firstPartSize = preparedCursorPosition / percent - separatorSizeAsPercent / 2;
				this.secondPartSize = 100 - this.firstPartSize - separatorSizeAsPercent / 2;
			},
			updateContainerRect() {
				const {
					x = 0,
					y = 0,
					width = 0,
					height = 0
				} = this.$refs.containerSeparator?.getBoundingClientRect() ?? {};
				this.containerX = x;
				this.containerY = y;
				this.containerWidth = width;
				this.containerHeight = height;
			},
			emitSeparatorPosition(event) {
				const containerSize = this.isColumn ? this.containerHeight : this.containerWidth;
				let separatorPosition = this.isColumn ? event.clientY - this.containerY : event.clientX - this.containerX;
				separatorPosition = separatorPosition < SEPARATOR_SIZE ? SEPARATOR_SIZE : separatorPosition;
				separatorPosition = separatorPosition > containerSize ? containerSize : separatorPosition;
				this.$emit('update:separatorPosition', separatorPosition);
			},
			onMouseDownSeparator(event) {
				this.isResizing = true;
				main_core.Event.bind(document, 'mousemove', this.onMouseMoveSeparator);
				main_core.Event.bind(document, 'mouseup', this.onMouseUpSeparator);
				this.updateContainerRect();
				this.emitSeparatorPosition(event);
			},
			onMouseMoveSeparator(event) {
				if (!this.isResizing) {
					return;
				}
				this.resize(this.isColumn ? this.containerHeight : this.containerWidth, this.isColumn ? event.clientY - this.containerY : event.clientX - this.containerX);
				this.emitSeparatorPosition(event);
			},
			onMouseUpSeparator(event) {
				event.stopImmediatePropagation();
				main_core.Event.unbind(document, 'mousemove', this.onMouseMoveSeparator);
				main_core.Event.unbind(document, 'mouseup', this.onMouseUpSeparator);
				this.isResizing = false;
			}
		},
		template: `
		<div
			ref="containerSeparator"
			:class="contentSeparatorClassNames"
		>
			<div
				v-if="!isNone"
				:class="contentWrapperClassNames"
			>
				<div
					:style="firstPartStyle"
					ref="firstPartContainer"
					class="chart-editor-content-separator__first-part"
				>
					<slot
						:name="firstPartSlotName"
						:width="firstPartSlotWidthProp"
						:height="firstPartSlotHeightProp"
					/>
				</div>
				<div
					ref="separator"
					:class="separatorClassNames"
					@mousedown.stop="onMouseDownSeparator"
				>
				</div>
				<div
					:style="secondPartStyle"
					ref="secondPartContainer"
					class="chart-editor-content-separator__second-part"
				>
					<slot
						:name="secondPartSlotName"
						:width="secondPartSlotWidthProp"
						:height="secondPartSlotHeightProp"
					/>
				</div>
			</div>
			<div
				v-else
				:style="contentNoneStyle"
				ref="noneAlignPartContainer"
				class="chart-editor-content-separator__content"
			>
				<slot
					name="content"
					:width="containerWidth"
					:height="containerHeight"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ActivationTopBtn = {
		name: 'ActivationTopBtn',
		components: {
			IconButton
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		emits: ['changeActivation'],
		setup() {
			return {
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			activationIcon() {
				return this.block.activity.Activated === ACTIVATION_STATUS.ACTIVE ? this.iconSet.PAUSE_L : this.iconSet.PLAY_L;
			}
		},
		template: `
		<IconButton
			:icon-name="activationIcon"
			@click="$emit('changeActivation')"
		/>
	`
	};

	const OFFSET_MORE_MENU_RIGHT = 15;
	const OFFSET_MORE_MENU_TOP = 10;

	// @vue/component
	const MoreMenuTopBtn = {
		name: 'MoreMenuTopBtn',
		components: {
			IconButton
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			moreMenuItems: {
				type: Array,
				default: () => []
			}
		},
		setup(props) {
			const {
				isOpen,
				showMenu,
				closeContextMenu
			} = ui_blockDiagram.useContextMenu(getContextMenuName(props.block.id));
			const {
				zoom
			} = ui_blockDiagram.useBlockDiagram();
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				zoom,
				isOpen,
				showMenu,
				closeContextMenu
			};
		},
		methods: {
			onOpenMoreMenu() {
				const {
					top = 0,
					right = 0
				} = this.$refs.buttonMore?.$el?.getBoundingClientRect() ?? {};
				this.showMenu({
					clientX: right + OFFSET_MORE_MENU_RIGHT * this.zoom,
					clientY: top - OFFSET_MORE_MENU_TOP * this.zoom
				}, {
					items: this.moreMenuItems
				});
			}
		},
		template: `
		<IconButton
			ref="buttonMore"
			:active="isOpen"
			:size="16"
			:icon-name="iconSet.MORE_L"
			@click="onOpenMoreMenu"
		/>
	`
	};

	const DATABASE_ICON_NAME = 'DATABASE';
	const MCP_ICON_NAME = 'MCP_LETTERS';

	// @vue/component
	const BlockToolIcon = {
		name: 'BlockToolIcon',
		components: {
			BlockIcon
		},
		props: {
			iconName: {
				type: String,
				default: ''
			},
			deactivated: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				databaseIconName: DATABASE_ICON_NAME,
				mcpIconName: MCP_ICON_NAME
			};
		},
		computed: {
			preparedIconName() {
				return this.iconName === this.databaseIconName ? this.iconName : this.mcpIconName;
			}
		},
		template: `
		<BlockIcon
			:iconName="preparedIconName"
			:iconColorIndex="0"
			:deactivated="deactivated"
		/>
	`
	};

	const PROTOCOL_PREFIX = 'https:';

	// @vue/component
	const BlockToolSubIcon = {
		name: 'BlockToolSubIcon',
		components: {
			BlockIcon
		},
		props: {
			icon: {
				type: String,
				default: ''
			},
			deactivated: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			isIconUrl() {
				if (!this.icon || !main_core.Type.isString(this.icon)) {
					return false;
				}
				try {
					const u = new URL(this.icon.trim());
					return u.protocol === PROTOCOL_PREFIX;
				} catch {
					return false;
				}
			},
			subIconStyle() {
				if (!this.isIconUrl) {
					return {};
				}
				return {
					'background-image': `url('${this.icon}')`
				};
			}
		},
		template: `
		<div
			v-if="isIconUrl"
			:style="subIconStyle"
			class="ui-selector-item-avatar"
		/>
		<BlockIcon
			v-else
			:iconName="icon"
			:iconColorIndex="7"
			:iconSize="24"
			:deactivated="deactivated"
		/>
	`
	};

	const post$1 = async (action, data) => {
		const response = await main_core.ajax.runAction(`bizproc.v2.${action}`, {
			data
		});
		if (response.status === 'success') {
			return response.data;
		}
		return null;
	};
	const debugBarApi = Object.freeze({
		loadSessions: async payload => {
			const data = await post$1('DebugSession.getList', {
				templateId: payload.templateId
			});
			if (!data) {
				return null;
			}
			return Array.isArray(data) ? data : [];
		},
		loadTraces: async payload => {
			const data = await post$1('DebugTrace.getBySessionId', {
				debugSessionId: payload.debugSessionId,
				page: payload.page ?? 1
			});
			if (!data) {
				return null;
			}
			return Array.isArray(data) ? data : [];
		},
		deleteAllSessions: async () => {
			const data = await post$1('DebugSession.deleteAll', {});
			return data !== null;
		},
		enableDebug: async templateId => {
			const data = await post$1('Debug.enableForTemplate', {
				templateId
			});
			return data !== null;
		},
		disableDebug: async templateId => {
			const data = await post$1('Debug.disable', {
				templateId
			});
			return data !== null;
		},
		getDebugStatus: async templateId => {
			const response = await main_core.ajax.runAction('bizproc.v2.Debug.getStatus', {
				data: {
					templateId
				}
			});
			if (response.status === 'success' && response.data) {
				return {
					enabled: response.data.enabled === true || response.data.enabled === 'Y'
				};
			}
			return {
				enabled: false
			};
		}
	});

	const DEBUG_BAR_CONFIG = Object.freeze({
		DEFAULT_LIMIT: 50,
		DEFAULT_OFFSET: 0,
		REFRESH_INTERVAL: 5000,
		MAX_SESSIONS_DISPLAY: 100,
		DEFAULT_TRACES_PAGE_SIZE: 50
	});
	const DEBUG_BAR_ERROR_MESSAGES = Object.freeze({
		TEMPLATE_NOT_FOUND: 'BIZPROCDESIGNER_DEBUG_TEMPLATE_NOT_FOUND',
		TRACES_LOAD_ERROR: 'BIZPROCDESIGNER_DEBUG_TRACES_LOAD_ERROR',
		CLEAR_ERROR: 'BIZPROCDESIGNER_DEBUG_CLEAR_ERROR',
		SESSIONS_LOAD_ERROR: 'BIZPROCDESIGNER_DEBUG_SESSIONS_LOAD_ERROR',
		INVALID_TEMPLATE_ID: 'BIZPROCDESIGNER_DEBUG_INVALID_TEMPLATE_ID',
		STATUS_CHECK_ERROR: 'BIZPROCDESIGNER_DEBUG_STATUS_CHECK_ERROR',
		TOGGLE_ERROR: 'BIZPROCDESIGNER_DEBUG_TOGGLE_ERROR'
	});
	const DEBUG_BAR_LABELS = Object.freeze({
		TITLE: 'BIZPROCDESIGNER_DEBUG_BAR_TITLE',
		CLEAR_CONFIRM_MESSAGE: 'BIZPROCDESIGNER_DEBUG_BAR_CLEAR_CONFIRM_MESSAGE',
		CLEAR_CONFIRM_TITLE: 'BIZPROCDESIGNER_DEBUG_BAR_CLEAR_CONFIRM_TITLE',
		CLEAR_BUTTON: 'BIZPROCDESIGNER_DEBUG_BAR_CLEAR_BUTTON',
		CANCEL_BUTTON: 'BIZPROCDESIGNER_DEBUG_BAR_CANCEL_BUTTON',
		TRACES_LOADING: 'BIZPROCDESIGNER_DEBUG_BAR_TRACES_LOADING',
		TRACES_EMPTY: 'BIZPROCDESIGNER_DEBUG_BAR_TRACES_EMPTY',
		SESSIONS_EMPTY: 'BIZPROCDESIGNER_DEBUG_BAR_SESSIONS_EMPTY',
		BUTTON_ENABLE_TITLE: 'BIZPROCDESIGNER_DEBUG_BUTTON_ENABLE_TITLE',
		BUTTON_DISABLE_TITLE: 'BIZPROCDESIGNER_DEBUG_BUTTON_DISABLE_TITLE',
		LAYOUT_MAXIMIZE_TITLE: 'BIZPROCDESIGNER_DEBUG_BAR_LAYOUT_MAXIMIZE_TITLE',
		LAYOUT_MINIMIZE_TITLE: 'BIZPROCDESIGNER_DEBUG_BAR_LAYOUT_MINIMIZE_TITLE',
		LAYOUT_CLEAR_TITLE: 'BIZPROCDESIGNER_DEBUG_BAR_LAYOUT_CLEAR_TITLE',
		LAYOUT_CLOSE_TITLE: 'BIZPROCDESIGNER_DEBUG_BAR_LAYOUT_CLOSE_TITLE',
		SESSION_EXPAND_TITLE: 'BIZPROCDESIGNER_DEBUG_BAR_SESSION_EXPAND_TITLE',
		SESSION_COLLAPSE_TITLE: 'BIZPROCDESIGNER_DEBUG_BAR_SESSION_COLLAPSE_TITLE',
		SESSION_ACTIVE: 'BIZPROCDESIGNER_DEBUG_BAR_SESSION_ACTIVE',
		SESSION_FINISHED: 'BIZPROCDESIGNER_DEBUG_BAR_SESSION_FINISHED',
		LOAD_MORE_TRACES: 'BIZPROCDESIGNER_DEBUG_BAR_LOAD_MORE_TRACES'
	});

	const useToastStore = ui_vue3_pinia.defineStore('bizprocdesigner-toast-store', {
		state: () => ({
			toastQueue: []
		}),
		getters: {
			isEmpty: state => {
				return state.toastQueue.length === 0;
			},
			current: state => {
				return state.toastQueue.length > 0 ? state.toastQueue[0] : null;
			}
		},
		actions: {
			addToQueue(message) {
				this.toastQueue.push(message);
			},
			dequeue() {
				this.toastQueue.shift();
			},
			clearAllOfType(type) {
				this.toastQueue = this.toastQueue.filter(toast => toast.type !== type);
			},
			addWarning(message) {
				this.addToQueue({
					message,
					type: SHARED_TOAST_TYPES.WARNING
				});
			},
			addCustom(message, type) {
				this.addToQueue({
					message,
					type
				});
			}
		}
	});

	function formatTraceIndex(index) {
		return String(index + 1).padStart(3, '0');
	}
	function formatTimestamp(timestamp, withDate = false) {
		if (!timestamp) {
			return '-';
		}
		const date = new Date(timestamp * 1000);
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');
		const ms = String(date.getMilliseconds()).padStart(3, '0');
		const time = `${hours}:${minutes}:${seconds}.${ms}`;
		return withDate ? `${date.toLocaleDateString('ru-RU')} ${time}` : time;
	}
	function validateTemplateId(templateId) {
		if (!templateId || templateId === 0) {
			const toastStore = useToastStore();
			toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.INVALID_TEMPLATE_ID));
			return false;
		}
		return true;
	}

	function useDebugStatus() {
		const isDebugEnabled = ui_vue3.ref(false);
		const isLoading = ui_vue3.ref(false);
		const appStore = useAppStore();
		const store = diagramStore();
		const toastStore = useToastStore();
		async function checkDebugStatus(templateId) {
			if (!validateTemplateId(templateId)) {
				return;
			}
			try {
				const status = await debugBarApi.getDebugStatus(templateId);
				if (!status) {
					return;
				}
				isDebugEnabled.value = status.enabled;
			} catch {
				toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.STATUS_CHECK_ERROR));
			}
		}
		async function toggleDebug() {
			if (isLoading.value) {
				return;
			}
			isLoading.value = true;
			const templateId = store.templateId;
			try {
				if (isDebugEnabled.value && !appStore.isShownDebugBar) {
					appStore.showDebugBar();
					return;
				}
				if (!validateTemplateId(templateId, 'toggleDebug')) {
					return;
				}
				if (isDebugEnabled.value) {
					const success = await debugBarApi.disableDebug(templateId);
					if (success) {
						isDebugEnabled.value = false;
						appStore.hideDebugBar();
					} else {
						toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TOGGLE_ERROR));
					}
				} else {
					const success = await debugBarApi.enableDebug(templateId);
					if (success) {
						isDebugEnabled.value = true;
						appStore.showDebugBar();
					} else {
						toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TOGGLE_ERROR));
					}
				}
			} catch {
				toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TOGGLE_ERROR));
			} finally {
				isLoading.value = false;
			}
		}
		return {
			isDebugEnabled,
			isLoading,
			toggleDebug,
			checkDebugStatus
		};
	}

	const ToastColorScheme = {
		Warning: 'warning'
	};

	// @vue/component
	const Toast = {
		// eslint-disable-next-line vue/multi-word-component-names
		name: 'Toast',
		props: {
			colorScheme: {
				type: String,
				default: ToastColorScheme.Warning,
				validator: value => Object.values(ToastColorScheme).includes(value),
				required: false
			}
		},
		computed: {
			colorClass() {
				return `--${this.colorScheme}`;
			}
		},
		template: `
		<div class="bizprocdesigner-editor-toast" :class="colorClass">
			<slot></slot>
		</div>
	`
	};

	// @vue/component
	const ToastLayout = {
		name: 'ToastLayout',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			icon: {
				type: [String, null],
				default: null,
				required: false
			},
			message: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="editor-chart-toast-layout">
			<div class="editor-chart-toast-layout__left">
				<template v-if="icon">
					<div class="editor-chart-toast-layout__icon">
						<BIcon :name="icon" :size="28"/>
					</div>
					<div class="editor-chart-toast-layout__divider">
						<svg xmlns="http://www.w3.org/2000/svg" width="9" height="20" viewBox="0 0 9 20" fill="none">
							<rect x="4" width="1" height="20" fill="#DFE0E3"/>
						</svg>
					</div>
				</template>
				<div class="editor-chart-toast-layout__content">
					<div class="editor-chart-toast-layout__content__message">
						{{ message }}
					</div>
					<div v-if="$slots.contentEnd"
						class="editor-chart-toast-layout__content__end"
					>
						<slot name="contentEnd"></slot>
					</div>
				</div>
			</div>
			<div class="editor-chart-toast-layout__right">
				<slot name="right"></slot>
			</div>
		</div>
	`
	};

	// @vue/component
	const ToastCloseButton = {
		name: 'ToastCloseButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline
		},
		methods: {
			...ui_vue3_pinia.mapActions(useToastStore, ['dequeue']),
			onClick() {
				this.dequeue();
			}
		},
		template: `
		<button class="editor-chart-toast-close-button"
			 @click="onClick"
		>
			<BIcon :name="Outline.CROSS_L" :size="20"></BIcon>
		</button>
	`
	};

	// @vue/component
	const ToastWarning = {
		name: 'ToastWarning',
		components: {
			Toast,
			ToastLayout,
			ToastCloseButton
		},
		props: {
			message: {
				type: String,
				required: true
			},
			closeable: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			ToastColorScheme: () => ToastColorScheme,
			Outline: () => ui_iconSet_api_core.Outline
		},
		template: `
		<Toast :color-scheme="ToastColorScheme.Warning">
			<ToastLayout
				:icon="Outline.ALERT_ACCENT"
				:message="message"
			>

				<template #contentEnd>
					<slot name="contentEnd"></slot>
				</template>

				<template v-if="closeable" #right>
					<ToastCloseButton/>
				</template>

			</ToastLayout>
		</Toast>
	`
	};

	const post = async (action, data) => {
		const response = await main_core.ajax.runAction(`bizprocdesigner.v2.${action}`, {
			method: 'POST',
			json: data
		});
		if (response.status === 'success') {
			return response.data;
		}
		return null;
	};
	const complexNodeApi = Object.freeze({
		loadSettings: async activity => {
			const data = await post('Activity.Complex.loadSettings', {
				activity
			});
			if (!data) {
				return null;
			}
			return data;
		},
		saveSettings: async (settings, activity, documentType) => {
			const nodeSettingsPayload = {
				...settings,
				rules: Object.fromEntries(settings.rules),
				actions: Object.fromEntries(settings.actions)
			};
			const data = await post('Activity.Complex.saveSettings', {
				saveSettingsRequest: nodeSettingsPayload,
				activity,
				documentType
			});
			if (!data?.activity) {
				return null;
			}
			return data.activity;
		},
		saveRuleSettings: async (rule, documentType) => {
			const data = await post('Activity.Complex.saveRule', {
				portRule: rule,
				documentType
			});
			if (!data) {
				return null;
			}
			return data;
		}
	});

	const CONSTRUCTION_TYPES = Object.freeze({
		IF_CONDITION: 'condition:if',
		AND_CONDITION: 'condition:and',
		OR_CONDITION: 'condition:or',
		ACTION: 'action',
		OUTPUT: 'output'
	});
	const CONSTRUCTION_LABELS = Object.freeze({
		[CONSTRUCTION_TYPES.IF_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_IF_CONDITION',
		[CONSTRUCTION_TYPES.AND_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AND_CONDITION',
		[CONSTRUCTION_TYPES.OR_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OR_CONDITION',
		[CONSTRUCTION_TYPES.ACTION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION',
		[CONSTRUCTION_TYPES.OUTPUT]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT'
	});
	const GENERAL_CONSTRUCTION_TYPES = Object.freeze({
		[CONSTRUCTION_TYPES.IF_CONDITION]: 'condition',
		[CONSTRUCTION_TYPES.AND_CONDITION]: 'condition',
		[CONSTRUCTION_TYPES.OR_CONDITION]: 'condition',
		[CONSTRUCTION_TYPES.ACTION]: 'action',
		[CONSTRUCTION_TYPES.OUTPUT]: 'output'
	});
	const CONSTRUCTION_OPERATORS = Object.freeze({
		equal: '=',
		notEqual: '!=',
		empty: 'empty',
		notEmpty: '!empty',
		contain: 'contain',
		notContain: '!contain',
		in: 'in',
		notIn: '!in',
		greaterThan: '>',
		greaterThanOrEqual: '>=',
		lessThan: '<',
		lessThanOrEqual: '<='
	});
	const FIELD_OBJECT_TYPES = Object.freeze({
		DOCUMENT: 'Document',
		CONSTANT: 'Constant',
		PARAMETER: 'Template',
		VARIABLE: 'Variable'
	});
	const EVENT_NAMES = Object.freeze({
		BEFORE_SUBMIT_EVENT: 'BizprocDesigner.NodeSettings.BeforeSubmit'
	});

	const generateNextInputPortId = ports => {
		const nextPortNumber = ports.reduce((acc, currentValue) => Math.max(acc, parseInt(currentValue.id.slice(1), 10)), 0) + 1;
		return `i${nextPortNumber}`;
	};
	const evaluateConditionExpressionFieldTitle = (connectedBlocks, field) => {
		const store = diagramStore();
		const {
			object,
			fieldId
		} = field;
		const fieldIdParts = fieldId.split('.');
		const fieldIdProperty = fieldIdParts[0] ?? null;
		const makeTitle = parts => parts.filter(Boolean).join(' / ');
		const failoverTitle = makeTitle([object, fieldId]);

		/** @todo optimize this logic later */
		if (!Object.values(FIELD_OBJECT_TYPES).includes(object)) {
			const {
				block: foundBlock,
				activity: foundActivity
			} = findBlockAndActivityByName(connectedBlocks, object);
			if (!foundBlock || !foundActivity) {
				return failoverTitle;
			}
			const foundProperty = (foundActivity.ReturnProperties ?? []).find(prop => prop.Id === fieldIdProperty);
			if (!foundProperty) {
				return failoverTitle;
			}
			return makeTitle([foundActivity.Properties?.Title ?? foundBlock.node.title, foundProperty.Name, ...fieldIdParts.slice(1)]);
		}
		const map = [{
			key: 'PARAMETERS',
			idKey: 'Template',
			title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_PARAMETER_OBJECT')
		}, {
			key: 'VARIABLES',
			idKey: 'Variable',
			title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_VARIABLE_OBJECT')
		}, {
			key: 'CONSTANTS',
			idKey: 'Constant',
			title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD_CONSTANT_OBJECT')
		}];
		const foundObject = map.find(elem => elem.idKey === object);
		if (!foundObject) {
			return failoverTitle;
		}
		const fieldName = (store.template[foundObject.key] ?? {})[fieldId]?.Name;
		if (fieldName) {
			return makeTitle([foundObject.title, fieldName]);
		}
		return failoverTitle;
	};
	const isActionExpressionDocumentCorrect = (connectedBlocks, document) => {
		if (!document) {
			return false;
		}
		const {
			block,
			activity,
			field
		} = extractFieldFromDocumentExpression(connectedBlocks, document);
		return block && activity && field;
	};
	const evaluateActionExpressionDocumentTitle = (connectedBlocks, document) => {
		if (!document) {
			return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
		}
		const {
			block: foundBlock,
			activity: foundActivity,
			field: property
		} = extractFieldFromDocumentExpression(connectedBlocks, document);
		if (!property) {
			return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_UNKNOWN_DOCUMENT');
		}
		const objectTitle = foundActivity.Properties?.Title ?? foundBlock.node.title;
		return `${property.Name} (${objectTitle})`;
	};
	function findBlockAndActivityByName(connectedBlocks, name) {
		for (const block of connectedBlocks) {
			const {
				activity
			} = block;
			if (activity?.Name === name) {
				return {
					block,
					activity
				};
			}
			if (!main_core.Type.isArrayFilled(activity?.Children)) {
				continue;
			}
			const childrenActivity = activity.Children.find(child => {
				return child.Name === name;
			});
			if (childrenActivity) {
				return {
					block,
					activity: childrenActivity
				};
			}
		}
		return {
			block: null,
			activity: null
		};
	}
	function getActivityNameAndFieldIdFromDocumentExpression(documentExpression) {
		if (!main_core.Type.isStringFilled(documentExpression)) {
			return [];
		}
		return documentExpression.replaceAll(/^{=|}$/g, '').split(':', 2);
	}
	function extractFieldFromDocumentExpression(connectedBlocks, documentExpression) {
		const [activityName, fieldId] = getActivityNameAndFieldIdFromDocumentExpression(documentExpression);
		if (!main_core.Type.isStringFilled(activityName) || !main_core.Type.isStringFilled(fieldId)) {
			return {
				block: null,
				activity: null,
				field: null
			};
		}
		const {
			block,
			activity
		} = findBlockAndActivityByName(connectedBlocks, activityName);
		if (!activity || !block) {
			return {
				block: null,
				activity: null,
				field: null
			};
		}
		const field = (activity.ReturnProperties ?? []).find(prop => prop.Id === fieldId);
		if (!field) {
			return {
				block: null,
				activity: null,
				field: null
			};
		}
		return {
			block,
			activity,
			field
		};
	}
	const evaluateActionExpressionDocumentType = (connectedBlocks, documentExpression) => {
		const {
			field
		} = extractFieldFromDocumentExpression(connectedBlocks, documentExpression);
		return field?.Type === PROPERTY_TYPES.DOCUMENT && main_core.Type.isArrayFilled(field.Default) ? field.Default : [];
	};

	const PORT_POSITIONS = Object.freeze({
		left: 'left',
		right: 'right'
	});
	const useNodeSettingsStore = ui_vue3_pinia.defineStore('bizprocdesigner-editor-node-settings', {
		state: () => ({
			isLoading: false,
			isSaving: false,
			isShown: false,
			isRuleSettingsShown: false,
			currentRule: null,
			prevSavedNodeSettings: null,
			ports: null,
			nodeSettings: null,
			block: null,
			lastFetchId: 0
		}),
		getters: {
			currentSettingsItems: state => {
				return state.currentRule.type === PORT_TYPES.input ? state.nodeSettings.rules : state.nodeSettings.relations;
			},
			inputPorts: state => {
				return state.ports.filter(port => port.type === PORT_TYPES.input || port.type === PORT_TYPES.inputRelation);
			}
		},
		actions: {
			async fetchNodeSettings(block) {
				const fetchId = ++this.lastFetchId;
				this.nodeSettings = {
					title: block.node.title,
					description: '',
					rules: new Map(),
					relations: new Map(),
					blockId: block.id
				};
				this.isLoading = true;
				const {
					actions,
					rules,
					fixedDocumentType,
					title: loadedTitle,
					description
				} = await complexNodeApi.loadSettings(block.activity);
				if (this.lastFetchId !== fetchId || !this.nodeSettings) {
					return;
				}
				if (main_core.Type.isStringFilled(loadedTitle)) {
					this.nodeSettings.title = loadedTitle;
				}
				this.nodeSettings = {
					...this.nodeSettings,
					actions: new Map(Object.entries(actions)),
					rules: new Map(Object.entries(rules).map(([id, rule]) => {
						return [id, {
							...rule,
							isFilled: rule.ruleCards.some(ruleCard => {
								return ruleCard.constructions?.length > 0;
							})
						}];
					})),
					fixedDocumentType,
					description
				};
				this.prevSavedNodeSettings = main_core.Runtime.clone(this.nodeSettings);
				this.ports = block.ports.map(port => ({
					...port
				})).sort((a, b) => {
					const {
						id: aId
					} = parsePortTitle(a.title);
					const {
						id: bId
					} = parsePortTitle(b.title);
					return aId - bId;
				});
				const rulesIds = new Set(this.nodeSettings.rules.keys());
				this.ports.forEach(port => {
					if (port.type === PORT_TYPES.input && !rulesIds.has(port.id)) {
						this.addRule(port.id);
						return;
					}
					if (port.type === PORT_TYPES.inputRelation) {
						this.addRelation(port.id);
					}
				});
				this.block = block;
				this.isLoading = false;
			},
			isCurrentBlock(blockId) {
				return this.nodeSettings?.blockId === blockId;
			},
			reset() {
				this.currentRule = null;
				this.nodeSettings = null;
				this.block = null;
				this.ports = null;
			},
			toggleVisibility(isShown) {
				this.isShown = isShown;
			},
			toggleRuleSettingsVisibility(isShown) {
				this.isRuleSettingsShown = isShown;
			},
			setCurrentRule(port) {
				this.currentRule = port;
			},
			addRule(portId) {
				const nextPortId = portId ?? generateNextInputPortId(this.inputPorts);
				this.nodeSettings.rules.set(nextPortId, {
					isFilled: false,
					portId: nextPortId,
					ruleCards: []
				});
				return nextPortId;
			},
			addRelation(portId) {
				const nextPortId = portId ?? generateNextInputPortId(this.inputPorts);
				this.nodeSettings.relations.set(nextPortId, {
					isFilled: false,
					portId: nextPortId,
					ruleCards: []
				});
				return nextPortId;
			},
			addConstruction(ruleCard, constructionType, position) {
				const newConstruction = {
					id: createUniqueId(),
					type: constructionType,
					expression: {
						title: '',
						valueId: '',
						value: ''
					}
				};
				if (constructionType === CONSTRUCTION_TYPES.ACTION) {
					newConstruction.expression.value = {};
					newConstruction.expression.actionId = '';
				} else {
					newConstruction.expression.operator = '';
					newConstruction.expression.field = null;
				}
				if (constructionType === CONSTRUCTION_TYPES.OUTPUT) {
					newConstruction.expression = {
						portId: null,
						title: null
					};
				}
				const pos = position ?? ruleCard.constructions.length;
				ruleCard.constructions.splice(pos, 0, newConstruction);
			},
			deleteConstruction(ruleCard, construction) {
				ruleCard.constructions.splice(ruleCard.constructions.indexOf(construction), 1);
				if (ruleCard.constructions.length === 0) {
					this.deleteRuleCard(ruleCard);
				}
			},
			deleteRuleSettings(ruleId) {
				this.currentSettingsItems.delete(ruleId);
				return this.syncOutputPortsWithRules();
			},
			selectBooleanType(construction, type) {
				Object.assign(construction, {
					type
				});
			},
			changeRuleExpression(construction, props) {
				Object.assign(construction.expression, props);
			},
			deleteRuleCard(ruleCard) {
				const rule = this.currentSettingsItems.get(this.currentRule.id);
				rule.ruleCards.splice(rule.ruleCards.indexOf(ruleCard), 1);
			},
			addRuleCard() {
				const rule = this.currentSettingsItems.get(this.currentRule.id);
				const ruleCard = {
					id: createUniqueId(),
					constructions: []
				};
				rule.ruleCards.push(ruleCard);
				return ruleCard;
			},
			reorder(payload) {
				const {
					draggedId,
					targetId,
					insertion,
					ruleCardId
				} = payload;
				const rule = this.currentSettingsItems.get(this.currentRule.id);
				let collection = rule.ruleCards;
				if (ruleCardId) {
					const ruleCard = rule.ruleCards.find(currentRuleCard => currentRuleCard.id === ruleCardId);
					collection = ruleCard.constructions;
				}
				const draggedItem = collection.find(item => item.id === draggedId);
				const targetItem = collection.find(item => item.id === targetId);
				const draggedIndex = collection.indexOf(draggedItem);
				collection.splice(draggedIndex, 1);
				const targetIndex = collection.indexOf(targetItem);
				const newDraggedIndex = insertion === 'over' ? targetIndex : targetIndex + 1;
				collection.splice(newDraggedIndex, 0, draggedItem);
			},
			async savePortRule(ruleId, documentType) {
				const rule = this.nodeSettings.rules.get(ruleId);
				if (!rule) {
					return null;
				}
				const transformedPortRule = await complexNodeApi.saveRuleSettings(rule, documentType);
				transformedPortRule.isFilled = transformedPortRule.ruleCards.some(ruleCard => {
					return ruleCard.constructions?.length > 0;
				});
				this.nodeSettings.rules.set(ruleId, transformedPortRule);
				this.prevSavedNodeSettings.rules.set(ruleId, main_core.Runtime.clone(transformedPortRule));
				return this.syncOutputPortsWithRules();
			},
			syncOutputPortsWithRules() {
				if (!this.block) {
					return null;
				}
				const outputConstructions = [...this.currentSettingsItems.values()].flatMap(r => {
					return r.ruleCards.flatMap(ruleCard => {
						return ruleCard.constructions.filter(construction => construction.type === CONSTRUCTION_TYPES.OUTPUT);
					});
				});
				const outputType = this.currentRule.type === PORT_TYPES.input ? PORT_TYPES.output : PORT_TYPES.outputRelation;
				const allExistingOutputPortIds = new Set(this.ports.filter(port => port.type === outputType).map(port => port.id));
				const toDeletePortIds = new Set(allExistingOutputPortIds);
				const toAddPortsMap = new Map();
				outputConstructions.forEach(construction => {
					const {
						portId,
						title
					} = construction.expression;
					if (!portId || !title) {
						return;
					}
					const isPortExist = allExistingOutputPortIds.has(portId);
					if (!isPortExist) {
						toAddPortsMap.set(portId, {
							portId,
							title
						});
					}
					toDeletePortIds.delete(portId);
				});
				return {
					outputPortsToAdd: toAddPortsMap,
					outputPortsToDelete: toDeletePortIds
				};
			},
			async saveRule(documentType) {
				const {
					outputPortsToAdd,
					outputPortsToDelete
				} = await this.savePortRule(this.currentRule.id, documentType);
				this.toggleRuleSettingsVisibility(false);
				outputPortsToAdd.forEach(({
					portId,
					title
				}) => {
					this.addRulePort(portId, PORT_TYPES.output, title);
				});
				outputPortsToDelete.forEach(portId => {
					this.deletePort(portId);
				});
				const auxSync = this.syncAuxPortsWithActions();
				auxSync?.auxPortsToAdd.forEach(({
					portId,
					title
				}) => {
					this.addAuxPort(portId, title);
				});
				auxSync?.auxPortsToActivate?.forEach(portId => {
					this.activatePort(portId);
				});
			},
			async saveRelation() {
				await new Promise(resolve => {
					setTimeout(resolve, 2000);
				});
				const rule = this.nodeSettings.relations.get(this.currentRule.id);
				rule.isFilled = true;
				this.toggleRuleSettingsVisibility(false);
				const {
					outputPortsToAdd,
					outputPortsToDelete
				} = this.syncOutputPortsWithRules();
				outputPortsToAdd.forEach(({
					portId,
					title
				}) => {
					this.addRelationPort(portId, PORT_TYPES.outputRelation, title);
				});
				outputPortsToDelete.forEach(portId => {
					this.deletePort(portId);
				});
			},
			async saveForm(documentType) {
				try {
					return await complexNodeApi.saveSettings(this.nodeSettings, this.block.activity, documentType);
				} catch (e) {
					console.error(e);
					throw e;
				}
			},
			discardFormSettings() {
				this.nodeSettings = main_core.Runtime.clone(this.prevSavedNodeSettings);
			},
			discardRuleSettings() {
				const {
					rules: prevSavedRules,
					relations: prevSavedRelations
				} = this.prevSavedNodeSettings;
				const prevSavedItems = this.currentRule.type === PORT_TYPES.input ? prevSavedRules : prevSavedRelations;
				if (!prevSavedItems.has(this.currentRule.id)) {
					const currentRule = this.currentSettingsItems.get(this.currentRule.id);
					currentRule.isFilled = false;
					currentRule.ruleCards = [];
					return;
				}
				const copyItem = main_core.Runtime.clone(prevSavedItems.get(this.currentRule.id));
				this.currentSettingsItems.set(this.currentRule.id, copyItem);
			},
			createPort(ports, {
				portId,
				type,
				label,
				portTitle
			}) {
				const lastPort = ports[ports.length - 1] ?? null;
				const [, count] = lastPort?.title?.split(label) ?? [];
				const title = portTitle ?? `${label}${Number(count ?? 0) + 1}`;
				const leftInputPortTypes = new Set([PORT_TYPES.input, PORT_TYPES.inputRelation]);
				return {
					id: portId,
					title,
					type,
					position: leftInputPortTypes.has(type) ? PORT_POSITIONS.left : PORT_POSITIONS.right
				};
			},
			addRulePort(portId, type, portTitle) {
				if (![PORT_TYPES.input, PORT_TYPES.output].includes(type)) {
					return;
				}
				const currentPorts = this.ports.filter(port => port.type === type);
				const label = type === PORT_TYPES.input ? COMPLEX_NODE_PORT_LABELS.inputRule : COMPLEX_NODE_PORT_LABELS.outputRule;
				const port = this.createPort(currentPorts, {
					portId,
					type,
					label,
					portTitle
				});
				const addedPortId = parsePortTitle(port.title).id;
				for (let i = currentPorts.length - 1; i >= 0; i--) {
					const currentPortId = parsePortTitle(currentPorts[i].title).id;
					if (currentPortId < addedPortId) {
						this.ports.splice(this.ports.indexOf(currentPorts[i]) + 1, 0, port);
						return;
					}
				}
				this.ports.unshift(port);
			},
			addRelationPort(portId, type) {
				if (![PORT_TYPES.inputRelation, PORT_TYPES.outputRelation].includes(type)) {
					return;
				}
				const relationPorts = type === PORT_TYPES.inputRelation ? this.ports.filter(port => port.type === PORT_TYPES.inputRelation) : this.ports.filter(port => port.type === PORT_TYPES.outputRelation);
				const port = this.createPort(relationPorts, {
					portId,
					type,
					label: COMPLEX_NODE_PORT_LABELS.relation
				});
				this.ports.push({
					...port
				});
			},
			deletePort(portId) {
				const deletedPort = this.ports.find(port => port.id === portId);
				if (!deletedPort) {
					return;
				}
				if (deletedPort.type === PORT_TYPES.aux) {
					deletedPort.isActive = false;
					this.resetAuxPortReferencesInRules(portId);
					return;
				}
				this.ports.splice(this.ports.indexOf(deletedPort), 1);
			},
			activatePort(portId) {
				const port = this.ports.find(p => p.id === portId);
				if (port) {
					port.isActive = true;
				}
			},
			resetAuxPortReferencesInRules(portId) {
				if (!this.nodeSettings?.rules) {
					return;
				}
				this.nodeSettings.rules.forEach(rule => {
					rule.ruleCards.forEach(ruleCard => {
						ruleCard.constructions.forEach(construction => {
							if (construction.type === CONSTRUCTION_TYPES.ACTION && construction.expression?.auxPortId === portId) {
								construction.expression.auxPortId = null;
								construction.expression.auxPortTitle = null;
							}
						});
					});
				});
			},
			syncAuxPortsWithActions() {
				if (!this.block) {
					return null;
				}
				const actionConstructions = [...this.nodeSettings.rules.values()].flatMap(r => {
					return r.ruleCards.flatMap(ruleCard => {
						return ruleCard.constructions.filter(construction => construction.type === CONSTRUCTION_TYPES.ACTION && construction.expression.auxPortId);
					});
				});
				const existingAuxPorts = new Map(this.ports.filter(port => port.type === PORT_TYPES.aux).map(port => [port.id, port]));
				const toAddPortsMap = new Map();
				const toActivatePortIds = new Set();
				actionConstructions.forEach(construction => {
					const {
						auxPortId,
						auxPortTitle
					} = construction.expression;
					if (!auxPortId || !auxPortTitle) {
						return;
					}
					const existingPort = existingAuxPorts.get(auxPortId);
					if (!existingPort) {
						toAddPortsMap.set(auxPortId, {
							portId: auxPortId,
							title: auxPortTitle
						});
						return;
					}
					if (existingPort.isActive === false) {
						toActivatePortIds.add(auxPortId);
					}
				});
				return {
					auxPortsToAdd: toAddPortsMap,
					auxPortsToActivate: toActivatePortIds
				};
			},
			addAuxPort(portId, portTitle) {
				const auxPorts = this.ports.filter(port => port.type === PORT_TYPES.aux);
				const label = COMPLEX_NODE_PORT_LABELS.aux;
				const port = this.createPort(auxPorts, {
					portId,
					type: PORT_TYPES.aux,
					label,
					portTitle
				});
				this.ports.push(port);
			}
		}
	});

	// @vue/component
	const NodeSettingsLayout = {
		name: 'NodeSettingsLayout',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			isLoading: {
				type: Boolean,
				required: true
			},
			isSaving: {
				type: Boolean,
				required: true
			},
			isShown: {
				type: Boolean,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		template: `
		<div
			v-if="isShown"
			class="editor-chart-node-settings"
			:class="{ '--saving': isSaving, '--loading': isLoading }"
		>
			<template v-if="!isLoading">
				<div class="editor-chart-node-settings__header">
					<span>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TITLE') }}</span>
					<BIcon
						class="editor-chart-node-settings__header_close-icon"
						name="cross-m"
						:size="20"
						:data-test-id="$testId('complexNodeSettingsClose')"
						color="#828b95"
						@click="$emit('close')"
					/>
				</div>
				<slot />
			</template>
			<div class="editor-chart-node-settings__footer">
				<slot
					v-if="!isLoading"
					name="actions"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const NodeSettingsPreview = {
		name: 'NodeSettingsPreview',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type Port */
			port: {
				type: Object,
				required: true
			},
			/** @type NodeSettings */
			nodeSettings: {
				type: Object,
				required: true
			},
			/** @type Array<Block> */
			connectedBlocks: {
				type: Array,
				required: true
			}
		},
		emits: ['showConstructions', 'deletePreview'],
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		computed: {
			previewItem() {
				return this.port.type === PORT_TYPES.input ? this.nodeSettings.rules.get(this.port.id) : this.nodeSettings.relations.get(this.port.id);
			},
			isFilled() {
				return this.previewItem?.isFilled ?? false;
			},
			constructionLabels() {
				return CONSTRUCTION_LABELS;
			},
			generalConstructionTypes() {
				return GENERAL_CONSTRUCTION_TYPES;
			},
			ifLabel() {
				return this.getMessage(CONSTRUCTION_LABELS['condition:if']);
			},
			cards() {
				return this.previewItem.ruleCards;
			}
		},
		methods: {
			onPreviewClick() {
				this.$emit('showConstructions');
			},
			onDeletePreview() {
				this.$emit('deletePreview');
			},
			getExpressionTitle({
				expression,
				type
			}) {
				if (type === GENERAL_CONSTRUCTION_TYPES.action) {
					if (!expression.actionId) {
						return '';
					}
					return this.nodeSettings.actions.get(expression.actionId).title;
				}
				if (type === GENERAL_CONSTRUCTION_TYPES.output || !expression.field) {
					return '';
				}
				return evaluateConditionExpressionFieldTitle(this.connectedBlocks, expression.field);
			},
			getExpressionValue({
				expression: {
					value,
					title
				},
				type
			}) {
				if (type === GENERAL_CONSTRUCTION_TYPES.output) {
					return title;
				}
				return value;
			}
		},
		template: `
		<div
			class="editor-chart-node-settings-preview"
			:data-test-id="$testId('complexNodeSettingsPreview', port.id)"
			@click="onPreviewClick"
		>
			<BIcon
				class="editor-chart-node-settings-preview__dnd-icon"
				:size="20"
				name="drag-m"
				color="#828b95"
			/>
			<span class="editor-chart-node-settings-preview__title">
				<slot />
			</span>
			<div
				v-if="isFilled"
				class="editor-chart-node-settings-preview__card-container"
			>
				<div
					v-for="card in cards"
					:key="card.id"
					class="editor-chart-node-settings-preview__card"
				>
					<div
						v-for="construction in card.constructions"
						:key="construction.id"
						class="editor-chart-node-settings-preview__construction"
						:class="['--' + generalConstructionTypes[construction.type]]"
						:data-if-indent="ifLabel"
					>
						<span class="editor-chart-node-settings-preview__construction_type">
							{{ getMessage(constructionLabels[construction.type]) }}
						</span>
						<span class="editor-chart-node-settings-preview__expression-part">
							{{ getExpressionTitle(construction) }}
						</span>
						<span
							v-if="construction.expression.operator"
							class="editor-chart-node-settings-preview__expression-part"
						>
							{{ construction.expression.operator }}
						</span>
						<span
							v-if="generalConstructionTypes[construction.type] !== generalConstructionTypes.action"
							class="editor-chart-node-settings-preview__expression-part"
						>
							{{ getExpressionValue(construction) }}
						</span>
					</div>
				</div>
			</div>
			<span
				class="editor-chart-node-settings-preview__construction --empty"
				v-else
			>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY') }}
			</span>
			<div class="editor-chart-node-settings-preview__actions">
				<BIcon
					:size="20"
					class="editor-chart-node-settings-preview__edit-icon"
					name="edit-m"
					color="#c9ccd0"
				/>
				<BIcon
					class="editor-chart-node-settings-preview__close-icon"
					name="cross-m"
					:size="20"
					:data-test-id="$testId('complexNodeSettingsPreview', port.id, 'delete')"
					color="#c9ccd0"
					@click.stop="onDeletePreview"
				/>
			</div>
		</div>
	`
	};

	const DRAG_ENTITIES = Object.freeze({
		ruleConstruction: 'rule-construction',
		ruleCard: 'rule-card'
	});
	const INSERTION = Object.freeze({
		over: 'over',
		under: 'under'
	});
	const createGhost = el => {
		const ghost = el.cloneNode(true);
		main_core.Dom.style(ghost, {
			position: 'fixed',
			left: '-100%',
			top: '-100%',
			width: `${el.offsetWidth}px`,
			height: `${el.offsetHeight}px`
		});
		main_core.Dom.append(ghost, el.parentElement);
		return ghost;
	};
	const checkForDragTarget = (draggedItem, event) => {
		const closestNode = event.target.closest(`[data-name=${draggedItem.dataset.name}]`);
		const isDragAllowed = closestNode && closestNode !== draggedItem && closestNode.parentElement === draggedItem.parentElement;
		if (isDragAllowed) {
			return closestNode;
		}
		return null;
	};
	const dragStartHandler = (dragStartEvent, onDrop) => {
		const {
			dataTransfer,
			currentTarget: container,
			target
		} = dragStartEvent;
		const draggedItem = target.closest(`[data-name=${DRAG_ENTITIES.ruleConstruction}], [data-name=${DRAG_ENTITIES.ruleCard}]`);
		const ghost = createGhost(draggedItem);
		let dragTarget = null;
		dataTransfer.setDragImage(ghost, 0, 0);
		dataTransfer.effectAllowed = 'move';
		const handlers = {
			dragover: dragOverEvent => {
				dragTarget = checkForDragTarget(draggedItem, dragOverEvent);
				if (dragTarget) {
					dragOverEvent.preventDefault();
				}
			},
			dragend: () => {
				main_core.Dom.remove(ghost);
				entries.forEach(([currentEvent, handler]) => {
					main_core.Event.unbind(container, currentEvent, handler);
				});
			},
			dragenter: dragEnterEvent => {
				if (dragTarget) {
					dragEnterEvent.preventDefault();
				}
			},
			drop: dropEvent => {
				if (!dragTarget) {
					return;
				}
				const {
					top
				} = dragTarget.getBoundingClientRect();
				const insertion = dropEvent.clientY < top + dragTarget.offsetHeight / 2 ? INSERTION.over : INSERTION.under;
				const payload = {
					draggedId: draggedItem.dataset.id,
					targetId: dragTarget.dataset.id,
					insertion
				};
				if (draggedItem.dataset.ruleCardId) {
					payload.ruleCardId = draggedItem.dataset.ruleCardId;
				}
				onDrop(payload);
			}
		};
		const entries = Object.entries(handlers);
		entries.forEach(([currentEvent, handler]) => {
			main_core.Event.bind(container, currentEvent, handler);
		});
	};
	const DragRuleEntity = {
		mounted(el, {
			value: onDrop
		}) {
			main_core.Event.bind(el, 'dragstart', event => {
				dragStartHandler(event, onDrop);
			});
		},
		unmounted(el) {
			main_core.Event.unbindAll(el, 'dragstart');
		}
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const NodeSettingsRulesLayout = {
		name: 'NodeSettingsRulesLayout',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			'drag-construction': DragRuleEntity
		},
		props: {
			/** @type NodeSettings */
			nodeSettings: {
				type: Object,
				required: true
			},
			/** @type Port */
			currentRule: {
				type: [Object, null],
				required: true
			},
			isSaving: {
				type: Boolean,
				required: true
			},
			isShown: {
				type: Boolean,
				required: true
			}
		},
		emits: ['close', 'drop', 'scroll-layout'],
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		computed: {
			ruleCards() {
				const store = this.currentRule.type === PORT_TYPES.input ? this.nodeSettings.rules : this.nodeSettings.relations;
				return store.get(this.currentRule.id).ruleCards;
			}
		},
		methods: {
			onDrop(payload) {
				this.$emit('drop', payload);
			}
		},
		template: `
		<transition-group name="slide-rules-panel">
			<div
				v-if="isShown"
				class="editor-chart-node-settings-rules-panel"
				:class="{ '--saving': isSaving }"
			>
				<div class="editor-chart-node-settings-rules-panel__header">
					<BIcon
						:size="20"
						:data-test-id="$testId('complexNodeRuleSettingsClose')"
						name="arrow-left-l"
						color="#828b95"
						class="editor-chart-node-settings-rules-panel__header_back"
						@click="$emit('close')"
					/>
					<span class="editor-chart-node-settings-rules-panel__header_label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULES_LAYOUT_TITLE') }}
					</span>
					<slot name="rules-dropdown" />
				</div>
				<div
					class="editor-chart-node-settings-rules-panel__content"
					v-drag-construction="onDrop"
					@scroll="$emit('scroll-layout')"
				>
					<slot
						v-for="ruleCard in ruleCards"
						:key="ruleCard.id"
						:ruleCard="ruleCard"
						name="ruleCard"
					/>
					<slot v-if="ruleCards.length === 0"
						name="addRuleCardButton"
					/>
				</div>
				<div class="editor-chart-node-settings-rules-panel__footer">
					<slot name="actions" />
				</div>
			</div>
			<div
				v-if="isShown"
				class="editor-chart-node-settings-rules-layout__back"
			></div>
		</transition-group>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const RuleCard = {
		name: 'RuleCard',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type TRuleCard */
			ruleCard: {
				type: Object,
				required: true
			}
		},
		created() {
			this.iconColor = 'var(--ui-color-palette-gray-50)';
		},
		template: `
		<div
			data-name="rule-card"
			class="editor-chart-node-settings-rule-card"
			:data-id="ruleCard.id"
		>
			<div class="editor-chart-node-settings-rule-card__top">
				<BIcon
					name="drag-s"
					class="editor-chart-node-settings-rule-card__dnd-icon"
					draggable="true"
					:color="iconColor"
				/>
				<slot name="deleteRuleCard" />
				<!--
				<div class="editor-chart-node-settings-rule-card__top_delimeter"></div>
				<BIcon
					:size="20"
					name="o-question"
					:color="iconColor"
				/>
				-->
			</div>
			<slot
				v-for="(construction, index) in ruleCard.constructions"
				:key="construction.id"
				:construction="construction"
				:position="index"
			/>
			<slot
				name="addConstructionButton"
			/>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	const RULE_CONSTRUCTION_MODES = {
		expert: 'expert'
	};
	const ICON_COLORS$1 = {
		condition: '#b7d7ff',
		action: '#4de39e',
		output: '#d5d7db'
	};

	// @vue/component
	const RuleConstruction = {
		name: 'RuleConstruction',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type Construction */
			construction: {
				type: Object,
				required: true
			},
			position: {
				type: Number,
				required: true
			},
			ruleCardId: {
				type: String,
				required: true
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			const constructionModes = Object.freeze({
				standard: getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_STANDARD_MODE'),
				expert: getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_EXPERT_MODE')
			});
			return {
				getMessage,
				constructionModes
			};
		},
		data() {
			return {
				selectedMode: RULE_CONSTRUCTION_MODES.expert
			};
		},
		computed: {
			constructionClassName() {
				return {
					'--condition': GENERAL_CONSTRUCTION_TYPES[this.construction.type] === GENERAL_CONSTRUCTION_TYPES['condition:if'],
					'--action': GENERAL_CONSTRUCTION_TYPES[this.construction.type] === GENERAL_CONSTRUCTION_TYPES.action,
					'--first': this.position === 0,
					'--output': GENERAL_CONSTRUCTION_TYPES[this.construction.type] === GENERAL_CONSTRUCTION_TYPES.output
				};
			},
			generalConstructionTypes() {
				return GENERAL_CONSTRUCTION_TYPES;
			},
			isBooleanType() {
				return this.booleanTypes.includes(this.construction.type);
			},
			booleanTypes() {
				return [CONSTRUCTION_TYPES.AND_CONDITION, CONSTRUCTION_TYPES.OR_CONDITION];
			},
			iconColor() {
				if (GENERAL_CONSTRUCTION_TYPES.action === this.generalConstructionTypes[this.construction.type]) {
					return ICON_COLORS$1.action;
				}
				if (GENERAL_CONSTRUCTION_TYPES.output === this.generalConstructionTypes[this.construction.type]) {
					return ICON_COLORS$1.output;
				}
				return ICON_COLORS$1.condition;
			},
			isExpertMode() {
				return this.selectedMode === RULE_CONSTRUCTION_MODES.expert;
			},
			parsedMessage() {
				return this.construction.type === GENERAL_CONSTRUCTION_TYPES.action ? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_THEN') : this.getMessage(CONSTRUCTION_LABELS[this.construction.type]);
			}
		},
		template: `
		<div
			data-name="rule-construction"
			class="editor-chart-node-settings-rule-construction"
			:class="constructionClassName"
			:data-id="construction.id"
			:data-rule-card-id="ruleCardId"
		>
			<div class="editor-chart-node-settings-rule-construction__operator">
				<slot
					v-if="isBooleanType"
					name="booleanTypeSwitcher"
				/>
				<span
					v-else
					class="editor-chart-node-settings-rule-construction__operator_label"
				>
					{{ parsedMessage }}
				</span>
				<slot
					v-if="position > 0"
					name="addConstructionButton"
				/>
			</div>
			<div class="editor-chart-node-settings-rule-construction__content">
				<div class="editor-chart-node-settings-rule-construction__content_top">
					<BIcon
						:size="20"
						:color="iconColor"
						class="editor-chart-node-settings-rule-construction__dnd-icon"
						name="drag-s"
						draggable="true"
					/>
					<slot
						name="deleteConstructionButton"
						:iconColor="iconColor"
					/>
				</div>
				<div class="editor-chart-node-settings-rule-construction__expression-form">
					<slot
						:name="generalConstructionTypes[construction.type]"
						:isExpertMode="isExpertMode"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const EditNodeSettingsForm = {
		name: 'EditNodeSettingsForm',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			IconButton,
			BlockHeader,
			BlockIcon
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			ports: {
				type: Object,
				required: true
			}
		},
		setup() {
			const store = diagramStore();
			const {
				getMessage
			} = useLoc();
			const {
				isFeatureAvailable
			} = useFeature();
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				getMessage,
				isFeatureAvailable,
				store
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings']),
			iconName() {
				return ui_iconSet_api_vue.Outline[this.block?.node?.icon] ?? ui_iconSet_api_vue.Outline.FILE;
			},
			rulePorts() {
				return this.ports.filter(port => port.type === PORT_TYPES.input);
			},
			relationPorts() {
				return this.ports.filter(port => port.type === PORT_TYPES.inputRelation);
			},
			rulePortsLength() {
				return this.rulePorts.length;
			},
			isRelationFeatureAvailable() {
				return this.block.node?.shouldShowAuxPorts !== true && this.isFeatureAvailable(bizprocdesigner_feature.FeatureCode.complexNodeConnections);
			},
			isSubIcon() {
				return this.block.node?.type === BLOCK_TYPES$1.TOOL && this.block.node?.icon && ui_iconSet_api_vue.Outline[this.block.node.icon] !== ui_iconSet_api_vue.Outline.DATABASE;
			},
			activationIcon() {
				return this.block.activity.Activated === ACTIVATION_STATUS.ACTIVE ? this.iconSet.PAUSE_L : this.iconSet.PLAY_L;
			},
			icon() {
				if (this.block.node?.type === BLOCK_TYPES$1.TOOL) {
					const mcpLettersKey = 'MCP_LETTERS';
					return ui_iconSet_api_vue.Outline[this.block.node.icon] === ui_iconSet_api_vue.Outline.DATABASE ? this.block.node.icon : mcpLettersKey;
				}
				return this.block.node?.icon;
			},
			colorIndex() {
				return this.block.node?.type === BLOCK_TYPES$1.TOOL ? 0 : this.block.node?.colorIndex;
			},
			previewTypes() {
				return [{
					id: 'rule',
					ports: this.rulePorts,
					sectionTitle: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE'),
					caption: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_RULE'),
					isAvailable: true
				}, {
					id: 'relation',
					ports: this.relationPorts,
					sectionTitle: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONNECTION_SECTION_TITLE'),
					caption: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_CONNECTION'),
					isAvailable: this.isRelationFeatureAvailable
				}];
			}
		},
		watch: {
			rulePortsLength() {
				this.$nextTick(() => {
					const {
						scrollHeight,
						clientHeight
					} = this.$el;
					if (scrollHeight > clientHeight) {
						this.$el.scrollTop = scrollHeight - clientHeight;
					}
				});
			}
		},
		methods: {
			onChangeTitle({
				target: {
					value: title
				}
			}) {
				this.nodeSettings.title = title;
			},
			onChangeDescription({
				target: {
					value: description
				}
			}) {
				this.nodeSettings.description = description;
			},
			isUrl(value) {
				if (!value || !main_core.Type.isString(value)) {
					return false;
				}
				try {
					const u = new URL(value);
					return u.protocol === 'https:';
				} catch {
					return false;
				}
			},
			toggleActivation(event) {
				this.store.toggleBlockActivation(this.block.id, true);
			}
		},
		template: `
		<div class="editor-chart-node-settings-form">
			<div class="editor-chart-node-settings-form__node-brief">
				<BlockHeader
					:block="block"
					:subIconExternal="isUrl(block.node?.icon)"
					:title="nodeSettings.title"
				>
					<template #icon>
						<BlockIcon
							:iconName="icon"
							:iconColorIndex="colorIndex"
						/>
					</template>
					<template #subIcon
								v-if="isSubIcon">
						<div
							v-if="isUrl(block.node.icon)"
							:style="getBackgroundImage(block.node.icon)"
							class="ui-selector-item-avatar"
						/>
						<BlockIcon
							v-else
							:iconName="block.node.icon"
							:iconColorIndex="7"
							:iconSize="24"
						/>
					</template>
				</BlockHeader>
				<IconButton
					:icon-name="activationIcon"
					@click="toggleActivation"
				/>
			</div>
			<div class="editor-chart-node-settings-form__section-delimeter"></div>
			<div class="editor-chart-node-settings-form__section">
				<div>
					<span class="editor-chart-node-settings-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_LABEL') }}
					</span>
					<div class="ui-ctl ui-ctl-textbox editor-chart-node-settings-form__node-name-input">
						<input type="text"
							class="ui-ctl-element"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER')"
							:value="nodeSettings.title"
							:data-test-id="$testId('complexNodeName')"
							@input="onChangeTitle"
						/>
					</div>
				</div>
				<div class="editor-chart-node-settings-form__node-description">
					<span class="editor-chart-node-settings-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_LABEL') }}
					</span>
					<div class="ui-ctl ui-ctl-textarea editor-chart-node-settings-form__node-description_textarea">
						<textarea
							rows="1"
							class="ui-ctl-element"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER')"
							:value="nodeSettings.description"
							:data-test-id="$testId('complexNodeDescription')"
							@input="onChangeDescription"
						></textarea>
					</div>
					<p class="editor-chart-node-settings-form__node-description_text">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_TEXT') }}
					</p>
				</div>
			</div>
			<div class="editor-chart-node-settings-form__section-delimeter"></div>
			<template
				v-for="previewType in previewTypes"
				:key="previewType.id"
			>
				<div
					v-if="previewType.isAvailable"
					class="editor-chart-node-settings-form__section"
				>
					<p class="editor-chart-node-settings-form__section-title">
						{{ previewType.sectionTitle }}
					</p>
					<slot
						v-for="port in previewType.ports"
						:key="port.id"
						:port="port"
						name="preview"
					/>
					<slot
						:itemType="previewType.id"
						:text="previewType.caption"
						name="addSettingsItem"
					/>
				</div>
			</template>
		</div>
	`
	};

	// @vue/component
	const AddSettingsItem = {
		name: 'AddSettingsItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			itemType: {
				type: String,
				required: true
			}
		},
		emits: ['addItem'],
		setup() {
			const {
				getMessage
			} = useLoc();
			const store = useNodeSettingsStore();
			const actions = {
				rule: () => {
					const ruleId = store.addRule();
					store.addRulePort(ruleId, PORT_TYPES.input);
				},
				relation: () => {
					const relationId = store.addRelation();
					store.addRelationPort(relationId, PORT_TYPES.inputRelation);
				}
			};
			return {
				getMessage,
				actions
			};
		},
		template: `
		<div
			class="editor-chart-node-settings-add-item-button"
			:data-test-id="$testId('complexNodeSettingsAdd', itemType)"
			@click="actions[this.itemType]()"
		>
			<BIcon
				class="editor-chart-node-settings-add-item-button__plus"
				name="plus-m"
				:size="20"
				color="#828b95"
			/>
			<span>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_SETTINGS_ITEM') }}
				<slot />
			</span>
		</div>
	`
	};

	const AUX_PORT_LABEL = 'T';
	const MAX_AUX_PORTS = 5;
	function parseAuxPortIndex(title) {
		if (!title) {
			return Number.MAX_SAFE_INTEGER;
		}
		const parts = title.split(AUX_PORT_LABEL);
		if (parts.length < 2) {
			return Number.MAX_SAFE_INTEGER;
		}
		const num = Number(parts[1]);
		return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
	}

	// @vue/component
	const EditAuxPortSelector = {
		name: 'EditAuxPortSelector',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Popup: ui_vue3_components_popup.Popup,
			BxText: ui_system_typography_vue.Text
		},
		props: {
			/** @type Construction */
			construction: {
				type: Object,
				required: true
			},
			isScrolling: {
				type: Boolean,
				required: true
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		data() {
			return {
				isPopupShown: false,
				allAuxPorts: []
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule']),
			selectedPort: {
				get() {
					const {
						auxPortId,
						auxPortTitle
					} = this.construction.expression;
					let title = auxPortTitle ?? null;
					if (auxPortId && !title) {
						const matchedPort = this.auxPorts.find(p => p.portId === auxPortId);
						title = matchedPort?.title ?? null;
					}
					return {
						portId: auxPortId ?? null,
						title
					};
				},
				set(port) {
					this.changeRuleExpression(this.construction, {
						auxPortId: port.portId,
						auxPortTitle: port.title
					});
				}
			},
			notSelectedMessage() {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
			},
			popupOptions() {
				return {
					id: 'edit-aux-port-selector-popup',
					bindElement: this.$refs.auxPortDropdown,
					minHeight: 100,
					maxHeight: 145,
					padding: 0,
					width: 200
				};
			},
			nextPortId() {
				const usedNumbers = new Set(this.allAuxPorts.map(port => parseInt(port.portId.slice(1), 10)));
				for (let i = 0;; i++) {
					if (!usedNumbers.has(i)) {
						return `a${i}`;
					}
				}
			},
			nextPortTitle() {
				const usedNumbers = new Set(this.allAuxPorts.map(port => {
					const parts = port.title.split(AUX_PORT_LABEL);
					return parts.length > 1 ? Number(parts[1]) : 0;
				}));
				for (let i = 1;; i++) {
					if (!usedNumbers.has(i)) {
						return `${AUX_PORT_LABEL}${i}`;
					}
				}
			},
			auxPorts() {
				return this.allAuxPorts.filter(port => port.isActive !== false);
			},
			canAddPort() {
				return this.auxPorts.length < MAX_AUX_PORTS;
			}
		},
		watch: {
			isScrolling(isScrolling) {
				if (isScrolling && this.isPopupShown) {
					this.isPopupShown = false;
				}
			}
		},
		created() {
			this.allAuxPorts = this.block.ports.reduce((acc, port) => {
				if (port.type === PORT_TYPES.aux) {
					acc.push({
						portId: port.id,
						title: port.title,
						type: port.type,
						isActive: port.isActive !== false
					});
				}
				return acc;
			}, []);
			this.ensureDefaultPort();
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, {
				changeRuleExpression: 'changeRuleExpression',
				storeDeletePort: 'deletePort',
				storeActivatePort: 'activatePort'
			}),
			selectPort(port) {
				this.selectedPort = {
					portId: port.portId,
					title: port.title
				};
				this.isPopupShown = false;
			},
			ensureDefaultPort() {
				if (this.auxPorts.length > 0) {
					return;
				}
				const inactive = this.allAuxPorts.filter(port => port.isActive === false).sort((a, b) => parseAuxPortIndex(a.title) - parseAuxPortIndex(b.title))[0];
				if (inactive) {
					inactive.isActive = true;
					return;
				}
				this.allAuxPorts.push({
					portId: this.nextPortId,
					title: this.nextPortTitle,
					type: PORT_TYPES.aux,
					isActive: true
				});
			},
			addNewPort() {
				if (this.auxPorts.length >= MAX_AUX_PORTS) {
					return;
				}
				const inactive = this.allAuxPorts.filter(port => port.isActive === false).sort((a, b) => parseAuxPortIndex(a.title) - parseAuxPortIndex(b.title))[0];
				if (inactive) {
					inactive.isActive = true;
					this.storeActivatePort(inactive.portId);
					return;
				}
				this.allAuxPorts.push({
					portId: this.nextPortId,
					title: this.nextPortTitle,
					type: PORT_TYPES.aux,
					isActive: true
				});
			},
			deletePort(portId) {
				const targetPort = this.allAuxPorts.find(port => port.portId === portId);
				if (!targetPort) {
					return;
				}
				targetPort.isActive = false;
				if (portId === this.selectedPort.portId) {
					this.selectedPort = {
						portId: null,
						title: null
					};
				}
				this.storeDeletePort(portId);
			},
			async tryToScrollBottom() {
				await this.$nextTick();
				const dropDownContent = this.$refs.auxPortDropdownContent;
				const {
					scrollHeight,
					clientHeight
				} = dropDownContent;
				if (scrollHeight > clientHeight) {
					dropDownContent.scrollTop = scrollHeight - clientHeight;
				}
			},
			onAddButtonClick() {
				this.addNewPort();
				this.tryToScrollBottom();
			}
		},
		template: `
		<div class="editor-chart-node-settings-edit-aux-port-selector-form">
			<div class="editor-chart-node-settings-edit-aux-port-selector-form__item">
				<BxText
					size="xs"
					tag="span"
					className="editor-chart-node-settings-edit-aux-port-selector-form__label"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AUX_PORT_TITLE') }}
				</BxText>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-aux-port-selector-form__dropdown"
					ref="auxPortDropdown"
					@click="isPopupShown = true"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ selectedPort.title ?? notSelectedMessage }}
					</div>
					<Popup
						v-if="isPopupShown"
						:options="popupOptions"
						@close="isPopupShown = false"
					>
						<div class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup">
							<div
								class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-content"
								ref="auxPortDropdownContent"
							>
								<div
									v-for="port in auxPorts"
									class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-item"
									@click="selectPort(port)"
								>
									<BxText size="xs" tag="span">{{ port.title }}</BxText>
									<button
										class="ui-btn ui-btn-xss --style-outline-no-accent ui-btn-no-caps --air"
										@click.stop="deletePort(port.portId)"
									>
										{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AUX_PORT_REMOVE') }}
									</button>
								</div>
							</div>
							<div v-if="canAddPort" class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-footer">
								<div
									class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-footer-content"
									@click="onAddButtonClick"
								>
									<BIcon
										:size="24"
										name="circle-plus"
										color="#0075ff"
										class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-footer-icon"
									/>
									<BxText size="xs" tag="span">{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AUX_PORT_ADD') }}</BxText>
								</div>
							</div>
						</div>
					</Popup>
				</div>
			</div>
		</div>
	`
	};

	const DocumentsTabId = 'documents';
	class DocumentSelector {
		#store;
		#currentPortId = null;
		#currentBlock;
		#fixedDocumentType = null;
		constructor(currentBlock, currentPortId = null, fixedDocumentType = null) {
			this.#store = diagramStore();
			this.#currentBlock = currentBlock;
			this.#currentPortId = currentPortId;
			this.#fixedDocumentType = fixedDocumentType;
		}
		show(target) {
			return new Promise(resolve => {
				const dialog = new ui_entitySelector.Dialog({
					targetNode: target,
					width: 500,
					height: 300,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					items: this.#getDocuments(),
					tabs: this.#getTabs(),
					cacheable: false,
					showAvatars: false,
					events: {
						'Item:onSelect': event => {
							resolve(event.getData().item.getId());
						}
					},
					compactView: true
				});
				dialog.show();
			});
		}
		#getTabs() {
			return [{
				id: DocumentsTabId,
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT_MULTIPLE'),
				icon: 'elements',
				stub: true,
				stubOptions: {
					title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT_STUB_TITLE')
				}
			}];
		}
		#processChildrenProperties(block) {
			const childrenProperties = [];
			block.activity.Children.forEach(activity => {
				if (main_core.Type.isArrayFilled(activity.ReturnProperties)) {
					const properties = this.#processReturnProperties({
						id: activity.Name,
						activity
					});
					if (main_core.Type.isArrayFilled(properties)) {
						childrenProperties.push(...properties);
					}
				}
			});
			const properties = [];
			if (main_core.Type.isArrayFilled(childrenProperties)) {
				properties.push({
					id: block.id,
					entityId: 'block-node',
					tabs: DocumentsTabId,
					title: block.activity.Properties.Title,
					children: childrenProperties,
					searchable: false
				});
			}
			return properties;
		}
		#processReturnProperties(block) {
			const properties = [];
			block.activity.ReturnProperties.filter(property => {
				if (property.Type !== PROPERTY_TYPES.DOCUMENT) {
					return false;
				}
				if (!main_core.Type.isArrayFilled(property.Default)) {
					return true;
				}
				if (!main_core.Type.isArrayFilled(this.#fixedDocumentType)) {
					return true;
				}
				for (const key of this.#fixedDocumentType.keys()) {
					if (property.Default?.[key] !== this.#fixedDocumentType[key]) {
						return false;
					}
				}
				return true;
			}).forEach(property => {
				const item = {
					id: `{=${block.id}:${property.Id}}`,
					entityId: 'bizproc-document',
					entityType: 'document',
					title: `${property.Name} (${block.activity.Properties.Title})`,
					nodeOptions: {
						open: false,
						dynamic: false
					},
					tabs: DocumentsTabId
				};
				properties.push(item);
			});
			return properties;
		}
		#getDocuments() {
			const blocks = this.#store.getAllBlockAncestors(this.#currentBlock, this.#currentPortId);
			return blocks.reduce((acc, block) => {
				if (main_core.Type.isArrayFilled(block.activity.Children)) {
					const properties = this.#processChildrenProperties(block);
					if (main_core.Type.isArrayFilled(properties)) {
						acc.push(...properties);
					}
				}
				if (main_core.Type.isArrayFilled(block.activity.ReturnProperties)) {
					const properties = this.#processReturnProperties(block);
					if (main_core.Type.isArrayFilled(properties)) {
						acc.push(...properties);
					}
				}
				return acc;
			}, []);
		}
	}

	// @vue/component
	const EditActionExpression = {
		name: 'EditActionExpression',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			EditAuxPortSelector
		},
		props: {
			/** @type ActionConstruction */
			construction: {
				type: Object,
				required: true
			},
			isExpertMode: {
				type: Boolean,
				required: true
			},
			isScrolling: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				getMessage
			} = useLoc();
			const isActionFormLoading = ui_vue3.ref(Boolean(props.construction?.expression?.actionId));
			ui_vue3.provide('isActionFormLoading', isActionFormLoading);
			return {
				getMessage,
				isActionFormLoading
			};
		},
		data() {
			return {
				isExpanded: true
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule']),
			shouldShowAuxPorts() {
				return this.block.node?.shouldShowAuxPorts === true;
			},
			connectedBlocks() {
				/** @todo Get rid of store usage here */
				const store = diagramStore();
				return store.getAllBlockAncestors(this.block, this.currentRule.id);
			},
			selectedAction() {
				return this.nodeSettings.actions.get(this.selectedActionId);
			},
			selectedActionId: {
				get() {
					return this.construction.expression.actionId ?? '';
				},
				set(actionId) {
					this.isActionFormLoading = true;
					this.changeRuleExpression(this.construction, {
						actionId,
						activityData: null
					});
				}
			},
			actionValue() {
				return this.construction.expression.activityData;
			},
			notSelectedMessage() {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
			},
			currentActionTitle() {
				const action = this.nodeSettings.actions.get(this.selectedActionId);
				return action?.title ?? this.notSelectedMessage;
			},
			selectedDocument: {
				get() {
					return isActionExpressionDocumentCorrect(this.connectedBlocks, this.construction.expression.document) ? this.construction.expression.document : '';
				},
				set(document) {
					this.changeRuleExpression(this.construction, {
						document
					});
				}
			},
			selectedDocumentTitle() {
				return evaluateActionExpressionDocumentTitle(this.connectedBlocks, this.selectedDocument);
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['changeRuleExpression']),
			getMenuItems() {
				return [...this.nodeSettings.actions.values()].map(({
					id,
					title
				}) => {
					return {
						id,
						text: title,
						onclick: () => {
							this.selectedActionId = id;
							this.menu.close();
						}
					};
				});
			},
			onShowMenu({
				currentTarget
			}) {
				this.menu = main_popup.MenuManager.create({
					id: 'edit-actions-menu',
					bindElement: currentTarget,
					items: this.getMenuItems(),
					maxHeight: 200,
					closeByEsc: true,
					autoHide: true,
					cacheable: false
				});
				this.menu.show();
			},
			onChooseDocument(event) {
				const selector = new DocumentSelector(this.block, this.currentRule.id, this.nodeSettings.fixedDocumentType);
				void selector.show(event.target).then(document => {
					this.selectedDocument = document;
				});
			}
		},
		template: `
		<div class="editor-chart-node-settings-edit-action-expression-form">
			<div class="editor-chart-node-settings-edit-action-expression-form__item">
				<span class="editor-chart-node-settings-edit-action-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_EXPRESSION_NAME') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-action-expression-form__dropdown"
					@click="onShowMenu"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ currentActionTitle }}
					</div>
				</div>
			</div>
			<div v-if="selectedAction && selectedAction.handlesDocument"
				 class="editor-chart-node-settings-edit-action-expression-form__item"
			>
				<span class="editor-chart-node-settings-edit-action-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT') }}
				</span>
				<div
					 class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-action-expression-form__dropdown"
					 @click="onChooseDocument"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						class="ui-ctl-element"
						:data-test-id="$testId('selectedActionDocument')"
					>
						{{ selectedDocumentTitle }}
					</div>
				</div>
			</div>
			<div class="editor-chart-node-settings-edit-action-expression-form__item">
				<div
					v-if="selectedActionId"
					class="editor-chart-node-settings-edit-action-expression-form__label"
				>
					<span>
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
					</span>
					<BIcon
						v-if="isExpanded"
						name="minus-20"
						color="#828b95"
						@click="isExpanded=false"
					/>
					<BIcon
						v-else
						name="plus-20"
						color="#828b95"
						@click="isExpanded=true"
					/>
				</div>
				<div
					v-show="isExpanded"
					class="editor-chart-node-settings-edit-action-expression-form__settings node-settings-panel"
				>
					<slot
						:actionId="selectedActionId"
						:activityData="actionValue"
						:selectedDocument="selectedDocument"
					/>
				</div>
			</div>
			<div
				v-if="shouldShowAuxPorts && selectedActionId"
				v-show="!isActionFormLoading"
				class="editor-chart-node-settings-edit-action-expression-form__item"
			>
				<EditAuxPortSelector
					:construction="construction"
					:isScrolling="isScrolling"
				/>
			</div>
		</div>
	`
	};

	const useCommonNodeSettingsStore = ui_vue3_pinia.defineStore('bizprocdesigner-common-node-settings-store', {
		state: () => ({
			isLoading: false,
			block: null
		}),
		getters: {
			isVisible: state => {
				return state.block !== null;
			}
		},
		actions: {
			isCurrentBlock(blockId) {
				return this.block?.id === blockId;
			},
			showSettings(block) {
				this.block = block;
			},
			hideSettings() {
				this.block = null;
			}
		}
	});

	class ValueSelector {
		currentPortId = null;
		selectedItem = null;
		constructor(store, currentBlock, currentPortId = null) {
			this.store = store;
			this.currentBlock = currentBlock;
			this.currentPortId = currentPortId;
		}
		show(targetElement, options = {}) {
			return new Promise(resolve => {
				const dialog = new ui_entitySelector.Dialog({
					targetNode: targetElement,
					width: 500,
					height: 300,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					items: this.#getItems(),
					tabs: this.#getTabs(),
					entities: this.#getEntities(options.showOnlyRealProperties),
					cacheable: false,
					showAvatars: false,
					events: {
						'Item:onSelect': event => {
							this.selectedItem = event.getData().item;
							resolve(this.#getValue(event.getData().item));
						}
					},
					compactView: true
				});
				dialog.show();
			});
		}
		#getEntities(showOnlyRealProperties = false) {
			if (showOnlyRealProperties) {
				return [{
					id: 'bizproc-document'
				}];
			}
			return [{
				id: 'bizproc-document'
			}, {
				id: 'bizproc-system'
			}, {
				id: 'structure-node',
				options: {
					selectMode: 'usersAndDepartments',
					allowFlatDepartments: true,
					allowSelectRootDepartment: true
				}
			}];
		}
		#getTabs() {
			return [{
				id: 'documents',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_DOCUMENTS'),
				icon: 'elements'
			}, {
				id: 'returns',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_RETURNS'),
				icon: 'flag-1'
			}, {
				id: 'template',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_TEMPLATE'),
				icon: 'disk'
			}];
		}
		#getValue(item) {
			if (item.getEntityId() === 'user') {
				return `${item.getTitle()} [${item.getId()}]`;
			}
			if (item.getEntityId() === 'structure-node') {
				const id = String(item.getId());
				if (id.indexOf(':') > 0) {
					return `${item.getTitle()} [HR${id.split(':')[0]}]`;
				}
				return `${item.getTitle()} [HRR${id}]`;
			}
			return item.getId();
		}
		#getItems() {
			const items = this.getReturnItems();
			this.addTemplateItems(items);
			return items;
		}
		addTemplateItems(items) {
			const map = [{
				key: 'PARAMETERS',
				idKey: 'Template',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_PARAMETERS')
			}, {
				key: 'VARIABLES',
				idKey: 'Variable',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_VARIABLES')
			}, {
				key: 'CONSTANTS',
				idKey: 'Constant',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_CONSTANTS')
			}];
			map.forEach(elem => {
				const collection = this.store.template[elem.key];
				if (main_core.Type.isObject(collection) && Object.keys(collection).length > 0) {
					const children = [];
					Object.keys(collection).forEach(key => {
						const item = collection[key];
						const id = `{=${elem.idKey}:${key}}`;
						children.push({
							id,
							entityId: elem.key,
							title: item.Name,
							customData: {
								property: item
							}
						});
					});
					items.push({
						id: elem.idKey,
						entityId: 'template',
						title: elem.title,
						tabs: 'template',
						children
					});
				}
			});
		}
		getReturnItems() {
			const blocks = this.store.getAllBlockAncestors(this.currentBlock, this.currentPortId);
			return blocks.reduce((acc, block) => {
				if (main_core.Type.isArrayFilled(block.activity.Children)) {
					const properties = this.#processChildrenProperties(block);
					if (main_core.Type.isArrayFilled(properties)) {
						acc.push(...properties);
					}
				}
				if (main_core.Type.isArrayFilled(block.activity.ReturnProperties)) {
					const properties = this.#processReturnProperties(block);
					if (main_core.Type.isArrayFilled(properties)) {
						acc.push(...properties);
					}
				}
				return acc;
			}, []);
		}
		#processChildrenProperties(block) {
			const childrenProperties = [];
			block.activity.Children.forEach(activity => {
				if (main_core.Type.isArrayFilled(activity.ReturnProperties)) {
					const properties = this.#processReturnProperties({
						id: activity.Name,
						activity
					});
					if (main_core.Type.isArrayFilled(properties)) {
						childrenProperties.push(...properties);
					}
				}
			});
			const {
				documents,
				activities
			} = childrenProperties.reduce((res, child) => {
				if (child) {
					if (child.entityId === 'bizproc-document') {
						res.documents.push(child);
					} else {
						res.activities.push(child);
					}
				}
				return res;
			}, {
				documents: [],
				activities: []
			});
			const properties = [];
			if (main_core.Type.isArrayFilled(documents)) {
				properties.push({
					id: block.id,
					entityId: 'block-node',
					tabs: 'documents',
					title: block.activity.Properties.Title,
					children: documents,
					nodeOptions: {
						open: false,
						dynamic: false
					},
					searchable: false
				});
			}
			if (main_core.Type.isArrayFilled(activities)) {
				properties.push({
					id: block.id,
					entityId: 'block-node',
					tabs: 'returns',
					title: block.activity.Properties.Title,
					children: activities,
					searchable: false
				});
			}
			return properties;
		}
		#processReturnProperties(block) {
			const fullTitle = block.activity.Properties.Title;
			const {
				documents,
				properties
			} = block.activity.ReturnProperties.reduce((res, property) => {
				const id = `{=${block.id}:${property.Id}}`;
				if (property.Type === 'document') {
					res.documents.push({
						id,
						entityId: 'bizproc-document',
						entityType: 'document',
						title: `${property.Name} (${fullTitle})`,
						customData: {
							document: property.Default,
							idTemplate: `{=${block.id}:${property.Id}.#FIELD#}`
						},
						nodeOptions: {
							open: false,
							dynamic: true
						},
						tabs: 'documents',
						searchable: false
					});
				} else {
					const customProperty = main_core.Runtime.clone(property);
					if (customProperty.Type === 'json') {
						customProperty.Type = customProperty.BaseType ?? 'string';
					}
					res.properties.push({
						id,
						entityId: 'block-node-property',
						title: property.Name,
						property,
						block,
						customData: {
							property: customProperty
						}
					});
				}
				return res;
			}, {
				documents: [],
				properties: []
			});
			const result = [];
			if (main_core.Type.isArrayFilled(documents)) {
				result.push(...documents);
			}
			if (main_core.Type.isArrayFilled(properties)) {
				result.push({
					id: block.id,
					entityId: 'block-node',
					tabs: 'returns',
					title: fullTitle,
					children: properties,
					searchable: false
				});
			}
			return result;
		}
	}

	const SCROLL_ZONE = 50;
	const SCROLL_SPEED = 10;

	// @vue/component
	const CommonNodeSettingsForm = {
		name: 'CommonNodeSettingsForm',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BlockHeader,
			BlockIcon,
			IconButton
		},
		props: {
			block: {
				type: Object,
				required: true
			},
			documentType: {
				type: Array,
				required: true
			},
			panelAlreadyOpened: {
				type: Boolean,
				default: false
			}
		},
		emits: ['showPreview'],
		setup() {
			const store = diagramStore();
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				store
			};
		},
		data() {
			return {
				isLoading: false,
				isVisible: this.panelAlreadyOpened,
				hasErrors: false,
				isSubmitting: false,
				hasSettings: false,
				useDocumentContext: false,
				settingsForm: null,
				nodeControls: null,
				inputListeners: [],
				shouldShowWithTransition: false,
				isDragging: false,
				dragMouseY: 0,
				autoScrollFrameId: null,
				scrollBoundaries: null,
				rendererInstance: null,
				lastRenderRequestId: 0,
				dynamicComponents: {},
				customFieldsData: {},
				childVueApps: [],
				collectionRenderFinishedHandler: null,
				pendingCollectionRenderResolve: null
			};
		},
		computed: {
			icon() {
				if (this.block.node?.type === BLOCK_TYPES$1.TOOL) {
					const mcpLettersKey = 'MCP_LETTERS';
					return ui_iconSet_api_vue.Outline[this.block.node.icon] === ui_iconSet_api_vue.Outline.DATABASE ? this.block.node.icon : mcpLettersKey;
				}
				return this.block.node?.icon;
			},
			colorIndex() {
				return this.block.node?.type === BLOCK_TYPES$1.TOOL ? 0 : this.block.node?.colorIndex;
			},
			isSubIcon() {
				return this.block.node?.type === BLOCK_TYPES$1.TOOL && this.block.node?.icon && ui_iconSet_api_vue.Outline[this.block.node.icon] !== ui_iconSet_api_vue.Outline.DATABASE;
			},
			activationIcon() {
				return this.block.activity.Activated === ACTIVATION_STATUS.ACTIVE ? this.iconSet.PAUSE_L : this.iconSet.PLAY_L;
			}
		},
		watch: {
			block(newBlock) {
				this.cleanupFormResources();
				this.hasSettings = false;
				this.isLoading = true;
				this.currentBlock = newBlock;
				this.$nextTick(async () => {
					if (this.$refs.scrollContainer) {
						this.$refs.scrollContainer.scrollTop = 0;
					}
					await this.renderControls();
					window.BPAShowSelector = this.showSelector;
					window.HideShow = this.hideShow;
					this.blurActiveElementIfNeeded();
				});
			}
		},
		async mounted() {
			this.isVisible = true;
			this.currentBlock = this.block;
			await this.$nextTick();
			await this.renderControls();
			main_core.Event.bind(document, 'mousedown', this.multiSelectMouseHandler);
			main_core.Event.bind(this.$refs.scrollContainer, 'scroll', this.handleScroll);
			main_core_events.EventEmitter.subscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.onDragStart);
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:move', this.onDragMove);
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:end', this.onDragEnd);
			main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:askShowValueSelector', this.onAskShowValueSelector);
			window.BPAShowSelector = this.showSelector;
			window.HideShow = this.hideShow;
			this.blurActiveElementIfNeeded();
		},
		unmounted() {
			this.stopAutoScroll();
			this.cleanupFormResources();
			main_core.Event.unbind(document, 'mousedown', this.multiSelectMouseHandler);
			main_core.Event.unbind(this.$refs.scrollContainer, 'scroll', this.handleScroll);
			main_core_events.EventEmitter.unsubscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.onDragStart);
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:move', this.onDragMove);
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:end', this.onDragEnd);
			main_core_events.EventEmitter.emit('BX.Bizproc.Activity.unmount');
			main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:askShowValueSelector', this.onAskShowValueSelector);
			this.destroyRendererInstance();
		},
		methods: {
			isRenderCancelled(requestId) {
				return this.lastRenderRequestId !== requestId || !this.$refs.contentContainer;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			},
			multiSelectMouseHandler(event) {
				if (!event.isTrusted || event.button !== 0) {
					return;
				}
				const opt = event.target;
				const select = opt.parentElement;
				if (opt.tagName === 'OPTION' && select?.multiple) {
					event.preventDefault();
					const scroll = select.scrollTop;
					opt.selected = !opt.selected;
					setTimeout(() => {
						select.scrollTop = scroll;
					}, 0);
				}
			},
			showPreview(event) {
				this.$emit('showPreview', event.data);
			},
			async showSettings(node, shouldShowWithTransition) {
				this.isVisible = true;
				this.currentBlock = node;
				this.shouldShowWithTransition = shouldShowWithTransition;
				await this.$nextTick();
				await this.renderControls();
			},
			extractFormData(form) {
				const formData = main_core.ajax.prepareForm(form).data;
				formData.documentType = this.documentType;
				formData.activityType = this.currentBlock.activity?.Type ?? '';
				formData.id = this.currentBlock.activity?.Name ?? '';
				formData.arWorkflowTemplate = JSON.stringify([this.currentBlock.activity]);
				return formData;
			},
			async submitForm(formData) {
				this.isSubmitting = true;
				try {
					this.validateForm(formData);
					if (this.hasErrors) {
						return;
					}
					main_core_events.EventEmitter.emit('Bizproc.NodeSettings:nodeSettingsSaving', {
						formData
					});
					const preparedSettingsData = {
						...formData
					};
					preparedSettingsData.arWorkflowConstants = JSON.stringify(this.store.template.CONSTANTS ?? {});
					const compatibleTemplate = [{
						Type: 'NodeWorkflowActivity',
						Children: [],
						Name: 'Template'
					}];
					compatibleTemplate[0].Children.push(this.currentBlock.activity, ...this.store.getAllBlockAncestors(this.currentBlock).map(b => b.activity));
					preparedSettingsData.arWorkflowTemplate = JSON.stringify(compatibleTemplate);
					preparedSettingsData.activated = this.currentBlock.activity.Activated;
					const settingControls = await editorAPI.saveNodeSettings(preparedSettingsData);
					if (settingControls) {
						this.store.updateBlockActivityField(this.currentBlock.id, settingControls);
						if (formData.activity_id !== this.currentBlock.id) {
							this.store.updateBlockId(this.currentBlock.id, preparedSettingsData.activity_id);
						}
						this.store.publicDraft();
						this.handleFormCancel();
					}
				} catch (error) {
					if (error.errors && error.errors[0] && error.errors[0].message) {
						ui_dialogs_messagebox.MessageBox.alert(error.errors[0].message);
					}
				} finally {
					this.isSubmitting = false;
				}
			},
			handleFormSave() {
				if (this.isSubmitting) {
					return;
				}
				if (!this.settingsForm) {
					return;
				}
				const formData = this.extractFormData(this.settingsForm);
				this.submitForm(formData);
			},
			handleFormCancel() {
				this.$emit('close');
				this.isVisible = false;
				this.$refs.contentContainer.innerHTML = '';
			},
			handleDocumentSelector(event) {
				const documents = [{
					id: '@',
					text: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_DOCUMENT')
				}, ...this.getDocuments()];
				const selectedDocument = this.currentBlock.activity?.Document ?? '@';
				const menuItems = documents.map(item => {
					const text = item.id === selectedDocument ? `* ${item.text}` : item.text;
					const onclick = this.handleSelectDocument.bind(this);
					return {
						...item,
						text,
						onclick
					};
				});
				main_popup.MenuManager.show('node-settings-document-selector', event.target, menuItems, {
					autoHide: true,
					cacheable: false
				});
			},
			handleSelectDocument(event, item) {
				item.menuWindow.close();
				const selected = item.getId();
				if (selected === '@') {
					this.currentBlock.activity.Document = null;
					return;
				}
				this.currentBlock.activity.Document = selected;
			},
			hideShow(id = 'row_activity_id') {
				const formRow = BX(id);
				if (formRow) {
					main_core.Dom.toggleClass(formRow, 'hidden');
				}
			},
			showSelector(id, type) {
				const selector = new ValueSelector(this.store, this.currentBlock);
				const targetElement = document.getElementById(id);
				selector.show(targetElement).then(value => {
					const beforePart = targetElement.selectionStart ? targetElement.value.slice(0, targetElement.selectionStart) : targetElement.value;
					let middlePart = value;
					const afterPart = targetElement.selectionEnd ? targetElement.value.slice(targetElement.selectionEnd) : '';
					if (type === 'user') {
						if (beforePart.trim().length > 0 && beforePart.trim().slice(-1) !== ';') {
							middlePart = `; ${middlePart}`;
						}
						middlePart += '; ';
					}
					targetElement.value = beforePart + middlePart + afterPart;
					targetElement.selectionEnd = beforePart.length + middlePart.length;
					targetElement.focus();
					targetElement.dispatchEvent(new window.Event('change'));
				}).catch(error => console.error(error));
			},
			renderField(fieldProps, field) {
				const control = main_core.Type.isDomNode(fieldProps) ? fieldProps : null;
				if (!control) {
					return null;
				}
				const error = main_core.Tag.render`
				<div class="node-settings-alert-text">
					${this.loc('BIZPROCDESIGNER_EDITOR_REQUIRED_FIELD_ERROR', {
				'#FIELD#': field.property.Name
			})}
				</div>
			`;
				main_core.Dom.append(error, control.parentNode);
				let className = 'node-settings-edit-box';
				if (field.property.Hidden) {
					className += ' hidden';
				}
				return main_core.Tag.render`
				<div class="${className}" id="row_${field.fieldName}">
						<div class="node-settings-edit-caption">${field.property.Name}</div>
						<div class="field-row">
								${control}
								${field.fieldName === 'title' ? `
									<a href="#" onclick="HideShow('row_activity_id'); return false;">
										${this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ID')}
									</a>
											<a href="#" onclick="HideShow('row_activity_editor_comment'); return false;">
										${this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_COMMENT')}
									</a>
								` : null}
						</div>
				</div>
			`;
			},
			async renderControls() {
				const requestId = ++this.lastRenderRequestId;
				window.BPAShowSelector = this.showSelector;
				window.HideShow = this.hideShow;
				this.isLoading = true;
				const id = this.currentBlock.activity.Name ?? '';
				const activity = this.currentBlock.activity.Type ?? '';
				const compatibleTemplate = [{
					Type: 'NodeWorkflowActivity',
					Children: [],
					Name: 'Template'
				}];
				compatibleTemplate[0].Children.push(this.currentBlock?.activity, ...this.store.getAllBlockAncestors(this.currentBlock).map(b => b.activity));
				const workflowParameters = this.store.template.PARAMETERS;
				const workflowVariables = this.store.template.VARIABLES;
				const workflowConstants = this.store.template.CONSTANTS;
				if (window.CreateActivity) {
					window.arAllId = {};
					window.arWorkflowTemplate = compatibleTemplate;
					window.rootActivity = window.CreateActivity(compatibleTemplate[0]);
					window.arWorkflowParameters = workflowParameters;
					window.arWorkflowVariables = workflowVariables;
					window.arWorkflowConstants = workflowConstants;
				}
				const {
					createFormData
				} = usePropertyDialog();
				const formData = createFormData({
					id,
					documentType: this.documentType,
					activity,
					workflow: {
						parameters: workflowParameters,
						variables: workflowVariables,
						template: compatibleTemplate,
						constants: workflowConstants
					}
				});
				this.isLoading = true;
				if (this.$refs.contentContainer) {
					this.$refs.contentContainer.innerHTML = '';
				}
				this.hasErrors = false;
				this.nodeControls = [];
				let settingControls = null;
				try {
					settingControls = await editorAPI.getNodeSettingsControls({
						documentType: this.documentType,
						activity: this.currentBlock?.activity,
						workflow: {
							workflowParameters: JSON.stringify(workflowParameters),
							workflowVariables: JSON.stringify(workflowVariables),
							workflowTemplate: JSON.stringify(compatibleTemplate),
							workflowConstants: JSON.stringify(workflowConstants)
						}
					});
					if (this.isRenderCancelled(requestId)) {
						return;
					}
				} catch (error) {
					if (this.isRenderCancelled(requestId)) {
						return;
					}
					handleResponseError(error);
					return;
				}
				this.useDocumentContext = Boolean(settingControls?.useDocumentContext);
				if (settingControls && main_core.Type.isArray(settingControls.controls)) {
					await this.renderNodeControls(settingControls, requestId);
				} else {
					await this.renderPropertyDialog(formData);
				}
			},
			renderNodeControls(settingControls, requestId) {
				this.nodeControls = main_core.Type.isArray(settingControls.controls) ? settingControls.controls : [];
				const brokenLinks = main_core.Type.isPlainObject(settingControls.brokenLinks) ? settingControls.brokenLinks : {};
				this.resetDynamicComponents();
				const eventName = 'BX.Bizproc.FieldType.onCollectionRenderControlFinished';
				this.nodeControls = this.nodeControls.map(property => {
					const fieldName = property.property.FieldName || null;
					return {
						...property,
						fieldName,
						controlId: fieldName
					};
				});
				const renderedControls = BX.Bizproc.FieldType.renderControlCollection(this.documentType, this.nodeControls.filter(field => field.property.Type !== 'custom'), 'designer');
				return new Promise(resolve => {
					if (this.isRenderCancelled(requestId)) {
						resolve();
						return;
					}
					const form = main_core.Tag.render`<form id="form-settings"></form>`;
					this.settingsForm = form;
					if (main_core.Type.isObject(brokenLinks) && Object.keys(brokenLinks).length > 0) {
						const brokenLinksAlert = this.renderBrokenLinksAlert(brokenLinks);
						main_core.Dom.append(brokenLinksAlert, form);
					}
					const activityTypeName = this.currentBlock.activity?.Type ?? '';
					const rendererName = `${activityTypeName}Renderer`;
					const RendererClass = main_core.Type.isFunction(window[rendererName]) ? window[rendererName] : null;
					let customRenderers = null;
					let instance = null;
					if (RendererClass) {
						instance = RendererClass ? ui_vue3.markRaw(new RendererClass()) : null;
						this.rendererInstance = instance;
						customRenderers = instance && main_core.Type.isFunction(instance.getControlRenderers) ? instance.getControlRenderers() : null;
					}
					this.nodeControls.forEach(field => {
						let control = renderedControls[field.controlId];
						if (field.property.Type === 'custom' && instance && customRenderers) {
							const rendererOrComponent = customRenderers?.[field?.property?.CustomType];
							if (rendererOrComponent) {
								const isVueComponent = main_core.Type.isPlainObject(rendererOrComponent) && (main_core.Type.isFunction(rendererOrComponent.render) || main_core.Type.isFunction(rendererOrComponent.setup) || main_core.Type.isStringFilled(rendererOrComponent.template));
								if (isVueComponent) {
									const componentKey = `${field.property.CustomType}_${field.controlId}`;
									const wrapper = main_core.Dom.create('div', {
										attrs: {
											class: 'vue-field-wrapper',
											'data-component-key': componentKey
										}
									});
									this.dynamicComponents[componentKey] = rendererOrComponent;
									this.customFieldsData[componentKey] = field;
									control = wrapper;
								} else if (main_core.Type.isObject(rendererOrComponent) || main_core.Type.isFunction(rendererOrComponent)) {
									control = rendererOrComponent(field);
								}
							}
						}
						if (control) {
							const row = this.renderField(control, field);
							const escapedFieldName = field.fieldName.replaceAll(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
							const input = row.querySelector(`[name^="${escapedFieldName}"]`);
							if (input) {
								main_core.Event.bind(input, 'input', this.handleFieldInput);
								this.inputListeners.push(input);
							}
							main_core.Dom.append(row, form);
						}
					});
					if (this.isRenderCancelled(requestId)) {
						resolve();
						return;
					}
					this.$refs.contentContainer.innerHTML = '';
					main_core.Dom.append(form, this.$refs.contentContainer);
					this.mountDynamicComponents();
					this.cancelPendingCollectionRender();
					this.pendingCollectionRenderResolve = resolve;
					this.collectionRenderFinishedHandler = async () => {
						this.unsubscribeCollectionRenderFinished();
						if (this.isRenderCancelled(requestId)) {
							resolve();
							return;
						}
						try {
							if (instance && main_core.Type.isFunction(instance.afterFormRender)) {
								const activityFields = this.nodeControls.reduce((acc, field) => {
									acc[field.fieldName] = field;
									return acc;
								}, {});
								await instance.afterFormRender(form, activityFields);
							}
							main_core_events.EventEmitter.emit('BX.Bizproc.CommonNodeSettings:onBlocksReady', {
								blocks: this.store.blocks
							});
							this.hasSettings = true;
						} catch (error) {
							console.error('afterFormRender failed:', error);
						} finally {
							this.isLoading = false;
							this.pendingCollectionRenderResolve = null;
							resolve();
						}
					};
					main_core.Event.EventEmitter.subscribe(eventName, this.collectionRenderFinishedHandler);
				});
			},
			renderBrokenLinksAlert(brokenLinks) {
				const linksArray = Object.values(brokenLinks);
				const detailContent = linksArray.map(link => main_core.Text.encode(link)).join('<br>');
				const alert = main_core.Tag.render`
				<div class="ui-alert ui-alert-warning ui-alert-icon-info">
					<div class="ui-alert-message">
						<div>
							<span>
								${main_core.Text.encode(main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_BROKEN_LINK_ERROR') ?? '')}
							</span> <span ref="showMoreBtn" class="bizprocdesigner-activity-broken-link-show-more">
								${main_core.Text.encode(main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MESSAGE_SHOW_LINKS') ?? '')}
							</span>
						</div>
						<div ref="detailBlock" class="bizprocdesigner-activity-broken-link-detail">
							${detailContent}
						</div>
					</div>
					<span ref="closeBtn" class="ui-alert-close-btn"></span>
				</div>
			`;
				main_core.Event.bind(alert.showMoreBtn, 'click', () => {
					main_core.Dom.style(alert.detailBlock, 'height', `${alert.detailBlock.scrollHeight}px`);
					main_core.Dom.remove(alert.showMoreBtn);
				});
				main_core.Event.bind(alert.closeBtn, 'click', () => {
					main_core.Dom.remove(alert.root);
				});
				return alert.root;
			},
			async renderPropertyDialog(formData) {
				const {
					renderPropertyDialog
				} = usePropertyDialog();
				const form = await renderPropertyDialog(this.$refs.contentContainer, formData);
				if (!form) {
					this.isLoading = false;
					this.hasSettings = false;
					return;
				}
				this.settingsForm = form;
				this.hasSettings = true;
				this.isLoading = false;
			},
			getDocuments() {
				return this.store.getAllBlockAncestors(this.currentBlock).reduce((acc, block) => {
					if (main_core.Type.isArrayFilled(block.activity.ReturnProperties)) {
						block.activity.ReturnProperties.forEach(property => {
							const id = `{=${block.id}:${property.Id}}`;
							if (property.Type === 'document') {
								acc.push({
									id,
									text: `${property.Name} (${block.activity.Properties.Title})`
								});
							}
						});
					}
					return acc;
				}, []);
			},
			validateForm(formData) {
				if (!this.nodeControls) {
					return;
				}
				this.hasErrors = false;
				this.nodeControls.forEach(field => {
					formData[field.fieldName];
					const escapedFieldName = field.fieldName.replaceAll(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
					const input = document.querySelector(`[name^="${escapedFieldName}"]`);
					if (!input) {
						return;
					}
					{
						main_core.Dom.removeClass(input, 'has-error');
					}
				});
			},
			handleFieldInput(event) {
				if (this.hasErrors) {
					main_core.Dom.removeClass(event.target, 'has-error');
				}
			},
			isUrl(value) {
				if (!value || !main_core.Type.isString(value)) {
					return false;
				}
				try {
					const u = new URL(value);
					return u.protocol === 'https:';
				} catch {
					return false;
				}
			},
			getSafeUrl(url) {
				if (!url || !main_core.Type.isString(url)) {
					return '';
				}
				try {
					const u = new URL(url.trim());
					if (u.protocol !== 'https:') {
						return '';
					}
					return u.href;
				} catch {
					return '';
				}
			},
			getBackgroundImage(url) {
				const safeUrl = this.getSafeUrl(url);
				if (!safeUrl) {
					return {};
				}
				return {
					'background-image': `url('${safeUrl}')`
				};
			},
			toggleActivation(event) {
				this.store.toggleBlockActivation(this.currentBlock.id, true);
			},
			syncActivatedField() {
				const activatedInput = document.getElementsByName('activated')[0];
				if (activatedInput) {
					activatedInput.value = activatedInput.value === 'Y' ? 'N' : 'Y';
				}
			},
			handleScroll() {
				main_core_events.EventEmitter.emit('Bizproc.NodeSettings:onScroll');
			},
			onDragStart() {
				this.isDragging = true;
				if (this.$refs.scrollContainer) {
					const rect = this.$refs.scrollContainer.getBoundingClientRect();
					this.scrollBoundaries = {
						top: rect.top + SCROLL_ZONE,
						bottom: rect.bottom - SCROLL_ZONE
					};
				}
				this.startAutoScroll();
			},
			onDragMove(event) {
				const {
					clientY
				} = event.getData();
				this.dragMouseY = clientY;
			},
			onDragEnd() {
				this.isDragging = false;
				this.scrollBoundaries = null;
				this.stopAutoScroll();
			},
			destroyRendererInstance() {
				if (this.rendererInstance && main_core.Type.isFunction(this.rendererInstance.destroy)) {
					this.rendererInstance.destroy();
				}
				this.rendererInstance = null;
			},
			startAutoScroll() {
				this.autoScrollFrameId = requestAnimationFrame(this.processAutoScroll);
			},
			stopAutoScroll() {
				if (this.autoScrollFrameId) {
					cancelAnimationFrame(this.autoScrollFrameId);
					this.autoScrollFrameId = null;
				}
			},
			processAutoScroll() {
				if (!this.isDragging || !this.$refs.scrollContainer || !this.scrollBoundaries) {
					return;
				}
				const container = this.$refs.scrollContainer;
				const topScrollBoundary = this.scrollBoundaries.top;
				const bottomScrollBoundary = this.scrollBoundaries.bottom;
				let scrollDelta = 0;
				if (this.dragMouseY < topScrollBoundary) {
					scrollDelta = -SCROLL_SPEED;
				} else if (this.dragMouseY > bottomScrollBoundary) {
					scrollDelta = SCROLL_SPEED;
				}
				if (scrollDelta !== 0) {
					container.scrollTop += scrollDelta;
				}
				this.autoScrollFrameId = requestAnimationFrame(this.processAutoScroll);
			},
			mountDynamicComponents() {
				Object.entries(this.dynamicComponents).forEach(([componentKey, component]) => {
					const escapedKey = CSS.escape(componentKey);
					const wrapper = this.$el.querySelector(`[data-component-key="${escapedKey}"]`);
					if (!wrapper || wrapper.children.length > 0) {
						return;
					}
					const field = this.customFieldsData[componentKey];
					if (field) {
						const app = ui_vue3.BitrixVue.createApp(component, {
							field
						});
						app.mount(wrapper);
						this.childVueApps.push(app);
					}
				});
			},
			resetDynamicComponents() {
				this.childVueApps.forEach(app => {
					if (app && main_core.Type.isFunction(app.unmount)) {
						app.unmount();
					}
				});
				this.childVueApps = [];
				this.dynamicComponents = {};
				this.customFieldsData = {};
			},
			unsubscribeCollectionRenderFinished() {
				if (this.collectionRenderFinishedHandler) {
					main_core.Event.EventEmitter.unsubscribe('BX.Bizproc.FieldType.onCollectionRenderControlFinished', this.collectionRenderFinishedHandler);
					this.collectionRenderFinishedHandler = null;
				}
			},
			cancelPendingCollectionRender() {
				this.unsubscribeCollectionRenderFinished();
				if (this.pendingCollectionRenderResolve) {
					this.pendingCollectionRenderResolve();
					this.pendingCollectionRenderResolve = null;
				}
			},
			cleanupFormResources() {
				this.cancelPendingCollectionRender();
				if (this.inputListeners && this.handleFieldInput) {
					this.inputListeners.forEach(input => {
						main_core.Event.unbind(input, 'input', this.handleFieldInput);
					});
					this.inputListeners = [];
				}
				this.resetDynamicComponents();
				if (main_core.Type.isFunction(this.rendererInstance?.destroy)) {
					this.rendererInstance.destroy();
				}
				this.rendererInstance = null;
				this.settingsForm = null;
			},
			blurActiveElementIfNeeded() {
				setTimeout(() => {
					const activeElement = document.activeElement;
					if (activeElement && this.$refs.settingsPanel?.contains(activeElement)) {
						activeElement.blur();
					}
				}, 150);
			},
			async onAskShowValueSelector(event) {
				const target = event.getTarget();
				const selector = new ValueSelector(this.store, this.currentBlock);
				const showOptions = {
					showOnlyRealProperties: event.getData().showOnlyRealProperties ?? false
				};
				const onSelect = event.getData().onSelect ?? null;
				const value = await selector.show(target, showOptions);
				if (onSelect && value) {
					onSelect.call(null, value, selector.selectedItem?.getCustomData().get('property'));
				}
			}
		},
		template: `
		<transition name="slide-fade">
			<div 
				v-if="isVisible"
				class="node-settings-panel"
				:class="{ '--loading': isLoading }"
				ref="settingsPanel"
			>
				<div class="node-settings-header">
					<h3 class="node-settings-title">{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TITLE')}}</h3>
					<span class="node-settings-title-close-icon" @click="handleFormCancel"></span>
				</div>
				<div class="node-settings-form__node-brief">
					<BlockHeader :block="block" :subIconExternal="isUrl(block.node?.icon)">
						<template #icon>
							<BlockIcon
								:iconName="icon"
								:iconColorIndex="colorIndex"
							/>
						</template>
						<template #subIcon
									v-if="isSubIcon">
							<div
								v-if="isUrl(block.node.icon)"
								:style="getBackgroundImage(block.node.icon)"
								class="ui-selector-item-avatar"
							/>
							<BlockIcon
								v-else
								:iconName="block.node.icon"
								:iconColorIndex="7"
								:iconSize="24"
							/>
						</template>
					</BlockHeader>
					<IconButton
						:icon-name="activationIcon"
						@click="toggleActivation"
					/>
				</div>
				<div class="node-settings-form__section-delimeter"></div>
				<Transition
					:css="shouldShowWithTransition"
					name="node-settings-transition"
				>
					<div v-show="!isLoading" class="node-settings-content" ref="scrollContainer">
						<div class="temp-block" v-show="!hasSettings">
							<div class="node-settings-content_empty-block"></div>
							<p>{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TEXT')}}</p>
						</div>
						<div ref="contentContainer"></div>
					</div>
				</Transition>
				<div
					v-show="isLoading || hasSettings"
					class="node-settings-footer"
				>
					<template v-if="hasSettings">
						<button 
							class="ui-btn --air ui-btn-lg --style-outline-fill-accent ui-btn-no-caps"
							@click="handleFormSave"
						>
							{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE')}}
						</button>
						<button
							class="ui-btn --air ui-btn-lg --style-outline ui-btn-no-caps"
							@click="handleFormCancel"
						>
							{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CANCEL')}}
						</button>

						<div class="node-settings-document-selector" v-show="useDocumentContext">
							<BIcon
								name="document"
								:size="24"
								@click="handleDocumentSelector"
							/>
						</div>
					</template>
				</div>
			</div>
		</transition>
	`
	};

	const OperatorPhraseCodes = Object.freeze({
		[CONSTRUCTION_OPERATORS.equal]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_EQUAL',
		[CONSTRUCTION_OPERATORS.notEqual]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_NOT_EQUAL',
		[CONSTRUCTION_OPERATORS.empty]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_EMPTY',
		[CONSTRUCTION_OPERATORS.notEmpty]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_NOT_EMPTY',
		[CONSTRUCTION_OPERATORS.contain]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_CONTAIN',
		[CONSTRUCTION_OPERATORS.notContain]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_NOT_CONTAIN',
		[CONSTRUCTION_OPERATORS.in]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_IN',
		[CONSTRUCTION_OPERATORS.notIn]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_NOT_IN',
		[CONSTRUCTION_OPERATORS.greaterThan]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_GREATER_THAN',
		[CONSTRUCTION_OPERATORS.greaterThanOrEqual]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_GREATER_THAN_OR_EQUAL',
		[CONSTRUCTION_OPERATORS.lessThan]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_LESS_THAN',
		[CONSTRUCTION_OPERATORS.lessThanOrEqual]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR_LESS_THAN_OR_EQUAL'
	});
	const OperatorRequiresValue = operator => {
		switch (operator) {
			case CONSTRUCTION_OPERATORS.empty:
			case CONSTRUCTION_OPERATORS.notEmpty:
				return false;
			default:
				return true;
		}
	};

	const CustomDataFieldKey = 'field';
	class FieldSelector {
		constructor(currentBlock, currentPortId) {
			this.store = diagramStore();
			this.currentBlock = currentBlock;
			this.currentPortId = currentPortId;
		}
		show(targetElement) {
			return new Promise(resolve => {
				const dialog = new ui_entitySelector.Dialog({
					targetNode: targetElement,
					width: 500,
					height: 300,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					items: this.#getItems(),
					tabs: this.#getTabs(),
					entities: this.#getEntities(),
					cacheable: false,
					showAvatars: false,
					events: {
						'Item:onSelect': event => {
							resolve(this.#getValue(event.getData().item));
						}
					},
					compactView: true
				});
				dialog.show();
			});
		}
		#getValue(item) {
			const field = {
				...item.getCustomData().get(CustomDataFieldKey)
			};
			if (item.getEntityId() === 'bizproc-document') {
				return {
					...field,
					fieldId: item.getId()
				};
			}
			return field;
		}
		#getEntities() {
			return [{
				id: 'bizproc-document'
			}];
		}
		#getTabs() {
			return [{
				id: 'documents',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_DOCUMENTS'),
				icon: 'elements'
			}, {
				id: 'returns',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_RETURNS'),
				icon: 'flag-1'
			}, {
				id: 'template',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_TEMPLATE'),
				icon: 'disk'
			}];
		}
		#getItems() {
			const items = this.getReturnItems();
			this.addTemplateItems(items);
			return items;
		}
		addTemplateItems(items) {
			const map = [{
				key: 'PARAMETERS',
				idKey: 'Template',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_PARAMETERS')
			}, {
				key: 'VARIABLES',
				idKey: 'Variable',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_VARIABLES')
			}, {
				key: 'CONSTANTS',
				idKey: 'Constant',
				title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_CONSTANTS')
			}];
			map.forEach(elem => {
				const collection = this.store.template[elem.key];
				if (main_core.Type.isObject(collection) && Object.keys(collection).length > 0) {
					const children = [];
					Object.keys(collection).forEach(key => {
						const item = collection[key];
						const id = `${elem.idKey}:${key}`;
						children.push({
							id,
							entityId: elem.key,
							title: item.Name,
							customData: {
								[CustomDataFieldKey]: {
									object: elem.idKey,
									fieldId: key,
									type: item.Type,
									multiple: item.Multiple
								}
							}
						});
					});
					items.push({
						id: elem.idKey,
						entityId: 'template',
						title: elem.title,
						tabs: 'template',
						children
					});
				}
			});
		}
		getReturnItems() {
			const blocks = this.store.getBlockAncestorsByInputPortId(this.currentBlock, this.currentPortId);
			return blocks.reduce((acc, block) => {
				if (main_core.Type.isArrayFilled(block.activity.Children)) {
					const properties = this.#processChildrenProperties(block);
					if (main_core.Type.isArrayFilled(properties)) {
						acc.push(...properties);
					}
				}
				if (main_core.Type.isArrayFilled(block.activity.ReturnProperties)) {
					const properties = this.#processReturnProperties(block);
					if (main_core.Type.isArrayFilled(properties)) {
						acc.push(...properties);
					}
				}
				return acc;
			}, []);
		}
		#processReturnProperties(block) {
			const fullTitle = block.activity.Properties.Title;
			const {
				documents,
				properties
			} = block.activity.ReturnProperties.reduce((res, property) => {
				const activityName = block.activity?.Name || block.id;
				const id = `${block.id}:${property.Id}`;
				if (property.Type === 'document') {
					res.documents.push({
						id,
						entityId: 'bizproc-document',
						entityType: 'document',
						title: fullTitle,
						customData: {
							idTemplate: `${property.Id}.#FIELD#`,
							document: property.Default,
							[CustomDataFieldKey]: {
								object: activityName
							}
						},
						nodeOptions: {
							open: false,
							dynamic: true
						},
						searchable: false,
						tabs: 'documents'
					});
					return res;
				}
				res.properties.push({
					id,
					entityId: 'block-node-property',
					title: property.Name,
					property,
					block,
					customData: {
						[CustomDataFieldKey]: {
							object: activityName,
							fieldId: property.Id,
							type: property.Type,
							multiple: property.Multiple
						}
					}
				});
				return res;
			}, {
				documents: [],
				properties: []
			});
			const result = [];
			if (main_core.Type.isArrayFilled(documents)) {
				result.push(...documents);
			}
			if (main_core.Type.isArrayFilled(properties)) {
				result.push({
					id: block.id,
					entityId: 'block-node',
					tabs: 'returns',
					title: fullTitle,
					children: properties,
					searchable: false
				});
			}
			return result;
		}
		#processChildrenProperties(block) {
			const childrenProperties = [];
			block.activity.Children.forEach(activity => {
				if (main_core.Type.isArrayFilled(activity.ReturnProperties)) {
					const properties = this.#processReturnProperties({
						id: activity.Name,
						activity
					});
					if (main_core.Type.isArrayFilled(properties)) {
						childrenProperties.push(...properties);
					}
				}
			});
			const {
				documents,
				activities
			} = childrenProperties.reduce((res, child) => {
				if (child) {
					if (child.entityId === 'bizproc-document') {
						res.documents.push(child);
					} else {
						res.activities.push(child);
					}
				}
				return res;
			}, {
				documents: [],
				activities: []
			});
			const properties = [];
			if (main_core.Type.isArrayFilled(documents)) {
				properties.push({
					id: block.id,
					entityId: 'block-node',
					tabs: 'documents',
					title: block.activity.Properties.Title,
					children: documents,
					searchable: false
				});
			}
			if (main_core.Type.isArrayFilled(activities)) {
				properties.push({
					id: block.id,
					entityId: 'block-node',
					tabs: 'returns',
					title: block.activity.Properties.Title,
					children: activities,
					searchable: false
				});
			}
			return properties;
		}
	}

	// @vue/component
	const EditConditionExpression = {
		name: 'EditConditionExpression',
		props: {
			/** @type ConditionConstruction */
			construction: {
				type: Object,
				required: true
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule']),
			availableOperators() {
				return Object.values(CONSTRUCTION_OPERATORS).map(operator => ({
					id: operator,
					title: this.getMessage(OperatorPhraseCodes[operator] ?? '')
				}));
			},
			selectedField: {
				get() {
					return this.construction.expression.field;
				},
				set(field) {
					this.changeRuleExpression(this.construction, {
						field,
						value: '',
						operator: ''
					});
				}
			},
			selectedFieldTitle() {
				if (!this.selectedField) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
				}
				const store = diagramStore();
				const connectedBlocks = store.getBlockAncestorsByInputPortId(this.block, this.currentRule.id);
				return evaluateConditionExpressionFieldTitle(connectedBlocks, this.selectedField);
			},
			selectedValue: {
				get() {
					return this.construction.expression.value;
				},
				set(value) {
					this.changeRuleExpression(this.construction, {
						value
					});
				}
			},
			selectedOperatorTitle() {
				return this.availableOperators.find(({
					id
				}) => id === this.selectedOperator)?.title ?? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
			},
			selectedOperator: {
				get() {
					return this.construction.expression.operator;
				},
				set(operator) {
					this.changeRuleExpression(this.construction, {
						operator
					});
				}
			},
			isShowValueEditor() {
				if (!this.selectedOperator) {
					return false;
				}
				return OperatorRequiresValue(this.selectedOperator);
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['changeRuleExpression']),
			onShowFieldChooseMenu(event) {
				const fieldSelector = new FieldSelector(this.block, this.currentRule.id);
				void fieldSelector.show(event.target).then(field => {
					this.selectedField = field;
				});
			},
			onShowValueMenu(event) {
				if (!this.block) {
					return;
				}
				const valueSelector = new ValueSelector(diagramStore(), this.block, this.currentRule.id);
				void valueSelector.show(event.target).then(value => {
					this.selectedValue += value;
				});
			},
			onShowOperatorMenu(event) {
				const items = this.availableOperators.map(({
					id,
					title
				}) => {
					return {
						id,
						text: title,
						onclick: () => {
							this.selectedOperator = id;
							this.operatorMenu?.close();
						}
					};
				});
				this.operatorMenu = main_popup.MenuManager.create({
					id: 'operator-menu',
					bindElement: event.target,
					items,
					closeByEsc: true,
					autoHide: true,
					cacheable: false,
					maxHeight: 200
				});
				this.operatorMenu.show();
			}
		},
		template: `
		<div>
			<div class="editor-chart-node-settings-edit-condition-expression-form__item">
				<span class="editor-chart-node-settings-edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-condition-expression-form__dropdown">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						ref="fieldChooseMenu"
						class="ui-ctl-element"
						:title="selectedFieldTitle"
						@click="onShowFieldChooseMenu"
					>
						{{ selectedFieldTitle }}
					</div>
				</div>
			</div>
			<div class="editor-chart-node-settings-edit-condition-expression-form__item">
				<span class="editor-chart-node-settings-edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-condition-expression-form__dropdown"
					 @click="onShowOperatorMenu"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						class="ui-ctl-element"
					>
						{{ selectedOperatorTitle }}
					</div>
				</div>
			</div>
			<div v-if="isShowValueEditor"
				class="editor-chart-node-settings-edit-condition-expression-form__item"
			>
				<span class="editor-chart-node-settings-edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-condition-expression-form__dropdown">
					<div class="ui-ctl-after ui-ctl-icon-dots" style="pointer-events: all"
						 @click="onShowValueMenu"
					></div>
					<input
						class="ui-ctl-element"
						v-model="selectedValue"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const AddConstruction = {
		name: 'AddConstruction',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type TRuleCard */
			ruleCard: {
				type: [Object, null],
				default: null
			},
			position: {
				type: [Number, undefined],
				default: undefined
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings'])
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['addConstruction', 'addRuleCard']),
			onShowMenu() {
				this.menu = main_popup.MenuManager.create('constructions-menu', this.$refs.constructionsMenu, this.getMenuItems(), {
					closeByEsc: true,
					autoHide: true,
					cacheable: false,
					offsetLeft: -50,
					offsetTop: 7
				});
				this.menu.show();
			},
			getMenuItems() {
				return [{
					id: CONSTRUCTION_TYPES.AND_CONDITION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BOOLEAN_MENU_ITEM'),
					onclick: this.onClickMenuItem,
					dataset: {
						testId: 'complexNodeRuleSettingsMenuItemConstructionAnd'
					},
					disabled: this.isIfConditionNotExist(this.ruleCard)
				}, {
					id: CONSTRUCTION_TYPES.IF_CONDITION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_MENU_ITEM'),
					dataset: {
						testId: 'complexNodeRuleSettingsMenuItemConstructionIf'
					},
					onclick: this.onClickMenuItem
				}, {
					id: CONSTRUCTION_TYPES.ACTION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_MENU_ITEM'),
					dataset: {
						testId: 'complexNodeRuleSettingsMenuItemConstructionAction'
					},
					onclick: this.onClickMenuItem,
					disabled: this.nodeSettings.actions.size === 0
				}, {
					id: CONSTRUCTION_TYPES.OUTPUT,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT_MENU_ITEM'),
					dataset: {
						testId: 'complexNodeRuleSettingsMenuItemConstructionOutput'
					},
					onclick: this.onClickMenuItem
				}];
			},
			onClickMenuItem(...args) {
				const [, menuItem] = args;
				const ruleCard = this.ruleCard ?? this.addRuleCard();
				this.addConstruction(ruleCard, menuItem.id, this.position);
				this.menu.close();
			},
			isIfConditionNotExist(ruleCard) {
				if (!ruleCard) {
					return true;
				}
				return ruleCard.constructions.every(construction => {
					return construction.type === CONSTRUCTION_TYPES.ACTION;
				});
			}
		},
		template: `
		<div
			class="editor-chart-node-settings-add-construction"
			@click="onShowMenu"
		>
			<BIcon
				name="plus-m"
				:size="20"
				color="#828b95"
			/>
			<span ref="constructionsMenu">
				<slot>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_CONSTRUCTION_LABEL') }}
				</slot>
			</span>
		</div>
	`
	};

	// @vue/component
	const DeleteConstruction = {
		name: 'DeleteConstruction',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			iconColor: {
				type: String,
				required: true
			},
			/** @type TRuleCard */
			ruleCard: {
				type: Object,
				required: true
			},
			/** @type Construction */
			construction: {
				type: Object,
				required: true
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['deleteConstruction'])
		},
		template: `
		<BIcon
			:color="iconColor"
			:data-test-id="$testId('complexNodeRuleSettingsDeleteConstruction', construction.id)"
			class="editor-chart-node-settings-delete-construction"
			name="cross-s"
			@click="deleteConstruction(ruleCard, construction)"
		/>
	`
	};

	// @vue/component
	const SelectBooleanType = {
		name: 'SelectBooleanType',
		props: {
			/** @type Construction */
			construction: {
				type: Object,
				required: true
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		computed: {
			selectedType: {
				get() {
					return this.construction.type;
				},
				set(value) {
					this.selectBooleanType(value);
				}
			},
			booleanTypes() {
				return [CONSTRUCTION_TYPES.AND_CONDITION, CONSTRUCTION_TYPES.OR_CONDITION];
			},
			constructionLabels() {
				return CONSTRUCTION_LABELS;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['selectBooleanType']),
			onClick(booleanType) {
				this.selectedType = booleanType;
				this.selectBooleanType(this.construction, booleanType);
			}
		},
		template: `
		<div class="editor-chart-node-settings-boolean-type-switcher">
			<span
				v-for="booleanType in booleanTypes"
				class="editor-chart-node-settings-boolean-type-switcher_tab"
				:class="{ '--selected': selectedType === booleanType }"
				@click="onClick(booleanType)"
			>
				{{ getMessage(constructionLabels[booleanType]) }}
			</span>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	const SelectRule = {
		name: 'SelectRule',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['currentRule', 'ports']),
			currentRuleTitle() {
				const {
					title
				} = this.ports.find(port => port.id === this.currentRule.id);
				return title;
			},
			menuItems() {
				const ports = this.currentRule.type === PORT_TYPES.input ? this.ports.filter(port => port.type === PORT_TYPES.input) : this.ports.filter(port => port.type === PORT_TYPES.inputRelation);
				return ports.map(port => {
					return {
						id: port.id,
						text: port.title,
						dataset: {
							testId: `menuItemRule-${port.id}`
						},
						onclick: () => {
							this.setCurrentRule(port);
							this.menu.close();
						}
					};
				});
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['setCurrentRule']),
			onShowMenu() {
				this.menu = main_popup.MenuManager.create('constructions-menu', this.$refs.nodeSettingsRulesDropdown, this.menuItems, {
					width: 100,
					maxHeight: 200,
					closeByEsc: true,
					autoHide: true,
					cacheable: false
				});
				this.menu.show();
			}
		},
		template: `
		<div
			class="editor-chart-node-settings-rules-dropdown"
			ref="nodeSettingsRulesDropdown"
			:data-test-id="$testId('complexNodeRuleSettingsDropdown')"
			@click="onShowMenu"
		>
			<span class="editor-chart-node-settings-rules-dropdown__value">
				{{ currentRuleTitle }}
			</span>
			<BIcon
				:size="14"
				name="chevron-down"
				color="#525C69"
			/>
		</div>
	`
	};

	// @vue/component
	const SaveSettingsButton = {
		name: 'save-settings-button',
		props: {
			isSaving: {
				type: Boolean,
				required: true
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		template: `
		<button
			class="ui-btn --air ui-btn-lg ui-btn-no-caps"
			:class="{'ui-btn-wait': isSaving }"
		>
			{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE') }}
		</button>
	`
	};

	// @vue/component
	const CancelSettingsButton = {
		name: 'cancel-settings-button',
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		template: `
		<button class="ui-btn ui-btn-lg ui-btn-link ui-btn-no-caps">
			{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DISCARD') }}
		</button>
	`
	};

	// @vue/component
	const DeleteRuleCard = {
		name: 'DeleteRuleCard',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type TRuleCard */
			ruleCard: {
				type: Object,
				required: true
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['deleteRuleCard'])
		},
		template: `
		<BIcon
			class="editor-chart-node-settings-delete-rule-card"
			name="cross-m"
			:size="20"
			:data-test-id="$testId('complexNodeRuleSettingsDeleteRuleCard', ruleCard.id)"
			color="#a8adb4"
			@click="deleteRuleCard(ruleCard)"
		/>
	`
	};

	const Status = Object.freeze({
		Loading: 'loading',
		Loaded: 'loaded',
		Error: 'error'
	});
	const CorrectDocumentTypeLength = 3;
	const formInputTrackerHandlers = new WeakMap();
	const vFormInputTracker = {
		mounted(el, binding) {
			const handler = () => binding.value();
			formInputTrackerHandlers.set(el, handler);
			main_core.Event.bind(el, 'input', handler);
		},
		beforeUnmount(el) {
			const handler = formInputTrackerHandlers.get(el);
			if (handler) {
				main_core.Event.unbind(el, 'input', handler);
				formInputTrackerHandlers.delete(el);
			}
		}
	};
	const vBxControl = {
		mounted(el, binding) {
			if (binding.value) {
				main_core.Dom.append(binding.value, el);
			}
		}
	};

	// @vue/component
	const EditExtendedAction = {
		name: 'edit-extended-action',
		components: {
			Loader
		},
		directives: {
			FormInputTracker: vFormInputTracker,
			BxControl: vBxControl
		},
		props: {
			/** @type Construction */
			construction: {
				type: Object,
				required: true
			},
			actionId: {
				type: String,
				required: true
			},
			/** @type DiagramTemplate | null */
			template: {
				type: [Object, null],
				required: true
			},
			documentType: {
				type: Array,
				required: true
			},
			/** @type ActivityData | null */
			activityData: {
				type: [Object, null],
				required: true
			},
			selectedDocument: {
				type: [String, null],
				required: false,
				default: null
			}
		},
		setup() {
			const store = diagramStore();
			const isActionFormLoading = ui_vue3.inject('isActionFormLoading', ui_vue3.ref(false));
			return {
				store,
				isActionFormLoading
			};
		},
		data() {
			return {
				status: '',
				settingsForm: null,
				nodeControls: null,
				renderedControlsMap: null,
				rendererInstance: null,
				lastRenderRequestId: 0
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['block', 'currentRule', 'nodeSettings']),
			Status: () => Status,
			action() {
				return this.nodeSettings.actions.get(this.actionId);
			},
			propertiesDialogDocumentType() {
				return this.getPropertyDialogDocumentType(this.selectedDocument);
			},
			connectedBlocks() {
				return this.store.getAllBlockAncestors(this.block, this.currentRule.id);
			},
			isPropertiesDialogDocumentTypeReady() {
				return this.propertiesDialogDocumentType.length === CorrectDocumentTypeLength;
			}
		},
		watch: {
			actionId(newVal, oldVal) {
				if (newVal === oldVal) {
					return;
				}
				this.init();
			},
			selectedDocument(newVal, oldVal) {
				if (newVal === oldVal) {
					return;
				}
				const newPropertyDialogDocumentType = this.getPropertyDialogDocumentType(newVal);
				const oldPropertyDialogDocumentType = this.getPropertyDialogDocumentType(oldVal);
				if (!deepEqual(newPropertyDialogDocumentType, oldPropertyDialogDocumentType)) {
					this.init();
				}
			},
			status(newVal) {
				this.isActionFormLoading = newVal === Status.Loading;
			}
		},
		mounted() {
			this.init();
		},
		unmounted() {
			this.lastRenderRequestId++;
			this.unsubscribe();
			this.cleanupFormResources();
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['changeRuleExpression']),
			isRenderCancelled(requestId) {
				return this.lastRenderRequestId !== requestId;
			},
			async init() {
				if (!this.isPropertiesDialogDocumentTypeReady) {
					this.isActionFormLoading = false;
					this.clearForm();
					this.onChange();
					return;
				}
				try {
					await this.loadForm();
					this.subscribeOnBeforeSubmit();
				} catch (error) {
					this.status = Status.Error;
					console.error(error);
				}
			},
			subscribeOnBeforeSubmit() {
				this.unsubscribe();
				this.onChangeCallback = () => this.onChange();
				main_core_events.EventEmitter.subscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onChangeCallback);
			},
			unsubscribe() {
				if (this.onChangeCallback) {
					main_core_events.EventEmitter.unsubscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onChangeCallback);
				}
			},
			async loadForm() {
				const requestId = ++this.lastRenderRequestId;
				this.clearForm();
				this.status = Status.Loading;
				let activity = this.activityData;
				if (!activity) {
					const defaultProps = main_core.Type.isPlainObject(this.action.properties) ? {
						...this.action.properties
					} : {};
					activity = {
						Name: createUniqueId(),
						Type: this.actionId,
						Activated: 'Y',
						Properties: {
							Title: this.action.title,
							...defaultProps
						}
					};
				}
				const compatibleTemplate = [{
					Type: 'NodeWorkflowActivity',
					Children: [],
					Name: 'Template'
				}];
				compatibleTemplate[0].Children.push(activity, ...this.store.getAllBlockAncestors(this.block, this.currentRule.id).map(b => b.activity));
				try {
					const settingControls = await editorAPI.getNodeSettingsControls({
						documentType: this.propertiesDialogDocumentType,
						activity,
						workflow: {
							workflowParameters: JSON.stringify(this.template?.PARAMETERS ?? {}),
							workflowVariables: JSON.stringify(this.template?.VARIABLES ?? {}),
							workflowTemplate: JSON.stringify(compatibleTemplate),
							workflowConstants: JSON.stringify(this.template?.CONSTANTS ?? {})
						}
					});
					if (this.isRenderCancelled(requestId)) {
						return;
					}
					if (main_core.Type.isArray(settingControls?.controls)) {
						await this.renderNodeControls(settingControls.controls, requestId, activity);
					} else {
						const {
							createFormData
						} = usePropertyDialog();
						const formData = createFormData({
							id: activity.Name,
							documentType: this.propertiesDialogDocumentType,
							activity: this.actionId,
							workflow: {
								parameters: this.template?.PARAMETERS ?? [],
								variables: this.template?.VARIABLES ?? [],
								template: compatibleTemplate,
								constants: this.template?.CONSTANTS ?? []
							}
						});
						await this.renderPropertyDialog(formData);
					}
					this.status = Status.Loaded;
				} catch (e) {
					if (!this.isRenderCancelled(requestId)) {
						this.status = Status.Error;
						throw e;
					}
				}
			},
			async renderNodeControls(controls, requestId, activity) {
				this.nodeControls = this.prepareNodeControls(controls);
				const renderedControls = this.getRenderedControlsCollection();
				if (this.isRenderCancelled(requestId)) {
					return;
				}
				const customRenderers = this.initRendererInstance();
				this.renderedControlsMap = this.buildRenderedControlsMap(renderedControls, customRenderers);
				await this.waitForRenderFinished(requestId, renderedControls);
			},
			prepareNodeControls(controls) {
				const isNewActivity = !this.activityData;
				return controls.map(control => {
					const property = control.property || {};
					let currentValue = control.value;
					if (isNewActivity && property.Default !== undefined) {
						const isValueEmpty = currentValue === undefined || currentValue === null || currentValue === '' || main_core.Type.isArray(currentValue) && currentValue.length === 0;
						if (isValueEmpty) {
							currentValue = property.Default;
						}
					}
					return {
						...control,
						value: currentValue,
						fieldName: property.FieldName || null,
						controlId: property.FieldName || null
					};
				});
			},
			getRenderedControlsCollection() {
				return BX.Bizproc.FieldType.renderControlCollection(this.propertiesDialogDocumentType, this.nodeControls.filter(field => field.property.Type !== 'custom'), 'designer');
			},
			initRendererInstance() {
				const rendererName = `${this.actionId}Renderer`;
				const RendererClass = main_core.Type.isFunction(window[rendererName]) ? window[rendererName] : null;
				if (!RendererClass) {
					return null;
				}
				this.rendererInstance = new RendererClass();
				return main_core.Type.isFunction(this.rendererInstance.getControlRenderers) ? this.rendererInstance.getControlRenderers() : null;
			},
			buildRenderedControlsMap(renderedControls, customRenderers) {
				const map = {};
				this.nodeControls.forEach(field => {
					let control = renderedControls[field.controlId];
					if (field.property.Type === 'custom' && this.rendererInstance && customRenderers) {
						const renderer = customRenderers[field.property.CustomType];
						if (main_core.Type.isFunction(renderer)) {
							control = renderer(field);
						}
					}
					if (control) {
						map[field.controlId] = control;
					}
				});
				return map;
			},
			waitForRenderFinished(requestId, renderedControls) {
				this.cleanupRenderFinishedHandler();
				return new Promise(resolve => {
					const eventName = 'BX.Bizproc.FieldType.onCollectionRenderControlFinished';
					const handler = async () => {
						if (!this.isCollectionRendered(renderedControls)) {
							return;
						}
						this.cleanupRenderFinishedHandler();
						await this.$nextTick();
						if (!this.isRenderCancelled(requestId)) {
							if (this.rendererInstance?.afterFormRender) {
								this.rendererInstance.afterFormRender(this.$refs.settingsForm);
							}
							this.settingsForm = this.$refs.settingsForm;
						}
						resolve();
					};
					this.pendingRenderFinishedHandler = {
						eventName,
						handler
					};
					main_core.Event.EventEmitter.subscribe(eventName, handler);
				});
			},
			isCollectionRendered(renderedControls) {
				return Object.values(renderedControls).every(node => node.childElementCount > 0 || node.textContent !== '...');
			},
			cleanupRenderFinishedHandler() {
				if (this.pendingRenderFinishedHandler) {
					const {
						eventName,
						handler
					} = this.pendingRenderFinishedHandler;
					main_core.Event.EventEmitter.unsubscribe(eventName, handler);
					this.pendingRenderFinishedHandler = null;
				}
			},
			async renderPropertyDialog(formData) {
				const {
					renderPropertyDialog
				} = usePropertyDialog();
				const form = await renderPropertyDialog(this.$refs.contentContainer, formData);
				if (form) {
					this.settingsForm = form;
				}
			},
			clearForm() {
				this.cleanupFormResources();
				this.renderedControlsMap = null;
				this.nodeControls = null;
				if (this.$refs.contentContainer) {
					this.$refs.contentContainer.innerHTML = '';
				}
			},
			cleanupFormResources() {
				this.cleanupRenderFinishedHandler();
				if (this.rendererInstance && main_core.Type.isFunction(this.rendererInstance.destroy)) {
					this.rendererInstance.destroy();
				}
				this.rendererInstance = null;
				this.settingsForm = null;
			},
			getFormData() {
				return this.extractFormData(this.settingsForm);
			},
			onChange() {
				this.changeRuleExpression(this.construction, {
					rawActivityData: this.getFormData()
				});
			},
			extractFormData(form) {
				if (!form) {
					return null;
				}
				const formData = main_core.ajax.prepareForm(form).data;
				return {
					...formData,
					activityType: this.actionId,
					documentType: this.propertiesDialogDocumentType,
					id: main_core.Type.isStringFilled(formData.activity_id) ? formData.activity_id : createUniqueId()
				};
			},
			getPropertyDialogDocumentType(selectedDocument) {
				if (!this.action) {
					return [];
				}
				if (!main_core.Type.isArrayFilled(this.nodeSettings.fixedDocumentType)) {
					return this.documentType;
				}
				if (!this.action.handlesDocument) {
					return this.nodeSettings.fixedDocumentType.length < CorrectDocumentTypeLength ? this.documentType : this.nodeSettings.fixedDocumentType;
				}
				if (!selectedDocument) {
					return [];
				}
				if (this.nodeSettings.fixedDocumentType.length === CorrectDocumentTypeLength) {
					return this.nodeSettings.fixedDocumentType;
				}
				return evaluateActionExpressionDocumentType(this.connectedBlocks, selectedDocument);
			},
			onFormClick(event) {
				const {
					target
				} = event;
				if (!target || !(target instanceof HTMLElement)) {
					return;
				}
				if (this.isSelectorButton(target)) {
					event.stopPropagation();
					void this.showSelector(target);
				}
			},
			isSelectorButton(element) {
				return element.getAttribute('data-role') === 'bp-selector-button';
			},
			async showSelector(targetElement) {
				let inputElement = null;
				const propsAttr = targetElement.getAttribute('data-bp-selector-props');
				if (propsAttr) {
					const controlId = JSON.parse(propsAttr)?.controlId ?? null;
					if (controlId) {
						inputElement = this.settingsForm.querySelector(`#${CSS.escape(controlId)}`);
					}
				}
				if (!inputElement) {
					inputElement = targetElement.closest('.field-row')?.querySelector('input[type="text"], textarea');
				}
				if (!inputElement) {
					return;
				}
				const selector = new ValueSelector(this.store, this.block, this.currentRule.id);
				try {
					const value = await selector.show(targetElement);
					const beforePart = inputElement.value.slice(0, inputElement.selectionEnd || 0);
					const middlePart = value;
					const afterPart = inputElement.value.slice(inputElement.selectionEnd || 0);
					inputElement.value = beforePart + middlePart + afterPart;
					inputElement.selectionEnd = beforePart.length + middlePart.length;
					inputElement.focus();
					inputElement.dispatchEvent(new window.Event('change'));
					this.onChange();
				} catch (error) {
					console.error(error);
				}
			}
		},
		template: `
		<Loader v-if="status === Status.Loading"/>
		<form
			v-if="renderedControlsMap"
			id="form-settings-extended"
			ref="settingsForm"
			@click.capture="onFormClick"
			v-form-input-tracker="onChange"
		>
			<div
				v-for="field in nodeControls"
				:key="field.fieldName"
				class="node-settings-edit-box"
				:class="{ hidden: field.property.Hidden }"
				:id="'row_' + field.fieldName"
			>
				<div class="edit-action-expression-form__label">{{ field.property.Name }}</div>
				<div class="field-row" v-bx-control="renderedControlsMap[field.controlId]"></div>
			</div>
		</form>
		<div
			v-else
			@click.capture="onFormClick"
			v-form-input-tracker="onChange"
			ref="contentContainer"
		></div>
	`
	};

	// @vue/component
	const NodeSettings = {
		name: 'NodeSettings',
		components: {
			NodeSettingsLayout,
			EditNodeSettingsForm,
			CancelSettingsButton,
			SaveSettingsButton,
			NodeSettingsPreview,
			AddSettingsItem
		},
		computed: {
			...ui_vue3_pinia.mapState(diagramStore, ['documentType', 'connections']),
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['block', 'isShown', 'nodeSettings', 'isLoading', 'isSaving', 'ports']),
			...ui_vue3_pinia.mapWritableState(useNodeSettingsStore, ['isSaving'])
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['toggleVisibility', 'toggleRuleSettingsVisibility', 'reset', 'setCurrentRule', 'deleteRuleSettings', 'saveForm', 'discardFormSettings', 'addRulePort', 'deletePort']),
			...ui_vue3_pinia.mapActions(diagramStore, ['updateNodeTitle', 'publicDraft', 'updateBlockActivityField', 'setPorts', 'getBlockAncestorsByInputPortId', 'deleteConnectionByBlockIdAndPortId']),
			...ui_vue3_pinia.mapActions(useAppStore, ['hideRightPanel']),
			onShowConstructions(port) {
				this.toggleRuleSettingsVisibility(true);
				this.setCurrentRule(port);
			},
			async deleteRule(ruleId) {
				const connections = [...this.connections];
				this.deletePort(ruleId);
				const {
					outputPortsToAdd,
					outputPortsToDelete
				} = this.deleteRuleSettings(ruleId);
				outputPortsToAdd.forEach(({
					portId,
					title
				}) => {
					this.addRulePort(portId, PORT_TYPES.output, title);
				});
				outputPortsToDelete.forEach(portId => {
					this.deletePort(portId);
					this.deleteConnectionByBlockIdAndPortId(this.block.id, portId);
				});
				this.deleteConnectionByBlockIdAndPortId(this.block.id, ruleId);
				if (this.connections.length < connections.length) {
					await this.publicDraft();
				}
			},
			deleteRelation(relationId) {
				this.deletePort(relationId);
			},
			async onSaveForm() {
				try {
					this.isSaving = true;
					const activityData = await this.saveForm(this.documentType);
					this.updateBlockActivityField(this.block.id, activityData);
					this.setPorts(this.block.id, this.ports);
					this.updateNodeTitle(this.block.id, this.nodeSettings.title);
					await this.publicDraft();
					this.hideSettings();
				} catch (e) {
					console.error(e);
				} finally {
					this.isSaving = false;
				}
			},
			hideSettings() {
				this.hideRightPanel();
				this.toggleVisibility(false);
				this.reset();
			},
			onClose() {
				this.discardFormSettings();
				this.hideSettings();
			}
		},
		template: `
		<NodeSettingsLayout
			:isLoading="isLoading"
			:isSaving="isSaving"
			:isShown="isShown"
			@close="onClose"
		>
			<template #default>
				<EditNodeSettingsForm
					:block="block"
					:ports="ports"
				>
					<template #preview="{ port }">
						<NodeSettingsPreview
							:port="port"
							:nodeSettings="nodeSettings"
							:connectedBlocks="getBlockAncestorsByInputPortId(block, port)"
							@showConstructions="onShowConstructions(port)"
							@deletePreview="deleteRule(port.id)"
						>
							{{ port.title }}
						</NodeSettingsPreview>
					</template>

					<template #addSettingsItem="{ text, itemType }">
						<AddSettingsItem
							:itemType="itemType"
						>
							{{ text }}
						</AddSettingsItem>
					</template>
				</EditNodeSettingsForm>
			</template>

			<template #actions>
				<SaveSettingsButton
					:isSaving="isSaving"
					:data-test-id="$testId('complexNodeSettingsSave')"
					@click="onSaveForm"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeSettingsDiscard')"
					@click="onClose"
				/>
			</template>
		</NodeSettingsLayout>
		<slot
			v-if="isShown"
		/>
	`
	};

	const OUTPUT_LABELS = {
		rule: 'E',
		relation: 'NE'
	};

	// @vue/component
	const EditOutputExpression = {
		name: 'EditOutputExpression',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Popup: ui_vue3_components_popup.Popup
		},
		props: {
			/** @type OutputConstruction */
			construction: {
				type: Object,
				required: true
			},
			isScrolling: {
				type: Boolean,
				required: true
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		data() {
			return {
				isPopupShown: false,
				allOutputPorts: []
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule']),
			selectedPort: {
				get() {
					const {
						portId,
						title
					} = this.construction.expression;
					return {
						title,
						portId
					};
				},
				set(output) {
					const {
						portId,
						title
					} = output;
					this.changeRuleExpression(this.construction, {
						portId,
						title
					});
				}
			},
			notSelectedMessage() {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
			},
			popupOptions() {
				return {
					id: 'edit-output-expression-popup',
					bindElement: this.$refs.nodeSettingsRuleOutputDropdown,
					minHeight: 100,
					maxHeight: 200,
					padding: 0,
					width: 200
				};
			},
			portId() {
				const nextPortNumber = this.allOutputPorts.reduce((acc, currentValue) => Math.max(acc, parseInt(currentValue.portId.slice(1), 10)), 0) + 1;
				return `o${nextPortNumber}`;
			},
			portTitle() {
				const lastPort = this.ports[this.ports.length - 1];
				const label = this.portType === PORT_TYPES.output ? OUTPUT_LABELS.rule : OUTPUT_LABELS.relation;
				const num = lastPort?.title.split(label)[1] ?? 0;
				return `${label}${Number(num) + 1}`;
			},
			portType() {
				return this.currentRule.type === PORT_TYPES.input ? PORT_TYPES.output : PORT_TYPES.outputRelation;
			},
			ports() {
				return this.currentRule.type === PORT_TYPES.input ? this.allOutputPorts.filter(port => port.type === PORT_TYPES.output) : this.allOutputPorts.filter(port => port.type === PORT_TYPES.outputRelation);
			}
		},
		watch: {
			isScrolling(isScrolling) {
				if (isScrolling && this.isPopupShown) {
					this.isPopupShown = false;
				}
			}
		},
		created() {
			this.allOutputPorts = this.block?.ports.reduce((acc, port) => {
				if (port.type === PORT_TYPES.output || port.type === PORT_TYPES.outputRelation) {
					acc.push({
						portId: port.id,
						title: port.title,
						type: port.type
					});
				}
				return acc;
			}, []) ?? [];
			if (this.ports.length === 0) {
				this.addNewPort();
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['changeRuleExpression']),
			selectPort(port) {
				this.selectedPort = port;
				this.isPopupShown = false;
			},
			addNewPort() {
				this.allOutputPorts.push({
					portId: this.portId,
					title: this.portTitle,
					type: this.portType
				});
			},
			deletePort(portId) {
				this.allOutputPorts = this.allOutputPorts.filter(port => {
					return port.portId !== portId;
				});
				if (portId === this.selectedPort.portId) {
					this.selectedPort = {
						portId: null,
						title: null
					};
				}
			},
			async tryToScrollBottom() {
				await this.$nextTick();
				const dropDownContent = this.$refs.nodeSettingsRuleOutputDropdownContent;
				const {
					scrollHeight,
					clientHeight
				} = dropDownContent;
				if (scrollHeight > clientHeight) {
					dropDownContent.scrollTop = scrollHeight - clientHeight;
				}
			},
			onAddButtonClick() {
				this.addNewPort();
				this.tryToScrollBottom();
			}
		},
		template: `
		<div class="editor-chart-node-settings-edit-output-expression-form">
			<div class="editor-chart-node-settings-edit-output-expression-form__item">
				<span class="editor-chart-node-settings-edit-output-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_EXPRESSION_NAME') }}
				</span>
				<div class="ui-ctl ui-ctl-textbox">
					<input
						type="text"
						class="ui-ctl-element"
						readonly
						:value="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_OUTPUT_TITLE')"
					/>
				</div>
			</div>
			<div class="editor-chart-node-settings-edit-output-expression-form__item">
				<span class="editor-chart-node-settings-edit-output-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-output-expression-form__dropdown"
					ref="nodeSettingsRuleOutputDropdown"
					@click="isPopupShown = true"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						class="ui-ctl-element"
						ref="nodeSettingsRuleOutputDropdownValue"
					>
						{{ selectedPort.title ?? notSelectedMessage }}
					</div>
					<Popup
						v-if="isPopupShown"
						:options="popupOptions"
						@close="isPopupShown = false"
					>
						<div class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup">
							<div
								class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-content"
								ref="nodeSettingsRuleOutputDropdownContent"
							>
								<div
									v-for="outputPort in ports"
									class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-item"
									@click="selectPort(outputPort)"
								>
									<span>{{ outputPort.title }}</span>
									<button
										class="ui-btn ui-btn-xss --style-outline-no-accent ui-btn-no-caps --air"
										@click.stop="deletePort(outputPort.portId)"
									>
										{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_OUTPUT_REMOVE') }}
									</button>
								</div>
							</div>
							<div class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-footer">
								<div
									class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-footer-content"
									@click="onAddButtonClick"
								>
									<BIcon
										:size="24"
										name="circle-plus"
										color="#0075ff"
										class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-footer-icon"
									/>
									<span>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_OUTPUT_ADD') }}</span>
								</div>
							</div>
						</div>
					</Popup>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const NodeSettingsRules = {
		name: 'NodeSettingsRules',
		components: {
			CancelSettingsButton,
			SaveSettingsButton,
			NodeSettingsRulesLayout,
			RuleCard,
			EditActionExpression,
			EditOutputExpression,
			EditConditionExpression,
			AddConstruction,
			DeleteConstruction,
			RuleConstruction,
			SelectBooleanType,
			SelectRule,
			DeleteRuleCard,
			EditExtendedAction
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		data() {
			return {
				isScrolling: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'currentRule', 'block', 'isRuleSettingsShown', 'ports']),
			...ui_vue3_pinia.mapWritableState(useNodeSettingsStore, ['isSaving']),
			...ui_vue3_pinia.mapState(diagramStore, ['documentType', 'template']),
			isShown() {
				return this.isRuleSettingsShown && this.currentRule.type === PORT_TYPES.input;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['toggleRuleSettingsVisibility', 'reorder', 'saveRule', 'discardRuleSettings']),
			...ui_vue3_pinia.mapActions(diagramStore, ['setPorts']),
			onRulesLayoutClose() {
				this.discardRuleSettings();
				this.toggleRuleSettingsVisibility(false);
			},
			async onSaveRule() {
				try {
					this.isSaving = true;
					await main_core_events.EventEmitter.emitAsync(EVENT_NAMES.BEFORE_SUBMIT_EVENT);
					await this.saveRule(this.documentType);
					this.setPorts(this.block.id, this.ports);
				} catch (error) {
					if (error.errors && error.errors[0] && error.errors[0].message) {
						ui_dialogs_messagebox.MessageBox.alert(main_core.Text.encode(error.errors[0].message));
					}
				} finally {
					this.isSaving = false;
				}
			},
			onScroll() {
				this.isScrolling = true;
				this.$nextTick(() => {
					this.isScrolling = false;
				});
			}
		},
		template: `
		<NodeSettingsRulesLayout
			:isShown="isShown"
			:nodeSettings="nodeSettings"
			:currentRule="currentRule"
			:isSaving="isSaving"
			@close="onRulesLayoutClose"
			@drop="reorder"
			@scroll-layout="onScroll"
		>
			<template #rules-dropdown>
				<SelectRule :block="block" />
			</template>

			<template #ruleCard="{ ruleCard }">
				<RuleCard :ruleCard="ruleCard">
					<template #deleteRuleCard>
						<DeleteRuleCard :ruleCard="ruleCard" />
					</template>

					<template #default="{ construction, position }">
						<RuleConstruction
							:ruleCardId="ruleCard.id"
							:construction="construction"
							:position="position"
						>
							<template #addConstructionButton>
								<AddConstruction
									:position="position"
									:ruleCard="ruleCard"
									:data-test-id="$testId('complexNodeRuleSettingsAddConstruction')"
								/>
							</template>

							<template #deleteConstructionButton="{ iconColor }">
								<DeleteConstruction
									:iconColor="iconColor"
									:ruleCard="ruleCard"
									:construction="construction"
								/>
							</template>

							<template #action="{ isExpertMode }">
								<EditActionExpression
									:construction="construction"
									:isExpertMode="isExpertMode"
									:isScrolling="isScrolling"
								>
									<template #default="{ actionId, activityData, selectedDocument }">
										<EditExtendedAction
											v-if="actionId"
											:actionId="actionId"
											:activityData="activityData"
											:construction="construction"
											:documentType="documentType"
											:template="template"
											:selectedDocument="selectedDocument"
										/>
									</template>
								</EditActionExpression>
							</template>

							<template #booleanTypeSwitcher>
								<SelectBooleanType :construction="construction" />
							</template>

							<template #condition>
								<EditConditionExpression :construction="construction" />
							</template>

							<template #output>
								<EditOutputExpression
									:construction="construction"
									:isScrolling="isScrolling"
								/>
							</template>
						</RuleConstruction>
					</template>

					<template #addConstructionButton>
						<AddConstruction
							:ruleCard="ruleCard"
							:data-test-id="$testId('complexNodeRuleSettingsAddConstruction')"
						/>
					</template>
				</RuleCard>
			</template>

			<template #addRuleCardButton>
				<AddConstruction
					class="editor-chart-node-settings-add-rule-card"
					:data-test-id="$testId('complexNodeRuleSettingsAddRuleCard')"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_RULE_CARD_LABEL') }}
				</AddConstruction>
			</template>

			<template #actions>
				<SaveSettingsButton
					:isSaving="isSaving"
					:data-test-id="$testId('complexNodeRuleSettingsSave')"
					@click="onSaveRule"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeRuleSettingsDiscard')"
					@click="onRulesLayoutClose"
				/>
			</template>
		</NodeSettingsRulesLayout>
	`
	};

	// @vue/component
	const NodeSettingsRelations = {
		name: 'NodeSettingsRelations',
		components: {
			CancelSettingsButton,
			SaveSettingsButton,
			NodeSettingsRulesLayout,
			RuleCard,
			EditActionExpression,
			EditOutputExpression,
			EditConditionExpression,
			AddConstruction,
			DeleteConstruction,
			RuleConstruction,
			SelectBooleanType,
			SelectRule,
			DeleteRuleCard,
			EditExtendedAction
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		data() {
			return {
				isScrolling: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'currentRule', 'block', 'isRuleSettingsShown']),
			...ui_vue3_pinia.mapWritableState(useNodeSettingsStore, ['isSaving']),
			...ui_vue3_pinia.mapState(diagramStore, ['documentType', 'template']),
			isShown() {
				return this.isRuleSettingsShown && this.currentRule.type === PORT_TYPES.inputRelation;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['toggleRuleSettingsVisibility', 'reorder', 'discardRuleSettings', 'saveRelation']),
			async onSaveRelation() {
				try {
					this.isSaving = true;
					await this.saveRelation();
				} catch (error) {
					if (error.errors && error.errors[0] && error.errors[0].message) {
						ui_dialogs_messagebox.MessageBox.alert(main_core.Text.encode(error.errors[0].message));
					}
				} finally {
					this.isSaving = false;
				}
			},
			onRulesLayoutClose() {
				this.discardRuleSettings();
				this.toggleRuleSettingsVisibility(false);
			},
			onScroll() {
				this.isScrolling = true;
				this.$nextTick(() => {
					this.isScrolling = false;
				});
			}
		},
		template: `
		<NodeSettingsRulesLayout
			:isShown="isShown"
			:nodeSettings="nodeSettings"
			:currentRule="currentRule"
			:isSaving="isSaving"
			@close="onRulesLayoutClose"
			@drop="reorder"
			@scroll-layout="onScroll"
		>
			<template #rules-dropdown>
				<SelectRule :block="block" />
			</template>

			<template #ruleCard="{ ruleCard }">
				<RuleCard :ruleCard="ruleCard">
					<template #deleteRuleCard>
						<DeleteRuleCard :ruleCard="ruleCard" />
					</template>

					<template #default="{ construction, position }">
						<RuleConstruction
							:ruleCardId="ruleCard.id"
							:construction="construction"
							:position="position"
						>
							<template #addConstructionButton>
								<AddConstruction
									:position="position"
									:ruleCard="ruleCard"
									:data-test-id="$testId('complexNodeRuleSettingsAddConstruction')"
								/>
							</template>

							<template #deleteConstructionButton="{ iconColor }">
								<DeleteConstruction
									:iconColor="iconColor"
									:ruleCard="ruleCard"
									:construction="construction"
								/>
							</template>

							<template #action="{ isExpertMode }">
								<EditActionExpression
									:construction="construction"
									:isExpertMode="isExpertMode"
								>
									<template #default="{ actionId, activityData, selectedDocument }">
										<EditExtendedAction
											v-if="actionId"
											:actionId="actionId"
											:activityData="activityData"
											:construction="construction"
											:documentType="documentType"
											:template="template"
											:selectedDocument="selectedDocument"
										/>
									</template>
								</EditActionExpression>
							</template>

							<template #booleanTypeSwitcher>
								<SelectBooleanType :construction="construction" />
							</template>

							<template #condition>
								<EditConditionExpression :construction="construction" />
							</template>

							<template #output>
								<EditOutputExpression
									:construction="construction"
									:isScrolling="isScrolling"
								/>
							</template>
						</RuleConstruction>
					</template>

					<template #addConstructionButton>
						<AddConstruction
							:ruleCard="ruleCard"
							:data-test-id="$testId('complexNodeRuleSettingsAddConstruction')"
						/>
					</template>
				</RuleCard>
			</template>

			<template #addRuleCardButton>
				<AddConstruction
					class="editor-chart-node-settings-add-rule-card"
					:data-test-id="$testId('complexNodeRuleSettingsAddRuleCard')"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_RULE_CARD_LABEL') }}
				</AddConstruction>
			</template>

			<template #actions>
				<SaveSettingsButton
					:isSaving="isSaving"
					:data-test-id="$testId('complexNodeRelationSettingsSave')"
					@click="onSaveRelation"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeRelationSettingsDiscard')"
					@click="onRulesLayoutClose"
				/>
			</template>
		</NodeSettingsRulesLayout>
	`
	};

	const REPLACE_TYPES_MAP = {
		CreateStorageNode: 'services',
		WriteDataStorageActivity: 'services',
		ReadDataStorageActivity: 'services',
		DeleteDataStorageActivity: 'services',
		SetupTemplateActivity: 'services',
		IfElseBranchActivity: 'operators',
		ForEachActivity: 'operators',
		WhileActivity: 'operators'
	};
	const useCatalogStore = ui_vue3_pinia.defineStore('bizprocdesigner-editor-catalog', {
		state: () => ({
			groups: [],
			searchText: '',
			currentGroup: null,
			currentItem: null,
			highlightedItems: new Set(),
			isShowFoundedGroupItems: false,
			isShowSearch: false,
			isExpandedCatalog: true,
			isFixedCatalog: true
		}),
		getters: {
			canSearch: state => {
				return state.searchText.length > 2;
			},
			isShowSearchResults: state => {
				return state.canSearch && !state.isShowFoundedGroupItems;
			},
			searchResults: state => {
				const preSearchText = state.searchText.toLowerCase();
				const foundedGroups = state.groups.filter(group => {
					return group.title.toLowerCase().includes(preSearchText);
				});
				const foundedItems = [...new Map(state.groups.flatMap(group => group.items.filter(item => item.title.toLowerCase().includes(preSearchText)).map(item => {
					const key = item.presetId ? `${item.id}_${item.presetId}` : item.id;
					return [key, {
						...item,
						parentGroup: group
					}];
				}))).values()];
				return {
					groups: foundedGroups,
					items: foundedItems
				};
			},
			searchResultsCount: state => {
				const {
					groups,
					items
				} = state.searchResults;
				return groups.length + items.length;
			}
		},
		actions: {
			async init() {
				await this.fetchCatalogData();
			},
			async fetchCatalogData() {
				const {
					groups = []
				} = await editorAPI.getCatalogData();
				this.groups = this.replaceTypes(groups);
			},
			toggleFixedCatalog() {
				this.isFixedCatalog = !this.isFixedCatalog;
			},
			expandCatalog() {
				if (!this.isFixedCatalog) {
					this.isExpandedCatalog = true;
				}
			},
			collapseCatalog() {
				if (!this.isFixedCatalog) {
					this.isExpandedCatalog = false;
				}
			},
			clearSearchText() {
				this.searchText = '';
			},
			changeCurrentGroup(group) {
				this.currentGroup = group;
			},
			resetCurrentGroup() {
				this.currentGroup = null;
			},
			changeCurrentItem(item) {
				this.currentItem = item;
			},
			resetCurrentItem() {
				this.currentItem = null;
			},
			setHighlightedItem(ids) {
				this.highlightedItems = new Set(Array.isArray(ids) ? ids : [ids]);
			},
			resetHighlightedItem() {
				this.highlightedItems = new Set();
			},
			showFoundedGroupItems() {
				this.isShowFoundedGroupItems = true;
			},
			hideFoundedGroupItems() {
				this.isShowFoundedGroupItems = false;
			},
			addDevGroup() {
				this.groups.push({
					id: 'dev',
					icon: '',
					title: 'В разработке',
					items: [this.getFrameNode()]
				});
			},
			getFrameNode() {
				return {
					id: 'frame',
					type: 'frame',
					title: 'Подложка',
					subtitle: 'Нода подложка',
					iconPath: 'BOTTLENECK',
					colorIndex: 1,
					defaultSettings: {
						width: 200,
						height: 200,
						ports: [],
						frameColorName: 'grey',
						frameTextAlign: 'right',
						frameSeparatorPosition: 100
					}
				};
			},
			replaceTypes(groups) {
				return groups.map(group => {
					const newGroup = {
						...group
					};
					newGroup.items = group.items.map(item => {
						if (REPLACE_TYPES_MAP[item.id]) {
							const newItem = {
								...item
							};
							newItem.type = REPLACE_TYPES_MAP[item.id];
							return newItem;
						}
						return item;
					});
					return newGroup;
				});
			}
		}
	});

	const DRAG_ITEM_SLOT_NAMES = {
		default: 'drag-item',
		[BLOCK_TYPES$1.SIMPLE]: `drag-item:${BLOCK_TYPES$1.SIMPLE}`,
		[BLOCK_TYPES$1.TRIGGER]: `drag-item:${BLOCK_TYPES$1.TRIGGER}`,
		[BLOCK_TYPES$1.COMPLEX]: `drag-item:${BLOCK_TYPES$1.COMPLEX}`,
		[BLOCK_TYPES$1.FRAME]: `drag-item:${BLOCK_TYPES$1.FRAME}`,
		[BLOCK_TYPES$1.TOOL]: `drag-item:${BLOCK_TYPES$1.TOOL}`,
		[BLOCK_TYPES$1.OPERATORS]: `drag-item:${BLOCK_TYPES$1.OPERATORS}`,
		[BLOCK_TYPES$1.SERVICES]: `drag-item:${BLOCK_TYPES$1.SERVICES}`
	};

	function getDragItemSlotName(itemType) {
		return DRAG_ITEM_SLOT_NAMES?.[itemType] ?? DRAG_ITEM_SLOT_NAMES.default;
	}

	const CATALOG_CLASS_NAMES = {
		base: 'editor-chart-catalog',
		expanded: '--expanded'
	};

	// @vue/component
	const CatalogLayout = {
		name: 'CatalogLayout',
		props: {
			hasSearchResults: {
				type: Boolean,
				default: false
			},
			expanded: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			catalogClassNames() {
				return {
					[CATALOG_CLASS_NAMES.base]: true,
					[CATALOG_CLASS_NAMES.expanded]: this.expanded
				};
			}
		},
		template: `
		<section :class="catalogClassNames">
			<div class="editor-chart-catalog__container">
				<div class="editor-chart-catalog__header">
					<slot name="header"/>
				</div>

				<div class="editor-chart-catalog__search">
					<slot name="search"/>
				</div>

				<div
					v-if="!hasSearchResults"
					class="editor-chart-catalog__content"
				>
					<slot name="content"/>
				</div>

				<div
					v-if="hasSearchResults"
					class="editor-chart-catalog__search-results"
				>
					<slot name="search-results"/>
				</div>
			</div>

			<div class="editor-chart-catalog__footer">
				<slot name="footer"/>
			</div>
		</section>
	`
	};

	// @vue/component
	const HeaderLayout = {
		name: 'header-layout',
		props: {
			expanded: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<header class="editor-chart-catalog-header-layout">
			<div class="editor-chart-catalog-header-layout__switcher-btn">
			<slot name="switcher"/>
		</div>
			<div
				class="editor-chart-catalog-header-layout__logo"
			>
				<slot name="logo"/>
			</div>
		</header>
	`
	};

	const BURGER_BTN_CLASS_NAMES = {
		base: 'editor-chart-burger-btn'};

	// @vue/component
	const BurgerBtn = {
		name: 'BurgerBtn',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			opened: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			burgerBtnClassNames() {
				return {
					[BURGER_BTN_CLASS_NAMES.base]: true,
					[BURGER_BTN_CLASS_NAMES.opened]: this.opened
				};
			}
		},
		template: `
		<button
			:class="burgerBtnClassNames"
			:data-test-id="$testId('catalogBurger')"
		>
			<BIcon
				:name="iconSet.ALIGN_JUSTIFY"
				:size="24"
				class="editor-chart-burger-btn__icon"
			/>
		</button>
	`
	};

	// @vue/component
	const HeaderLogo = {
		name: 'header-logo',
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		template: `
		<div class="editor-chart-catalog-header-logo">
			<span class="ui-node-catalog-header__logo-text">
				{{ getMessage('BIZPROCDESIGNER_EDITOR_LOGO_TEXT') }}
			</span>
		</div>
	`
	};

	// @vue/component
	const TextInput = {
		name: 'catalog-input',
		props: {
			modelValue: {
				type: String,
				default: ''
			},
			focusable: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const textInput = ui_vue3.useTemplateRef('textInput');
			const {
				getMessage
			} = useLoc();
			ui_vue3.onMounted(() => {
				if (props.focusable) {
					ui_vue3.toValue(textInput)?.focus();
				}
			});
			return {
				getMessage
			};
		},
		template: `
		<div class="editor-chart-catalog-input">
			<input
				ref="textInput"
				:value="modelValue"
				:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_PLACEHOLDER')"
				:data-test-id="$testId('catalogSearchInput')"
				:class="{
					'editor-chart-catalog-input__input': true,
					'editor-chart-catalog-input__input--has-text': modelValue.length > 0
				}"
				type="text"
				@input="$emit('update:modelValue', $event.target.value)"
				@focus="$emit('focus', $event)"
				@blur="$emit('blur', $event)"
			/>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const CatalogGroup = {
		name: 'CatalogGroup',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type CatalogMenuGroup */
			group: {
				type: Object,
				required: true
			},
			showItems: {
				type: Boolean,
				default: false
			}
		},
		emits: ['changeGroup'],
		setup() {
			return {
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		template: `
		<div class="editor-chart-catalog-group">
			<div
				:data-test-id="$testId('catalogGroup', group.id)"
				class="editor-chart-catalog-group__header"
				@click="$emit('changeGroup', group)"
			>
				<div class="editor-chart-catalog-group__icon-wrapper">
					<slot name="icon"/>
				</div>

				<p class="editor-chart-catalog-group__title">{{ group.title }}</p>

				<BIcon
					:name="iconSet.ARROW_RIGHT_XS"
					:size="30"
					class="editor-chart-catalog-group__arrow"
				/>
			</div>

			<Transition name="catalog-items-transition">
				<div
					v-if="showItems"
					class="editor-chart-catalog-group__content"
				>
					<div class="editor-chart-catalog-group__back-groups">
						<slot name="back"/>
					</div>

					<div
						v-if="group.items.length > 0"
						class="editor-chart-catalog-group__items"
					>
						<slot name="items"/>
					</div>

					<div
						v-else
						class="editor-chart-catalog-group__empty-label">
						<slot name="empty-label"/>
					</div>
				</div>
			</Transition>
		</div>
	`
	};

	// @vue/component
	const CatalogGroupEmptyLabel = {
		name: 'catalog-group-empty-label',
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		template: `
		<div class="editor-chart-catalog-group-empty-label">
			<h2>{{ getMessage('BIZPROCDESIGNER_EDITOR_EMPTY_GROUP_TITLE') }}</h2>
			<p>{{ getMessage('BIZPROCDESIGNER_EDITOR_EMPTY_GROUP_DESCRIPTION') }}</p>
		</div>
	`
	};

	const DEFAULT_ICON_NAME$1 = 'o-folder';

	// @vue/component
	const CatalogGroupIcon = {
		name: 'catalog-group-icon',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			iconName: {
				type: String,
				default: DEFAULT_ICON_NAME$1,
				required: true
			}
		},
		setup() {
			const iconSet = ui_iconSet_api_vue.Outline;
			function getIconName(name) {
				if (name && Object.prototype.hasOwnProperty.call(iconSet, name)) {
					return iconSet[name];
				}
				return DEFAULT_ICON_NAME$1;
			}
			return {
				getIconName
			};
		},
		template: `
		<BIcon
			:name="getIconName(iconName)"
			:size="30"
			class="editor-chart-catalog-group-icon"
		/>
	`
	};

	const CATALOG_ITEM_CLASS_NAMES = {
		base: 'editor-chart-catalog-item',
		active: '--active'};
	const ICON_WRAPPER_CLASS_NAMES = {
		base: 'editor-chart-catalog-item__icon-wrapper',
		bg_0: '--bg-0',
		bg_1: '--bg-1',
		bg_2: '--bg-2',
		bg_3: '--bg-3',
		bg_4: '--bg-4',
		bg_5: '--bg-5',
		bg_6: '--bg-6',
		bg_7: '--bg-7',
		bg_8: '--bg-8'
	};
	const ICON_COLORS = {
		0: 'var(--designer-bp-ai-icons)',
		1: 'var(--designer-bp-entities-icons)',
		2: 'var(--designer-bp-employe-icons)',
		3: 'var(--designer-bp-technical-icons)',
		4: 'var(--designer-bp-communication-icons)',
		5: 'var(--designer-bp-storage-icons)',
		6: 'var(--designer-bp-afiliate-icons)',
		7: 'var(--ui-color-palette-white-base)',
		8: 'var(--ui-color-palette-white-base)'
	};
	const DEFAULT_ICON_NAME = ui_iconSet_api_vue.Outline.FOLDER;

	// @vue/component
	const CatalogItem = {
		name: 'catalog-item',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			DragBlock: ui_blockDiagram.DragBlock
		},
		props: {
			/** @type CatalogMenuItem */
			item: {
				type: Object,
				required: true
			},
			active: {
				type: Boolean,
				default: false
			}
		},
		// eslint-disable-next-line max-lines-per-function
		setup(props) {
			const iconSet = ui_iconSet_api_vue.Outline;
			const draggedItem = ui_vue3.useTemplateRef('draggedItem');
			const preparedBlock = ui_vue3.ref(getPreparedNewBlock(props.item));
			const catalogItemClassNames = ui_vue3.computed(() => ({
				[CATALOG_ITEM_CLASS_NAMES.base]: true,
				[CATALOG_ITEM_CLASS_NAMES.active]: props.active
			}));
			const iconWrapperClassNames = ui_vue3.computed(() => {
				if (isUrl(props.item.icon)) {
					return {
						[ICON_WRAPPER_CLASS_NAMES.base]: true,
						'--custom': true
					};
				}
				const baseStyles = {
					[ICON_WRAPPER_CLASS_NAMES.base]: true,
					[ICON_WRAPPER_CLASS_NAMES.bg_0]: props.item.colorIndex === 0,
					[ICON_WRAPPER_CLASS_NAMES.bg_1]: props.item.colorIndex === 1,
					[ICON_WRAPPER_CLASS_NAMES.bg_2]: props.item.colorIndex === 2,
					[ICON_WRAPPER_CLASS_NAMES.bg_3]: props.item.colorIndex === 3,
					[ICON_WRAPPER_CLASS_NAMES.bg_4]: props.item.colorIndex === 4,
					[ICON_WRAPPER_CLASS_NAMES.bg_5]: props.item.colorIndex === 5,
					[ICON_WRAPPER_CLASS_NAMES.bg_6]: props.item.colorIndex === 6,
					[ICON_WRAPPER_CLASS_NAMES.bg_7]: props.item.colorIndex === 7,
					[ICON_WRAPPER_CLASS_NAMES.bg_8]: props.item.colorIndex === 8
				};
				if (props.item.type === BLOCK_TYPES$2.TOOL) {
					baseStyles['--rounded'] = true;
				}
				return baseStyles;
			});
			const dragPayload = ui_vue3.computed(() => ({
				dragData: preparedBlock,
				dragImage: draggedItem
			}));
			const {
				closeContextMenu
			} = ui_blockDiagram.useContextMenu();
			function getIconName(name) {
				if (name && Object.prototype.hasOwnProperty.call(iconSet, name)) {
					return iconSet[name];
				}
				return DEFAULT_ICON_NAME;
			}
			function getIconColor(colorIndex) {
				if (colorIndex !== false && ICON_COLORS[colorIndex]) {
					return ICON_COLORS[colorIndex];
				}
				return null;
			}
			function getBackgroundImage(url) {
				const safeUrl = getSafeUrl(url);
				if (!safeUrl) {
					return {};
				}
				return {
					'background-image': `url('${safeUrl}')`
				};
			}
			function getPreparedNewBlock(item) {
				const id = createUniqueId();
				const {
					id: itemId,
					type,
					presetId,
					title,
					properties = {},
					returnProperties = [],
					colorIndex,
					icon = DEFAULT_ICON_NAME,
					hasAuxPorts = false,
					defaultSettings: {
						width,
						height,
						ports = [],
						frameColorName = null,
						frameTextAlign = null,
						frameSeparatorPosition = null
					}
				} = ui_vue3.toValue(item);
				return {
					id,
					type,
					activity: {
						Name: id,
						Type: itemId,
						PresetId: presetId,
						Properties: {
							Title: title,
							...properties
						},
						ReturnProperties: returnProperties || [],
						Activated: 'Y'
					},
					dimensions: {
						width,
						height
					},
					position: {
						x: 0,
						y: 0
					},
					ports,
					node: {
						colorIndex,
						icon,
						title,
						type,
						shouldShowAuxPorts: hasAuxPorts === true,
						...(frameColorName !== null ? {
							frameColorName
						} : {}),
						...(frameTextAlign !== null ? {
							frameTextAlign
						} : {}),
						...(frameSeparatorPosition !== null ? {
							frameSeparatorPosition
						} : {})
					}
				};
			}
			function getDragPayload() {
				return {
					dragData: getPreparedNewBlock(props.item),
					dragImage: draggedItem
				};
			}
			function isUrl(value) {
				if (!value || !main_core.Type.isString(value)) {
					return false;
				}
				return value.startsWith('https://');
			}
			function getSafeUrl(url) {
				if (!url || !main_core.Type.isString(url)) {
					return null;
				}
				const trimmedUrl = url.trim();
				const allowedProtocols = ['https://'];
				const isSafeProtocol = allowedProtocols.some(protocol => trimmedUrl.startsWith(protocol));
				if (!isSafeProtocol) {
					return null;
				}
				return trimmedUrl;
			}
			function onDragStart() {
				closeContextMenu();
			}
			return {
				dragPayload,
				preparedBlock,
				catalogItemClassNames,
				iconWrapperClassNames,
				getDragItemSlotName,
				getDragPayload,
				getIconName,
				getIconColor,
				isUrl,
				getBackgroundImage,
				onDragStart
			};
		},
		template: `
		<div
			v-drag-block="getDragPayload"
			:class="catalogItemClassNames"
			:data-test-id="$testId('catalogItem', item.id)"
			@dragstart="onDragStart"
		>
			<div
				ref="draggedItem"
				class="editor-chart-catalog-item__drag-item"
			>
				<slot
					:name="getDragItemSlotName(preparedBlock.type)"
					:item="preparedBlock"
				/>
			</div>
			<div class="editor-chart-catalog-item__icon-container">
				<div :class="iconWrapperClassNames">
					<div
						v-if="isUrl(item.icon)"
						:style="getBackgroundImage(item.icon)"
						class="ui-selector-item-avatar"
					/>
					<BIcon
						v-else
						:name="getIconName(item.icon)"
						:color="getIconColor(item.colorIndex)"
						:size="28"
						class="editor-chart-catalog-item__icon"
					/>
				</div>
			</div>
			<div class="editor-chart-catalog-item__content">
				<div class="editor-chart-catalog-item__title">
					{{ item.title }}
				</div>
				<div
					v-if="item.subtitle"
					class="editor-chart-catalog-item__subtitle">
					{{ item.subtitle }}
				</div>
			</div>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	const CATALOG_GROUP_LIST_CLASS_NAMES = {
		base: 'editor-chart-catalog-group-list',
		withoutScroll: '--withoutScroll'
	};

	// @vue/component
	const CatalogGroupList = {
		name: 'CatalogGroupList',
		props: {
			/** @type Array<CatalogMenuGroup> */
			groups: {
				type: Array,
				default: () => []
			},
			/** @type CatalogMenuGroup | null */
			currentGroup: {
				type: Object,
				default: null
			}
		},
		computed: {
			catalogGroupListClassNames() {
				return {
					[CATALOG_GROUP_LIST_CLASS_NAMES.base]: true,
					[CATALOG_GROUP_LIST_CLASS_NAMES.withoutScroll]: this.currentGroup !== null
				};
			}
		},
		template: `
		<ul :class="catalogGroupListClassNames">
			<li
				v-for="group in groups"
				:key="group.id"
				class="editor-chart-catalog-group-list__group"
			>
				<slot
					:group="group"
					name="group"
				/>
			</li>
		</ul>
	`
	};

	const GROUP_BACK_BTN_CLASS_NAMES = {
		base: 'editor-chart-group-back-btn',
		collapsed: '--collapsed'
	};
	const ICON_CLASS_NAMES = {
		base: 'editor-chart-group-back-btn__icon',
		collapsed: '--collapsed'
	};

	// @vue/component
	const CatalogGroupBackBtn = {
		name: 'CatalogGroupBackBtn',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			groupTitle: {
				type: String,
				default: ''
			},
			collapsed: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			groupBackBtnCalssNames() {
				return {
					[GROUP_BACK_BTN_CLASS_NAMES.base]: true,
					[GROUP_BACK_BTN_CLASS_NAMES.collapsed]: this.collapsed
				};
			},
			iconClassNames() {
				return {
					[ICON_CLASS_NAMES.base]: true,
					[ICON_CLASS_NAMES.collapsed]: this.collapsed
				};
			}
		},
		template: `
		<button
			:class="groupBackBtnCalssNames"
			:data-test-id="$testId('catalogGroupBackBtn')"
		>
			<div
				v-if="!collapsed"
				class="editor-chart-group-back-btn__back-wrapper"
			>
				<BIcon
					:name="iconSet.ARROW_LEFT_XS"
					:size="30"
					class="editor-chart-group-back-btn__back"
				/>
			</div>

			<div :class="iconClassNames">
				<slot name="icon"/>
			</div>

			<p class="editor-chart-group-back-btn__title">
				{{ groupTitle }}
			</p>
		</button>
	`
	};

	const SEARCH_RESULTS_LABEL_CLASS_NAMES = {
		base: 'editor-chart-search-results-label',
		collapsed: '--collapsed'
	};

	// @vue/component
	const SearchResultsLabel = {
		name: 'search-results-label',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			count: {
				type: Number,
				default: 0
			},
			collapsed: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				getMessage
			} = useLoc();
			const searchResultsLablelClassNames = ui_vue3.computed(() => ({
				[SEARCH_RESULTS_LABEL_CLASS_NAMES.base]: true,
				[SEARCH_RESULTS_LABEL_CLASS_NAMES.collapsed]: props.collapsed
			}));
			const countLabel = ui_vue3.computed(() => {
				return props.count === 0 ? getMessage('BIZPROCDESIGNER_EDITOR_NOT_FOUND') : getMessage('BIZPROCDESIGNER_EDITOR_FOUND', {
					'#count#': props.count
				});
			});
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				searchResultsLablelClassNames,
				countLabel,
				getMessage
			};
		},
		template: `
		<div :class="searchResultsLablelClassNames">
			<BIcon
				v-if="collapsed"
				:name="iconSet.SEARCH"
				:size="20"
				class="editor-chart-search-results-label__icon"
			/>
			<p
				v-if="!collapsed"
				class="editor-chart-search-results-label__count"
			>
				{{ countLabel }}
			</p>
			<p
				v-if="!collapsed"
				class="editor-chart-search-results-label__location"
			>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_EVERYWHERE') }}
			</p>
		</div>
	`
	};

	const TITLE_CLASS_NAMES = {
		base: 'editor-chart-search-results-layout__title',
		collapsed: '--collapsed'
	};

	// @vue/component
	const SearchResultsLayout = {
		name: 'search-results-layout',
		props: {
			/** @type Array<CatalogMenuGroup> */
			groups: {
				type: Array,
				default: () => []
			},
			/** @type Array<CatalogMenuItem> */
			items: {
				type: Array,
				default: () => []
			},
			collapsed: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const {
				getMessage
			} = useLoc();
			const titleClassNames = ui_vue3.computed(() => ({
				[TITLE_CLASS_NAMES.base]: true,
				[TITLE_CLASS_NAMES.collapsed]: props.collapsed
			}));
			const makeUniqueItemKey = ({
				presetId,
				id
			}) => presetId ? `${id}_${presetId}` : id;
			return {
				getMessage,
				titleClassNames,
				makeUniqueItemKey
			};
		},
		template: `
		<div class="editor-chart-search-results-layout">

			<div
				v-if="groups.length > 0 || items.length > 0"
				class="editor-chart-search-results-layout__content"
			>
				<div
					v-if="groups.length > 0"
					class="editor-chart-search-results-layout__groups">
					<h2 :class="titleClassNames">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_GROUPS') }}
					</h2>
					<slot
						v-for="group in groups"
						:key="group.id"
						:group="group"
						name="group"
					/>
				</div>

				<div
					v-if="items.length > 0"
					class="editor-chart-search-results-layout__items"
				>
					<h2 :class="titleClassNames">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_NODES') }}
					</h2>
					<slot
						v-for="item in items"
						:key="makeUniqueItemKey(item)"
						:item="item"
						name="item"
					/>
				</div>
			</div>

			<div
				v-else-if="!collapsed"
				class="editor-chart-search-results-layout__empty"
			>
				<slot name="empty-label"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const SearchResultsEmptyLabel = {
		name: 'search-results-empty-label',
		setup() {
			const {
				getMessage
			} = useLoc();
			const description = getMessage('BIZPROCDESIGNER_EDITOR_EMPTY_SEARCH_DESCRIPTION');
			const [before, link, after] = description.split(/\[feedback]|\[\/feedback]/);
			function onFeedbackLinkClick(event) {
				event.preventDefault();
				ui_feedback_form.Form.open({
					id: String(Math.random()),
					forms: [{
						zones: ['by', 'kz', 'ru'],
						id: 438,
						lang: 'ru',
						sec: 'odyyl1'
					}, {
						zones: ['com.br'],
						id: 436,
						lang: 'br',
						sec: '8fb4et'
					}, {
						zones: ['la', 'co', 'mx'],
						id: 434,
						lang: 'es',
						sec: 'ze9mqq'
					}, {
						zones: ['de'],
						id: 432,
						lang: 'de',
						sec: 'm8isto'
					}, {
						zones: ['en', 'eu', 'in', 'uk'],
						id: 430,
						lang: 'en',
						sec: 'etg2n4'
					}]
				});
			}
			return {
				getMessage,
				before,
				link,
				after,
				onFeedbackLinkClick
			};
		},
		template: `
		<div class="editor-chart-search-results-empty-label">
			<h2>{{ getMessage('BIZPROCDESIGNER_EDITOR_EMPTY_SEARCH_TITLE') }}</h2>
			<p>{{ before }} <a href="#" @click="onFeedbackLinkClick">{{ link }}</a> {{ after }}</p>
		</div>
	`
	};

	// @vue/component
	const SearchBar = {
		name: 'SearchBar',
		components: {
			DiagramSearchBar: ui_blockDiagram.SearchBar
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			function searchCallback(block, text) {
				return block.node.title.toLowerCase().includes(text.toLowerCase());
			}
			return {
				getMessage,
				searchCallback
			};
		},
		template: `
		<DiagramSearchBar
			:searchResultTitle="getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_RESULTS')"
			:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_PLACEHOLDER')"
			:searchCallback="searchCallback"
		/>
	`
	};

	// @vue/component
	const DebugButton = {
		name: 'DebugButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			const {
				isDebugEnabled,
				isLoading,
				toggleDebug,
				checkDebugStatus
			} = useDebugStatus();
			const diagramStoreObj = diagramStore();
			ui_vue3.watch(() => diagramStoreObj.templateId, newTemplateId => {
				if (newTemplateId && newTemplateId > 0) {
					checkDebugStatus(newTemplateId);
				}
			}, {
				immediate: true
			});
			const buttonTitle = ui_vue3.computed(() => {
				return isDebugEnabled.value ? main_core.Loc.getMessage(DEBUG_BAR_LABELS.BUTTON_DISABLE_TITLE) : main_core.Loc.getMessage(DEBUG_BAR_LABELS.BUTTON_ENABLE_TITLE);
			});
			return {
				isDebugEnabled,
				isLoading,
				toggleDebug,
				buttonTitle,
				outline: ui_iconSet_api_vue.Outline
			};
		},
		template: `
		<button
			@click="toggleDebug"
			:disabled="isLoading"
			:class="{
				'bp-debug-button': true,
				'bp-debug-button--active': isDebugEnabled,
				'bp-debug-button--loading': isLoading,
			}"
			:title="buttonTitle"
		>
			<BIcon
				:name="outline.BUG"
				:size="24"
				:color="isDebugEnabled ? 'var(--designer-bp-entities-icons)' : 'var(--ui-color-base-4)'"
			/>
		</button>
	`
	};

	const useDebugBarStore = ui_vue3_pinia.defineStore('bizprocdesigner-editor-debug-bar', {
		state: () => ({
			isVisible: false,
			isLoading: false,
			sessions: [],
			selectedSessionId: null,
			traces: [],
			isLoadingTraces: false,
			isLoadingMoreTraces: false,
			tracesPage: 1,
			hasMoreTraces: false
		}),
		getters: {
			hasErrorSessions(state) {
				return state.sessions.some(s => s.hasErrors);
			},
			totalSessions(state) {
				return state.sessions.length;
			},
			errorSessionsCount(state) {
				return state.sessions.filter(s => s.hasErrors).length;
			}
		},
		actions: {
			toggleVisibility(visible) {
				this.isVisible = visible === undefined ? !this.isVisible : visible;
			},
			show() {
				this.isVisible = true;
			},
			hide() {
				this.isVisible = false;
				this.reset();
			},
			reset() {
				this.selectedSessionId = null;
				this.traces = [];
				this.tracesPage = 1;
				this.hasMoreTraces = false;
			}
		}
	});

	const DebugBarLayout = {
		name: 'debug-bar-layout',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			isLoading: {
				type: Boolean,
				default: false
			},
			isMaximized: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close', 'maximize', 'clear'],
		setup() {
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				Loc: main_core.Loc,
				labels: DEBUG_BAR_LABELS
			};
		},
		computed: {
			maximizeTitle() {
				return this.Loc.getMessage(this.isMaximized ? this.labels.LAYOUT_MINIMIZE_TITLE : this.labels.LAYOUT_MAXIMIZE_TITLE);
			},
			clearTitle() {
				return this.Loc.getMessage(this.labels.LAYOUT_CLEAR_TITLE);
			},
			closeTitle() {
				return this.Loc.getMessage(this.labels.LAYOUT_CLOSE_TITLE);
			}
		},
		template: `
		<div class="debug-bar-panel" :class="{ 'debug-bar-panel--maximized': isMaximized }">
			<div class="debug-bar-header">
				<div class="debug-bar-header-left">
					<div class="debug-bar-title-wrapper">
						<h3 class="debug-bar-title">{{ Loc.getMessage(labels.TITLE) }}</h3>
					</div>
				</div>
				<div class="debug-bar-header-actions">
					<button
						class="debug-bar-action"
						:title="maximizeTitle"
						@click="$emit('maximize')"
					>
						<BIcon :name="isMaximized ? iconSet.MINIMIZE : iconSet.MAXIMIZE" :size="20" color="#A8ADB4"/>
					</button>
					<button class="debug-bar-action" :title="clearTitle" @click="$emit('clear')">
						<BIcon :name="iconSet.TRASHCAN" :size="20" color="#A8ADB4"/>
					</button>
					<button class="debug-bar-action" :title="closeTitle" @click="$emit('close')">
						<BIcon :name="iconSet.CROSS_L" :size="20" color="#A8ADB4"/>
					</button>
				</div>
			</div>

			<Transition name="loading-fade" mode="out-in">
				<div v-if="isLoading" class="debug-bar-loading-indicator" key="loading">
					<div class="debug-bar-loading-progress"></div>
				</div>
			</Transition>

			<div class="debug-bar-content">
				<slot/>
			</div>
		</div>
	`
	};

	function useDebugSessions() {
		const sessions = ui_vue3.ref([]);
		const isLoading = ui_vue3.ref(false);
		const toastStore = useToastStore();
		async function loadSessions() {
			isLoading.value = true;
			try {
				const templateId = diagramStore().templateId;
				if (!templateId || templateId === 0) {
					toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TEMPLATE_NOT_FOUND));
					return;
				}
				const response = await debugBarApi.loadSessions({
					templateId,
					limit: DEBUG_BAR_CONFIG.DEFAULT_LIMIT,
					offset: DEBUG_BAR_CONFIG.DEFAULT_OFFSET
				});
				if (response) {
					sessions.value = response;
				} else {
					toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.SESSIONS_LOAD_ERROR));
				}
			} catch (error) {
				handleResponseError(error);
			} finally {
				isLoading.value = false;
			}
		}
		async function deleteAllSessions() {
			isLoading.value = true;
			try {
				const success = await debugBarApi.deleteAllSessions();
				if (success) {
					sessions.value = [];
					return true;
				}
				toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.CLEAR_ERROR));
				return false;
			} catch (error) {
				handleResponseError(error);
				return false;
			} finally {
				isLoading.value = false;
			}
		}
		return {
			sessions,
			isLoading,
			loadSessions,
			deleteAllSessions
		};
	}

	function useDebugTraces() {
		const traces = ui_vue3.ref([]);
		const isLoadingTraces = ui_vue3.ref(false);
		const isLoadingMoreTraces = ui_vue3.ref(false);
		const currentTracesPage = ui_vue3.ref(1);
		const hasMoreTraces = ui_vue3.ref(false);
		const currentSessionId = ui_vue3.ref(null);
		const toastStore = useToastStore();
		async function loadTraces(sessionId) {
			if (!sessionId) {
				return;
			}
			currentSessionId.value = sessionId;
			currentTracesPage.value = 1;
			isLoadingTraces.value = true;
			try {
				const response = await debugBarApi.loadTraces({
					debugSessionId: sessionId,
					page: 1
				});
				if (response) {
					traces.value = response;
					hasMoreTraces.value = response.length >= DEBUG_BAR_CONFIG.DEFAULT_TRACES_PAGE_SIZE;
				} else {
					traces.value = [];
					hasMoreTraces.value = false;
					toastStore.addWarning(main_core.Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TRACES_ERROR));
				}
			} catch (error) {
				handleResponseError(error);
			} finally {
				isLoadingTraces.value = false;
			}
		}
		async function loadMoreTraces() {
			if (!currentSessionId.value || isLoadingMoreTraces.value) {
				return;
			}
			isLoadingMoreTraces.value = true;
			const nextPage = currentTracesPage.value + 1;
			try {
				const response = await debugBarApi.loadTraces({
					debugSessionId: currentSessionId.value,
					page: nextPage
				});
				if (response && response.length > 0) {
					traces.value = [...traces.value, ...response];
					currentTracesPage.value = nextPage;
					hasMoreTraces.value = response.length >= DEBUG_BAR_CONFIG.DEFAULT_TRACES_PAGE_SIZE;
				} else {
					hasMoreTraces.value = false;
				}
			} catch (error) {
				handleResponseError(error);
			} finally {
				isLoadingMoreTraces.value = false;
			}
		}
		function clearTraces() {
			traces.value = [];
			currentTracesPage.value = 1;
			hasMoreTraces.value = false;
			currentSessionId.value = null;
		}
		return {
			traces,
			isLoadingTraces,
			isLoadingMoreTraces,
			hasMoreTraces,
			loadTraces,
			loadMoreTraces,
			clearTraces
		};
	}

	const DebugSession = {
		name: 'debug-session',
		props: {
			session: {
				type: Object,
				required: true
			},
			isExpanded: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggle'],
		setup() {
			return {
				formatTimestamp,
				Loc: main_core.Loc,
				labels: DEBUG_BAR_LABELS
			};
		},
		computed: {
			toggleTitle() {
				return this.Loc.getMessage(this.isExpanded ? this.labels.SESSION_COLLAPSE_TITLE : this.labels.SESSION_EXPAND_TITLE);
			},
			sessionStatus() {
				if (this.session.end_time) {
					return this.Loc.getMessage(this.labels.SESSION_FINISHED, {
						TIME: this.formatTimestamp(this.session.end_time)
					});
				}
				return this.Loc.getMessage(this.labels.SESSION_ACTIVE);
			}
		},
		template: `
		<div
			:class="{
				'debug-bar-session': true,
				'debug-bar-session--expanded': isExpanded,
			}"
		>
			<div class="debug-bar-session-header">
				<button
					class="debug-bar-session-toggle"
					@click="$emit('toggle')"
					:title="toggleTitle"
				>
					<span class="debug-bar-session-toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
				</button>
				<span class="debug-bar-session-time">
					[{{ formatTimestamp(session.start_time, true) }}]
				</span>
				<span class="debug-bar-session-message">
					{{ sessionStatus }}
				</span>
			</div>

			<div v-if="isExpanded" class="debug-bar-traces">
				<slot name="traces"/>
			</div>
		</div>
	`
	};

	const DebugTrace = {
		name: 'debug-trace',
		props: {
			trace: {
				type: Object,
				required: true
			},
			index: {
				type: Number,
				default: 0
			}
		},
		setup(props) {
			const isDataExpanded = ui_vue3.ref(false);
			const isContextExpanded = ui_vue3.ref(false);
			const hasData = ui_vue3.computed(() => {
				return props.trace.data && Object.keys(props.trace.data).length > 0;
			});
			const hasContext = ui_vue3.computed(() => {
				return props.trace.context && Object.keys(props.trace.context).length > 0;
			});
			function formatJson(obj) {
				try {
					return JSON.stringify(obj, null, 2);
				} catch {
					return String(obj);
				}
			}
			function toggleData() {
				isDataExpanded.value = !isDataExpanded.value;
			}
			function toggleContext() {
				isContextExpanded.value = !isContextExpanded.value;
			}
			return {
				formatTimestamp,
				formatJson,
				formatTraceIndex,
				isDataExpanded,
				isContextExpanded,
				hasData,
				hasContext,
				toggleData,
				toggleContext
			};
		},
		template: `
		<div class="debug-bar-trace">
			<div class="debug-bar-trace-index">{{ formatTraceIndex(index) }}</div>
			<div class="debug-bar-trace-wrapper">
				<div class="debug-bar-trace-header">
					<span class="debug-bar-trace-time">[{{ formatTimestamp(trace.timestamp) }}]</span>
					<span class="debug-bar-trace-type">
						[{{ trace.type }}]
					</span>
					<span v-if="trace.key" class="debug-bar-trace-key">{{ trace.key }}</span>
					<span v-if="trace.message" class="debug-bar-trace-message">{{ trace.message }}</span>
				</div>

				<!-- CONTEXT Section -->
				<div v-if="hasContext" class="debug-bar-trace-section">
					<a
						class="debug-bar-trace-toggle"
						:class="{ 'debug-bar-trace-toggle--expanded': isContextExpanded }"
						@click="toggleContext"
					>
						<span class="debug-bar-trace-toggle-icon">{{ isContextExpanded ? '▼' : '▶' }}</span>
						<span class="debug-bar-trace-toggle-label">CONTEXT:</span>
					</a>
					<div v-if="isContextExpanded" class="debug-bar-trace-json">
						<pre>{{ formatJson(trace.context) }}</pre>
					</div>
				</div>

				<!-- DATA Section -->
				<div v-if="hasData" class="debug-bar-trace-section">
					<button
						class="debug-bar-trace-toggle"
						:class="{ 'debug-bar-trace-toggle--expanded': isDataExpanded }"
						@click="toggleData"
					>
						<span class="debug-bar-trace-toggle-icon">{{ isDataExpanded ? '▼' : '▶' }}</span>
						<span class="debug-bar-trace-toggle-label">DATA:</span>
					</button>
					<div v-if="isDataExpanded" class="debug-bar-trace-json">
						<pre>{{ formatJson(trace.data) }}</pre>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const DebugSessionTraces = {
		name: 'debug-session-traces',
		components: {
			DebugTrace
		},
		props: {
			traces: {
				type: Array,
				default: () => []
			},
			isLoading: {
				type: Boolean,
				default: false
			},
			hasMoreTraces: {
				type: Boolean,
				default: false
			},
			isLoadingMore: {
				type: Boolean,
				default: false
			}
		},
		emits: ['load-more'],
		setup(props) {
			const isEmpty = ui_vue3.computed(() => !props.isLoading && props.traces.length === 0);
			return {
				isEmpty,
				Loc: main_core.Loc,
				labels: DEBUG_BAR_LABELS
			};
		},
		template: `
		<div v-if="isLoading" class="debug-bar-traces-loading">
			{{ Loc.getMessage(labels.TRACES_LOADING) }}
		</div>

		<div v-else-if="isEmpty" class="debug-bar-traces-empty">
			{{ Loc.getMessage(labels.TRACES_EMPTY) }}
		</div>

		<div v-else class="debug-bar-traces-list">
			<DebugTrace
				v-for="(trace, index) in traces"
				:key="trace.id"
				:trace="trace"
				:index="index"
			/>

			<div v-if="hasMoreTraces" class="debug-bar-traces-load-more">
				<button
					class="debug-bar-traces-load-more-btn"
					:disabled="isLoadingMore"
					@click="$emit('load-more')"
				>
					{{ isLoadingMore ? Loc.getMessage(labels.TRACES_LOADING) : Loc.getMessage(labels.LOAD_MORE_TRACES) }}
				</button>
			</div>
		</div>
	`
	};

	// @vue/component
	const DebugSessionsList = {
		name: 'debug-sessions-list',
		components: {
			DebugSession,
			DebugSessionTraces
		},
		props: {
			sessions: {
				type: Array,
				default: () => []
			},
			selectedSessionId: {
				type: Number,
				default: null
			},
			traces: {
				type: Array,
				default: () => []
			},
			isLoadingTraces: {
				type: Boolean,
				default: false
			},
			hasMoreTraces: {
				type: Boolean,
				default: false
			},
			isLoadingMoreTraces: {
				type: Boolean,
				default: false
			}
		},
		emits: ['select-session', 'load-more-traces'],
		setup() {
			return {
				Loc: main_core.Loc,
				labels: DEBUG_BAR_LABELS
			};
		},
		template: `
		<div v-if="sessions.length === 0" class="debug-bar-empty">
			{{ Loc.getMessage(labels.SESSIONS_EMPTY) }}
		</div>

		<div v-else class="debug-bar-sessions">
			<DebugSession
				v-for="session in sessions"
				:key="session.id"
				:session="session"
				:is-expanded="selectedSessionId === session.id"
				@toggle="$emit('select-session', session.id)"
			>
				<template #traces>
					<DebugSessionTraces
						:traces="traces"
						:is-loading="isLoadingTraces"
						:has-more-traces="hasMoreTraces"
						:is-loading-more="isLoadingMoreTraces"
						@load-more="$emit('load-more-traces')"
					/>
				</template>
			</DebugSession>
		</div>
	`
	};

	const DebugBarPanel = {
		name: 'DebugBarPanel',
		components: {
			DebugBarLayout,
			DebugSessionsList
		},
		emits: ['close'],
		setup(props, {
			emit
		}) {
			const {
				sessions,
				isLoading,
				loadSessions,
				deleteAllSessions
			} = useDebugSessions();
			const {
				traces,
				isLoadingTraces,
				isLoadingMoreTraces,
				hasMoreTraces,
				loadTraces,
				loadMoreTraces,
				clearTraces
			} = useDebugTraces();
			const selectedSessionId = ui_vue3.ref(null);
			const isFirstLoad = ui_vue3.ref(true);
			const isMaximized = ui_vue3.ref(false);
			function selectSession(sessionId) {
				if (selectedSessionId.value === sessionId) {
					selectedSessionId.value = null;
					clearTraces();
				} else {
					selectedSessionId.value = sessionId;
					loadTraces(sessionId);
				}
			}
			async function loadSessionsWithAutoExpand() {
				await loadSessions();
				if (isFirstLoad.value && sessions.value.length > 0) {
					isFirstLoad.value = false;
					const latestSession = sessions.value[0];
					selectedSessionId.value = latestSession.id;
					await loadTraces(latestSession.id);
				}
			}
			function closePanel() {
				emit('close');
			}
			function handleMaximize() {
				isMaximized.value = !isMaximized.value;
			}
			async function handleClear() {
				ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage(DEBUG_BAR_LABELS.CLEAR_CONFIRM_MESSAGE), main_core.Loc.getMessage(DEBUG_BAR_LABELS.CLEAR_CONFIRM_TITLE), async messageBox => {
					messageBox.close();
					const success = await deleteAllSessions();
					if (success) {
						clearTraces();
						selectedSessionId.value = null;
						await loadSessions();
					}
				}, main_core.Loc.getMessage(DEBUG_BAR_LABELS.CLEAR_BUTTON), messageBox => {
					messageBox.close();
				}, main_core.Loc.getMessage(DEBUG_BAR_LABELS.CANCEL_BUTTON));
			}
			let refreshInterval = null;
			ui_vue3.onMounted(() => {
				loadSessionsWithAutoExpand();
				refreshInterval = setInterval(() => {
					loadSessions();
				}, 5000);
			});
			ui_vue3.onUnmounted(() => {
				if (refreshInterval) {
					clearInterval(refreshInterval);
				}
			});
			return {
				sessions,
				selectedSessionId,
				traces,
				isLoading,
				isLoadingTraces,
				isLoadingMoreTraces,
				hasMoreTraces,
				isMaximized,
				selectSession,
				loadMoreTraces,
				closePanel,
				handleMaximize,
				handleClear
			};
		},
		template: `
		<DebugBarLayout
			:is-loading="isLoading"
			:is-maximized="isMaximized"
			@close="closePanel"
			@maximize="handleMaximize"
			@clear="handleClear"
		>
			<DebugSessionsList
				:sessions="sessions"
				:selected-session-id="selectedSessionId"
				:traces="traces"
				:is-loading-traces="isLoadingTraces"
				:has-more-traces="hasMoreTraces"
				:is-loading-more-traces="isLoadingMoreTraces"
				@select-session="selectSession"
				@load-more-traces="loadMoreTraces"
			/>
		</DebugBarLayout>
	`
	};

	// @vue/component
	const DebugBar = {
		name: 'DebugBarWidget',
		components: {
			DebugBarPanel
		},
		computed: {
			...ui_vue3_pinia.mapState(useDebugBarStore, ['isVisible']),
			...ui_vue3_pinia.mapState(diagramStore, ['templateId']),
			...ui_vue3_pinia.mapState(useAppStore, ['isShownDebugBar'])
		},
		methods: {
			...ui_vue3_pinia.mapActions(useAppStore, ['hideDebugBar']),
			...ui_vue3_pinia.mapActions(useDebugBarStore, ['hide']),
			onClose() {
				this.hide();
				this.hideDebugBar();
			}
		},
		template: '<DebugBarPanel v-if="isShownDebugBar" @close="onClose"/>'
	};

	const setUserSelectedBlock = (blockId = null) => {
		RequestQueue.add(() => post$2('Integration.AiAssistant.Block.set', {
			blockId
		}));
	};
	class RequestQueue {
		static processingRequest = null;
		static nextRequest = null;
		static add(request) {
			if (this.processingRequest) {
				this.nextRequest = request;
				return;
			}
			this.processingRequest = request().finally(() => {
				this.processingRequest = null;
				if (main_core.Type.isFunction(this.nextRequest)) {
					const next = this.nextRequest;
					this.nextRequest = null;
					this.add(next);
				}
			});
		}
	}

	const HIDE_SETTINGS_DELAY = 300;
	const DRAG_THRESHOLD = 5;
	class BlockMediator {
		#loc = null;
		#history = null;
		#appStore = null;
		#commonNodeSettingsStore = null;
		#complexNodeSettingsStore = null;
		#blockDiagram = null;
		#diagramStore = null;
		#bufferStore = null;
		#highlightedBlocks = null;
		#contextMenuItems = null;
		#clickStartX = 0;
		#clickStartY = 0;
		#isShowingSettings = false;
		constructor() {
			this.#loc = useLoc();
			this.#history = ui_blockDiagram.useHistory();
			this.#appStore = useAppStore();
			this.#commonNodeSettingsStore = useCommonNodeSettingsStore();
			this.#complexNodeSettingsStore = useNodeSettingsStore();
			this.#diagramStore = diagramStore();
			this.#blockDiagram = ui_blockDiagram.useBlockDiagram();
			this.#bufferStore = useBufferStore();
			const isMac = main_core.Browser.isMac();
			this.#contextMenuItems = {
				deleteBlock: {
					text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'),
					shortcut: isMac ? '⌫' : 'Del'
				},
				copyBlock: {
					text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_COPY'),
					shortcut: isMac ? '⌘ С' : 'Ctrl-C'
				}
			};
			this.#highlightedBlocks = ui_blockDiagram.useHighlightedBlocks();
			this.#blockDiagram.hooks.startDragBlock.on(block => {
				const settingsBlockId = this.#commonNodeSettingsStore.block?.id ?? this.#complexNodeSettingsStore.block?.id;
				if (settingsBlockId && settingsBlockId !== block.value.id) {
					this.#highlightedBlocks.clear();
					this.#highlightedBlocks.add(settingsBlockId);
				}
			});
		}
		isCurrentBlock(blockId) {
			return this.#commonNodeSettingsStore.isCurrentBlock(blockId) || this.#complexNodeSettingsStore.isShown && this.#complexNodeSettingsStore.isCurrentBlock(blockId);
		}
		isCurrentComplexBlock(blockId) {
			return this.#complexNodeSettingsStore.isShown && this.#complexNodeSettingsStore.isCurrentBlock(blockId);
		}
		hideAllSettings() {
			return new Promise(resolve => {
				this.#appStore.hideRightPanel();
				this.#commonNodeSettingsStore.hideSettings();
				this.#complexNodeSettingsStore.toggleVisibility(false);
				this.#complexNodeSettingsStore.reset();
				setTimeout(() => resolve(), HIDE_SETTINGS_DELAY);
			});
		}
		#resetSettingsState() {
			this.#commonNodeSettingsStore.hideSettings();
			this.#complexNodeSettingsStore.toggleVisibility(false);
			this.#complexNodeSettingsStore.reset();
		}
		hideCurrentBlockSettings(blockId) {
			if (this.isCurrentBlock(blockId)) {
				this.hideAllSettings();
			}
		}
		async showNodeSettings(block) {
			if (BLOCK_TYPES_WITHOUT_SETTINGS.includes(ui_vue3.toValue(block).type)) {
				this.hideAllSettings();
				return;
			}
			if (this.#isShowingSettings) {
				return;
			}
			this.#isShowingSettings = true;
			try {
				const blockActivities = ['StateInitializationActivity', 'StateFinalizationActivity', 'EventDrivenActivity'];
				if (blockActivities.includes(block.activity.Type)) {
					await main_core.Runtime.loadExtension('sidepanel');
					const url = `/bizprocdesigner/editor/?ID=${this.#diagramStore.templateId}&editBlock=${block.id}`;
					window.BX.SidePanel.Instance.open(url, {
						customLeftBoundary: 50,
						allowChangeHistory: false,
						cacheable: false
					});
					return;
				}
				const notReallyComplexBlock = ['ForEachActivity', 'WhileActivity', 'IfElseBranchActivity'];
				if (block.type === BLOCK_TYPES$1.COMPLEX && !notReallyComplexBlock.includes(block.activity.Type)) {
					await this.showComplexNodeSettings(block);
					return;
				}
				await this.showCommonNodeSettings(block);
			} finally {
				this.#isShowingSettings = false;
			}
		}
		async showCommonNodeSettings(block) {
			const shouldSwitch = await this.#shouldSwitchToBlock();
			if (!shouldSwitch) {
				return;
			}
			if (!this.#commonNodeSettingsStore.isVisible) {
				this.#resetSettingsState();
				this.#appStore.showRightPanel();
			}
			this.#commonNodeSettingsStore.showSettings(block);
		}
		async showComplexNodeSettings(block) {
			const shouldSwitch = await this.#shouldSwitchToBlock();
			if (!shouldSwitch) {
				return;
			}
			if (!this.#complexNodeSettingsStore.isShown) {
				this.#resetSettingsState();
				this.#appStore.showRightPanel();
				this.#complexNodeSettingsStore.toggleVisibility(true);
			}
			await this.#complexNodeSettingsStore.fetchNodeSettings(block);
		}
		#areComplexNodeSettingsDirty(block) {
			const {
				ports,
				nodeSettings
			} = this.#complexNodeSettingsStore;
			const {
				title,
				description
			} = nodeSettings;
			const blockDescription = block.activity.Properties.EditorComment ?? '';
			return ports.length !== block.ports.length || title.trim() !== block.node.title.trim() || description.trim() !== blockDescription.trim();
		}
		getCtxMenuItemShowSettings(block) {
			return {
				id: 'showSettings',
				text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_OPEN'),
				onclick: () => this.showNodeSettings(block)
			};
		}
		getCtxMenuItemDeleteBlock(block) {
			const itemId = 'deleteBlock';
			return {
				id: itemId,
				html: this.#getMenuItemHtml(itemId),
				onclick: () => {
					const isCurrentComplexBlock = this.isCurrentComplexBlock(block.id);
					this.hideCurrentBlockSettings(block.id);
					if (isCurrentComplexBlock) {
						this.resetComplexBlockSettings();
					}
					this.#blockDiagram.deleteBlockById(block.id);
					this.#history.makeSnapshot();
				}
			};
		}
		getCommonBlockMenuOptions(block) {
			return [this.getCtxMenuItemShowSettings(block), this.getCtxMenuItemCopyBlock(block), this.getCtxMenuItemDeleteBlock(block)];
		}
		getCtxMenuItemCopyBlock(block) {
			const itemId = 'copyBlock';
			return {
				id: itemId,
				html: this.#getMenuItemHtml(itemId),
				onclick: () => {
					this.#bufferStore.setBufferContent({
						blocks: [block],
						connections: []
					});
				}
			};
		}
		addComplexBlockPort(block, title) {
			let portId = '';
			const isRelationPort = `${title[0]}${title[1]}` === COMPLEX_NODE_PORT_LABELS.relation;
			const portType = isRelationPort ? PORT_TYPES.inputRelation : PORT_TYPES.input;
			if (this.isCurrentComplexBlock(block.id)) {
				if (isRelationPort) {
					portId = this.#complexNodeSettingsStore.addRelation();
					this.#complexNodeSettingsStore.addRelationPort(portId, portType);
				} else {
					portId = this.#complexNodeSettingsStore.addRule();
					this.#complexNodeSettingsStore.addRulePort(portId, portType, title);
				}
			} else {
				portId = generateNextInputPortId(block.ports.filter(port => {
					return port.type === PORT_TYPES.inputRelation || port.type === PORT_TYPES.input;
				}));
			}
			const isPortExists = block.ports.some(port => port.title === title);
			if (isPortExists) {
				return;
			}
			this.#diagramStore.setPorts(block.id, [...block.ports, {
				id: portId,
				title,
				type: portType,
				position: 'left'
			}]);
		}
		addAuxPort(block, title) {
			const isPortExists = block.ports.some(port => port.title === title);
			if (isPortExists) {
				return;
			}
			const auxPorts = block.ports.filter(port => port.type === PORT_TYPES.aux);
			const nextPortNumber = auxPorts.reduce((acc, port) => {
				const num = parseInt(port.id.slice(1), 10);
				return Math.max(acc, Number.isNaN(num) ? 0 : num);
			}, -1) + 1;
			this.#diagramStore.setPorts(block.id, [...block.ports, {
				id: `a${nextPortNumber}`,
				title,
				type: PORT_TYPES.aux,
				position: 'bottom'
			}]);
		}
		getComplexBlockPorts(block) {
			const {
				id,
				ports
			} = block;
			return this.#complexNodeSettingsStore.isCurrentBlock(id) ? this.#complexNodeSettingsStore.ports ?? ports : ports;
		}
		getComplexBlockTitle(block) {
			const {
				id,
				node: {
					title
				}
			} = block;
			return this.#complexNodeSettingsStore.isCurrentBlock(id) ? this.#complexNodeSettingsStore.nodeSettings?.title : title;
		}
		resetComplexBlockSettings(shouldHide = true) {
			const {
				block: complexBlock,
				nodeSettings
			} = this.#complexNodeSettingsStore;
			if (complexBlock && nodeSettings) {
				this.#complexNodeSettingsStore.discardFormSettings();
				this.#diagramStore.updateNodeTitle(complexBlock, nodeSettings.title);
			}
			if (shouldHide) {
				this.#complexNodeSettingsStore.toggleVisibility(false);
				this.#complexNodeSettingsStore.reset();
			} else if (complexBlock) {
				this.#complexNodeSettingsStore.setCurrentRule(null);
			}
		}
		#showConfirm() {
			return new Promise(resolve => {
				const messageBox = new ui_dialogs_messagebox.MessageBox({
					message: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_UNSAVE_CONFIRM'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					okCaption: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_UNSAVE_CONFIRM_OK'),
					cancelCaption: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_UNSAVE_CONFIRM_CANCEL'),
					onOk: () => {
						resolve(true);
						messageBox.close();
					},
					onCancel: () => {
						resolve(false);
						messageBox.close();
					}
				});
				messageBox.show();
			});
		}
		async #shouldSwitchToBlock() {
			const {
				block: complexBlock
			} = this.#complexNodeSettingsStore;
			if (!complexBlock) {
				return true;
			}
			const areComplexNodeSettingsDirty = this.#areComplexNodeSettingsDirty(complexBlock);
			if (!areComplexNodeSettingsDirty) {
				this.resetComplexBlockSettings(false);
				return true;
			}
			const shouldStay = await this.#showConfirm();
			if (!shouldStay) {
				this.resetComplexBlockSettings(false);
			}
			return !shouldStay;
		}
		#getMenuItemHtml(itemId) {
			return `
			<span class="editor-chart-block-control-menu-item">
				${this.#contextMenuItems[itemId].text}
				<span class="editor-chart-block-control-menu-item__action-code">
					<span class="editor-chart-block-control-menu-item__action-code_text">
						${this.#contextMenuItems[itemId].shortcut}
					</span>
				</span>
			</span>
		`;
		}
		syncSettingsWithDiagram() {
			const complexBlockId = this.#complexNodeSettingsStore.isShown ? this.#complexNodeSettingsStore.block?.id : null;
			const currentId = complexBlockId || this.#commonNodeSettingsStore.block?.id;
			if (!currentId) {
				return;
			}
			const blockExists = this.#diagramStore.blocks.some(block => block.id === currentId);
			if (!blockExists) {
				this.hideAllSettings();
				if (complexBlockId) {
					this.#complexNodeSettingsStore.toggleVisibility(false);
					this.#complexNodeSettingsStore.reset();
				}
			}
		}
		handleMouseUp(event, block) {
			if (event.button !== 0) {
				return;
			}
			const isGroupSelected = this.#highlightedBlocks.highlitedBlockIds.value.length > 1;
			if (isGroupSelected) {
				return;
			}
			const delta = Math.hypot(event.clientX - this.#clickStartX, event.clientY - this.#clickStartY);
			const isDrag = delta > DRAG_THRESHOLD;
			if (isDrag && !this.isAnySettingsOpen()) {
				this.#highlightedBlocks.clear();
				return;
			}
			if (this.isCurrentBlock(block.id)) {
				return;
			}
			this.#highlightedBlocks.clear();
			this.#highlightedBlocks.add(block.id);
			this.showNodeSettings(block);
		}
		handleMouseDown(event) {
			if (event.button !== 0) {
				return;
			}
			this.#clickStartX = event.clientX;
			this.#clickStartY = event.clientY;
		}
		isAnySettingsOpen() {
			return this.#commonNodeSettingsStore.isVisible || this.#complexNodeSettingsStore.isShown;
		}
	}

	function useCopyPaste() {
		const diagramStore$1 = diagramStore();
		const bufferStore = useBufferStore();
		const blockDiagram = ui_blockDiagram.useBlockDiagram();
		function paste(point) {
			const {
				blocks = [],
				connections = []
			} = bufferStore.getBufferContent() ?? {};
			if (blocks.length === 0) {
				return [];
			}
			const addedBlockIds = pasteBlocks(blocks, point);
			pasteConnections(connections);
			return addedBlockIds;
		}
		function pasteBlocks(blocks, point) {
			const origin = {
				...blocks[0].position
			};
			const newBlocks = blocks.map(block => {
				return {
					...block,
					position: {
						x: point.x + (block.position.x - origin.x),
						y: point.y + (block.position.y - origin.y)
					}
				};
			});
			blockDiagram.addBlocks(newBlocks);
			for (const block of newBlocks) {
				diagramStore$1.updateBlockPublishStatus(block);
			}
			return newBlocks;
		}
		function pasteConnections(connections) {
			blockDiagram.addConnections(connections);
			for (const connection of connections) {
				diagramStore$1.setConnectionCurrentTimestamp(connection.id);
			}
		}
		return {
			paste
		};
	}

	const DEFAULT_SELECTION_PADDING = {
		top: 27,
		bottom: 25,
		left: 17,
		right: 17
	};
	const DEFAULT_BLOCK_SIZE = {
		width: 150,
		height: 100
	};
	const SWITCHER_WIDTH = 17;

	// @vue/component
	const BlockDiagram = {
		name: 'BlockDiagramWidget',
		components: {
			BlockDiagramEntity: BlockDiagram$1,
			GroupSelectionBox: ui_blockDiagram.GroupSelectionBox
		},
		props: {
			disabled: {
				type: Boolean,
				default: false
			},
			enableGrouping: {
				type: Boolean,
				default: false
			}
		},
		// eslint-disable-next-line max-lines-per-function
		setup() {
			const showBlockSettings = ui_vue3.inject('showBlockSettings');
			const animationQueue = ui_blockDiagram.useAnimationQueue();
			const diagramStore$1 = diagramStore();
			const bufferStore = useBufferStore();
			const {
				blocks: blocksInStore,
				connections: connectionsInStore
			} = ui_vue3_pinia.storeToRefs(diagramStore$1);
			const {
				getMessage
			} = useLoc();
			const highlightedBlocks = ui_blockDiagram.useHighlightedBlocks();
			const highlitedBlockIds = highlightedBlocks.highlitedBlockIds;
			const history = ui_blockDiagram.useHistory();
			const {
				isFeatureAvailable
			} = useFeature();
			const {
				transformEventToPoint,
				transformX,
				transformY,
				currentSnapshot
			} = ui_blockDiagram.useBlockDiagram();
			const copyPaste = useCopyPaste();
			const mediator = new BlockMediator();
			const selectionBoxConfig = ui_vue3.computed(() => {
				const selectedIds = ui_vue3.toValue(highlitedBlockIds);
				const selectedBlocks = selectedIds?.length ? ui_vue3.toValue(blocks).filter(b => selectedIds.includes(b.id)) : [];
				let {
					left
				} = DEFAULT_SELECTION_PADDING;
				if (selectedBlocks.length > 0) {
					const minX = Math.min(...selectedBlocks.map(b => b.position.x));
					const hasTriggerOnLeft = selectedBlocks.some(b => b.type === BLOCK_TYPES$1.TRIGGER && Math.abs(b.position.x - minX) < 1);
					if (hasTriggerOnLeft) {
						left += SWITCHER_WIDTH;
					}
				}
				return {
					padding: {
						...DEFAULT_SELECTION_PADDING,
						left
					},
					defaultBlockSize: DEFAULT_BLOCK_SIZE
				};
			});
			const performPaste = point => {
				try {
					highlightedBlocks.clear();
					const newBlocks = copyPaste.paste(point);
					ui_vue3.nextTick(() => {
						if (newBlocks.length > 0) {
							highlightedBlocks.set(newBlocks.map(block => block.id));
						}
						if (newBlocks.length === 1) {
							mediator.showNodeSettings(newBlocks[0]);
						}
					});
					history.makeSnapshot();
				} catch (e) {
					console.error('Paste error:', e);
				}
			};
			const handleCopy = () => {
				const selectedIds = ui_vue3.toValue(highlitedBlockIds);
				if (selectedIds.length === 0) {
					return;
				}
				const selectedBlocks = blocks.value.filter(block => selectedIds.includes(block.id));
				const selectedConnections = ui_vue3.toValue(connections).filter(conn => {
					return selectedIds.includes(conn.sourceBlockId) && selectedIds.includes(conn.targetBlockId);
				});
				bufferStore.setBufferContent({
					blocks: selectedBlocks,
					connections: selectedConnections
				});
				closeContextMenu();
			};
			const handlePasteShortcut = (event, mousePos) => {
				const rawPoint = transformEventToPoint({
					clientX: mousePos.x,
					clientY: mousePos.y
				});
				const correctedPoint = {
					x: rawPoint.x + (ui_vue3.toValue(transformX) || 0),
					y: rawPoint.y + (ui_vue3.toValue(transformY) || 0)
				};
				performPaste(correctedPoint);
			};
			const handleDelete = () => {
				const ids = ui_vue3.toValue(highlitedBlockIds);
				if (ids.length === 0) {
					return;
				}
				ids.forEach(id => {
					diagramStore$1.deleteBlockById(id);
					mediator.hideCurrentBlockSettings(id);
				});
				history.makeSnapshot();
				highlightedBlocks.clear();
				closeContextMenu();
				fetchUpdateDiagram();
			};
			ui_blockDiagram.useKeyboardShortcuts([{
				keys: ['Mod', 'c'],
				handler: handleCopy
			}, {
				keys: ['Mod', 'v'],
				handler: handlePasteShortcut
			}, {
				keys: ['Delete'],
				handler: handleDelete
			}, {
				keys: ['Backspace'],
				handler: handleDelete
			}]);
			const {
				closeContextMenu
			} = ui_blockDiagram.useContextMenu();
			const blocks = ui_vue3.computed({
				get() {
					return ui_vue3.toValue(blocksInStore);
				},
				set(newBlocks) {
					diagramStore$1.setBlocks(newBlocks);
					fetchUpdateDiagram();
				}
			});
			const connections = ui_vue3.computed({
				get() {
					return ui_vue3.toValue(connectionsInStore);
				},
				set(newConnections) {
					diagramStore$1.setConnections(newConnections);
					fetchUpdateDiagram();
				}
			});
			const fetchUpdateDiagram = main_core.Runtime.debounce(updateDiagramData, 700);
			const groupMenuItems = ui_vue3.computed(() => [{
				id: 'copy-group',
				text: getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_COPY'),
				onclick: handleCopy
			}, {
				id: 'delete-group',
				text: getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'),
				onclick: handleDelete
			}]);
			const isBufferEmpty = ui_vue3.computed(() => bufferStore.isBufferEmpty);
			async function updateDiagramData() {
				const maxAttempts = 3;
				let attempt = 0;
				while (attempt < maxAttempts) {
					try {
						// eslint-disable-next-line no-await-in-loop
						await diagramStore$1.publicDraft();
						diagramStore$1.updateStatus(true);
						return;
					} catch {
						attempt++;
						if (attempt >= maxAttempts) {
							diagramStore$1.updateStatus(false);
							ui_notification.UI.Notification.Center.notify({
								content: getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED_HINT'),
								autoHideDelay: 4000
							});
						}
					}
				}
			}
			function onDropNewBlock(block) {
				diagramStore$1.updateBlockPublishStatus(block);
			}
			async function onBlockTransitionEnd(block) {
				if (!block || !block.position) {
					console.warn('Incorrect object for block transition end event', block);
					return;
				}
				animationQueue.pause();
				try {
					// TODO: replace the method showBlockSettings with honey from slices app and settings
					await showBlockSettings(block, true);
				} finally {
					animationQueue.play();
				}
			}
			function onDeleteConnection(connectionId) {
				diagramStore$1.setConnectionCurrentTimestamp(connectionId);
				removeOrphanedAuxPorts();
			}
			function getConnectedPortIds(blockId) {
				const ids = new Set();
				for (const connection of diagramStore$1.connections) {
					if (connection.sourceBlockId === blockId) {
						ids.add(connection.sourcePortId);
					}
					if (connection.targetBlockId === blockId) {
						ids.add(connection.targetPortId);
					}
				}
				return ids;
			}
			function getFirstAuxPort(auxPorts) {
				return auxPorts.reduce((first, port) => {
					const a = parseInt(first.title.replaceAll(/\D/g, ''), 10) || 0;
					const b = parseInt(port.title.replaceAll(/\D/g, ''), 10) || 0;
					return b < a ? port : first;
				});
			}
			function removeOrphanedAuxPorts() {
				for (const block of diagramStore$1.blocks) {
					const auxPorts = block.ports.filter(port => port.type === PORT_TYPES.aux && port.isActive !== false);
					if (auxPorts.length <= 1) {
						continue;
					}
					const connectedPortIds = getConnectedPortIds(block.id);
					const firstAuxPortId = getFirstAuxPort(auxPorts).id;
					const orphanedIds = new Set(auxPorts.filter(port => port.id !== firstAuxPortId && !connectedPortIds.has(port.id)).map(port => port.id));
					if (orphanedIds.size > 0) {
						diagramStore$1.setPorts(block.id, block.ports.filter(port => !orphanedIds.has(port.id)));
					}
				}
			}
			function onCreateConnection(connection) {
				diagramStore$1.setConnectionCurrentTimestamp(connection.id);
			}
			ui_vue3.watch(currentSnapshot, () => {
				mediator.syncSettingsWithDiagram();
			});
			function onCanvasMouseDown(event) {
				if (event.button !== 0) {
					return;
				}
				mediator.hideAllSettings();
			}
			return {
				blocks,
				connections,
				blockSlotNames: BLOCK_SLOT_NAMES,
				connectionSlotNames: CONNECTION_SLOT_NAMES,
				onBlockTransitionEnd,
				onDropNewBlock,
				highlitedBlockIds,
				isFeatureAvailable,
				groupMenuItems,
				selectionBoxConfig,
				performPaste,
				isBufferEmpty,
				onDeleteConnection,
				onCreateConnection,
				closeContextMenu,
				onCanvasMouseDown
			};
		},
		computed: {
			contextMenuItems() {
				return [this.pasteMenuItem];
			},
			pasteMenuItem() {
				return {
					id: 'paste',
					disabled: this.isBufferEmpty,
					html: `
					<span class="editor-chart-block-control-menu-item">
						${this.menuItemText}
						<span class="editor-chart-block-control-menu-item__action-code">
							<span class="editor-chart-block-control-menu-item__action-code_text">
								${this.menuItemShortcut}
							</span>
						</span>
					</span>
				`,
					onclick: point => {
						this.performPaste(point);
					}
				};
			},
			isMac() {
				return main_core.Browser.isMac();
			},
			menuItemShortcut() {
				return this.isMac ? '⌘ V' : 'Ctrl-V';
			},
			menuItemText() {
				return this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_PASTE');
			}
		},
		// @todo to widget
		watch: {
			highlitedBlockIds: {
				deep: true,
				handler(newIds, oldIds) {
					if (!this.isFeatureAvailable(bizprocdesigner_feature.FeatureCode.aiAssistant)) {
						return;
					}
					if (oldIds.length > 0 && newIds.length === 0) {
						setUserSelectedBlock();
					}
					if (newIds.length === 1) {
						const id = newIds[0];
						const existedBlock = this.blocks.find(block => block.id === id);
						if (existedBlock) {
							setUserSelectedBlock(id);
						}
					}
				}
			}
		},
		template: `
		<BlockDiagramEntity
			v-model:blocks="blocks"
			v-model:connections="connections"
			:disabled="disabled"
			:enableGrouping="enableGrouping"
			:contextMenuItems="contextMenuItems"
			@mousedown="onCanvasMouseDown"
			@blockTransitionEnd="onBlockTransitionEnd"
			@dropNewBlock="onDropNewBlock"
			@createConnection="onCreateConnection"
			@deleteConnection="onDeleteConnection"
		>
			<template
				v-for="slotName in Object.values(blockSlotNames)"
				#[slotName]="{ block }"
			>
				<slot
					:name="slotName"
					:block="block"
				/>
			</template>

			<template
				v-for="slotName in Object.values(connectionSlotNames)"
				#[slotName]="{ connection }"
			>
				<slot
					:name="slotName"
					:connection="connection"
				/>
			</template>

			<template #group-selection-box>
				<GroupSelectionBox
					v-if="enableGrouping"
					:menuItems="groupMenuItems"
					:padding="selectionBoxConfig.padding"
					:defaultBlockSize="selectionBoxConfig.defaultBlockSize"
				/>
			</template>
		</BlockDiagramEntity>
	`
	};

	// @vue/component
	const DeleteBlockIconBtn = {
		name: 'DeleteBlockIconBtn',
		components: {
			IconButton
		},
		props: {
			/** @type BlockId */
			blockId: {
				type: String,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['deletedBlock'],
		setup(props, {
			emit
		}) {
			const history = ui_blockDiagram.useHistory();
			const {
				deleteBlockById
			} = ui_blockDiagram.useBlockDiagram();
			const {
				publicDraft,
				updateStatus
			} = diagramStore();
			function tryPublicDraft() {
				try {
					publicDraft();
					updateStatus(true);
				} catch {
					updateStatus(false);
				}
			}
			function onDeleteBlock() {
				if (props.disabled) {
					return;
				}
				deleteBlockById(props.blockId);
				history.makeSnapshot();
				emit('deletedBlock', props.blockId);
				tryPublicDraft();
			}
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				onDeleteBlock
			};
		},
		template: `
		<IconButton
			:icon-name="iconSet.TRASHCAN"
			:color="'var(--ui-color-palette-gray-40)'"
			:data-test-id="$testId('blockDelete', blockId)"
			@mousedown.stop
			@mouseup.stop
			@click="onDeleteBlock"
		/>
	`
	};

	// @vue/component
	const UpdatePublishedStatusLabel = {
		name: 'UpdatePublishedStatusLabel',
		components: {
			BlockStatusNotPublished,
			BlockStatusPublishError
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			const diagramStore$1 = diagramStore();
			const isPublished = ui_vue3.computed(() => {
				const updated = diagramStore$1.blockCurrentTimestamps[props.block.id];
				const published = diagramStore$1.blockSavedTimestamps[props.block.id];
				return updated === published;
			});
			const hasPublishError = ui_vue3.computed(() => {
				return main_core.Type.isObject(diagramStore$1.blockCurrentPublishErrors[props.block.id]);
			});
			return {
				isPublished,
				hasPublishError
			};
		},
		template: `
		<BlockStatusPublishError v-if="hasPublishError"/>
		<BlockStatusNotPublished v-else-if="!isPublished"/>
	`
	};

	// @vue/component
	const EditTemplateName = {
		name: 'EditTemplateName',
		components: {
			TemplateNameInput
		},
		props: {
			/** @type MenuOptions */
			dropdownOptions: {
				type: Object,
				default: () => ({})
			}
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(diagramStore, ['template']),
			templateName: {
				get() {
					return this.template?.NAME ?? '';
				},
				set(name) {
					this.template.NAME = main_core.Type.isStringFilled(name) ? name : this.loc('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE');
					this.updateTemplateData({
						NAME: this.template.NAME
					});
				}
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(diagramStore, ['updateTemplateData']),
			loc(locString) {
				return this.$bitrix.Loc.getMessage(locString);
			}
		},
		template: `
		<TemplateNameInput
			v-model:title="templateName"
			:dropdownOptions="dropdownOptions"
		/>
	`
	};

	// @vue/component
	const PublishDropdownButton$1 = {
		name: 'PublishDropdownButton',
		components: {
			DropdownMenuButton
		},
		data() {
			return {
				isLoading: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(diagramStore, ['templatePublishStatus', 'blockCurrentTimestamps', 'blockSavedTimestamps', 'connectionCurrentTimestamps', 'connectionSavedTimestamps', 'connections']),
			icon() {
				const icons = {
					[TEMPLATE_PUBLISH_STATUSES.MAIN]: 'ui-btn-icon-workflow',
					[TEMPLATE_PUBLISH_STATUSES.USER]: 'ui-btn-icon-person',
					[TEMPLATE_PUBLISH_STATUSES.FULL]: 'ui-btn-icon-workflow-stop'
				};
				return icons[this.templatePublishStatus];
			},
			style() {
				const isChanged = this.isChanged(this.blockCurrentTimestamps, this.blockSavedTimestamps) || this.isChanged(this.connectionCurrentTimestamps, this.connectionSavedTimestamps);
				return isChanged ? ui_vue3_components_button.AirButtonStyle.FILLED : ui_vue3_components_button.AirButtonStyle.OUTLINE_ACCENT_2;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(diagramStore, ['publicTemplate']),
			...ui_vue3_pinia.mapActions(useToastStore, {
				addCustomToast: 'addCustom',
				clearAllToastOfType: 'clearAllOfType'
			}),
			publishTemplate() {
				({
					[TEMPLATE_PUBLISH_STATUSES.MAIN]: this.fetchPublishMainTemplate,
					[TEMPLATE_PUBLISH_STATUSES.USER]: this.fetchPublishUserTemplate,
					[TEMPLATE_PUBLISH_STATUSES.FULL]: this.fetchPublishFullTemplate
				})[this.templatePublishStatus]();
			},
			async fetchPublishMainTemplate() {
				this.isLoading = true;
				this.clearAllToastOfType(BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR);
				try {
					await this.publicTemplate();
					ui_notification.UI.Notification.Center.notify({
						content: this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_SAVE_SUCCESS') ?? '',
						autoHideDelay: 5000
					});
				} catch (error) {
					if (main_core.Type.isArrayFilled(error.data?.activityErrors)) {
						this.addCustomToast(main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH_ERROR_TOAST'), BLOCK_TOAST_TYPES.ACTIVITY_PUBLIC_ERROR);
					}
					handleResponseError(error);
				} finally {
					this.isLoading = false;
				}
			},
			fetchPublishUserTemplate() {
				alert('doUserPublication');
				this.loading = false;
			},
			fetchPublishFullTemplate() {
				alert('doFullPublication');
				this.loading = false;
			},
			isChanged(current, published) {
				const keysCurrent = Object.keys(current);
				const keysPublished = Object.keys(published);
				if (keysCurrent.length !== keysPublished.length) {
					return true;
				}
				for (const key of keysCurrent) {
					if (current[key] !== published[key]) {
						return true;
					}
				}
				return false;
			}
		},
		template: `
		<DropdownMenuButton
			:text="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH')"
			:icon="icon"
			:loading="isLoading"
			:style="style"
			@change="publishTemplate"
		>
			<template #default>
				<slot/>
			</template>
		</DropdownMenuButton>
	`
	};

	// @vue/components
	const PublishMainDropdownOption = {
		name: 'PublishMainDropdownOption',
		components: {
			DropdownMenuOption,
			WorkflowIcon
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(diagramStore, ['templatePublishStatus']),
			isActive() {
				return this.templatePublishStatus === TEMPLATE_PUBLISH_STATUSES.MAIN;
			}
		},
		methods: {
			onChangeOption() {
				this.templatePublishStatus = TEMPLATE_PUBLISH_STATUSES.MAIN;
			}
		},
		template: `
		<DropdownMenuOption
			:title="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_MAIN_TITLE')"
			:description="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_MAIN_DESCR')"
			:isActive="isActive"
			@click="onChangeOption"
		>
			<template #icon>
				<WorkflowIcon :active="isActive"/>
			</template>
		</DropdownMenuOption>
	`
	};

	// @vue/components
	const PublishUserDropdownOption = {
		name: 'PublishUserDropdownOption',
		components: {
			DropdownMenuOption,
			PersonIcon
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(diagramStore, ['templatePublishStatus']),
			isActive() {
				return this.templatePublishStatus === TEMPLATE_PUBLISH_STATUSES.USER;
			}
		},
		methods: {
			onChangeOption() {
				this.templatePublishStatus = TEMPLATE_PUBLISH_STATUSES.USER;
			}
		},
		template: `
		<DropdownMenuOption
			:title="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_PERSONAL_TITLE')"
			:description="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_PERSONAL_DESCR')"
			:isActive="false"
			:notReleased="true"
		>
			<template #icon>
				<PersonIcon :active="isActive"/>
			</template>
		</DropdownMenuOption>
	`
	};

	// @vue/components
	const PublishFullDropdownOption = {
		name: 'PublishFullDropdownOption',
		components: {
			DropdownMenuOption,
			StopIcon
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(diagramStore, ['templatePublishStatus']),
			isActive() {
				return this.templatePublishStatus === TEMPLATE_PUBLISH_STATUSES.FULL;
			}
		},
		methods: {
			onChangeOption() {
				this.templatePublishStatus = TEMPLATE_PUBLISH_STATUSES.FULL;
			}
		},
		template: `
		<DropdownMenuOption
			:title="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_FULL_TITLE')"
			:description="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_FULL_DESCR')"
			:isActive="false"
			:notReleased="true"
		>
			<template #icon>
				<StopIcon :active="isActive"/>
			</template>
		</DropdownMenuOption>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const AutosizeBlockContainer = {
		name: 'AutosizeBlockContainer',
		components: {
			BlockContainer
		},
		props: {
			/** @type BlockId */
			blockId: {
				type: String,
				required: true
			},
			/** @type Array<MenuItemOptions> */
			contextMenuItems: {
				type: Array,
				default: () => []
			},
			width: {
				type: Number,
				default: null
			},
			height: {
				type: Number,
				default: null
			},
			autosize: {
				type: Boolean,
				default: false
			},
			highlighted: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			colorName: {
				type: String,
				default: BLOCK_COLOR_NAMES.WHITE,
				validator(name) {
					return Object.values(BLOCK_COLOR_NAMES).includes(name);
				}
			}
		},
		computed: {
			size() {
				if (this.autosize) {
					return {};
				}
				return {
					width: this.width,
					height: this.height
				};
			}
		},
		mounted() {
			if (this.autosize) {
				this.$nextTick(() => {
					const {
						width,
						height
					} = this.$refs.blockContainer?.$el?.getBoundingClientRect() ?? {};
					this.setSizeAutosizedBlock(this.blockId, width, height);
				});
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(diagramStore, ['setSizeAutosizedBlock'])
		},
		template: `
		<BlockContainer
			ref="blockContainer"
			v-bind="size"
			:contextMenuItems="contextMenuItems"
			:highlighted="highlighted"
			:disabled="disabled"
			:colorName="colorName"
		>
			<template #default="{ isOpenContextMenu }">
				<slot :isOpenContextMenu="isOpenContextMenu"/>
			</template>
		</BlockContainer>
	`
	};

	// @vue/component
	const ChangeFrameColorTopBtn = {
		name: 'ChangeFrameColorTopBtn',
		components: {
			ColorMenuTopBtn
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		emits: ['update:open'],
		setup() {
			const {
				updateBlock
			} = ui_blockDiagram.useBlockDiagram();
			return {
				getContextMenuName,
				updateBlock
			};
		},
		computed: {
			colorName() {
				return this.block.node.frameColorName;
			},
			colorOptions() {
				return Object.values(FRAME_COLOR_NAMES);
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(diagramStore, ['publicDraft', 'updateStatus']),
			async onUpdateFrameColor(frameColorName) {
				try {
					this.updateBlock({
						...this.block,
						node: {
							...this.block.node,
							frameColorName
						}
					});
					await this.publicDraft();
					this.updateStatus(true);
				} catch {
					this.updateStatus(false);
				}
			}
		},
		template: `
		<ColorMenuTopBtn
			:colorName="colorName"
			:options="colorOptions"
			:contextMenuName="getContextMenuName(block.id)"
			@update:colorName="onUpdateFrameColor"
			@update:open="$emit('update:open', $event)"
		/>
	`
	};

	const ChangeFrameTextAlignTopBtn = {
		name: 'ChangeFrameTextAlignTopBtn',
		components: {
			TextAlignMenuTopBtn
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		setup() {
			const {
				updateBlock
			} = ui_blockDiagram.useBlockDiagram();
			return {
				getContextMenuName,
				updateBlock
			};
		},
		computed: {
			textAlign() {
				return this.block.node.frameTextAlign;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(diagramStore, ['publicDraft', 'updateStatus']),
			async onUpdateFrameTextAlign(frameTextAlign) {
				try {
					this.updateBlock({
						...this.block,
						node: {
							...this.block.node,
							frameTextAlign
						}
					});
					await this.publicDraft();
					this.updateStatus(true);
				} catch {
					this.updateStatus(false);
				}
			}
		},
		template: `
		<TextAlignMenuTopBtn
			:textAlign="textAlign"
			:contextMenuName="getContextMenuName(block.id)"
			@update:textAlign="onUpdateFrameTextAlign"
			@update:open="$emit('update:open', $event)"
		/>
	`
	};

	// @vue/component
	const ChangeActivationTopBtn = {
		name: 'ChangeActivationTopBtn',
		components: {
			ActivationTopBtn
		},
		inject: ['onToggleBlockActivation'],
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		methods: {
			onChangeActivation() {
				if (!this.onToggleBlockActivation) {
					console.warn('onToggleBlockActivation is not provided');
					return;
				}
				this.onToggleBlockActivation(this.block.id);
			}
		},
		template: `
		<ActivationTopBtn
			:block="block"
			@changeActivation="onChangeActivation"
		/>
	`
	};

	// @vue/component
	const ChangeActivationBlockSwitcher = {
		name: 'ChangeActivationBlockSwitcher',
		components: {
			BlockSwitcher
		},
		inject: ['onToggleBlockActivation'],
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		computed: {
			isBlockActivated() {
				if (!this.block?.activity?.Activated) {
					return true;
				}
				return this.block.activity.Activated !== BX_FLAG_NO;
			}
		},
		methods: {
			onChangeBlockActivation() {
				if (!this.onToggleBlockActivation) {
					console.warn('onToggleBlockActivation is not provided');
					return;
				}
				this.onToggleBlockActivation(this.block.id);
			}
		},
		template: `
		<BlockSwitcher
			:on="isBlockActivated"
			@click="onChangeBlockActivation"
		/>
	`
	};

	// @vue/component
	const BlockLayoutWidget = {
		name: 'BlockLayoutWidget',
		components: {
			BlockLayout,
			MoreMenuTopBtn
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			/** @type Array<DiagramContextMenuItemOptions> */
			moreMenuItems: {
				type: Array,
				default: () => []
			},
			showTopMenu: {
				type: Boolean,
				default: false
			},
			dragged: {
				type: Boolean,
				default: false
			},
			resized: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			hoverable: {
				type: Boolean,
				default: true
			}
		},
		setup() {
			const {
				openedContextMenuName
			} = ui_blockDiagram.useBlockDiagram();
			return {
				openedContextMenuName,
				getContextMenuName,
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES
			};
		},
		computed: {
			isShowTopMenu() {
				return this.openedContextMenuName === getContextMenuName(this.block.id) || this.showTopMenu;
			},
			isShowMoreMenu() {
				return this.moreMenuItems.length > 0;
			}
		},
		template: `
		<BlockLayout
			:block="block"
			:dragged="dragged"
			:resized="resized"
			:disabled="disabled"
			:hoverable="hoverable"
			:showTopMenu="isShowTopMenu"
		>
			<template
				v-if="$slots[blockLayoutSlotNames.TOP_MENU]"
				#[blockLayoutSlotNames.TOP_MENU]
			>
				<slot :name="blockLayoutSlotNames.TOP_MENU"/>
				<MoreMenuTopBtn
					v-if="isShowMoreMenu"
					:block="block"
					:moreMenuItems="moreMenuItems"
				/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.TOP_MENU_TITLE]"
				#[blockLayoutSlotNames.TOP_MENU_TITLE]
			>
				<slot :name="blockLayoutSlotNames.TOP_MENU_TITLE"/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.HEADER]"
				#[blockLayoutSlotNames.HEADER]
			>
				<slot :name="blockLayoutSlotNames.HEADER"/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.DEFAULT]"
				#[blockLayoutSlotNames.DEFAULT]
			>
				<slot :name="blockLayoutSlotNames.DEFAULT"/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.LEFT]"
				#[blockLayoutSlotNames.LEFT]
			>
				<slot :name="blockLayoutSlotNames.LEFT"/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.STATUS]"
				#[blockLayoutSlotNames.STATUS]
			>
				<slot :name="blockLayoutSlotNames.STATUS"/>
			</template>
		</BlockLayout>
	`
	};

	// @vue/component
	const BlockTopTitleWidget = {
		name: 'BlockTopTitleWidget',
		components: {
			BlockTopTitle
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		computed: {
			userTitle() {
				const activityTitle = this.block.activity?.Properties?.Title;
				const defaultNodeTitle = this.block.node?.title;
				return activityTitle === defaultNodeTitle ? null : activityTitle;
			}
		},
		template: `
		<BlockTopTitle
			:title="userTitle"
			:description="block.activity.Properties.EditorComment"
		/>
	`
	};

	// @vue/component
	const BlockSimple = {
		name: 'BlockSimple',
		components: {
			MoveableBlock: ui_blockDiagram.MoveableBlock,
			BlockContainer,
			BlockLayoutWidget,
			BlockHeader,
			BlockIcon,
			DeleteBlockIconBtn,
			UpdatePublishedStatusLabel,
			IconDivider,
			IconButton,
			PortsLayout,
			PortInout,
			PortAux,
			BlockTopTitleWidget,
			ChangeActivationTopBtn
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				blockMediator: new BlockMediator(),
				portTypes: PORT_TYPES,
				portPosition: ui_blockDiagram.PORT_POSITION
			};
		},
		computed: {
			contextMenuItems() {
				return this.blockMediator.getCommonBlockMenuOptions(this.block);
			}
		},
		template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="300"
					:height="58"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<template #default="{ isBlockActivated }">
						<BlockLayoutWidget
							:block="block"
							:moreMenuItems="contextMenuItems"
							:dragged="isDragged"
							:disabled="isDisabled"
							:hoverable="!isMakeNewConnection"
						>
							<template #top-menu-title>
								<BlockTopTitleWidget :block="block"/>
							</template>

							<template #top-menu>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #default>
								<PortsLayout
									:block="block"
									:leftPortTypes="portTypes.input"
									:rightPortTypes="portTypes.output"
									:bottomPortTypes="portTypes.aux"
									:disabled="isDisabled"
								>
									<template #left="{ port, index }">
										<PortInout
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.LEFT"
										/>
									</template>

									<template #right="{ port, index }">
										<PortInout
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.RIGHT"
										/>
									</template>

									<template #bottom="{ port, index }">
										<PortAux
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.BOTTOM"
											:inactive="port.isActive === false"
										/>
									</template>

									<template #default>
										<BlockHeader
											:block="block"
											:deactivated="!isBlockActivated"
										>
											<template #icon>
												<BlockIcon
													:iconName="block.node.icon"
													:iconColorIndex="block.node.colorIndex"
													:deactivated="!isBlockActivated"
												/>
											</template>
										</BlockHeader>
									</template>
								</PortsLayout>
							</template>

							<template #status>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`
	};

	// @vue/component
	const BlockTrigger = {
		name: 'BlockTrigger',
		components: {
			MoveableBlock: ui_blockDiagram.MoveableBlock,
			AutosizeBlockContainer,
			BlockContainer,
			BlockLayoutWidget,
			BlockHeader,
			BlockIcon,
			DeleteBlockIconBtn,
			UpdatePublishedStatusLabel,
			IconDivider,
			IconButton,
			PortsLayout,
			PortInout,
			BlockTopTitleWidget,
			ChangeActivationTopBtn,
			ChangeActivationBlockSwitcher
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				blockMediator: new BlockMediator(),
				portTypes: PORT_TYPES,
				portPosition: ui_blockDiagram.PORT_POSITION,
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES
			};
		},
		computed: {
			userTitle() {
				return getBlockUserTitle(this.block);
			},
			contextMenuItems() {
				return this.blockMediator.getCommonBlockMenuOptions(this.block);
			}
		},
		template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="300"
					:height="58"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<template #default="{ isBlockActivated }">
						<BlockLayoutWidget
							:block="block"
							:moreMenuItems="contextMenuItems"
							:dragged="isDragged"
							:disabled="isDisabled"
							:hoverable="!isMakeNewConnection"
						>
							<template #[blockLayoutSlotNames.TOP_MENU_TITLE]>
								<BlockTopTitleWidget :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.TOP_MENU]>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.DEFAULT]>
								<PortsLayout
									:block="block"
									:rightPortTypes="portTypes.output"
									:disabled="isDisabled"
								>
									<template #right="{ port, index }">
										<PortInout
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.RIGHT"
										/>
									</template>

									<template #default>
										<BlockHeader
											:block="block"
											:deactivated="!isBlockActivated"
										>
											<template #icon>
												<BlockIcon
													:iconName="block.node.icon"
													:iconColorIndex="block.node.colorIndex"
													:deactivated="!isBlockActivated"
												/>
											</template>
										</BlockHeader>
									</template>
								</PortsLayout>
							</template>

							<template #[blockLayoutSlotNames.LEFT]>
								<ChangeActivationBlockSwitcher :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.STATUS]>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`
	};

	const MAX_AUX_COUNT = 5;
	const DEFAULT_BLOCK_WIDTH = 200;
	// @vue/component
	const BlockComplex = {
		name: 'block-complex',
		components: {
			MoveableBlock: ui_blockDiagram.MoveableBlock,
			BlockContainer,
			BlockLayout,
			BlockLayoutWidget,
			BlockHeader,
			BlockIcon,
			DeleteBlockIconBtn,
			IconDivider,
			IconButton,
			PortsLayout,
			BlockComplexContent,
			BlockComplexPortPlaceholder,
			UpdatePublishedStatusLabel,
			BlockTopTitle,
			Port: ui_blockDiagram.Port,
			ChangeActivationTopBtn
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			const {
				getMessage
			} = useLoc();
			return {
				blockMediator: new BlockMediator(),
				validationInputOutputRule,
				normalyzeInputOutputConnection,
				validationAuxRule,
				normalyzeAuxConnection,
				getMessage
			};
		},
		computed: {
			userTitle() {
				return getBlockUserTitle(this.block);
			},
			auxPortsCount() {
				return this.block.ports.filter(port => port.type === PORT_TYPES.aux).length;
			},
			blockWidth() {
				return this.block.dimensions?.width ?? DEFAULT_BLOCK_WIDTH;
			},
			contextMenuItems() {
				return this.blockMediator.getCommonBlockMenuOptions(this.block);
			}
		},
		methods: {
			onAddPort(title) {
				this.blockMediator.addComplexBlockPort(this.block, title);
			},
			onAddAuxPort(title) {
				if (this.auxPortsCount >= MAX_AUX_COUNT) {
					return;
				}
				this.blockMediator.addAuxPort(this.block, title);
			},
			onDeletedBlock(blockId) {
				this.blockMediator.hideCurrentBlockSettings(blockId);
				if (this.blockMediator.isCurrentComplexBlock(blockId)) {
					this.blockMediator.resetComplexBlockSettings();
				}
			}
		},
		template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="blockWidth"
					:contextMenuItems="contextMenuItems"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<template #default="{ isBlockActivated }">
						<BlockLayoutWidget
							:block="block"
							:moreMenuItems="contextMenuItems"
							:dragged="isDragged"
							:disabled="isDisabled"
							:hoverable="!isMakeNewConnection"
						>
							<template #top-menu-title>
								<BlockTopTitle
									:title="userTitle"
									:description="block.activity.Properties.EditorComment"
								/>
							</template>
							<template #top-menu>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="onDeletedBlock($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #header>
								<BlockHeader
									:block="block"
									:deactivated="!isBlockActivated"
								>
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon"
											:iconColorIndex="block.node.colorIndex"
											:deactivated="!isBlockActivated"
										/>
									</template>
								</BlockHeader>
							</template>

							<template #default>
								<BlockComplexContent
									:block="block"
									:ports="blockMediator.getComplexBlockPorts(block)"
									:title="blockMediator.getComplexBlockTitle(block)"
									:disabled="isDisabled"
									:deactivated="!isBlockActivated"
								>
									<template #header="{ title }">
									</template>
									<template #portPlaceholder="{ item, isOutput }">
										<BlockComplexPortPlaceholder
											:title="item.title"
											:isOutput="isOutput"
											@addPort="onAddPort($event)"
										/>
									</template>
									<template #port="{ item, disabled, position, index }">
										<Port
											:block="block"
											:port="item"
											:index="index"
											:disabled="disabled"
											:validationRules="[validationInputOutputRule]"
											:normalyzeConnectionFn="normalyzeInputOutputConnection"
											:position="position"
										/>
										<span class="block-complex__content_col-value-text">
											{{ item.title }}
										</span>
									</template>
									<template #auxSectionLabel>
										<div class="block-complex__aux-section-label">
											<span class="block-complex__aux-section-label-text">
												{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_AUX_LAYOUT_TITLE') }}
											</span>
										</div>
									</template>
									<template #auxPort="{ item, index }">
										<Port
											:block="block"
											:port="item"
											:disabled="isDisabled"
											:styled="false"
											:validationRules="[validationAuxRule]"
											:normalyzeConnectionFn="normalyzeAuxConnection"
											:index="index"
											position="bottom"
										/>
									</template>
									<template #auxPortPlaceholder="{ item }">
										<BlockComplexPortPlaceholder
											:title="item.title"
											@addPort="onAddAuxPort($event)"
										/>
									</template>
								</BlockComplexContent>
							</template>

							<template #status>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`
	};

	const BLOCK_ICON_NAMES = {
		DATABASE: 'DATABASE',
		MCP_LETTERS: 'MCP_LETTERS'
	};

	// @vue/component
	const BlockTool = {
		name: 'BlockTool',
		components: {
			MoveableBlock: ui_blockDiagram.MoveableBlock,
			BlockContainer,
			BlockLayoutWidget,
			BlockHeader,
			BlockIcon,
			BlockToolSubIcon,
			BlockToolIcon,
			DeleteBlockIconBtn,
			UpdatePublishedStatusLabel,
			IconDivider,
			IconButton,
			PortsLayout,
			PortAux,
			BlockTopTitleWidget,
			ChangeActivationTopBtn
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				blockMediator: new BlockMediator(),
				portTypes: PORT_TYPES,
				portPosition: ui_blockDiagram.PORT_POSITION,
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES
			};
		},
		computed: {
			contextMenuItems() {
				return this.blockMediator.getCommonBlockMenuOptions(this.block);
			},
			headerBlockIconName() {
				return this.block.node.icon === BLOCK_ICON_NAMES.DATABASE ? this.block.node.icon : BLOCK_ICON_NAMES.MCP_LETTERS;
			},
			isShowSubIcon() {
				const iconName = this.block.node?.icon ?? null;
				return iconName && iconName !== BLOCK_ICON_NAMES.DATABASE;
			}
		},
		template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="300"
					:height="58"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<template #default="{ isBlockActivated }">
						<BlockLayoutWidget
							:block="block"
							:moreMenuItems="contextMenuItems"
							:dragged="isDragged"
							:disabled="isDisabled"
							:hoverable="!isMakeNewConnection"
						>
							<template #[blockLayoutSlotNames.TOP_MENU_TITLE]>
								<BlockTopTitleWidget :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.TOP_MENU]>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.DEFAULT]>
								<PortsLayout
									:block="block"
									:topPortTypes="portTypes.topAux"
									:bottomPortTypes="portTypes.aux"
									:leftPortTypes="portTypes.input"
									:rightPortTypes="portTypes.output"
									:disabled="isDisabled"
								>
									<template #top="{ port, index }">
										<PortAux
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.TOP"
											:inactive="port.isActive === false"
										/>
									</template>

									<template #default>
										<BlockHeader
											:block="block"
											:deactivated="!isBlockActivated"
										>
											<template #icon>
												<BlockToolIcon
													:iconName="block.node.icon"
													:deactivated="!isBlockActivated"
												/>
											</template>

											<template #subIcon>
												<BlockToolSubIcon
													v-if="block.node?.icon && block.node.icon !== 'DATABASE'"
													:icon="block.node.icon"
													:deactivated="!isBlockActivated"
												/>
											</template>
										</BlockHeader>
									</template>
								</PortsLayout>
							</template>

							<template #[blockLayoutSlotNames.STATUS]>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`
	};

	const BlockFrame = {
		name: 'BlockFrame',
		components: {
			ResizableBlock: ui_blockDiagram.ResizableBlock,
			BlockContainer,
			BlockLayout,
			BlockLayoutWidget,
			BlockTopTitleWidget,
			DeleteBlockIconBtn,
			UpdatePublishedStatusLabel,
			IconDivider,
			IconButton,
			ColorMenuTopBtn,
			ChangeFrameColorTopBtn,
			ChangeFrameTextAlignTopBtn,
			ContentSeparator
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				blockMediator: new BlockMediator(),
				frameBgColors: FRAME_BG_COLORS,
				frameBorderColors: FRAME_BORDER_COLORS,
				getContextMenuName,
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES
			};
		},
		computed: {
			contextMenuItems() {
				return [this.blockMediator.getCtxMenuItemCopyBlock(this.block), this.blockMediator.getCtxMenuItemDeleteBlock(this.block)];
			}
		},
		template: `
		<ResizableBlock :block="block">
			<template #default="{ isHighlighted, isResize, isDragged, isDisabled, isMakeNewConnection, width, height }">
				<BlockContainer
					:highlighted="(isHighlighted || isResize) && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					:backgroundColor="frameBgColors[block.node.frameColorName]"
					:borderColor="frameBorderColors[block.node.frameColorName]"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<BlockLayoutWidget
						:block="block"
						:moreMenuItems="contextMenuItems"
						:dragged="isDragged"
						:resized="isResize"
						:disabled="isDisabled"
						:hoverable="!isMakeNewConnection"
					>
						<template #[blockLayoutSlotNames.TOP_MENU_TITLE]>
							<BlockTopTitleWidget :block="block"/>
						</template>

						<template #[blockLayoutSlotNames.TOP_MENU]>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
							<ChangeFrameTextAlignTopBtn :block="block"/>
							<ChangeFrameColorTopBtn :block="block"/>
						</template>

						<template #[blockLayoutSlotNames.DEFAULT]>
							<ContentSeparator
								v-model:separatorPosition="block.node.frameSeparatorPosition"
								:blockId="block.id"
								:contentPosition="block.node.frameTextAlign"
								:width="width"
								:height="height"
							>
								<template #content>
								</template>
							</ContentSeparator>
						</template>

						<template #[blockLayoutSlotNames.STATUS]>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayoutWidget>
				</BlockContainer>
			</template>
		</ResizableBlock>
	`
	};

	// @vue/component
	const BlockOperator = {
		name: 'BlockOperator',
		components: {
			MoveableBlock: ui_blockDiagram.MoveableBlock,
			BlockContainer,
			BlockLayoutWidget,
			BlockHeader,
			BlockIcon,
			DeleteBlockIconBtn,
			UpdatePublishedStatusLabel,
			IconDivider,
			IconButton,
			PortsLayout,
			BlockTopTitleWidget,
			BlockContent,
			PortsGrid,
			PortInout,
			ChangeActivationTopBtn
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			autosize: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				blockMediator: new BlockMediator(),
				portTypes: PORT_TYPES,
				portPosition: ui_blockDiagram.PORT_POSITION,
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES
			};
		},
		computed: {
			contextMenuItems() {
				return this.blockMediator.getCommonBlockMenuOptions(this.block);
			}
		},
		template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="180"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<template #default="{ isBlockActivated }">
						<BlockLayoutWidget
							:block="block"
							:moreMenuItems="contextMenuItems"
							:dragged="isDragged"
							:disabled="isDisabled"
							:hoverable="!isMakeNewConnection"
						>
							<template #[blockLayoutSlotNames.TOP_MENU_TITLE]>
								<BlockTopTitleWidget :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.TOP_MENU]>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.HEADER]>
								<BlockHeader
									:block="block"
									:deactivated="!isBlockActivated"
								>
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon"
											:iconColorIndex="block.node.colorIndex"
											:deactivated="!isBlockActivated"
										/>
									</template>
								</BlockHeader>
							</template>

							<template #[blockLayoutSlotNames.DEFAULT]>
								<BlockContent :deactivated="!isBlockActivated">
									<PortsGrid
										:block="block"
										:leftTypes="portTypes.input"
										:rightTypes="portTypes.output"
									>
										<template #portLeft="{ port, index }">
											<PortInout
												:block="block"
												:port="port"
												:index="index"
												:position="portPosition.LEFT"
											/>
										</template>

										<template #portRight="{ port, index }">
											<PortInout
												:block="block"
												:port="port"
												:index="index"
												:position="portPosition.RIGHT"
											/>
										</template>
									</PortsGrid>
								</BlockContent>
							</template>

							<template #[blockLayoutSlotNames.STATUS]>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`
	};

	// @vue/component
	const BlockService = {
		name: 'BlockService',
		components: {
			MoveableBlock: ui_blockDiagram.MoveableBlock,
			BlockContainer,
			BlockLayoutWidget,
			BlockHeader,
			BlockIcon,
			DeleteBlockIconBtn,
			UpdatePublishedStatusLabel,
			IconDivider,
			IconButton,
			PortsLayout,
			PortInout,
			BlockTopTitleWidget,
			BlockContent,
			ChangeActivationTopBtn
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				portTypes: PORT_TYPES,
				portPosition: ui_blockDiagram.PORT_POSITION,
				blockMediator: new BlockMediator(),
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES
			};
		},
		computed: {
			contextMenuItems() {
				return this.blockMediator.getCommonBlockMenuOptions(this.block);
			}
		},
		template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="260"
					:height="96"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<template #default="{ isBlockActivated }">
						<BlockLayoutWidget
							:block="block"
							:moreMenuItems="contextMenuItems"
							:dragged="isDragged"
							:disabled="isDisabled"
							:hoverable="!isMakeNewConnection"
						>
							<template #[blockLayoutSlotNames.TOP_MENU_TITLE]>
								<BlockTopTitleWidget :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.TOP_MENU]>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.HEADER]>
								<PortsLayout
									:block="block"
									:leftPortTypes="portTypes.input"
									:rightPortTypes="portTypes.output"
									:disabled="isDisabled"
								>
									<template #left="{ port, index }">
										<PortInout
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.LEFT"
										/>
									</template>

									<template #right="{ port, index }">
										<PortInout
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.RIGHT"
										/>
									</template>

									<template #default>
										<BlockHeader
											:block="block"
											:deactivated="!isBlockActivated"
										>
											<template #icon>
												<BlockIcon
													:iconName="block.node.icon"
													:iconColorIndex="block.node.colorIndex"
													:deactivated="!isBlockActivated"
												/>
											</template>
										</BlockHeader>
									</template>
								</PortsLayout>
							</template>

							<template #[blockLayoutSlotNames.DEFAULT]>
								<BlockContent
									:colorIndex="block.node.colorIndex"
									:deactivated="!isBlockActivated"
								/>
							</template>

							<template #[blockLayoutSlotNames.STATUS]>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`
	};

	// @vue/component
	const DiagramMenu = {
		name: 'DiagramMenu',
		components: {
			MenuButton
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle
			};
		},
		methods: {
			loc(locString) {
				return this.$bitrix.Loc.getMessage(locString);
			},
			openStorageList() {
				main_core.Runtime.loadExtension('bizproc.router').then(({
					Router
				}) => {
					Router.openStorageList();
				}).catch(e => console.error(e));
			},
			getDiagramMenu() {
				return {
					items: [{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_STORAGE_LIST'),
						icon: ui_iconSet_api_core.Outline.DATABASE,
						onClick: () => this.openStorageList()
					}, {
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_MARKET'),
						icon: ui_iconSet_api_core.Outline.MARKET,
						design: 'disabled',
						disabled: true,
						badgeText: 'Скоро'
						// uiButtonOptions: {
						// 	disabled: true,
						// },
					}
					// {
					// 	title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_IMPORT_EXPORT'),
					// 	icon: Main.EXPAND,
					// 	onClick: () => alert(this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_ACTION_IMPORT_EXPORT')),
					// },
					]
				};
			}
		},
		template: `
		<MenuButton
			:buttonStyle="AirButtonStyle.OUTLINE_ACCENT_2"
			:text="loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_MENU_BUTTON')"
			:options="getDiagramMenu()"
		/>
	`
	};

	// @vue/component
	const AutosaveStatus = {
		name: 'AutosaveStatus',
		components: {
			AutosaveStatusEntity: AutosaveStatus$1
		},
		computed: {
			...ui_vue3_pinia.mapState(diagramStore, ['isOnline'])
		},
		template: `
		<AutosaveStatusEntity :isOnline="isOnline"/>
	`
	};

	// @vue/component
	const EditTemplateSettingsDialog = {
		name: 'EditTemplateSettingsDialog',
		emits: ['close'],
		computed: {
			...ui_vue3_pinia.mapWritableState(diagramStore, ['template'])
		},
		beforeMount() {
			this.localName = this.template?.NAME ?? '';
			this.localDescription = this.template?.DESCRIPTION ?? '';
		},
		mounted() {
			this.getDialog().setContent(this.$refs.content);
			this.getDialog().show();
		},
		unmounted() {
			this.instance?.hide();
		},
		methods: {
			...ui_vue3_pinia.mapActions(diagramStore, ['updateTemplateData']),
			loc(locString) {
				return this.$bitrix.Loc.getMessage(locString);
			},
			getDialog() {
				if (!this.instance) {
					this.instance = this.createDialog();
				}
				return this.instance;
			},
			createDialog() {
				const confirm = new ui_buttons.Button({
					text: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_BUTTON_SAVE'),
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED
				});
				const cancel = new ui_buttons.Button({
					text: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_BUTTON_CANCEL'),
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.OUTLINE
				});
				const options = {
					title: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_TITLE'),
					subtitle: this.loc('BIZPROCDESIGNER_EDITOR_SETTINGS_DESCRIPTION'),
					centerButtons: [confirm, cancel],
					events: {
						onHide: this.closePopup
					},
					width: 495
				};
				const dialog = new ui_system_dialog.Dialog(options);
				cancel.bindEvent('click', () => {
					dialog.hide();
				});
				confirm.bindEvent('click', () => {
					this.template.NAME = main_core.Type.isStringFilled(this.localName) ? this.localName : this.loc('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE');
					this.template.DESCRIPTION = this.localDescription;
					this.updateTemplateData({
						NAME: this.template.NAME,
						DESCRIPTION: this.template.DESCRIPTION
					});
					dialog.hide();
				});
				return dialog;
			},
			closePopup() {
				this.$emit('close');
			}
		},
		template: `
		<div ref="content">
			<div class="bizproc-template-settings-lable">
				{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_SETTINGS_LABEL') }}
			</div>
			<div class="bizproc-template-settings-title">
				<div class="ui-ctl ui-ctl-textbox">
					<input
						v-model="localName"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE')"
						class="ui-ctl-element"
					>
				</div>
			</div>
			<div class="bizproc-template-settings-description">
				<div class="ui-ctl ui-ctl-textarea">
					<textarea
						v-model="localDescription"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DESCRIPTION_PLACEHOLDER')"
						class="ui-ctl-element"
					/>
				</div>
			</div>
		</div>
	`
	};

	const SECTION_CODE = 'space';

	// @vue/component
	const TemplateName = {
		name: 'TemplateName',
		components: {
			EditTemplateName,
			EditTemplateSettingsDialog
		},
		data() {
			return {
				isPopupShown: false
			};
		},
		methods: {
			loc(locString) {
				return this.$bitrix.Loc.getMessage(locString);
			},
			getMenuItems() {
				return {
					sections: [{
						code: SECTION_CODE
					}],
					items: [{
						title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_SETTINGS'),
						icon: ui_iconSet_api_core.Outline.SETTINGS,
						onClick: this.onOpenSettingsPopup
					}
					// {
					// 	title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_OPEN'),
					// 	icon: Outline.BULLETED_LIST,
					// 	sectionCode: SECTION_CODE,
					// 	onClick: () => alert(this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_OPEN')),
					// },
					// {
					// 	title: this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_CREATE'),
					// 	icon: Outline.PLUS_M,
					// 	sectionCode: SECTION_CODE,
					// 	onClick: () => alert(this.loc('BIZPROCDESIGNER_EDITOR_TOP_PANEL_TITLE_ACTION_CREATE')),
					// },
					]
				};
			},
			onOpenSettingsPopup() {
				this.isPopupShown = true;
			},
			onCloseSettingsPopup() {
				this.isPopupShown = false;
			}
		},
		template: `
		<EditTemplateName :dropdownOptions="getMenuItems()"/>
		<EditTemplateSettingsDialog
			v-if="isPopupShown"
			@close="onCloseSettingsPopup"
		/>
	`
	};

	// @vue/component
	const PublishDropdownButton = {
		name: 'PublishDropdownButton',
		components: {
			PublishDropdownButtonFeature: PublishDropdownButton$1,
			PublishMainDropdownOption,
			PublishUserDropdownOption,
			PublishFullDropdownOption
		},
		template: `
		<PublishDropdownButtonFeature>
			<PublishMainDropdownOption/>
			<PublishUserDropdownOption/>
			<PublishFullDropdownOption/>
		</PublishDropdownButtonFeature>
	`
	};

	// @vue/component
	const ToastErrorBlockNavigationButton = {
		name: 'ToastErrorBlockNavigationButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			const highlightedBlocks = ui_blockDiagram.useHighlightedBlocks();
			const {
				goToBlockById
			} = ui_blockDiagram.useCanvas();
			const {
				getMessage
			} = useLoc();
			return {
				goToBlockById,
				highlightedBlocks,
				getMessage
			};
		},
		data() {
			return {
				currentIdx: 0
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(diagramStore, ['blockCurrentPublishErrors']),
			blockId() {
				return Object.keys(this.blockCurrentPublishErrors)[this.currentIdx] ?? null;
			},
			hasPublishErrors() {
				return this.errorBlocksCount > 0;
			},
			errorBlocksCount() {
				return Object.keys(this.blockCurrentPublishErrors).length;
			},
			currentStateTitle() {
				return `${this.currentIdx + 1} / ${this.errorBlocksCount}`;
			},
			isPrevAvailable() {
				return this.currentIdx > 0;
			},
			isNextAvailable() {
				return this.currentIdx + 1 < this.errorBlocksCount;
			},
			Outline: () => ui_iconSet_api_core.Outline
		},
		watch: {
			currentIdx(newIdx) {
				if (!this.blockId) {
					return;
				}
				this.tryGoToBlockById(this.blockId);
			},
			errorBlocksCount(count) {
				this.currentIdx = Math.min(count - 1, this.currentIdx);
			}
		},
		methods: {
			onPrev() {
				this.currentIdx = Math.max(this.currentIdx - 1, 0);
			},
			onNext() {
				this.currentIdx = Math.min(this.currentIdx + 1, Math.max(this.errorBlocksCount - 1, 0));
			},
			onCurrent() {
				this.tryGoToBlockById(this.blockId);
			},
			tryGoToBlockById(blockId) {
				if (!blockId) {
					return;
				}
				this.highlightedBlocks.clear();
				this.highlightedBlocks.add(blockId);
				this.goToBlockById(blockId);
			}
		},
		template: `
		<div v-if="hasPublishErrors"
			 class="editor-chart-toast-block-navigation-button"
			 @click="onCurrent"
		>
			<div class="editor-chart-toast-block-navigation-button__title">
				{{ $Bitrix.Loc.getMessage('BIZPROC_DESIGNER_TOAST_ERROR_BLOCK_NAVIGATION_BUTTON_TEXT') }}
			</div>

			<div class="editor-chart-toast-block-navigation-button__controls">
				<button 
					class="editor-chart-toast-block-navigation-button__controls__button"
					:class="{ '--disabled': !isPrevAvailable }"
				>
					<BIcon
						:name="Outline.CHEVRON_LEFT_L"
						:size="18"
						@click.stop="onPrev"
					/>
				</button>
				<div class="editor-chart-toast-block-navigation-button__controls__state-title">
					{{ currentStateTitle }}
				</div>
				<button 
					class="editor-chart-toast-block-navigation-button__controls__button"
					:class="{ '--disabled': !isNextAvailable }"
				>
					<BIcon
						 :name="Outline.CHEVRON_RIGHT_L"
						 :size="18"
						 @click.stop="onNext"
					/>
				</button>
			</div>
		</div>
	`
	};

	// @vue/components
	const CommonNodeSettings = {
		name: 'CommonNodeSettings',
		components: {
			CommonNodeSettingsForm,
			BlockIcon
		},
		computed: {
			...ui_vue3_pinia.mapState(useCommonNodeSettingsStore, ['isVisible', 'block']),
			...ui_vue3_pinia.mapState(diagramStore, ['documentType']),
			...ui_vue3_pinia.mapState(useAppStore, ['isShownRightPanel'])
		},
		methods: {
			...ui_vue3_pinia.mapActions(useAppStore, ['hideRightPanel', 'setShowPreviewPanel']),
			...ui_vue3_pinia.mapActions(useCommonNodeSettingsStore, ['hideSettings']),
			onCloseSettings() {
				this.hideSettings();
				this.hideRightPanel();
			}
		},
		template: `
		<CommonNodeSettingsForm
			v-if="isVisible"
			:block="block"
			:documentType="documentType"
			:panelAlreadyOpened="isShownRightPanel"
			@close="onCloseSettings"
			@showPreview="setShowPreviewPanel"
		>
			<template #header-icon>
				<BlockIcon
					:iconName="block?.node?.icon"
					:iconColorIndex="block?.node?.colorIndex"
				/>
			</template>
		</CommonNodeSettingsForm>
	`
	};

	// @vue/component
	const FixedCatalogBurgerBtn = {
		name: 'fixed-catalog-burger-btn',
		components: {
			BurgerBtn
		},
		setup() {
			const catalogStore = useCatalogStore();
			const {
				isFixedCatalog
			} = ui_vue3_pinia.storeToRefs(catalogStore);
			return {
				isFixedCatalog,
				toggleFixedCatalog: catalogStore.toggleFixedCatalog
			};
		},
		template: `
		<BurgerBtn
			:opened="isFixedCatalog"
			@click="toggleFixedCatalog"
		/>
	`
	};

	// @vue/component
	const HoverCatalogLayout = {
		name: 'HoverCatalogLayout',
		components: {
			CatalogLayout
		},
		setup() {
			const catalogStore = useCatalogStore();
			const {
				isExpandedCatalog,
				isShowSearchResults
			} = ui_vue3_pinia.storeToRefs(catalogStore);
			const {
				isSelectionActive
			} = ui_blockDiagram.useBlockDiagram();
			function onMouseOver() {
				if (ui_vue3.toValue(isSelectionActive)) {
					return;
				}
				catalogStore.expandCatalog();
			}
			function onMouseLeave() {
				catalogStore.collapseCatalog();
			}
			return {
				isExpandedCatalog,
				isShowSearchResults,
				onMouseOver,
				onMouseLeave
			};
		},
		template: `
		<CatalogLayout
			:hasSearchResults="isShowSearchResults"
			:expanded="isExpandedCatalog"
			@mouseover="onMouseOver"
			@mouseleave="onMouseLeave"
		>
			<template #header>
				<slot name="header"/>
			</template>

			<template #search>
				<slot name="search"/>
			</template>

			<template #content>
				<slot name="content"/>
			</template>

			<template #search-results>
				<slot name="search-results"/>
			</template>

			<template #footer>
				<slot name="footer"/>
			</template>
		</CatalogLayout>
	`
	};

	// @vue/component
	const SearchCatalogItemsInput = {
		name: 'SearchCatalogItemsInput',
		components: {
			TextInput,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		data() {
			return {
				isFocused: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(useCatalogStore, ['searchText', 'canSearch']),
			iconColor() {
				return this.isFocused || this.searchText.length > 0 ? 'var(--ui-color-accent-main-primary)' : 'var(--ui-color-gray-50)';
			},
			showClearButton() {
				return this.isFocused || this.searchText.length > 0;
			}
		},
		watch: {
			canSearch(value) {
				if (!value) {
					this.hideFoundedGroupItems();
					this.resetCurrentGroup();
				}
			}
		},
		setup(props) {
			return {
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		methods: {
			...ui_vue3_pinia.mapActions(useCatalogStore, ['hideFoundedGroupItems', 'resetCurrentGroup']),
			onInputSearchText(input) {
				this.searchText = input;
			},
			onClear() {
				this.searchText = '';
			},
			onFocus() {
				this.isFocused = true;
			},
			onBlur() {
				this.isFocused = false;
			}
		},
		template: `
		<BIcon
			:name="iconSet.SEARCH"
			:size="24"
			:color="iconColor"
			class="ui-node-catalog-icon"
		/>
		<TextInput
			:modelValue="searchText"
			@update:modelValue="onInputSearchText"
			@focus="onFocus"
			@blur="onBlur"
		/>
		<button
			v-if="showClearButton"
			class="editor-chart-catalog-input__clear-btn"
			@click="onClear"
		>
			<BIcon
				:name="iconSet.CROSS_L"
				:size="24"
				class="ui-block-diagram-search-input__clear-btn-icon"
			/>
		</button>
	`
	};

	// @vue/component
	const ChangeCatalogGroup = {
		name: 'ChangeCatalogGroup',
		components: {
			CatalogGroup
		},
		props: {
			/** @type CatalogMenuGroup */
			group: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			const catalogStore = useCatalogStore();
			const {
				currentGroup
			} = ui_vue3_pinia.storeToRefs(catalogStore);
			const isShowItems = ui_vue3.computed(() => {
				return props.group.id === currentGroup?.value?.id;
			});
			return {
				isShowItems,
				onChangeGroup: catalogStore.changeCurrentGroup
			};
		},
		template: `
		<CatalogGroup
			:group="group"
			:showItems="isShowItems"
			@changeGroup="onChangeGroup"
		>
			<template #icon>
				<slot name="icon"/>
			</template>

			<template #back>
				<slot name="back"/>
			</template>

			<template #items>
				<slot name="items"/>
			</template>

			<template #empty-label>
				<slot name="empty-label"/>
			</template>
		</CatalogGroup>
	`
	};

	// @vue/component
	const BackToGroupsBtn = {
		name: 'back-to-groups-btn',
		components: {
			CatalogGroupBackBtn
		},
		props: {
			groupTitle: {
				type: String,
				default: ''
			},
			collapsed: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			const catalogStore = useCatalogStore();
			function onResetCurrentGroup() {
				catalogStore.resetCurrentGroup();
				catalogStore.resetHighlightedItem();
				catalogStore.hideFoundedGroupItems();
			}
			return {
				onResetCurrentGroup
			};
		},
		template: `
		<CatalogGroupBackBtn
			:groupTitle="groupTitle"
			:collapsed="collapsed"
			@click="onResetCurrentGroup"
		>
			<template #icon>
				<slot name="icon"/>
			</template>
		</CatalogGroupBackBtn>
	`
	};

	// @vue/component
	const ChangeFoundedCatalogItem = {
		name: 'ChangeFoundedCatalogItem',
		components: {
			CatalogItem
		},
		props: {
			/** @type CatalogMenuItem */
			item: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				getDragItemSlotName
			};
		},
		methods: {
			...ui_vue3_pinia.mapActions(useCatalogStore, ['changeCurrentGroup', 'showFoundedGroupItems', 'setHighlightedItem']),
			onChangeItem() {
				this.changeCurrentGroup(this.item.parentGroup);
				this.showFoundedGroupItems();
				this.setHighlightedItem(this.item.id);
			}
		},
		template: `
		<CatalogItem
			:item="item"
			@dblclick="onChangeItem"
		>
			<template #[getDragItemSlotName(item.type)]="{ item }">
				<slot
					:name="getDragItemSlotName(item.type)"
					:item="item"
				/>
			</template>
		</CatalogItem>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const ChangeFoundedCatalogGroup = {
		name: 'ChangeFoundedCatalogGroup',
		components: {
			CatalogGroup
		},
		props: {
			/** @type CatalogMenuGroup */
			group: {
				type: Object,
				required: true
			}
		},
		computed: {
			...ui_vue3_pinia.mapGetters(useCatalogStore, ['searchResults'])
		},
		methods: {
			...ui_vue3_pinia.mapActions(useCatalogStore, ['showFoundedGroupItems', 'changeCurrentGroup', 'setHighlightedItem']),
			onChangeGroup() {
				this.showFoundedGroupItems();
				this.changeCurrentGroup(this.group);
				this.setHighlightedItem(this.searchResults.items.map(item => item.id));
			}
		},
		template: `
		<CatalogGroup
			:group="group"
			:showItems="false"
			@changeGroup="onChangeGroup"
		>
			<template #icon>
				<slot name="icon"/>
			</template>
		</CatalogGroup>
	`
	};

	// @vue/component
	const Catalog = {
		name: 'CatalogWidget',
		components: {
			HoverCatalogLayout,
			HeaderLogo,
			HeaderLayout,
			CatalogGroupList,
			CatalogGroup,
			CatalogGroupEmptyLabel,
			CatalogGroupIcon,
			CatalogItem,
			SearchResultsLayout,
			SearchResultsLabel,
			SearchResultsEmptyLabel,
			FixedCatalogBurgerBtn,
			SearchCatalogItemsInput,
			ChangeCatalogGroup,
			ChangeFoundedCatalogGroup,
			ChangeFoundedCatalogItem,
			BackToGroupsBtn
		},
		setup() {
			const catalogStore = useCatalogStore();
			const {
				isExpandedCatalog,
				groups,
				currentGroup,
				currentItem,
				searchResultsCount,
				searchResults,
				highlightedItems
			} = ui_vue3_pinia.storeToRefs(catalogStore);
			return {
				isExpandedCatalog,
				searchResultsCount,
				searchResults,
				currentGroup,
				currentItem,
				groups,
				highlightedItems,
				getDragItemSlotName
			};
		},
		template: `
		<HoverCatalogLayout>
			<template #header>
				<HeaderLayout :expanded="isExpandedCatalog">
					<template #switcher>
						<FixedCatalogBurgerBtn/>
					</template>
					<template #logo>
						<HeaderLogo/>
					</template>
				</HeaderLayout>
			</template>

			<template #search>
				<SearchCatalogItemsInput/>
			</template>

			<template #content>
				<CatalogGroupList
					:groups="groups"
					:currentGroup="currentGroup"
				>
					<template #group="{ group }">
						<ChangeCatalogGroup :group="group">
							<template #icon>
								<CatalogGroupIcon :iconName="group.icon"/>
							</template>

							<template #back>
								<BackToGroupsBtn
									:groupTitle="group.title"
									:collapsed="!isExpandedCatalog"
								>
									<template #icon>
										<CatalogGroupIcon :iconName="group.icon"/>
									</template>
								</BackToGroupsBtn>
							</template>

							<template #items>
								<CatalogItem
									v-for="item in group.items"
									:key="item.id"
									:item="item"
									:active="highlightedItems.has(item.id) && isExpandedCatalog"
								>
									<template #[getDragItemSlotName(item.type)]="{ item }">
										<slot
											:name="getDragItemSlotName(item.type)"
											:item="item"
										/>
									</template>
								</CatalogItem>
							</template>

							<template #empty-label>
								<CatalogGroupEmptyLabel/>
							</template>
						</ChangeCatalogGroup>
					</template>
				</CatalogGroupList>
			</template>

			<template #search-results>
				<SearchResultsLayout
					:groups="searchResults.groups"
					:items="searchResults.items"
					:collapsed="!isExpandedCatalog"
				>

					<template #group="{ group }">
						<ChangeFoundedCatalogGroup :group="group">
							<template #icon>
								<CatalogGroupIcon :iconName="group.icon"/>
							</template>
						</ChangeFoundedCatalogGroup>
					</template>

					<template #item="{ item }">
						<ChangeFoundedCatalogItem :item="item">
							<template #[getDragItemSlotName(item.type)]="{ item }">
								<slot
									:name="getDragItemSlotName(item.type)"
									:item="item"
								/>
							</template>
						</ChangeFoundedCatalogItem>
					</template>

					<template #empty-label>
						<SearchResultsEmptyLabel/>
					</template>
				</SearchResultsLayout>
			</template>

			<template #footer>
				<slot name="footer"/>
			</template>
		</HoverCatalogLayout>
	`
	};

	// @vue/component
	const ToastWidget = {
		name: 'ToastWidget',
		computed: {
			...ui_vue3_pinia.mapState(useToastStore, ['current'])
		},
		template: `
		<template v-if="current">
			<slot :name="current.type" :message="current.message">
			</slot>
		</template>
	`
	};

	// @vue/component
	const AppLayout = {
		name: 'AppLayoutWidget',
		components: {
			AppLayoutEntity: AppLayout$1
		},
		computed: {
			...ui_vue3_pinia.mapState(useAppStore, ['isShownRightPanel', 'isShownPreviewPanel', 'isShownDebugBar']),
			...ui_vue3_pinia.mapState(useCatalogStore, ['isExpandedCatalog'])
		},
		template: `
		<AppLayoutEntity
			:showSettings="isShownRightPanel"
			:showPreviewPanel="isShownPreviewPanel"
			:showDebugBar="isShownDebugBar"
			:catalogExpanded="isExpandedCatalog"
		>
			<template #header>
				<slot name="header"/>
			</template>

			<template #diagram>
				<slot name="diagram"/>
			</template>

			<template #catalog>
				<slot name="catalog"/>
			</template>

			<template #top-right-toolbar>
				<slot name="top-right-toolbar"/>
			</template>

			<template #bottom-right-toolbar>
				<slot name="bottom-right-toolbar"/>
			</template>

			<template #debug-bar-toolbar>
				<slot name="debug-bar-toolbar"/>
			</template>

			<template #top-middle-anchor>
				<slot name="top-middle-anchor"/>
			</template>

			<template #settings>
				<slot name="settings"/>
			</template>
		</AppLayoutEntity>
	`
	};

	// @vue/component
	const AppHeader = {
		name: 'AppHeader',
		components: {
			AppHeaderEntity: AppHeader$1,
			AppHeaderDivider,
			LogoLayout,
			LogoBackBtn,
			LogoTitle
		},
		setup() {
			const diagramStore$1 = diagramStore();
			const {
				companyName
			} = ui_vue3_pinia.storeToRefs(diagramStore$1);
			return {
				companyName
			};
		},
		template: `
		<AppHeaderEntity>
			<template #left>
				<LogoLayout>
					<template #back-btn>
						<LogoBackBtn/>
					</template>

					<template #title>
						<LogoTitle :companyName="companyName"/>
					</template>
				</LogoLayout>
			</template>

			<template #right>
				<slot name="templateName"/>
				<AppHeaderDivider/>
				<slot name="autosaveStatus"/>
				<AppHeaderDivider/>
				<slot name="diagramMenu"/>
				<slot name="publishButton"/>
			</template>
		</AppHeaderEntity>
	`
	};

	// @vue/component
	const Chart = {
		components: {
			AppLayout,
			AppHeader,
			BlockDiagram,
			BlockSimple,
			BlockTrigger,
			BlockComplex,
			BlockTool,
			BlockFrame,
			BlockOperator,
			BlockService,
			DiagramMenu,
			AutosaveStatus,
			TemplateName,
			PublishDropdownButton,
			ZoomBar: ui_blockDiagram.ZoomBar,
			DebugButton,
			DebugBar,
			ComplexNodeSettings: NodeSettings,
			NodeSettingsRules,
			NodeSettingsRelations,
			HistoryBar: ui_blockDiagram.HistoryBar,
			SearchBar,
			Catalog,
			CommonNodeSettings,
			ConnectionAux,
			ToastWidget,
			ToastWarning,
			ToastErrorBlockNavigationButton
		},
		provide() {
			return {
				onBlockClick: this.handleBlockClick,
				showBlockSettings: this.showBlockSettings,
				onToggleBlockActivation: this.handleToggleBlockActivation
			};
		},
		props: {
			initTemplateId: {
				type: Number,
				default: 0
			},
			initDocumentType: {
				type: Array,
				// todo: add type
				default: null
			},
			initStartTrigger: {
				type: String,
				default: null
			},
			initEditBlock: {
				type: String,
				default: null
			}
		},
		setup(props) {
			const catalogStore = useCatalogStore();
			diagramStore().initEventListeners();
			const {
				makeSnapshot,
				setHandlers,
				commonSnapshotHandler,
				commonRevertHandler
			} = ui_blockDiagram.useHistory();
			const isDiagramDisabled = ui_vue3.ref(true);
			const snapshotHandler = newState => {
				return {
					...commonSnapshotHandler(newState),
					blockCurrentTimestamps: ui_vue3.markRaw(JSON.parse(JSON.stringify(diagramStore().blockCurrentTimestamps))),
					connectionCurrentTimestamps: ui_vue3.markRaw(JSON.parse(JSON.stringify(diagramStore().connectionCurrentTimestamps)))
				};
			};
			const revertHandler = snapshot => {
				commonRevertHandler(snapshot);
				diagramStore().setBlockCurrentTimestamps(snapshot.blockCurrentTimestamps);
				diagramStore().setConnectionCurrentTimestamps(snapshot.connectionCurrentTimestamps);
			};
			setHandlers({
				snapshotHandler,
				revertHandler
			});
			const animationQueue = ui_blockDiagram.useAnimationQueue();
			async function initApp() {
				try {
					await Promise.all([diagramStore().refreshDiagramData({
						templateId: props.initTemplateId,
						documentType: props.initDocumentType,
						startTrigger: props.initStartTrigger,
						editBlock: props.initEditBlock
					}), catalogStore.init()]);
					initAiUpdatePull(({
						blocks,
						connections,
						draftId,
						templateId
					}) => {
						if (diagramStore().draftId === 0 && diagramStore().templateId === 0) {
							return;
						}
						if (draftId !== diagramStore().draftId || templateId !== diagramStore().templateId) {
							return;
						}
						diagramStore().updateExistedBlockProperties(blocks);
						const animatedItems = makeAnimationQueue(diagramStore().blocks, diagramStore().connections, blocks, connections);
						animationQueue.start({
							items: animatedItems
						});
					});
				} catch (error) {
					handleResponseError(error);
				} finally {
					isDiagramDisabled.value = false;
				}
				makeSnapshot();
			}
			initApp();
			return {
				isDiagramDisabled,
				makeSnapshot,
				FeatureCode: bizprocdesigner_feature.FeatureCode,
				blockDiagramSlotNames: BLOCK_SLOT_NAMES,
				connectionSlotNames: CONNECTION_SLOT_NAMES,
				dragItemSlotNames: DRAG_ITEM_SLOT_NAMES,
				toast: {
					blockToastTypes: BLOCK_TOAST_TYPES,
					sharedTypes: SHARED_TOAST_TYPES
				},
				blockColors: ICON_BG_COLORS
			};
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(diagramStore, ['documentTypeSigned', 'templateId']),
			isDebugBarAvailable() {
				const {
					isFeatureAvailable
				} = useFeature();
				return isFeatureAvailable('debugBar');
			}
		},
		watch: {
			templateId(value) {
				if (value > 0) {
					updateIdUrl(value);
				}
			}
		},
		methods: {
			handleToggleBlockActivation(blockId) {
				diagramStore().toggleBlockActivation(blockId);
			}
		},
		template: `
		<AppLayout>
			<template #header>
				<AppHeader>
					<template #templateName>
						<TemplateName/>
					</template>

					<template #autosaveStatus>
						<AutosaveStatus/>
					</template>

					<template #diagramMenu>
						<DiagramMenu/>
					</template>

					<template #publishButton>
						<PublishDropdownButton/>
					</template>
				</AppHeader>
			</template>

			<template #diagram>
				<BlockDiagram :disabled="isDiagramDisabled" :enableGrouping="true">
					<template #[blockDiagramSlotNames.SIMPLE]="{ block }">
						<BlockSimple :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.TRIGGER]="{ block }">
						<BlockTrigger :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.COMPLEX]="{ block }">
						<BlockComplex :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.TOOL]="{ block }">
						<BlockTool :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.FRAME]="{ block }">
						<BlockFrame :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.OPERATORS]="{ block }">
						<BlockOperator :block="block"/>
					</template>

					<template #[blockDiagramSlotNames.SERVICES]="{ block }">
						<BlockService :block="block"/>
					</template>

					<template #[connectionSlotNames.AUX]="{ connection }">
						<ConnectionAux :connection="connection" />
					</template>
				</BlockDiagram>
			</template>

			<template #catalog>
				<Catalog>
					<template #[dragItemSlotNames.simple]="{ item }">
						<BlockSimple :block="item"/>
					</template>

					<template #[dragItemSlotNames.trigger]="{ item }">
						<BlockTrigger :block="item"/>
					</template>

					<template #[dragItemSlotNames.complex]="{ item }">
						<BlockComplex :block="item"/>
					</template>

					<template #[dragItemSlotNames.tool]="{ item }">
						<BlockTool :block="item"/>
					</template>

					<template #[dragItemSlotNames.frame]="{ item }">
						<BlockFrame :block="item"/>
					</template>

					<template #[dragItemSlotNames.operators]="{ item }">
						<BlockOperator :block="item"/>
					</template>

					<template #[dragItemSlotNames.services]="{ item }">
						<BlockService :block="item"/>
					</template>
				</Catalog>
			</template>

			<template #top-right-toolbar>
				<HistoryBar/>
				<SearchBar/>
			</template>

			<template #bottom-right-toolbar>
				<DebugButton v-if="isDebugBarAvailable"/>
				<ZoomBar
					:stepZoom="0.2"
					:blockColors="blockColors"
				/>
			</template>

			<template #debug-bar-toolbar>
				<DebugBar v-if="isDebugBarAvailable" />
			</template>

			<template #top-middle-anchor>
				<ToastWidget>

					<template #[toast.sharedTypes.WARNING]="{ message }">
						<ToastWarning
							:message="message"
							:closeable="true"
						/>
					</template>

					<template #[toast.blockToastTypes.ACTIVITY_PUBLIC_ERROR]="{ message }">
						<ToastWarning
							:message="message"
							:closeable="true"
						>
							<template #contentEnd>
								<ToastErrorBlockNavigationButton/>
							</template>
						</ToastWarning>
					</template>

				</ToastWidget>
			</template>

			<template #settings>
				<CommonNodeSettings/>

				<ComplexNodeSettings>
					<NodeSettingsRules />
					<NodeSettingsRelations />
				</ComplexNodeSettings>
			</template>
		</AppLayout>
	`
	};

	const TestId = {
		install(app) {
			// eslint-disable-next-line no-param-reassign
			app.config.globalProperties.$testId = (id, ...args) => {
				if (!id) {
					throw new Error('bizprocdesiner: not found test id');
				}
				const preparedArgs = args.reduce((acc, arg) => {
					return `${acc}-${arg}`;
				}, '');
				return `${id}${preparedArgs}`;
			};
		}
	};
	class App {
		static mount(containerId, rootProps) {
			const container = document.getElementById(containerId);
			const app = ui_vue3.BitrixVue.createApp(Chart, rootProps);
			const store = ui_vue3_pinia.createPinia();
			app.use(store);
			app.use(TestId);
			app.provide('debug', false);
			app.mount(container);
		}
	}

	exports.App = App;

})(this.BX.Bizprocdesigner.Editor = this.BX.Bizprocdesigner.Editor || {}, BX.Vue3, BX.Vue3.Pinia, BX.UI, BX.Bizprocdesigner, BX, BX, BX.Vue3.Components, BX.UI.IconSet, BX.Event, BX, BX.UI.IconSet, BX.UI, BX.UI.Vue3.Components, BX.UI, BX.Vue3.Directives, BX.UI.System.Typography.Vue, BX.Main, BX.UI.Vue3.Components, BX.UI.EntitySelector, BX, BX.UI.Dialogs, BX.UI.Feedback, BX.UI.System);
//# sourceMappingURL=chart.bundle.js.map
