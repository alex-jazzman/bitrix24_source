/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {};
(function (exports, ui_vue3, ui_vue3_pinia, ui_blockDiagram, ui_designTokens, ui_iconSet_outline, bizprocdesigner_feature, pull_client, main_core, main_core_events, ui_notification, ui_system_skeleton_vue, ui_system_typography_vue, ui_vue3_components_button, ui_iconSet_api_core, ui_iconSet_api_vue, ui_loader, ui_vue3_components_menu, ui_buttons, ui_vue3_directives_hint, ui_feedback_form, main_popup, ui_dialogs_messagebox, window$1, ui_entitySelector, ui_system_dialog, ui_system_chip_vue, ui_system_input, ui_system_menu_vue, ui_vue3_components_popup, bizproc_automation) {
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

	const useNodeDataInspectorStore = ui_vue3_pinia.defineStore('bizprocdesigner-node-data-inspector-store', {
		state: () => ({
			block: null,
			countRowsOnPage: 10,
			currentPageNumber: 1,
			selectedGridViewGroup: null,
			activityData: null
		}),
		actions: {
			setBlock(block) {
				this.block = block;
				this.activityData = null;
			},
			setActivityData(activityData) {
				this.activityData = activityData;
			},
			setCountRowsOnPage(count) {
				this.countRowsOnPage = count;
			},
			setCurrentPageNumber(pageNumber) {
				this.currentPageNumber = pageNumber;
			},
			resetPagination() {
				this.countRowsOnPage = 10;
				this.currentPageNumber = 1;
			},
			resetGridView() {
				this.selectedGridViewGroup = null;
				this.resetPagination();
			},
			selectGridViewGroup(group) {
				this.selectedGridViewGroup = group;
				this.resetPagination();
			},
			resetDataInspector() {
				this.block = null;
				this.activityData = null;
				this.resetGridView();
			}
		}
	});

	const useAppStore = ui_vue3_pinia.defineStore('bizprocdesigner-app-store', {
		state: () => ({
			isShownRightPanel: false,
			isShownPreviewPanel: false,
			isShownDebugBar: false,
			isDataInspectorPanelShown: true
		}),
		actions: {
			showRightPanel() {
				this.isShownRightPanel = true;
			},
			hideRightPanel() {
				this.isDataInspectorPanelShown = false;
				this.isShownRightPanel = false;
				this.isShownPreviewPanel = false;
				useNodeDataInspectorStore().resetDataInspector();
			},
			setShowPreviewPanel(isShow) {
				this.isShownPreviewPanel = isShow;
			},
			showPreviewPanel() {
				this.isShownPreviewPanel = true;
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
			toggleDataInspectorPanel() {
				this.isDataInspectorPanelShown = !this.isDataInspectorPanelShown;
			},
			setDebugEnabled(value) {
				this.isShownDebugBar = value;
			}
		}
	});

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

	const BIZPROC_DOCUMENT_ENTITY_ID = 'bizproc-document';
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
		getNodeFilterMetadata: data => {
			return post$2('Activity.getNodeFilterMetadata', data);
		},
		saveNodeSettings: data => {
			return post$2('Activity.SaveSettings', data);
		},
		fetchDocumentFields: async documentType => {
			const key = Array.isArray(documentType) ? documentType.join(':') : String(documentType);
			const response = await main_core.ajax.runAction('ui.entityselector.getChildren', {
				json: {
					parentItem: {
						id: `document-fields-${key}`,
						entityId: BIZPROC_DOCUMENT_ENTITY_ID,
						entityType: 'document',
						customData: {
							document: documentType,
							idTemplate: '#FIELD#'
						}
					},
					dialog: {
						entities: [{
							id: BIZPROC_DOCUMENT_ENTITY_ID,
							dynamicLoad: true
						}]
					}
				}
			});
			return response?.data?.dialog?.items ?? [];
		}
	};

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
	const TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE = Object.freeze({
		CONSTANT: 'template_constant',
		VARIABLE: 'template_variable'
	});
	const TEMPLATE_DEFAULT_DATA_TYPE = 'string';
	const COMPUTE_VALUE_PREFIXES = Object.freeze({
		CONSTANT: 'Constant',
		VARIABLE: 'Variable'
	});
	const NODE_SETTINGS_TABS = Object.freeze({
		basic: 'basic',
		rules: 'rules'
	});

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

	const cache = new main_core.Cache.MemoryCache();
	const pendingRequests = new main_core.Cache.MemoryCache();
	function getKey(documentType) {
		if (main_core.Type.isArray(documentType)) {
			return documentType.join(':');
		}
		return String(documentType);
	}
	function mapItemToField(item) {
		const fieldKey = item.customData?.fieldKey ?? '';
		if (!fieldKey) {
			return null;
		}
		const fieldInfo = item.customData?.field ?? {};
		return {
			fieldKey,
			name: item.title ?? fieldKey,
			type: fieldInfo.type ?? 'string',
			multiple: fieldInfo.multiple ?? false,
			required: fieldInfo.required ?? false,
			options: fieldInfo.options ?? {},
			property: item.customData?.property ?? {}
		};
	}
	function handleFetchSuccess(key, items) {
		const fields = items.reduce((acc, element) => {
			const field = mapItemToField(element);
			if (field) {
				acc.push(field);
			}
			return acc;
		}, []);
		if (fields.length > 0) {
			cache.set(key, fields);
		}
		pendingRequests.delete(key);
		return fields;
	}
	function handleFetchError(key, error) {
		console.error('documentFieldsCache: failed to fetch document fields', error);
		pendingRequests.delete(key);
		return [];
	}
	const documentFieldsCache = {
		has(documentType) {
			return cache.has(getKey(documentType));
		},
		get(documentType) {
			return cache.get(getKey(documentType), null);
		},
		set(documentType, fields) {
			cache.set(getKey(documentType), fields);
		},
		async fetchFields(documentType) {
			const key = getKey(documentType);
			if (cache.has(key)) {
				return cache.get(key);
			}
			return pendingRequests.remember(key, async () => {
				try {
					const items = await editorAPI.fetchDocumentFields(documentType);
					return handleFetchSuccess(key, items);
				} catch (error) {
					return handleFetchError(key, error);
				}
			});
		}
	};

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
	function getBackgroundImage(url) {
		const safeUrl = getSafeUrl(url);
		if (!safeUrl) {
			return {};
		}
		return {
			'background-image': `url('${safeUrl}')`
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

	const ANIMATED_ACTIVITY_TYPES = new Set(['CreateStorageNode', 'WriteDataStorageActivity', 'ReadDataStorageActivity', 'DeleteDataStorageActivity', 'SetupTemplateActivity', 'CrmDealComplexActivity', 'TasksComplexActivity', 'CrmDynamicComplexActivity', 'AiAssistantAgentComplexActivity']);
	function shouldAnimateBlock(block) {
		const activityType = block?.activity?.Type;
		return main_core.Type.isString(activityType) && ANIMATED_ACTIVITY_TYPES.has(activityType);
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
				const ancestors = new Map([[block.id, {
					block,
					connections: {}
				}]]);
				let inputs = this.getInputConnections(block);
				if (targetPortId) {
					inputs = inputs.filter(connection => connection.targetPortId === targetPortId);
				}
				stack.push(...inputs);
				while (stack.length > 0) {
					const connection = stack.shift();
					this.blocks.filter(b => b.id === connection.sourceBlockId).forEach(b => {
						if (!ancestors.has(b.id)) {
							ancestors.set(b.id, {
								block: b,
								connections: {}
							});
							stack.push(...this.getInputConnections(b));
						}
						const currentAncestor = ancestors.get(b.id);
						if (inputs.includes(connection)) {
							const {
								sourcePortId,
								targetPortId: targetId
							} = connection;
							currentAncestor.connections[sourcePortId] = [...(currentAncestor.connections[sourcePortId] ?? []), targetId];
							return;
						}
						const prevAncestor = ancestors.get(connection.targetBlockId);
						currentAncestor.connections[connection.sourcePortId] = [...(currentAncestor.connections[connection.sourcePortId] ?? []), ...Object.values(prevAncestor.connections).flat()];
					});
				}
				ancestors.delete(block.id);
				return [...ancestors.values()];
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

	const SETTINGS_PANEL_CLASSNAMES = {
		base: 'editor-chart-app-layout__settings',
		withPreviewPanel: '--with-preview-panel'
	};
	const SETTINGS_DATA_INSPECTOR_PANEL_CLASSNAMES = {
		base: 'editor-chart-app-layout__settings-data-inspector'};
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
			isDataInspectorPanelShown: {
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
			settingsDataInspectorClassNames() {
				return {
					[SETTINGS_DATA_INSPECTOR_PANEL_CLASSNAMES.base]: true
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
						:class="settingsClassNames"
					>
						<slot name="settings"/>
					</section>
				</transition>

				<transition-group name="fade-inspector-panel">
					<template v-if="showSettings && isDataInspectorPanelShown">
						<section
							:class="settingsDataInspectorClassNames"
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

	const CATALOG_ITEMS_COUNT = 8;
	// @vue/component
	const AppSkeleton = {
		name: 'AppSkeleton',
		components: {
			BLine: ui_system_skeleton_vue.BLine,
			BCircle: ui_system_skeleton_vue.BCircle,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			TextLg: ui_system_typography_vue.TextLg
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage,
				catalogItems: Array.from({
					length: CATALOG_ITEMS_COUNT
				}, (_, index) => index)
			};
		},
		computed: {
			heroTitle() {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_SKELETON_HERO_TITLE');
			},
			heroDescription() {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_SKELETON_HERO_DESCRIPTION');
			}
		},
		template: `
		<div class="editor-chart-app-skeleton">
			<div class="editor-chart-app-skeleton__header">
				<div class="editor-chart-app-skeleton__header-company">
					<BLine
						:width="24"
						:height="24"
						:radius="4"
					/>
					<div class="editor-chart-app-skeleton__header-company-name">
						<BLine
							:width="117"
							:height="16"
						/>
						<BLine
							class="editor-chart-app-skeleton__placeholder-secondary"
							:width="154"
							:height="16"
						/>
					</div>
				</div>

				<div class="editor-chart-app-skeleton__header-title">
					<BLine
						:width="176"
						:height="16"
					/>
					<BLine
						:width="121"
						:height="16"
					/>
				</div>

				<div class="editor-chart-app-skeleton__header-actions">
					<span class="editor-chart-app-skeleton__divider"></span>
					<div class="editor-chart-app-skeleton__header-status">
						<BCircle
							class="editor-chart-app-skeleton__placeholder-secondary"
							:size="16"
						/>
						<BLine
							class="editor-chart-app-skeleton__placeholder-secondary"
							:width="80"
							:height="10"
						/>
					</div>
					<span class="editor-chart-app-skeleton__divider"></span>
					<BLine
						class="editor-chart-app-skeleton__placeholder-secondary"
						:width="63"
						:height="28"
						:radius="8"
					/>
					<BLine
						:width="160"
						:height="28"
						:radius="8"
					/>
				</div>
			</div>

			<div class="editor-chart-app-skeleton__content">
				<div class="editor-chart-app-skeleton__catalog">
					<div class="editor-chart-app-skeleton__catalog-header">
						<BLine
							:width="24"
							:height="24"
							:radius="4"
						/>
						<BLine
							:width="117"
							:height="16"
						/>
					</div>

					<div class="editor-chart-app-skeleton__catalog-search">
						<BLine
							class="editor-chart-app-skeleton__placeholder-secondary"
							:width="24"
							:height="24"
							:radius="8"
						/>
						<div class="editor-chart-app-skeleton__catalog-search-input"></div>
					</div>

					<div class="editor-chart-app-skeleton__catalog-group">
						<BLine
							:width="24"
							:height="24"
							:radius="8"
						/>
						<BLine
							class="editor-chart-app-skeleton__placeholder-secondary"
							:width="28"
							:height="28"
							:radius="8"
						/>
						<div class="editor-chart-app-skeleton__flex-fill">
							<BLine
								class="editor-chart-app-skeleton__placeholder-secondary"
								:height="16"
							/>
						</div>
					</div>

					<div class="editor-chart-app-skeleton__catalog-list">
						<div
							v-for="item in catalogItems"
							:key="item"
							class="editor-chart-app-skeleton__catalog-item"
						>
							<BLine
								:width="38"
								:height="38"
								:radius="8"
							/>
							<div class="editor-chart-app-skeleton__catalog-item-lines">
								<BLine
									:height="16"
								/>
								<BLine
									class="editor-chart-app-skeleton__placeholder-secondary"
									:height="8"
								/>
								<BLine
									class="editor-chart-app-skeleton__placeholder-secondary"
									:width="161"
									:height="8"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="editor-chart-app-skeleton__top-right">
					<div class="editor-chart-app-skeleton__control">
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
					</div>
					<div class="editor-chart-app-skeleton__control --square">
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
					</div>
				</div>

				<div class="editor-chart-app-skeleton__bottom-right">
					<div class="editor-chart-app-skeleton__control">
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
						<span class="editor-chart-app-skeleton__divider"></span>
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
						<span class="editor-chart-app-skeleton__divider"></span>
						<BLine
							:width="127"
							:height="18"
							:radius="4"
						/>
					</div>
				</div>

				<div class="editor-chart-app-skeleton__hero">
					<div class="editor-chart-app-skeleton__hero-inner">
						<div class="editor-chart-app-skeleton__hero-illustration"></div>
						<div class="editor-chart-app-skeleton__hero-text">
							<HeadlineMd
								align="center"
								:className="'editor-chart-app-skeleton__hero-title'"
							>
								{{ heroTitle }}
							</HeadlineMd>
							<TextLg
								align="center"
								:className="'editor-chart-app-skeleton__hero-description'"
							>
								{{ heroDescription }}
							</TextLg>
						</div>
					</div>
				</div>
			</div>
		</div>
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
	const EditorChartTabs = {
		name: 'EditorChartTabs',
		props: {
			tabs: {
				type: Object,
				required: true
			},
			modelValue: {
				type: String,
				required: true
			}
		},
		emits: ['select', 'update:modelValue'],
		computed: {
			activeTabId: {
				get() {
					return this.modelValue;
				},
				set(tabId) {
					this.$emit('update:modelValue', tabId);
				}
			}
		},
		template: `
		<ul class="editor-chart-tabs">
			<li
				v-for="[id, tab] in tabs"
				class="editor-chart-tabs_tab"
				:class="{ '--selected': activeTabId === tab.id }"
				:id="tab.id"
				:data-test-id="$testId(tab.id)"
				@click="activeTabId = tab.id"
			>
				{{ tab.title }}
			</li>
		</ul>
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

			<div class="editor-chart-block-header__text">
				<p class="editor-chart-block-header__title">{{ title || block.node?.title }}</p>
				<div v-if="$slots.status" class="editor-chart-block-header__status">
					<slot name="status"/>
				</div>
			</div>
		</div>
	`
	};

	var fr$8 = 60;
	var v$8 = "5.9.6";
	var ip$8 = 0;
	var op$8 = 179;
	var w$8 = 32;
	var h$8 = 32;
	var nm$8 = "agent main";
	var ddd$8 = 0;
	var markers$8 = [
	];
	var assets$8 = [
		{
			nm: "[FRAME] agent main - Null / star - Null / Union - Null / Union / Ellipse 10089 - Null / Ellipse 10089",
			fr: 60,
			id: "moljdpc7rkca35w8",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "agent main - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 11,
					hd: false,
					nm: "star - Null",
					sr: 1,
					parent: 10,
					ks: {
						a: {
							a: 0,
							k: [
								6,
								6
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										3,
										2.5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 18.066,
									s: [
										12,
										2.5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 36.024,
									s: [
										21,
										3.5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 54.089999999999996,
									s: [
										26,
										9.5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 72.27,
									s: [
										27,
										16.5
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 90.114,
									s: [
										24.5,
										21.05
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										0.1,
										0.1
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									}
								},
								{
									t: 18.066,
									s: [
										20,
										20
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									}
								},
								{
									t: 36.024,
									s: [
										40,
										40
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									}
								},
								{
									t: 54.089999999999996,
									s: [
										60,
										60
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									}
								},
								{
									t: 72.27,
									s: [
										80,
										80
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									}
								},
								{
									t: 90.114,
									s: [
										100,
										100
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 12,
					hd: false,
					nm: "Union - Null",
					sr: 1,
					parent: 11,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								1.5,
								1.5
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 13,
					hd: false,
					nm: "Union",
					sr: 1,
					parent: 12,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													3.5592,
													0.5992
												],
												[
													5.7246,
													0.7828
												],
												[
													6.1751,
													1.999
												],
												[
													7.1985,
													3.0237
												],
												[
													8.416,
													3.4742
												],
												[
													8.416,
													5.7242
												],
												[
													7.1986,
													6.1747
												],
												[
													6.1752,
													7.1981
												],
												[
													5.7247,
													8.4156
												],
												[
													3.4747,
													8.4156
												],
												[
													3.0242,
													7.1982
												],
												[
													1.9995,
													6.1748
												],
												[
													0.7834,
													5.7243
												],
												[
													0.7834,
													3.4743
												],
												[
													1.9996,
													3.0238
												],
												[
													3.0243,
													1.9991
												],
												[
													3.4748,
													0.783
												],
												[
													3.5592,
													0.5992
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.3626,
													-0.9785
												],
												[
													0,
													0
												],
												[
													-0.474,
													-0.1756
												],
												[
													0,
													0
												],
												[
													1.0428,
													-0.3872
												],
												[
													0,
													0
												],
												[
													0.1757,
													-0.4738
												],
												[
													0,
													0
												],
												[
													0.3871,
													1.0436
												],
												[
													0,
													0
												],
												[
													0.4738,
													0.1756
												],
												[
													0,
													0
												],
												[
													-1.0442,
													0.3868
												],
												[
													0,
													0
												],
												[
													-0.1755,
													0.4741
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.48260999999999976,
													-0.85591
												],
												[
													0,
													0
												],
												[
													0.17556999999999956,
													0.47402999999999995
												],
												[
													0,
													0
												],
												[
													1.0428800000000003,
													0.38721000000000005
												],
												[
													0,
													0
												],
												[
													-0.47384000000000004,
													0.17551999999999968
												],
												[
													0,
													0
												],
												[
													-0.3867700000000003,
													1.0438899999999993
												],
												[
													0,
													0
												],
												[
													-0.17555999999999994,
													-0.47379000000000016
												],
												[
													0,
													0
												],
												[
													-1.04419,
													-0.3867700000000003
												],
												[
													0,
													0
												],
												[
													0.47394999999999987,
													-0.17571000000000003
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													4.5995,
													3.0432
												],
												[
													3.0435,
													4.5992
												],
												[
													4.5995,
													6.1539
												],
												[
													6.1542,
													4.5992
												],
												[
													4.5995,
													3.0432
												],
												[
													4.5995,
													3.0432
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.668,
													-0.3435
												],
												[
													-0.3433,
													-0.6676
												],
												[
													-0.6674,
													0.3432
												],
												[
													0.3433,
													0.6678
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-0.3433099999999998,
													0.6680800000000002
												],
												[
													0.66763,
													0.34328999999999965
												],
												[
													0.3433299999999999,
													-0.6673499999999999
												],
												[
													-0.6677600000000004,
													-0.3433999999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.611764705882353,
											0.3607843137254902,
											0.9372549019607843,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "Ellipse 10089 - Null",
					sr: 1,
					parent: 11,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "Ellipse 10089",
					sr: 1,
					parent: 14,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													12.3,
													6
												],
												[
													6,
													12.3
												],
												[
													-0.3,
													6
												],
												[
													6,
													-0.3
												],
												[
													12.3,
													6
												],
												[
													12.3,
													6
												]
											],
											i: [
												[
													0,
													0
												],
												[
													3.47949,
													0
												],
												[
													0,
													3.47949
												],
												[
													-3.47949,
													0
												],
												[
													0,
													-3.47949
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													3.47949
												],
												[
													-3.47949,
													0
												],
												[
													0,
													-3.47949
												],
												[
													3.47949,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.9254901960784314,
											0.8705882352941177,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "[FRAME] agent main - Null / robot - Null / robot - Null / robot / Icon - Null / Icon / Icon1 - Null / Icon1 / Icon2 - Null / Icon2",
			fr: 60,
			id: "moljdpcbuobnnp15",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 16,
					hd: false,
					nm: "agent main - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 17,
					hd: false,
					nm: "robot - Null",
					sr: 1,
					parent: 16,
					ks: {
						a: {
							a: 0,
							k: [
								16,
								16
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								16,
								16.3
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 132.072,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 138.006,
									s: [
										-10
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 144.012,
									s: [
										10
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 149.976,
									s: [
										-10
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 156.318,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 18,
					hd: false,
					nm: "robot - Null",
					sr: 1,
					parent: 17,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								5,
								6
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 19,
					hd: false,
					nm: "robot",
					sr: 1,
					parent: 18,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													17.3321,
													0.5544
												],
												[
													18.5641,
													0.0807
												],
												[
													19.0378,
													1.3127
												],
												[
													17.6182,
													4.506
												],
												[
													22.0426,
													13.7707
												],
												[
													21.103,
													17.455
												],
												[
													18.3437,
													18.8722
												],
												[
													14.9588,
													18.8364
												],
												[
													14.4146,
													18.7918
												],
												[
													11.1595,
													18.6111
												],
												[
													7.8852,
													18.7512
												],
												[
													7.2592,
													18.7927
												],
												[
													3.793,
													18.7832
												],
												[
													0.9857,
													17.3864
												],
												[
													0.0018,
													13.7708
												],
												[
													4.4247,
													4.4427
												],
												[
													2.8391,
													1.5517
												],
												[
													3.2086,
													0.2846
												],
												[
													4.4758,
													0.6541
												],
												[
													5.9842,
													3.4045
												],
												[
													10.9534,
													2.2033
												],
												[
													16.0657,
													3.4032
												],
												[
													17.3321,
													0.5544
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.471,
													-0.2094
												],
												[
													0.2094,
													-0.471
												],
												[
													0,
													0
												],
												[
													-0.0727,
													-4.0111
												],
												[
													0.6902,
													-0.8841
												],
												[
													1.042,
													-0.1373
												],
												[
													1.1845,
													0.095
												],
												[
													0.1824,
													0.0151
												],
												[
													1.123,
													0.0042
												],
												[
													1.0559,
													-0.071
												],
												[
													0.2073,
													-0.0133
												],
												[
													1.0433,
													0.144
												],
												[
													0.7267,
													0.8824
												],
												[
													-0.0277,
													1.5331
												],
												[
													-2.8135,
													2.2056
												],
												[
													0,
													0
												],
												[
													-0.452,
													0.2479
												],
												[
													-0.2479,
													-0.452
												],
												[
													0,
													0
												],
												[
													-1.8597,
													0.0276
												],
												[
													-1.5889,
													-0.8938
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.2093999999999987,
													-0.47102
												],
												[
													0.47101999999999933,
													0.20938999999999997
												],
												[
													0,
													0
												],
												[
													2.364560000000001,
													2.00952
												],
												[
													0.028410000000000935,
													1.5684000000000005
												],
												[
													-0.7085499999999989,
													0.9075500000000005
												],
												[
													-1.0217099999999988,
													0.13466000000000022
												],
												[
													-0.18037999999999954,
													-0.014469999999999317
												],
												[
													-1.0488199999999992,
													-0.08682999999999907
												],
												[
													-1.1280300000000008,
													-0.004270000000001772
												],
												[
													-0.20999000000000034,
													0.014119999999998356
												],
												[
													-1.2186900000000005,
													0.0782500000000006
												],
												[
													-1.0565600000000002,
													-0.1458699999999986
												],
												[
													-0.71766,
													-0.8713699999999989
												],
												[
													0.06959,
													-3.857470000000001
												],
												[
													0,
													0
												],
												[
													-0.2478699999999998,
													-0.4519599999999999
												],
												[
													0.45196000000000014,
													-0.24787
												],
												[
													0,
													0
												],
												[
													1.3060400000000003,
													-0.71747
												],
												[
													1.6985200000000003,
													-0.025250000000000217
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													10.9812,
													4.0696
												],
												[
													6.7801,
													5.0985
												],
												[
													1.8682,
													13.8044
												],
												[
													2.4266,
													16.1996
												],
												[
													4.0483,
													16.9339
												],
												[
													7.1396,
													16.9297
												],
												[
													7.7423,
													16.8897
												],
												[
													11.1666,
													16.7443
												],
												[
													14.5814,
													16.9324
												],
												[
													15.108,
													16.9756
												],
												[
													18.0998,
													17.0215
												],
												[
													19.6317,
													16.3062
												],
												[
													20.1763,
													13.8045
												],
												[
													15.6453,
													5.3397
												],
												[
													10.9813,
													4.0697
												],
												[
													10.9812,
													4.0696
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.9925,
													-0.5758
												],
												[
													0.0696,
													-3.8587
												],
												[
													-0.3197,
													-0.3882
												],
												[
													-0.8167,
													-0.1127
												],
												[
													-1.2376,
													0.0795
												],
												[
													-0.2053,
													0.0138
												],
												[
													-1.2005,
													-45e-4
												],
												[
													-1.0467,
													-0.0868
												],
												[
													-0.1716,
													-0.0138
												],
												[
													-0.7964,
													0.105
												],
												[
													-0.2941,
													0.3767
												],
												[
													0.0249,
													1.3736
												],
												[
													2.3319,
													1.6194
												],
												[
													1.6608,
													-0.0247
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-1.6665299999999998,
													0.02477000000000018
												],
												[
													-3.10598,
													1.8019499999999997
												],
												[
													-0.02367000000000008,
													1.3119399999999999
												],
												[
													0.3106200000000001,
													0.3771500000000003
												],
												[
													0.8299599999999998,
													0.11458999999999975
												],
												[
													0.19632000000000005,
													-0.012609999999998678
												],
												[
													1.0561900000000009,
													-0.07120000000000104
												],
												[
													1.2030700000000003,
													0.004560000000001452
												],
												[
													0.17896999999999963,
													0.014849999999999142
												],
												[
													1.2084399999999995,
													0.09691000000000116
												],
												[
													0.7760500000000015,
													-0.10228000000000037
												],
												[
													0.3124299999999991,
													-0.40018000000000065
												],
												[
													-0.06925000000000026,
													-3.822849999999999
												],
												[
													-1.3211999999999993,
													-0.91751
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.611764705882353,
											0.3607843137254902,
											0.9372549019607843,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 20,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 17,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								8.3855,
								12.1602
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 21,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 20,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													7.635,
													0
												],
												[
													2.4057,
													1.3534
												],
												[
													0,
													5.0758
												],
												[
													0.8801,
													7.0414
												],
												[
													2.785,
													7.7233
												],
												[
													5.0462,
													7.7876
												],
												[
													5.829,
													7.768
												],
												[
													7.635,
													7.7361
												],
												[
													9.4454,
													7.7682
												],
												[
													10.2261,
													7.7878
												],
												[
													12.4885,
													7.724
												],
												[
													14.3942,
													7.0421
												],
												[
													15.2743,
													5.0758
												],
												[
													12.866,
													1.3524
												],
												[
													7.635,
													0
												],
												[
													7.635,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													1.3826,
													-0.8548
												],
												[
													0,
													-1.5863
												],
												[
													-0.6005,
													-0.4764
												],
												[
													-0.6624,
													-0.0797
												],
												[
													-0.8025,
													0.0167
												],
												[
													-0.2641,
													0.0071
												],
												[
													-0.6272,
													0
												],
												[
													-0.5819,
													-0.0158
												],
												[
													-0.2574,
													-54e-4
												],
												[
													-0.6784,
													0.0815
												],
												[
													-0.5432,
													0.4309
												],
												[
													0,
													0.8041
												],
												[
													1.3688,
													0.8452
												],
												[
													1.9952,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-1.9954299999999998,
													0
												],
												[
													-1.36784,
													0.8456499999999998
												],
												[
													0,
													0.8039399999999999
												],
												[
													0.5429499999999999,
													0.43071000000000037
												],
												[
													0.67815,
													0.0816100000000004
												],
												[
													0.2581300000000004,
													-0.005379999999999718
												],
												[
													0.58026,
													-0.015699999999999825
												],
												[
													0.6291499999999992,
													0
												],
												[
													0.26343999999999923,
													0.007159999999999833
												],
												[
													0.8030000000000008,
													0.01686999999999994
												],
												[
													0.6626999999999992,
													-0.0795899999999996
												],
												[
													0.6006999999999998,
													-0.4765800000000002
												],
												[
													0,
													-1.58765
												],
												[
													-1.3835700000000006,
													-0.85435
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.8667,
													5.0758
												],
												[
													3.3873,
													2.9411
												],
												[
													7.635,
													1.8667
												],
												[
													11.8852,
													2.9407
												],
												[
													13.4076,
													5.0758
												],
												[
													13.234,
													5.5798
												],
												[
													12.2659,
													5.8707
												],
												[
													10.2653,
													5.9216
												],
												[
													9.5263,
													5.903
												],
												[
													7.635,
													5.8695
												],
												[
													5.749,
													5.9028
												],
												[
													5.0073,
													5.9214
												],
												[
													3.008,
													5.8701
												],
												[
													2.0401,
													5.5791
												],
												[
													1.8666,
													5.076
												],
												[
													1.8667,
													5.0758
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.0579,
													0.654
												],
												[
													-1.705,
													0
												],
												[
													-1.0443,
													-0.6448
												],
												[
													0,
													-0.7004
												],
												[
													0.0778,
													-0.0617
												],
												[
													0.5507,
													-0.0661
												],
												[
													0.8017,
													0.0168
												],
												[
													0.2566,
													0.007
												],
												[
													0.655,
													0
												],
												[
													0.5919,
													-0.016
												],
												[
													0.2359,
													-49e-4
												],
												[
													0.5347,
													0.0643
												],
												[
													0.1354,
													0.1074
												],
												[
													0,
													0.3392
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-0.6999599999999999
												],
												[
													1.0431500000000002,
													-0.6449099999999999
												],
												[
													1.7051700000000007,
													0
												],
												[
													1.0590399999999995,
													0.6539600000000001
												],
												[
													0,
													0.3399099999999997
												],
												[
													-0.13536000000000037,
													0.10738999999999965
												],
												[
													-0.5349799999999991,
													0.06425000000000036
												],
												[
													-0.23507999999999996,
													-0.0049400000000003885
												],
												[
													-0.5933499999999992,
													-0.01609999999999978
												],
												[
													-0.6529800000000003,
													0
												],
												[
													-0.2575700000000003,
													0.006960000000000299
												],
												[
													-0.8010000000000002,
													0.01670000000000016
												],
												[
													-0.5504099999999998,
													-0.06623999999999963
												],
												[
													-0.07787999999999995,
													-0.061779999999999724
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.611764705882353,
											0.3607843137254902,
											0.9372549019607843,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 22,
					hd: false,
					nm: "Icon1 - Null",
					sr: 1,
					parent: 17,
					ks: {
						a: {
							a: 0,
							k: [
								1.1463,
								1.1463
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								18.7465,
								16.2674
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 1,
							k: [
								{
									t: 90.108,
									s: [
										100,
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 97.398,
									s: [
										100,
										5
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 104.61,
									s: [
										100,
										100
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 23,
					hd: false,
					nm: "Icon1",
					sr: 1,
					parent: 22,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.1463,
													0
												],
												[
													0,
													1.1463
												],
												[
													1.1463,
													2.2926
												],
												[
													2.2926,
													1.1463
												],
												[
													1.1463,
													0
												],
												[
													1.1463,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													-0.6331
												],
												[
													-0.6331,
													0
												],
												[
													0,
													0.6331
												],
												[
													0.6331,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-0.63308,
													0
												],
												[
													0,
													0.6330800000000001
												],
												[
													0.6330800000000001,
													0
												],
												[
													0,
													-0.63308
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.611764705882353,
											0.3607843137254902,
											0.9372549019607843,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 24,
					hd: false,
					nm: "Icon2 - Null",
					sr: 1,
					parent: 17,
					ks: {
						a: {
							a: 0,
							k: [
								1.1463,
								1.1463
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								13.0331,
								16.2674
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 1,
							k: [
								{
									t: 112.66199999999999,
									s: [
										100,
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 120.744,
									s: [
										100,
										5
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 127.87200000000001,
									s: [
										100,
										100
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 25,
					hd: false,
					nm: "Icon2",
					sr: 1,
					parent: 24,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													1.1463
												],
												[
													1.1463,
													0
												],
												[
													2.2926,
													1.1463
												],
												[
													1.1463,
													2.2926
												],
												[
													0,
													1.1463
												],
												[
													0,
													1.1463
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.6331,
													0
												],
												[
													0,
													-0.6331
												],
												[
													0.6331,
													0
												],
												[
													0,
													0.6331
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-0.63308
												],
												[
													0.6330800000000001,
													0
												],
												[
													0,
													0.6330800000000001
												],
												[
													-0.63308,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.611764705882353,
											0.3607843137254902,
											0.9372549019607843,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "[FRAME] agent main - Null / star / robot",
			fr: 60,
			id: "moljdpc6v3xc4w1u",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 26,
					hd: false,
					nm: "agent main - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 27,
					ty: 0,
					nm: "star",
					refId: "moljdpc7rkca35w8",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 32,
					h: 32,
					ip: 0,
					op: 180,
					st: 0,
					hd: false,
					bm: 0
				},
				{
					ddd: 0,
					ind: 28,
					ty: 0,
					nm: "robot",
					refId: "moljdpcbuobnnp15",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 32,
					h: 32,
					ip: 0,
					op: 180,
					st: 0,
					hd: false,
					bm: 0
				}
			]
		}
	];
	var layers$8 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "agent main",
			refId: "moljdpc6v3xc4w1u",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 32,
			h: 32,
			ip: 0,
			op: 180,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$8 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var aiRobotAnimation = {
		fr: fr$8,
		v: v$8,
		ip: ip$8,
		op: op$8,
		w: w$8,
		h: h$8,
		nm: nm$8,
		ddd: ddd$8,
		markers: markers$8,
		assets: assets$8,
		layers: layers$8,
		meta: meta$8
	};

	var fr$7 = 60;
	var v$7 = "5.9.6";
	var ip$7 = 0;
	var op$7 = 299;
	var w$7 = 32;
	var h$7 = 32;
	var nm$7 = "Frame 1948756351";
	var ddd$7 = 0;
	var markers$7 = [
	];
	var assets$7 = [
		{
			nm: "[FRAME] Frame 1948756351 - Null / Frame - Null / top - Null / Icon - Null / Icon / Vector 674 - Null / Vector 674",
			fr: 60,
			id: "molj4cubpjjl7g9k",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 12,
					hd: false,
					nm: "Frame 1948756351 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 13,
					hd: false,
					nm: "Frame - Null",
					sr: 1,
					parent: 12,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "top - Null",
					sr: 1,
					parent: 13,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										6,
										4.6289
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 6,
									s: [
										6,
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 11.856,
									s: [
										6,
										4.6289
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 17.712,
									s: [
										6,
										1.8838
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 23.843999999999998,
									s: [
										6,
										4.6289
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 30.114,
									s: [
										6,
										3.63
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 35.688,
									s: [
										6,
										4.6289
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 14,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 16,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 15,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 5,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													3.2813,
													1.231
												],
												[
													10.1633,
													0
												],
												[
													17.0454,
													1.231
												],
												[
													19.3165,
													2.6872
												],
												[
													20.2009,
													4.1222
												],
												[
													20.3166,
													4.5727
												],
												[
													20.3166,
													10.6027
												],
												[
													20.2996,
													10.7811
												],
												[
													19.3165,
													12.7386
												],
												[
													17.0454,
													14.1948
												],
												[
													10.1634,
													15.4258
												],
												[
													3.2814,
													14.1948
												],
												[
													1.0103,
													12.7386
												],
												[
													0.0349,
													10.8561
												],
												[
													0.0001,
													10.6028
												],
												[
													0.0001,
													4.5729
												],
												[
													0.1367,
													4.0865
												],
												[
													1.0103,
													2.6874
												],
												[
													3.2814,
													1.2312
												],
												[
													3.2813,
													1.231
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-2.6394,
													0
												],
												[
													-1.8088,
													-0.7746
												],
												[
													-0.5781,
													-0.5853
												],
												[
													-0.1591,
													-0.5442
												],
												[
													0,
													-0.1634
												],
												[
													0,
													0
												],
												[
													0.0112,
													-0.0577
												],
												[
													0.5286,
													-0.5352
												],
												[
													0.9027,
													-0.3866
												],
												[
													2.6394,
													0
												],
												[
													1.8088,
													0.7746
												],
												[
													0.5781,
													0.5853
												],
												[
													0.0848,
													0.7299
												],
												[
													0,
													0.0878
												],
												[
													0,
													0
												],
												[
													-0.0866,
													0.1416
												],
												[
													-0.3948,
													0.3998
												],
												[
													-0.9027,
													0.3866
												],
												[
													0,
													0
												]
											],
											o: [
												[
													1.8088199999999999,
													-0.77462
												],
												[
													2.63941,
													0
												],
												[
													0.9027400000000014,
													0.38659
												],
												[
													0.40371999999999986,
													0.40876
												],
												[
													0.07373000000000118,
													0.1335499999999996
												],
												[
													0,
													0
												],
												[
													0,
													0.06099999999999994
												],
												[
													-0.0667599999999986,
													0.7614699999999992
												],
												[
													-0.5781099999999988,
													0.5853199999999994
												],
												[
													-1.8088300000000004,
													0.7746200000000005
												],
												[
													-2.63941,
													0
												],
												[
													-0.9027400000000001,
													-0.38659
												],
												[
													-0.51117,
													-0.51755
												],
												[
													-0.02266,
													-0.08055000000000057
												],
												[
													0,
													0
												],
												[
													0,
													-0.17820000000000036
												],
												[
													0.16259,
													-0.5295199999999998
												],
												[
													0.5781100000000001,
													-0.5853199999999998
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													2.3383,
													3.9989
												],
												[
													1.8836,
													4.8788
												],
												[
													2.3383,
													5.7587
												],
												[
													4.0161,
													6.8107
												],
												[
													10.1633,
													7.8909
												],
												[
													16.3105,
													6.8107
												],
												[
													17.9883,
													5.7587
												],
												[
													18.443,
													4.8788
												],
												[
													17.9883,
													3.9989
												],
												[
													16.3105,
													2.9469
												],
												[
													10.1633,
													1.8667
												],
												[
													4.0161,
													2.9469
												],
												[
													2.3383,
													3.9989
												],
												[
													2.3383,
													3.9989
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													-0.2289
												],
												[
													-0.3504,
													-0.3547
												],
												[
													-0.7645,
													-0.3274
												],
												[
													-2.4488,
													0
												],
												[
													-1.5256,
													0.6534
												],
												[
													-0.3543,
													0.3587
												],
												[
													0,
													0.2289
												],
												[
													0.3504,
													0.3547
												],
												[
													0.7645,
													0.3274
												],
												[
													2.4488,
													0
												],
												[
													1.5256,
													-0.6534
												],
												[
													0.3543,
													-0.3587
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-0.35036,
													0.3547399999999996
												],
												[
													0,
													0.2288800000000002
												],
												[
													0.3543099999999999,
													0.35873000000000044
												],
												[
													1.5256499999999997,
													0.6533499999999997
												],
												[
													2.448830000000001,
													0
												],
												[
													0.7645000000000017,
													-0.3273900000000003
												],
												[
													0.35035999999999845,
													-0.3547399999999996
												],
												[
													0,
													-0.2288800000000002
												],
												[
													-0.3543100000000017,
													-0.35873
												],
												[
													-1.5256500000000006,
													-0.6533500000000001
												],
												[
													-2.44883,
													0
												],
												[
													-0.7645,
													0.32738999999999985
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.8836,
													10.2148
												],
												[
													1.8667,
													10.2148
												],
												[
													1.8667,
													7.7703
												],
												[
													3.2813,
													8.5266
												],
												[
													10.1633,
													9.7576
												],
												[
													17.0454,
													8.5266
												],
												[
													18.4499,
													7.7771
												],
												[
													18.4499,
													10.2148
												],
												[
													18.4431,
													10.2148
												],
												[
													17.9884,
													11.0947
												],
												[
													16.3106,
													12.1467
												],
												[
													10.1634,
													13.2269
												],
												[
													4.0162,
													12.1467
												],
												[
													2.3384,
													11.0947
												],
												[
													1.8837,
													10.2148
												],
												[
													1.8836,
													10.2148
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-0.5142,
													-0.2202
												],
												[
													-2.6394,
													0
												],
												[
													-1.8088,
													0.7746
												],
												[
													-0.4203,
													0.2814
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.3504,
													-0.3547
												],
												[
													0.7645,
													-0.3274
												],
												[
													2.4488,
													0
												],
												[
													1.5256,
													0.6533
												],
												[
													0.3543,
													0.3587
												],
												[
													0,
													0.2289
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.4227700000000001,
													0.28419999999999934
												],
												[
													1.8088199999999999,
													0.7746200000000005
												],
												[
													2.63941,
													0
												],
												[
													0.5100799999999985,
													-0.2184399999999993
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0.2288800000000002
												],
												[
													-0.3543100000000017,
													0.35872999999999955
												],
												[
													-1.5256500000000006,
													0.6533499999999997
												],
												[
													-2.44883,
													0
												],
												[
													-0.7645,
													-0.3273899999999994
												],
												[
													-0.35036,
													-0.3547399999999996
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.3215686274509804,
											0.7372549019607844,
											0.7372549019607844,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 17,
					hd: false,
					nm: "Vector 674 - Null",
					sr: 1,
					parent: 14,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0.6694,
								0.8711
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 18,
					hd: false,
					nm: "Vector 674",
					sr: 1,
					parent: 17,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0.5,
													3.5
												],
												[
													4,
													0.5
												],
												[
													12.5,
													0
												],
												[
													15.5,
													1
												],
												[
													18.5,
													3
												],
												[
													18.5,
													9.5
												],
												[
													17.5,
													11.5
												],
												[
													11.5,
													13.5
												],
												[
													4.5,
													13
												],
												[
													0.5,
													11
												],
												[
													0,
													7.5
												],
												[
													0.5,
													3.5
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.8901960784313725,
											0.9607843137254902,
											0.9294117647058824,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "[FRAME] Frame 1948756351 - Null / Frame - Null / top / Icon - Null / Icon",
			fr: 60,
			id: "molj4cuab1fjwzo3",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 19,
					hd: false,
					nm: "Frame 1948756351 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 20,
					hd: false,
					nm: "Frame - Null",
					sr: 1,
					parent: 19,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 21,
					ty: 0,
					nm: "top",
					refId: "molj4cubpjjl7g9k",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 32,
					h: 32,
					ip: 0,
					op: 300,
					st: 0,
					hd: false,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 22,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 20,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								6,
								10.5996
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 23,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 22,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 5,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													3.2813,
													1.231
												],
												[
													10.1633,
													0
												],
												[
													17.0454,
													1.231
												],
												[
													19.3165,
													2.6872
												],
												[
													20.2009,
													4.1222
												],
												[
													20.3166,
													4.5727
												],
												[
													20.3166,
													10.6027
												],
												[
													20.2996,
													10.7811
												],
												[
													19.3165,
													12.7386
												],
												[
													17.0454,
													14.1948
												],
												[
													10.1634,
													15.4258
												],
												[
													3.2814,
													14.1948
												],
												[
													1.0103,
													12.7386
												],
												[
													0.0349,
													10.8561
												],
												[
													0.0001,
													10.6028
												],
												[
													0.0001,
													4.5729
												],
												[
													0.1367,
													4.0865
												],
												[
													1.0103,
													2.6874
												],
												[
													3.2814,
													1.2312
												],
												[
													3.2813,
													1.231
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-2.6394,
													0
												],
												[
													-1.8088,
													-0.7746
												],
												[
													-0.5781,
													-0.5853
												],
												[
													-0.1591,
													-0.5442
												],
												[
													0,
													-0.1634
												],
												[
													0,
													0
												],
												[
													0.0112,
													-0.0577
												],
												[
													0.5286,
													-0.5352
												],
												[
													0.9027,
													-0.3866
												],
												[
													2.6394,
													0
												],
												[
													1.8088,
													0.7746
												],
												[
													0.5781,
													0.5853
												],
												[
													0.0848,
													0.7299
												],
												[
													0,
													0.0878
												],
												[
													0,
													0
												],
												[
													-0.0866,
													0.1416
												],
												[
													-0.3948,
													0.3998
												],
												[
													-0.9027,
													0.3866
												],
												[
													0,
													0
												]
											],
											o: [
												[
													1.8088199999999999,
													-0.77462
												],
												[
													2.63941,
													0
												],
												[
													0.9027400000000014,
													0.38659
												],
												[
													0.40371999999999986,
													0.40876
												],
												[
													0.07373000000000118,
													0.1335499999999996
												],
												[
													0,
													0
												],
												[
													0,
													0.06099999999999994
												],
												[
													-0.0667599999999986,
													0.7614699999999992
												],
												[
													-0.5781099999999988,
													0.5853199999999994
												],
												[
													-1.8088300000000004,
													0.7746200000000005
												],
												[
													-2.63941,
													0
												],
												[
													-0.9027400000000001,
													-0.38659
												],
												[
													-0.51117,
													-0.51755
												],
												[
													-0.02266,
													-0.08055000000000057
												],
												[
													0,
													0
												],
												[
													0,
													-0.17820000000000036
												],
												[
													0.16259,
													-0.5295199999999998
												],
												[
													0.5781100000000001,
													-0.5853199999999998
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													2.3383,
													3.9989
												],
												[
													1.8836,
													4.8788
												],
												[
													2.3383,
													5.7587
												],
												[
													4.0161,
													6.8107
												],
												[
													10.1633,
													7.8909
												],
												[
													16.3105,
													6.8107
												],
												[
													17.9883,
													5.7587
												],
												[
													18.443,
													4.8788
												],
												[
													17.9883,
													3.9989
												],
												[
													16.3105,
													2.9469
												],
												[
													10.1633,
													1.8667
												],
												[
													4.0161,
													2.9469
												],
												[
													2.3383,
													3.9989
												],
												[
													2.3383,
													3.9989
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													-0.2289
												],
												[
													-0.3504,
													-0.3547
												],
												[
													-0.7645,
													-0.3274
												],
												[
													-2.4488,
													0
												],
												[
													-1.5256,
													0.6534
												],
												[
													-0.3543,
													0.3587
												],
												[
													0,
													0.2289
												],
												[
													0.3504,
													0.3547
												],
												[
													0.7645,
													0.3274
												],
												[
													2.4488,
													0
												],
												[
													1.5256,
													-0.6534
												],
												[
													0.3543,
													-0.3587
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-0.35036,
													0.3547399999999996
												],
												[
													0,
													0.2288800000000002
												],
												[
													0.3543099999999999,
													0.35873000000000044
												],
												[
													1.5256499999999997,
													0.6533499999999997
												],
												[
													2.448830000000001,
													0
												],
												[
													0.7645000000000017,
													-0.3273900000000003
												],
												[
													0.35035999999999845,
													-0.3547399999999996
												],
												[
													0,
													-0.2288800000000002
												],
												[
													-0.3543100000000017,
													-0.35873
												],
												[
													-1.5256500000000006,
													-0.6533500000000001
												],
												[
													-2.44883,
													0
												],
												[
													-0.7645,
													0.32738999999999985
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.8836,
													10.2148
												],
												[
													1.8667,
													10.2148
												],
												[
													1.8667,
													7.7703
												],
												[
													3.2813,
													8.5266
												],
												[
													10.1633,
													9.7576
												],
												[
													17.0454,
													8.5266
												],
												[
													18.4499,
													7.7771
												],
												[
													18.4499,
													10.2148
												],
												[
													18.4431,
													10.2148
												],
												[
													17.9884,
													11.0947
												],
												[
													16.3106,
													12.1467
												],
												[
													10.1634,
													13.2269
												],
												[
													4.0162,
													12.1467
												],
												[
													2.3384,
													11.0947
												],
												[
													1.8837,
													10.2148
												],
												[
													1.8836,
													10.2148
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-0.5142,
													-0.2202
												],
												[
													-2.6394,
													0
												],
												[
													-1.8088,
													0.7746
												],
												[
													-0.4203,
													0.2814
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.3504,
													-0.3547
												],
												[
													0.7645,
													-0.3274
												],
												[
													2.4488,
													0
												],
												[
													1.5256,
													0.6533
												],
												[
													0.3543,
													0.3587
												],
												[
													0,
													0.2289
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.4227700000000001,
													0.28419999999999934
												],
												[
													1.8088199999999999,
													0.7746200000000005
												],
												[
													2.63941,
													0
												],
												[
													0.5100799999999985,
													-0.2184399999999993
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0.2288800000000002
												],
												[
													-0.3543100000000017,
													0.35872999999999955
												],
												[
													-1.5256500000000006,
													0.6533499999999997
												],
												[
													-2.44883,
													0
												],
												[
													-0.7645,
													-0.3273899999999994
												],
												[
													-0.35036,
													-0.3547399999999996
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.3215686274509804,
											0.7372549019607844,
											0.7372549019607844,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "[FRAME] Frame 1948756351 - Null / Frame",
			fr: 60,
			id: "molj4cuagu3j4eeu",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 24,
					hd: false,
					nm: "Frame 1948756351 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 25,
					ty: 0,
					nm: "Frame",
					refId: "molj4cuab1fjwzo3",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 32,
					h: 32,
					ip: 0,
					op: 300,
					st: 0,
					hd: false,
					bm: 0
				}
			]
		}
	];
	var layers$7 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "Frame 1948756351",
			refId: "molj4cuagu3j4eeu",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 32,
			h: 32,
			ip: 0,
			op: 300,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$7 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var dataAnimation = {
		fr: fr$7,
		v: v$7,
		ip: ip$7,
		op: op$7,
		w: w$7,
		h: h$7,
		nm: nm$7,
		ddd: ddd$7,
		markers: markers$7,
		assets: assets$7,
		layers: layers$7,
		meta: meta$7
	};

	var fr$6 = 60;
	var v$6 = "5.9.6";
	var ip$6 = 0;
	var op$6 = 299;
	var w$6 = 32;
	var h$6 = 32;
	var nm$6 = "edit main";
	var ddd$6 = 0;
	var markers$6 = [
	];
	var assets$6 = [
		{
			nm: "[FRAME] edit main - Null / Union - Null / Union",
			fr: 60,
			id: "molixubg15vepxhw",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "edit main - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "Union - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								10.6612,
								10.5452
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								16.2853,
								15.8743
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 0.276,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 30.389999999999997,
									s: [
										-15
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 60.222,
									s: [
										10
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 90.05399999999999,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "Union",
					sr: 1,
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 6,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													15.0043,
													0.8179
												],
												[
													18.962,
													0.8202
												],
												[
													20.5024,
													2.3608
												],
												[
													20.5068,
													6.3161
												],
												[
													7.6698,
													19.2109
												],
												[
													6.5837,
													19.8179
												],
												[
													1.3128,
													21.061
												],
												[
													0.0456,
													19.7185
												],
												[
													1.5642,
													14.6163
												],
												[
													2.1357,
													13.6584
												],
												[
													15.0043,
													0.8179
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.0926,
													-1.0927
												],
												[
													0,
													0
												],
												[
													1.0892,
													-1.0942
												],
												[
													0,
													0
												],
												[
													0.4116,
													-0.0971
												],
												[
													0,
													0
												],
												[
													-0.2339,
													0.7858
												],
												[
													0,
													0
												],
												[
													-0.2673,
													0.2667
												],
												[
													0,
													0
												]
											],
											o: [
												[
													1.0938499999999998,
													-1.09145
												],
												[
													0,
													0
												],
												[
													1.0916500000000013,
													1.0917400000000002
												],
												[
													0,
													0
												],
												[
													-0.29832000000000036,
													0.29965999999999937
												],
												[
													0,
													0
												],
												[
													-0.79795,
													0.18818999999999875
												],
												[
													0,
													0
												],
												[
													0.10772000000000004,
													-0.3619299999999992
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													17.642,
													2.1401
												],
												[
													16.3228,
													2.1394
												],
												[
													14.7383,
													3.7205
												],
												[
													17.604,
													6.5862
												],
												[
													19.1839,
													4.9992
												],
												[
													19.1825,
													3.6808
												],
												[
													17.642,
													2.1401
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.3646,
													-0.3638
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.3639,
													0.3639
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-0.3642000000000003,
													-0.36423000000000005
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.36308000000000007,
													-0.36472000000000016
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													16.287,
													7.909
												],
												[
													13.4169,
													5.0389
												],
												[
													4.0443,
													14.391
												],
												[
													6.9458,
													17.2925
												],
												[
													16.287,
													7.909
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													2.2287,
													18.927
												],
												[
													3.08,
													16.0666
												],
												[
													5.232,
													18.2186
												],
												[
													2.2287,
													18.927
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.3215686274509804,
											0.7372549019607844,
											0.7372549019607844,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers$6 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "edit main",
			refId: "molixubg15vepxhw",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 32,
			h: 32,
			ip: 0,
			op: 300,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$6 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var editAnimation = {
		fr: fr$6,
		v: v$6,
		ip: ip$6,
		op: op$6,
		w: w$6,
		h: h$6,
		nm: nm$6,
		ddd: ddd$6,
		markers: markers$6,
		assets: assets$6,
		layers: layers$6,
		meta: meta$6
	};

	var fr$5 = 60;
	var v$5 = "5.9.6";
	var ip$5 = 0;
	var op$5 = 119;
	var w$5 = 128;
	var h$5 = 128;
	var nm$5 = "deal2";
	var ddd$5 = 0;
	var markers$5 = [
	];
	var assets$5 = [
		{
			nm: "[FRAME] deal2 - Null / Icon - Null / Icon",
			fr: 60,
			id: "moljey3mpqxmgyrl",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "deal2 - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								51.9625,
								38.8008
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										65.0198,
										68.6133
									],
									o: {
										x: [
											0.35
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.65
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 11.778,
									s: [
										65.02,
										37.01
									],
									o: {
										x: [
											0.35
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 11.850000000000001,
									s: [
										65.02,
										45.0119
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.65
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 29.97,
									s: [
										65.0198,
										81.4141
									],
									o: {
										x: [
											0.35
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.65
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 47.928,
									s: [
										65.0198,
										68.6133
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 8,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 5,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													103.4225,
													23.0394
												],
												[
													103.5825,
													23.5194
												],
												[
													103.4758,
													23.4661
												],
												[
													102.7825,
													29.0661
												],
												[
													90.0358,
													38.4528
												],
												[
													87.1558,
													39.1461
												],
												[
													85.6624,
													38.9861
												],
												[
													77.2357,
													34.8261
												],
												[
													76.329,
													34.2394
												],
												[
													71.7423,
													31.0927
												],
												[
													71.1004,
													30.6371
												],
												[
													57.8756,
													23.8394
												],
												[
													53.5556,
													25.2794
												],
												[
													50.4089,
													26.6127
												],
												[
													49.6089,
													26.9327
												],
												[
													49.565,
													26.949
												],
												[
													35.3689,
													28.9593
												],
												[
													26.7289,
													20.6926
												],
												[
													30.2489,
													15.4659
												],
												[
													39.2089,
													10.3459
												],
												[
													53.2889,
													3.0926
												],
												[
													66.4972,
													4.6263
												],
												[
													66.6755,
													4.6926
												],
												[
													72.1688,
													6.2926
												],
												[
													75.4755,
													4.2126
												],
												[
													75.7423,
													3.9816
												],
												[
													79.3155,
													1.4393
												],
												[
													88.0622,
													1.226
												],
												[
													92.2222,
													5.2793
												],
												[
													93.1289,
													6.3993
												],
												[
													103.4222,
													23.0393
												],
												[
													103.4225,
													23.0394
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.44,
													-2.24
												],
												[
													2.08,
													-0.7467
												],
												[
													0.9066,
													0
												],
												[
													0.5867,
													0.1067
												],
												[
													4.1067,
													2.6133
												],
												[
													0,
													0
												],
												[
													1.7067,
													1.2267
												],
												[
													0.2222,
													0.1579
												],
												[
													2.8774,
													-0.5553
												],
												[
													1.3333,
													-0.64
												],
												[
													1.3333,
													-0.48
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													4.358,
													1.6475
												],
												[
													0.2133,
													4.6933
												],
												[
													-3.3067,
													1.6
												],
												[
													-3.0933,
													1.8667
												],
												[
													-4.16,
													1.28
												],
												[
													-3.7006,
													-1.3754
												],
												[
													0,
													0
												],
												[
													-1.6533,
													-0.16
												],
												[
													-1.2267,
													1.0667
												],
												[
													-0.089,
													0.0772
												],
												[
													-1.3802,
													0.6408
												],
												[
													-3.3067,
													-2.08
												],
												[
													-2.08,
													-2.56
												],
												[
													0,
													0
												],
												[
													-0.64,
													-2.1867
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.6400000000000006,
													1.7600000000000016
												],
												[
													-1.5466600000000028,
													2.3999999999999986
												],
												[
													-1.2266599999999954,
													0.4799999999999969
												],
												[
													-0.4266800000000046,
													0
												],
												[
													-2.0799999999999983,
													-0.2666600000000017
												],
												[
													0,
													0
												],
												[
													-1.2800000000000011,
													-0.7999999999999972
												],
												[
													-0.2053200000000004,
													-0.14544000000000068
												],
												[
													-3.9339899999999943,
													-2.7955499999999986
												],
												[
													-2.0799999999999983,
													0.42667000000000144
												],
												[
													-0.8533299999999997,
													0.42667000000000144
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-4.156170000000003,
													1.5452900000000014
												],
												[
													-1.9733299999999971,
													-0.7466599999999985
												],
												[
													0,
													-1.0133399999999995
												],
												[
													2.6666700000000034,
													-1.3333300000000001
												],
												[
													4.85333,
													-2.9333299999999998
												],
												[
													4.986289999999997,
													-1.52213
												],
												[
													0,
													0
												],
												[
													1.9733300000000042,
													0.74667
												],
												[
													0.7999999999999972,
													0.05332999999999988
												],
												[
													0.08889000000000635,
													-0.07676000000000016
												],
												[
													1.0861500000000035,
													-0.9417800000000001
												],
												[
													2.826660000000004,
													-1.38667
												],
												[
													1.7600000000000051,
													1.12
												],
												[
													0,
													0
												],
												[
													3.0400000000000063,
													3.6799999999999997
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													87.3385,
													31.5917
												],
												[
													87.5292,
													31.5194
												],
												[
													87.4759,
													31.6794
												],
												[
													96.2226,
													25.4394
												],
												[
													87.2626,
													11.2527
												],
												[
													86.3559,
													10.1327
												],
												[
													84.2226,
													7.8394
												],
												[
													83.9026,
													7.6261
												],
												[
													83.1918,
													8.0078
												],
												[
													82.516,
													8.3195
												],
												[
													80.3295,
													9.9727
												],
												[
													80.2591,
													10.0339
												],
												[
													71.5294,
													13.8662
												],
												[
													64.2871,
													11.8912
												],
												[
													64.0094,
													11.7862
												],
												[
													55.4227,
													10.3462
												],
												[
													43.0494,
													16.8529
												],
												[
													42.1487,
													17.394
												],
												[
													35.8494,
													21.0662
												],
												[
													37.9827,
													22.0795
												],
												[
													46.6256,
													20.1889
												],
												[
													46.996,
													20.0529
												],
												[
													47.8493,
													19.7329
												],
												[
													49.7415,
													18.9329
												],
												[
													50.4627,
													18.6129
												],
												[
													50.7682,
													18.4765
												],
												[
													56.3827,
													16.6395
												],
												[
													58.2494,
													16.4262
												],
												[
													76.1161,
													25.1195
												],
												[
													80.2761,
													27.9995
												],
												[
													81.2361,
													28.5862
												],
												[
													81.6338,
													28.8331
												],
												[
													86.6227,
													31.7329
												],
												[
													87.1027,
													31.7329
												],
												[
													87.3387,
													31.5919
												],
												[
													87.3385,
													31.5917
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.0683,
													0.0273
												],
												[
													0,
													0
												],
												[
													-1.76,
													1.6533
												],
												[
													2.8267,
													3.4667
												],
												[
													0,
													0
												],
												[
													0.3556,
													0.2133
												],
												[
													0,
													0
												],
												[
													0.4488,
													-0.2042
												],
												[
													0.2656,
													-0.125
												],
												[
													0.8,
													-0.6933
												],
												[
													0,
													0
												],
												[
													3.9539,
													0.3163
												],
												[
													2.3117,
													0.8745
												],
												[
													0.0925,
													0.0349
												],
												[
													2.6133,
													-0.8
												],
												[
													4.48,
													-2.72
												],
												[
													0.3009,
													-0.1808
												],
												[
													2.0538,
													-1.1203
												],
												[
													-0.8,
													-0.2667
												],
												[
													-2.3384,
													0.8601
												],
												[
													-0.1158,
													0.0424
												],
												[
													0,
													0
												],
												[
													-0.5358,
													0.2417
												],
												[
													-0.2364,
													0.1013
												],
												[
													-0.1027,
													0.0459
												],
												[
													-2.7273,
													0.5455
												],
												[
													-0.64,
													0
												],
												[
													-5.44,
													-3.9467
												],
												[
													-1.1733,
													-0.7467
												],
												[
													0,
													0
												],
												[
													-0.1515,
													-0.0941
												],
												[
													-0.8638,
													-0.336
												],
												[
													0,
													0
												],
												[
													-0.1677,
													0.0617
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.0576899999999938,
													-0.02120999999999995
												],
												[
													0,
													0
												],
												[
													1.2266699999999986,
													-0.5866700000000016
												],
												[
													-0.6399899999999974,
													-1.5466699999999989
												],
												[
													0,
													0
												],
												[
													-1.066670000000002,
													-1.31555
												],
												[
													0,
													0
												],
												[
													-0.03771000000000413,
													0.07542000000000026
												],
												[
													-0.18589000000000055,
													0.08458000000000077
												],
												[
													-0.5866299999999995,
													0.2666500000000003
												],
												[
													0,
													0
												],
												[
													-2.020390000000006,
													1.7550600000000003
												],
												[
													-2.563910000000007,
													-0.20510999999999946
												],
												[
													-0.09264000000000294,
													-0.035050000000000026
												],
												[
													-3.200000000000003,
													-1.2266700000000004
												],
												[
													-3.2533299999999983,
													1.0133299999999998
												],
												[
													-0.29950999999999794,
													0.17971000000000004
												],
												[
													-2.109960000000001,
													1.2683099999999996
												],
												[
													0.6400000000000006,
													0.3733299999999993
												],
												[
													1.7172699999999992,
													0.6566100000000006
												],
												[
													0.13080999999999676,
													-0.04811000000000121
												],
												[
													0,
													0
												],
												[
													0.7653600000000012,
													-0.2915600000000005
												],
												[
													0.24828999999999724,
													-0.11202000000000112
												],
												[
													0.10116000000000014,
													-0.04495999999999967
												],
												[
													1.3586499999999972,
													-0.6077499999999993
												],
												[
													0.586660000000002,
													-0.16000000000000014
												],
												[
													5.759999999999998,
													0
												],
												[
													1.546670000000006,
													1.120000000000001
												],
												[
													0,
													0
												],
												[
													0.11216000000000292,
													0.06943000000000055
												],
												[
													1.3610400000000027,
													0.8459000000000003
												],
												[
													0,
													0
												],
												[
													-0.03967000000000098,
													-0.039680000000000604
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													83.9552,
													44.4282
												],
												[
													88.3819,
													41.5482
												],
												[
													88.4886,
													41.4949
												],
												[
													91.3686,
													45.9216
												],
												[
													85.0219,
													53.9749
												],
												[
													76.1686,
													63.7349
												],
												[
													70.5153,
													70.2416
												],
												[
													62.782,
													72.0016
												],
												[
													50.7287,
													77.6016
												],
												[
													46.5154,
													76.8549
												],
												[
													21.8221,
													60.2682
												],
												[
													1.4488,
													32.5349
												],
												[
													1.9288,
													22.0282
												],
												[
													15.7955,
													4.3749
												],
												[
													25.4488,
													1.2282
												],
												[
													30.6755,
													2.5082
												],
												[
													31.7324,
													2.6924
												],
												[
													32.8089,
													2.8815
												],
												[
													36.0089,
													7.0948
												],
												[
													31.7956,
													10.2948
												],
												[
													29.2356,
													9.8681
												],
												[
													23.4756,
													8.4814
												],
												[
													21.6623,
													9.0681
												],
												[
													7.7956,
													26.7214
												],
												[
													7.6889,
													28.4814
												],
												[
													27.2622,
													55.1481
												],
												[
													49.5022,
													70.0281
												],
												[
													56.1155,
													68.2681
												],
												[
													47.4755,
													62.5081
												],
												[
													46.4622,
													57.3348
												],
												[
													51.6355,
													56.3215
												],
												[
													62.3555,
													63.4682
												],
												[
													63.4222,
													64.5882
												],
												[
													66.7822,
													63.8415
												],
												[
													68.8622,
													61.6548
												],
												[
													54.1422,
													51.8415
												],
												[
													53.1289,
													46.6682
												],
												[
													58.3022,
													45.6549
												],
												[
													73.7689,
													56.0016
												],
												[
													74.1459,
													56.3674
												],
												[
													74.3022,
													56.5349
												],
												[
													77.6622,
													52.4282
												],
												[
													59.3155,
													40.2149
												],
												[
													58.2488,
													35.0416
												],
												[
													63.4221,
													33.9749
												],
												[
													82.6221,
													46.7749
												],
												[
													83.9554,
													44.4282
												],
												[
													83.9552,
													44.4282
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-2.0267,
													-0.4267
												],
												[
													0,
													0
												],
												[
													0.4267,
													-2.0267
												],
												[
													3.1467,
													-1.4933
												],
												[
													4.7467,
													-1.5467
												],
												[
													2.56,
													-1.4933
												],
												[
													2.72,
													0.2133
												],
												[
													4.48,
													0
												],
												[
													1.3333,
													0.48
												],
												[
													8.4267,
													8.8533
												],
												[
													4.96,
													7.5733
												],
												[
													-2.4,
													3.04
												],
												[
													0,
													0
												],
												[
													-3.5733,
													-0.96
												],
												[
													-1.5467,
													-0.32
												],
												[
													-0.313,
													-0.0542
												],
												[
													-0.3294,
													-0.0599
												],
												[
													0.2667,
													-2.0267
												],
												[
													2.0267,
													0.2667
												],
												[
													1.0667,
													0.2133
												],
												[
													1.8133,
													0.48
												],
												[
													0.4267,
													-0.5333
												],
												[
													0,
													0
												],
												[
													-0.3733,
													-0.5333
												],
												[
													-6.0267,
													-6.2933
												],
												[
													-0.16,
													-0.0533
												],
												[
													-1.8667,
													1.4933
												],
												[
													0,
													0
												],
												[
													-1.12,
													1.7067
												],
												[
													-1.7067,
													-1.12
												],
												[
													0,
													0
												],
												[
													-0.2667,
													-0.4267
												],
												[
													-0.7467,
													0.4267
												],
												[
													-0.5333,
													0.9067
												],
												[
													0,
													0
												],
												[
													-1.12,
													1.7067
												],
												[
													-1.7067,
													-1.1733
												],
												[
													0,
													0
												],
												[
													-0.1122,
													-0.1243
												],
												[
													-0.0515,
													-0.0515
												],
												[
													-0.4267,
													2.08
												],
												[
													0,
													0
												],
												[
													-1.12,
													1.7067
												],
												[
													-1.7067,
													-1.12
												],
												[
													0,
													0
												],
												[
													-0.2133,
													1.12
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.42667000000000144,
													-2.026670000000003
												],
												[
													0,
													0
												],
												[
													2.026660000000007,
													0.42667000000000144
												],
												[
													-0.9066700000000054,
													4.373330000000003
												],
												[
													-1.0133399999999995,
													4.85333
												],
												[
													-1.1200000000000045,
													2.719990000000003
												],
												[
													-2.34666,
													1.3333300000000037
												],
												[
													-2.719999999999999,
													3.413330000000002
												],
												[
													-1.4399999999999977,
													0
												],
												[
													-0.9066699999999983,
													-0.4266800000000046
												],
												[
													-6.1866699999999994,
													-6.50667
												],
												[
													-2.08,
													-3.2533299999999983
												],
												[
													0,
													0
												],
												[
													2.293330000000001,
													-2.88
												],
												[
													1.6533300000000004,
													0.48
												],
												[
													0.3975599999999986,
													0.07016
												],
												[
													0.40082000000000306,
													0.06933999999999996
												],
												[
													2.0799999999999983,
													0.26666999999999996
												],
												[
													-0.26666999999999774,
													2.080000000000001
												],
												[
													-0.7466700000000017,
													-0.10666999999999938
												],
												[
													-1.706669999999999,
													-0.3200000000000003
												],
												[
													-0.6933299999999996,
													-0.16000000000000014
												],
												[
													0,
													0
												],
												[
													-0.42666999999999966,
													0.4800000000000004
												],
												[
													3.8933300000000006,
													5.920000000000002
												],
												[
													7.466670000000001,
													7.840000000000003
												],
												[
													1.7066700000000026,
													0.6400000000000006
												],
												[
													0,
													0
												],
												[
													-1.7066700000000026,
													-1.1199999999999974
												],
												[
													1.1199999999999974,
													-1.7066799999999986
												],
												[
													0,
													0
												],
												[
													0.42667000000000144,
													0.32001000000000346
												],
												[
													1.4400000000000048,
													0.10666000000000508
												],
												[
													0.8533299999999997,
													-0.5333299999999994
												],
												[
													0,
													0
												],
												[
													-1.7066700000000026,
													-1.1199999999999974
												],
												[
													1.1199999999999974,
													-1.7066700000000026
												],
												[
													0,
													0
												],
												[
													0.1446600000000018,
													0.1084900000000033
												],
												[
													0.05328000000000088,
													0.0589999999999975
												],
												[
													1.8666699999999992,
													-0.6933300000000031
												],
												[
													0,
													0
												],
												[
													-1.759999999999998,
													-1.1199999999999974
												],
												[
													1.1199999999999974,
													-1.759999999999998
												],
												[
													0,
													0
												],
												[
													0.7999999999999972,
													-0.586660000000002
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers$5 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "deal2",
			refId: "moljey3mpqxmgyrl",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 128,
			h: 128,
			ip: 0,
			op: 120,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$5 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var handshakeAnimation = {
		fr: fr$5,
		v: v$5,
		ip: ip$5,
		op: op$5,
		w: w$5,
		h: h$5,
		nm: nm$5,
		ddd: ddd$5,
		markers: markers$5,
		assets: assets$5,
		layers: layers$5,
		meta: meta$5
	};

	var fr$4 = 60;
	var v$4 = "5.9.6";
	var ip$4 = 0;
	var op$4 = 299;
	var w$4 = 32;
	var h$4 = 32;
	var nm$4 = "book";
	var ddd$4 = 0;
	var markers$4 = [
	];
	var assets$4 = [
		{
			nm: "[FRAME] book - Null / close - Null / Icon - Null / Icon",
			fr: 60,
			id: "molj2yq748895qfg",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 27,
					hd: false,
					nm: "book - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 28,
					hd: false,
					nm: "close - Null",
					sr: 1,
					parent: 27,
					ks: {
						a: {
							a: 0,
							k: [
								16,
								16
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								16,
								16
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 29,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 28,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								15,
								9.5
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 30,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 29,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 5,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: false,
											v: [
												[
													1.0001,
													15.8
												],
												[
													0.0043,
													14.4846
												],
												[
													0,
													14.3259
												],
												[
													0,
													1.8905
												],
												[
													1.0001,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.0476,
													0.7825
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-0.6637,
													0
												]
											],
											o: [
												[
													-0.66371,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-1.06873
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: false,
											v: [
												[
													1.0001,
													15.8
												],
												[
													1.0001,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: false,
											v: [
												[
													1.0001,
													15.8
												],
												[
													1.9957,
													14.4844
												],
												[
													2,
													14.3257
												],
												[
													2,
													1.8903
												],
												[
													1.0001,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.0476,
													0.7825
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.6637,
													0
												]
											],
											o: [
												[
													0.66371,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-19999999999997797e-20,
													-1.06873
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.3215686274509804,
											0.7372549019607844,
											0.7372549019607844,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "[FRAME] book - Null / open - Null / Icon - Null / Icon",
			fr: 60,
			id: "molj2yq9azfigxyh",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 31,
					hd: false,
					nm: "book - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 32,
					hd: false,
					nm: "open - Null",
					sr: 1,
					parent: 31,
					ks: {
						a: {
							a: 0,
							k: [
								16,
								16
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								16,
								16
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										9,
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 89.46600000000001,
									s: [
										100,
										100
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 33,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 32,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								5.3379,
								6.748
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 34,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 33,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 9,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													4.0938,
													9.045
												],
												[
													6.0743,
													9.5541
												],
												[
													8.0574,
													10.2403
												],
												[
													8.5978,
													11.4447
												],
												[
													7.3934,
													11.9851
												],
												[
													5.5392,
													11.3432
												],
												[
													3.6798,
													10.8653
												],
												[
													2.9767,
													9.7481
												],
												[
													4.0939,
													9.045
												],
												[
													4.0938,
													9.045
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.6027,
													-0.1802
												],
												[
													-0.6714,
													-0.2557
												],
												[
													0.1835,
													-0.4817
												],
												[
													0.4815,
													0.1832
												],
												[
													0.5647,
													0.1689
												],
												[
													0.665,
													0.1514
												],
												[
													-0.1141,
													0.5024
												],
												[
													-0.5025,
													-0.1141
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.6858500000000003,
													0.1561199999999996
												],
												[
													0.6246099999999997,
													0.1868300000000005
												],
												[
													0.48171999999999926,
													0.18345000000000056
												],
												[
													-0.18356999999999957,
													0.4813299999999998
												],
												[
													-0.6483100000000004,
													-0.2468900000000005
												],
												[
													-0.5472799999999998,
													-0.16367999999999938
												],
												[
													-0.5023400000000002,
													-0.11447000000000074
												],
												[
													0.11437000000000008,
													-0.50244
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													4.0938,
													5.7208
												],
												[
													6.0743,
													6.2299
												],
												[
													8.0574,
													6.9161
												],
												[
													8.5978,
													8.1205
												],
												[
													7.3934,
													8.6609
												],
												[
													5.5392,
													8.019
												],
												[
													3.6798,
													7.5411
												],
												[
													2.9767,
													6.4239
												],
												[
													4.0939,
													5.7208
												],
												[
													4.0938,
													5.7208
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.6026,
													-0.1802
												],
												[
													-0.6713,
													-0.2557
												],
												[
													0.1833,
													-0.4817
												],
												[
													0.4816,
													0.1832
												],
												[
													0.5647,
													0.1689
												],
												[
													0.665,
													0.1514
												],
												[
													-0.1143,
													0.5024
												],
												[
													-0.5023,
													-0.114
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.68581,
													0.15610999999999997
												],
												[
													0.6245599999999998,
													0.18681000000000036
												],
												[
													0.4816699999999994,
													0.18343000000000043
												],
												[
													-0.18347999999999942,
													0.48149000000000086
												],
												[
													-0.6482599999999996,
													-0.24686999999999948
												],
												[
													-0.54725,
													-0.16366999999999976
												],
												[
													-0.5023599999999999,
													-0.11453000000000024
												],
												[
													0.11445000000000016,
													-0.5023
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													17.2305,
													9.045
												],
												[
													18.3477,
													9.7481
												],
												[
													17.6446,
													10.8653
												],
												[
													15.7852,
													11.3432
												],
												[
													13.931,
													11.9851
												],
												[
													12.7266,
													11.4447
												],
												[
													13.267,
													10.2403
												],
												[
													15.2501,
													9.5541
												],
												[
													17.2306,
													9.045
												],
												[
													17.2305,
													9.045
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.1144,
													-0.5024
												],
												[
													0.5023,
													-0.1145
												],
												[
													0.5473,
													-0.1637
												],
												[
													0.6483,
													-0.2469
												],
												[
													0.1836,
													0.4813
												],
												[
													-0.4817,
													0.1835
												],
												[
													-0.6246,
													0.1868
												],
												[
													-0.6859,
													0.1561
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.50244,
													-0.11408999999999914
												],
												[
													0.11411000000000016,
													0.5023900000000001
												],
												[
													-0.6649999999999991,
													0.15137
												],
												[
													-0.5647300000000008,
													0.16891999999999996
												],
												[
													-0.4815000000000005,
													0.1831700000000005
												],
												[
													-0.18345000000000056,
													-0.48171999999999926
												],
												[
													0.6713900000000006,
													-0.2556799999999999
												],
												[
													0.6026699999999998,
													-0.18024999999999913
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													17.2305,
													5.7208
												],
												[
													18.3477,
													6.4239
												],
												[
													17.6446,
													7.5411
												],
												[
													15.7852,
													8.019
												],
												[
													13.931,
													8.6609
												],
												[
													12.7266,
													8.1205
												],
												[
													13.267,
													6.9161
												],
												[
													15.2501,
													6.2299
												],
												[
													17.2306,
													5.7208
												],
												[
													17.2305,
													5.7208
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.1145,
													-0.5023
												],
												[
													0.5024,
													-0.1145
												],
												[
													0.5473,
													-0.1637
												],
												[
													0.6483,
													-0.2469
												],
												[
													0.1835,
													0.4815
												],
												[
													-0.4817,
													0.1834
												],
												[
													-0.6246,
													0.1868
												],
												[
													-0.6858,
													0.1561
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.5023499999999999,
													-0.11401000000000039
												],
												[
													0.11426000000000158,
													0.50244
												],
												[
													-0.664950000000001,
													0.15136000000000038
												],
												[
													-0.5646900000000006,
													0.16890000000000072
												],
												[
													-0.4815699999999996,
													0.18319999999999936
												],
												[
													-0.1833399999999994,
													-0.4816799999999999
												],
												[
													0.6713500000000003,
													-0.2556599999999998
												],
												[
													0.6026399999999992,
													-0.1802400000000004
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													19.3151,
													0.032
												],
												[
													21.3242,
													1.7078
												],
												[
													21.3242,
													14.157
												],
												[
													21.3177,
													14.3159
												],
												[
													19.8633,
													15.8901
												],
												[
													18.8425,
													16.0841
												],
												[
													15.517,
													16.8693
												],
												[
													15.0535,
													17.0151
												],
												[
													11.6486,
													18.3354
												],
												[
													11.4624,
													18.3966
												],
												[
													11.4207,
													18.407
												],
												[
													11.3191,
													18.4291
												],
												[
													10.6629,
													18.5007
												],
												[
													9.9975,
													18.4291
												],
												[
													9.9832,
													18.4252
												],
												[
													9.8569,
													18.3966
												],
												[
													9.7046,
													18.3445
												],
												[
													9.6317,
													18.3211
												],
												[
													9.5979,
													18.3016
												],
												[
													6.2711,
													17.0151
												],
												[
													5.8076,
													16.8693
												],
												[
													2.4821,
													16.0841
												],
												[
													1.4613,
													15.8901
												],
												[
													0.0069,
													14.3159
												],
												[
													0.0004,
													14.1571
												],
												[
													0.0004,
													1.7079
												],
												[
													2.0095,
													0.0321
												],
												[
													5.8077,
													0.9201
												],
												[
													10.6619,
													2.799
												],
												[
													15.5174,
													0.9201
												],
												[
													19.3156,
													0.0321
												],
												[
													19.3151,
													0.032
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-3e-4,
													-1.0699
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.787,
													-0.1433
												],
												[
													0,
													0
												],
												[
													0.9817,
													-0.2955
												],
												[
													0,
													0
												],
												[
													1.0232,
													-0.4383
												],
												[
													0.0621,
													-0.0168
												],
												[
													0.0138,
													-38e-4
												],
												[
													0.034,
													-54e-4
												],
												[
													0.1776,
													0.0007
												],
												[
													0.2319,
													0.0497
												],
												[
													0.0048,
													0.0009
												],
												[
													0.0415,
													0.0116
												],
												[
													0.0506,
													0.0204
												],
												[
													0.0233,
													0.0099
												],
												[
													0.0117,
													0.0055
												],
												[
													1.08,
													0.3557
												],
												[
													0,
													0
												],
												[
													1.0906,
													0.2148
												],
												[
													0,
													0
												],
												[
													0.0717,
													0.7834
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-1.05,
													-0.2056
												],
												[
													-1.1249,
													-0.3365
												],
												[
													-1.1835,
													-0.5213
												],
												[
													-1.5895,
													0.4755
												],
												[
													-1.1871,
													0.2325
												],
												[
													0,
													0
												]
											],
											o: [
												[
													1.0500399999999992,
													-0.20558
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-0.07169999999999987,
													0.7834000000000003
												],
												[
													0,
													0
												],
												[
													-1.0905799999999992,
													0.21474999999999866
												],
												[
													0,
													0
												],
												[
													-1.1080199999999998,
													0.3649099999999983
												],
												[
													-0.06131000000000064,
													0.026250000000000995
												],
												[
													-0.013719999999999288,
													0.00414999999999921
												],
												[
													-0.03401999999999994,
													0.008079999999999643
												],
												[
													-0.24025999999999925,
													0.054059999999999775
												],
												[
													-0.19669999999999987,
													-7599999999996498e-19
												],
												[
													-0.004860000000000753,
													-8000000000016882e-19
												],
												[
													-0.04224999999999923,
													-0.009309999999999263
												],
												[
													-0.051109999999999545,
													-0.014050000000001006
												],
												[
													-0.02401000000000053,
													-0.008890000000000953
												],
												[
													-0.012010000000000076,
													-0.005079999999999529
												],
												[
													-1.0093700000000005,
													-0.43100000000000094
												],
												[
													0,
													0
												],
												[
													-0.9817099999999996,
													-0.2954700000000017
												],
												[
													0,
													0
												],
												[
													-0.78702,
													-0.14333000000000062
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.00029000000000000006,
													-1.06991
												],
												[
													1.1871,
													0.2325
												],
												[
													1.5890399999999998,
													0.4753200000000001
												],
												[
													1.1833299999999998,
													-0.5212599999999998
												],
												[
													1.1248899999999988,
													-0.33646999999999994
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.8659,
													14.0672
												],
												[
													6.3451,
													15.0815
												],
												[
													9.724,
													16.3315
												],
												[
													9.724,
													4.4252
												],
												[
													5.2722,
													2.7091
												],
												[
													1.8659,
													1.907
												],
												[
													1.8659,
													14.0672
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.3915,
													-0.4188
												],
												[
													-1.064,
													-0.4423
												],
												[
													0,
													0
												],
												[
													1.4035,
													0.4198
												],
												[
													1.1308,
													0.2249
												],
												[
													0,
													0
												]
											],
											o: [
												[
													1.2499500000000001,
													0.22865999999999964
												],
												[
													1.0682799999999997,
													0.3215299999999992
												],
												[
													0,
													0
												],
												[
													-1.1797699999999995,
													-0.51553
												],
												[
													-0.9706900000000003,
													-0.29034000000000004
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													19.4583,
													1.907
												],
												[
													16.0521,
													2.7091
												],
												[
													11.6003,
													4.4253
												],
												[
													11.6003,
													16.3316
												],
												[
													14.9792,
													15.0816
												],
												[
													19.4584,
													14.0673
												],
												[
													19.4583,
													1.907
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.9707,
													-0.2903
												],
												[
													1.1798,
													-0.5155
												],
												[
													0,
													0
												],
												[
													-1.0683,
													0.3215
												],
												[
													-1.25,
													0.2287
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-1.130790000000001,
													0.22492
												],
												[
													-1.40348,
													0.41981
												],
												[
													0,
													0
												],
												[
													1.0640400000000003,
													-0.44233999999999973
												],
												[
													1.3914799999999996,
													-0.41878999999999955
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.3215686274509804,
											0.7372549019607844,
											0.7372549019607844,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "[FRAME] book - Null / close / open",
			fr: 60,
			id: "molj2yq7ffok86id",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 35,
					hd: false,
					nm: "book - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 36,
					ty: 0,
					nm: "close",
					refId: "molj2yq748895qfg",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 32,
					h: 32,
					ip: 0,
					op: 300,
					st: 0,
					hd: false,
					bm: 0
				},
				{
					ddd: 0,
					ind: 37,
					ty: 0,
					nm: "open",
					refId: "molj2yq9azfigxyh",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 32,
					h: 32,
					ip: 0,
					op: 300,
					st: 0,
					hd: false,
					bm: 0
				}
			]
		}
	];
	var layers$4 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "book",
			refId: "molj2yq7ffok86id",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 32,
			h: 32,
			ip: 0,
			op: 300,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$4 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var readAnimation = {
		fr: fr$4,
		v: v$4,
		ip: ip$4,
		op: op$4,
		w: w$4,
		h: h$4,
		nm: nm$4,
		ddd: ddd$4,
		markers: markers$4,
		assets: assets$4,
		layers: layers$4,
		meta: meta$4
	};

	var fr$3 = 60;
	var v$3 = "5.9.6";
	var ip$3 = 0;
	var op$3 = 299;
	var w$3 = 32;
	var h$3 = 32;
	var nm$3 = "settings main";
	var ddd$3 = 0;
	var markers$3 = [
	];
	var assets$3 = [
		{
			nm: "[FRAME] settings main - Null / Vector - Null / Vector / Icon - Null / Icon",
			fr: 60,
			id: "molj3m7sf0df582x",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "settings main - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "Vector - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								12.4215,
								16
							]
						},
						o: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 89.77799999999999,
									s: [
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 96.192,
									s: [
										0
									]
								}
							]
						},
						p: {
							a: 0,
							k: [
								16.0215,
								16
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										-180
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 44.988,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 89.646,
									s: [
										-180
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "Vector",
					sr: 1,
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 89.77799999999999,
									s: [
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 96.192,
									s: [
										0
									]
								}
							]
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													24.4887,
													24.58
												],
												[
													24.6942,
													25.6833
												],
												[
													19.4032,
													30.208
												],
												[
													12.6758,
													31.9995
												],
												[
													11.8837,
													31.2045
												],
												[
													12.6992,
													30.3894
												],
												[
													18.6552,
													28.7847
												],
												[
													23.3548,
													24.7894
												],
												[
													24.4887,
													24.58
												],
												[
													24.4887,
													24.58
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.2651,
													-0.3562
												],
												[
													2.0831,
													-1.0948
												],
												[
													2.3449,
													-0.0859
												],
												[
													-65e-4,
													0.444
												],
												[
													-0.4436,
													0.0189
												],
												[
													-1.8453,
													0.9698
												],
												[
													-1.2502,
													1.6599
												],
												[
													-0.3693,
													-0.2465
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.3693300000000015,
													0.24646999999999863
												],
												[
													-1.4006900000000009,
													1.88251
												],
												[
													-2.0831000000000017,
													1.0947500000000012
												],
												[
													-0.4437200000000008,
													0.016259999999999053
												],
												[
													0.006479999999999819,
													-0.4439799999999998
												],
												[
													2.07615,
													-0.08823999999999899
												],
												[
													1.8453400000000002,
													-0.9697999999999993
												],
												[
													0.26713000000000164,
													-0.35467999999999833
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0.3544,
													7.43
												],
												[
													0.1489,
													6.3267
												],
												[
													5.7135,
													1.6616
												],
												[
													12.7823,
													0.0001
												],
												[
													13.5427,
													0.8256
												],
												[
													12.6959,
													1.6081
												],
												[
													6.4336,
													3.0994
												],
												[
													1.4884,
													7.2207
												],
												[
													0.3545,
													7.4301
												],
												[
													0.3544,
													7.43
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.2651,
													0.3562
												],
												[
													-2.1973,
													1.1004
												],
												[
													-2.45,
													-63e-4
												],
												[
													0.0239,
													-0.4434
												],
												[
													0.444,
													-15e-4
												],
												[
													1.9476,
													-0.9753
												],
												[
													1.3061,
													-1.7341
												],
												[
													0.3693,
													0.2465
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-0.36933,
													-0.2464700000000004
												],
												[
													1.46251,
													-1.9656000000000002
												],
												[
													2.19731,
													-1.10038
												],
												[
													0.4440200000000001,
													0.00114
												],
												[
													-0.023870000000000502,
													0.44338
												],
												[
													-2.1708999999999996,
													0.007130000000000081
												],
												[
													-1.94759,
													0.97532
												],
												[
													-0.26712999999999987,
													0.3546800000000001
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								10,
								10
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								16,
								16
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 45.437999999999995,
									s: [
										-180
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 89.646,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										100,
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 89.77799999999999,
									s: [
										100,
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 119.868,
									s: [
										110.00000000000001,
										110.00000000000001
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 300,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 6,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													8.9897,
													5.475
												],
												[
													14.5168,
													11.0016
												],
												[
													11.0016,
													14.5167
												],
												[
													5.475,
													8.9899
												],
												[
													6.7549,
													6.755
												],
												[
													8.9897,
													5.475
												],
												[
													8.9897,
													5.475
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.7085,
													-3.3309
												],
												[
													1.7592,
													-0.3741
												],
												[
													-0.7085,
													3.33
												],
												[
													-0.6071,
													0.6072
												],
												[
													-0.8407,
													0.1789
												],
												[
													0,
													0
												]
											],
											o: [
												[
													3.3301099999999995,
													-0.7087900000000005
												],
												[
													-0.37423000000000073,
													1.7591800000000006
												],
												[
													-3.3306900000000006,
													0.7083499999999994
												],
												[
													0.17886999999999986,
													-0.8406400000000005
												],
												[
													0.6071299999999997,
													-0.60717
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													12.89,
													10.6556
												],
												[
													9.3359,
													7.1017
												],
												[
													7.931,
													7.931
												],
												[
													7.1018,
													9.336
												],
												[
													10.6556,
													12.89
												],
												[
													12.8901,
													10.6556
												],
												[
													12.89,
													10.6556
												]
											],
											i: [
												[
													0,
													0
												],
												[
													2.1522,
													-0.4581
												],
												[
													0.4371,
													-0.4371
												],
												[
													0.0969,
													-0.4555
												],
												[
													-2.1527,
													0.4578
												],
												[
													-0.2376,
													1.1169
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.45791000000000004,
													-2.1528100000000006
												],
												[
													-0.4555199999999999,
													0.09694000000000003
												],
												[
													-0.43710999999999967,
													0.4371300000000007
												],
												[
													-0.45791000000000004,
													2.1522000000000006
												],
												[
													1.1168399999999998,
													-0.23751000000000033
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													8.9383,
													0.055
												],
												[
													11.0715,
													0.0568
												],
												[
													12.6616,
													1.412
												],
												[
													12.8371,
													2.0075
												],
												[
													13.0889,
													2.2516
												],
												[
													13.2942,
													2.3368
												],
												[
													13.6449,
													2.3424
												],
												[
													14.1891,
													2.046
												],
												[
													16.2715,
													2.2116
												],
												[
													17.7884,
													3.7286
												],
												[
													17.954,
													5.8109
												],
												[
													17.6574,
													6.3554
												],
												[
													17.663,
													6.7061
												],
												[
													17.748,
													6.911
												],
												[
													17.9921,
													7.1628
												],
												[
													18.5878,
													7.3384
												],
												[
													19.943,
													8.9286
												],
												[
													19.9448,
													11.0618
												],
												[
													18.5865,
													12.6625
												],
												[
													18.0126,
													12.8317
												],
												[
													17.7666,
													13.0883
												],
												[
													17.6739,
													13.316
												],
												[
													17.669,
													13.6664
												],
												[
													17.9723,
													14.2232
												],
												[
													17.8081,
													16.3031
												],
												[
													16.3024,
													17.8087
												],
												[
													14.2226,
													17.9729
												],
												[
													13.666,
													17.6697
												],
												[
													13.3156,
													17.6746
												],
												[
													13.0878,
													17.7673
												],
												[
													12.8311,
													18.0133
												],
												[
													12.6621,
													18.5867
												],
												[
													11.0613,
													19.9451
												],
												[
													8.9277,
													19.9431
												],
												[
													7.3377,
													18.5879
												],
												[
													7.1623,
													17.9929
												],
												[
													6.9105,
													17.7488
												],
												[
													6.7055,
													17.6638
												],
												[
													6.3548,
													17.6582
												],
												[
													5.8111,
													17.9544
												],
												[
													3.7288,
													17.7888
												],
												[
													2.2114,
													16.2715
												],
												[
													2.0458,
													14.1892
												],
												[
													2.3418,
													13.6458
												],
												[
													2.3362,
													13.2951
												],
												[
													2.251,
													13.0897
												],
												[
													2.0069,
													12.8379
												],
												[
													1.4121,
													12.6626
												],
												[
													0.0569,
													11.0726
												],
												[
													0.0549,
													8.9391
												],
												[
													1.4132,
													7.3383
												],
												[
													2.0139,
													7.1613
												],
												[
													2.2655,
													6.9061
												],
												[
													2.3401,
													6.7396
												],
												[
													2.3526,
													6.3752
												],
												[
													2.0981,
													5.908
												],
												[
													2.2852,
													3.7935
												],
												[
													3.7924,
													2.2862
												],
												[
													5.907,
													2.099
												],
												[
													6.3743,
													2.3536
												],
												[
													6.7387,
													2.3411
												],
												[
													6.9051,
													2.2666
												],
												[
													7.1604,
													2.0149
												],
												[
													7.3376,
													1.4137
												],
												[
													8.9383,
													0.0554
												],
												[
													8.9383,
													0.055
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.6937,
													-0.074
												],
												[
													-0.2047,
													-0.6944
												],
												[
													0,
													0
												],
												[
													-0.1487,
													-0.0594
												],
												[
													-0.068,
													-0.0293
												],
												[
													-0.0768,
													0.0418
												],
												[
													0,
													0
												],
												[
													-0.6197,
													-0.4997
												],
												[
													-0.45,
													-0.5582
												],
												[
													0.3463,
													-0.6357
												],
												[
													0,
													0
												],
												[
													-0.0633,
													-0.1471
												],
												[
													-0.0275,
													-0.0688
												],
												[
													-0.0838,
													-0.0247
												],
												[
													0,
													0
												],
												[
													-0.0845,
													-0.792
												],
												[
													0.0751,
													-0.7258
												],
												[
													0.7,
													-0.2063
												],
												[
													0,
													0
												],
												[
													0.0592,
													-0.1519
												],
												[
													0.032,
													-0.0753
												],
												[
													-0.0416,
													-0.0763
												],
												[
													0,
													0
												],
												[
													0.4988,
													-0.6197
												],
												[
													0.5544,
													-0.4462
												],
												[
													0.6343,
													0.3455
												],
												[
													0,
													0
												],
												[
													0.1476,
													-0.0627
												],
												[
													0.0765,
													-0.0298
												],
												[
													0.0249,
													-0.0845
												],
												[
													0,
													0
												],
												[
													0.7945,
													-0.0821
												],
												[
													0.6938,
													0.0741
												],
												[
													0.2047,
													0.6943
												],
												[
													0,
													0
												],
												[
													0.1488,
													0.0594
												],
												[
													0.0679,
													0.0292
												],
												[
													0.0768,
													-0.0418
												],
												[
													0,
													0
												],
												[
													0.6197,
													0.4996
												],
												[
													0.4501,
													0.5583
												],
												[
													-0.3463,
													0.6357
												],
												[
													0,
													0
												],
												[
													0.0633,
													0.1471
												],
												[
													0.0275,
													0.0689
												],
												[
													0.0838,
													0.0247
												],
												[
													0,
													0
												],
												[
													0.0846,
													0.7919
												],
												[
													-0.075,
													0.7259
												],
												[
													-0.7,
													0.2063
												],
												[
													0,
													0
												],
												[
													-0.0667,
													0.1537
												],
												[
													-0.0256,
													0.0553
												],
												[
													0.0427,
													0.0785
												],
												[
													0,
													0
												],
												[
													-0.516,
													0.62
												],
												[
													-0.5453,
													0.454
												],
												[
													-0.6516,
													-0.3549
												],
												[
													0,
													0
												],
												[
													-0.1535,
													0.0709
												],
												[
													-0.0557,
													0.0242
												],
												[
													-0.024,
													0.0816
												],
												[
													0,
													0
												],
												[
													-0.7944,
													0.0822
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.7258099999999992,
													-0.07508
												],
												[
													0.7919599999999996,
													0.08450999999999999
												],
												[
													0,
													0
												],
												[
													0.024699999999999278,
													0.0838000000000001
												],
												[
													0.06891000000000069,
													0.027509999999999923
												],
												[
													0.14708000000000077,
													0.06334000000000017
												],
												[
													0,
													0
												],
												[
													0.6357199999999992,
													-0.3462799999999999
												],
												[
													0.5581500000000013,
													0.45001999999999986
												],
												[
													0.4996399999999994,
													0.6197099999999995
												],
												[
													0,
													0
												],
												[
													-0.0418200000000013,
													0.07678000000000029
												],
												[
													0.02920999999999907,
													0.06784999999999997
												],
												[
													0.059380000000000877,
													0.14876999999999985
												],
												[
													0,
													0
												],
												[
													0.6943899999999985,
													0.20467000000000013
												],
												[
													0.07401000000000124,
													0.6937099999999994
												],
												[
													-0.08217000000000141,
													0.7944499999999994
												],
												[
													0,
													0
												],
												[
													-0.08453000000000088,
													0.02491999999999983
												],
												[
													-0.029800000000001603,
													0.07647000000000048
												],
												[
													-0.06268000000000029,
													0.14756999999999998
												],
												[
													0,
													0
												],
												[
													0.3455300000000001,
													0.6343399999999999
												],
												[
													-0.44624999999999915,
													0.5544100000000007
												],
												[
													-0.6197099999999995,
													0.49872999999999834
												],
												[
													0,
													0
												],
												[
													-0.0763499999999997,
													-0.04158999999999935
												],
												[
													-0.07535000000000025,
													0.03200000000000003
												],
												[
													-0.1519200000000005,
													0.059200000000000585
												],
												[
													0,
													0
												],
												[
													-0.20634000000000086,
													0.700050000000001
												],
												[
													-0.7259799999999998,
													0.07505000000000095
												],
												[
													-0.7919,
													-0.08455999999999975
												],
												[
													0,
													0
												],
												[
													-0.024700000000000166,
													-0.0838000000000001
												],
												[
													-0.06880000000000042,
													-0.027460000000001372
												],
												[
													-0.14707000000000026,
													-0.06332000000000093
												],
												[
													0,
													0
												],
												[
													-0.6356900000000003,
													0.3462600000000009
												],
												[
													-0.5583300000000002,
													-0.4501199999999983
												],
												[
													-0.49963,
													-0.6197099999999995
												],
												[
													0,
													0
												],
												[
													0.041830000000000034,
													-0.0767900000000008
												],
												[
													-0.029290000000000038,
													-0.06800999999999924
												],
												[
													-0.05937999999999999,
													-0.14874999999999972
												],
												[
													0,
													0
												],
												[
													-0.69431,
													-0.2046499999999991
												],
												[
													-0.0741,
													-0.6938300000000002
												],
												[
													0.08212999999999998,
													-0.7944999999999993
												],
												[
													0,
													0
												],
												[
													0.08156000000000008,
													-0.024040000000000283
												],
												[
													0.02416000000000018,
													-0.05571000000000037
												],
												[
													0.07095999999999991,
													-0.1534399999999998
												],
												[
													0,
													0
												],
												[
													-0.3549199999999999,
													-0.65158
												],
												[
													0.4539599999999999,
													-0.5453900000000003
												],
												[
													0.6199800000000004,
													-0.51614
												],
												[
													0,
													0
												],
												[
													0.07845999999999975,
													0.04274000000000022
												],
												[
													0.0552400000000004,
													-0.025539999999999896
												],
												[
													0.15373000000000037,
													-0.06666000000000016
												],
												[
													0,
													0
												],
												[
													0.20631999999999984,
													-0.69999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													10.895,
													1.7106
												],
												[
													9.1094,
													1.7093
												],
												[
													8.9329,
													1.8835
												],
												[
													8.7557,
													2.4847
												],
												[
													7.5668,
													3.792
												],
												[
													7.4368,
													3.8502
												],
												[
													5.5788,
													3.8137
												],
												[
													5.1115,
													3.5592
												],
												[
													4.8566,
													3.5641
												],
												[
													3.5636,
													4.8572
												],
												[
													3.5587,
													5.1121
												],
												[
													3.8132,
													5.5793
												],
												[
													3.8497,
													7.4374
												],
												[
													3.7915,
													7.5674
												],
												[
													2.4842,
													8.7563
												],
												[
													1.8835,
													8.9333
												],
												[
													1.7093,
													9.1098
												],
												[
													1.7107,
													10.8957
												],
												[
													1.8824,
													11.067
												],
												[
													2.4772,
													11.2423
												],
												[
													3.7957,
													12.4728
												],
												[
													3.8638,
													12.637
												],
												[
													3.8024,
													14.4411
												],
												[
													3.5064,
													14.9845
												],
												[
													3.5062,
													15.2274
												],
												[
													4.7727,
													16.4938
												],
												[
													5.0156,
													16.4936
												],
												[
													5.5593,
													16.1974
												],
												[
													7.3632,
													16.1359
												],
												[
													7.5271,
													16.2039
												],
												[
													8.7577,
													17.5225
												],
												[
													8.9331,
													18.1175
												],
												[
													9.1044,
													18.2892
												],
												[
													10.8904,
													18.2906
												],
												[
													11.0669,
													18.1164
												],
												[
													11.2359,
													17.543
												],
												[
													12.484,
													16.2175
												],
												[
													12.6655,
													16.1436
												],
												[
													14.4617,
													16.2089
												],
												[
													15.0183,
													16.5121
												],
												[
													15.2598,
													16.5128
												],
												[
													16.5127,
													15.26
												],
												[
													16.512,
													15.0185
												],
												[
													16.2087,
													14.4618
												],
												[
													16.1433,
													12.6657
												],
												[
													16.2172,
													12.4843
												],
												[
													17.5427,
													11.2362
												],
												[
													18.1166,
													11.067
												],
												[
													18.2908,
													10.8905
												],
												[
													18.2895,
													9.1049
												],
												[
													18.1178,
													8.9336
												],
												[
													17.5221,
													8.758
												],
												[
													16.2035,
													7.5274
												],
												[
													16.1355,
													7.3636
												],
												[
													16.197,
													5.5597
												],
												[
													16.4936,
													5.0152
												],
												[
													16.4938,
													4.7723
												],
												[
													15.2277,
													3.5062
												],
												[
													14.9848,
													3.5064
												],
												[
													14.4406,
													3.8028
												],
												[
													12.6365,
													3.8642
												],
												[
													12.4723,
													3.7961
												],
												[
													11.2418,
													2.4776
												],
												[
													11.0663,
													1.8821
												],
												[
													10.895,
													1.7104
												],
												[
													10.895,
													1.7106
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.6102,
													-0.0631
												],
												[
													0.0355,
													-0.1204
												],
												[
													0,
													0
												],
												[
													0.5276,
													-0.2288
												],
												[
													0.0433,
													-0.02
												],
												[
													0.6083,
													0.3313
												],
												[
													0,
													0
												],
												[
													0.0472,
													-0.0393
												],
												[
													0.3892,
													-0.4676
												],
												[
													-0.0603,
													-0.1107
												],
												[
													0,
													0
												],
												[
													0.2573,
													-0.5564
												],
												[
													0.0188,
													-0.0434
												],
												[
													0.6307,
													-0.1859
												],
												[
													0,
													0
												],
												[
													0.0058,
													-0.0563
												],
												[
													-0.0618,
													-0.5784
												],
												[
													-0.1203,
													-0.0354
												],
												[
													0,
													0
												],
												[
													-0.2207,
													-0.5528
												],
												[
													-0.0234,
													-0.0544
												],
												[
													0.3198,
													-0.5872
												],
												[
													0,
													0
												],
												[
													-0.0334,
													-0.0414
												],
												[
													-0.466,
													-0.3757
												],
												[
													-0.11,
													0.0599
												],
												[
													0,
													0
												],
												[
													-0.5473,
													-0.2356
												],
												[
													-0.055,
													-0.022
												],
												[
													-0.1889,
													-0.6408
												],
												[
													0,
													0
												],
												[
													-0.0525,
													-56e-4
												],
												[
													-0.6103,
													0.0631
												],
												[
													-0.0355,
													0.1204
												],
												[
													0,
													0
												],
												[
													-0.5597,
													0.2181
												],
												[
													-0.06,
													0.0255
												],
												[
													-0.5847,
													-0.3185
												],
												[
													0,
													0
												],
												[
													-0.0406,
													0.0327
												],
												[
													-0.3713,
													0.4613
												],
												[
													0.0599,
													0.11
												],
												[
													0,
													0
												],
												[
													-0.2316,
													0.5453
												],
												[
													-0.0237,
													0.0609
												],
												[
													-0.6481,
													0.191
												],
												[
													0,
													0
												],
												[
													-58e-4,
													0.0563
												],
												[
													0.0617,
													0.5783
												],
												[
													0.1203,
													0.0355
												],
												[
													0,
													0
												],
												[
													0.2207,
													0.5528
												],
												[
													0.0234,
													0.0542
												],
												[
													-0.3198,
													0.5871
												],
												[
													0,
													0
												],
												[
													0.0334,
													0.0414
												],
												[
													0.4658,
													0.3756
												],
												[
													0.11,
													-0.0599
												],
												[
													0,
													0
												],
												[
													0.5473,
													0.2357
												],
												[
													0.0551,
													0.022
												],
												[
													0.1889,
													0.6408
												],
												[
													0,
													0
												],
												[
													0.0525,
													0.0056
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-0.5782799999999995,
													-0.06170000000000009
												],
												[
													-0.05630000000000024,
													0.005819999999999936
												],
												[
													0,
													0
												],
												[
													-0.1859099999999998,
													0.6307499999999999
												],
												[
													-0.04333000000000009,
													0.018790000000000084
												],
												[
													-0.5563799999999999,
													0.25727999999999973
												],
												[
													0,
													0
												],
												[
													-0.11075999999999997,
													-0.060329999999999995
												],
												[
													-0.4675900000000004,
													0.38927999999999985
												],
												[
													-0.039309999999999956,
													0.04722000000000026
												],
												[
													0,
													0
												],
												[
													0.3313600000000001,
													0.60832
												],
												[
													-0.020039999999999836,
													0.04331999999999958
												],
												[
													-0.22876999999999992,
													0.5275699999999999
												],
												[
													0,
													0
												],
												[
													-0.12040000000000006,
													0.035489999999999355
												],
												[
													-0.06309000000000009,
													0.6102699999999999
												],
												[
													0.005609999999999893,
													0.052540000000000475
												],
												[
													0,
													0
												],
												[
													0.6407799999999999,
													0.18886999999999965
												],
												[
													0.021999999999999797,
													0.05509999999999948
												],
												[
													0.23570999999999964,
													0.5473400000000002
												],
												[
													0,
													0
												],
												[
													-0.059940000000000104,
													0.11003000000000007
												],
												[
													0.37568,
													0.46597000000000044
												],
												[
													0.041380000000000194,
													0.03335999999999828
												],
												[
													0,
													0
												],
												[
													0.58711,
													-0.31980000000000075
												],
												[
													0.05426999999999982,
													0.02336000000000027
												],
												[
													0.5528599999999999,
													0.22065999999999875
												],
												[
													0,
													0
												],
												[
													0.03545000000000087,
													0.12027000000000143
												],
												[
													0.5783799999999992,
													0.06175999999999959
												],
												[
													0.05631999999999948,
													-0.005819999999999936
												],
												[
													0,
													0
												],
												[
													0.19101000000000035,
													-0.6480500000000013
												],
												[
													0.06093000000000082,
													-0.023749999999999716
												],
												[
													0.5453100000000006,
													-0.2316199999999995
												],
												[
													0,
													0
												],
												[
													0.1100399999999997,
													0.05994000000000099
												],
												[
													0.4613099999999992,
													-0.3712599999999995
												],
												[
													0.032689999999998776,
													-0.04060999999999915
												],
												[
													0,
													0
												],
												[
													-0.31850999999999985,
													-0.5847300000000004
												],
												[
													0.025490000000001345,
													-0.06001999999999974
												],
												[
													0.21810999999999936,
													-0.5596999999999994
												],
												[
													0,
													0
												],
												[
													0.12039000000000044,
													-0.035479999999999734
												],
												[
													0.06310999999999822,
													-0.6102100000000004
												],
												[
													-0.005610000000000781,
													-0.052540000000000475
												],
												[
													0,
													0
												],
												[
													-0.6408200000000015,
													-0.18887999999999927
												],
												[
													-0.021940000000000737,
													-0.05496999999999996
												],
												[
													-0.23562000000000083,
													-0.5472999999999999
												],
												[
													0,
													0
												],
												[
													0.05994000000000099,
													-0.11003000000000007
												],
												[
													-0.375589999999999,
													-0.46584999999999965
												],
												[
													-0.041380000000000194,
													-0.03337000000000012
												],
												[
													0,
													0
												],
												[
													-0.58718,
													0.3198399999999997
												],
												[
													-0.054349999999999454,
													-0.023410000000000153
												],
												[
													-0.5527999999999995,
													-0.22067999999999977
												],
												[
													0,
													0
												],
												[
													-0.03545000000000087,
													-0.12027999999999994
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers$3 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "settings main",
			refId: "molj3m7sf0df582x",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 32,
			h: 32,
			ip: 0,
			op: 300,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$3 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var settingsAnimation = {
		fr: fr$3,
		v: v$3,
		ip: ip$3,
		op: op$3,
		w: w$3,
		h: h$3,
		nm: nm$3,
		ddd: ddd$3,
		markers: markers$3,
		assets: assets$3,
		layers: layers$3,
		meta: meta$3
	};

	var fr$2 = 60;
	var v$2 = "5.9.6";
	var ip$2 = 0;
	var op$2 = 179;
	var w$2 = 128;
	var h$2 = 128;
	var nm$2 = "smart process";
	var ddd$2 = 0;
	var markers$2 = [
	];
	var assets$2 = [
		{
			nm: "[FRAME] smart process - Null / Icon - Null / Icon / Icon - Null / Icon / Ellipse - Null / Ellipse - Stroke / Ellipse - Null / Ellipse - Stroke / Ellipse - Null / Ellipse - Stroke / Ellipse - Null / Ellipse - Stroke",
			fr: 60,
			id: "moljfsndgdb865y9",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "smart process - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 137.80800000000002,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 138.39000000000001,
									s: [
										100
									]
								}
							]
						},
						p: {
							a: 0,
							k: [
								45.3096,
								13.3477
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 137.80800000000002,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 138.39000000000001,
									s: [
										100
									]
								}
							]
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													14.6454,
													0.8524
												],
												[
													19.9008,
													1.3591
												],
												[
													26.6513,
													9.5503
												],
												[
													26.4483,
													14.5257
												],
												[
													18.8362,
													22.363
												],
												[
													13.557,
													22.44
												],
												[
													13.4801,
													17.1608
												],
												[
													15.3003,
													15.2867
												],
												[
													13.2562,
													15.6014
												],
												[
													5.2433,
													18.063
												],
												[
													0.3196,
													16.1571
												],
												[
													2.2255,
													11.2334
												],
												[
													11.9104,
													8.2571
												],
												[
													15.4944,
													7.7526
												],
												[
													14.1388,
													6.1077
												],
												[
													14.6455,
													0.8523
												],
												[
													14.6454,
													0.8524
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.3113,
													-1.5911
												],
												[
													0,
													0
												],
												[
													1.3254,
													-1.3646
												],
												[
													0,
													0
												],
												[
													1.4791,
													1.4366
												],
												[
													-1.4366,
													1.4791
												],
												[
													0,
													0
												],
												[
													0.6828,
													-0.1251
												],
												[
													2.5085,
													-1.1084
												],
												[
													0.8334,
													1.886
												],
												[
													-1.886,
													0.8333
												],
												[
													-3.4039,
													0.6238
												],
												[
													-1.1912,
													0.1174
												],
												[
													0,
													0
												],
												[
													-1.5912,
													1.3113
												],
												[
													0,
													0
												]
											],
											o: [
												[
													1.5911600000000004,
													-1.3113
												],
												[
													0,
													0
												],
												[
													1.2097899999999981,
													1.4679900000000004
												],
												[
													0,
													0
												],
												[
													-1.4365500000000004,
													1.4790500000000009
												],
												[
													-1.479049999999999,
													-1.4365500000000004
												],
												[
													0,
													0
												],
												[
													-0.6797199999999997,
													0.08484999999999943
												],
												[
													-2.82409,
													0.5175099999999997
												],
												[
													-1.8859500000000002,
													0.8333499999999994
												],
												[
													-0.83336,
													-1.8859499999999993
												],
												[
													3.03971,
													-1.3431800000000003
												],
												[
													1.1973599999999998,
													-0.21940999999999988
												],
												[
													0,
													0
												],
												[
													-1.3112899999999996,
													-1.5911599999999995
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								21.1583,
								15.35
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								65.0376,
								63.7148
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 1,
							k: [
								{
									t: 141.12,
									s: [
										0.1,
										0.1
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 156.126,
									s: [
										100,
										100
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													41.3351,
													6.2561
												],
												[
													41.1058,
													0.9814
												],
												[
													35.8311,
													1.2107
												],
												[
													16.9741,
													21.782
												],
												[
													6.1631,
													12.5154
												],
												[
													0.8989,
													12.9203
												],
												[
													1.3038,
													18.1845
												],
												[
													14.8565,
													29.8011
												],
												[
													20.0382,
													29.4892
												],
												[
													41.3351,
													6.2561
												]
											],
											i: [
												[
													0,
													0
												],
												[
													1.5199,
													1.3933
												],
												[
													1.3932,
													-1.5199
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.3418,
													-1.5655
												],
												[
													-1.5655,
													-1.3419
												],
												[
													0,
													0
												],
												[
													-1.3605,
													1.4842
												],
												[
													0,
													0
												]
											],
											o: [
												[
													1.3932500000000019,
													-1.5199100000000003
												],
												[
													-1.519919999999999,
													-1.39325
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-1.56548,
													-1.3418399999999995
												],
												[
													-1.34184,
													1.565479999999999
												],
												[
													0,
													0
												],
												[
													1.5287199999999999,
													1.3103300000000004
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													41.3351,
													6.2561
												],
												[
													41.1058,
													0.9814
												],
												[
													35.8311,
													1.2107
												],
												[
													16.9741,
													21.782
												],
												[
													6.1631,
													12.5154
												],
												[
													0.8989,
													12.9203
												],
												[
													1.3038,
													18.1845
												],
												[
													14.8565,
													29.8011
												],
												[
													20.0382,
													29.4892
												],
												[
													41.3351,
													6.2561
												]
											],
											i: [
												[
													0,
													0
												],
												[
													1.5199,
													1.3933
												],
												[
													1.3932,
													-1.5199
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.3418,
													-1.5655
												],
												[
													-1.5655,
													-1.3419
												],
												[
													0,
													0
												],
												[
													-1.3605,
													1.4842
												],
												[
													0,
													0
												]
											],
											o: [
												[
													1.3932500000000019,
													-1.5199100000000003
												],
												[
													-1.519919999999999,
													-1.39325
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-1.56548,
													-1.3418399999999995
												],
												[
													-1.34184,
													1.565479999999999
												],
												[
													0,
													0
												],
												[
													1.5287199999999999,
													1.3103300000000004
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "Ellipse - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								39.5,
								39.5
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								65.1001,
								64.1992
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "Ellipse - Stroke",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: false,
											v: [
												[
													58.6496,
													4.9533
												],
												[
													78.2061,
													31.6237
												],
												[
													70.626,
													63.8202
												],
												[
													41.2222,
													78.9605
												],
												[
													10.6097,
													66.439
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-2.3937,
													-11.7591
												],
												[
													7.3865,
													-9.4563
												],
												[
													11.9882,
													-0.5253
												],
												[
													8.1844,
													8.7769
												]
											],
											o: [
												[
													10.4951,
													5.8184
												],
												[
													2.3936999999999955,
													11.7592
												],
												[
													-7.386499999999998,
													9.456299999999999
												],
												[
													-11.988199999999999,
													0.5254000000000048
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "st",
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 7.3
									},
									lc: 2,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "tm",
							s: {
								a: 0,
								k: 0
							},
							e: {
								a: 1,
								k: [
									{
										t: 0.156,
										s: [
											0
										],
										o: {
											x: [
												0.5
											],
											y: [
												0.35
											]
										},
										i: {
											x: [
												0.15
											],
											y: [
												1
											]
										}
									},
									{
										t: 47.958,
										s: [
											100
										]
									}
								]
							},
							o: {
								a: 0,
								k: 0
							},
							m: 1
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											43.15,
											43.15
										]
									},
									s: {
										a: 0,
										k: [
											172.6,
											172.6
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 11,
					hd: false,
					nm: "Ellipse - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								39.5,
								39.5
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								65.1001,
								64.1992
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 12,
					hd: false,
					nm: "Ellipse - Stroke",
					sr: 1,
					parent: 11,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: false,
											v: [
												[
													3.1403,
													54.9327
												],
												[
													1.6669,
													50.8523
												],
												[
													0.6478,
													46.6298
												],
												[
													0.1027,
													42.3242
												],
												[
													0.0277,
													37.9832
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.4385,
													1.4655
												],
												[
													0.2765,
													1.505
												],
												[
													0.1106,
													1.5247
												],
												[
													-0.0592,
													1.5286
												]
											],
											o: [
												[
													-0.5964,
													-1.4061999999999983
												],
												[
													-0.4384000000000001,
													-1.4654999999999987
												],
												[
													-0.2765,
													-1.5048999999999992
												],
												[
													-0.1106,
													-1.5247000000000028
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "st",
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 7.3
									},
									lc: 2,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "tm",
							s: {
								a: 0,
								k: 0
							},
							e: {
								a: 1,
								k: [
									{
										t: 48.461999999999996,
										s: [
											0
										],
										o: {
											x: [
												0.5
											],
											y: [
												0.35
											]
										},
										i: {
											x: [
												0.15
											],
											y: [
												1
											]
										}
									},
									{
										t: 78.048,
										s: [
											100
										]
									}
								]
							},
							o: {
								a: 0,
								k: 0
							},
							m: 1
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											43.15,
											43.15
										]
									},
									s: {
										a: 0,
										k: [
											172.6,
											172.6
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 13,
					hd: false,
					nm: "Ellipse - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								39.5,
								39.5
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								65.1001,
								64.1992
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "Ellipse - Stroke",
					sr: 1,
					parent: 13,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: false,
											v: [
												[
													23.4354,
													3.4168
												],
												[
													27.492,
													1.8684
												],
												[
													31.6909,
													0.7782
												],
												[
													35.9885,
													0.158
												],
												[
													40.3255,
													0.0079
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.4576,
													0.4661
												],
												[
													-1.4971,
													0.3002
												],
												[
													-1.5207,
													0.1343
												],
												[
													-1.5286,
													-0.0316
												]
											],
											o: [
												[
													1.398299999999999,
													-0.6200999999999999
												],
												[
													1.4575999999999993,
													-0.46609999999999996
												],
												[
													1.4971000000000032,
													-0.3002
												],
												[
													1.5208000000000013,
													-0.1343
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "st",
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 7.3
									},
									lc: 2,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "tm",
							s: {
								a: 0,
								k: 0
							},
							e: {
								a: 1,
								k: [
									{
										t: 108.006,
										s: [
											0
										],
										o: {
											x: [
												0.5
											],
											y: [
												0.35
											]
										},
										i: {
											x: [
												0.15
											],
											y: [
												1
											]
										}
									},
									{
										t: 138.174,
										s: [
											100
										]
									}
								]
							},
							o: {
								a: 0,
								k: 0
							},
							m: 1
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											43.15,
											43.15
										]
									},
									s: {
										a: 0,
										k: [
											172.6,
											172.6
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "Ellipse - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								39.5,
								39.5
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								65.1001,
								64.1992
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 16,
					hd: false,
					nm: "Ellipse - Stroke",
					sr: 1,
					parent: 15,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 180,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: false,
											v: [
												[
													2.8756,
													24.7033
												],
												[
													4.7203,
													20.773
												],
												[
													6.9876,
													17.0719
												],
												[
													9.642,
													13.6394
												],
												[
													12.6637,
													10.5189
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.7228,
													1.3469
												],
												[
													-0.869,
													1.26
												],
												[
													-0.9993,
													1.1573
												],
												[
													-1.1218,
													1.0389
												]
											],
											o: [
												[
													0.5728,
													-1.4179999999999993
												],
												[
													0.7229000000000001,
													-1.3469000000000015
												],
												[
													0.8689999999999998,
													-1.2599999999999998
												],
												[
													0.9993999999999996,
													-1.1572999999999993
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "st",
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 7.3
									},
									lc: 2,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "tm",
							s: {
								a: 0,
								k: 0
							},
							e: {
								a: 1,
								k: [
									{
										t: 78.198,
										s: [
											0
										],
										o: {
											x: [
												0.5
											],
											y: [
												0.35
											]
										},
										i: {
											x: [
												0.15
											],
											y: [
												1
											]
										}
									},
									{
										t: 107.982,
										s: [
											100
										]
									}
								]
							},
							o: {
								a: 0,
								k: 0
							},
							m: 1
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											43.15,
											43.15
										]
									},
									s: {
										a: 0,
										k: [
											172.6,
											172.6
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers$2 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "smart process",
			refId: "moljfsndgdb865y9",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 128,
			h: 128,
			ip: 0,
			op: 180,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$2 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var smartAnimation = {
		fr: fr$2,
		v: v$2,
		ip: ip$2,
		op: op$2,
		w: w$2,
		h: h$2,
		nm: nm$2,
		ddd: ddd$2,
		markers: markers$2,
		assets: assets$2,
		layers: layers$2,
		meta: meta$2
	};

	var fr$1 = 60;
	var v$1 = "5.9.6";
	var ip$1 = 0;
	var op$1 = 149;
	var w$1 = 32;
	var h$1 = 32;
	var nm$1 = "Outline Icon Bold. Task";
	var ddd$1 = 0;
	var markers$1 = [
	];
	var assets$1 = [
		{
			nm: "[FRAME] Outline Icon Bold. Task - Null / Icon - Null / Icon / Rectangle 240652826 - Null / Rectangle 240652826 - Stroke",
			fr: 60,
			id: "moljd1hf8enjssk9",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "Outline Icon Bold. Task - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 150,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								4.9334,
								3.6
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								15.9998,
								16.0004
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 150,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 150,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 87.33,
												s: [
													{
														c: true,
														v: [
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															],
															[
																4.9334,
																3.6
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 107.622,
												s: [
													{
														c: true,
														v: [
															[
																10.6263,
																1.2336
															],
															[
																10.5745,
																-0.3055
															],
															[
																8.97,
																-0.2558
															],
															[
																3.645,
																5.1928
															],
															[
																0.8226,
																2.7862
															],
															[
																-0.7799,
																2.8766
															],
															[
																-0.6856,
																4.4139
															],
															[
																2.963,
																7.525
															],
															[
																4.5453,
																7.4559
															],
															[
																10.6263,
																1.2336
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.4574,
																0.4113
															],
															[
																0.4288,
																-0.4387
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0.4165,
																-0.4495
															],
															[
																-0.4686,
																-0.3995
															],
															[
																0,
																0
															],
															[
																-0.4208,
																0.4305
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0.4287700000000001,
																-0.43873000000000006
															],
															[
																-0.45735999999999954,
																-0.41130999999999995
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																-0.46856,
																-0.39952999999999994
															],
															[
																-0.4165000000000001,
																0.4494699999999998
															],
															[
																0,
																0
															],
															[
																0.4598,
																0.39207000000000036
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 132.162,
												s: [
													{
														c: true,
														v: [
															[
																9.6775,
																1.628
															],
															[
																9.6344,
																0.3454
															],
															[
																8.2973,
																0.3868
															],
															[
																3.8598,
																4.9273
															],
															[
																1.5078,
																2.9218
															],
															[
																0.1723,
																2.9972
															],
															[
																0.2509,
																4.2783
															],
															[
																3.2914,
																6.8709
															],
															[
																4.6099,
																6.8133
															],
															[
																9.6775,
																1.628
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.3811,
																0.3428
															],
															[
																0.3573,
																-0.3656
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																0.3471,
																-0.3746
															],
															[
																-0.3905,
																-0.3329
															],
															[
																0,
																0
															],
															[
																-0.3506,
																0.3588
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0.35731,
																-0.36561
															],
															[
																-0.38113000000000063,
																-0.34276
															],
															[
																0,
																0
															],
															[
																0,
																0
															],
															[
																-0.3904700000000001,
																-0.3329399999999998
															],
															[
																-0.34708,
																0.3745600000000002
															],
															[
																0,
																0
															],
															[
																0.38317000000000023,
																0.3267199999999999
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "Rectangle 240652826 - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								9,
								9
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								16,
								16
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 150,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "Rectangle 240652826 - Stroke",
					sr: 1,
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 150,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													3,
													0
												],
												[
													15,
													0
												],
												[
													18,
													3
												],
												[
													18,
													15
												],
												[
													15,
													18
												],
												[
													3,
													18
												],
												[
													0,
													15
												],
												[
													0,
													3
												],
												[
													3,
													0
												],
												[
													3,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-1.6568
												],
												[
													0,
													0
												],
												[
													1.6568,
													0
												],
												[
													0,
													0
												],
												[
													0,
													1.6568
												],
												[
													0,
													0
												],
												[
													-1.6568,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													1.6568499999999986,
													0
												],
												[
													0,
													0
												],
												[
													0,
													1.6568499999999986
												],
												[
													0,
													0
												],
												[
													-1.65685,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-1.65685
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "st",
									c: {
										a: 0,
										k: [
											0.27450980392156865,
											0.6313725490196078,
											0.9215686274509803,
											1
										]
									},
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 1.9
									},
									lc: 2,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "tm",
							s: {
								a: 0,
								k: 0
							},
							e: {
								a: 1,
								k: [
									{
										t: 0,
										s: [
											0
										],
										o: {
											x: [
												0
											],
											y: [
												0
											]
										},
										i: {
											x: [
												1
											],
											y: [
												1
											]
										}
									},
									{
										t: 86.75999999999999,
										s: [
											100
										]
									}
								]
							},
							o: {
								a: 0,
								k: 36
							},
							m: 1
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											9.95,
											9.95
										]
									},
									s: {
										a: 0,
										k: [
											39.8,
											39.8
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers$1 = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "Outline Icon Bold. Task",
			refId: "moljd1hf8enjssk9",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 32,
			h: 32,
			ip: 0,
			op: 150,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta$1 = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var taskAnimation = {
		fr: fr$1,
		v: v$1,
		ip: ip$1,
		op: op$1,
		w: w$1,
		h: h$1,
		nm: nm$1,
		ddd: ddd$1,
		markers: markers$1,
		assets: assets$1,
		layers: layers$1,
		meta: meta$1
	};

	var fr = 60;
	var v = "5.9.6";
	var ip = 0;
	var op = 119;
	var w = 34;
	var h = 34;
	var nm = "delete main";
	var ddd = 0;
	var markers = [
	];
	var assets = [
		{
			nm: "[FRAME] delete main - Null / Icon - Null / Icon / Icon - Null / Icon / Icon - Null / Icon",
			fr: 60,
			id: "mowozio89rx641qy",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "delete main - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								1
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								7.5474,
								11.6816
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.4,
													0
												],
												[
													0.0063,
													1.5311
												],
												[
													2.0330278846153846,
													14.1012
												],
												[
													4.9731000000000005,
													16.64
												],
												[
													13.5344,
													16.64
												],
												[
													16.471578365384616,
													14.1194
												],
												[
													18.5829,
													1.5402
												],
												[
													17.19,
													0.0001
												],
												[
													1.4,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.0771,
													-0.8214
												],
												[
													0,
													0
												],
												[
													-1.4449,
													0
												],
												[
													0,
													0
												],
												[
													-0.1437,
													1.4311
												],
												[
													0,
													0
												],
												[
													0.8284,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-0.82479,
													0
												],
												[
													0,
													0
												],
												[
													0.135,
													1.4389599999999998
												],
												[
													0,
													0
												],
												[
													1.43792,
													0
												],
												[
													0,
													0
												],
												[
													0.08277000000000001,
													-0.82449
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													2.0149,
													1.9603
												],
												[
													3.9731182692307687,
													13.918
												],
												[
													5.0907125,
													14.6796
												],
												[
													13.4163875,
													14.6796
												],
												[
													14.53315721153846,
													13.9234
												],
												[
													16.5709,
													1.9602
												],
												[
													2.0149,
													1.9603
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-0.4335,
													0
												],
												[
													0,
													0
												],
												[
													-0.0431,
													0.4293
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0.0405000000000002,
													0.4316899999999997
												],
												[
													0,
													0
												],
												[
													0.43138000000000076,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.3215686274509804,
											0.7372549019607844,
											0.7372549019607844,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								13.6089,
								15.7073
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.9598,
													0.9802
												],
												[
													0.9799,
													0
												],
												[
													0,
													0.9802
												],
												[
													0,
													7.1398
												],
												[
													0.9799,
													8.12
												],
												[
													1.9598,
													7.1398
												],
												[
													1.9598,
													0.9802
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.5412,
													0
												],
												[
													0,
													-0.5413
												],
												[
													0,
													0
												],
												[
													-0.5412,
													0
												],
												[
													0,
													0.5413
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-0.54133
												],
												[
													-0.54119,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0.5413300000000003
												],
												[
													0.5411900000000001,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													5.4796,
													0
												],
												[
													6.4595,
													0.9802
												],
												[
													6.4595,
													7.1398
												],
												[
													5.4796,
													8.12
												],
												[
													4.4997,
													7.1398
												],
												[
													4.4997,
													0.9802
												],
												[
													5.4796,
													0
												],
												[
													5.4796,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													-0.5413
												],
												[
													0,
													0
												],
												[
													0.5412,
													0
												],
												[
													0,
													0.5413
												],
												[
													0,
													0
												],
												[
													-0.5412,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.5411900000000003,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0.5413300000000003
												],
												[
													-0.5411900000000003,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-0.54133
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.3215686274509804,
											0.7372549019607844,
											0.7372549019607844,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "Icon - Null",
					sr: 1,
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								11.025,
								3.1457
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								16.8009,
								7.2256
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 0,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 5.856000000000001,
									s: [
										-10
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 11.712000000000002,
									s: [
										10
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 17.844,
									s: [
										-10
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 23.700000000000003,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "Icon",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													16.1477,
													4.3313
												],
												[
													20.169900000000002,
													4.3313
												],
												[
													21.149900000000002,
													5.3113
												],
												[
													20.169900000000002,
													6.2913
												],
												[
													1.88,
													6.2913
												],
												[
													0.9,
													5.3113
												],
												[
													1.88,
													4.3313
												],
												[
													5.8659,
													4.3313
												],
												[
													6.1724,
													1.9852999999999998
												],
												[
													9.7333,
													-0.8999999999999999
												],
												[
													12.2519,
													-0.8999999999999999
												],
												[
													15.7983,
													1.9199999999999997
												],
												[
													16.1477,
													4.3313
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-0.5412
												],
												[
													0.5412,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0.5412
												],
												[
													-0.5412,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-1.7194,
													0
												],
												[
													0,
													0
												],
												[
													-0.3817,
													-1.6508
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0.5412399999999984,
													0
												],
												[
													0,
													0.5412400000000002
												],
												[
													0,
													0
												],
												[
													-0.54124,
													0
												],
												[
													0,
													-0.5412400000000002
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.3565199999999997,
													-1.68208
												],
												[
													0,
													0
												],
												[
													1.6944,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													8.0898,
													3.075681714496802
												],
												[
													7.901799999999999,
													4.146991275136795
												],
												[
													14.1007,
													4.146991275136795
												],
												[
													13.8886,
													3.039327241243968
												],
												[
													12.2518,
													1.467388804746843
												],
												[
													9.7333,
													1.467388804746843
												],
												[
													8.0898,
													3.075802493477708
												],
												[
													8.0898,
													3.075681714496802
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.782,
													0
												],
												[
													0,
													0
												],
												[
													0.1646,
													-0.7763
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-0.17617000000000083,
													-0.76193
												],
												[
													0,
													0
												],
												[
													-0.79359,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.3215686274509804,
											0.7372549019607844,
											0.7372549019607844,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "delete main",
			refId: "mowozio89rx641qy",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 34,
			h: 34,
			ip: 0,
			op: 120,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var trashcanAnimation = {
		fr: fr,
		v: v,
		ip: ip,
		op: op,
		w: w,
		h: h,
		nm: nm,
		ddd: ddd,
		markers: markers,
		assets: assets,
		layers: layers,
		meta: meta
	};

	const ICON_ANIMATIONS = new Map([['AI_ROBOT', aiRobotAnimation], ['DATA_READING', readAnimation], ['DATABASE', dataAnimation], ['EDIT_L', editAnimation], ['HANDSHAKE', handshakeAnimation], ['SETTINGS', settingsAnimation], ['SMART_PROCESS', smartAnimation], ['TASK', taskAnimation], ['TRASHCAN', trashcanAnimation]]);
	function getAnimationData(iconName) {
		return iconName ? ICON_ANIMATIONS.get(iconName) ?? null : null;
	}

	const ICON_CLASS_NAMES$1 = {
		base: 'editor-chart-block-icon',
		deactivated: '--deactivated',
		lottiePlaying: '--lottie-playing'
	};
	const ICON_BG_COLOR_CLASS_NAMES = {
		bgColor_1: '--background-color-1',
		bgColor_2: '--background-color-2',
		bgColor_3: '--background-color-3',
		bgColor_4: '--background-color-4',
		bgColor_5: '--background-color-5',
		bgColor_6: '--background-color-6',
		bgColor_7: '--background-color-7',
		bgColor_8: '--background-color-8',
		bgColor_9: '--background-color-9'
	};
	const ICON_COLORS$1 = {
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
	const ANIMATION_START_DELAY_MS = 300;
	const ANIMATION_DESTROY_DELAY_MS = 200;
	const MARK_CLEANUP_DELAY_MS = 500;
	const animatedBlockIds = new Set();
	const markCleanupTimers = new Map();

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
			},
			blockId: {
				type: String,
				default: null
			},
			animate: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			const iconSet = ui_iconSet_api_vue.Outline;
			const lottieContainerRef = ui_vue3.ref(null);
			const isLottieActive = ui_vue3.ref(false);
			const {
				blockIntersections
			} = ui_blockDiagram.useBlockDiagram();
			const isInViewport = ui_vue3.computed(() => {
				if (!props.blockId) {
					return false;
				}
				return ui_vue3.toValue(blockIntersections.visibleBlockIds).has(props.blockId);
			});
			const lottieStyle = ui_vue3.computed(() => ({
				width: `${props.iconSize}px`,
				height: `${props.iconSize}px`
			}));
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
					[ICON_CLASS_NAMES$1.lottiePlaying]: isLottieActive.value,
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
				if (colorIndex !== false && ICON_COLORS$1[colorIndex]) {
					return ICON_COLORS$1[colorIndex];
				}
				return null;
			}
			let isUnmounted = false;
			let lottieInstance = null;
			let startDelayTimer = null;
			let destroyDelayTimer = null;
			function destroyLottie() {
				if (lottieInstance) {
					lottieInstance.destroy();
					lottieInstance = null;
				}
				isLottieActive.value = false;
			}
			function clearStartTimer() {
				if (startDelayTimer !== null) {
					clearTimeout(startDelayTimer);
					startDelayTimer = null;
				}
			}
			function clearDestroyDelayTimer() {
				if (destroyDelayTimer !== null) {
					clearTimeout(destroyDelayTimer);
					destroyDelayTimer = null;
				}
			}
			function cancelPlaybackIfInterrupted() {
				if (!isUnmounted && isInViewport.value && lottieContainerRef.value) {
					return false;
				}
				isLottieActive.value = false;
				return true;
			}
			async function playAnimation(animationData) {
				isLottieActive.value = true;
				await ui_vue3.nextTick();
				if (cancelPlaybackIfInterrupted()) {
					return;
				}
				const {
					Lottie
				} = await main_core.Runtime.loadExtension('ui.lottie');
				if (cancelPlaybackIfInterrupted()) {
					return;
				}
				lottieInstance = Lottie.loadAnimation({
					container: lottieContainerRef.value,
					animationData,
					loop: false,
					autoplay: true,
					renderer: 'svg',
					rendererSettings: {
						viewBoxOnly: true
					}
				});

				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
				lottieInstance.addEventListener('complete', destroyLottie);
			}
			ui_vue3.onMounted(() => {
				const pendingCleanup = markCleanupTimers.get(props.blockId);
				if (pendingCleanup !== undefined) {
					clearTimeout(pendingCleanup);
					markCleanupTimers.delete(props.blockId);
				}
			});
			ui_vue3.watch(isInViewport, (isVisible, wasVisible) => {
				if (!isVisible && !wasVisible) {
					return;
				}
				if (!isVisible) {
					clearDestroyDelayTimer();
					destroyDelayTimer = setTimeout(() => {
						destroyDelayTimer = null;
						clearStartTimer();
						destroyLottie();
						animatedBlockIds.delete(props.blockId);
					}, ANIMATION_DESTROY_DELAY_MS);
					return;
				}
				if (destroyDelayTimer !== null) {
					clearDestroyDelayTimer();
					return;
				}
				if (!props.animate || props.deactivated) {
					return;
				}
				if (animatedBlockIds.has(props.blockId)) {
					return;
				}
				const animationData = getAnimationData(props.iconName);
				if (!animationData) {
					return;
				}
				animatedBlockIds.add(props.blockId);
				clearStartTimer();
				startDelayTimer = setTimeout(async () => {
					startDelayTimer = null;
					if (isUnmounted) {
						return;
					}
					try {
						await playAnimation(animationData);
					} catch (error) {
						console.error('BlockIcon: failed to play Lottie animation', error);
						destroyLottie();
					}
				}, ANIMATION_START_DELAY_MS);
			}, {
				immediate: true
			});
			ui_vue3.onBeforeUnmount(() => {
				isUnmounted = true;
				clearStartTimer();
				clearDestroyDelayTimer();
				destroyLottie();
				if (props.blockId && animatedBlockIds.has(props.blockId)) {
					const timer = setTimeout(() => {
						animatedBlockIds.delete(props.blockId);
						markCleanupTimers.delete(props.blockId);
					}, MARK_CLEANUP_DELAY_MS);
					markCleanupTimers.set(props.blockId, timer);
				}
			});
			return {
				iconClassNames,
				lottieContainerRef,
				isLottieActive,
				lottieStyle,
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
			<div
				v-if="isLottieActive"
				ref="lottieContainerRef"
				class="editor-chart-block-icon__lottie"
				:style="lottieStyle"
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
			contentBlockColor: {
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
				const effectiveColor = this.contentBlockColor ?? this.colorIndex;
				const bgColorsClassNames = Object.keys(CONTENT_BG_COLORS_CLASS_NAMES).reduce((colorsMap, colorKey, index) => {
					return {
						...colorsMap,
						[CONTENT_BG_COLORS_CLASS_NAMES[colorKey]]: effectiveColor === index && !this.deactivated
					};
				}, {});
				const hasColoredBg = Object.values(bgColorsClassNames).some(Boolean);
				return {
					[CONTENT_CLASS_NAMES.base]: true,
					[CONTENT_CLASS_NAMES.deactivated]: this.deactivated,
					'--default': !hasColoredBg && !this.deactivated,
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
			},
			minRuleItemsCount: {
				type: Number,
				default: MIN_RULE_ITEMS_COUNT
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
				return RESERVED_INPUT_RULES_TITLES.slice(0, this.minRuleItemsCount).map(title => {
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
				const reserved = RESERVED_INPUT_RULES_TITLES.slice(0, this.minRuleItemsCount);
				return this.rulePorts.filter(p => {
					return !reserved.includes(p.title);
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
				return RESERVED_OUTPUT_RULES_TITLES.slice(0, this.minRuleItemsCount).map(title => {
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
				const reserved = RESERVED_OUTPUT_RULES_TITLES.slice(0, this.minRuleItemsCount);
				return this.outputPorts.filter(p => {
					return !reserved.includes(p.title);
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
			},
			size: {
				type: Number,
				default: 18
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
			:size="size"
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
			},
			menuTargetContainer: {
				type: HTMLElement,
				default: null
			},
			size: {
				type: Number,
				default: 16
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
				const buttonEl = this.$refs.buttonMore?.$el;
				const {
					top = 0,
					right = 0
				} = buttonEl?.getBoundingClientRect() ?? {};
				const options = {
					items: this.moreMenuItems
				};
				if (this.menuTargetContainer) {
					options.targetContainer = this.menuTargetContainer;
					options.bindElement = buttonEl;
				}
				this.showMenu({
					clientX: right + OFFSET_MORE_MENU_RIGHT * this.zoom,
					clientY: top - OFFSET_MORE_MENU_TOP * this.zoom
				}, options);
			}
		},
		template: `
		<IconButton
			ref="buttonMore"
			:active="isOpen"
			:size="size"
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
			},
			blockId: {
				type: String,
				default: null
			},
			animate: {
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
			:blockId="blockId"
			:animate="animate"
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

	const REPLACE_TYPES_MAP = {
		CreateStorageNode: 'services',
		WriteDataStorageActivity: 'services',
		ReadDataStorageActivity: 'services',
		DeleteDataStorageActivity: 'services',
		SetupTemplateActivity: 'services',
		AiProcessingActivity: 'services',
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
			isFixedCatalog: true,
			initPromise: null
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
			},
			getDefaultTitle: state => activity => {
				if (!activity?.Type) {
					return '';
				}
				return state.groups.flatMap(group => group.items ?? []).find(item => item.id === activity.Type && (item.presetId ?? null) === (activity.PresetId ?? null))?.title ?? '';
			}
		},
		actions: {
			init() {
				if (!this.initPromise) {
					this.initPromise = this.fetchCatalogData();
				}
				return this.initPromise;
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
		name: 'TextInput',
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
		computed: {
			placeholder() {
				return this.$bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_PLACEHOLDER');
			}
		},
		watch: {
			focusable(isFocus) {
				if (isFocus) {
					this.$refs?.textInput?.focus();
				} else {
					this.$refs?.textInput?.blur();
				}
			}
		},
		mounted() {
			if (this.focusable) {
				this.$refs?.textInput?.focus();
			}
		},
		template: `
		<div class="editor-chart-catalog-input">
			<input
				ref="textInput"
				:value="modelValue"
				:placeholder="placeholder"
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
			DragBlock: ui_blockDiagram.DragBlock,
			hint: ui_vue3_directives_hint.hint
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
					contentBlockColor = null,
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
						...(contentBlockColor !== null ? {
							contentBlockColor
						} : {}),
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

	const TOOLTIP_OFFSET_LEFT = 10;
	const TOOLTIP_WIDTH = 273;
	const TOOLTIP_VIEWPORT_MARGIN = 8;
	const TOOLTIP_ANGLE_ARROW_CENTER = 15;
	const REGISTER_LISTENERS_DELAY = 300;

	// @vue/component
	const CatalogItemTooltip = {
		name: 'CatalogItemTooltip',
		props: {
			title: {
				type: String,
				default: ''
			},
			subtitle: {
				type: String,
				default: ''
			},
			delay: {
				type: Number,
				default: 2000
			}
		},
		data() {
			return {
				timeoutId: null,
				listenersTimeoutId: null
			};
		},
		mounted() {
			this.subscribeListeners();
		},
		unmounted() {
			this.unsubscribeListeners();
		},
		methods: {
			subscribeListeners() {
				this.listenersTimeoutId = setTimeout(() => {
					this.listenersTimeoutId = null;
					main_core.Event.bind(this.$refs.tooltip, 'mouseenter', this.show);
					main_core.Event.bind(this.$refs.tooltip, 'mouseleave', this.hide);
					main_core.Event.bind(this.$refs.tooltip, 'mousedown', this.hide);
				}, REGISTER_LISTENERS_DELAY);
			},
			unsubscribeListeners() {
				if (this.listenersTimeoutId !== null) {
					clearTimeout(this.listenersTimeoutId);
					this.listenersTimeoutId = null;
				}
				if (this.timeoutId !== null) {
					clearTimeout(this.timeoutId);
					this.timeoutId = null;
				}
				this.popup?.destroy();
				main_core.Event.unbind(this.$refs.tooltip, 'mouseenter', this.show);
				main_core.Event.unbind(this.$refs.tooltip, 'mouseleave', this.hide);
				main_core.Event.unbind(this.$refs.tooltip, 'mousedown', this.hide);
			},
			async show() {
				await new Promise(resolve => {
					this.timeoutId = setTimeout(() => {
						resolve();
						this.timeoutId = null;
					}, this.delay);
				});
				const {
					right = 0,
					y = 0
				} = this.$refs.tooltip?.getBoundingClientRect() ?? {};
				const {
					scrollX = 0,
					scrollY = 0
				} = window;
				this.popup?.destroy();
				this.popup = new main_popup.Popup({
					id: `bx-vue-hint-${Date.now()}`,
					bindElement: {
						left: right + TOOLTIP_OFFSET_LEFT + scrollX,
						top: y + scrollY
					},
					width: TOOLTIP_WIDTH,
					bindOptions: {
						forceTop: true
					},
					events: {
						onBeforeAdjustPosition: event => {
							const popupHeight = this.popup?.getPopupContainer()?.offsetHeight ?? 0;
							const minTop = window.scrollY + TOOLTIP_VIEWPORT_MARGIN;
							const maxTop = window.scrollY + window.innerHeight - popupHeight - TOOLTIP_VIEWPORT_MARGIN;
							event.top = Math.max(minTop, Math.min(event.top, maxTop));
							const rect = this.$refs.tooltip?.getBoundingClientRect();
							if (rect) {
								const elementCenter = rect.top + window.scrollY + rect.height / 2;
								this.popup.setAngle({
									position: 'left',
									offset: elementCenter - event.top - TOOLTIP_ANGLE_ARROW_CENTER
								});
							}
						}
					},
					content: main_core.Tag.render`
					<span class='ui-hint-content'>
						<h4 class="editor-chart-catalog-item-tooltip__title">
							${main_core.Tag.safe`${this.title}`}
						</h4>
						<p class="editor-chart-catalog-item-tooltip__subtitle">
							${main_core.Tag.safe`${this.subtitle}`}
						</p>
					</span>
				`,
					darkMode: true,
					autoHide: true,
					cacheable: false,
					focusTrap: false,
					fixed: false,
					animation: 'fading',
					className: 'ui-hint-popup editor-chart-catalog-item-tooltip__tooltip-content',
					targetContainer: document.body,
					angle: {
						position: 'left'
					}
				});
				this.popup.show();
			},
			hide() {
				this.popup?.close();
				if (this.timeoutId !== null) {
					clearTimeout(this.timeoutId);
				}
			}
		},
		template: `
		<div
			class="editor-chart-catalog-item-tooltip"
			ref="tooltip"
		>
			<slot/>
		</div>
	`
	};

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
	const AppLayout = {
		name: 'AppLayoutWidget',
		components: {
			AppLayoutEntity: AppLayout$1
		},
		computed: {
			...ui_vue3_pinia.mapState(useAppStore, ['isShownRightPanel', 'isShownPreviewPanel', 'isShownDebugBar', 'isDataInspectorPanelShown']),
			...ui_vue3_pinia.mapState(useCatalogStore, ['isExpandedCatalog'])
		},
		template: `
		<AppLayoutEntity
			:showSettings="isShownRightPanel"
			:showPreviewPanel="isShownPreviewPanel"
			:showDebugBar="isShownDebugBar"
			:catalogExpanded="isExpandedCatalog"
			:isDataInspectorPanelShown="isDataInspectorPanelShown"
		>
			<template #skeleton>
				<slot name="skeleton" />
			</template>

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

			<template #settings-data-inspector>
				<slot name="settings-data-inspector"/>
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

	const useCommonNodeSettingsStore = ui_vue3_pinia.defineStore('bizprocdesigner-common-node-settings-store', {
		state: () => ({
			block: null,
			selectedTabId: NODE_SETTINGS_TABS.basic
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
				this.selectedTabId = NODE_SETTINGS_TABS.basic;
			},
			hideSettings() {
				this.block = null;
				this.selectedTabId = NODE_SETTINGS_TABS.basic;
			},
			setRuleForm(form) {
				this.ruleForm = form;
			},
			setRuleSaving(isSaving) {
				this.isRuleSaving = isSaving;
			}
		}
	});

	class ValueSelector {
		currentPortId = null;
		connectedBlocks = null;
		selectedItem = null;
		constructor(store, currentBlock, currentPortId = null, connectedBlocks = null) {
			this.store = store;
			this.currentBlock = currentBlock;
			this.currentPortId = currentPortId;
			this.connectedBlocks = connectedBlocks;
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
			const blocks = this.connectedBlocks ?? this.store.getAllBlockAncestors(this.currentBlock, this.currentPortId);
			return blocks.reduce((acc, currentBlock) => {
				const block = main_core.Type.isPlainObject(currentBlock?.block) ? currentBlock.block : currentBlock;
				if (!main_core.Type.isPlainObject(block?.activity)) {
					return acc;
				}
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
						title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_DOCUMENT_PROPERTY_TITLE', {
							'#PROPERTY_NAME#': property.Name,
							'#BLOCK_TITLE#': fullTitle
						}),
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
	const RULE_FORM_ID = 'form-settings-rule';
	const SETTINGS_FIELDS_IDS = new Set(['row_title', 'row_activity_editor_comment']);

	// @vue/component
	const CommonNodeSettingsForm = {
		name: 'CommonNodeSettingsForm',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
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
			},
			isSetupTemplateActivity: {
				type: Boolean,
				required: true
			},
			selectedTabId: {
				type: String,
				required: true
			},
			defaultTitle: {
				type: String,
				default: ''
			}
		},
		emits: ['showPreview', 'close'],
		setup() {
			const store = diagramStore();
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				store
			};
		},
		data() {
			return {
				isLoading: true,
				isVisible: this.panelAlreadyOpened,
				hasErrors: false,
				isSubmitting: false,
				hasSettings: false,
				useDocumentContext: false,
				settingsForm: null,
				settingsFormTitle: '',
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
			isRuleHidden() {
				return this.selectedTabId === 'basic';
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
			},
			isRuleHidden(isHidden) {
				this.$nextTick(() => {
					if (!this.$refs.ruleContainer) {
						return;
					}
					const ruleSection = this.$refs.ruleContainer.parentElement;
					if (main_core.Dom.hasClass(ruleSection, '--empty')) {
						main_core.Dom.removeClass(ruleSection, '--empty');
					}
					if (!isHidden && this.$refs.ruleContainer.offsetHeight === 0) {
						main_core.Dom.addClass(ruleSection, '--empty');
					}
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
			extractFormData() {
				const settingsFormData = main_core.ajax.prepareForm(this.settingsForm).data;
				const ruleFormData = this.ruleSettingsForm ? main_core.ajax.prepareForm(this.ruleSettingsForm).data : {};
				const title = main_core.Type.isStringFilled(settingsFormData.title) ? settingsFormData.title : this.defaultTitle || this.currentBlock?.activity?.Properties?.Title || '';
				const formData = this.isSetupTemplateActivity ? {
					...settingsFormData,
					title
				} : {
					...ruleFormData,
					title,
					activity_editor_comment: settingsFormData.activity_editor_comment ?? ''
				};
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
						return false;
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
					compatibleTemplate[0].Children.push(this.currentBlock.activity, ...this.store.getAllBlockAncestors(this.currentBlock).map(({
						block
					}) => block.activity));
					preparedSettingsData.arWorkflowTemplate = JSON.stringify(compatibleTemplate);
					preparedSettingsData.activated = this.currentBlock.activity.Activated;
					const settingControls = await editorAPI.saveNodeSettings(preparedSettingsData);
					if (settingControls) {
						this.store.updateBlockActivityField(this.currentBlock.id, settingControls);
						if (formData.activity_id !== this.currentBlock.id) {
							this.store.updateBlockId(this.currentBlock.id, preparedSettingsData.activity_id);
						}
						await this.store.publicDraft();
						this.handleFormCancel();
						return true;
					}
					return false;
				} catch (error) {
					if (error.errors && error.errors[0] && error.errors[0].message) {
						ui_dialogs_messagebox.MessageBox.alert(error.errors[0].message);
					}
					return false;
				} finally {
					this.isSubmitting = false;
				}
			},
			handleFormSave() {
				if (this.isSubmitting || !this.settingsForm) {
					return;
				}
				const formData = this.extractFormData();
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
			async getNodeSettingsControls(requestId) {
				window.BPAShowSelector = this.showSelector;
				window.HideShow = this.hideShow;
				const compatibleTemplate = [{
					Type: 'NodeWorkflowActivity',
					Children: [],
					Name: 'Template'
				}];
				compatibleTemplate[0].Children.push(this.currentBlock?.activity, ...this.store.getAllBlockAncestors(this.currentBlock).map(({
					block
				}) => block.activity));
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
				try {
					const settingsControls = await editorAPI.getNodeSettingsControls({
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
						return null;
					}
					return settingsControls;
				} catch (error) {
					if (this.isRenderCancelled(requestId)) {
						return null;
					}
					handleResponseError(error);
					return null;
				}
			},
			createFormData() {
				const id = this.currentBlock.activity.Name ?? '';
				const activity = this.currentBlock.activity.Type ?? '';
				const compatibleTemplate = [{
					Type: 'NodeWorkflowActivity',
					Children: [],
					Name: 'Template'
				}];
				compatibleTemplate[0].Children.push(this.currentBlock?.activity, ...this.store.getAllBlockAncestors(this.currentBlock).map(({
					block
				}) => block.activity));
				const {
					createFormData
				} = usePropertyDialog();
				return createFormData({
					id,
					documentType: this.documentType,
					activity,
					workflow: {
						parameters: this.store.template.PARAMETERS,
						variables: this.store.template.VARIABLES,
						template: compatibleTemplate,
						constants: this.store.template.CONSTANTS
					}
				});
			},
			clearDefaultTitleInput(form) {
				if (!form || !main_core.Type.isStringFilled(this.defaultTitle)) {
					return;
				}
				const titleInput = form.querySelector('[name="title"]');
				if (titleInput && titleInput.value === this.defaultTitle) {
					titleInput.value = '';
				}
			},
			applyFieldPlaceholders(form) {
				if (!form) {
					return;
				}
				const titleInput = form.querySelector('[name="title"]');
				if (titleInput) {
					titleInput.placeholder = this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER_MSGVER_1');
				}
				const commentInput = form.querySelector('[name="activity_editor_comment"]');
				if (commentInput) {
					commentInput.placeholder = this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER_MSGVER_1');
				}
			},
			async renderControls() {
				const requestId = ++this.lastRenderRequestId;
				this.isLoading = true;
				if (this.$refs.contentContainer) {
					this.$refs.contentContainer.innerHTML = '';
				}
				if (this.$refs.ruleContainer) {
					this.$refs.ruleContainer.innerHTML = '';
				}
				this.hasErrors = false;
				this.nodeControls = [];
				const settingControls = await this.getNodeSettingsControls(requestId);
				this.useDocumentContext = Boolean(settingControls?.useDocumentContext);
				if (settingControls && main_core.Type.isArray(settingControls.controls)) {
					this.settingsForm = main_core.Tag.render`<form id="form-settings" class="node-settings-form__general-form"></form>`;
					main_core.Dom.append(this.settingsForm, this.$refs.contentContainer);
					this.ruleSettingsForm = main_core.Tag.render`<form></form>`;
					main_core.Dom.append(this.ruleSettingsForm, this.$refs.ruleContainer);
					await this.renderNodeControls(settingControls, requestId);
				} else {
					this.settingsForm = await this.renderPropertyDialog(requestId);
					if (this.settingsForm) {
						main_core.Dom.append(this.settingsForm, this.$refs.contentContainer);
					}
					this.isLoading = false;
					this.hasSettings = Boolean(this.settingsForm);
				}
				if (!this.hasSettings || this.isSetupTemplateActivity) {
					return;
				}
				this.settingsFormData = main_core.ajax.prepareForm(this.settingsForm).data;
				this.settingsFormTitle = this.settingsFormData.title ?? '';
				this.ruleSettingsForm.id = RULE_FORM_ID;
				main_core.Dom.addClass(this.ruleSettingsForm, RULE_FORM_ID);
			},
			// eslint-disable-next-line max-lines-per-function
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

				// eslint-disable-next-line max-lines-per-function
				return new Promise(resolve => {
					if (this.isRenderCancelled(requestId)) {
						resolve();
						return;
					}
					if (main_core.Type.isObject(brokenLinks) && Object.keys(brokenLinks).length > 0) {
						const brokenLinksAlert = this.renderBrokenLinksAlert(brokenLinks);
						main_core.Dom.append(brokenLinksAlert, this.settingsForm);
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
					const settingsFragment = new DocumentFragment();
					const rulesFragment = new DocumentFragment();
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
									this.dynamicComponents[componentKey] = {
										rendererOrComponent,
										wrapper
									};
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
							if (SETTINGS_FIELDS_IDS.has(row.id)) {
								main_core.Dom.append(row, settingsFragment);
							} else {
								main_core.Dom.append(row, rulesFragment);
							}
						}
					});
					main_core.Dom.append(settingsFragment, this.settingsForm);
					main_core.Dom.append(rulesFragment, this.ruleSettingsForm);
					if (this.isRenderCancelled(requestId)) {
						resolve();
						return;
					}
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
									if (field.controlId === 'title' || field.controlId === 'activity_editor_comment') {
										return acc;
									}
									acc[field.fieldName] = field;
									return acc;
								}, {});
								await instance.afterFormRender(this.ruleSettingsForm, activityFields);
							}
							main_core_events.EventEmitter.emit('BX.Bizproc.CommonNodeSettings:onBlocksReady', {
								blocks: this.store.blocks
							});
							this.applyFieldPlaceholders(this.settingsForm);
							this.clearDefaultTitleInput(this.settingsForm);
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
			createSettingsForm(form, notRuleNodes) {
				const settingsForm = form.cloneNode(true);
				const table = settingsForm.querySelector('.adm-detail-content-table');
				table.innerHTML = '';
				const tBody = main_core.Tag.render`<tbody></tbody>`;
				main_core.Dom.append(tBody, table);
				notRuleNodes.forEach(node => main_core.Dom.append(node, tBody));
				return settingsForm;
			},
			async renderPropertyDialog(requestId) {
				const {
					renderPropertyDialog
				} = usePropertyDialog();
				const formData = this.createFormData();
				const form = await renderPropertyDialog(this.$refs.ruleContainer, formData);
				if (this.isRenderCancelled(requestId)) {
					if (form) {
						main_core.Dom.remove(form);
					}
					return null;
				}
				if (!form) {
					return null;
				}
				this.applyFieldPlaceholders(form);
				if (this.isSetupTemplateActivity) {
					this.clearDefaultTitleInput(form);
					return form;
				}
				const settingsContainer = form.querySelector('.adm-detail-content-table > tbody:has(#bpastitle)');
				const notRuleNodes = settingsContainer.querySelectorAll('#id_activity_comment, :scope > tr:has(#bpastitle)');
				notRuleNodes.forEach(node => main_core.Dom.remove(node));
				this.ruleSettingsForm = form;
				const settingsForm = this.createSettingsForm(form, notRuleNodes);
				settingsForm.name = `${settingsForm.name}_settings`;
				const brokenLinksAlert = this.ruleSettingsForm.querySelector('#bp_act_set_broken_link');
				if (brokenLinksAlert) {
					main_core.Dom.remove(brokenLinksAlert);
				}
				this.clearDefaultTitleInput(settingsForm);
				return settingsForm;
			},
			getDocuments() {
				return this.store.getAllBlockAncestors(this.currentBlock).reduce((acc, {
					block
				}) => {
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
					const wrapper = component.wrapper;
					if (!wrapper || wrapper.children.length > 0) {
						return;
					}
					const field = this.customFieldsData[componentKey];
					if (field) {
						const app = ui_vue3.BitrixVue.createApp(component.rendererOrComponent, {
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
					onSelect(value, selector.selectedItem?.getCustomData().get('property'));
				}
			}
		},
		template: `
		<transition name="slide-fade">
			<div
				v-if="isVisible"
				class="node-settings-panel --common"
				:class="{ '--loading': isLoading, '--setup-template-activity': isSetupTemplateActivity }"
				ref="settingsPanel"
			>
				<div class="node-settings-header">
					<h3 class="node-settings-title">
						{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TITLE')}}
					</h3>
					<span class="node-settings-title-close-icon" @click="handleFormCancel"></span>
				</div>
				<slot name="header"/>
				<div class="node-settings-form__controls">
					<slot name="tabs" />
					<slot name="data-inspector-toggle" />
				</div>
				<Transition
					:css="shouldShowWithTransition"
					name="node-settings-transition"
				>
					<div v-show="!isLoading" class="node-settings-content" ref="scrollContainer">
						<div class="temp-block" v-show="!hasSettings">
							<div class="node-settings-content_empty-block"></div>
							<p>{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TEXT')}}</p>
						</div>
						<div
							class="node-settings-form__section"
							:hidden="!isRuleHidden"
						>
							<div class="node-settings-form__section-header">
								<div class="node-settings-form__section-header-main">
									<BIcon :name="iconSet.EDIT_M" :size="30"/>
									<span class="node-settings-form__section-title">
										{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GENERAL_SECTION_TITLE') }}
									</span>
								</div>
								<span class="node-settings-form__section-description">
									{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GENERAL_SECTION_DESCRIPTION') }}
								</span>
							</div>
							<div ref="contentContainer"></div>
						</div>
						<div
							v-if="isRuleHidden"
							class="node-settings-form__section --rules"
						>
							<div class="node-settings-form__section-header">
								<div class="node-settings-form__section-header-main">
									<BIcon :name="iconSet.DATA_READING" :size="28"/>
									<span class="node-settings-form__section-title">
										{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE') }}
									</span>
								</div>
								<span class="node-settings-form__section-description">
									{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_DESCRIPTION_MSGVER_1') }}
								</span>
							</div>
							<slot
								name="common-node-settings-preview"
								:title="settingsFormTitle"
							/>
						</div>
						<div
							class="node-settings-content__rule"
							:hidden="isRuleHidden"
						>
							<div class="node-settings-content__rule_top">
								<span class="node-settings-content__rule_top-operator">
									{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION') }}
								</span>
								<span class="node-settings-content__rule_top-description">
									{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_DESCRIPTION') }}
								</span>
							</div>
							<div ref="ruleContainer"></div>
						</div>
					</div>
				</Transition>
				<div
					v-show="isLoading || hasSettings"
					class="node-settings-footer"
				>
					<template v-if="hasSettings">
						<button
							class="ui-btn --air ui-btn-lg --style-outline-fill-accent ui-btn-no-caps"
							:class="{ 'ui-btn-wait': isSubmitting }"
							@click="handleFormSave"
						>
							{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE')}}
						</button>
						<button
							class="ui-btn ui-btn-lg ui-btn-link ui-btn-no-caps"
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

	// @vue/component
	const CommonNodeSettingsPreview = {
		name: 'CommonNodeSettingsPreview',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			title: {
				type: String,
				required: true
			}
		},
		emits: ['showRules'],
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		computed: {
			previewConstruction() {
				return this.title || this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY');
			}
		},
		template: `
		<div
			class="editor-chart-common-node-settings-preview"
			:data-test-id="$testId('commonNodeSettingsPreview')"
			@click="$emit('showRules')"
		>
			<span
				class="editor-chart-common-node-settings-preview__construction"
				:class="{ '--empty': !title }"
			>
				{{previewConstruction }}
			</span>
			<BIcon
				:size="20"
				class="editor-chart-common-node-settings-preview__edit-icon"
				name="edit-m"
				color="#c9ccd0"
			/>
		</div>
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
		CONDITION: {
			IF_CONDITION: 'condition:if',
			AND_CONDITION: 'condition:and',
			OR_CONDITION: 'condition:or'
		},
		ACTION: 'action',
		FILTER: 'filter',
		OUTPUT: 'output'
	});
	const CRM_FILTER_BACKING_ACTIVITY_TYPE = 'CrmGetDynamicInfoActivity';
	const TASKS_FILTER_BACKING_ACTIVITY_TYPE = 'TasksComplexActivity';
	const NODE_FILTER_BACKING_ACTIVITY_TYPES = Object.freeze({
		crm: CRM_FILTER_BACKING_ACTIVITY_TYPE,
		tasks: TASKS_FILTER_BACKING_ACTIVITY_TYPE
	});
	const CONSTRUCTION_LABELS = Object.freeze({
		[CONSTRUCTION_TYPES.CONDITION.IF_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_IF_CONDITION',
		[CONSTRUCTION_TYPES.CONDITION.AND_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AND_CONDITION',
		[CONSTRUCTION_TYPES.CONDITION.OR_CONDITION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OR_CONDITION',
		[CONSTRUCTION_TYPES.ACTION]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION',
		[CONSTRUCTION_TYPES.FILTER]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER',
		[CONSTRUCTION_TYPES.OUTPUT]: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT'
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
	const CONSTRUCTION_GROUPS = Object.freeze({
		conditions: 'conditions',
		actions: 'actions',
		filters: 'filters',
		outputs: 'outputs'
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
	const ACTIVITY_CONSTRUCTION_TYPES = new Set([CONSTRUCTION_TYPES.ACTION, CONSTRUCTION_TYPES.FILTER]);
	const FILTER_DOCUMENT_PROPERTY_ID$1 = 'Document';
	const filterReturnPropertiesCache = new WeakMap();
	const siblingBlocksCache = new WeakMap();
	function createRuleConstructionBlock(activity) {
		return {
			id: activity.Name,
			node: {
				title: activity.Properties?.Title ?? activity.Name
			},
			activity
		};
	}
	function createSyntheticSourceBlock(currentBlock, filterReturnProperties) {
		const existingReturnProperties = main_core.Type.isArray(currentBlock.activity?.ReturnProperties) ? [...currentBlock.activity.ReturnProperties] : [];
		return {
			...currentBlock,
			activity: {
				...currentBlock.activity,
				Name: currentBlock.id,
				ReturnProperties: [...existingReturnProperties, ...filterReturnProperties]
			}
		};
	}
	function createSyntheticFilterReturnProperty(activity, propertyId, documentProperty) {
		const filterTitle = main_core.Type.isStringFilled(activity.Properties?.Title) ? activity.Properties.Title : main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME');
		return {
			...documentProperty,
			Id: propertyId,
			Name: `${documentProperty.Name} (${filterTitle})`
		};
	}
	function extractDocumentReturnProperty(activity) {
		return main_core.Type.isArray(activity.ReturnProperties) ? activity.ReturnProperties.find(property => {
			return property?.Id === FILTER_DOCUMENT_PROPERTY_ID$1 && main_core.Type.isArrayFilled(property?.Default);
		}) : null;
	}
	function getActivitySignature(activity) {
		if (!main_core.Type.isPlainObject(activity)) {
			return '';
		}
		const documentProperty = extractDocumentReturnProperty(activity);
		const documentDefault = main_core.Type.isArrayFilled(documentProperty?.Default) ? documentProperty.Default.join(',') : '';
		return [activity.Name ?? '', activity.Properties?.Title ?? '', documentProperty?.Name ?? '', documentDefault].join('|');
	}
	function collectAllRuleCards(rules) {
		const result = [];
		for (const rule of rules.values()) {
			for (const ruleCard of rule?.ruleCards ?? []) {
				result.push({
					rule,
					ruleCard
				});
			}
		}
		return result;
	}
	function collectAllConstructions(rules) {
		const result = [];
		for (const {
			rule,
			ruleCard
		} of collectAllRuleCards(rules)) {
			for (const construction of ruleCard?.constructions ?? []) {
				result.push({
					rule,
					ruleCard,
					construction
				});
			}
		}
		return result;
	}
	function collectFilterConstructions(currentSettingsItems, excludedRuleCardId) {
		return collectAllConstructions(currentSettingsItems).filter(item => item.ruleCard?.id !== excludedRuleCardId && item.construction?.type === CONSTRUCTION_TYPES.FILTER);
	}
	function getFilterReturnPropertiesSignature(currentSettingsItems, excludedRuleCardId) {
		if (!(currentSettingsItems instanceof Map)) {
			return '';
		}
		const signature = [];
		for (const {
			ruleCard,
			construction
		} of collectFilterConstructions(currentSettingsItems, excludedRuleCardId)) {
			signature.push(`${ruleCard.id}:${construction.id}:${getActivitySignature(construction.expression?.activityData)}`);
		}
		return signature.join(';');
	}
	function collectSyntheticFilterReturnProperties(currentSettingsItems, excludedRuleCardId) {
		if (!(currentSettingsItems instanceof Map)) {
			return [];
		}
		let cache = filterReturnPropertiesCache.get(currentSettingsItems);
		if (!cache) {
			cache = new Map();
			filterReturnPropertiesCache.set(currentSettingsItems, cache);
		}
		const cacheKey = excludedRuleCardId ?? '';
		const signature = getFilterReturnPropertiesSignature(currentSettingsItems, excludedRuleCardId);
		const cachedValue = cache.get(cacheKey);
		if (cachedValue?.signature === signature) {
			return cachedValue.value;
		}
		const filterReturnProperties = [];
		const seenPropertyIds = new Set();
		for (const {
			construction
		} of collectFilterConstructions(currentSettingsItems, excludedRuleCardId)) {
			const activity = construction.expression?.activityData;
			if (!main_core.Type.isPlainObject(activity)) {
				continue;
			}
			const propertyId = main_core.Type.isStringFilled(activity.Name) ? activity.Name : construction.id;
			if (!main_core.Type.isStringFilled(propertyId) || seenPropertyIds.has(propertyId)) {
				continue;
			}
			const documentProperty = extractDocumentReturnProperty(activity);
			if (!documentProperty) {
				continue;
			}
			filterReturnProperties.push(createSyntheticFilterReturnProperty(activity, propertyId, documentProperty));
			seenPropertyIds.add(propertyId);
		}
		cache.set(cacheKey, {
			signature,
			value: filterReturnProperties
		});
		return filterReturnProperties;
	}
	function getSyntheticSourceBlock(currentBlock, currentSettingsItems, currentRuleCardId) {
		if (!currentBlock) {
			return null;
		}
		const filterReturnProperties = collectSyntheticFilterReturnProperties(currentSettingsItems, currentRuleCardId);
		return main_core.Type.isArrayFilled(filterReturnProperties) ? createSyntheticSourceBlock(currentBlock, filterReturnProperties) : null;
	}
	function getSiblingBlocksSignature(ruleCard, currentConstruction) {
		if (!ruleCard || !currentConstruction) {
			return '';
		}
		const currentPosition = ruleCard.constructions.findIndex(construction => construction.id === currentConstruction.id);
		if (currentPosition <= 0) {
			return '';
		}
		return ruleCard.constructions.slice(0, currentPosition).map(construction => {
			return `${construction.id}:${construction.type}:${getActivitySignature(construction.expression?.activityData)}`;
		}).join(';');
	}
	function collectSiblingBlocks(ruleCard, currentConstruction) {
		if (!ruleCard || !currentConstruction) {
			return [];
		}
		let cache = siblingBlocksCache.get(ruleCard);
		if (!cache) {
			cache = new Map();
			siblingBlocksCache.set(ruleCard, cache);
		}
		const cacheKey = currentConstruction.id;
		const signature = getSiblingBlocksSignature(ruleCard, currentConstruction);
		const cachedValue = cache.get(cacheKey);
		if (cachedValue?.signature === signature) {
			return cachedValue.value;
		}
		const currentPosition = ruleCard.constructions.findIndex(construction => construction.id === currentConstruction.id);
		if (currentPosition <= 0) {
			cache.set(cacheKey, {
				signature,
				value: []
			});
			return [];
		}
		const siblingBlocks = ruleCard.constructions.slice(0, currentPosition).reduce((acc, construction) => {
			if (!ACTIVITY_CONSTRUCTION_TYPES.has(construction.type)) {
				return acc;
			}
			const activity = construction.expression?.activityData;
			if (!main_core.Type.isPlainObject(activity) || !main_core.Type.isStringFilled(activity.Name)) {
				return acc;
			}
			acc.push(createRuleConstructionBlock(activity));
			return acc;
		}, []);
		cache.set(cacheKey, {
			signature,
			value: siblingBlocks
		});
		return siblingBlocks;
	}
	const getConnectedBlocksContextForConstruction = (currentBlock, currentPortId, ruleCard, currentConstruction, currentSettingsItems = null) => {
		const store = diagramStore();
		const ancestorBlocks = store.getAllBlockAncestors(currentBlock, currentPortId).reduce((acc, ancestor) => {
			const block = main_core.Type.isPlainObject(ancestor?.block) ? ancestor.block : ancestor;
			if (main_core.Type.isPlainObject(block)) {
				acc.push(block);
			}
			return acc;
		}, []);
		const syntheticSourceBlock = getSyntheticSourceBlock(currentBlock, currentSettingsItems, ruleCard?.id ?? null);
		const siblingBlocks = collectSiblingBlocks(ruleCard, currentConstruction);
		const allBlocks = syntheticSourceBlock ? [syntheticSourceBlock, ...siblingBlocks, ...ancestorBlocks] : [...siblingBlocks, ...ancestorBlocks];
		return {
			syntheticSourceBlock,
			siblingBlocks,
			ancestorBlocks,
			allBlocks
		};
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
			currentRule: null,
			prevSavedNodeSettings: null,
			ports: null,
			nodeSettings: null,
			block: null,
			lastFetchId: 0,
			selectedTabId: NODE_SETTINGS_TABS.basic
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
			async fetchNodeSettings(block, defaultTitlePromise = Promise.resolve('')) {
				const fetchId = ++this.lastFetchId;
				this.nodeSettings = {
					title: '',
					description: '',
					rules: new Map(),
					relations: new Map(),
					blockId: block.id,
					filterSupported: false
				};
				this.isLoading = true;
				const [loaded, defaultTitle] = await Promise.all([complexNodeApi.loadSettings(block.activity), defaultTitlePromise]);
				const {
					actions,
					rules,
					fixedDocumentType,
					filterSupported,
					title: loadedTitle,
					description
				} = loaded;
				if (this.lastFetchId !== fetchId || !this.nodeSettings) {
					return;
				}
				if (main_core.Type.isStringFilled(loadedTitle) && loadedTitle !== defaultTitle) {
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
					description,
					filterSupported
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
				let firstRulePort = null;
				this.ports.forEach(port => {
					if (port.type === PORT_TYPES.input) {
						if (!rulesIds.has(port.id)) {
							this.addRule(port.id);
						}
						if (!firstRulePort) {
							firstRulePort = port;
						}
						return;
					}
					if (port.type === PORT_TYPES.inputRelation) {
						this.addRelation(port.id);
					}
				});
				this.setCurrentRule(firstRulePort);
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
				this.selectedTabId = NODE_SETTINGS_TABS.basic;
			},
			toggleVisibility(isShown) {
				this.isShown = isShown;
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
			addConstruction(ruleCard, constructionType) {
				const newConstruction = {
					id: createUniqueId(),
					type: constructionType,
					expression: {
						title: '',
						valueId: '',
						value: ''
					}
				};
				if (constructionType === CONSTRUCTION_TYPES.ACTION || constructionType === CONSTRUCTION_TYPES.FILTER) {
					newConstruction.expression.value = {};
					newConstruction.expression.actionId = constructionType === CONSTRUCTION_TYPES.FILTER ? CRM_FILTER_BACKING_ACTIVITY_TYPE : '';
					newConstruction.expression.rawActivityData = null;
					newConstruction.expression.activityData = null;
					newConstruction.expression.document = null;
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
				const pos = ruleCard.constructions.length;
				ruleCard.constructions.splice(pos, 0, newConstruction);
			},
			deleteConstruction(ruleCard, construction) {
				ruleCard.constructions.splice(ruleCard.constructions.indexOf(construction), 1);
				if (ruleCard.constructions.length === 0) {
					this.deleteRuleCard(ruleCard);
				}
			},
			deleteRuleSettings(ruleId) {
				const isRule = this.nodeSettings.rules.has(ruleId);
				const settingsItems = isRule ? this.nodeSettings.rules : this.nodeSettings.relations;
				settingsItems.delete(ruleId);
				const portType = isRule ? PORT_TYPES.input : PORT_TYPES.inputRelation;
				return this.syncOutputPortsWithRules(portType);
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
				return this.syncOutputPortsWithRules(PORT_TYPES.input);
			},
			syncOutputPortsWithRules(portType) {
				if (!this.block) {
					return null;
				}
				const type = portType ?? this.currentRule?.type;
				const settingsItems = type === PORT_TYPES.input ? this.nodeSettings.rules : this.nodeSettings.relations;
				const outputConstructions = [...settingsItems.values()].flatMap(r => {
					return r.ruleCards.flatMap(ruleCard => {
						return ruleCard.constructions.filter(construction => construction.type === CONSTRUCTION_TYPES.OUTPUT);
					});
				});
				const outputType = type === PORT_TYPES.input ? PORT_TYPES.output : PORT_TYPES.outputRelation;
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
			async saveRule(ruleId, documentType) {
				const {
					outputPortsToAdd
				} = await this.savePortRule(ruleId, documentType);
				outputPortsToAdd.forEach(({
					portId,
					title
				}) => {
					this.addRulePort(portId, PORT_TYPES.output, title);
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
			async saveRelation(relationId) {
				await new Promise(resolve => {
					setTimeout(resolve, 2000);
				});
				const rule = this.nodeSettings.relations.get(relationId);
				rule.isFilled = true;
				const {
					outputPortsToAdd
				} = this.syncOutputPortsWithRules(PORT_TYPES.inputRelation);
				outputPortsToAdd.forEach(({
					portId,
					title
				}) => {
					this.addRelationPort(portId, PORT_TYPES.outputRelation, title);
				});
			},
			async saveForm(documentType, defaultTitle = '') {
				try {
					const nodeSettingsToSave = {
						...this.nodeSettings,
						title: main_core.Type.isStringFilled(this.nodeSettings.title) ? this.nodeSettings.title : defaultTitle
					};
					return await complexNodeApi.saveSettings(nodeSettingsToSave, this.block.activity, documentType);
				} catch (e) {
					console.error(e);
					throw e;
				}
			},
			discardFormSettings() {
				this.nodeSettings = main_core.Runtime.clone(this.prevSavedNodeSettings);
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
				if (portId === this.currentRule.id) {
					this.setCurrentRule(null);
				}
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
								Object.assign(construction.expression, {
									auxPortId: null,
									auxPortTitle: null
								});
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
			class="editor-chart-node-settings-layout"
			:class="{ '--saving': isSaving, '--loading': isLoading }"
		>
			<template v-if="!isLoading">
				<slot name="header" />
				<div class="editor-chart-node-settings-layout__controls">
					<slot name="tabs" />
					<slot name="data-inspector-toggle" />
				</div>
				<slot name="content" />
				<div class="editor-chart-node-settings-layout__footer">
					<slot name="actions" />
				</div>
			</template>
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
			groupedConstructionTypes() {
				const {
					CONDITION,
					...rest
				} = CONSTRUCTION_TYPES;
				const conditionTypes = new Set(Object.values(CONDITION));
				const restTypes = Object.values(rest);
				return [...conditionTypes, ...restTypes].reduce((acc, currentType) => {
					if (conditionTypes.has(currentType)) {
						return {
							...acc,
							[currentType]: 'condition'
						};
					}
					return {
						...acc,
						[currentType]: currentType
					};
				}, {});
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
				if (type === CONSTRUCTION_TYPES.FILTER) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME');
				}
				if (type === CONSTRUCTION_TYPES.ACTION) {
					if (!expression.actionId) {
						return '';
					}
					return this.nodeSettings.actions.get(expression.actionId).title;
				}
				if (type === CONSTRUCTION_TYPES.OUTPUT || !expression.field) {
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
				if (type === CONSTRUCTION_TYPES.OUTPUT) {
					return title;
				}
				if (type === CONSTRUCTION_TYPES.FILTER) {
					return '';
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
						:class="['--' + groupedConstructionTypes[construction.type]]"
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
							v-if="groupedConstructionTypes[construction.type] !== groupedConstructionTypes.action"
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
			}
		},
		emits: ['drop', 'scroll-layout'],
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
		<div
			class="editor-chart-node-settings-rules-layout"
			:class="{ '--saving': isSaving }"
			@scroll="$emit('scroll-layout')"
		>
			<template v-if="currentRule">
				<slot name="addConstructionToolbar" />
				<div
					class="editor-chart-node-settings-rules-layout__content"
					v-drag-construction="onDrop"
				>
					<slot
						v-for="ruleCard in ruleCards"
						:key="ruleCard.id"
						:ruleCard="ruleCard"
						name="ruleCard"
					/>
					<template
						v-if="ruleCards.length === 0"
					>
						<div class="editor-chart-node-settings-rules-layout__empty">
							<h3 class="editor-chart-node-settings-rules-layout__empty_head">
								{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_SETTINGS_EMPTY_STATE_HEAD') }}
							</h3>
							<p class="editor-chart-node-settings-rules-layout__empty_text">
								{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_SETTINGS_EMPTY_STATE_TEXT') }}
							</p>
						</div>
					</template>
				</div>
			</template>
		</div>
	`
	};

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
		emits: ['addConstruction'],
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage,
				iconColor: 'var(--ui-color-palette-gray-50)',
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			conditionSet() {
				return new Set(Object.values(CONSTRUCTION_TYPES.CONDITION));
			},
			groupedConstructions() {
				return this.ruleCard.constructions.reduce((acc, construction) => {
					if (this.conditionSet.has(construction.type)) {
						return {
							...acc,
							conditions: [...(acc.conditions ?? []), construction]
						};
					}
					if (construction.type === CONSTRUCTION_TYPES.ACTION) {
						return {
							...acc,
							actions: [...(acc.actions ?? []), construction]
						};
					}
					if (construction.type === CONSTRUCTION_TYPES.FILTER) {
						return {
							...acc,
							filters: [...(acc.filters ?? []), construction]
						};
					}
					if (construction.type === CONSTRUCTION_TYPES.OUTPUT) {
						return {
							...acc,
							outputs: [...(acc.outputs ?? []), construction]
						};
					}
					return acc;
				}, {});
			}
		},
		methods: {
			onAddConstruction(groupName) {
				this.$emit('addConstruction', groupName);
			},
			getAddConstructionBtnTitle(groupName) {
				return groupName === CONSTRUCTION_GROUPS.conditions ? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_TOOLBAR_ITEM') : this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_TOOLBAR_ITEM');
			},
			isNotOutputsGroup(groupName) {
				return groupName !== CONSTRUCTION_GROUPS.outputs && groupName !== CONSTRUCTION_GROUPS.filters;
			}
		},
		template: `
		<div
			data-name="rule-card"
			class="editor-chart-node-settings-rule-card"
			:data-id="ruleCard.id"
		>
			<div class="editor-chart-node-settings-rule-card__top">
				<BIcon
					:name="iconSet.DRAG_M"
					class="editor-chart-node-settings-rule-card__dnd-icon"
					draggable="true"
					:color="iconColor"
					:size="20"
				/>
				<span class="editor-chart-node-settings-rule-card__top_title">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_CARD_TITLE') }}
				</span>
				<slot name="deleteRuleCard" />
			</div>
			<div
				v-for="(group, groupName) in groupedConstructions"
				:key="groupName"
				:class="'--' + groupName"
				class="editor-chart-node-settings-rule-card__group"
			>
				<slot
					v-for="construction in group"
					name="construction"
					:key="construction.id"
					:construction="construction"
				/>
				<div
					v-if="isNotOutputsGroup(groupName)"
					@click="onAddConstruction(groupName)"
					class="editor-chart-node-settings-rule-card__group_add-construction-btn"
				>
					<BIcon
						:name="iconSet.PLUS_L"
						:size="18"
					/>
					<span>
						{{ getAddConstructionBtnTitle(groupName) }}
					</span>
				</div>
			</div>
			<slot name="addConstructionButton" />
		</div>
	`
	};

	const RULE_CONSTRUCTION_MODES = {
		expert: 'expert'
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
			conditionSet() {
				return new Set(Object.values(CONSTRUCTION_TYPES.CONDITION));
			},
			constructionClassName() {
				return {
					'--condition': this.conditionSet.has(this.construction.type),
					'--action': CONSTRUCTION_TYPES.ACTION === this.construction.type,
					'--filter': CONSTRUCTION_TYPES.FILTER === this.construction.type,
					'--output': CONSTRUCTION_TYPES.OUTPUT === this.construction.type
				};
			},
			expressionName() {
				return this.conditionSet.has(this.construction.type) ? 'condition' : this.construction.type;
			},
			isBooleanType() {
				return this.booleanTypes.includes(this.construction.type);
			},
			booleanTypes() {
				return [CONSTRUCTION_TYPES.CONDITION.AND_CONDITION, CONSTRUCTION_TYPES.CONDITION.OR_CONDITION];
			},
			isExpertMode() {
				return this.selectedMode === RULE_CONSTRUCTION_MODES.expert;
			},
			parsedMessage() {
				return this.construction.type === CONSTRUCTION_TYPES.action ? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_THEN') : this.getMessage(CONSTRUCTION_LABELS[this.construction.type]);
			},
			description() {
				if (this.conditionSet.has(this.construction.type)) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_DESCRIPTION');
				}
				const descriptions = {
					[CONSTRUCTION_TYPES.ACTION]: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_DESCRIPTION'),
					[CONSTRUCTION_TYPES.OUTPUT]: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT_DESCRIPTION')
				};
				return descriptions[this.construction.type];
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
			<div class="editor-chart-node-settings-rule-construction__top">
				<BIcon
					:size="20"
					color="#a8adb4"
					class="editor-chart-node-settings-rule-construction__dnd-icon"
					name="drag-m"
					draggable="true"
				/>
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
				<span class="editor-chart-node-settings-rule-construction__description">
					{{ description }}
				</span>
				<slot
					name="deleteConstructionButton"
				/>
			</div>
			<div class="editor-chart-node-settings-rule-construction__expression-form">
				<slot
					:name="expressionName"
					:isExpertMode="isExpertMode"
				/>
			</div>
		</div>
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
		props: {
			focusable: {
				type: Boolean,
				default: false
			}
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
			:focusable="isFocused && focusable"
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

	const useDefaultTitle = () => {
		const catalogStore = useCatalogStore();
		return {
			waitForCatalog: () => catalogStore.init(),
			getDefaultTitle: activity => catalogStore.getDefaultTitle(activity),
			resolveDefaultTitle: async activity => {
				await catalogStore.init();
				return catalogStore.getDefaultTitle(activity);
			}
		};
	};

	function getContextMenuItemHtml(text, shortcut) {
		return `
		<span class="editor-chart-block-control-menu-item">
			${text}
			<span class="editor-chart-block-control-menu-item__action-code">
				<span class="editor-chart-block-control-menu-item__action-code_text">
					${shortcut}
				</span>
			</span>
		</span>
	`;
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
		#nodeInspectorStore = null;
		#diagramStore = null;
		#bufferStore = null;
		#highlightedBlocks = null;
		#isMac = false;
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
			this.#isMac = main_core.Browser.isMac();
			this.#highlightedBlocks = ui_blockDiagram.useHighlightedBlocks();
			this.#blockDiagram.hooks.startDragBlock.on(block => {
				const settingsBlockId = this.#commonNodeSettingsStore.block?.id ?? this.#complexNodeSettingsStore.block?.id;
				if (settingsBlockId && settingsBlockId !== block.value.id) {
					this.#highlightedBlocks.clear();
					this.#highlightedBlocks.add(settingsBlockId);
				}
			});
			this.#nodeInspectorStore = useNodeDataInspectorStore();
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
				return false;
			}
			if (!this.#commonNodeSettingsStore.isVisible) {
				this.#resetSettingsState();
				this.#appStore.showRightPanel();
			}
			await useDefaultTitle().waitForCatalog();
			this.#commonNodeSettingsStore.showSettings(block);
			this.#nodeInspectorStore.setBlock(block);
			return true;
		}
		async showComplexNodeSettings(block) {
			const shouldSwitch = await this.#shouldSwitchToBlock();
			if (!shouldSwitch) {
				return false;
			}
			if (!this.#complexNodeSettingsStore.isShown) {
				this.#resetSettingsState();
				this.#appStore.showRightPanel();
				this.#complexNodeSettingsStore.toggleVisibility(true);
			}
			this.#nodeInspectorStore.setBlock(block);
			await this.#complexNodeSettingsStore.fetchNodeSettings(block, useDefaultTitle().resolveDefaultTitle(block.activity));
			return true;
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
				html: getContextMenuItemHtml(this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'), this.#isMac ? '⌫' : 'Del'),
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
		getSettingsBlockMenuOptions(block) {
			return [this.getCtxMenuItemCopyBlock(block), this.getCtxMenuItemDeleteBlock(block)];
		}
		getCtxMenuItemCopyBlock(block) {
			const itemId = 'copyBlock';
			return {
				id: itemId,
				html: getContextMenuItemHtml(this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_COPY'), this.#isMac ? '⌘ С' : 'Ctrl-C'),
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

	const IS_MAC = main_core.Browser.isMac();
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
				html: getContextMenuItemHtml(getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_COPY'), IS_MAC ? '⌘ С' : 'Ctrl-C'),
				onclick: handleCopy
			}, {
				id: 'delete-group',
				html: getContextMenuItemHtml(getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'), IS_MAC ? '⌫' : 'Del'),
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
					html: getContextMenuItemHtml(this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_PASTE'), IS_MAC ? '⌘ V' : 'Ctrl-V'),
					onclick: point => {
						this.performPaste(point);
					}
				};
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
			},
			size: {
				type: Number,
				default: 18
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
			:size="size"
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
			},
			size: {
				type: Number,
				default: 18
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
			:size="size"
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
				portPosition: ui_blockDiagram.PORT_POSITION,
				shouldAnimateBlock
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
													:blockId="block.id"
													:animate="shouldAnimateBlock(block)"
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
													:blockId="block.id"
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
	const DEFAULT_BLOCK_WIDTH = 260;
	const SWITCH_NODE_ACTIVITY = 'SwitchNode';
	const SWITCH_NODE_WIDTH = 180;
	const SWITCH_NODE_MIN_RULES = 3;
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
				getMessage,
				shouldAnimateBlock
			};
		},
		computed: {
			userTitle() {
				return getBlockUserTitle(this.block);
			},
			auxPortsCount() {
				return this.block.ports.filter(port => port.type === PORT_TYPES.aux).length;
			},
			isSwitchNode() {
				return this.block.activity?.Type === SWITCH_NODE_ACTIVITY;
			},
			blockWidth() {
				if (this.isSwitchNode) {
					return SWITCH_NODE_WIDTH;
				}
				return this.block.dimensions?.width ?? DEFAULT_BLOCK_WIDTH;
			},
			minRuleItemsCount() {
				return this.isSwitchNode ? SWITCH_NODE_MIN_RULES : undefined;
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
											:blockId="block.id"
											:animate="shouldAnimateBlock(block)"
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
									:minRuleItemsCount="minRuleItemsCount"
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
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
				shouldAnimateBlock
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
													:blockId="block.id"
													:animate="shouldAnimateBlock(block)"
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
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
				shouldAnimateBlock
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
											:blockId="block.id"
											:animate="shouldAnimateBlock(block)"
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

	const SETUP_TEMPLATE_ACTIVITY = 'SetupTemplateActivity';
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
			const {
				getMessage
			} = useLoc();
			return {
				iconSet: ui_iconSet_api_vue.Outline,
				portTypes: PORT_TYPES,
				portPosition: ui_blockDiagram.PORT_POSITION,
				blockMediator: new BlockMediator(),
				blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
				getMessage,
				shouldAnimateBlock
			};
		},
		computed: {
			contextMenuItems() {
				return this.blockMediator.getCommonBlockMenuOptions(this.block);
			},
			isSetupTemplateActivity() {
				return this.block.activity?.Type === SETUP_TEMPLATE_ACTIVITY;
			},
			constantsCount() {
				if (!this.isSetupTemplateActivity) {
					return 0;
				}
				const items = parseItemsFromBlocksJson(this.block.activity?.Properties?.blocks);
				return items.filter(item => item?.itemType === 'constant').length;
			},
			hasConstants() {
				return this.constantsCount > 0;
			},
			constantsLabel() {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_SERVICE_CONSTANTS_COUNT', {
					'#count#': this.constantsCount
				});
			}
		},
		template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="260"
					:height="isSetupTemplateActivity ? 162 : 96"
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
													:blockId="block.id"
													:animate="shouldAnimateBlock(block)"
												/>
											</template>
										</BlockHeader>
									</template>
								</PortsLayout>
							</template>

							<template #[blockLayoutSlotNames.DEFAULT]>
								<BlockContent
									:colorIndex="block.node.colorIndex"
									:contentBlockColor="block.node.contentBlockColor"
									:deactivated="!isBlockActivated"
									:class="{ 'editor-chart-block-service__content--large': isSetupTemplateActivity }"
								>
									<span
										v-if="hasConstants"
										class="editor-chart-block-service__constants-label"
									>
										{{ constantsLabel }}
									</span>
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
			BackToGroupsBtn,
			CatalogItemTooltip
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
				<SearchCatalogItemsInput :focusable="isExpandedCatalog"/>
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
								<CatalogItemTooltip
									v-for="item in group.items"
									:key="item.id"
									:title="item.title"
									:subtitle="item.subtitle"
								>
									<CatalogItem
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
								</CatalogItemTooltip>
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
						<CatalogItemTooltip
							:title="item.title"
							:subtitle="item.subtitle"
						>
							<ChangeFoundedCatalogItem :item="item">
								<template #[getDragItemSlotName(item.type)]="{ item }">
									<slot
										:name="getDragItemSlotName(item.type)"
										:item="item"
									/>
								</template>
							</ChangeFoundedCatalogItem>
						</CatalogItemTooltip>
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

	const ACTIVITY_NAME = 'SetupTemplateActivity';

	// @vue/components
	const CommonNodeSettings = {
		name: 'CommonNodeSettings',
		components: {
			CommonNodeSettingsForm,
			CommonNodeSettingsPreview,
			EditorChartTabs
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			const {
				getDefaultTitle
			} = useDefaultTitle();
			return {
				getMessage,
				blockMediator: new BlockMediator(),
				getDefaultTitle
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCommonNodeSettingsStore, ['isVisible', 'block']),
			...ui_vue3_pinia.mapWritableState(useCommonNodeSettingsStore, ['selectedTabId']),
			...ui_vue3_pinia.mapState(diagramStore, ['documentType']),
			...ui_vue3_pinia.mapState(useAppStore, ['isShownRightPanel']),
			isSetupTemplateActivity() {
				return this.block.activity.Type === ACTIVITY_NAME;
			},
			defaultTitle() {
				return this.block ? this.getDefaultTitle(this.block.activity) : '';
			},
			moreMenuItems() {
				return this.block ? this.blockMediator.getSettingsBlockMenuOptions(this.block) : [];
			},
			tabs() {
				return new Map([[NODE_SETTINGS_TABS.basic, {
					id: NODE_SETTINGS_TABS.basic,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_BASIC')
				}], [NODE_SETTINGS_TABS.rules, {
					id: NODE_SETTINGS_TABS.rules,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_RULES')
				}]]);
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useAppStore, ['hideRightPanel', 'setShowPreviewPanel']),
			...ui_vue3_pinia.mapActions(useCommonNodeSettingsStore, ['hideSettings']),
			onCloseSettings() {
				this.hideSettings();
				this.hideRightPanel();
			},
			onShowRules() {
				this.selectedTabId = NODE_SETTINGS_TABS.rules;
			}
		},
		template: `
		<CommonNodeSettingsForm
			v-if="isVisible"
			:block="block"
			:documentType="documentType"
			:panelAlreadyOpened="isShownRightPanel"
			:isSetupTemplateActivity="isSetupTemplateActivity"
			:selectedTabId="selectedTabId"
			:defaultTitle="defaultTitle"
			@close="onCloseSettings"
			@showPreview="setShowPreviewPanel"
		>
			<template #header>
				<slot
					name="header"
					:block="block"
					:moreMenuItems="moreMenuItems"
					:onDeletedBlock="onCloseSettings"
				/>
			</template>

			<template #tabs>
				<EditorChartTabs
					v-model="selectedTabId"
					:tabs="tabs"
				/>
			</template>

			<template #data-inspector-toggle>
				<slot name="data-inspector-toggle" />
			</template>

			<template #common-node-settings-preview="{ title }">
				<CommonNodeSettingsPreview
					:title="title"
					@showRules="onShowRules"
				/>
			</template>
		</CommonNodeSettingsForm>
	`
	};

	// @vue/component
	const NodeDataInspectorLayout = {
		name: 'NodeDataInspectorLayout',
		template: `
		<div class="node-data-inspector-layout">
			<div class="node-data-inspector-layout__header">
				<div class="node-data-inspector-layout__header-title">
					<slot name="title"/>
				</div>
				<div class="node-data-inspector-layout__header-controls">
					<slot name="header-controls"/>
				</div>
			</div>
			<div class="node-data-inspector-layout__content">
				<div class="node-data-inspector-layout__content-controls">
					<slot name="filter"/>
					<div class="node-data-inspector-layout__content-controls-search">
						<slot name="search"/>
					</div>
					<div class="node-data-inspector-layout__content-controls-view-mode">
						<slot name="view-mode"/>
					</div>
				</div>
				<div class="node-data-inspector-layout__divider"></div>
			</div>
			<div class="node-data-inspector-layout__content__data-viewer">
				<slot name="data-viewer"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const InspectorSearch = {
		name: 'InspectorSearch',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			modelValue: {
				type: String,
				required: true
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				isFocused: false
			};
		},
		computed: {
			iconColor() {
				return this.isActive ? 'var(--ui-color-accent-main-primary)' : 'var(--ui-color-gray-50)';
			},
			isActive() {
				return this.isFocused || this.modelValue.length > 0;
			},
			placeholderText() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_SEARCH');
			},
			Outline: () => ui_iconSet_api_vue.Outline
		},
		methods: {
			onFocus() {
				this.isFocused = true;
			},
			onBlur() {
				this.isFocused = false;
			},
			onClear() {
				this.$emit('update:modelValue', '');
			}
		},
		template: `
		<div class='inspector-search-container' :class="{ '--active': isActive }">
			<input
				class="inspector-search__input"
				:placeholder="placeholderText"
				:value="modelValue"
				@focus="onFocus"
				@blur="onBlur"
				@input="$emit('update:modelValue', $event.target.value)"
			/>
			<button
				v-if="modelValue.length > 0"
				type="button"
				class="inspector-search__clear-btn"
				@mousedown.prevent
				@click="onClear"
			>
				<BIcon
					:name="Outline.CROSS_L"
					:size="20"
					color="var(--ui-color-gray-50)"
				/>
			</button>
			<div v-else class="inspector-search__icon">
				<BIcon
					:name="Outline.SEARCH"
					:size="20"
					:color='iconColor'
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const InspectorViewModeButton = {
		name: 'InspectorViewModeButton',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			isActive: {
				type: Boolean,
				default: false
			},
			title: {
				type: String,
				required: true
			}
		},
		computed: {
			design() {
				return this.isActive ? ui_system_chip_vue.ChipDesign.OutlineAccent2 : ui_system_chip_vue.ChipDesign.Outline;
			},
			ChipSize: () => ui_system_chip_vue.ChipSize
		},
		template: `
		<Chip 
			:text="title"
			:size="ChipSize.Md"
			:design="design"
		/>
	`
	};

	// @vue/component
	const InspectorGridView = {
		name: 'InspectorGridView',
		props: {
			countRowsOnPage: {
				type: Number,
				required: true
			},
			currentPageNumber: {
				type: Number,
				required: true
			},
			/** @type SelectedGridViewGroup */
			selectedGridViewGroup: {
				type: [null, Object],
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
			heads() {
				const headData = [['name', this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_NAME_COLUMN')], ['type', this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_TYPE_COLUMN')]];
				return new Map(headData);
			},
			rows() {
				if (!this.selectedGridViewGroup) {
					return new Map();
				}
				const {
					values
				} = this.selectedGridViewGroup;
				return new Map(values.map(({
					text,
					dataType
				}, i) => {
					return [`rowId_${i}`, {
						id: `rowId_${i}`,
						name: text,
						type: dataType
					}];
				}));
			},
			renderedRowsIds() {
				const rowsIds = [...this.rows.keys()];
				const startIdx = (this.currentPageNumber - 1) * this.countRowsOnPage;
				return rowsIds.slice(startIdx, startIdx + this.countRowsOnPage);
			}
		},
		methods: {
			getRowCellClass(headId) {
				if (headId === 'name') {
					return '--name';
				}
				if (headId === 'type') {
					return '--type';
				}
				return '';
			}
		},
		template: `
		<div class="editor-chart-inspector-grid-view">
			<div class="editor-chart-inspector-grid-view__table">
				<div class="editor-chart-inspector-grid-view__heads">
					<span
						v-for="[id, label] in heads"
						:key="id"
						class="editor-chart-inspector-grid-view__cell"
					>
						{{ label }}
					</span>
				</div>
				<div class="editor-chart-inspector-grid-view__rows">
					<div
						v-for="rowId in renderedRowsIds"
						class="editor-chart-inspector-grid-view__row"
					>
						<span
							v-for="[headId] in heads"
							class="editor-chart-inspector-grid-view__cell"
							:key="rowId + '-' + headId"
							:class="getRowCellClass(headId)"
						>
							{{ rows.get(rowId)[headId] }}
						</span>
					</div>
				</div>
			</div>
			<slot
				name="navigate-grid-view"
				:totalRowsCount="rows.size"
			/>
		</div>
	`
	};

	const InspectorViewItemTypeDict = Object.freeze({
		GROUP: 'group',
		SECTION: 'section',
		NODE: 'node',
		DATA_GROUP: 'data-group',
		DATA: 'data'
	});
	const DataTypeBaseType = Object.freeze({
		BOOL: 'bool',
		DATE: 'date',
		DATETIME: 'datetime',
		DOUBLE: 'double',
		DOCUMENT: 'document',
		FILE: 'file',
		INT: 'int',
		SELECT: 'select',
		INTERNALSELECT: 'internalselect',
		STRING: 'string',
		TEXT: 'text',
		USER: 'user',
		TIME: 'time'
	});
	const DataTypeLabelMap = Object.freeze({
		[DataTypeBaseType.BOOL]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_BOOL'),
		[DataTypeBaseType.DATE]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_DATE'),
		[DataTypeBaseType.DATETIME]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_DATETIME'),
		[DataTypeBaseType.DOUBLE]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_DOUBLE'),
		[DataTypeBaseType.FILE]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_FILE'),
		[DataTypeBaseType.INT]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_INT'),
		[DataTypeBaseType.SELECT]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_SELECT'),
		[DataTypeBaseType.INTERNALSELECT]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_INTERNALSELECT'),
		[DataTypeBaseType.STRING]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_STRING'),
		[DataTypeBaseType.TEXT]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_TEXT'),
		[DataTypeBaseType.USER]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_USER'),
		[DataTypeBaseType.TIME]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_TIME'),
		[DataTypeBaseType.DOCUMENT]: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TYPE_DOCUMENT')
	});
	const InspectorViewItemGroupColorDict = Object.freeze({
		GREEN: 'green',
		BLUE: 'blue',
		ORANGE: 'orange',
		GRAY: 'gray'
	});

	const InspectorSchemeCollapsibleItemView = {
		name: 'InspectorSchemeCollapsibleItemView',
		emits: ['toggle'],
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			item: {
				/** @type InspectorViewItemBase */
				type: Object,
				required: true
			},
			itemType: {
				/** @type InspectorViewItemType */
				type: String,
				default: ''
			},
			collapsed: {
				type: Boolean,
				default: false
			},
			hasChildren: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			itemTitle() {
				return this.item.text;
			},
			isGroup() {
				return this.itemType === InspectorViewItemTypeDict.GROUP;
			},
			isSection() {
				return this.itemType === InspectorViewItemTypeDict.SECTION;
			},
			isNode() {
				return this.itemType === InspectorViewItemTypeDict.NODE;
			},
			hasNodeIcon() {
				if (!main_core.Type.isStringFilled(this.item?.icon)) {
					return false;
				}
				return ui_iconSet_api_vue.Outline[this.item.icon] ?? false;
			},
			hasGroupIcon() {
				return main_core.Type.isStringFilled(this.item?.icon);
			},
			nodeIconName() {
				if (main_core.Type.isStringFilled(this.item?.icon)) {
					return ui_iconSet_api_vue.Outline[this.item.icon];
				}
				return ui_iconSet_api_vue.Outline.FILE;
			},
			collapseIconName() {
				return this.collapsed ? ui_iconSet_api_vue.Outline.CHEVRON_RIGHT_L : ui_iconSet_api_vue.Outline.CHEVRON_DOWN_L;
			},
			typeClass() {
				return `--${this.itemType}`;
			}
		},
		template: `
		<div class="inspector-scheme-view__collapsible-header" :class="typeClass">
			<div
				v-if="hasChildren"
				class="inspector-scheme-view__collapsible-header__toggle-button"
				@click="$emit('toggle')"
			>
				<BIcon :name="collapseIconName" :size="16" />
			</div>
			<template v-if="isGroup">
				<div class="inspector-scheme-view__collapsible-item-group-title">
					<BIcon v-if="hasGroupIcon" :name="item.icon" :size="24"/>
					<span class="inspector-scheme-view__collapsible-group-item-title">{{ item.text }}</span>
				</div>
			</template>
			<template v-else>
				<div v-if="isNode" class="inspector-scheme-view__collapsible-header__icon">
					<BIcon :name="nodeIconName" :size="20"/>
				</div>
				<span class="inspector-scheme-view__collapsible-item-title" :class="typeClass">{{ item.text }}</span>
			</template>
		</div>
	`
	};

	const SupportedTags = new Set(['INPUT', 'TEXTAREA']);
	const DragGhostClass = '--ghost';
	const handlerState = new WeakMap();
	function resolveDragText(binding) {
		return main_core.Type.isStringFilled(binding?.value) ? binding.value : '';
	}
	function getInputTarget(target) {
		if (SupportedTags.has(target.tagName)) {
			return target;
		}
		return target.closest('input, textarea, [contenteditable="true"]');
	}
	function insertDraggedText(target, text) {
		if (!SupportedTags.has(target.tagName)) {
			return;
		}
		const input = target;
		const start = input.selectionStart ?? input.value.length;
		const end = input.selectionEnd ?? input.value.length;
		input.focus();
		input.setRangeText(text, start, end, 'end');
	}
	function createDragGhost(target) {
		const ghost = target.cloneNode(true);
		main_core.Dom.addClass(ghost, DragGhostClass);
		main_core.Dom.style(ghost, {
			position: 'fixed',
			top: '-1000px',
			left: '-1000px',
			opacity: '0.85',
			pointerEvents: 'none'
		});
		return ghost;
	}
	function cleanupDrag(el) {
		const state = handlerState.get(el);
		if (!state) {
			return;
		}
		main_core.Event.unbind(document, 'dragover', state.onDocumentDragOver);
		main_core.Event.unbind(document, 'drop', state.onDocumentDrop);
		main_core.Event.unbind(document, 'dragend', state.onDocumentDragEnd);
		if (state.dragGhost) {
			main_core.Dom.remove(state.dragGhost);
		}
		handlerState.set(el, {
			...state,
			dragGhost: null
		});
	}
	function attachHandlers(el, binding) {
		const state = {
			dragGhost: null,
			getDragText: () => resolveDragText(binding),
			onDragStart: null,
			onDragEnd: null,
			onDocumentDragOver: null,
			onDocumentDrop: null,
			onDocumentDragEnd: null
		};
		state.onDragStart = event => {
			const dataTransfer = event?.dataTransfer;
			if (!dataTransfer) {
				return;
			}
			dataTransfer.effectAllowed = 'copyMove';
			dataTransfer.setData('text/plain', state.getDragText());
			state.dragGhost = createDragGhost(el);
			if (state.dragGhost) {
				main_core.Dom.append(state.dragGhost, document.body);
				dataTransfer.setDragImage(state.dragGhost, 0, 0);
			}
			main_core.Event.bind(document, 'dragover', state.onDocumentDragOver);
			main_core.Event.bind(document, 'drop', state.onDocumentDrop);
			main_core.Event.bind(document, 'dragend', state.onDocumentDragEnd);
		};
		state.onDragEnd = () => cleanupDrag(el);
		state.onDocumentDragEnd = () => cleanupDrag(el);
		state.onDocumentDragOver = event => {
			event.preventDefault();
			const target = event?.target;
			const inputTarget = main_core.Type.isElementNode(target) ? getInputTarget(target) : null;
			event.dataTransfer.dropEffect = inputTarget ? 'copy' : 'move';
		};
		state.onDocumentDrop = event => {
			const target = event?.target;
			if (!main_core.Type.isElementNode(target)) {
				return;
			}
			const inputTarget = getInputTarget(target);
			if (!inputTarget) {
				return;
			}
			event.preventDefault();
			insertDraggedText(inputTarget, state.getDragText());
			cleanupDrag(el);
		};
		main_core.Dom.attr(el, 'draggable', 'true');
		main_core.Event.bind(el, 'dragstart', state.onDragStart);
		main_core.Event.bind(el, 'dragend', state.onDragEnd);
		handlerState.set(el, state);
	}
	function detachHandlers(el) {
		const state = handlerState.get(el);
		if (!state) {
			return;
		}
		cleanupDrag(el);
		main_core.Event.unbind(el, 'dragstart', state.onDragStart);
		main_core.Event.unbind(el, 'dragend', state.onDragEnd);
		handlerState.delete(el);
	}
	const dragInspectorSchemeDataItem = {
		mounted(el, binding) {
			attachHandlers(el, binding);
		},
		updated(el, binding) {
			const state = handlerState.get(el);
			if (state) {
				state.getDragText = () => resolveDragText(binding);
			}
		},
		beforeUnmount(el) {
			detachHandlers(el);
		}
	};

	// @vue/component
	const InspectorSchemeDataItemView = {
		name: 'InspectorSchemeDataItemView',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			dragInspectorSchemeDataItem
		},
		props: {
			item: {
				/** @type InspectorViewItemData */
				type: Object,
				required: true
			}
		},
		computed: {
			itemTitle() {
				return this.item.text;
			},
			exampleValue() {
				return this.item.exampleValue ?? '';
			},
			hasExampleValue() {
				return this.exampleValue !== undefined && this.exampleValue !== null && this.exampleValue !== '';
			},
			dataType() {
				return this.item.dataType ?? '';
			},
			isClipboardCopyAvailable() {
				return BX.clipboard?.isCopySupported() ?? false;
			},
			Outline: () => ui_iconSet_api_vue.Outline
		},
		methods: {
			onCopyClick() {
				BX.clipboard?.copy(this.item.value ?? '');
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_COPY_NOTIFICATION'),
					autoHideDelay: 2000
				});
			}
		},
		template: `
		<div class="inspector-scheme-view__data-item-row">
			<div class="inspector-scheme-view__data-item-title-container">
				<div
					class="inspector-scheme-view__data-item-hoverable"
					v-drag-inspector-scheme-data-item="item.value"
				>
					<div class="inspector-scheme-view__data-item-title"
						 :title="itemTitle"
					>
						<BIcon
							:name="Outline.DRAG_L"
							:size="16"
						/>
						<span class="inspector-scheme-view__data-item-title-text">{{ itemTitle }}</span>
					</div>
				</div>
				<div v-if="isClipboardCopyAvailable"
					 class="inspector-scheme-view__data-item-copy-button"
					 @click="onCopyClick"
				>
					<BIcon :name="Outline.COPY" :size="16"/>
				</div>
			</div>
			<span class="inspector-scheme-view__data-item-example-value"
					:title="exampleValue"
			>
				{{ exampleValue }}
			</span>
			<span 
				class="inspector-scheme-view__data-item-type"
				:title="dataType"
			>
				{{ dataType }}
			</span>
		</div>
	`
	};

	// @vue/component
	const InspectorSchemeItemView = {
		name: 'InspectorSchemeItemView',
		components: {
			InspectorSchemeCollapsibleItemView,
			InspectorSchemeDataItemView
		},
		inject: {
			loadDocumentFields: {
				default: () => () => {}
			}
		},
		props: {
			item: {
				/** @type InspectorViewItemBase */
				type: Object,
				required: true
			}
		},
		data() {
			return {
				isCollapsed: this.item.type === 'document',
				isLoading: false
			};
		},
		computed: {
			itemType() {
				return this.item.type;
			},
			isData() {
				return this.itemType === InspectorViewItemTypeDict.DATA;
			},
			isGroup() {
				return this.itemType === InspectorViewItemTypeDict.GROUP;
			},
			isDocumentType() {
				return this.itemType === 'document';
			},
			hasChildren() {
				if (this.isDocumentType) {
					return true;
				}
				return main_core.Type.isArray(this.item.items) && this.item.items.length > 0;
			},
			childItems() {
				return this.item?.items ?? [];
			},
			rootClasses() {
				const baseClass = this.isGroup ? 'inspector-scheme-view__group' : 'inspector-scheme-view__item';
				return [baseClass, {
					'--expanded': this.hasChildren && !this.isCollapsed
				}];
			}
		},
		watch: {
			childItems(newItems) {
				if (this.isLoading && newItems.length > 0) {
					this.isLoading = false;
				}
			}
		},
		methods: {
			toggle() {
				if (!this.hasChildren) {
					return;
				}
				if (this.isDocumentType && this.isCollapsed) {
					this.isLoading = true;
					if (this.childItems.length === 0) {
						this.fetchDocumentFields();
					} else {
						cancelAnimationFrame(this.loadingRafId);
						this.loadingRafId = requestAnimationFrame(() => {
							this.isLoading = false;
						});
					}
				}
				this.isCollapsed = !this.isCollapsed;
			},
			async fetchDocumentFields() {
				try {
					const fields = await this.loadDocumentFields(this.item.documentType);
					if (!fields || fields.length === 0) {
						this.isLoading = false;
					}
				} catch {
					this.isLoading = false;
				}
			}
		},
		template: `
		<li :class="rootClasses">
			<InspectorSchemeDataItemView v-if="isData" :item="item"/>
			<template v-else>
				<InspectorSchemeCollapsibleItemView
					:item="item"
					:item-type="itemType"
					:collapsed="isCollapsed"
					:has-children="hasChildren"
					@toggle="toggle"
				/>
				<ul class="inspector-scheme-view__item-list" v-if="!isCollapsed">
					<slot name="loading" v-if="isLoading"/>
					<template v-else>
						<InspectorSchemeItemView
							v-for="(item, itemIndex) in childItems"
							:key="item.text || itemIndex"
							:item="item"
						>
							<template #loading><slot name="loading"/></template>
						</InspectorSchemeItemView>
					</template>
				</ul>
			</template>
		</li>
	`
	};

	// @vue/component
	const InspectorSchemeView = {
		name: 'InspectorSchemeView',
		components: {
			InspectorSchemeItemView
		},
		props: {
			data: {
				/** @type { groups: Array<InspectorViewItemBase> } */
				type: Object,
				required: true
			}
		},
		computed: {
			groupList() {
				return this.data.groups;
			}
		},
		methods: {
			makeGroupColorName(color) {
				if (!color) {
					return '';
				}
				return `--${color}`;
			}
		},
		template: `
		<div class="inspector-scheme-view">
			<template v-for="(group, groupIndex) in groupList">
				<ul class="inspector-scheme-view__item-list" :class="makeGroupColorName(group.color)">
					<InspectorSchemeItemView
						:key="group.text || groupIndex"
						:item="group"
					>
						<template #loading><slot name="loading"/></template>
					</InspectorSchemeItemView>
				</ul>
				<div v-if="groupIndex + 1 < groupList.length"
					 class="inspector-scheme-view__item-list-group-divider"
				>
				</div>
			</template>
		</div>
	`
	};

	// @vue/component
	const InspectorSchemeLoadingView = {
		name: 'InspectorSchemeLoadingView',
		mounted() {
			this.loader = new ui_loader.Loader({
				target: this.$refs.container,
				type: 'BULLET',
				size: 'XS'
			});
			this.loader.render();
			this.loader.show();
		},
		beforeUnmount() {
			this.loader?.hide();
			this.loader = null;
		},
		template: `
		<li class="inspector-scheme-view__item">
			<div ref="container"></div>
		</li>
	`
	};

	// @vue/component
	const InspectorCloseButton = {
		name: 'InspectorCloseButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		computed: {
			iconName: () => ui_iconSet_api_vue.Outline.CROSS_L
		},
		template: `
		<div class="node-data-inspector-close-button">
			<BIcon :name="iconName" :size="20"/>
		</div>
	`
	};

	// @vue/component
	const InspectorEmptyState = {
		name: 'InspectorEmptyState',
		components: {
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			TextLg: ui_system_typography_vue.TextLg
		},
		computed: {
			title() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_EMPTY_STATE_TITLE');
			}
		},
		template: `
		<div class="bizprocdesigner-inspector-empty-state">
			<div class="bizprocdesigner-inspector-empty-state__image"></div>
			<div class="bizprocdesigner-inspector-empty-state__text">
				<HeadlineMd
					align="center"
					:className="'bizprocdesigner-inspector-empty-state__title'"
				>
					{{ title }}
				</HeadlineMd>
			</div>
		</div>
	`
	};

	const ROWS_COUNT_LIST = [10, 20];

	// @vue/component
	const NavigateGridView = {
		name: 'NavigateGridView',
		components: {
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			totalRowsCount: {
				type: Number,
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
				isMenuShown: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeDataInspectorStore, ['countRowsOnPage', 'currentPageNumber']),
			menuOptions() {
				return {
					bindElement: this.$refs.pageCountDropdown,
					cacheable: false,
					items: ROWS_COUNT_LIST.map(count => {
						return {
							title: count,
							onClick: () => {
								this.setCountRowsOnPage(count);
								this.setCurrentPageNumber(1);
							}
						};
					})
				};
			},
			lastPageNumber() {
				return Math.ceil(this.totalRowsCount / this.countRowsOnPage) || 1;
			},
			isFirstPage() {
				return this.currentPageNumber === 1;
			},
			isLastPage() {
				return this.currentPageNumber === this.lastPageNumber;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeDataInspectorStore, ['setCountRowsOnPage', 'setCurrentPageNumber']),
			onMovePrevPage() {
				if (!this.isFirstPage) {
					this.setCurrentPageNumber(this.currentPageNumber - 1);
				}
			},
			onMoveNextPage() {
				if (!this.isLastPage) {
					this.setCurrentPageNumber(this.currentPageNumber + 1);
				}
			},
			onMoveLastPage() {
				if (!this.isLastPage) {
					this.setCurrentPageNumber(this.lastPageNumber);
				}
			}
		},
		template: `
		<div class="editor-chart-inspector-grid-view-pagination">
			<div class="editor-chart-inspector-grid-view-pagination__navigation">
				<span class="editor-chart-inspector-grid-view-pagination__navigation_current-page">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_CURRENT_PAGE') }}
					<span class="editor-chart-inspector-grid-view-pagination__navigation_page-num">
						{{ currentPageNumber }}
					</span>
				</span>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<span
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:class="{ '--inactive': isFirstPage }"
					@click="onMovePrevPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_PREV_PAGE') }}
				</span>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<span
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:class="{ '--inactive': isLastPage }"
					@click="onMoveNextPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_NEXT_PAGE') }}
				</span>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<span
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:class="{ '--inactive': isLastPage }"
					@click="onMoveLastPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_LAST_PAGE') }}
				</span>
			</div>
			<div class="editor-chart-inspector-grid-view-pagination__rows-count">
				<span class="editor-chart-inspector-grid-view-pagination__rows-count_label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_ROWS_COUNT') }}
				</span>
				<div
					class="editor-chart-inspector-grid-view-pagination__rows-count_dropdown ui-system-input-container"
					ref="pageCountDropdown"
					@click="isMenuShown = true"
				>
					<input
						:value="countRowsOnPage"
						class="ui-system-input-value"
						type="text"
						readonly
					/>
					<div class="ui-icon-set --chevron-down-l ui-system-input-dropdown"></div>
				</div>
				<BMenu
					v-if="isMenuShown"
					:options="menuOptions"
					@close="isMenuShown = false"
				/>
			</div>
		</div>
	`
	};

	const NodeEntityId = 'bizproc-node';

	// @vue/component
	const FilterGridView = {
		name: 'FilterGridView',
		props: {
			/** @type { groups: Array<InspectorViewItemBase> } */
			templateData: {
				type: Object,
				required: true
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			const dialogItemId = 0;
			return {
				getMessage,
				dialogItemId
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeDataInspectorStore, ['selectedGridViewGroup']),
			dropdownValue() {
				return this.selectedGridViewGroup?.title ?? '';
			},
			placeholderText() {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PLACEHOLDER');
			}
		},
		watch: {
			templateData: {
				handler() {
					this.resetGridView();
					this.dialogItemId = 0;
					this.dialogItems = this.getDialogItems(this.templateData.groups);
				},
				immediate: true
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeDataInspectorStore, ['selectGridViewGroup', 'resetGridView']),
			getDialogItems(items) {
				return items.map(({
					id,
					text,
					items: children,
					type
				}) => {
					const dialogItem = {
						id: ++this.dialogItemId,
						entityId: NodeEntityId,
						title: text,
						tabs: 'recents',
						customData: {
							values: children
						}
					};
					const hasChildren = children?.some(child => Boolean(child.items));
					if (hasChildren) {
						dialogItem.children = this.getDialogItems(children);
					}
					if (!this.selectedGridViewGroup) {
						this.selectGridViewGroup({
							id: dialogItem.id,
							title: dialogItem.title,
							values: children
						});
					}
					return dialogItem;
				});
			},
			openDialog() {
				const dialog = new ui_entitySelector.Dialog({
					targetNode: this.$refs.filterGridDropdown,
					width: 400,
					height: 300,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					cacheable: false,
					showAvatars: false,
					items: this.dialogItems,
					events: {
						'Item:onSelect': event => {
							const item = event.getData().item;
							const customData = item.getCustomData();
							this.selectGridViewGroup({
								id: item.id,
								title: item.title,
								values: customData.get('values')
							});
						},
						'Item:onDeselect': () => {
							this.resetGridView();
						}
					}
				});
				dialog.show();
				const items = dialog.getItems();
				const selectedItem = items.find(item => item.id === this.selectedGridViewGroup?.id);
				selectedItem?.select(true);
			}
		},
		template: `
		<div
			class="ui-system-input-container editor-chart-filter-grid-view-dropdown"
			ref="filterGridDropdown"
			@click="openDialog"
		>
			<input
				class="ui-system-input-value"
				type="text"
				readonly
				:placeholder="placeholderText"
				:value="dropdownValue"
				:title="dropdownValue"
			/>
			<div class="ui-icon-set --chevron-down-l ui-system-input-dropdown"></div>
		</div>
	`
	};

	class TemplateDataProvider extends main_core_events.EventEmitter {
		#store;
		constructor(store) {
			super();
			this.#store = store;
			this.setEventNamespace('BizprocDesigner.Editor.Chart.TemplateDataProvider');
		}
		getTemplateItems() {
			const rawTemplateItems = [{
				type: TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.CONSTANT,
				object: this.#store.template.CONSTANTS ?? {}
			}, {
				type: TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.VARIABLE,
				object: this.#store.template.VARIABLES ?? {}
			}].filter(o => Object.keys(o.object).length > 0);
			return rawTemplateItems.map(item => this.#makeTemplateItemGroup(item.type, item.object));
		}
		getIncomingProperties(block, targetPortId) {
			const ancestors = this.#store.getAllBlockAncestors(block, targetPortId);
			return ancestors.reduce((acc, ancestor) => {
				const templateDataNodeGroup = this.#createTemplateDataNodeGroup(ancestor.block, ancestor.block.activity);
				if (templateDataNodeGroup) {
					acc.push({
						...templateDataNodeGroup,
						relatedPortsIds: new Set(Object.values(ancestor.connections).flat())
					});
				}
				const outgoingProperties = this.getOutgoingProperties(ancestor.block, {
					isAncestorBlock: true
				});
				outgoingProperties?.forEach(outgoingProperty => {
					const {
						relatedPortsIds,
						...rest
					} = outgoingProperty;
					const [portId] = relatedPortsIds;
					acc.push({
						nodeId: ancestor.block.id,
						name: ancestor.block.node.title,
						icon: ancestor.block.node.icon,
						relatedPortsIds: new Set(ancestor.connections[portId]),
						items: [rest]
					});
				});
				return acc;
			}, []);
		}
		getOutgoingProperties(block, options = {}) {
			const {
				isAncestorBlock,
				activityData
			} = options;
			const {
				Properties = {},
				Children = []
			} = activityData ?? block.activity ?? {};
			if (block.type !== BLOCK_TYPES$1.COMPLEX && !isAncestorBlock) {
				const templateDataNodeGroup = this.#createTemplateDataNodeGroup(block, block.activity);
				if (templateDataNodeGroup) {
					return [{
						...templateDataNodeGroup,
						name: block.activity.Properties.Title ?? '',
						icon: '',
						relatedPortsIds: ['o1']
					}];
				}
				return null;
			}
			const outputNames = Object.keys(Properties.OutputNames ?? {});
			if (outputNames.length === 0) {
				return null;
			}
			return outputNames.reduce((acc, outputName) => {
				const outputPortId = `o${Properties.OutputNames[outputName]}`;
				const [activityName] = outputName.split(':');
				const activity = Children.find(child => child.Name === activityName);
				const templateDataNodeGroup = this.#createTemplateDataNodeGroup(block, activity);
				if (templateDataNodeGroup) {
					acc.push({
						...templateDataNodeGroup,
						name: activity.Properties.Title ?? '',
						icon: '',
						relatedPortsIds: [outputPortId]
					});
				}
				return acc;
			}, []);
		}
		#createTemplateDataNodeGroup(block, activity) {
			const properties = activity?.ReturnProperties ?? [];
			if (!Array.isArray(properties) || properties.length === 0) {
				return null;
			}
			const items = properties.map(property => {
				const propertyId = property?.Id ?? '';
				const propertyName = property?.Name ?? propertyId;
				if (!propertyName) {
					return null;
				}
				const resolvedPropertyId = propertyId || propertyName;
				if (property?.Type === PROPERTY_TYPES.DOCUMENT) {
					return this.#processDocumentProperty(block, property, resolvedPropertyId, propertyName);
				}
				return {
					id: resolvedPropertyId,
					name: propertyName,
					computeValue: this.#makeComputeValue(block.id, resolvedPropertyId),
					type: property?.Type ?? TEMPLATE_DEFAULT_DATA_TYPE
				};
			}).filter(Boolean);
			if (items.length === 0) {
				return null;
			}
			return {
				nodeId: block.id,
				name: block.node.title,
				icon: block.node.icon,
				items
			};
		}
		#processDocumentProperty(block, property, resolvedPropertyId, propertyName) {
			const cachedFields = documentFieldsCache.get(property.Default);
			if (!cachedFields) {
				this.#prefetchDocumentFields(property.Default);
			}
			return {
				name: propertyName,
				type: PROPERTY_TYPES.DOCUMENT,
				documentType: property.Default,
				blockId: block.id,
				resolvedPropertyId,
				items: cachedFields ? cachedFields.map(field => ({
					id: field.fieldKey,
					name: field.name,
					computeValue: this.#makeComputeValue(block.id, `${resolvedPropertyId}.${field.fieldKey}`),
					type: field.type
				})) : []
			};
		}
		async #prefetchDocumentFields(documentType) {
			try {
				const fields = await documentFieldsCache.fetchFields(documentType);
				if (fields.length > 0) {
					this.emit('onDocumentFieldsLoaded');
				}
			} catch {/* empty */}
		}
		#makeTemplateItemGroup(type, dataObject) {
			const items = Object.entries(dataObject).map(([propertyId, propertyData]) => ({
				id: propertyId,
				name: propertyData.Name,
				computeValue: this.#makeComputeValue(type, propertyId),
				type: propertyData.Type ?? ''
			}));
			return {
				type,
				items
			};
		}
		#makeComputeValue(source, propertyId) {
			const buildComputeValueWithPrefix = prefix => `{=${prefix}:${propertyId}}`;
			if (source === TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.CONSTANT) {
				return buildComputeValueWithPrefix(COMPUTE_VALUE_PREFIXES.CONSTANT);
			}
			if (source === TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.VARIABLE) {
				return buildComputeValueWithPrefix(COMPUTE_VALUE_PREFIXES.VARIABLE);
			}
			return buildComputeValueWithPrefix(source);
		}
	}
	function getTemplateDataProvider() {
		if (!TemplateDataProvider.instance) {
			TemplateDataProvider.instance = new TemplateDataProvider(diagramStore());
		}
		return TemplateDataProvider.instance;
	}

	const ViewMode = Object.freeze({
		SCHEME: 'scheme',
		GRID: 'grid'
	});
	const ViewModeConfigs = Object.freeze({
		[ViewMode.SCHEME]: {
			title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_VIEW_MODE_SCHEME'),
			key: ViewMode.SCHEME
		},
		[ViewMode.GRID]: {
			title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_VIEW_MODE_TABLE'),
			key: ViewMode.GRID
		}
	});
	const SchemeItemType = Object.freeze({
		GROUP: 'group',
		SECTION: 'section',
		NODE: 'node',
		DATA: 'data'
	});
	const SchemeViewGroupKey = Object.freeze({
		GLOBAL: 'global',
		INBOUND: 'inbound',
		OUTBOUND: 'outbound'
	});
	const ViewGroup = SchemeViewGroupKey;
	const SchemeViewGroupConfig = Object.freeze({
		[ViewGroup.GLOBAL]: {
			title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_SCHEME_SECTION_GLOBAL'),
			color: InspectorViewItemGroupColorDict.BLUE,
			icon: ui_iconSet_api_core.Outline.PRODUCT
		},
		[ViewGroup.INBOUND]: {
			title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_SCHEME_SECTION_INBOUND'),
			color: InspectorViewItemGroupColorDict.GREEN,
			icon: ui_iconSet_api_core.Outline.LOWER_RIGHT_ARROW
		},
		[ViewGroup.OUTBOUND]: {
			title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_SCHEME_SECTION_OUTBOUND'),
			color: InspectorViewItemGroupColorDict.GRAY,
			icon: ui_iconSet_api_core.Outline.LOWER_LEFT_ARROW
		}
	});

	const SchemeTemplateSectionTitle = Object.freeze({
		CONSTANTS: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_CONSTANTS'),
		VARIABLES: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_VARIABLES')
	});
	const GroupPortLabels = {
		INCOMING: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE'),
		OUTGOING: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE')
	};
	function mapTemplateGroupsToView(items, ports) {
		const templateSections = (Array.isArray(items?.templateItems) ? items.templateItems : []).map(group => createTemplateSection(group)).filter(Boolean);
		const incomingNodes = (Array.isArray(items?.incomingItems) ? items.incomingItems : []).map(group => createNodeItem(group)).filter(Boolean);
		const areUntitledPorts = ports.every(port => !port.title);
		const groupedIncomingNodes = areUntitledPorts ? incomingNodes : groupNodesByPort(incomingNodes, ports, GroupPortLabels.INCOMING);
		const outgoingNodes = (Array.isArray(items?.outgoingItems) ? items.outgoingItems : []).map(group => createNodeItem(group)).filter(Boolean);
		const groupedOutgoingNodes = areUntitledPorts ? outgoingNodes : groupNodesByPort(outgoingNodes, ports, GroupPortLabels.OUTGOING);
		const groups = [createGroup(SchemeViewGroupConfig[SchemeViewGroupKey.GLOBAL], templateSections, SchemeViewGroupKey.GLOBAL), createGroup(SchemeViewGroupConfig[SchemeViewGroupKey.INBOUND], [...groupedIncomingNodes.values()], SchemeViewGroupKey.INBOUND), createGroup(SchemeViewGroupConfig[SchemeViewGroupKey.OUTBOUND], [...groupedOutgoingNodes.values()], SchemeViewGroupKey.OUTBOUND)];
		return groups.filter(Boolean);
	}
	function groupNodesByPort(nodes, ports, label) {
		const groupedNodes = new Map();
		nodes.forEach(node => {
			node.relatedPortsIds.forEach(relatedPortId => {
				if (!groupedNodes.has(relatedPortId)) {
					groupedNodes.set(relatedPortId, {
						id: relatedPortId,
						items: []
					});
				}
				const group = groupedNodes.get(relatedPortId);
				group.items.push(node);
			});
		});
		ports.forEach(port => {
			const groupedNode = groupedNodes.get(port.id);
			if (groupedNode) {
				groupedNode.text = `${label} ${port.title}`;
			}
		});
		return groupedNodes;
	}
	function createTemplateSection(group) {
		const title = getTemplateGroupTitle(group?.type);
		const items = mapTemplateItems(group?.items ?? []);
		return createSection(title, items, group?.type);
	}
	function getTemplateGroupTitle(type) {
		if (type === TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.CONSTANT) {
			return SchemeTemplateSectionTitle.CONSTANTS;
		}
		if (type === TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.VARIABLE) {
			return SchemeTemplateSectionTitle.VARIABLES;
		}
		return '';
	}
	function createNodeItem(nodeGroup) {
		const nodeTitle = nodeGroup?.name ?? '';
		const dataItems = mapTemplateItems(nodeGroup?.items ?? []);
		if (!nodeTitle || dataItems.length === 0) {
			return null;
		}
		return {
			id: nodeGroup?.nodeId ?? '',
			type: SchemeItemType.NODE,
			text: nodeTitle,
			icon: nodeGroup?.icon ?? '',
			items: dataItems,
			relatedPortsIds: nodeGroup?.relatedPortsIds ?? null
		};
	}
	function createGroup(groupConfig, items, id) {
		if (!Array.isArray(items) || items.length === 0) {
			return null;
		}
		return {
			id,
			type: SchemeItemType.GROUP,
			icon: groupConfig.icon,
			color: groupConfig.color,
			text: groupConfig.title,
			items
		};
	}
	function createSection(title, items, id) {
		if (!title || !Array.isArray(items) || items.length === 0) {
			return null;
		}
		return {
			id,
			type: SchemeItemType.SECTION,
			text: title,
			items
		};
	}
	function mapTemplateItems(items) {
		return (Array.isArray(items) ? items : []).map(item => {
			if (item.items) {
				return {
					...item,
					text: item.name,
					items: item.items.map(i => createDataItem(i))
				};
			}
			return createDataItem(item);
		}).filter(Boolean);
	}
	function createDataItem(item) {
		const title = item?.name ?? '';
		if (!title) {
			return null;
		}
		return {
			type: SchemeItemType.DATA,
			text: title,
			dataType: DataTypeLabelMap[item?.type] ?? item?.type ?? '',
			value: item?.computeValue ?? ''
		};
	}

	// @vue/component
	const NodeDataInspector = {
		name: 'NodeDataInspector',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			NodeDataInspectorLayout,
			InspectorSearch,
			InspectorViewModeButton,
			InspectorSchemeView,
			InspectorGridView,
			InspectorSchemeLoadingView,
			InspectorCloseButton,
			InspectorEmptyState,
			NavigateGridView,
			FilterGridView
		},
		provide() {
			return {
				loadDocumentFields: documentType => this.loadDocumentFields(documentType)
			};
		},
		data() {
			return {
				searchValue: '',
				viewMode: ViewMode.SCHEME,
				providedItems: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeDataInspectorStore, ['block', 'activityData', 'countRowsOnPage', 'currentPageNumber', 'selectedGridViewGroup']),
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['ports']),
			templateData() {
				const items = this.providedItems;
				if (!items) {
					return {
						groups: []
					};
				}
				const mappedData = {
					groups: mapTemplateGroupsToView(items, this.ports ?? [])
				};
				const normalizedSearchValue = main_core.Type.isStringFilled(this.searchValue) ? this.searchValue.trim().toLowerCase() : '';
				if (!normalizedSearchValue) {
					return mappedData;
				}
				return this.filterWorkflowData(mappedData, normalizedSearchValue);
			},
			viewModeConfigList() {
				return Object.values(ViewModeConfigs);
			},
			isEmpty() {
				return !this.templateData?.groups?.length;
			},
			Outline: () => ui_iconSet_api_vue.Outline,
			ViewMode: () => ViewMode,
			isGridVisible() {
				return this.viewMode === ViewMode.GRID;
			}
		},
		watch: {
			block: {
				immediate: true,
				handler() {
					this.scheduleProvidedItemsUpdate();
				}
			},
			activityData() {
				this.scheduleProvidedItemsUpdate();
			}
		},
		created() {
			const provider = getTemplateDataProvider();
			this.onDocumentFieldsLoadedHandler = () => {
				this.scheduleProvidedItemsUpdate();
			};
			provider.subscribe('onDocumentFieldsLoaded', this.onDocumentFieldsLoadedHandler);
		},
		beforeUnmount() {
			cancelAnimationFrame(this.updateRafId);
			const provider = getTemplateDataProvider();
			provider.unsubscribe('onDocumentFieldsLoaded', this.onDocumentFieldsLoadedHandler);
		},
		methods: {
			...ui_vue3_pinia.mapActions(useAppStore, ['toggleDataInspectorPanel']),
			...ui_vue3_pinia.mapActions(useNodeDataInspectorStore, ['resetGridView']),
			async loadDocumentFields(documentType) {
				const fields = await documentFieldsCache.fetchFields(documentType);
				if (fields.length > 0) {
					this.scheduleProvidedItemsUpdate();
				}
				return fields;
			},
			scheduleProvidedItemsUpdate() {
				cancelAnimationFrame(this.updateRafId);
				this.updateRafId = requestAnimationFrame(() => {
					this.updateProvidedItems();
				});
			},
			updateProvidedItems() {
				if (!this.block) {
					this.providedItems = null;
					return;
				}
				const provider = getTemplateDataProvider();
				this.providedItems = {
					templateItems: provider.getTemplateItems(),
					incomingItems: provider.getIncomingProperties(this.block),
					outgoingItems: provider.getOutgoingProperties(this.block, {
						activityData: this.activityData
					})
				};
			},
			filterWorkflowData(data, searchValue) {
				const filteredGroups = (Array.isArray(data?.groups) ? data.groups : []).map(group => this.filterGroup(group, searchValue)).filter(Boolean);
				return {
					...data,
					groups: filteredGroups
				};
			},
			filterGroup(group, searchValue) {
				const filteredItems = this.filterItems(group?.items, searchValue);
				if (filteredItems.length === 0) {
					return null;
				}
				return {
					...group,
					items: filteredItems
				};
			},
			filterItems(items, searchValue) {
				const normalizedItems = Array.isArray(items) ? items : [];
				return normalizedItems.map(item => {
					const itemText = main_core.Type.isStringFilled(item?.text) ? item.text.toLowerCase() : '';
					const isTextMatch = itemText.includes(searchValue);
					if (isTextMatch) {
						return item;
					}
					const childItems = this.filterItems(item?.items, searchValue);
					if (childItems.length > 0) {
						return {
							...item,
							items: childItems
						};
					}
					return null;
				}).filter(Boolean);
			},
			onClose() {
				this.toggleDataInspectorPanel();
				this.resetGridView();
			},
			onViewModeConfigClick(config) {
				this.viewMode = config;
			}
		},
		template: `
		<NodeDataInspectorLayout>
			<template #title>
				{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TITLE') }}
			</template>
			<template #header-controls>
				<InspectorCloseButton
					@click="onClose"
				/>
			</template>
			<template #filter>
				<FilterGridView
					v-if="viewMode === ViewMode.GRID"
					:templateData="templateData"
				/>
			</template>
			<template #search>
				<InspectorSearch
					:modelValue="searchValue"
					@update:modelValue="searchValue = $event"
				/>
			</template>
			<template #view-mode>
				<InspectorViewModeButton
					v-for="{ key, title } in viewModeConfigList"
					:key="key"
					:title="title"
					:isActive="viewMode === key"
					@click="onViewModeConfigClick(key)"
				/>
			</template>
			<template #data-viewer>
				<InspectorEmptyState v-if="isEmpty"/>
				<InspectorSchemeView
					v-else-if="viewMode === ViewMode.SCHEME"
					:data="templateData"
				>
					<template #loading>
						<InspectorSchemeLoadingView/>
					</template>
				</InspectorSchemeView>
				<InspectorGridView
					v-else-if="isGridVisible"
					:countRowsOnPage="countRowsOnPage"
					:currentPageNumber="currentPageNumber"
					:selectedGridViewGroup="selectedGridViewGroup"
				>
					<template #navigate-grid-view="{ totalRowsCount }">
						<NavigateGridView
							:totalRowsCount="totalRowsCount"
						/>
					</template>
				</InspectorGridView>
			</template>
		</NodeDataInspectorLayout>
	`
	};

	// @vue/component
	const ToggleInspectorControl = {
		name: 'ToggleInspectorControl',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		computed: {
			text() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TOGGLE_BUTTON_SHOW');
			},
			design() {
				return ui_system_chip_vue.ChipDesign.OutlineAccent2;
			},
			ChipSize: () => ui_system_chip_vue.ChipSize
		},
		methods: {
			...ui_vue3_pinia.mapActions(useAppStore, ['toggleDataInspectorPanel']),
			...ui_vue3_pinia.mapActions(useNodeDataInspectorStore, ['resetGridView']),
			toggleInspector() {
				this.toggleDataInspectorPanel();
				this.resetGridView();
			}
		},
		template: `
		<Chip
			class="editor-chart-data-inspector-toggle"
			:text="text"
			:size="ChipSize.Md"
			:design="design"
			@click="toggleInspector"
		/>
	`
	};

	// @vue/component
	const EditNodeSettingsForm = {
		name: 'EditNodeSettingsForm',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			const {
				isFeatureAvailable
			} = useFeature();
			return {
				getMessage,
				isFeatureAvailable,
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['block', 'ports', 'nodeSettings']),
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
			}
		},
		template: `
		<div class="editor-chart-node-settings-form">
			<div class="editor-chart-node-settings-form__section">
				<div class="editor-chart-node-settings-form__section-header">
					<div class="editor-chart-node-settings-form__section-header-main">
						<BIcon :name="iconSet.EDIT_M" :size="30"/>
						<span class="editor-chart-node-settings-form__section-title">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GENERAL_SECTION_TITLE') }}
						</span>
					</div>
					<span class="editor-chart-node-settings-form__section-description">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GENERAL_SECTION_DESCRIPTION') }}
					</span>
				</div>
				<div class="editor-chart-node-settings-form__fields">
					<div>
						<span class="editor-chart-node-settings-form__label">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_LABEL_MSGVER_1') }}
						</span>
						<div class="ui-ctl ui-ctl-textbox editor-chart-node-settings-form__node-name-input">
							<input type="text"
								class="ui-ctl-element"
								:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER_MSGVER_1')"
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
								:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER_MSGVER_1')"
								:value="nodeSettings.description"
								:data-test-id="$testId('complexNodeDescription')"
								@input="onChangeDescription"
							></textarea>
						</div>
					</div>
				</div>
			</div>
			<div class="editor-chart-node-settings-form__section --rules">
				<div class="editor-chart-node-settings-form__section-header">
					<div class="editor-chart-node-settings-form__section-header-main">
						<BIcon :name="iconSet.DATA_READING" :size="26"/>
						<span class="editor-chart-node-settings-form__section-title">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE') }}
						</span>
					</div>
					<span class="editor-chart-node-settings-form__section-description">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_DESCRIPTION_MSGVER_1') }}
					</span>
				</div>
				<slot
					v-for="port in rulePorts"
					:key="port.id"
					:port="port"
					name="preview"
				/>
				<slot
					v-for="port in relationPorts"
					:key="port.id"
					:port="port"
					name="preview"
				/>
				<div class="editor-chart-node-settings-form__add-buttons">
					<slot
						:itemType="'rule'"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EDIT_RULES_BUTTON')"
						name="addSettingsItem"
					/>
					<slot
						v-if="isRelationFeatureAvailable"
						:itemType="'relation'"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_ENTRY_POINT_BUTTON')"
						name="addSettingsItem"
					/>
				</div>
			</div>
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
			},
			iconName: {
				type: String,
				default: 'plus-m'
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
				:name="iconName"
				:size="22"
				color="#828b95"
			/>
			<span>
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
		#connectedBlocks = null;
		constructor(currentBlock, currentPortId = null, fixedDocumentType = null, connectedBlocks = null) {
			this.#store = diagramStore();
			this.#currentBlock = currentBlock;
			this.#currentPortId = currentPortId;
			this.#fixedDocumentType = fixedDocumentType;
			this.#connectedBlocks = connectedBlocks;
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
			const blocks = this.#connectedBlocks ?? this.#store.getAllBlockAncestors(this.#currentBlock, this.#currentPortId).reduce((acc, ancestor) => {
				const block = main_core.Type.isPlainObject(ancestor?.block) ? ancestor.block : ancestor;
				if (main_core.Type.isPlainObject(block)) {
					acc.push(block);
				}
				return acc;
			}, []);
			return blocks.reduce((acc, currentBlock) => {
				const block = main_core.Type.isPlainObject(currentBlock?.block) ? currentBlock.block : currentBlock;
				if (!main_core.Type.isPlainObject(block?.activity)) {
					return acc;
				}
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
			ruleCard: {
				type: [Object, null],
				required: false,
				default: null
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
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule', 'currentSettingsItems']),
			connectedBlocksContext() {
				return getConnectedBlocksContextForConstruction(this.block, this.currentRule.id, this.ruleCard, this.construction, this.currentSettingsItems);
			},
			shouldShowAuxPorts() {
				return this.block.node?.shouldShowAuxPorts === true;
			},
			connectedBlocks() {
				return this.connectedBlocksContext.allBlocks;
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
				const selector = new DocumentSelector(this.block, this.currentRule.id, this.nodeSettings.fixedDocumentType, this.connectedBlocks);
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

	const BxControl = {
		mounted(el, binding) {
			if (binding.value) {
				main_core.Dom.append(binding.value, el);
			}
		}
	};

	const formInputTrackerHandlers = new WeakMap();
	const FormInputTracker = {
		mounted(el, binding) {
			const handler = () => binding.value();
			formInputTrackerHandlers.set(el, handler);
			main_core.Event.bind(el, 'input', handler);
			main_core.Event.bind(el, 'change', handler);
		},
		beforeUnmount(el) {
			const handler = formInputTrackerHandlers.get(el);
			if (handler) {
				main_core.Event.unbind(el, 'input', handler);
				main_core.Event.unbind(el, 'change', handler);
				formInputTrackerHandlers.delete(el);
			}
		}
	};

	const SELECTOR_BUTTON_ROLE = 'bp-selector-button';
	function findTargetInput(form, button) {
		const propsAttribute = button.getAttribute('data-bp-selector-props');
		if (propsAttribute) {
			const controlId = JSON.parse(propsAttribute)?.controlId ?? null;
			if (controlId && form) {
				const controlById = form.querySelector(`#${CSS.escape(controlId)}`);
				if (controlById) {
					return controlById;
				}
			}
		}
		return button.closest('.field-row')?.querySelector('input[type="text"], textarea') ?? null;
	}
	async function insertSelectedValue(button, context) {
		const {
			form,
			store,
			block,
			portId,
			onChange
		} = context;
		const inputElement = findTargetInput(form, button);
		if (!inputElement) {
			return;
		}
		const selector = new ValueSelector(store, block, portId);
		try {
			const value = await selector.show(button);
			const beforePart = inputElement.value.slice(0, inputElement.selectionEnd || 0);
			const afterPart = inputElement.value.slice(inputElement.selectionEnd || 0);
			inputElement.value = beforePart + value + afterPart;
			inputElement.selectionEnd = beforePart.length + value.length;
			inputElement.focus();
			inputElement.dispatchEvent(new window.Event('change'));
			onChange();
		} catch (error) {
			console.error(error);
		}
	}
	function handleBpSelectorButtonClick(event, context) {
		const {
			target
		} = event;
		if (!(target instanceof HTMLElement) || target.getAttribute('data-role') !== SELECTOR_BUTTON_ROLE) {
			return;
		}
		event.stopPropagation();
		void insertSelectedValue(target, context);
	}

	// @vue/component
	const ConditionValueControl = {
		name: 'ConditionValueControl',
		directives: {
			BxControl,
			FormInputTracker
		},
		props: {
			property: {
				type: Object,
				required: true
			},
			documentType: {
				type: Array,
				required: true
			},
			modelValue: {
				required: true
			},
			fieldName: {
				type: String,
				required: true
			}
		},
		emits: ['update:modelValue'],
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['block', 'currentRule'])
		},
		data() {
			return {
				renderedNode: null,
				renderFinishedHandler: null
			};
		},
		mounted() {
			const initialValue = main_core.Type.isObject(this.modelValue) && !main_core.Type.isArray(this.modelValue) ? this.modelValue[this.fieldName] ?? this.modelValue[`${this.fieldName}_text`] ?? '' : this.modelValue;
			this.renderedNode = BX.Bizproc.FieldType.renderControl(this.documentType, this.property, this.fieldName, initialValue, 'designer');
			this.renderFinishedHandler = () => {
				if (typeof BX.Bizproc.Selector !== 'undefined' && this.renderedNode) {
					BX.Bizproc.Selector.initSelectors(this.renderedNode);
				}
			};
			main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', this.renderFinishedHandler);
		},
		unmounted() {
			if (this.renderFinishedHandler) {
				main_core_events.EventEmitter.unsubscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', this.renderFinishedHandler);
			}
			this.renderedNode = null;
			this.renderFinishedHandler = null;
		},
		methods: {
			onChange() {
				if (!this.$refs.form) {
					return;
				}
				const data = main_core.ajax.prepareForm(this.$refs.form).data;
				this.$emit('update:modelValue', {
					[this.fieldName]: data[this.fieldName] ?? '',
					[`${this.fieldName}_text`]: data[`${this.fieldName}_text`] ?? ''
				});
			},
			onFormClick(event) {
				handleBpSelectorButtonClick(event, {
					form: this.$refs.form,
					store: diagramStore(),
					block: this.block,
					portId: this.currentRule.id,
					onChange: () => this.onChange()
				});
			}
		},
		template: `
		<form v-if="renderedNode" class="node-settings-panel" ref="form" v-form-input-tracker="onChange" @click.capture="onFormClick">
			<div
				class="field-row"
				v-bx-control="renderedNode"
			></div>
		</form>
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
		constructor(currentBlock, currentPortId, connectedBlocks = null) {
			this.store = diagramStore();
			this.currentBlock = currentBlock;
			this.currentPortId = currentPortId;
			this.connectedBlocks = connectedBlocks;
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
									multiple: item.Multiple,
									options: item.Options ?? null,
									settings: item.Settings ?? null
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
			const blocks = this.connectedBlocks ?? this.store.getBlockAncestorsByInputPortId(this.currentBlock, this.currentPortId);
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
							multiple: property.Multiple,
							options: property.Options ?? null,
							settings: property.Settings ?? null
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
		components: {
			ConditionValueControl
		},
		props: {
			/** @type ConditionConstruction */
			construction: {
				type: Object,
				required: true
			},
			ruleCard: {
				type: [Object, null],
				required: false,
				default: null
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
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule', 'currentSettingsItems']),
			...ui_vue3_pinia.mapState(diagramStore, {
				workflowDocumentType: 'documentType'
			}),
			connectedBlocksContext() {
				return getConnectedBlocksContextForConstruction(this.block, this.currentRule.id, this.ruleCard, this.construction, this.currentSettingsItems);
			},
			connectedBlocks() {
				return this.connectedBlocksContext.allBlocks;
			},
			availableOperators() {
				return Object.values(CONSTRUCTION_OPERATORS).map(operator => ({
					id: operator,
					title: this.getMessage(OperatorPhraseCodes[operator] ?? '')
				}));
			},
			effectiveDocumentType() {
				const fixed = this.nodeSettings?.fixedDocumentType;
				if (Array.isArray(fixed) && fixed.length === 3) {
					return fixed;
				}
				return this.workflowDocumentType;
			},
			fieldProperty() {
				if (!this.selectedField) {
					return null;
				}
				const result = {
					Type: this.selectedField.type ?? 'string',
					Multiple: Boolean(this.selectedField.multiple)
				};
				if (this.selectedField.options) {
					result.Options = this.selectedField.options;
				}
				if (this.selectedField.settings) {
					result.Settings = this.selectedField.settings;
				}
				return result;
			},
			valueFieldName() {
				return `bp_cond_value_${this.construction.id}`;
			},
			valueControlKey() {
				return `${this.selectedField?.object ?? ''}:${this.selectedField?.fieldId ?? ''}`;
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
				return evaluateConditionExpressionFieldTitle(this.connectedBlocks, this.selectedField);
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
				const fieldSelector = new FieldSelector(this.block, this.currentRule.id, this.connectedBlocks);
				void fieldSelector.show(event.target).then(field => {
					this.selectedField = field;
				});
			},
			onShowValueMenu(event) {
				if (!this.block) {
					return;
				}
				const valueSelector = new ValueSelector(diagramStore(), this.block, this.currentRule.id, this.connectedBlocks);
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
			<div v-if="isShowValueEditor && selectedField"
				class="editor-chart-node-settings-edit-condition-expression-form__item"
			>
				<span class="editor-chart-node-settings-edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<ConditionValueControl
					:key="valueControlKey"
					:property="fieldProperty"
					:document-type="effectiveDocumentType"
					:model-value="selectedValue"
					:field-name="valueFieldName"
					@update:model-value="selectedValue = $event"
				/>
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
			}
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage,
				iconSet: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'currentRule', 'currentSettingsItems']),
			actions() {
				return [{
					id: CONSTRUCTION_TYPES.CONDITION.IF_CONDITION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_TOOLBAR_ITEM'),
					dataset: {
						testId: 'complexNodeRuleSettingsToolbarItemConstructionIf'
					},
					className: 'condition'
				}, {
					id: CONSTRUCTION_TYPES.ACTION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_TOOLBAR_ITEM'),
					dataset: {
						testId: 'complexNodeRuleSettingsToolbarItemConstructionAction'
					},
					className: 'action'
				}, ...(this.nodeSettings.filterSupported && this.currentRule?.type === PORT_TYPES.input ? [{
					id: CONSTRUCTION_TYPES.FILTER,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_TOOLBAR_ITEM'),
					dataset: {
						testId: 'complexNodeRuleSettingsToolbarItemConstructionFilter'
					},
					className: 'filter'
				}] : []), {
					id: CONSTRUCTION_TYPES.OUTPUT,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT_TOOLBAR_ITEM'),
					dataset: {
						testId: 'complexNodeRuleSettingsToolbarItemConstructionOutput'
					},
					className: 'output'
				}];
			},
			conditionsTypes() {
				return new Set(Object.values(CONSTRUCTION_TYPES.CONDITION));
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['addConstruction', 'addRuleCard']),
			onAddConstruction(actionId) {
				if (actionId === CONSTRUCTION_TYPES.CONDITION.IF_CONDITION || actionId === CONSTRUCTION_TYPES.FILTER) {
					const ruleCard = this.addRuleCard();
					this.addConstruction(ruleCard, actionId);
					return;
				}
				const rule = this.currentSettingsItems.get(this.currentRule.id);
				const lastRuleCard = rule.ruleCards[rule.ruleCards.length - 1];
				let isNotExists = false;
				let isSiblingExists = false;
				if (actionId === CONSTRUCTION_TYPES.ACTION) {
					isSiblingExists = lastRuleCard?.constructions.some(c => {
						return this.conditionsTypes.has(c.type);
					});
					isNotExists = lastRuleCard?.constructions.every(c => {
						return c.type !== CONSTRUCTION_TYPES.ACTION;
					});
				} else {
					isSiblingExists = lastRuleCard?.constructions.some(c => {
						return c.type === CONSTRUCTION_TYPES.ACTION;
					});
					isNotExists = lastRuleCard?.constructions.every(c => {
						return c.type !== CONSTRUCTION_TYPES.OUTPUT;
					});
				}
				if (isSiblingExists && isNotExists) {
					this.addConstruction(lastRuleCard, actionId);
					return;
				}
				const ruleCard = this.addRuleCard();
				this.addConstruction(ruleCard, actionId);
			}
		},
		template: `
		<div
			class="editor-chart-node-settings-add-construction-toolbar"
			:data-test-id="$testId('complexNodeRuleSettingsAddConstructionToolbar')"
		>
			<div
				v-for="action in actions"
				class="editor-chart-node-settings-add-construction-toolbar__item"
				:class="'--' + action.className"
				:key="action.id"
				@click="onAddConstruction(action.id)"
			>
				<BIcon
					:name="iconSet.PLUS_M"
					:size="20"
				/>
				<span>{{ action.text }}</span>
			</div>
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
			:data-test-id="$testId('complexNodeRuleSettingsDeleteConstruction', construction.id)"
			:size="20"
			class="editor-chart-node-settings-delete-construction"
			name="cross-m"
			color="#a8adb4"
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
				return [CONSTRUCTION_TYPES.CONDITION.AND_CONDITION, CONSTRUCTION_TYPES.CONDITION.OR_CONDITION];
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

	const Status$1 = Object.freeze({
		Loading: 'loading',
		Loaded: 'loaded',
		Error: 'error'
	});
	const CorrectDocumentTypeLength$1 = 3;

	// @vue/component
	const EditExtendedAction = {
		name: 'edit-extended-action',
		components: {
			Loader
		},
		directives: {
			FormInputTracker,
			BxControl
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
			actionMeta: {
				type: [Object, null],
				required: false,
				default: null
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
				required: false,
				default: null
			},
			selectedDocument: {
				type: [String, null],
				required: false,
				default: null
			},
			ruleCard: {
				type: [Object, null],
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
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['block', 'currentRule', 'nodeSettings', 'currentSettingsItems']),
			Status: () => Status$1,
			action() {
				return this.actionMeta ?? this.nodeSettings.actions.get(this.actionId);
			},
			propertiesDialogDocumentType() {
				return this.getPropertyDialogDocumentType(this.selectedDocument);
			},
			connectedBlocksContext() {
				return getConnectedBlocksContextForConstruction(this.block, this.currentRule.id, this.ruleCard, this.construction, this.currentSettingsItems);
			},
			connectedBlocks() {
				return this.connectedBlocksContext.allBlocks;
			},
			isPropertiesDialogDocumentTypeReady() {
				return this.propertiesDialogDocumentType.length === CorrectDocumentTypeLength$1;
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
				this.isActionFormLoading = newVal === Status$1.Loading;
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
					this.status = Status$1.Error;
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
				this.status = Status$1.Loading;
				let activity = this.activityData;
				if (!activity) {
					const defaultProps = main_core.Type.isPlainObject(this.action?.properties) ? {
						...this.action.properties
					} : {};
					activity = {
						Name: createUniqueId(),
						Type: this.actionId,
						Activated: 'Y',
						Properties: {
							Title: this.action?.title ?? '',
							...defaultProps
						}
					};
				}
				const compatibleTemplate = [{
					Type: 'NodeWorkflowActivity',
					Children: [],
					Name: 'Template'
				}];
				compatibleTemplate[0].Children.push(activity, ...this.connectedBlocks.map(block => block.activity));
				try {
					const settingControls = await editorAPI.getNodeSettingsControls({
						documentType: this.propertiesDialogDocumentType,
						activity,
						workflow: {
							workflowParameters: JSON.stringify(this.template?.PARAMETERS ?? {}),
							workflowVariables: JSON.stringify(this.template?.VARIABLES ?? {}),
							workflowTemplate: JSON.stringify(compatibleTemplate),
							workflowConstants: JSON.stringify(this.template?.CONSTANTS ?? {})
						},
						options: {
							hideEditorComment: true
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
						formData.append('options[hideEditorComment]', 'Y');
						await this.renderPropertyDialog(formData);
					}
					this.status = Status$1.Loaded;
				} catch (e) {
					if (!this.isRenderCancelled(requestId)) {
						this.status = Status$1.Error;
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
					return this.nodeSettings.fixedDocumentType.length < CorrectDocumentTypeLength$1 ? this.documentType : this.nodeSettings.fixedDocumentType;
				}
				if (!selectedDocument) {
					return [];
				}
				if (this.nodeSettings.fixedDocumentType.length === CorrectDocumentTypeLength$1) {
					return this.nodeSettings.fixedDocumentType;
				}
				return evaluateActionExpressionDocumentType(this.connectedBlocks, selectedDocument);
			},
			onFormClick(event) {
				handleBpSelectorButtonClick(event, {
					form: this.settingsForm,
					store: this.store,
					block: this.block,
					portId: this.currentRule.id,
					onChange: () => this.onChange()
				});
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
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'ports', 'currentRule']),
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
				const lastPort = this.filteredPorts[this.filteredPorts.length - 1];
				const label = this.portType === PORT_TYPES.output ? OUTPUT_LABELS.rule : OUTPUT_LABELS.relation;
				const num = lastPort?.title.split(label)[1] ?? 0;
				return `${label}${Number(num) + 1}`;
			},
			portType() {
				return this.currentRule.type === PORT_TYPES.input ? PORT_TYPES.output : PORT_TYPES.outputRelation;
			},
			filteredPorts() {
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
			this.allOutputPorts = this.ports.reduce((acc, port) => {
				if (port.type === PORT_TYPES.output || port.type === PORT_TYPES.outputRelation) {
					acc.push({
						portId: port.id,
						title: port.title,
						type: port.type
					});
				}
				return acc;
			}, []) ?? [];
			if (this.filteredPorts.length === 0) {
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
									v-for="outputPort in filteredPorts"
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

	const FILTER_DOCUMENT_PROPERTY_ID = 'Document';
	const CorrectDocumentTypeLength = 3;
	const Status = Object.freeze({
		Loading: 'loading',
		Loaded: 'loaded',
		Error: 'error'
	});
	const CRM_ENTITY_TYPE_IDS = Object.freeze({
		LEAD: 1,
		DEAL: 2,
		CONTACT: 3,
		COMPANY: 4,
		QUOTE: 7,
		SMART_INVOICE: 31
	});
	const EMPTY_CONDITIONS = Object.freeze({
		items: []
	});
	const queueMicrotaskSafe = callback => {
		if (main_core.Type.isFunction(window.queueMicrotask)) {
			window.queueMicrotask(callback);
			return;
		}
		void Promise.resolve().then(callback);
	};

	// @vue/component
	const EditFilterExpression = {
		name: 'EditFilterExpression',
		components: {
			EditExtendedAction,
			Loader
		},
		props: {
			construction: {
				type: Object,
				required: true
			},
			ruleCard: {
				type: Object,
				required: true
			},
			documentType: {
				type: Array,
				required: true
			},
			template: {
				type: [Object, null],
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
				status: Status.Loading,
				entityTypeOptions: [],
				filterFieldsMap: new Map(),
				documentTypeMap: new Map(),
				documentFields: [],
				documentName: '',
				filteringFieldsPrefix: 'dynamic_filter_fields_',
				currentEntityTypeId: '',
				serializedConditions: EMPTY_CONDITIONS,
				conditionGroup: null,
				conditionGroupSelector: null,
				isExpanded: true,
				lastLoadId: 0,
				selectorInteractionHandler: null,
				selectorStateObserver: null,
				isSelectorStateSyncQueued: false,
				onBeforeSubmitCallback: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings']),
			Status() {
				return Status;
			},
			fixedEntityTypeId() {
				const fixedDocumentType = this.nodeSettings?.fixedDocumentType ?? [];
				const entityCode = fixedDocumentType?.[2] ?? '';
				return CRM_ENTITY_TYPE_IDS[entityCode] ?? null;
			},
			backingActivityType() {
				const documentType = this.getContextDocumentType();
				const moduleId = main_core.Type.isArrayFilled(documentType) ? String(documentType[0]) : '';
				return NODE_FILTER_BACKING_ACTIVITY_TYPES[moduleId] ?? '';
			},
			filterFields() {
				const fields = this.filterFieldsMap.get(this.currentEntityTypeId);
				if (main_core.Type.isArray(fields)) {
					return fields;
				}
				if (main_core.Type.isPlainObject(fields)) {
					return Object.values(fields);
				}
				return [];
			},
			isEntitySelectorVisible() {
				return !this.fixedEntityTypeId && this.entityTypeOptions.length !== 1;
			},
			hasSelectedEntityType() {
				return main_core.Type.isStringFilled(this.currentEntityTypeId);
			},
			fallbackActionMeta() {
				const properties = {
					DynamicFilterFields: this.getCurrentConditions(),
					ReturnFields: ['ID'],
					OnlyDynamicEntities: this.fixedEntityTypeId ? 'N' : 'Y'
				};
				if (this.fixedEntityTypeId) {
					properties.DynamicTypeId = this.fixedEntityTypeId;
				}
				return {
					id: this.backingActivityType,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME'),
					handlesDocument: false,
					properties
				};
			}
		},
		watch: {
			currentEntityTypeId(newValue, oldValue) {
				if (newValue === oldValue) {
					return;
				}
				const newDynamicTypeId = Number(newValue);
				const shouldKeepCurrentConditions = !main_core.Type.isStringFilled(oldValue) && (!Number.isFinite(newDynamicTypeId) || this.getCurrentDynamicTypeId() === newDynamicTypeId);
				const nextConditions = shouldKeepCurrentConditions ? this.getCurrentConditions() : EMPTY_CONDITIONS;
				this.serializedConditions = nextConditions;
				this.conditionGroup = ui_vue3.markRaw(new bizproc_automation.ConditionGroup(nextConditions));
				this.syncActivityData();
				void this.syncConditionSelectorRendering();
			}
		},
		mounted() {
			void this.init();
			this.subscribeOnBeforeSubmit();
		},
		unmounted() {
			this.lastLoadId++;
			this.unsubscribe();
			this.destroyConditionSelector();
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['changeRuleExpression']),
			async init() {
				const requestId = ++this.lastLoadId;
				this.status = Status.Loading;
				try {
					this.initWorkflowGlobals();
					const metadata = await this.loadMetadata();
					if (requestId !== this.lastLoadId) {
						return;
					}
					this.applyMetadata(metadata);
					this.serializedConditions = this.getCurrentConditions();
					this.conditionGroup = ui_vue3.markRaw(new bizproc_automation.ConditionGroup(this.serializedConditions));
					this.currentEntityTypeId = this.resolveCurrentEntityTypeId();
					this.isExpanded = this.getCurrentExpandedState();
					this.initAutomationContext();
					this.status = Status.Loaded;
					if (requestId !== this.lastLoadId) {
						return;
					}
					await this.syncConditionSelectorRendering();
					this.syncActivityData();
				} catch (error) {
					if (requestId === this.lastLoadId) {
						this.status = Status.Error;
						console.error('Complex node filter direct UI init failed', error);
					}
				}
			},
			async loadMetadata() {
				const documentType = this.getContextDocumentType();
				const metadata = await editorAPI.getNodeFilterMetadata({
					activityType: this.backingActivityType,
					documentType,
					onlyDynamicEntities: !this.fixedEntityTypeId
				});
				if (!main_core.Type.isPlainObject(metadata)) {
					throw new Error('Complex node filter metadata is not available.');
				}
				return metadata;
			},
			applyMetadata(metadata) {
				const options = main_core.Type.isPlainObject(metadata.entityTypeOptions) ? metadata.entityTypeOptions : {};
				this.entityTypeOptions = Object.entries(options).map(([value, title]) => ({
					value: String(value),
					title: String(title)
				}));
				const fieldsMap = main_core.Type.isPlainObject(metadata.filterFieldsMap) ? metadata.filterFieldsMap : {};
				const documentTypeMap = main_core.Type.isPlainObject(metadata.documentTypeMap) ? metadata.documentTypeMap : {};
				this.filterFieldsMap = new Map(Object.entries(fieldsMap).map(([entityTypeId, fields]) => [String(entityTypeId), fields]));
				this.documentTypeMap = new Map(Object.entries(documentTypeMap).map(([entityTypeId, documentType]) => [String(entityTypeId), documentType]));
				this.documentFields = main_core.Type.isArray(metadata.documentFields) ? metadata.documentFields : [];
				this.documentName = main_core.Type.isStringFilled(metadata.documentName) ? metadata.documentName : '';
				this.filteringFieldsPrefix = 'dynamic_filter_fields_';
			},
			getContextDocumentType() {
				if (!main_core.Type.isArrayFilled(this.nodeSettings?.fixedDocumentType)) {
					return this.documentType;
				}
				return this.nodeSettings.fixedDocumentType.length < CorrectDocumentTypeLength ? this.documentType : this.nodeSettings.fixedDocumentType;
			},
			resolveCurrentEntityTypeId() {
				if (this.fixedEntityTypeId) {
					return String(this.fixedEntityTypeId);
				}
				const currentDynamicTypeId = this.getCurrentDynamicTypeId();
				if (currentDynamicTypeId > 0) {
					return String(currentDynamicTypeId);
				}
				if (this.entityTypeOptions.length === 1) {
					return this.entityTypeOptions[0].value;
				}
				return '';
			},
			getCurrentActivityData() {
				return main_core.Type.isPlainObject(this.construction.expression.activityData) ? this.construction.expression.activityData : null;
			},
			getCurrentProperties() {
				const properties = this.getCurrentActivityData()?.Properties;
				return main_core.Type.isPlainObject(properties) ? properties : {};
			},
			getCurrentDynamicTypeId() {
				const properties = this.getCurrentProperties();
				const dynamicTypeId = Number(properties.DynamicTypeId ?? this.fixedEntityTypeId ?? 0);
				return dynamicTypeId > 0 ? dynamicTypeId : 0;
			},
			getCurrentConditions() {
				const properties = this.getCurrentProperties();
				return main_core.Type.isPlainObject(properties.DynamicFilterFields) ? properties.DynamicFilterFields : {
					items: []
				};
			},
			getCurrentExpandedState() {
				const properties = this.getCurrentProperties();
				return properties.FilterIsExpanded !== 'N';
			},
			initAutomationContext() {
				const contextDocumentType = this.getContextDocumentType();
				const currentContext = bizproc_automation.tryGetGlobalContext();
				const currentDocument = currentContext?.document ?? null;
				const isSameDocument = currentDocument && deepEqual(currentDocument.rawDocumentType, contextDocumentType) && deepEqual(currentDocument.documentFields, this.documentFields);
				if (!isSameDocument) {
					const document = new bizproc_automation.Document({
						rawDocumentType: contextDocumentType,
						documentFields: this.documentFields,
						title: this.documentName
					});
					const contextValues = currentContext?.getValues?.() ?? {};
					bizproc_automation.setGlobalContext(new bizproc_automation.Context({
						...contextValues,
						document
					}));
				}
				if (BX?.Bizproc?.Automation?.API && !deepEqual(BX.Bizproc.Automation.API.documentType, contextDocumentType)) {
					BX.Bizproc.Automation.API.documentType = contextDocumentType;
				}
			},
			renderConditionSelector() {
				if (this.conditionGroupSelector || !this.$refs.filterFieldsContainer || !this.conditionGroup || !this.hasSelectedEntityType) {
					return;
				}
				this.conditionGroupSelector = ui_vue3.markRaw(new bizproc_automation.ConditionGroupSelector(this.conditionGroup, {
					fields: this.filterFields,
					fieldPrefix: this.filteringFieldsPrefix,
					onOpenMenu: this.onOpenFilterFieldsMenu,
					customSelector: main_core.Type.isFunction(window.BPAShowSelector) ? this.showFieldSelector : null,
					caption: {
						head: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_FIELDS'),
						collapsed: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_FIELDS_COLLAPSED')
					},
					isExpanded: this.isExpanded
				}));
				this.conditionGroupSelector.subscribe('onToggleGroupViewClick', event => {
					this.isExpanded = event.getData().isExpanded;
					this.syncActivityData();
				});
				main_core.Dom.clean(this.$refs.filterFieldsContainer);
				main_core.Dom.append(this.conditionGroupSelector.createNode(), this.$refs.filterFieldsContainer);
				this.bindSelectorStateTracking();
				this.observeConditionSelectorState();
				this.queueSelectorStateSync();
			},
			async syncConditionSelectorRendering() {
				await this.$nextTick();
				if (this.status !== Status.Loaded) {
					return;
				}
				if (!this.hasSelectedEntityType) {
					this.destroyConditionSelector();
					return;
				}
				this.rebuildConditionSelector();
			},
			rebuildConditionSelector() {
				this.destroyConditionSelector();
				this.renderConditionSelector();
			},
			destroyConditionSelector() {
				this.unbindSelectorStateTracking();
				this.disconnectConditionSelectorObserver();
				this.isSelectorStateSyncQueued = false;
				if (this.conditionGroupSelector) {
					this.conditionGroupSelector.destroy();
					this.conditionGroupSelector = null;
				}
				if (this.$refs.filterFieldsContainer) {
					main_core.Dom.clean(this.$refs.filterFieldsContainer);
				}
			},
			bindSelectorStateTracking() {
				if (!this.$refs.filterFieldsContainer) {
					return;
				}
				this.selectorInteractionHandler ??= () => {
					this.queueSelectorStateSync();
				};
				main_core.Event.bind(this.$refs.filterFieldsContainer, 'input', this.selectorInteractionHandler);
				main_core.Event.bind(this.$refs.filterFieldsContainer, 'change', this.selectorInteractionHandler);
			},
			unbindSelectorStateTracking() {
				if (!this.$refs.filterFieldsContainer || !this.selectorInteractionHandler) {
					return;
				}
				main_core.Event.unbind(this.$refs.filterFieldsContainer, 'input', this.selectorInteractionHandler);
				main_core.Event.unbind(this.$refs.filterFieldsContainer, 'change', this.selectorInteractionHandler);
			},
			observeConditionSelectorState() {
				if (!this.$refs.filterFieldsContainer) {
					return;
				}
				this.disconnectConditionSelectorObserver();
				this.selectorStateObserver = new MutationObserver(() => {
					this.queueSelectorStateSync();
				});
				this.selectorStateObserver.observe(this.$refs.filterFieldsContainer, {
					subtree: true,
					childList: true
				});
			},
			disconnectConditionSelectorObserver() {
				if (this.selectorStateObserver) {
					this.selectorStateObserver.disconnect();
					this.selectorStateObserver = null;
				}
			},
			queueSelectorStateSync() {
				if (this.isSelectorStateSyncQueued) {
					return;
				}
				this.isSelectorStateSyncQueued = true;
				queueMicrotaskSafe(() => {
					this.isSelectorStateSyncQueued = false;
					if (!this.conditionGroupSelector) {
						return;
					}
					this.syncSelectorStateFromDom();
				});
			},
			showFieldSelector(targetInputId) {
				window.BPAShowSelector(targetInputId, 'string', '');
			},
			initWorkflowGlobals() {
				window.arWorkflowParameters = this.template?.PARAMETERS ?? {};
				window.arWorkflowVariables = this.template?.VARIABLES ?? {};
				window.arWorkflowConstants = this.template?.CONSTANTS ?? {};
			},
			onOpenFilterFieldsMenu(event) {
				this.addBPFields(event.getData().selector);
			},
			addBPFields(selector) {
				const getSelectorProperties = ({
					properties,
					objectName,
					expressionPrefix
				}) => {
					if (main_core.Type.isObject(properties)) {
						return Object.entries(properties).map(([id, property]) => ({
							id,
							title: property.Name,
							customData: {
								field: {
									Id: id,
									Type: property.Type,
									Name: property.Name,
									ObjectName: objectName,
									SystemExpression: `{=${objectName}:${id}}`,
									Expression: expressionPrefix ? `{{${expressionPrefix}:${id}}}` : `{=${objectName}:${id}}`
								}
							}
						}));
					}
					return [];
				};
				const getGlobalSelectorProperties = ({
					properties,
					visibilityNames,
					objectName
				}) => {
					if (main_core.Type.isObject(properties)) {
						return Object.entries(properties).map(([id, property]) => {
							const field = {
								id,
								Type: property.Type,
								title: property.Name,
								ObjectName: objectName,
								SystemExpression: `{=${objectName}:${id}}`,
								Expression: `{=${objectName}:${id}}`
							};
							if (property.Visibility && visibilityNames[property.Visibility]) {
								field.Expression = `{{${visibilityNames[property.Visibility]}: ${property.Name}}}`;
							}
							return {
								id,
								title: property.Name,
								supertitle: visibilityNames[property.Visibility],
								customData: {
									field
								}
							};
						});
					}
					return [];
				};
				selector.addGroup('workflowParameters', {
					id: 'workflowParameters',
					title: main_core.Loc.getMessage('BIZPROC_WFEDIT_MENU_PARAMS'),
					children: [{
						id: 'parameters',
						title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_PARAMETERS_LIST'),
						children: getSelectorProperties({
							properties: window.arWorkflowParameters || {},
							objectName: 'Template',
							expressionPrefix: '~*'
						})
					}, {
						id: 'variables',
						title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_VARIABLES_LIST_1'),
						children: getSelectorProperties({
							properties: window.arWorkflowVariables || {},
							objectName: 'Variable'
						})
					}, {
						id: 'constants',
						title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_CONSTANTS_LIST'),
						children: getSelectorProperties({
							properties: window.arWorkflowConstants || {},
							objectName: 'Constant',
							expressionPrefix: '~&'
						})
					}]
				});
				if (window.arWorkflowGlobalVariables && window.wfGVarVisibilityNames) {
					selector.addGroup('globalVariables', {
						id: 'globalVariables',
						title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_VARIABLES_LIST'),
						children: getGlobalSelectorProperties({
							properties: window.arWorkflowGlobalVariables || {},
							visibilityNames: window.wfGVarVisibilityNames || {},
							objectName: 'GlobalVar'
						})
					});
				}
				selector.addGroup('globalConstants', {
					id: 'globalConstants',
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_CONSTANTS_LIST'),
					children: getGlobalSelectorProperties({
						properties: window.arWorkflowGlobalConstants || {},
						visibilityNames: window.wfGConstVisibilityNames || {},
						objectName: 'GlobalConst'
					})
				});
			},
			syncSelectorStateFromDom(force = false) {
				const nextConditions = this.readConditionsFromSelectorDom();
				if (!force && deepEqual(this.serializedConditions, nextConditions)) {
					return;
				}
				this.serializedConditions = nextConditions;
				this.syncActivityData();
			},
			readConditionsFromSelectorDom() {
				const container = this.$refs.filterFieldsContainer;
				if (!container) {
					return this.getSerializedConditions();
				}
				const formFields = {};
				const elements = container.querySelectorAll('input[name], select[name], textarea[name]');
				elements.forEach(element => {
					if (element.disabled || !main_core.Type.isStringFilled(element.name)) {
						return;
					}
					if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) {
						return;
					}
					const isMultiple = element.name.endsWith('[]');
					const fieldName = isMultiple ? element.name.slice(0, -2) : element.name;
					if (isMultiple) {
						if (!main_core.Type.isArray(formFields[fieldName])) {
							formFields[fieldName] = [];
						}
						formFields[fieldName].push(element.value);
					} else {
						formFields[fieldName] = element.value;
					}
				});
				return Object.keys(formFields).length > 0 ? bizproc_automation.ConditionGroup.createFromForm(formFields, this.filteringFieldsPrefix).serialize() : EMPTY_CONDITIONS;
			},
			syncActivityData() {
				if (!this.hasSelectedEntityType) {
					this.changeRuleExpression(this.construction, {
						actionId: this.backingActivityType,
						activityData: null
					});
					return;
				}
				const rawDynamicTypeId = Number(this.currentEntityTypeId);
				this.changeRuleExpression(this.construction, {
					actionId: this.backingActivityType,
					activityData: this.buildActivityData({
						dynamicTypeId: Number.isFinite(rawDynamicTypeId) ? rawDynamicTypeId : 0,
						conditions: this.getSerializedConditions(),
						isExpanded: this.isExpanded
					})
				});
			},
			getSerializedConditions() {
				if (main_core.Type.isPlainObject(this.serializedConditions)) {
					return this.serializedConditions;
				}
				return main_core.Type.isFunction(this.conditionGroup?.serialize) ? this.conditionGroup.serialize() : EMPTY_CONDITIONS;
			},
			buildActivityData({
				dynamicTypeId,
				conditions,
				isExpanded
			}) {
				const currentActivityData = this.getCurrentActivityData() ?? {};
				const currentProperties = main_core.Type.isPlainObject(currentActivityData.Properties) ? currentActivityData.Properties : {};
				const previousDynamicTypeId = Number(currentProperties.DynamicTypeId ?? 0);
				const currentReturnProperties = main_core.Type.isArray(currentActivityData.ReturnProperties) ? currentActivityData.ReturnProperties : [];
				return {
					...currentActivityData,
					Name: main_core.Type.isStringFilled(currentActivityData.Name) ? currentActivityData.Name : createUniqueId(),
					Type: this.backingActivityType,
					Activated: currentActivityData.Activated ?? 'Y',
					Properties: {
						...currentProperties,
						Title: currentProperties.Title ?? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME'),
						DynamicTypeId: dynamicTypeId,
						DynamicFilterFields: conditions,
						ReturnFields: main_core.Type.isArrayFilled(currentProperties.ReturnFields) ? currentProperties.ReturnFields : ['ID'],
						OnlyDynamicEntities: this.fixedEntityTypeId ? 'N' : 'Y',
						FilterIsExpanded: isExpanded ? 'Y' : 'N'
					},
					ReturnProperties: previousDynamicTypeId === dynamicTypeId && currentReturnProperties.length > 0 ? currentReturnProperties : this.buildReturnProperties(dynamicTypeId)
				};
			},
			buildReturnProperties(dynamicTypeId) {
				const documentType = this.resolveReturnDocumentType(dynamicTypeId);
				if (!main_core.Type.isArrayFilled(documentType)) {
					return [];
				}
				const entityTitle = this.entityTypeOptions.find(option => option.value === String(dynamicTypeId))?.title ?? this.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT');
				return [{
					Id: FILTER_DOCUMENT_PROPERTY_ID,
					Name: entityTitle,
					Type: PROPERTY_TYPES.DOCUMENT,
					Multiple: false,
					Default: documentType
				}];
			},
			resolveReturnDocumentType(dynamicTypeId) {
				const currentActivityData = this.getCurrentActivityData();
				const currentProperties = this.getCurrentProperties();
				const previousDynamicTypeId = Number(currentProperties.DynamicTypeId ?? 0);
				if (previousDynamicTypeId === dynamicTypeId) {
					const documentProperty = currentActivityData?.ReturnProperties?.find(property => property?.Id === FILTER_DOCUMENT_PROPERTY_ID && main_core.Type.isArrayFilled(property?.Default));
					if (documentProperty) {
						return documentProperty.Default;
					}
				}
				if (this.nodeSettings?.fixedDocumentType?.length === CorrectDocumentTypeLength) {
					return this.nodeSettings.fixedDocumentType;
				}
				if (this.documentTypeMap.has(String(dynamicTypeId))) {
					return this.documentTypeMap.get(String(dynamicTypeId));
				}
				return main_core.Type.isArrayFilled(this.documentType) ? this.documentType : null;
			},
			subscribeOnBeforeSubmit() {
				this.unsubscribe();
				this.onBeforeSubmitCallback = () => this.syncSelectorStateFromDom(true);
				main_core_events.EventEmitter.subscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onBeforeSubmitCallback);
			},
			unsubscribe() {
				if (this.onBeforeSubmitCallback) {
					main_core_events.EventEmitter.unsubscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onBeforeSubmitCallback);
				}
			}
		},
		template: `
		<div class="editor-chart-node-settings-edit-filter-expression">
			<div
				v-if="status === Status.Loading"
				class="editor-chart-node-settings-edit-filter-expression__loader"
			>
				<Loader />
			</div>
			<div
				v-else-if="status === Status.Error"
			>
				<EditExtendedAction
					:actionId="fallbackActionMeta.id"
					:actionMeta="fallbackActionMeta"
					:activityData="construction.expression.activityData"
					:construction="construction"
					:documentType="documentType"
					:ruleCard="ruleCard"
					:template="template"
				/>
			</div>
			<template v-else>
				<div
					v-if="isEntitySelectorVisible"
					class="editor-chart-node-settings-edit-filter-expression__item"
				>
					<span class="editor-chart-node-settings-edit-filter-expression__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_ENTITY_TYPE') }}
					</span>
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select
							v-model="currentEntityTypeId"
							class="ui-ctl-element"
						>
							<option value="">
								{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED') }}
							</option>
							<option
								v-for="option in entityTypeOptions"
								:key="option.value"
								:value="option.value"
							>
								{{ option.title }}
							</option>
						</select>
					</div>
				</div>
				<div
					v-if="hasSelectedEntityType"
					class="editor-chart-node-settings-edit-filter-expression__item"
				>
					<div ref="filterFieldsContainer"></div>
				</div>
			</template>
		</div>
	`
	};

	const ADD_ITEM_ICONS = {
		rule: ui_iconSet_api_vue.Outline.EDIT_M,
		relation: ui_iconSet_api_vue.Outline.PLUS_M
	};

	// @vue/component
	const BasicNodeSettings = {
		name: 'BasicNodeSettings',
		components: {
			EditNodeSettingsForm,
			NodeSettingsPreview,
			AddSettingsItem
		},
		computed: {
			...ui_vue3_pinia.mapState(diagramStore, ['connections']),
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['block', 'nodeSettings']),
			...ui_vue3_pinia.mapWritableState(useNodeSettingsStore, ['selectedTabId']),
			addItemIcons() {
				return ADD_ITEM_ICONS;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['setCurrentRule', 'deleteRuleSettings', 'deletePort']),
			...ui_vue3_pinia.mapActions(diagramStore, ['publicDraft', 'getBlockAncestorsByInputPortId', 'deleteConnectionByBlockIdAndPortId']),
			onShowConstructions(port) {
				this.selectedTabId = NODE_SETTINGS_TABS.rules;
				this.setCurrentRule(port);
			},
			async deleteRule(ruleId) {
				const connections = [...this.connections];
				this.deletePort(ruleId);
				const {
					outputPortsToDelete
				} = this.deleteRuleSettings(ruleId);
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
			}
		},
		template: `
		<EditNodeSettingsForm>
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
					:iconName="addItemIcons[itemType]"
				>
					{{ text }}
				</AddSettingsItem>
			</template>
		</EditNodeSettingsForm>
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
			DeleteRuleCard,
			EditExtendedAction,
			EditFilterExpression
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
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'currentRule', 'block']),
			...ui_vue3_pinia.mapWritableState(useNodeSettingsStore, ['isSaving']),
			...ui_vue3_pinia.mapState(diagramStore, ['documentType', 'template'])
		},
		methods: {
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['reorder', 'addConstruction']),
			onScroll() {
				this.isScrolling = true;
				this.$nextTick(() => {
					this.isScrolling = false;
				});
			},
			onAddConstruction(groupName, ruleCard) {
				if (groupName === CONSTRUCTION_GROUPS.conditions) {
					this.addConstruction(ruleCard, CONSTRUCTION_TYPES.CONDITION.AND_CONDITION);
					return;
				}
				this.addConstruction(ruleCard, CONSTRUCTION_TYPES.ACTION);
			}
		},
		template: `
		<NodeSettingsRulesLayout
			:nodeSettings="nodeSettings"
			:currentRule="currentRule"
			:isSaving="isSaving"
			@drop="reorder"
			@scroll-layout="onScroll"
		>
			<template #addConstructionToolbar>
				<AddConstruction />
			</template>

			<template #ruleCard="{ ruleCard }">
				<RuleCard
					:ruleCard="ruleCard"
					@addConstruction="(groupName) => onAddConstruction(groupName, ruleCard)"
				>
					<template #deleteRuleCard>
						<DeleteRuleCard :ruleCard="ruleCard" />
					</template>

					<template #construction="{ construction }">
						<RuleConstruction
							:ruleCardId="ruleCard.id"
							:construction="construction"
						>
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

							<template #filter>
								<EditFilterExpression
									:construction="construction"
									:documentType="documentType"
									:ruleCard="ruleCard"
									:template="template"
								/>
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
				</RuleCard>
			</template>
		</NodeSettingsRulesLayout>
	`
	};

	// @vue/component
	const NodeSettings = {
		name: 'NodeSettings',
		components: {
			BasicNodeSettings,
			NodeSettingsRules,
			EditorChartTabs,
			SaveSettingsButton,
			CancelSettingsButton,
			NodeSettingsLayout
		},
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage,
				getBackgroundImage,
				blockMediator: new BlockMediator()
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(diagramStore, ['documentType']),
			...ui_vue3_pinia.mapState(useNodeSettingsStore, ['isLoading', 'isShown', 'block', 'nodeSettings', 'ports']),
			...ui_vue3_pinia.mapWritableState(useNodeSettingsStore, ['isSaving', 'selectedTabId']),
			moreMenuItems() {
				return this.block ? this.blockMediator.getSettingsBlockMenuOptions(this.block) : [];
			},
			tabs() {
				return new Map([[NODE_SETTINGS_TABS.basic, {
					id: NODE_SETTINGS_TABS.basic,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_BASIC'),
					content: BasicNodeSettings
				}], [NODE_SETTINGS_TABS.rules, {
					id: NODE_SETTINGS_TABS.rules,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_RULES'),
					content: NodeSettingsRules
				}]]);
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useAppStore, ['hideRightPanel']),
			...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['discardFormSettings', 'toggleVisibility', 'reset', 'saveRule', 'saveForm', 'saveRelation']),
			...ui_vue3_pinia.mapActions(useNodeDataInspectorStore, ['resetDataInspector']),
			...ui_vue3_pinia.mapActions(diagramStore, ['updateBlockActivityField', 'setPorts', 'publicDraft']),
			hideSettings() {
				this.hideRightPanel();
				this.toggleVisibility(false);
				this.reset();
				this.resetDataInspector();
			},
			onClose() {
				this.discardFormSettings();
				this.hideSettings();
			},
			async saveRules() {
				await main_core_events.EventEmitter.emitAsync(EVENT_NAMES.BEFORE_SUBMIT_EVENT);
				const rulesIds = [...this.nodeSettings.rules.keys()];
				return Promise.all(rulesIds.map(ruleId => this.saveRule(ruleId, this.documentType)));
			},
			saveRelations() {
				const relationsIds = [...this.nodeSettings.relations.keys()];
				return Promise.all(relationsIds.map(relationId => this.saveRelation(relationId)));
			},
			async saveSettings() {
				const {
					waitForCatalog,
					getDefaultTitle
				} = useDefaultTitle();
				await waitForCatalog();
				const activityData = await this.saveForm(this.documentType, getDefaultTitle(this.block.activity));
				this.updateBlockActivityField(this.block.id, activityData);
				this.setPorts(this.block.id, this.ports);
				await this.publicDraft();
			},
			async onSave() {
				this.isSaving = true;
				try {
					await Promise.all([this.saveRules(), this.saveRelations()]);
					await this.saveSettings();
					this.hideSettings();
				} catch (error) {
					if (error.errors?.[0]?.message) {
						ui_dialogs_messagebox.MessageBox.alert(main_core.Text.encode(error.errors[0].message));
					}
				} finally {
					this.isSaving = false;
				}
			}
		},
		template: `
		<NodeSettingsLayout
			:isLoading="isLoading"
			:isSaving="isSaving"
			:isShown="isShown"
			@close="onClose"
		>
			<template #header>
				<slot
					name="header"
					:block="block"
					:title="nodeSettings?.title"
					:moreMenuItems="moreMenuItems"
					:onDeletedBlock="onClose"
				/>
			</template>

			<template #tabs>
				<EditorChartTabs
					v-model="selectedTabId"
					:tabs="tabs"
				/>
			</template>

			<template #data-inspector-toggle>
				<slot name="data-inspector-toggle" />
			</template>

			<template #content>
				<KeepAlive>
					<component
						:is="tabs.get(this.selectedTabId).content"
					/>
				</KeepALive>
			</template>

			<template #actions>
				<SaveSettingsButton
					:isSaving="isSaving"
					:data-test-id="$testId('complexNodeSettingsSave')"
					@click="onSave"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeSettingsDiscard')"
					@click="onClose"
				/>
			</template>
		</NodeSettingsLayout>
	`
	};

	// @vue/component
	const NodeSettingsHeader = {
		name: 'NodeSettingsHeader',
		components: {
			BlockHeader,
			BlockIcon,
			DeleteBlockIconBtn,
			ChangeActivationTopBtn,
			MoreMenuTopBtn,
			UpdatePublishedStatusLabel
		},
		props: {
			/** @type Block */
			block: {
				type: Object,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			moreMenuItems: {
				type: Array,
				default: () => []
			}
		},
		emits: ['deletedBlock'],
		setup() {
			const headerRef = ui_vue3.ref(null);
			return {
				headerRef
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
			subIconExternal() {
				const icon = this.block.node?.icon;
				if (!icon || !main_core.Type.isString(icon)) {
					return false;
				}
				try {
					const u = new URL(icon);
					return u.protocol === 'https:';
				} catch {
					return false;
				}
			},
			subIconBackground() {
				if (!this.subIconExternal) {
					return {};
				}
				return {
					'background-image': `url('${this.block.node.icon}')`
				};
			}
		},
		methods: {
			onDeletedBlock(blockId) {
				this.$emit('deletedBlock', blockId);
			}
		},
		template: `
		<div ref="headerRef" class="editor-chart-node-settings-header">
			<BlockHeader
				:block="block"
				:title="title"
				:subIconExternal="subIconExternal"
			>
				<template #icon>
					<BlockIcon
						:iconName="icon"
						:iconColorIndex="colorIndex"
					/>
				</template>
				<template v-if="isSubIcon" #subIcon>
					<div
						v-if="subIconExternal"
						:style="subIconBackground"
						class="ui-selector-item-avatar"
					/>
					<BlockIcon
						v-else
						:iconName="block.node.icon"
						:iconColorIndex="7"
						:iconSize="24"
					/>
				</template>
				<template #status>
					<UpdatePublishedStatusLabel :block="block"/>
				</template>
			</BlockHeader>
			<div class="editor-chart-node-settings-header__controls">
				<DeleteBlockIconBtn
					:blockId="block.id"
					:size="20"
					@deletedBlock="onDeletedBlock"
				/>
				<ChangeActivationTopBtn :block="block" :size="20"/>
				<MoreMenuTopBtn
					v-if="moreMenuItems.length > 0"
					:block="block"
					:moreMenuItems="moreMenuItems"
					:menuTargetContainer="headerRef"
					:size="20"
				/>
			</div>
		</div>
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
	const Chart = {
		components: {
			AppLayout,
			AppHeader,
			AppSkeleton,
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
			HistoryBar: ui_blockDiagram.HistoryBar,
			SearchBar,
			Catalog,
			CommonNodeSettings,
			ConnectionAux,
			ToastWidget,
			ToastWarning,
			ToastErrorBlockNavigationButton,
			NodeDataInspector,
			ToggleInspectorControl,
			NodeSettingsHeader
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
			<template #skeleton>
				<AppSkeleton
					v-if="isDiagramDisabled"
				/>
			</template>

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
				<CommonNodeSettings>
					<template #header="{ block, moreMenuItems, onDeletedBlock }">
						<NodeSettingsHeader
							:block="block"
							:moreMenuItems="moreMenuItems"
							@deletedBlock="onDeletedBlock"
						/>
					</template>
					<template #data-inspector-toggle>
						<ToggleInspectorControl />
					</template>
				</CommonNodeSettings>

				<ComplexNodeSettings>
					<template #header="{ block, moreMenuItems, onDeletedBlock }">
						<NodeSettingsHeader
							:block="block"
							:moreMenuItems="moreMenuItems"
							@deletedBlock="onDeletedBlock"
						/>
					</template>
					<template #data-inspector-toggle>
						<ToggleInspectorControl />
					</template>
				</ComplexNodeSettings>
			</template>

			<template #settings-data-inspector>
				<NodeDataInspector />
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

})(this.BX.Bizprocdesigner.Editor = this.BX.Bizprocdesigner.Editor || {}, BX.Vue3, BX.Vue3.Pinia, BX.UI, window, window, BX.Bizprocdesigner, BX, BX, BX.Event, BX.UI.Notification, BX.UI.System.Skeleton.Vue, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.UI.IconSet, BX.UI.IconSet, BX.UI, BX.UI.Vue3.Components, BX.UI, BX.Vue3.Directives, BX.UI.Feedback, BX.Main, BX.UI.Dialogs, BX, BX.UI.EntitySelector, BX.UI.System, BX.UI.System.Chip.Vue, BX.UI.System.Input, BX.UI.System.Menu, BX.UI.Vue3.Components, BX.Bizproc.Automation);
//# sourceMappingURL=chart.bundle.js.map
