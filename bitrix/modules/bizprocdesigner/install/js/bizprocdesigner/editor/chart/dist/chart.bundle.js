/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {};
(function (exports,pull_client,ui_loader,ui_vue3_components_menu,ui_vue3_directives_hint,window$1,ui_entitySelector,main_popup,main_core_events,ui_dialogs_messagebox,ui_vue3_components_popup,ui_feedback_form,bizprocdesigner_feature,ui_notification,ui_blockDiagram,ui_vue3_components_button,ui_iconSet_api_core,main_core,ui_buttons,ui_system_dialog,ui_iconSet_api_vue,ui_vue3,ui_vue3_pinia) {
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
	  var _getCurrentInstance, _app$config$globalPro, _app$config, _app$config$globalPro2;
	  const app = (_getCurrentInstance = ui_vue3.getCurrentInstance()) == null ? void 0 : _getCurrentInstance.appContext.app;
	  const bitrix = (_app$config$globalPro = app == null ? void 0 : (_app$config = app.config) == null ? void 0 : (_app$config$globalPro2 = _app$config.globalProperties) == null ? void 0 : _app$config$globalPro2.$bitrix) != null ? _app$config$globalPro : null;
	  return {
	    getMessage: (messageId, replacements) => {
	      var _bitrix$Loc;
	      return bitrix == null ? void 0 : (_bitrix$Loc = bitrix.Loc) == null ? void 0 : _bitrix$Loc.getMessage(messageId, replacements);
	    }
	  };
	}

	let _ = t => t,
	  _t;
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
	  const form = main_core.Tag.render(_t || (_t = _`
		<form
			id="form-settings"
			class="bx-core-adm-dialog node-settings-form"
			name="bx_popup_form">
		</form>
	`));
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

	function useActivationMenu(store) {
	  function showActivationMenu(event, block, onToggle) {
	    var _Loc$getMessage, _Loc$getMessage2;
	    const menuText = block.activity.Activated === 'Y' ? (_Loc$getMessage = main_core.Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_OFF')) != null ? _Loc$getMessage : '' : (_Loc$getMessage2 = main_core.Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_ON')) != null ? _Loc$getMessage2 : '';
	    const menuItems = [{
	      id: 'deactivate',
	      text: menuText,
	      onclick: () => {
	        store.toggleBlockActivation(block.id, true);
	        if (onToggle) {
	          onToggle();
	        }
	        main_popup.MenuManager.destroy('node-settings-local-menu');
	      }
	    }];
	    main_popup.MenuManager.show('node-settings-local-menu', event.target, menuItems, {
	      autoHide: true,
	      cacheable: false,
	      angle: true,
	      offsetLeft: 0,
	      offsetTop: 0
	    });
	  }
	  return {
	    showActivationMenu
	  };
	}

	const BLOCK_TYPES = {
	  SIMPLE: 'simple',
	  TRIGGER: 'trigger',
	  COMPLEX: 'complex',
	  TOOL: 'tool',
	  FRAME: 'frame'
	};
	const PORT_TYPES = Object.freeze({
	  input: 'input',
	  output: 'output',
	  aux: 'aux',
	  topAux: 'topAux'
	});

	const BLOCK_TYPES$1 = {
	  SIMPLE: 'simple',
	  TRIGGER: 'trigger',
	  COMPLEX: 'complex',
	  FRAME: 'frame',
	  TOOL: 'tool'
	};
	const BLOCK_SLOT_NAMES = {
	  SIMPLE: `block:${BLOCK_TYPES$1.SIMPLE}`,
	  TRIGGER: `block:${BLOCK_TYPES$1.TRIGGER}`,
	  COMPLEX: `block:${BLOCK_TYPES$1.COMPLEX}`,
	  FRAME: `block:${BLOCK_TYPES$1.FRAME}`,
	  TOOL: `block:${BLOCK_TYPES$1.TOOL}`
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

	const post = async (action, data) => {
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
	    return post('Catalog.get');
	  },
	  getDiagramData: async params => {
	    return post('Diagram.get', params);
	  },
	  updateTemplateData: data => {
	    return post('Diagram.updateTemplate', data);
	  },
	  publicDiagramData: data => {
	    return post('Diagram.publicate', data);
	  },
	  publicDiagramDataDraft: data => {
	    return post('Diagram.publicateDraft', data);
	  },
	  getNodeSettingsControls: data => {
	    return post('Activity.getSettingsControls', data);
	  },
	  saveNodeSettings: data => {
	    return post('Activity.SaveSettings', data);
	  }
	};

	function deepEqual(a, b) {
	  if (a === b) {
	    return true;
	  }
	  if (!main_core.Type.isPlainObject(a) || !main_core.Type.isPlainObject(b)) {
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
	function isBlockPropertiesDifferent(currentBlock, newBlock) {
	  if (currentBlock.node.title !== newBlock.node.title) {
	    return true;
	  }
	  for (const [key] of Object.entries((_newBlock$activity$Pr = newBlock == null ? void 0 : (_newBlock$activity = newBlock.activity) == null ? void 0 : _newBlock$activity.Properties) != null ? _newBlock$activity$Pr : {})) {
	    var _newBlock$activity$Pr, _newBlock$activity, _currentBlock$activit, _currentBlock$activit2, _currentBlock$activit3;
	    const currentBlockProperty = (_currentBlock$activit = currentBlock == null ? void 0 : (_currentBlock$activit2 = currentBlock.activity) == null ? void 0 : (_currentBlock$activit3 = _currentBlock$activit2.Properties) == null ? void 0 : _currentBlock$activit3[key]) != null ? _currentBlock$activit : null;
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
	function isBlockActivated(block) {
	  var _block$activity;
	  if (!(block != null && (_block$activity = block.activity) != null && _block$activity.Activated)) {
	    return true;
	  }
	  return block.activity.Activated !== 'N';
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
	    sourceBlockId,
	    sourcePortId,
	    sourcePort,
	    targetBlockId,
	    targetPortId
	  } = newConnection;
	  if (sourcePort.type === PORT_TYPES.output) {
	    return {
	      sourceBlockId,
	      sourcePortId,
	      targetBlockId,
	      targetPortId
	    };
	  }
	  return {
	    sourceBlockId: targetBlockId,
	    sourcePortId: targetPortId,
	    targetBlockId: sourceBlockId,
	    targetPortId: sourcePortId
	  };
	}
	function normalyzeAuxConnection(newConnection) {
	  const {
	    sourceBlockId,
	    sourcePortId,
	    sourcePort,
	    targetBlockId,
	    targetPortId
	  } = newConnection;
	  if (sourcePort.type === PORT_TYPES.aux) {
	    return {
	      sourceBlockId,
	      sourcePortId,
	      targetBlockId,
	      targetPortId,
	      type: AUX
	    };
	  }
	  return {
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
	  var _response$errors;
	  if (((_response$errors = response.errors) == null ? void 0 : _response$errors.length) > 0) {
	    const [error] = response.errors;
	    ui_notification.UI.Notification.Center.notify({
	      content: main_core.Text.encode(error.message),
	      autoHideDelay: 4000
	    });
	  } else {
	    console.error(response);
	  }
	}

	const PORT_LABELS = Object.freeze({
	  input: 'G',
	  output: 'E'
	});
	const PORT_POSITIONS = Object.freeze({
	  left: 'left',
	  right: 'right'
	});
	const BLOCK_TYPES$2 = {
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
	      blockSavedTimestamps: state.blockSavedTimestamps
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
	      var _diagramData$template, _diagramData$draftId, _diagramData$companyN, _diagramData$document, _diagramData$document2, _diagramData$template2, _diagramData$blocks, _diagramData$connecti;
	      const diagramData = await editorAPI.getDiagramData(params);
	      this.templateId = (_diagramData$template = diagramData == null ? void 0 : diagramData.templateId) != null ? _diagramData$template : 0;
	      this.draftId = (_diagramData$draftId = diagramData == null ? void 0 : diagramData.draftId) != null ? _diagramData$draftId : 0;
	      this.companyName = (_diagramData$companyN = diagramData == null ? void 0 : diagramData.companyName) != null ? _diagramData$companyN : '';
	      this.documentType = (_diagramData$document = diagramData == null ? void 0 : diagramData.documentType) != null ? _diagramData$document : [];
	      this.documentTypeSigned = (_diagramData$document2 = diagramData == null ? void 0 : diagramData.documentTypeSigned) != null ? _diagramData$document2 : '';
	      this.template = (_diagramData$template2 = diagramData == null ? void 0 : diagramData.template) != null ? _diagramData$template2 : {};
	      this.blocks = this.normalyzeBlocks((_diagramData$blocks = diagramData == null ? void 0 : diagramData.blocks) != null ? _diagramData$blocks : []);
	      this.setConnections((_diagramData$connecti = diagramData == null ? void 0 : diagramData.connections) != null ? _diagramData$connecti : []);
	      for (const block of this.blocks) {
	        var _block$node$updated, _block$node$published;
	        const now = Date.now();
	        this.blockCurrentTimestamps[block.id] = (_block$node$updated = block.node.updated) != null ? _block$node$updated : now;
	        this.blockSavedTimestamps[block.id] = (_block$node$published = block.node.published) != null ? _block$node$published : now;
	      }
	    },
	    normalyzeBlocks(blocks) {
	      return blocks.map(block => {
	        const groupedPorts = Object.entries(block.ports).reduce((portsMap, [type, ports]) => {
	          var _ports$map;
	          portsMap[type] = (_ports$map = ports == null ? void 0 : ports.map(port => ({
	            ...port,
	            type
	          }))) != null ? _ports$map : [];
	          return portsMap;
	        }, {});
	        return {
	          ...block,
	          ports: groupedPorts
	        };
	      });
	    },
	    getDeleteHandlerForBlockType(blockType) {
	      if (blockType === BLOCK_TYPES$2.SetupTemplateActivity) {
	        return this.handleDeletingConstants;
	      }
	      return null;
	    },
	    handleDeletingConstants(block) {
	      var _block$activity, _block$activity$Prope, _this$template;
	      const rawConstants = (_block$activity = block.activity) == null ? void 0 : (_block$activity$Prope = _block$activity.Properties) == null ? void 0 : _block$activity$Prope.blocks;
	      const constants = (_this$template = this.template) == null ? void 0 : _this$template.CONSTANTS;
	      if (!constants) {
	        return;
	      }
	      const items = parseItemsFromBlocksJson(rawConstants);
	      items.filter(item => (item == null ? void 0 : item.itemType) === 'constant' && item.id in constants).forEach(item => {
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
	      var _blockToDelete$activi;
	      const blockIndex = this.blocks.findIndex(block => block.id === blockId);
	      if (blockIndex === -1) {
	        return;
	      }
	      const blockToDelete = this.blocks[blockIndex];
	      const blockType = (_blockToDelete$activi = blockToDelete.activity) == null ? void 0 : _blockToDelete$activi.Type;
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
	    },
	    setBlockCurrentTimestamp(block) {
	      this.blockCurrentTimestamps[block.id] = Date.now();
	    },
	    updateBlockActivityField(id, activity) {
	      const block = this.blocks.find(b => b.id === id);
	      if (block) {
	        block.activity = activity;
	      }
	      this.updateBlockTimestamp(block);
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
	    updateTitle(newTitle) {
	      this.template.NAME = newTitle;
	    },
	    updateDescription(newDescription) {
	      this.template.DESCRIPTION = newDescription;
	    },
	    updateTemplateId(templateId) {
	      this.templateId = templateId;
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
	    setInputPorts(block, inputPorts) {
	      Object.assign(block.ports, {
	        input: inputPorts
	      });
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
	            updated: this.blockCurrentTimestamps[block.id],
	            published: this.blockSavedTimestamps[block.id]
	          }
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
	      const requestData = {
	        ...this.diagramData,
	        blocks: this.blocks.map(block => ({
	          ...block,
	          node: {
	            ...block.node,
	            updated: null,
	            published: null
	          }
	        }))
	      };
	      const {
	        templateId
	      } = await editorAPI.publicDiagramData(requestData);
	      if (main_core.Type.isNumber(templateId)) {
	        this.blockSavedTimestamps = {
	          ...this.blockCurrentTimestamps
	        };
	        this.templateId = templateId;
	        this.draftId = 0;
	      }
	    },
	    updateStatus(isOnline) {
	      this.isOnline = isOnline;
	    },
	    updateBlockTimestamp(block) {
	      this.blockCurrentTimestamps[block.id] = Date.now();
	    },
	    setBlockCurrentTimestamps(blockCurrentTimestamps) {
	      Object.assign(this.blockCurrentTimestamps, blockCurrentTimestamps);
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
	    updateNodeTitle(block, title) {
	      Object.assign(block.node, {
	        title
	      });
	    },
	    createPort(ports, {
	      portId,
	      type,
	      label,
	      portTitle
	    }) {
	      var _ports, _lastPort$title$split, _lastPort$title;
	      const lastPort = (_ports = ports[ports.length - 1]) != null ? _ports : null;
	      const [, count] = (_lastPort$title$split = lastPort == null ? void 0 : (_lastPort$title = lastPort.title) == null ? void 0 : _lastPort$title.split(label)) != null ? _lastPort$title$split : [];
	      const title = portTitle != null ? portTitle : `${label}${Number(count != null ? count : 0) + 1}`;
	      return {
	        id: portId,
	        title,
	        type,
	        position: type === PORT_TYPES.input ? PORT_POSITIONS.left : PORT_POSITIONS.right
	      };
	    },
	    addRulePort(blockId, portId, type, portTitle) {
	      const block = this.blocks.find(b => b.id === blockId);
	      if (!block) {
	        return;
	      }
	      const {
	        ports
	      } = block;
	      let currentPorts = ports.input;
	      let label = PORT_LABELS.input;
	      if (type === PORT_TYPES.output) {
	        currentPorts = ports.output;
	        label = PORT_LABELS.output;
	      }
	      const rulePorts = currentPorts.filter(p => !p.isConnectionPort);
	      const port = this.createPort(rulePorts, {
	        portId,
	        type,
	        label,
	        portTitle
	      });
	      currentPorts.push(port);
	    },
	    addConnectionPort(blockId, portId, type) {
	      const block = this.blocks.find(b => b.id === blockId);
	      if (!block) {
	        return;
	      }
	      const {
	        ports
	      } = block;
	      const currentPorts = type === PORT_TYPES.input ? ports.input : ports.output;
	      const connectionPorts = currentPorts.filter(p => p.isConnectionPort);
	      const port = this.createPort(connectionPorts, {
	        portId,
	        type,
	        label: 'NG'
	      });
	      currentPorts.push({
	        ...port,
	        isConnectionPort: true
	      });
	    },
	    deletePort(blockId, portId, type) {
	      const block = this.blocks.find(b => b.id === blockId);
	      if (!block) {
	        return;
	      }
	      const {
	        ports
	      } = block;
	      const currentPorts = type === PORT_TYPES.output ? ports.output : ports.input;
	      const deletedPort = currentPorts.find(port => portId === port.id);
	      currentPorts.splice(currentPorts.indexOf(deletedPort), 1);
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
	      var _Loc$getMessage, _Loc$getMessage2;
	      const block = this.blocks.find(b => b.id === blockId);
	      if (!block) {
	        return;
	      }
	      const newActivatedState = block.activity.Activated === 'Y' ? 'N' : 'Y';
	      const applyChanges = () => {
	        block.activity.Activated = newActivatedState;
	        this.updateBlockActivityField(blockId, block.activity);
	      };
	      if (skipDraft) {
	        applyChanges();
	        return;
	      }
	      const actionLabel = newActivatedState === 'N' ? (_Loc$getMessage = main_core.Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_OFF')) != null ? _Loc$getMessage : '' : (_Loc$getMessage2 = main_core.Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_ON')) != null ? _Loc$getMessage2 : '';
	      try {
	        applyChanges();
	        await this.publicDraft();
	        ui_notification.UI.Notification.Center.notify({
	          content: actionLabel,
	          autoHideDelay: 4000
	        });
	      } catch (error) {
	        handleResponseError(error);
	      }
	    }
	  }
	});

	// @vue/component
	const BlockDiagram = {
	  name: 'block-diagram',
	  components: {
	    UiBlockDiagram: ui_blockDiagram.BlockDiagram
	  },
	  props: {
	    blocks: {
	      type: Array,
	      default: () => []
	    },
	    connections: {
	      type: Array,
	      default: () => []
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update:blocks', 'update:connections', 'blockTransitionEnd'],
	  setup(props) {
	    return {
	      blockSlotNames: BLOCK_SLOT_NAMES,
	      connectionSlotNames: CONNECTION_SLOT_NAMES
	    };
	  },
	  template: `
		<UiBlockDiagram
			:blocks="blocks"
			:connections="connections"
			:disabled="disabled"
			@update:blocks="$emit('update:blocks', $event)"
			@update:connections="$emit('update:connections', $event)"
			@blockTransitionEnd="$emit('blockTransitionEnd', $event)"
		>
			<template #[blockSlotNames.SIMPLE]="{ block }">
				<slot
					:name="blockSlotNames.SIMPLE"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.TRIGGER]="{ block }">
				<slot
					:name="blockSlotNames.TRIGGER"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.COMPLEX]="{ block }">
				<slot
					:name="blockSlotNames.COMPLEX"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.TOOL]="{ block }">
				<slot
					:name="blockSlotNames.TOOL"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.FRAME]="{ block }">
				<slot
					:name="blockSlotNames.FRAME"
					:block="block"
				/>
			</template>

			<template #[connectionSlotNames.AUX]="{ connection }">
				<slot
					:name="connectionSlotNames.AUX"
					:connection="connection"
				/>
			</template>
		</UiBlockDiagram>
	`
	};

	// eslint-disable-next-line no-unused-vars

	const BLOCK_CONTAINER_CLASS_NAMES = {
	  base: 'editor-chart-block-container',
	  highlighted: '--highlighted',
	  deactivated: '--deactivated',
	  [BLOCK_COLOR_NAMES.WHITE]: '--white',
	  [BLOCK_COLOR_NAMES.ORANGE]: '--orange',
	  [BLOCK_COLOR_NAMES.BLUE]: '--blue'
	};

	// @vue/component
	const BlockContainer = {
	  name: 'block-container',
	  props: {
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
	    deactivated: {
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
	  setup(props) {
	    const {
	      isOpen: isOpenContextMenu,
	      showContextMenu
	    } = ui_blockDiagram.useContextMenu(props.contextMenuItems);
	    const blockContainerClassNames = ui_vue3.computed(() => ({
	      [BLOCK_CONTAINER_CLASS_NAMES.base]: true,
	      [BLOCK_CONTAINER_CLASS_NAMES.highlighted]: props.highlighted,
	      [BLOCK_CONTAINER_CLASS_NAMES.deactivated]: props.deactivated,
	      [BLOCK_CONTAINER_CLASS_NAMES[props.colorName]]: true
	    }));
	    const blockContainerStyle = ui_vue3.computed(() => {
	      const style = {};
	      if (props.width !== null) {
	        style.width = `${props.width}px`;
	      }
	      if (props.height !== null) {
	        style.height = `${props.height}px`;
	      }
	      return style;
	    });
	    function onShowContextMenu(event) {
	      event.preventDefault();
	      if (props.disabled) {
	        return;
	      }
	      showContextMenu(event);
	    }
	    return {
	      isOpenContextMenu,
	      blockContainerClassNames,
	      blockContainerStyle,
	      onShowContextMenu
	    };
	  },
	  template: `
		<div
			:class="blockContainerClassNames"
			:style="blockContainerStyle"
			@contextmenu="onShowContextMenu"
		>
			<slot :isOpenContextMenu="isOpenContextMenu"/>
		</div>
	`
	};

	const ICON_BUTTON_CLASS_NAMES = {
	  base: 'editor-chart-icon-button',
	  disabled: '--disabled'
	};
	const ICON_CLASS_NAMES = {
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
	      default: 16
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
	      [ICON_CLASS_NAMES.base]: true,
	      [ICON_CLASS_NAMES.active]: ui_vue3.toValue(active)
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
	        var _this$button;
	        if (loading !== ((_this$button = this.button) == null ? void 0 : _this$button.isWaiting())) {
	          var _this$button2;
	          (_this$button2 = this.button) == null ? void 0 : _this$button2.setWaiting(loading);
	        }
	      },
	      immediate: true
	    }
	  },
	  created() {
	    const button = new ui_buttons.SplitButton({
	      id: this.id,
	      text: this.text,
	      useAirDesign: true,
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
	    var _this$button3;
	    const button = (_this$button3 = this.button) == null ? void 0 : _this$button3.render();
	    this.$refs.button.after(button);
	    this.isMounted = true;
	  },
	  unmounted() {
	    var _this$button4, _this$button4$getCont;
	    (_this$button4 = this.button) == null ? void 0 : (_this$button4$getCont = _this$button4.getContainer()) == null ? void 0 : _this$button4$getCont.remove();
	  },
	  template: `
		<button v-if="!isMounted" ref="button"></button>
	`
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
	const OFFSET_MORE_MENU_RIGHT = 15;
	const OFFSET_MORE_MENU_TOP = 10;

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
	    moreMenuItems: {
	      type: Array,
	      default: () => []
	    },
	    topMenuOpened: {
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
	    }
	  },
	  computed: {
	    activationIcon() {
	      return this.block.activity.Activated === 'Y' ? this.iconSet.PAUSE_L : this.iconSet.PLAY_L;
	    }
	  },
	  setup(props) {
	    const buttonMore = ui_vue3.useTemplateRef('buttonMore');
	    const slots = ui_vue3.useSlots();
	    const {
	      isOpen,
	      showContextMenu,
	      closeContextMenu
	    } = ui_blockDiagram.useContextMenu(props.moreMenuItems);
	    const isShowButtonMore = ui_vue3.computed(() => props.moreMenuItems.length > 0);
	    const topMenuClassNames = ui_vue3.computed(() => ({
	      [TOP_MENU_CLASS_NAMES.base]: true,
	      [TOP_MENU_CLASS_NAMES.show]: ui_vue3.toValue(isOpen) || props.topMenuOpened,
	      [TOP_MENU_CLASS_NAMES.hide]: props.dragged || props.resized
	    }));
	    const statusClassNames = ui_vue3.computed(() => ({
	      [STATUS_CLASS_NAMES.base]: true,
	      [STATUS_CLASS_NAMES.hide]: props.dragged || props.resized || !slots.status
	    }));
	    function onOpenMoreMenu() {
	      var _toValue$$el$getBound, _toValue, _toValue$$el;
	      const {
	        top = 0,
	        right = 0
	      } = (_toValue$$el$getBound = (_toValue = ui_vue3.toValue(buttonMore)) == null ? void 0 : (_toValue$$el = _toValue.$el) == null ? void 0 : _toValue$$el.getBoundingClientRect()) != null ? _toValue$$el$getBound : {};
	      showContextMenu({
	        clientX: right + OFFSET_MORE_MENU_RIGHT,
	        clientY: top - OFFSET_MORE_MENU_TOP
	      });
	    }
	    const onToggleBlockActivation = ui_vue3.inject('onToggleBlockActivation');
	    function handleIconClick() {
	      if (!onToggleBlockActivation) {
	        console.warn('onToggleBlockActivation is not provided');
	        return;
	      }
	      onToggleBlockActivation(props.block.id);
	    }
	    function onCloseMoreMenu() {
	      closeContextMenu();
	    }
	    return {
	      iconSet: ui_iconSet_api_vue.Outline,
	      isOpen,
	      isShowButtonMore,
	      topMenuClassNames,
	      statusClassNames,
	      onOpenMoreMenu,
	      onCloseMoreMenu,
	      handleIconClick
	    };
	  },
	  template: `
		<div
			class="editor-chart-block-layout"
			ref="editorBlockMenu"
			@mousedown="onCloseMoreMenu"
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
					<IconButton
						:icon-name="activationIcon"
						@click="handleIconClick"
					/>
					<IconButton
						v-if="isShowButtonMore"
						ref="buttonMore"
						:active="isOpen"
						:size="16"
						:icon-name="iconSet.MORE_L"
						@click="onOpenMoreMenu"
					/>
				</div>
			</div>
			<div class="editor-chart-block-layout__content">
				<slot/>
			</div>
			<div class="editor-chart-block-layout__left-content">
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
	const ICON_CLASS_NAMES$1 = {
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
	      [ICON_CLASS_NAMES$1.base]: true,
	      [ICON_CLASS_NAMES$1.on]: props.on
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
				:size="12"
				name="o-power" 
			/>
			<p class="editor-chart-block-switcher__label">
				{{ switcherLabel }}
			</p>
		</div>
	`
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
	    }
	  },
	  template: `
		<div class="editor-chart-block-header">
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
			<div class="editor-chart-block-header__title">{{ block.node?.title }}</div>
		</div>
	`
	};

	const ICON_CLASS_NAMES$2 = {
	  base: 'editor-chart-block-icon',
	  bgColor_1: '--background-color-1',
	  bgColor_2: '--background-color-2',
	  bgColor_3: '--background-color-3',
	  bgColor_4: '--background-color-4',
	  bgColor_5: '--background-color-5',
	  bgColor_6: '--background-color-6',
	  bgColor_7: '--background-color-7',
	  bgColor_8: '--background-color-8'
	};
	const ICON_COLORS = {
	  0: '#9C5CEF',
	  1: '#188AE6',
	  2: '#E08907',
	  3: '#8E96A2',
	  4: '#3CB811',
	  5: '#52BCBC',
	  6: '#B4B959',
	  7: '#FFFFFF'
	};
	const DEFAULT_ICON_NAME = ui_iconSet_api_vue.Outline.FILE;

	// @vue/component
	const BlockIcon = {
	  name: 'block-icon',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    iconName: {
	      type: String,
	      default: DEFAULT_ICON_NAME
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
	      default: 28
	    }
	  },
	  setup(props) {
	    const iconSet = ui_iconSet_api_vue.Outline;
	    const iconClassNames = ui_vue3.computed(() => ({
	      [ICON_CLASS_NAMES$2.base]: true,
	      [ICON_CLASS_NAMES$2.bgColor_1]: props.iconColorIndex === 0,
	      [ICON_CLASS_NAMES$2.bgColor_2]: props.iconColorIndex === 1,
	      [ICON_CLASS_NAMES$2.bgColor_3]: props.iconColorIndex === 2,
	      [ICON_CLASS_NAMES$2.bgColor_4]: props.iconColorIndex === 3,
	      [ICON_CLASS_NAMES$2.bgColor_5]: props.iconColorIndex === 4,
	      [ICON_CLASS_NAMES$2.bgColor_6]: props.iconColorIndex === 5,
	      [ICON_CLASS_NAMES$2.bgColor_7]: props.iconColorIndex === 6,
	      [ICON_CLASS_NAMES$2.bgColor_8]: props.iconColorIndex === 7
	    }));
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

	// @vue/component
	const PortsInOutCenter = {
	  name: 'PortsInOutCenter',
	  components: {
	    Port: ui_blockDiagram.Port
	  },
	  props: {
	    /** @type Block */
	    block: {
	      type: Object,
	      required: true
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    },
	    hideInputPorts: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup(props) {
	    const inPort = ui_vue3.computed(() => {
	      var _props$block$ports$in, _props$block$ports, _props$block$ports$in2;
	      if (props.hideInputPorts) {
	        return null;
	      }
	      return (_props$block$ports$in = (_props$block$ports = props.block.ports) == null ? void 0 : (_props$block$ports$in2 = _props$block$ports.input) == null ? void 0 : _props$block$ports$in2[0]) != null ? _props$block$ports$in : null;
	    });
	    const outPort = ui_vue3.computed(() => {
	      var _props$block$ports$ou, _props$block$ports2, _props$block$ports2$o;
	      return (_props$block$ports$ou = (_props$block$ports2 = props.block.ports) == null ? void 0 : (_props$block$ports2$o = _props$block$ports2.output) == null ? void 0 : _props$block$ports2$o[0]) != null ? _props$block$ports$ou : null;
	    });
	    const auxPort = ui_vue3.computed(() => {
	      var _props$block$ports$au, _props$block$ports3, _props$block$ports3$a;
	      return (_props$block$ports$au = (_props$block$ports3 = props.block.ports) == null ? void 0 : (_props$block$ports3$a = _props$block$ports3.aux) == null ? void 0 : _props$block$ports3$a[0]) != null ? _props$block$ports$au : null;
	    });
	    const topAuxPort = ui_vue3.computed(() => {
	      var _props$block$ports$to, _props$block$ports4, _props$block$ports4$t;
	      return (_props$block$ports$to = (_props$block$ports4 = props.block.ports) == null ? void 0 : (_props$block$ports4$t = _props$block$ports4.topAux) == null ? void 0 : _props$block$ports4$t[0]) != null ? _props$block$ports$to : null;
	    });
	    return {
	      inPort,
	      outPort,
	      auxPort,
	      topAuxPort,
	      validationInputOutputRule,
	      validationAuxRule,
	      normalyzeInputOutputConnection,
	      normalyzeAuxConnection
	    };
	  },
	  template: `
		<div class="editor-chart-ports-inout-center">
			<slot/>

			<div
				v-if="inPort"
				class="editor-chart-ports-inout-center__port --input"
			>
				<Port
					:block="block"
					:port="inPort"
					:disabled="disabled"
					:styled="false"
					:validationRules="[validationInputOutputRule]"
					:normalyzeConnectionFn="normalyzeInputOutputConnection"
					position="left"
				/>
			</div>

			<div
				v-if="outPort"
				class="editor-chart-ports-inout-center__port --output"
			>
				<Port
					:block="block"
					:port="outPort"
					:disabled="disabled"
					:styled="false"
					:validationRules="[validationInputOutputRule]"
					:normalyzeConnectionFn="normalyzeInputOutputConnection"
					position="right"
				/>
			</div>
			<div
				v-if="auxPort"
				class="editor-chart-ports-bottom-center__port --bottom"
			>
				<Port
					:block="block"
					:port="auxPort"
					:disabled="disabled"
					:styled="false"
					:validationRules="[validationAuxRule]"
					:normalyzeConnectionFn="normalyzeAuxConnection"
					position="bottom"
				/>
			</div>
			<div
				v-if="topAuxPort"
				class="editor-chart-ports-top-center__port --top"
			>
				<Port
					:block="block"
					:port="topAuxPort"
					:disabled="disabled"
					:styled="false"
					:validationRules="[validationAuxRule]"
					:normalyzeConnectionFn="normalyzeAuxConnection"
					position="top"
				/>
			</div>
		</div>
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
	const BlockComplexContent = {
	  name: 'block-complex',
	  components: {
	    Port: ui_blockDiagram.Port
	  },
	  props: {
	    /** @type Block */
	    block: {
	      type: Object,
	      required: true
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    const {
	      updatePortPosition
	    } = ui_blockDiagram.useBlockDiagram();
	    const {
	      getMessage
	    } = useLoc();
	    const {
	      isFeatureAvailable
	    } = useFeature();
	    return {
	      updatePortPosition,
	      getMessage,
	      isFeatureAvailable,
	      normalyzeInputOutputConnection,
	      validationInputOutputRule
	    };
	  },
	  computed: {
	    rulePorts() {
	      return this.block.ports.input.filter(port => !port.isConnectionPort);
	    },
	    connectionPorts() {
	      return this.block.ports.input.filter(port => port.isConnectionPort);
	    },
	    inputPortsLength() {
	      return this.block.ports.input.length;
	    },
	    outputPortsLength() {
	      return this.block.ports.output.length;
	    },
	    areConnectionsAvailable() {
	      return this.isFeatureAvailable(bizprocdesigner_feature.FeatureCode.complexNodeConnections) && this.connectionPorts.length > 0;
	    }
	  },
	  watch: {
	    inputPortsLength() {
	      this.$nextTick(() => {
	        this.block.ports.input.forEach(port => {
	          this.updatePortPosition(this.block.id, port.id);
	        });
	      });
	    },
	    outputPortsLength() {
	      this.$nextTick(() => {
	        this.block.ports.output.forEach(port => {
	          this.updatePortPosition(this.block.id, port.id);
	        });
	      });
	    }
	  },
	  template: `
		<div class="block-complex">
			<slot name="header" />
			<div class="block-complex__content">
				<div class="block-complex__content_row block-complex__content_rules">
					<div class="block-complex__content_col">
						<span class="block-complex__content_label">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE') }}
						</span>
						<div
							v-for="port in rulePorts"
							:key="port.id"
							class="block-complex__content_col-value"
						>
							<Port
								:block="block"
								:port="port"
								:disabled="disabled"
								:validationRules="[validationInputOutputRule]"
								:normalyzeConnectionFn="normalyzeInputOutputConnection"
								position="left"
							/>
							<span class="block-complex__content_col-value-text">{{ port.title }}</span>
						</div>
						<slot name="addPortPoint" position="left" />
					</div>
					<div class="block-complex__content_col --right">
						<span class="block-complex__content_label">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE') }}
						</span>
						<div
							v-for="port in block.ports.output"
							:key="port.id"
							class="block-complex__content_col-value"
						>
							<span class="block-complex__content_col-value-text">{{ port.title }}</span>
							<Port
								:block="block"
								:port="port"
								:disabled="disabled"
								:validationRules="[validationInputOutputRule]"
								:normalyzeConnectionFn="normalyzeInputOutputConnection"
								position="right"
							/>
						</div>
						<slot name="addPortPoint" position="right" />
					</div>
				</div>
				<div
					v-if="areConnectionsAvailable"
					class="block-complex__content_connections"
				>
					<span class="block-complex__content_label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_CONNECTIONS_TITLE') }}
					</span>
					<div class="block-complex__content_row">
						<div class="block-complex__content_col">
							<div
								v-for="port in connectionPorts"
								:key="port.id"
								class="block-complex__content_col-value"
							>
								<Port
									:block="block"
									:port="port"
									:disabled="disabled"
									position="left"
								/>
								<span class="block-complex__content_col-value-text">{{ port.title }}</span>
							</div>
							<slot name="addPortPoint" position="left" />
						</div>
						<div class="block-complex__content_col --right">
							<slot name="addPortPoint" position="right" />
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const BlockTopTitle = {
	  name: 'block-top-title',
	  props: {
	    title: {
	      type: String,
	      required: true
	    }
	  },
	  template: `
		<h3 class="editor-chart-block-top-title">{{ title }}</h3>
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
	        var _this$$refs, _this$$refs$editInput;
	        (_this$$refs = this.$refs) == null ? void 0 : (_this$$refs$editInput = _this$$refs.editInput) == null ? void 0 : _this$$refs$editInput.focus();
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
	const AutosaveStatus = {
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
	      if (dropdown && !(dropdown != null && dropdown.contains(event.target))) {
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

	const post$1 = async (action, data) => {
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
	    const data = await post$1('Activity.Complex.loadSettings', {
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
	    const data = await post$1('Activity.Complex.saveSettings', {
	      saveSettingsRequest: nodeSettingsPayload,
	      activity,
	      documentType
	    });
	    if (!(data != null && data.activity)) {
	      return null;
	    }
	    return data.activity;
	  },
	  saveRuleSettings: async (rule, documentType) => {
	    const data = await post$1('Activity.Complex.saveRule', {
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
	  var _fieldId, _store$template$found;
	  const store = diagramStore();
	  const {
	    object,
	    fieldId
	  } = field;
	  const makeTitle = (o, f) => [o, f].join(' / ');
	  const failoverTitle = makeTitle(object, fieldId);

	  /** @todo optimize this logic later */
	  if (!Object.values(FIELD_OBJECT_TYPES).includes(object)) {
	    var _foundActivity$Return, _foundActivity$Proper, _foundActivity$Proper2;
	    const [foundBlock, foundActivity] = (() => {
	      for (const block of connectedBlocks) {
	        const {
	          activity
	        } = block;
	        if ((activity == null ? void 0 : activity.Name) === object) {
	          return [block, activity];
	        }
	        if (!main_core.Type.isArrayFilled(activity == null ? void 0 : activity.Children)) {
	          continue;
	        }
	        const childrenActivity = activity.Children.find(child => {
	          return child.Name === object;
	        });
	        if (childrenActivity) {
	          return [block, childrenActivity];
	        }
	      }
	      return [null, null];
	    })();
	    if (!foundBlock || !foundActivity) {
	      return failoverTitle;
	    }
	    const foundProperty = ((_foundActivity$Return = foundActivity.ReturnProperties) != null ? _foundActivity$Return : []).find(prop => prop.Id === fieldId);
	    if (!foundProperty) {
	      return failoverTitle;
	    }
	    return makeTitle((_foundActivity$Proper = (_foundActivity$Proper2 = foundActivity.Properties) == null ? void 0 : _foundActivity$Proper2.Title) != null ? _foundActivity$Proper : foundBlock.node.title, foundProperty.Name);
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
	  const fieldName = (_fieldId = ((_store$template$found = store.template[foundObject.key]) != null ? _store$template$found : {})[fieldId]) == null ? void 0 : _fieldId.Name;
	  if (fieldName) {
	    return makeTitle(foundObject.title, fieldName);
	  }
	  return failoverTitle;
	};
	const evaluateActionExpressionDocumentTitle = (connectedBlocks, document) => {
	  var _foundActivity$Return2, _foundActivity$Proper3, _foundActivity$Proper4;
	  if (!document) {
	    return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_DOCUMENT');
	  }
	  const [object, fieldId] = document.replaceAll(/^{=|}$/g, '').split(':');
	  if (!main_core.Type.isStringFilled(object) || !main_core.Type.isStringFilled(fieldId)) {
	    return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_UNKNOWN_DOCUMENT');
	  }
	  const [foundBlock, foundActivity] = (() => {
	    for (const block of connectedBlocks) {
	      const {
	        activity
	      } = block;
	      if ((activity == null ? void 0 : activity.Name) === object) {
	        return [block, activity];
	      }
	      if (!main_core.Type.isArrayFilled(activity == null ? void 0 : activity.Children)) {
	        continue;
	      }
	      const childrenActivity = activity.Children.find(child => {
	        return child.Name === object;
	      });
	      if (childrenActivity) {
	        return [block, childrenActivity];
	      }
	    }
	    return [null, null];
	  })();
	  if (!foundActivity) {
	    return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_UNKNOWN_DOCUMENT');
	  }
	  const property = ((_foundActivity$Return2 = foundActivity.ReturnProperties) != null ? _foundActivity$Return2 : []).find(prop => prop.Id === fieldId);
	  if (!property) {
	    return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_UNKNOWN_DOCUMENT');
	  }
	  const objectTitle = (_foundActivity$Proper3 = (_foundActivity$Proper4 = foundActivity.Properties) == null ? void 0 : _foundActivity$Proper4.Title) != null ? _foundActivity$Proper3 : foundBlock.node.title;
	  return `${property.Name} (${objectTitle})`;
	};

	const useNodeSettingsStore = ui_vue3_pinia.defineStore('bizprocdesigner-editor-node-settings', {
	  state: () => ({
	    isLoading: false,
	    isSaving: false,
	    isShown: false,
	    isRuleSettingsShown: false,
	    currentRuleId: '',
	    prevSavedNodeSettings: null,
	    savedBlockInputPorts: null,
	    nodeSettings: null,
	    block: null
	  }),
	  actions: {
	    async fetchNodeSettings(block) {
	      this.nodeSettings = {
	        title: block.node.title,
	        description: '',
	        rules: new Map(),
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
	              var _ruleCard$constructio;
	              return ((_ruleCard$constructio = ruleCard.constructions) == null ? void 0 : _ruleCard$constructio.length) > 0;
	            })
	          }];
	        })),
	        fixedDocumentType,
	        description
	      };
	      this.prevSavedNodeSettings = main_core.Runtime.clone(this.nodeSettings);
	      this.savedBlockInputPorts = block.ports.input.map(port => {
	        return {
	          ...port
	        };
	      });
	      this.block = block;
	      this.isLoading = false;
	    },
	    isCurrentBlock(blockId) {
	      var _this$nodeSettings;
	      return ((_this$nodeSettings = this.nodeSettings) == null ? void 0 : _this$nodeSettings.blockId) === blockId;
	    },
	    reset() {
	      this.currentRuleId = '';
	      this.nodeSettings = null;
	      this.block = null;
	    },
	    toggleVisibility(isShown) {
	      this.isShown = isShown;
	    },
	    toggleRuleSettingsVisibility(isShown) {
	      this.isRuleSettingsShown = isShown;
	    },
	    setCurrentRuleId(ruleId) {
	      this.currentRuleId = ruleId;
	    },
	    addRule() {
	      const nextPortId = generateNextInputPortId(this.block.ports.input);
	      this.nodeSettings.rules.set(nextPortId, {
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
	      if (position) {
	        ruleCard.constructions.splice(position, 0, newConstruction);
	      } else {
	        ruleCard.constructions.push(newConstruction);
	      }
	    },
	    deleteConstruction(ruleCard, construction) {
	      ruleCard.constructions.splice(ruleCard.constructions.indexOf(construction), 1);
	      if (ruleCard.constructions.length === 0) {
	        this.deleteRuleCard(ruleCard);
	      }
	    },
	    deleteRuleSettings(ruleId) {
	      this.nodeSettings.rules.delete(ruleId);
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
	      const rule = this.nodeSettings.rules.get(this.currentRuleId);
	      rule.ruleCards.splice(rule.ruleCards.indexOf(ruleCard), 1);
	    },
	    addRuleCard() {
	      const rule = this.nodeSettings.rules.get(this.currentRuleId);
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
	      const rule = this.nodeSettings.rules.get(this.currentRuleId);
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
	        var _ruleCard$constructio2;
	        return ((_ruleCard$constructio2 = ruleCard.constructions) == null ? void 0 : _ruleCard$constructio2.length) > 0;
	      });
	      this.nodeSettings.rules.set(ruleId, transformedPortRule);
	      this.prevSavedNodeSettings.rules.set(ruleId, main_core.Runtime.clone(transformedPortRule));
	      return this.syncOutputPortsWithRules();
	    },
	    syncOutputPortsWithRules() {
	      if (!this.block) {
	        return null;
	      }
	      const outputConstructions = [...this.nodeSettings.rules.values()].flatMap(r => {
	        return r.ruleCards.flatMap(ruleCard => {
	          return ruleCard.constructions.filter(construction => construction.type === CONSTRUCTION_TYPES.OUTPUT);
	        });
	      });
	      const allExistingOutputPortIds = new Set(this.block.ports.output.map(port => port.id));
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
	      } = await this.savePortRule(this.currentRuleId, documentType);
	      this.toggleRuleSettingsVisibility(false);
	      return {
	        outputPortsToAdd,
	        outputPortsToDelete
	      };
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
	        rules: prevSavedRules
	      } = this.prevSavedNodeSettings;
	      if (!prevSavedRules.has(this.currentRuleId)) {
	        const currentRule = this.nodeSettings.rules.get(this.currentRuleId);
	        currentRule.isFilled = false;
	        currentRule.ruleCards = [];
	        return;
	      }
	      const copyRule = main_core.Runtime.clone(prevSavedRules.get(this.currentRuleId));
	      this.nodeSettings.rules.set(this.currentRuleId, copyRule);
	    },
	    updateSettings(settings) {
	      this.nodeSettings = {
	        ...this.nodeSettings,
	        ...settings
	      };
	    }
	  }
	});

	// @vue/component
	const NodeSettingsLayout = {
	  name: 'node-settings-layout',
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
			class="node-settings"
			:class="{ '--saving': isSaving, '--loading': isLoading }"
		>
			<template v-if="!isLoading">
				<div class="node-settings__header">
					<span>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TITLE') }}</span>
					<BIcon
						class="node-settings__header_close-icon"
						name="cross-m"
						:size="20"
						:data-test-id="$testId('complexNodeSettingsClose')"
						color="#828b95"
						@click="$emit('close')"
					/>
				</div>
				<slot />
			</template>
			<div class="node-settings__footer">
				<slot
					v-if="!isLoading"
					name="actions"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const NodeSettingsVariable = {
	  name: 'node-settings-variable',
	  props: {
	    variableName: {
	      type: String,
	      required: true
	    },
	    variableValue: {
	      type: String,
	      required: true
	    }
	  },
	  template: `
		<div class="node-settings-variable">
			<span class="node-settings-variable_name">
				{{ variableName }}
			</span>
			<span class="node-settings-variable_eq">=</span>
			<span class="node-settings-variable_value">
				{{ variableValue }}
			</span>
		</div>
	`
	};

	// @vue/component
	const NodeSettingsRule = {
	  name: 'node-settings-rule',
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
	    /** @type Block */
	    connectedBlocks: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['showRuleConstructions', 'deleteRule'],
	  setup() {
	    const {
	      getMessage
	    } = useLoc();
	    return {
	      getMessage
	    };
	  },
	  computed: {
	    ruleId() {
	      return this.port.id;
	    },
	    rule() {
	      return this.nodeSettings.rules.get(this.ruleId);
	    },
	    isRuleFilled() {
	      var _this$rule;
	      return (_this$rule = this.rule) == null ? void 0 : _this$rule.isFilled;
	    },
	    constructionLabels() {
	      return CONSTRUCTION_LABELS;
	    },
	    constructionOperators() {
	      return CONSTRUCTION_OPERATORS;
	    },
	    generalConstructionTypes() {
	      return GENERAL_CONSTRUCTION_TYPES;
	    }
	  },
	  methods: {
	    onRuleClick() {
	      this.$emit('showRuleConstructions', this.ruleId);
	    },
	    onDeleteRule() {
	      this.$emit('deleteRule', this.ruleId);
	    },
	    getExpressionTitle({
	      expression,
	      type
	    }) {
	      const {
	        actions
	      } = this.nodeSettings;
	      if (type === GENERAL_CONSTRUCTION_TYPES.action) {
	        if (!expression.actionId) {
	          return '';
	        }
	        return actions.get(expression.actionId).title;
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
			class="node-settings-rule"
			:data-test-id="$testId('complexNodeSettingsRulePreview', ruleId)"
			@click="onRuleClick"
		>
			<BIcon
				class="node-settings-rule__dnd-icon"
				name="drag-s"
				color="#828b95"
			/>
			<span class="node-settings-rule__title">
				{{ port.title }}
			</span>
			<div
				v-if="isRuleFilled"
				class="node-settings-rule__card-container"
			>
				<div
					v-for="ruleCard in rule.ruleCards"
					:key="ruleCard.id"
					class="node-settings-rule__card"
				>
					<div
						v-for="construction in ruleCard.constructions"
						:key="construction.id"
						class="node-settings-rule__construction"
						:class="['--' + generalConstructionTypes[construction.type]]"
					>
						<span class="node-settings-rule__construction_type">
							{{ getMessage(constructionLabels[construction.type]) }}
						</span>
						<span class="node-settings-rule__expression-part">
							{{ getExpressionTitle(construction) }}
						</span>
						<span
							v-if="construction.expression.operator"
							class="node-settings-rule__expression-part"
						>
							{{ constructionOperators[construction.expression.operator] }}
						</span>
						<span
							v-if="generalConstructionTypes[construction.type] !== generalConstructionTypes.action"
							class="node-settings-rule__expression-part"
						>
							{{ getExpressionValue(construction) }}
						</span>
					</div>
				</div>
			</div>
			<span
				class="node-settings-rule__construction --empty"
				v-else
			>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY') }}
			</span>
			<div class="node-settings-rule__actions">
				<BIcon
					:size="20"
					class="node-settings-rule__edit-icon"
					name="pencil-40"
					color="#c9ccd0"
				/>
				<BIcon
					class="node-settings-rule__close-icon"
					name="cross-m"
					:size="20"
					:data-test-id="$testId('complexNodeSettingsRulePreview', ruleId, 'delete')"
					color="#c9ccd0"
					@click.stop="onDeleteRule"
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
	    top: '-100%'
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
	  name: 'node-settings-rules-layout',
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
	    currentRuleId: {
	      type: String,
	      required: true
	    },
	    isSaving: {
	      type: Boolean,
	      required: true
	    },
	    isRuleSettingsShown: {
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
	      var _this$nodeSettings$ru, _this$nodeSettings$ru2;
	      return (_this$nodeSettings$ru = (_this$nodeSettings$ru2 = this.nodeSettings.rules.get(this.currentRuleId)) == null ? void 0 : _this$nodeSettings$ru2.ruleCards) != null ? _this$nodeSettings$ru : [];
	    }
	  },
	  methods: {
	    onDrop(payload) {
	      this.$emit('drop', payload);
	    }
	  },
	  template: `
		<transition-group name="slide-rule-panel">
			<div
				v-if="isRuleSettingsShown"
				class="node-settings-rules-panel"
				:class="{ '--saving': isSaving }"
			>
				<div class="node-settings-rules-panel__header">
					<BIcon
						:size="20"
						:data-test-id="$testId('complexNodeRuleSettingsClose')"
						name="arrow-left-l"
						color="#828b95"
						class="node-settings-rules-panel__header_back"
						@click="$emit('close')"
					/>
					<span class="node-settings-rules-panel__header_label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULES_LAYOUT_TITLE') }}
					</span>
					<slot name="rules-dropdown" />
					<!--
					<BIcon
						:size="20"
						name="o-question"
						color="#a8adb4"
						class="node-settings-rules-panel__header_question"
					/>
					-->
				</div>
				<div
					class="node-settings-rules-panel__content"
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
				<div class="node-settings-rules-panel__footer">
					<slot name="actions" />
				</div>
			</div>
			<div
				v-if="isRuleSettingsShown"
				class="node-settings-rules-layout__back"
			></div>
		</transition-group>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const RuleCard = {
	  name: 'rule-card',
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
			class="rule-card"
			:data-id="ruleCard.id"
		>
			<div class="rule-card__top">
				<BIcon
					name="drag-s"
					class="rule-card__dnd-icon"
					draggable="true"
					:color="iconColor"
				/>
				<slot name="deleteRuleCard" />
				<!--
				<div class="rule-card__top_delimeter"></div>
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
	  standard: 'standard',
	  expert: 'expert'
	};
	const ICON_COLORS$1 = {
	  condition: '#b7d7ff',
	  action: '#4de39e',
	  output: '#d5d7db'
	};

	// @vue/component
	const RuleConstruction = {
	  name: 'rule-construction',
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
	    const сonstructionModes = Object.freeze({
	      standard: getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_STANDARD_MODE'),
	      expert: getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_EXPERT_MODE')
	    });
	    return {
	      getMessage,
	      сonstructionModes
	    };
	  },
	  data() {
	    return {
	      selectedMode: RULE_CONSTRUCTION_MODES.expert
	    };
	  },
	  computed: {
	    constractionClassName() {
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
			class="rule-construction"
			:class="constractionClassName"
			:data-id="construction.id"
			:data-rule-card-id="ruleCardId"
		>
			<div class="rule-construction__operator">
				<slot
					v-if="isBooleanType"
					name="booleanTypeSwitcher"
				/>
				<span
					v-else
					class="rule-construction__operator_label"
				>
					{{ parsedMessage }}
				</span>
				<slot
					v-if="position > 0"
					name="addConstructionButton"
				/>
			</div>
			<div class="rule-construction__content">
				<div class="rule-construction__content_top">
					<BIcon
						:size="20"
						:color="iconColor"
						class="rule-construction__dnd-icon"
						name="drag-s"
						draggable="true"
					/>
					<!--
					<div
						v-if="generalConstructionTypes[construction.type] === generalConstructionTypes.action"
						class="rule-construction__content_mode"
					>
						<span
							v-for="(label, mode) in сonstructionModes"
							class="rule-construction__content_mode-text"
							:class="{ '--selected': selectedMode === mode }"
							@click="selectedMode = mode"
						>
							{{ label }}
						</span>
					</div>
					-->
					<slot
						name="deleteConstructionButton"
						:iconColor="iconColor"
					/>
				</div>
				<div class="rule-construction__expression-form">
					<slot
						:name="generalConstructionTypes[construction.type]"
						:isExpertMode="isExpertMode"
					/>
				</div>
			</div>
		</div>
	`
	};

	const useAppStore = ui_vue3_pinia.defineStore('bizprocdesigner-app-store', {
	  state: () => ({
	    isShownRightPanel: false,
	    isShownPreviewPanel: false
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
	  shifted: '--shifted'
	};

	// @vue/component
	const AppLayout = {
	  name: 'AppLayout',
	  props: {
	    showSettings: {
	      type: Boolean,
	      default: false
	    },
	    showPreviewPanel: {
	      type: Boolean,
	      default: false
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
	        [BOTTOM_RIGHT_TOOLBAR_CLASSNAMES.shifted]: this.showSettings
	      };
	    },
	    settingsClassNames() {
	      return {
	        [SETTINGS_PANEL_CLASSNAMES.base]: true,
	        [SETTINGS_PANEL_CLASSNAMES.withPreviewPanel]: this.showPreviewPanel
	      };
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
	const AppHeader = {
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

	// @vue/component
	const EditNodeSettingsForm = {
	  name: 'edit-node-settings-form',
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
	    }
	  },
	  emits: ['updateTitle', 'updateDescription'],
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
	  data() {
	    return {
	      activationMenuHelper: null
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings']),
	    iconName() {
	      var _Outline$this$block$n, _this$block, _this$block$node;
	      return (_Outline$this$block$n = ui_iconSet_api_vue.Outline[(_this$block = this.block) == null ? void 0 : (_this$block$node = _this$block.node) == null ? void 0 : _this$block$node.icon]) != null ? _Outline$this$block$n : ui_iconSet_api_vue.Outline.FILE;
	    },
	    rulePorts() {
	      return this.block.ports.input.filter(port => !port.isConnectionPort);
	    },
	    areConnectionsAvailable() {
	      return this.isFeatureAvailable(bizprocdesigner_feature.FeatureCode.complexNodeConnections);
	    },
	    isSubIcon() {
	      var _this$block$node2, _this$block$node3;
	      return ((_this$block$node2 = this.block.node) == null ? void 0 : _this$block$node2.type) === BLOCK_TYPES.TOOL && ((_this$block$node3 = this.block.node) == null ? void 0 : _this$block$node3.icon) && ui_iconSet_api_vue.Outline[this.block.node.icon] !== ui_iconSet_api_vue.Outline.DATABASE;
	    },
	    activationIcon() {
	      return this.block.activity.Activated === 'Y' ? this.iconSet.PAUSE_L : this.iconSet.PLAY_L;
	    },
	    icon() {
	      var _this$block$node4, _this$block$node5;
	      if (((_this$block$node4 = this.block.node) == null ? void 0 : _this$block$node4.type) === BLOCK_TYPES.TOOL) {
	        const mcpLettersKey = 'MCP_LETTERS';
	        return ui_iconSet_api_vue.Outline[this.block.node.icon] === ui_iconSet_api_vue.Outline.DATABASE ? this.block.node.icon : mcpLettersKey;
	      }
	      return (_this$block$node5 = this.block.node) == null ? void 0 : _this$block$node5.icon;
	    },
	    colorIndex() {
	      var _this$block$node6, _this$block$node7;
	      return ((_this$block$node6 = this.block.node) == null ? void 0 : _this$block$node6.type) === BLOCK_TYPES.TOOL ? 0 : (_this$block$node7 = this.block.node) == null ? void 0 : _this$block$node7.colorIndex;
	    }
	  },
	  created() {
	    this.activationMenuHelper = useActivationMenu(this.store);
	  },
	  methods: {
	    onChangeTitle({
	      target: {
	        value: title
	      }
	    }) {
	      this.$emit('updateTitle', title);
	    },
	    onChangeDescription({
	      target: {
	        value: description
	      }
	    }) {
	      this.$emit('updateDescription', description);
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
	    showActivationMenu(event) {
	      this.activationMenuHelper.showActivationMenu(event, this.block);
	    }
	  },
	  template: `
		<div class="node-settings-form">
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
					@click="showActivationMenu"
				/>
			</div>
			<div class="node-settings-form__section-delimeter"></div>
			<div class="node-settings-form__section">
				<div>
					<span class="node-settings-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_LABEL') }}
					</span>
					<div class="ui-ctl ui-ctl-textbox node-settings-form__node-name-input">
						<input type="text"
							class="ui-ctl-element"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER')"
							:value="block.node.title"
							:data-test-id="$testId('complexNodeName')"
							@input="onChangeTitle"
						/>
					</div>
				</div>
				<div class="node-settings-form__node-description">
					<span class="node-settings-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_LABEL') }}
					</span>
					<div class="ui-ctl ui-ctl-textarea node-settings-form__node-description_textarea">
						<textarea
							rows="1"
							class="ui-ctl-element"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER')"
							:value="nodeSettings.description"
							:data-test-id="$testId('complexNodeDescription')"
							@input="onChangeDescription"
						></textarea>
					</div>
					<p class="node-settings-form__node-description_text">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_TEXT') }}
					</p>
				</div>
			</div>
			<div class="node-settings-form__section-delimeter"></div>
			<div
				class="node-settings-form__section --data"
				ref="node-settings-form-data-section"
			>
				<!--
				<span
					class="node-settings-form__section-title"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_SECTION_TITLE') }}
				</span>
				-->
				<slot
					v-for="[variableName, variableValue] in nodeSettings.variables"
					:key="variableName"
					:variableName="variableName"
					:variableValue="variableValue"
					name="variable"
				/>
				<slot name="addElement" itemType="element" />
			</div>
			<div class="node-settings-form__section">
				<p class="node-settings-form__section-title">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE') }}
				</p>
				<slot
					v-for="port in rulePorts"
					:key="port.id"
					:port="port"
					name="rule"
				/>
				<slot name="addRule" itemType="rule" />
			</div>
			<div
				v-if="areConnectionsAvailable"
				class="node-settings-form__section"
			>
				<p class="node-settings-form__section-title">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONNECTION_SECTION_TITLE') }}
				</p>
				<slot name="addConnection" itemType="connection" />
			</div>
		</div>
	`
	};

	// @vue/component
	const AddSettingsItem = {
	  name: 'add-settings-item',
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
	      rule: () => store.addRule(),
	      connection: () => generateNextInputPortId(store.block.ports.input)
	    };
	    return {
	      getMessage,
	      actions
	    };
	  },
	  methods: {
	    onClick() {
	      const itemId = this.actions[this.itemType]();
	      this.$emit('addItem', itemId);
	    }
	  },
	  template: `
		<div
			class="node-settings-add-item-button"
			:data-test-id="$testId('complexNodeSettingsAdd', itemType)"
			@click="onClick"
		>
			<BIcon
				class="node-settings-add-item-button__plus"
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

	const CurrentDocumentId = '@';
	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _currentPortId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentPortId");
	var _currentBlock = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentBlock");
	var _fixedDocumentType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fixedDocumentType");
	var _getTabs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTabs");
	var _getReturnValue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getReturnValue");
	var _getEntities = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEntities");
	var _processChildrenProperties = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processChildrenProperties");
	var _processReturnProperties = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processReturnProperties");
	var _getDocuments = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDocuments");
	class DocumentSelector {
	  constructor(currentBlock, currentPortId = null, fixedDocumentType = null) {
	    Object.defineProperty(this, _getDocuments, {
	      value: _getDocuments2
	    });
	    Object.defineProperty(this, _processReturnProperties, {
	      value: _processReturnProperties2
	    });
	    Object.defineProperty(this, _processChildrenProperties, {
	      value: _processChildrenProperties2
	    });
	    Object.defineProperty(this, _getEntities, {
	      value: _getEntities2
	    });
	    Object.defineProperty(this, _getReturnValue, {
	      value: _getReturnValue2
	    });
	    Object.defineProperty(this, _getTabs, {
	      value: _getTabs2
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _currentPortId, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _currentBlock, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _fixedDocumentType, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = diagramStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _currentBlock)[_currentBlock] = currentBlock;
	    babelHelpers.classPrivateFieldLooseBase(this, _currentPortId)[_currentPortId] = currentPortId;
	    babelHelpers.classPrivateFieldLooseBase(this, _fixedDocumentType)[_fixedDocumentType] = fixedDocumentType;
	  }
	  show(target) {
	    const documentItems = [{
	      id: CurrentDocumentId,
	      entityId: 'bizproc-document',
	      entityType: 'document',
	      title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_DOCUMENT'),
	      nodeOptions: {
	        open: false,
	        dynamic: false
	      },
	      tabs: 'documents'
	    }, ...babelHelpers.classPrivateFieldLooseBase(this, _getDocuments)[_getDocuments]()];
	    return new Promise(resolve => {
	      const dialog = new ui_entitySelector.Dialog({
	        targetNode: target,
	        width: 500,
	        height: 300,
	        multiple: false,
	        dropdownMode: true,
	        enableSearch: true,
	        items: documentItems,
	        tabs: babelHelpers.classPrivateFieldLooseBase(this, _getTabs)[_getTabs](),
	        entities: babelHelpers.classPrivateFieldLooseBase(this, _getEntities)[_getEntities](),
	        cacheable: false,
	        showAvatars: false,
	        events: {
	          'Item:onSelect': event => {
	            resolve(babelHelpers.classPrivateFieldLooseBase(this, _getReturnValue)[_getReturnValue](event.getData().item));
	          }
	        },
	        compactView: true
	      });
	      dialog.show();
	    });
	  }
	}
	function _getTabs2() {
	  return [{
	    id: 'documents',
	    title: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT_MULTIPLE'),
	    icon: 'elements'
	  }];
	}
	function _getReturnValue2(item) {
	  return item.getId() === CurrentDocumentId ? null : item.getId();
	}
	function _getEntities2() {
	  return [{
	    id: 'bizproc-document'
	  }];
	}
	function _processChildrenProperties2(block) {
	  const childrenProperties = [];
	  block.activity.Children.forEach(activity => {
	    if (main_core.Type.isArrayFilled(activity.ReturnProperties)) {
	      const properties = babelHelpers.classPrivateFieldLooseBase(this, _processReturnProperties)[_processReturnProperties]({
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
	      tabs: 'documents',
	      title: block.activity.Properties.Title,
	      children: childrenProperties,
	      searchable: false
	    });
	  }
	  return properties;
	}
	function _processReturnProperties2(block) {
	  const properties = [];
	  block.activity.ReturnProperties.filter(property => {
	    if (property.Type !== 'document') {
	      return false;
	    }
	    if (!main_core.Type.isArrayFilled(property.Default)) {
	      return true;
	    }
	    if (!main_core.Type.isArrayFilled(babelHelpers.classPrivateFieldLooseBase(this, _fixedDocumentType)[_fixedDocumentType])) {
	      return true;
	    }
	    return JSON.stringify(property.Default) === JSON.stringify(babelHelpers.classPrivateFieldLooseBase(this, _fixedDocumentType)[_fixedDocumentType]);
	  }).forEach(property => {
	    const id = `{=${block.id}:${property.Id}}`;
	    properties.push({
	      id,
	      entityId: 'bizproc-document',
	      entityType: 'document',
	      title: `${property.Name} (${block.activity.Properties.Title})`,
	      nodeOptions: {
	        open: false,
	        dynamic: false
	      },
	      tabs: 'documents'
	    });
	  });
	  return properties;
	}
	function _getDocuments2() {
	  const blocks = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getAllBlockAncestors(babelHelpers.classPrivateFieldLooseBase(this, _currentBlock)[_currentBlock], babelHelpers.classPrivateFieldLooseBase(this, _currentPortId)[_currentPortId]);
	  return blocks.reduce((acc, block) => {
	    if (main_core.Type.isArrayFilled(block.activity.Children)) {
	      const properties = babelHelpers.classPrivateFieldLooseBase(this, _processChildrenProperties)[_processChildrenProperties](block);
	      if (main_core.Type.isArrayFilled(properties)) {
	        acc.push(...properties);
	      }
	    }
	    if (main_core.Type.isArrayFilled(block.activity.ReturnProperties)) {
	      const properties = babelHelpers.classPrivateFieldLooseBase(this, _processReturnProperties)[_processReturnProperties](block);
	      if (main_core.Type.isArrayFilled(properties)) {
	        acc.push(...properties);
	      }
	    }
	    return acc;
	  }, []);
	}

	// @vue/component
	const EditActionExpression = {
	  name: 'edit-action-expression',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
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
	      isExpanded: true
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRuleId']),
	    connectedBlocks() {
	      /** @todo Get rid of store usage here */
	      const store = diagramStore();
	      return store.getAllBlockAncestors(this.block, this.currentRuleId);
	    },
	    selectedAction() {
	      return this.nodeSettings.actions.get(this.selectedActionId);
	    },
	    selectedActionId: {
	      get() {
	        var _this$construction$ex;
	        return (_this$construction$ex = this.construction.expression.actionId) != null ? _this$construction$ex : '';
	      },
	      set(actionId) {
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
	      var _action$title;
	      const action = this.nodeSettings.actions.get(this.selectedActionId);
	      return (_action$title = action == null ? void 0 : action.title) != null ? _action$title : this.notSelectedMessage;
	    },
	    selectedDocument: {
	      get() {
	        return this.construction.expression.document;
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
	      const selector = new DocumentSelector(this.block, this.currentRuleId, this.nodeSettings.fixedDocumentType);
	      void selector.show(event.target).then(document => {
	        this.selectedDocument = document;
	      });
	    }
	  },
	  template: `
		<div class="edit-action-expression-form">
			<div class="edit-action-expression-form__item">
				<span class="edit-action-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_EXPRESSION_NAME') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-action-expression-form__dropdown"
					@click="onShowMenu"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ currentActionTitle }}
					</div>
				</div>
			</div>
			<div v-if="selectedAction && selectedAction.handlesDocument"
				 class="edit-action-expression-form__item"
			>
				<span class="edit-action-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT') }}
				</span>
				<div
					 class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-action-expression-form__dropdown"
					 @click="onChooseDocument"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ selectedDocumentTitle }}
					</div>
				</div>
			</div>
			<div class="edit-action-expression-form__item">
				<div
					v-if="selectedActionId"
					class="edit-action-expression-form__label"
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
					class="edit-action-expression-form__settings node-settings-panel"
				>
					<slot
						:actionId="selectedActionId"
						:activityData="actionValue"
					/>
				</div>
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
	      var _this$block;
	      return ((_this$block = this.block) == null ? void 0 : _this$block.id) === blockId;
	    },
	    showSettings(block) {
	      this.block = block;
	    },
	    hideSettings() {
	      this.block = null;
	    }
	  }
	});

	var _getEntities$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEntities");
	var _getTabs$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTabs");
	var _getValue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getValue");
	var _getItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getItems");
	var _addDocumentItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addDocumentItem");
	var _processChildrenProperties$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processChildrenProperties");
	var _processReturnProperties$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processReturnProperties");
	class ValueSelector {
	  constructor(store, currentBlock, currentPortId = null) {
	    Object.defineProperty(this, _processReturnProperties$1, {
	      value: _processReturnProperties2$1
	    });
	    Object.defineProperty(this, _processChildrenProperties$1, {
	      value: _processChildrenProperties2$1
	    });
	    Object.defineProperty(this, _addDocumentItem, {
	      value: _addDocumentItem2
	    });
	    Object.defineProperty(this, _getItems, {
	      value: _getItems2
	    });
	    Object.defineProperty(this, _getValue, {
	      value: _getValue2
	    });
	    Object.defineProperty(this, _getTabs$1, {
	      value: _getTabs2$1
	    });
	    Object.defineProperty(this, _getEntities$1, {
	      value: _getEntities2$1
	    });
	    this.currentPortId = null;
	    this.store = store;
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
	        items: babelHelpers.classPrivateFieldLooseBase(this, _getItems)[_getItems](),
	        tabs: babelHelpers.classPrivateFieldLooseBase(this, _getTabs$1)[_getTabs$1](),
	        entities: babelHelpers.classPrivateFieldLooseBase(this, _getEntities$1)[_getEntities$1](),
	        cacheable: false,
	        showAvatars: false,
	        events: {
	          'Item:onSelect': event => {
	            resolve(babelHelpers.classPrivateFieldLooseBase(this, _getValue)[_getValue](event.getData().item));
	          }
	        },
	        compactView: true
	      });
	      dialog.show();
	    });
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
	            title: item.Name
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
	        const properties = babelHelpers.classPrivateFieldLooseBase(this, _processChildrenProperties$1)[_processChildrenProperties$1](block);
	        if (main_core.Type.isArrayFilled(properties)) {
	          acc.push(...properties);
	        }
	      }
	      if (main_core.Type.isArrayFilled(block.activity.ReturnProperties)) {
	        const properties = babelHelpers.classPrivateFieldLooseBase(this, _processReturnProperties$1)[_processReturnProperties$1](block);
	        if (main_core.Type.isArrayFilled(properties)) {
	          acc.push(...properties);
	        }
	      }
	      return acc;
	    }, []);
	  }
	}
	function _getEntities2$1() {
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
	function _getTabs2$1() {
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
	function _getValue2(item) {
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
	function _getItems2() {
	  const items = this.getReturnItems();
	  babelHelpers.classPrivateFieldLooseBase(this, _addDocumentItem)[_addDocumentItem](items);
	  this.addTemplateItems(items);
	  return items;
	}
	function _addDocumentItem2(items) {
	  // compatible document
	  items.push({
	    id: 'template-document',
	    entityId: 'bizproc-document',
	    entityType: 'document',
	    title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_DOCUMENT_FIELDS'),
	    customData: {
	      document: this.store.documentType,
	      idTemplate: '{{ #FIELD_NAME# }}',
	      supertitle: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_DOCUMENT_FIELDS')
	    },
	    tabs: ['documents'],
	    nodeOptions: {
	      open: false,
	      dynamic: true
	    }
	  });
	}
	function _processChildrenProperties2$1(block) {
	  const childrenProperties = [];
	  block.activity.Children.forEach(activity => {
	    if (main_core.Type.isArrayFilled(activity.ReturnProperties)) {
	      const properties = babelHelpers.classPrivateFieldLooseBase(this, _processReturnProperties$1)[_processReturnProperties$1]({
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
	function _processReturnProperties2$1(block) {
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
	      res.properties.push({
	        id,
	        entityId: 'block-node-property',
	        title: property.Name,
	        property,
	        block
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

	let _$1 = t => t,
	  _t$1,
	  _t2,
	  _t3,
	  _t4;

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
	      isVisible: false,
	      hasErrors: false,
	      isSubmitting: false,
	      hasSettings: false,
	      useDocumentContext: false,
	      settingsForm: null,
	      nodeControls: null,
	      inputListeners: [],
	      shouldShowWithTransition: false,
	      activationMenuHelper: null
	    };
	  },
	  computed: {
	    icon() {
	      var _this$block$node, _this$block$node2;
	      if (((_this$block$node = this.block.node) == null ? void 0 : _this$block$node.type) === BLOCK_TYPES.TOOL) {
	        const mcpLettersKey = 'MCP_LETTERS';
	        return ui_iconSet_api_vue.Outline[this.block.node.icon] === ui_iconSet_api_vue.Outline.DATABASE ? this.block.node.icon : mcpLettersKey;
	      }
	      return (_this$block$node2 = this.block.node) == null ? void 0 : _this$block$node2.icon;
	    },
	    colorIndex() {
	      var _this$block$node3, _this$block$node4;
	      return ((_this$block$node3 = this.block.node) == null ? void 0 : _this$block$node3.type) === BLOCK_TYPES.TOOL ? 0 : (_this$block$node4 = this.block.node) == null ? void 0 : _this$block$node4.colorIndex;
	    },
	    isSubIcon() {
	      var _this$block$node5, _this$block$node6;
	      return ((_this$block$node5 = this.block.node) == null ? void 0 : _this$block$node5.type) === BLOCK_TYPES.TOOL && ((_this$block$node6 = this.block.node) == null ? void 0 : _this$block$node6.icon) && ui_iconSet_api_vue.Outline[this.block.node.icon] !== ui_iconSet_api_vue.Outline.DATABASE;
	    },
	    activationIcon() {
	      return this.block.activity.Activated === 'Y' ? this.iconSet.PAUSE_L : this.iconSet.PLAY_L;
	    }
	  },
	  async mounted() {
	    this.isVisible = true;
	    this.currentBlock = this.block;
	    await this.$nextTick();
	    await this.renderControls();
	    main_core.Event.bind(document, 'mousedown', this.multiSelectMouseHandler);
	    main_core_events.EventEmitter.subscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
	    window.BPAShowSelector = this.showSelector;
	    window.HideShow = this.hideShow;
	  },
	  unmounted() {
	    if (this.inputListeners && this.handleFieldInput) {
	      this.inputListeners.forEach(input => {
	        main_core.Event.unbind(input, 'input', this.handleFieldInput);
	      });
	      this.inputListeners = [];
	    }
	    main_core.Event.unbind(document, 'mousedown', this.multiSelectMouseHandler);
	    main_core_events.EventEmitter.unsubscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
	    main_core_events.EventEmitter.emit('BX.Bizproc.Activity.unmount');
	    // console.log('UNMOUNT');
	  },

	  created() {
	    this.activationMenuHelper = useActivationMenu(this.store);
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    multiSelectMouseHandler(event) {
	      if (!event.isTrusted || event.button !== 0) {
	        return;
	      }
	      const opt = event.target;
	      const select = opt.parentElement;
	      if (opt.tagName === 'OPTION' && select != null && select.multiple) {
	        event.preventDefault();
	        const scroll = select.scrollTop;
	        opt.selected = !opt.selected;
	        setTimeout(() => select.scrollTop = scroll, 0);
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
	      window.BPAShowSelector = this.showSelector;
	      window.HideShow = this.hideShow;
	    },
	    extractFormData(form) {
	      var _this$currentBlock$ac, _this$currentBlock$ac2, _this$currentBlock$ac3, _this$currentBlock$ac4;
	      const formData = main_core.ajax.prepareForm(form).data;
	      formData.documentType = this.documentType;
	      formData.activityType = (_this$currentBlock$ac = (_this$currentBlock$ac2 = this.currentBlock.activity) == null ? void 0 : _this$currentBlock$ac2.Type) != null ? _this$currentBlock$ac : '';
	      formData.id = (_this$currentBlock$ac3 = (_this$currentBlock$ac4 = this.currentBlock.activity) == null ? void 0 : _this$currentBlock$ac4.Name) != null ? _this$currentBlock$ac3 : '';
	      formData.arWorkflowTemplate = JSON.stringify([this.currentBlock.activity]);
	      return formData;
	    },
	    async submitForm(formData) {
	      this.isSubmitting = true;
	      try {
	        var _this$store$template$;
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
	        preparedSettingsData.arWorkflowConstants = JSON.stringify((_this$store$template$ = this.store.template.CONSTANTS) != null ? _this$store$template$ : {});
	        const compatibleTemplate = [{
	          Type: 'NodeWorkflowActivity',
	          Children: [],
	          Name: 'Template'
	        }];
	        compatibleTemplate[0].Children.push(this.currentBlock.activity, ...this.store.getAllBlockAncestors(this.currentBlock).map(b => b.activity));
	        preparedSettingsData.arWorkflowTemplate = JSON.stringify(compatibleTemplate);
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
	      var _this$currentBlock$ac5, _this$currentBlock$ac6;
	      const documents = [{
	        id: '@',
	        text: main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_DOCUMENT')
	      }, ...this.getDocuments()];
	      const selectedDocument = (_this$currentBlock$ac5 = (_this$currentBlock$ac6 = this.currentBlock.activity) == null ? void 0 : _this$currentBlock$ac6.Document) != null ? _this$currentBlock$ac5 : '@';
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
	      const error = main_core.Tag.render(_t$1 || (_t$1 = _$1`
				<div class="node-settings-alert-text">
					${0}
				</div>
			`), this.loc('BIZPROCDESIGNER_EDITOR_REQUIRED_FIELD_ERROR', {
	        '#FIELD#': field.property.Name
	      }));
	      main_core.Dom.append(error, control.parentNode);
	      let className = 'node-settings-edit-box';
	      if (field.property.Hidden) {
	        className += ' hidden';
	      }
	      return main_core.Tag.render(_t2 || (_t2 = _$1`
				<div class="${0}" id="row_${0}">
				    <div class="node-settings-edit-caption">${0}</div>
				    <div class="field-row">
				        ${0}
				        ${0}
				    </div>
				</div>
			`), className, field.fieldName, field.property.Name, control, field.fieldName === 'title' ? `
				        	<a href="#" onclick="HideShow('row_activity_id'); return false;">
				        		${this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ID')}
				        	</a>
				        			<a href="#" onclick="HideShow('row_activity_editor_comment'); return false;">
				        		${this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_COMMENT')}
				        	</a>
				        ` : null);
	    },
	    async renderControls() {
	      var _this$currentBlock$ac7, _this$currentBlock$ac8, _this$currentBlock, _settingControls;
	      this.isLoading = true;
	      const id = (_this$currentBlock$ac7 = this.currentBlock.activity.Name) != null ? _this$currentBlock$ac7 : '';
	      const activity = (_this$currentBlock$ac8 = this.currentBlock.activity.Type) != null ? _this$currentBlock$ac8 : '';
	      const compatibleTemplate = [{
	        Type: 'NodeWorkflowActivity',
	        Children: [],
	        Name: 'Template'
	      }];
	      compatibleTemplate[0].Children.push((_this$currentBlock = this.currentBlock) == null ? void 0 : _this$currentBlock.activity, ...this.store.getAllBlockAncestors(this.currentBlock).map(b => b.activity));
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
	      this.$refs.contentContainer.innerHTML = '';
	      this.hasErrors = false;
	      this.nodeControls = [];
	      let settingControls = null;
	      try {
	        var _this$currentBlock2;
	        settingControls = await editorAPI.getNodeSettingsControls({
	          documentType: this.documentType,
	          activity: (_this$currentBlock2 = this.currentBlock) == null ? void 0 : _this$currentBlock2.activity
	        });
	      } catch (error) {
	        handleResponseError(error);
	      }
	      this.useDocumentContext = Boolean((_settingControls = settingControls) == null ? void 0 : _settingControls.useDocumentContext);
	      if (settingControls && main_core.Type.isArray(settingControls.controls)) {
	        await this.renderNodeControls(settingControls.controls);
	      } else {
	        await this.renderPropertyDialog(formData);
	      }
	    },
	    renderNodeControls(settingControls) {
	      this.nodeControls = settingControls;
	      const eventName = 'BX.Bizproc.FieldType.onCollectionRenderControlFinished';
	      this.nodeControls = this.nodeControls.map(property => ({
	        ...property,
	        controlId: property.fieldName.toLowerCase()
	      }));
	      const renderedControls = BX.Bizproc.FieldType.renderControlCollection(this.documentType, this.nodeControls.filter(field => field.property.Type !== 'Custom'), 'designer');
	      return new Promise(resolve => {
	        main_core.Event.EventEmitter.subscribeOnce(eventName, () => {
	          var _this$currentBlock$ac9, _this$currentBlock$ac10;
	          const form = main_core.Tag.render(_t3 || (_t3 = _$1`<form id="form-settings"></form>`));
	          this.settingsForm = form;
	          const activityTypeName = (_this$currentBlock$ac9 = (_this$currentBlock$ac10 = this.currentBlock.activity) == null ? void 0 : _this$currentBlock$ac10.Type) != null ? _this$currentBlock$ac9 : '';
	          const rendererName = `${activityTypeName}Renderer`;
	          const RendererClass = main_core.Type.isFunction(window[rendererName]) ? window[rendererName] : null;
	          let customRenderers = null;
	          let instance = null;
	          if (RendererClass) {
	            instance = RendererClass ? new RendererClass() : null;
	            customRenderers = instance && main_core.Type.isFunction(instance.getControlRenderers) ? instance.getControlRenderers() : null;
	          }
	          this.nodeControls.forEach(field => {
	            let control = renderedControls[field.controlId];
	            if (field.property.Type === 'custom' && instance && customRenderers) {
	              var _customRenderers, _field$property;
	              const renderer = (_customRenderers = customRenderers) == null ? void 0 : _customRenderers[field == null ? void 0 : (_field$property = field.property) == null ? void 0 : _field$property.CustomType];
	              if (main_core.Type.isFunction(renderer)) {
	                control = renderer(field);
	              }
	            }
	            if (control) {
	              const row = this.renderField(control, field);
	              const escapedFieldName = field.fieldName.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
	              const input = row.querySelector(`[name^="${escapedFieldName}"]`);
	              main_core.Event.bind(input, 'input', this.handleFieldInput);
	              this.inputListeners.push(input);
	              if (field.property.Type !== 'custom' && (input == null ? void 0 : input.tagName) === 'SELECT') {
	                main_core.Dom.addClass(input, 'ui-ctl-element');
	                const wrapper = main_core.Tag.render(_t4 || (_t4 = _$1`
									<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100${0}">
										<div class="ui-ctl-after ui-ctl-icon-angle"></div>
										${0}
									</div>
								`), field.property.Multiple === true ? ' ui-ctl-multiple-select' : '', input);
	                main_core.Dom.append(wrapper, row);
	              }
	              const selectorInput = row.querySelector('input[data-role="bp-selector-button"]');
	              if (selectorInput) {
	                const span = document.createElement('span');
	                span.className = 'node-settings-select-dotted';
	                for (const attr of selectorInput.attributes) {
	                  const attrName = attr.name;
	                  const attrValue = attr.value;
	                  span.setAttribute(attrName, attrValue);
	                }
	                main_core.Dom.replace(selectorInput, span);
	              }
	              main_core.Dom.append(row, form);
	            }
	          });
	          this.$refs.contentContainer.innerHTML = '';
	          main_core.Dom.append(form, this.$refs.contentContainer);
	          this.hasSettings = true;
	          this.isLoading = false;
	          resolve();
	        });
	      });
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
	        const value = formData[field.fieldName];
	        const escapedFieldName = field.fieldName.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
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
	    showActivationMenu(event) {
	      this.activationMenuHelper.showActivationMenu(event, this.currentBlock, () => this.syncActivatedField());
	    },
	    syncActivatedField() {
	      const activatedInput = document.getElementsByName('activated')[0];
	      if (activatedInput) {
	        activatedInput.value = activatedInput.value === 'Y' ? 'N' : 'Y';
	      }
	    }
	  },
	  template: `
		<transition name="slide-fade">
			<div v-if="isVisible" class="node-settings-panel" ref="settingsPanel">
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
						@click="showActivationMenu"
					/>
				</div>
				<div class="node-settings-form__section-delimeter"></div>
				<Transition
					:css="shouldShowWithTransition"
					name="node-settings-transition"
				>
					<div v-show="!isLoading" class="node-settings-content">
						<div class="temp-block" v-show="!hasSettings">
							<svg width="330" height="162" viewBox="0 0 330 162" fill="none" xmlns="http://www.w3.org/2000/svg">
								<g opacity="0.8">
									<g opacity="0.8" filter="url(#filter0_d_348_93445)">
										<path d="M87.0298 24.5516C87.0298 15.9188 93.507 9.42059 101.372 10.041L225.88 19.8304C231.526 20.272 236.027 26.4233 236.027 33.5839V117.788C236.027 124.938 231.516 131.079 225.88 131.499L101.372 140.752C93.507 141.341 87.0298 134.822 87.0298 126.179V24.5516Z" fill="#C4E6FF"/>
									</g>
								</g>
								<path opacity="0.05" fill-rule="evenodd" clip-rule="evenodd" d="M107.155 46.8539C107.155 46.4964 106.893 46.1915 106.556 46.1809C106.22 46.1704 105.957 46.4543 105.957 46.8118V56.5592L96.9034 56.3384C96.5669 56.3384 96.2935 56.6223 96.2935 56.9798C96.2935 57.3373 96.5669 57.6422 96.9034 57.6528L105.957 57.8631V77.3683H96.9034C96.5669 77.3683 96.2935 77.6627 96.2935 78.0307C96.2935 78.3988 96.5669 78.6827 96.9034 78.6827H105.957V98.1669L96.9034 98.3877C96.5669 98.3877 96.2935 98.6926 96.2935 99.0606C96.2935 99.4287 96.5669 99.7126 96.9034 99.702L105.957 99.4602V118.965L96.9034 119.407C96.5669 119.428 96.2935 119.733 96.2935 120.091C96.2935 120.448 96.5669 120.732 96.9034 120.721L105.957 120.259V130.006C105.957 130.364 106.22 130.637 106.556 130.616C106.893 130.595 107.155 130.29 107.155 129.933V120.196L124.663 119.312V128.849C124.663 129.196 124.915 129.47 125.231 129.449C125.546 129.428 125.798 129.133 125.798 128.776V119.249L142.549 118.398V127.724C142.549 128.071 142.791 128.334 143.096 128.313C143.4 128.292 143.642 127.998 143.642 127.661V118.345L159.688 117.535V126.673C159.688 127.009 159.919 127.272 160.214 127.251C160.508 127.23 160.74 126.946 160.74 126.61V117.483L176.123 116.705V125.653C176.123 125.979 176.344 126.231 176.628 126.221C176.912 126.21 177.132 125.926 177.132 125.59V116.652L191.895 115.906V124.675C191.895 125.001 192.116 125.243 192.379 125.232C192.642 125.222 192.863 124.938 192.863 124.622V115.864L207.037 115.149V123.739C207.037 124.055 207.247 124.297 207.5 124.286C207.752 124.275 207.962 124.002 207.962 123.687V115.106L221.59 114.412V122.835C221.59 123.14 221.789 123.382 222.031 123.371C222.273 123.361 222.473 123.087 222.473 122.782V114.37L228.214 114.076C228.456 114.065 228.656 113.803 228.656 113.498C228.656 113.193 228.456 112.951 228.214 112.961L222.473 113.245V96.4214L228.214 96.2742C228.456 96.2742 228.656 96.0113 228.656 95.7064C228.656 95.4014 228.456 95.1596 228.214 95.1596L222.473 95.2963V78.4724H228.214C228.456 78.4724 228.656 78.2095 228.656 77.9045C228.656 77.5996 228.456 77.3473 228.214 77.3473H222.473V60.5233L228.214 60.6495C228.456 60.6495 228.656 60.4077 228.656 60.1027C228.656 59.7978 228.456 59.5454 228.214 59.5349L222.473 59.3982V50.9863C222.473 50.6813 222.273 50.4185 222.031 50.408C221.789 50.3974 221.59 50.6393 221.59 50.9547V59.3772L207.962 59.0407V50.4605C207.962 50.1451 207.752 49.8822 207.5 49.8717C207.247 49.8612 207.037 50.1135 207.037 50.429V59.0197L192.863 58.6727V49.9138C192.863 49.5878 192.642 49.3249 192.379 49.3144C192.116 49.3039 191.895 49.5562 191.895 49.8822V58.6517L177.132 58.2942V49.3565C177.132 49.0305 176.912 48.7571 176.628 48.7466C176.344 48.7361 176.123 48.999 176.123 49.3249V58.2731L160.74 57.8946V48.7676C160.74 48.4311 160.508 48.1472 160.214 48.1367C159.919 48.1262 159.688 48.3891 159.688 48.7256V57.8631L143.642 57.474V48.1578C143.642 47.8108 143.4 47.5269 143.096 47.5163C142.791 47.5058 142.549 47.7792 142.549 48.1157V57.4425L125.798 57.0324V47.5058C125.798 47.1588 125.546 46.8644 125.231 46.8539C124.915 46.8434 124.663 47.1168 124.663 47.4638V57.0008L107.155 56.5802V46.8434V46.8539ZM221.6 113.287V96.4424L207.973 96.7999V113.96L221.6 113.287ZM207.047 114.002V96.8209L192.873 97.189V114.696L207.047 114.002ZM191.906 114.738V97.21L177.143 97.5991V115.464L191.906 114.738ZM176.134 115.517V97.6201L160.75 98.0197V116.263L176.134 115.506V115.517ZM159.699 116.326V98.0617L143.653 98.4823V117.115L159.699 116.326ZM142.559 117.167V98.5033L125.809 98.945V117.988L142.559 117.167ZM124.663 118.04V98.966L107.155 99.4287V118.902L124.663 118.04ZM124.663 97.7042L107.155 98.1353V78.6616L124.663 78.6301V97.7042ZM142.559 97.2626L125.809 97.6727V78.6301L142.559 78.5985V97.2626ZM159.699 96.842L143.653 97.2416V78.6091L159.699 78.5775V96.842ZM176.134 96.4319L160.75 96.8104V78.567L176.134 78.546V96.4424V96.4319ZM191.906 96.0428L177.143 96.4109V78.546L191.906 78.5249V96.0534V96.0428ZM207.047 95.6748L192.873 96.0218V78.5144L207.047 78.4934V95.6748ZM221.6 95.3173L207.973 95.6538V78.4934L221.6 78.4724V95.3173ZM221.6 77.3367V60.4918L207.973 60.1763V77.3367H221.6ZM207.047 77.3473V60.1658L192.873 59.8399V77.3473H207.047ZM191.906 77.3473V59.8188L177.143 59.4824V77.3473H191.906ZM176.134 77.3473V59.4508L160.75 59.1038V77.3473H176.134ZM159.699 77.3473V59.0828L143.653 58.7148V77.3473H159.699ZM142.559 77.3578V58.6937L125.809 58.3152V77.3578H142.559ZM124.663 77.3578V58.2837L107.155 57.8841V77.3578H124.663Z" fill="#1F86FF"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M225.88 20.9239L101.372 11.3238C94.1694 10.7665 88.2495 16.718 88.2495 24.6252V126.116C88.2495 134.023 94.18 139.995 101.372 139.469L225.88 130.395C231.053 130.017 235.196 124.391 235.196 117.83V33.5314C235.196 26.97 231.053 21.3235 225.88 20.9239ZM101.372 10.041C93.507 9.42059 87.0298 15.9188 87.0298 24.5516V126.189C87.0298 134.822 93.507 141.341 101.372 140.763L225.88 131.51C231.526 131.089 236.027 124.959 236.027 117.798V33.5839C236.027 26.4338 231.516 20.272 225.88 19.8304L101.372 10.041Z" fill="#9BD4FF" fill-opacity="0.8"/>
								<path opacity="0.1" d="M87.0298 24.867C87.0298 16.0555 93.507 9.43103 101.372 10.0409L225.88 19.8303C231.526 20.2719 236.027 26.5494 236.027 33.8467V42.6583L87.0298 35.4976V24.867Z" fill="#0075FF"/>
								<path d="M96.9034 54.3721C96.9034 50.0189 100.174 46.6015 104.169 46.7487L147.459 48.2944C151.024 48.4206 153.894 51.8169 153.894 55.8862V119.68C153.894 123.75 151.024 127.22 147.459 127.44L104.169 130.132C100.174 130.385 96.9034 127.051 96.9034 122.698V54.3721Z" fill="white"/>
								<path d="M122.949 61.1113C122.949 59.881 123.843 58.9031 124.957 58.9242L144.473 59.3553C145.525 59.3763 146.376 60.3647 146.376 61.5634C146.376 62.7621 145.525 63.719 144.473 63.6979L124.957 63.372C123.853 63.351 122.949 62.3415 122.949 61.1113Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path opacity="0.8" d="M101.761 57.1054C101.761 54.2243 103.917 51.9425 106.567 52.0267L113.664 52.237C116.251 52.3106 118.333 54.6659 118.333 57.505V65.1914C118.333 68.0199 116.251 70.3017 113.664 70.2806L106.567 70.2175C103.928 70.1965 101.761 67.8412 101.761 64.9495V57.1054Z" fill="#59FBB0" fill-opacity="0.74"/>
								<path opacity="0.3" d="M96.9037 75.3916L153.884 75.5178V119.681C153.884 123.75 151.014 127.22 147.449 127.441L104.159 130.132C100.163 130.385 96.8932 127.052 96.8932 122.698V75.3916H96.9037Z" fill="#D7EFFF" fill-opacity="0.8"/>
								<path d="M134.274 90.5539C134.274 89.3342 135.146 88.3458 136.219 88.3247L144.473 88.2091C145.525 88.1986 146.376 89.1554 146.376 90.3541C146.376 91.5528 145.525 92.5412 144.473 92.5623L136.219 92.72C135.146 92.741 134.274 91.7736 134.274 90.5539Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path d="M134.274 113.171C134.274 111.952 135.146 110.932 136.219 110.89L144.473 110.553C145.525 110.511 146.376 111.447 146.376 112.646C146.376 113.844 145.525 114.854 144.473 114.896L136.219 115.274C135.146 115.327 134.274 114.381 134.274 113.161V113.171Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M129.08 90.2276L123.612 85.9375C123.486 85.8323 123.317 85.8218 123.17 85.9164C123.033 86.0006 122.939 86.1688 122.949 86.3581V95.1275C122.949 95.3168 123.033 95.4745 123.17 95.5586C123.307 95.6428 123.475 95.6217 123.612 95.5166L129.08 91.0477C129.195 90.9531 129.258 90.8059 129.258 90.6376C129.258 90.4694 129.185 90.3222 129.08 90.2381V90.2276Z" fill="#0075FF" fill-opacity="0.78"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M110.583 90.5222L104.863 86.1374C104.727 86.0323 104.548 86.0218 104.401 86.1059C104.253 86.19 104.159 86.3688 104.169 86.558V95.5273C104.169 95.7165 104.253 95.8848 104.401 95.9689C104.548 96.053 104.727 96.032 104.863 95.9269L110.583 91.3528C110.699 91.2582 110.773 91.1005 110.773 90.9323C110.773 90.764 110.699 90.6168 110.583 90.5222Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M129.08 112.993L123.612 108.85C123.486 108.755 123.317 108.745 123.17 108.839C123.033 108.934 122.939 109.102 122.949 109.292V118.061C122.949 118.25 123.033 118.408 123.17 118.492C123.307 118.576 123.475 118.555 123.612 118.44L129.08 113.813C129.195 113.718 129.258 113.561 129.258 113.403C129.258 113.245 129.185 113.087 129.08 113.003V112.993Z" fill="#0075FF" fill-opacity="0.78"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M110.583 113.792L104.863 109.565C104.727 109.459 104.548 109.459 104.401 109.554C104.253 109.649 104.159 109.827 104.169 110.017V118.986C104.169 119.175 104.253 119.344 104.401 119.428C104.548 119.512 104.727 119.491 104.863 119.375L110.583 114.643C110.699 114.549 110.773 114.391 110.773 114.223C110.773 114.054 110.699 113.907 110.583 113.813V113.792Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path d="M171.581 63.5515C171.581 60.2393 173.852 57.6105 176.638 57.6841L223.829 58.8723C226.269 58.9354 228.235 61.4695 228.235 64.5504V75.6857C228.235 78.7561 226.269 81.2586 223.829 81.2797L176.638 81.5425C173.852 81.5531 171.581 78.8823 171.581 75.5701V63.5725V63.5515Z" fill="white"/>
								<path d="M193.347 69.7651C193.347 68.64 194.104 67.7357 195.029 67.7462L217.794 68.0301C218.667 68.0406 219.371 68.9344 219.371 70.0174C219.371 71.1005 218.667 71.9837 217.794 71.9732L195.029 71.8155C194.104 71.8155 193.347 70.8902 193.347 69.7651Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path opacity="0.3" d="M175.629 66.0119C175.629 63.3727 177.427 61.2697 179.635 61.3223L185.566 61.4484C187.732 61.4905 189.477 63.625 189.477 66.2222V73.2567C189.477 75.8434 187.732 77.9464 185.566 77.9464H179.635C177.427 77.9464 175.629 75.8224 175.629 73.1831V66.0224V66.0119Z" fill="#44B0FF" fill-opacity="0.74"/>
								<path d="M177.638 93.4241C177.638 90.1329 179.877 87.4411 182.611 87.4095L220.255 86.9153C222.715 86.8838 224.702 89.3653 224.702 92.4462V103.634C224.702 106.725 222.715 109.312 220.255 109.417L182.611 111.068C179.867 111.184 177.638 108.618 177.638 105.338V93.4346V93.4241Z" fill="white"/>
								<path d="M199.077 98.7659C199.077 97.6513 199.824 96.726 200.728 96.6944L216.889 96.2738C217.762 96.2528 218.467 97.115 218.467 98.2086C218.467 99.3021 217.762 100.206 216.889 100.227L200.728 100.732C199.813 100.764 199.077 99.8804 199.077 98.7553V98.7659Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path opacity="0.3" d="M181.633 95.706C181.633 93.0878 183.41 90.9322 185.576 90.9007L191.422 90.7956C193.557 90.7535 195.271 92.8144 195.271 95.3801V102.362C195.271 104.928 193.557 107.083 191.422 107.167L185.576 107.399C183.4 107.483 181.633 105.432 181.633 102.814V95.706Z" fill="#FAA72C" fill-opacity="0.78"/>
								<path d="M213.03 113.14C213.03 107.493 216.689 102.783 221.158 102.635L243.524 101.857C247.677 101.71 251 105.948 251 111.3V139.154C251 144.516 247.667 149.196 243.524 149.616L221.158 151.887C216.689 152.34 213.03 148.134 213.03 142.487V113.129V113.14Z" fill="#1BCE7B" fill-opacity="0.78"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M243.524 102.94L221.158 103.75C217.194 103.897 213.945 108.072 213.945 113.087V142.403C213.945 147.419 217.194 151.162 221.158 150.762L243.524 148.523C247.214 148.155 250.18 143.991 250.18 139.217V111.331C250.18 106.557 247.214 102.804 243.524 102.94ZM221.158 102.625C216.689 102.783 213.03 107.483 213.03 113.129V142.487C213.03 148.134 216.689 152.34 221.158 151.887L243.524 149.616C247.677 149.196 251 144.506 251 139.154V111.3C251 105.937 247.667 101.71 243.524 101.857L221.158 102.635V102.625Z" fill="white" fill-opacity="0.18"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M224.082 136.314L222.368 136.451C221.558 136.514 220.896 135.736 220.896 134.716C220.896 133.696 221.558 132.813 222.368 132.75L224.082 132.624C224.681 130.426 226.301 128.765 228.204 128.628C230.107 128.491 231.684 129.911 232.273 132.003L241 131.341C241.768 131.278 242.399 132.045 242.399 133.034C242.399 134.022 241.779 134.884 241 134.948L232.273 135.652C231.684 137.829 230.086 139.5 228.204 139.658C226.322 139.816 224.692 138.417 224.082 136.314ZM231.327 122.908L222.357 123.476C221.548 123.528 220.885 122.74 220.885 121.709C220.885 120.679 221.548 119.817 222.357 119.764L231.327 119.249C231.916 117.083 233.503 115.474 235.364 115.369C237.226 115.264 238.782 116.704 239.36 118.776L241 118.681C241.768 118.639 242.399 119.406 242.399 120.405C242.399 121.404 241.779 122.245 241 122.298L239.36 122.403C238.782 124.548 237.215 126.168 235.364 126.294C233.514 126.42 231.916 125 231.327 122.908ZM235.364 122.645C236.143 122.592 236.784 121.741 236.784 120.742C236.784 119.743 236.153 118.965 235.364 119.007C234.576 119.049 233.945 119.911 233.945 120.91C233.945 121.909 234.586 122.698 235.364 122.645ZM228.193 135.978C228.992 135.915 229.634 135.042 229.634 134.022C229.634 133.002 228.992 132.235 228.193 132.298C227.394 132.361 226.742 133.234 226.742 134.254C226.742 135.273 227.394 136.041 228.193 135.978Z" fill="white" fill-opacity="0.9"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M165.945 70.1017C164.515 70.0912 163.358 71.4371 163.358 73.109V86.442C163.358 88.7868 161.728 90.7111 159.709 90.7426L153.895 90.8372V89.607L159.709 89.5123C161.15 89.4913 162.328 88.1139 162.328 86.442V73.088C162.328 70.7432 163.958 68.861 165.955 68.882L171.591 68.9451V70.1438L165.955 70.0912L165.945 70.1017Z" fill="#44B0FF" fill-opacity="0.74"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M168.784 100.227C167.364 100.269 166.218 101.657 166.218 103.319V108.156C166.218 110.49 164.599 112.456 162.59 112.54L153.905 112.929V111.699L162.59 111.321C164.02 111.258 165.188 109.859 165.188 108.187V103.35C165.188 101.016 166.807 99.0708 168.794 99.0182L177.658 98.7764V99.9646L168.794 100.227H168.784Z" fill="#44B0FF" fill-opacity="0.74"/>
								<defs>
									<filter id="filter0_d_348_93445" x="79.4698" y="4.6" width="164.117" height="145.909" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
										<feFlood flood-opacity="0" result="BackgroundImageFix"/>
										<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
										<feOffset dy="2.16"/>
										<feGaussianBlur stdDeviation="3.78"/>
										<feComposite in2="hardAlpha" operator="out"/>
										<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.02 0"/>
										<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_348_93445"/>
										<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_348_93445" result="shape"/>
									</filter>
								</defs>
							</svg>
							<p>{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TEXT')}}</p>
						</div>
						<div ref="contentContainer"></div>
					</div>
				</Transition>
				<div v-if="isLoading" class="loader-spinner node-settings-content">
					<span class="dot dot1"></span>
					<span class="dot dot2"></span>
					<span class="dot dot3"></span>
				</div>
				<div class="node-settings-footer" v-show="hasSettings">
					<button class="ui-btn --air ui-btn-lg --style-outline-fill-accent ui-btn-no-caps" @click="handleFormSave">
						{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE')}}
					</button>
					<button class="ui-btn --air ui-btn-lg --style-outline ui-btn-no-caps" @click="handleFormCancel">
						{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CANCEL')}}
					</button>

					<div class="node-settings-document-selector" v-show="useDocumentContext">
						<BIcon
							name="document"
							:size="24"
							@click="handleDocumentSelector"
						/>
					</div>
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
	var _getValue$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getValue");
	var _getEntities$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEntities");
	var _getTabs$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTabs");
	var _getItems$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getItems");
	var _processReturnProperties$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processReturnProperties");
	var _processChildrenProperties$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processChildrenProperties");
	class FieldSelector {
	  constructor(currentBlock, currentPortId) {
	    Object.defineProperty(this, _processChildrenProperties$2, {
	      value: _processChildrenProperties2$2
	    });
	    Object.defineProperty(this, _processReturnProperties$2, {
	      value: _processReturnProperties2$2
	    });
	    Object.defineProperty(this, _getItems$1, {
	      value: _getItems2$1
	    });
	    Object.defineProperty(this, _getTabs$2, {
	      value: _getTabs2$2
	    });
	    Object.defineProperty(this, _getEntities$2, {
	      value: _getEntities2$2
	    });
	    Object.defineProperty(this, _getValue$1, {
	      value: _getValue2$1
	    });
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
	        items: babelHelpers.classPrivateFieldLooseBase(this, _getItems$1)[_getItems$1](),
	        tabs: babelHelpers.classPrivateFieldLooseBase(this, _getTabs$2)[_getTabs$2](),
	        entities: babelHelpers.classPrivateFieldLooseBase(this, _getEntities$2)[_getEntities$2](),
	        cacheable: false,
	        showAvatars: false,
	        events: {
	          'Item:onSelect': event => {
	            resolve(babelHelpers.classPrivateFieldLooseBase(this, _getValue$1)[_getValue$1](event.getData().item));
	          }
	        },
	        compactView: true
	      });
	      dialog.show();
	    });
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
	        const properties = babelHelpers.classPrivateFieldLooseBase(this, _processChildrenProperties$2)[_processChildrenProperties$2](block);
	        if (main_core.Type.isArrayFilled(properties)) {
	          acc.push(...properties);
	        }
	      }
	      if (main_core.Type.isArrayFilled(block.activity.ReturnProperties)) {
	        const properties = babelHelpers.classPrivateFieldLooseBase(this, _processReturnProperties$2)[_processReturnProperties$2](block);
	        if (main_core.Type.isArrayFilled(properties)) {
	          acc.push(...properties);
	        }
	      }
	      return acc;
	    }, []);
	  }
	}
	function _getValue2$1(item) {
	  return item.getCustomData().get(CustomDataFieldKey);
	}
	function _getEntities2$2() {
	  return [{
	    id: 'bizproc-document'
	  }];
	}
	function _getTabs2$2() {
	  return [{
	    id: 'returns',
	    title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_RETURNS'),
	    icon: 'flag-1'
	  }, {
	    id: 'template',
	    title: main_core.Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_TEMPLATE'),
	    icon: 'disk'
	  }];
	}
	function _getItems2$1() {
	  const items = this.getReturnItems();
	  this.addTemplateItems(items);
	  return items;
	}
	function _processReturnProperties2$2(block) {
	  const fullTitle = block.activity.Properties.Title;
	  const {
	    properties
	  } = block.activity.ReturnProperties.reduce((res, property) => {
	    const id = `${block.id}:${property.Id}`;
	    if (property.Type === 'document') {
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
	          object: block.id,
	          fieldId: property.Id,
	          type: property.Type,
	          multiple: property.Multiple
	        }
	      }
	    });
	    return res;
	  }, {
	    properties: []
	  });
	  const result = [];
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
	function _processChildrenProperties2$2(block) {
	  const childrenProperties = [];
	  block.activity.Children.forEach(activity => {
	    if (main_core.Type.isArrayFilled(activity.ReturnProperties)) {
	      const properties = babelHelpers.classPrivateFieldLooseBase(this, _processReturnProperties$2)[_processReturnProperties$2]({
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
	      tabs: 'returns',
	      title: block.activity.Properties.Title,
	      children: childrenProperties,
	      searchable: false
	    });
	  }
	  return properties;
	}

	// @vue/component
	const EditConditionExpression = {
	  name: 'edit-condition-expression',
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
	    ...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRuleId']),
	    availableOperators() {
	      return Object.values(CONSTRUCTION_OPERATORS).map(operator => {
	        var _OperatorPhraseCodes$;
	        return {
	          id: operator,
	          title: this.getMessage((_OperatorPhraseCodes$ = OperatorPhraseCodes[operator]) != null ? _OperatorPhraseCodes$ : '')
	        };
	      });
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
	      const connectedBlocks = store.getBlockAncestorsByInputPortId(this.block, this.currentRuleId);
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
	      var _this$availableOperat, _this$availableOperat2;
	      return (_this$availableOperat = (_this$availableOperat2 = this.availableOperators.find(({
	        id
	      }) => id === this.selectedOperator)) == null ? void 0 : _this$availableOperat2.title) != null ? _this$availableOperat : this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
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
	      const fieldSelector = new FieldSelector(this.block, this.currentRuleId);
	      void fieldSelector.show(event.target).then(field => {
	        this.selectedField = field;
	      });
	    },
	    onShowValueMenu(event) {
	      if (!this.block) {
	        return;
	      }
	      const valueSelector = new ValueSelector(diagramStore(), this.block, this.currentRuleId);
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
	            var _this$operatorMenu;
	            this.selectedOperator = id;
	            (_this$operatorMenu = this.operatorMenu) == null ? void 0 : _this$operatorMenu.close();
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
		<div class="edit-condition-expression-form">
			<div class="edit-condition-expression-form__item">
				<span class="edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_FIELD') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-condition-expression-form__dropdown">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						ref="fieldChooseMenu"
						class="ui-ctl-element"
						@click="onShowFieldChooseMenu"
					>
						{{ selectedFieldTitle }}
					</div>
				</div>
			</div>
			<div class="edit-condition-expression-form__item">
				<span class="edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_EXPRESSION_OPERATOR') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-condition-expression-form__dropdown"
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
				class="edit-condition-expression-form__item"
			>
				<span class="edit-condition-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-condition-expression-form__dropdown">
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
	  name: 'add-construction',
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
	      var _this$ruleCard$constr, _this$ruleCard;
	      // temporary
	      const isActionCardExists = ((_this$ruleCard$constr = (_this$ruleCard = this.ruleCard) == null ? void 0 : _this$ruleCard.constructions) != null ? _this$ruleCard$constr : []).some(construction => construction.type === CONSTRUCTION_TYPES.ACTION);
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
	        disabled: isActionCardExists
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
	      var _this$ruleCard2;
	      const [, menuItem] = args;
	      const ruleCard = (_this$ruleCard2 = this.ruleCard) != null ? _this$ruleCard2 : this.addRuleCard();
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
			class="add-construction"
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
	  name: 'delete-construction',
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
			class="delete-construction"
			name="cross-s"
			@click="deleteConstruction(ruleCard, construction)"
		/>
	`
	};

	// @vue/component
	const SelectBooleanType = {
	  name: 'select-boolean-type',
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
	  data() {
	    return {
	      selectedType: CONSTRUCTION_TYPES.AND_CONDITION
	    };
	  },
	  computed: {
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
		<div class="node-settings-boolean-type-switcher">
			<span
				v-for="booleanType in booleanTypes"
				class="node-settings-boolean-type-switcher_tab"
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
	  name: 'select-rule',
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
	    ...ui_vue3_pinia.mapState(useNodeSettingsStore, ['currentRuleId']),
	    currentRuleTitle() {
	      const ports = this.block.ports.input;
	      const {
	        title
	      } = ports.find(port => port.id === this.currentRuleId);
	      return title;
	    }
	  },
	  methods: {
	    ...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['setCurrentRuleId']),
	    getMenuItems() {
	      return this.block.ports.input.map(port => {
	        return {
	          id: port.id,
	          text: port.title,
	          dataset: {
	            testId: `menuItemRule-${port.id}`
	          },
	          onclick: () => {
	            this.setCurrentRuleId(port.id);
	            this.menu.close();
	          }
	        };
	      });
	    },
	    onShowMenu() {
	      this.menu = main_popup.MenuManager.create('constructions-menu', this.$refs.nodeSettingsRulesDropdown, this.getMenuItems(), {
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
			class="node-settings-rules-dropdown"
			ref="nodeSettingsRulesDropdown"
			:data-test-id="$testId('complexNodeRuleSettingsDropdown')"
			@click="onShowMenu"
		>
			<span class="node-settings-rules-dropdown__value">
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
	  name: 'delete-rule-card',
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
			class="delete-rule-card"
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

	// @vue/component
	const EditExtandedAction = {
	  name: 'action-settings-form',
	  components: {
	    Loader
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
	    }
	  },
	  setup() {
	    const store = diagramStore();
	    return {
	      store
	    };
	  },
	  data() {
	    return {
	      status: '',
	      settingsForm: null
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(useNodeSettingsStore, ['block', 'currentRuleId']),
	    Status: () => Status
	  },
	  watch: {
	    actionId(newVal, oldVal) {
	      if (newVal === oldVal) {
	        return;
	      }
	      this.init();
	    }
	  },
	  mounted() {
	    this.init();
	  },
	  unmounted() {
	    this.unsubscribe();
	  },
	  methods: {
	    ...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['changeRuleExpression']),
	    async init() {
	      try {
	        await this.loadForm();
	        window.BPAShowSelector = this.showSelector;
	        window.HideShow = this.hideShow;
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
	    async showSelector(id) {
	      const selector = new ValueSelector(this.store, this.block, this.currentRuleId);
	      const targetElement = document.getElementById(id);
	      try {
	        const value = await selector.show(targetElement);
	        const beforePart = targetElement.value.slice(0, targetElement.selectionEnd);
	        const middlePart = value;
	        const afterPart = targetElement.value.slice(targetElement.selectionEnd);
	        targetElement.value = beforePart + middlePart + afterPart;
	        targetElement.selectionEnd = beforePart.length + middlePart.length + 1;
	        targetElement.focus();
	      } catch (error) {
	        console.error(error);
	      }
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
	      const formData = main_core.ajax.prepareForm(form).data;
	      formData.documentType = this.documentType;
	      formData.activityType = this.actionId;
	      formData.id = main_core.Type.isStringFilled(formData.activity_id) ? formData.activity_id : createUniqueId();
	      return formData;
	    },
	    async loadForm() {
	      var _this$template$PARAME, _this$template, _this$template$VARIAB, _this$template2, _this$template$CONSTA, _this$template3;
	      this.$refs.contentContainer.innerHTML = '';
	      this.status = Status.Loading;
	      let activity = this.activityData;
	      if (!activity) {
	        activity = {
	          Name: createUniqueId(),
	          Type: this.actionId,
	          Activated: 'Y',
	          Properties: {}
	        };
	      }
	      const compatibleTemplate = [{
	        Type: 'NodeWorkflowActivity',
	        Children: [],
	        Name: 'Template'
	      }];
	      compatibleTemplate[0].Children.push(activity, ...this.store.getAllBlockAncestors(this.block, this.currentRuleId).map(b => b.activity));
	      if (window.CreateActivity) {
	        window.arAllId = {};
	        window.arWorkflowTemplate = compatibleTemplate;
	        window.rootActivity = window.CreateActivity(compatibleTemplate[0]);
	      }
	      const {
	        createFormData
	      } = usePropertyDialog();
	      const formData = createFormData({
	        id: activity.Name,
	        documentType: this.documentType,
	        activity: this.actionId,
	        workflow: {
	          parameters: (_this$template$PARAME = (_this$template = this.template) == null ? void 0 : _this$template.PARAMETERS) != null ? _this$template$PARAME : [],
	          variables: (_this$template$VARIAB = (_this$template2 = this.template) == null ? void 0 : _this$template2.VARIABLES) != null ? _this$template$VARIAB : [],
	          template: compatibleTemplate,
	          constants: (_this$template$CONSTA = (_this$template3 = this.template) == null ? void 0 : _this$template3.CONSTANTS) != null ? _this$template$CONSTA : []
	        }
	      });
	      await this.renderPropertyDialog(formData);
	      this.status = Status.Loaded;
	    },
	    async renderPropertyDialog(formData) {
	      const {
	        renderPropertyDialog
	      } = usePropertyDialog();
	      const form = await renderPropertyDialog(this.$refs.contentContainer, formData);
	      if (!form) {
	        this.hasSettings = false;
	        return;
	      }
	      this.settingsForm = form;
	      this.hasSettings = true;
	    }
	  },
	  template: `
		<Loader v-if="status === Status.Loading" />
		<div
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
	    NodeSettingsVariable,
	    NodeSettingsRule,
	    AddSettingsItem
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
	    ...ui_vue3_pinia.mapState(diagramStore, ['documentType']),
	    ...ui_vue3_pinia.mapState(useNodeSettingsStore, ['block', 'isShown', 'isRuleSettingsShown', 'nodeSettings', 'isLoading', 'isSaving', 'savedBlockInputPorts']),
	    ...ui_vue3_pinia.mapWritableState(useNodeSettingsStore, ['isSaving'])
	  },
	  methods: {
	    ...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['toggleVisibility', 'toggleRuleSettingsVisibility', 'reset', 'setCurrentRuleId', 'deleteRuleSettings', 'saveForm', 'discardFormSettings', 'updateSettings']),
	    ...ui_vue3_pinia.mapActions(diagramStore, ['updateNodeTitle', 'addRulePort', 'addConnectionPort', 'deletePort', 'publicDraft', 'updateBlockActivityField', 'setInputPorts', 'getBlockAncestorsByInputPortId']),
	    ...ui_vue3_pinia.mapActions(useAppStore, ['hideRightPanel']),
	    onShowRuleConstructions(ruleId) {
	      this.toggleRuleSettingsVisibility(true);
	      this.setCurrentRuleId(ruleId);
	    },
	    onAddRule(ruleId) {
	      this.addRulePort(this.block.id, ruleId, PORT_TYPES.input);
	    },
	    onDeleteRule(ruleId) {
	      this.deletePort(this.block.id, ruleId);
	      const {
	        outputPortsToAdd,
	        outputPortsToDelete
	      } = this.deleteRuleSettings(ruleId);
	      outputPortsToAdd.values().forEach(({
	        portId,
	        title
	      }) => {
	        this.addRulePort(this.block, portId, PORT_TYPES.output, title);
	      });
	      outputPortsToDelete.keys().forEach(portId => {
	        this.deletePort(this.block.id, portId, PORT_TYPES.output);
	      });
	    },
	    onAddConnection(connectionId) {
	      this.addConnectionPort(this.block.id, connectionId, PORT_TYPES.input);
	    },
	    async onSaveForm() {
	      try {
	        this.isSaving = true;
	        const activityData = await this.saveForm(this.documentType);
	        this.updateBlockActivityField(this.block.id, activityData);
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
	      const {
	        title
	      } = this.nodeSettings;
	      this.updateNodeTitle(this.block, title);
	      this.setInputPorts(this.block, this.savedBlockInputPorts);
	      this.hideSettings();
	    },
	    onUpdateTitle(block, title) {
	      this.updateNodeTitle(block, title);
	      this.updateSettings({
	        title
	      });
	    },
	    onUpdateDescription(description) {
	      this.updateSettings({
	        description
	      });
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
					@updateTitle="onUpdateTitle(block, $event)"
					@updateDescription="onUpdateDescription($event)"
				>
					<!--
					<template #variable="{ variableName, variableValue }">
						<NodeSettingsVariable
							:variableName="variableName"
							:variableValue="variableValue"
						/>
					</template>
					<template #addElement="{ itemType }">
						<AddSettingsItem :itemType="itemType">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_ELEMENT') }}
						</AddSettingsItem>
					</template>
					-->

					<template #rule="{ port }">
						<NodeSettingsRule
							:port="port"
							:nodeSettings="nodeSettings"
							:connectedBlocks="getBlockAncestorsByInputPortId(block, port.id)"
							@showRuleConstructions="onShowRuleConstructions"
							@deleteRule="onDeleteRule"
						/>
					</template>
					<template #addRule="{ itemType }">
						<AddSettingsItem
							:itemType="itemType"
							@addItem="onAddRule"
						>
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_RULE') }}
						</AddSettingsItem>
					</template>
					<template #addConnection="{ itemType }">
						<AddSettingsItem
							:itemType="itemType"
							@addItem="onAddConnection"
						>
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_CONNECTION') }}
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
		<slot v-if="isShown" />
	`
	};

	// @vue/component
	const EditOutputExpression = {
	  name: 'edit-output-expression',
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
	    scrolling: {
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
	      changedOutputPorts: []
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'block']),
	    savedOutputPorts() {
	      var _this$block$ports$out, _this$block;
	      return (_this$block$ports$out = (_this$block = this.block) == null ? void 0 : _this$block.ports.output.map(port => ({
	        portId: port.id,
	        title: port.title
	      }))) != null ? _this$block$ports$out : [];
	    },
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
	    }
	  },
	  watch: {
	    scrolling(scrolling) {
	      if (scrolling && this.isPopupShown) {
	        this.isPopupShown = false;
	      }
	    }
	  },
	  created() {
	    this.changedOutputPorts = [...this.savedOutputPorts];
	    if (this.changedOutputPorts.length === 0) {
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
	      var _this$changedOutputPo;
	      const lastPort = (_this$changedOutputPo = this.changedOutputPorts[this.changedOutputPorts.length - 1]) != null ? _this$changedOutputPo : null;
	      const lastPortIdNumber = lastPort ? parseInt(lastPort.portId.replace('o', ''), 10) : 0;
	      this.changedOutputPorts.push({
	        portId: `o${lastPortIdNumber + 1}`,
	        title: `E${lastPortIdNumber + 1}`
	      });
	    },
	    deletePort(portId) {
	      this.changedOutputPorts = this.changedOutputPorts.filter(port => {
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
		<div class="edit-output-expression-form">
			<div class="edit-output-expression-form__item">
				<span class="edit-output-expression-form__label">
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
			<div class="edit-output-expression-form__item">
				<span class="edit-output-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-output-expression-form__dropdown"
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
						<div class="edit-output-expression-form__dropdown_popup">
							<div
								class="edit-output-expression-form__dropdown_popup-content"
								ref="nodeSettingsRuleOutputDropdownContent"
							>
								<div
									v-for="outputPort in changedOutputPorts"
									class="edit-output-expression-form__dropdown_popup-item"
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
							<div class="edit-output-expression-form__dropdown_popup-footer">
								<div
									class="edit-output-expression-form__dropdown_popup-footer-content"
									@click="onAddButtonClick"
								>
									<BIcon
										:size="24"
										name="circle-plus"
										color="#0075ff"
										class="edit-output-expression-form__dropdown_popup-footer-icon"
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

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const NodeSettingsRules = {
	  name: 'node-settings-rules',
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
	    EditExtandedAction
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
	      scrolling: false
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(useNodeSettingsStore, ['nodeSettings', 'currentRuleId', 'block', 'isRuleSettingsShown']),
	    ...ui_vue3_pinia.mapWritableState(useNodeSettingsStore, ['isSaving']),
	    ...ui_vue3_pinia.mapState(diagramStore, ['documentTypeSigned', 'documentType', 'template']),
	    documentTypeForActionSettings() {
	      if (main_core.Type.isArrayFilled(this.nodeSettings.fixedDocumentType)) {
	        return this.nodeSettings.fixedDocumentType;
	      }
	      return this.documentType;
	    }
	  },
	  methods: {
	    ...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['toggleRuleSettingsVisibility', 'reorder', 'saveRule', 'discardRuleSettings']),
	    ...ui_vue3_pinia.mapActions(diagramStore, ['addRulePort', 'deletePort']),
	    onRulesLayoutClose() {
	      this.discardRuleSettings();
	      this.toggleRuleSettingsVisibility(false);
	    },
	    async onSaveRule() {
	      try {
	        this.isSaving = true;
	        await main_core_events.EventEmitter.emitAsync(EVENT_NAMES.BEFORE_SUBMIT_EVENT);
	        const {
	          outputPortsToAdd,
	          outputPortsToDelete
	        } = await this.saveRule(this.documentType);
	        outputPortsToAdd.values().forEach(({
	          portId,
	          title
	        }) => {
	          this.addRulePort(this.block.id, portId, PORT_TYPES.output, title);
	        });
	        outputPortsToDelete.keys().forEach(portId => {
	          this.deletePort(this.block.id, portId, PORT_TYPES.output);
	        });
	      } catch (error) {
	        if (error.errors && error.errors[0] && error.errors[0].message) {
	          ui_dialogs_messagebox.MessageBox.alert(main_core.Text.encode(error.errors[0].message));
	        }
	      } finally {
	        this.isSaving = false;
	      }
	    },
	    onScroll() {
	      this.scrolling = true;
	      this.$nextTick(() => {
	        this.scrolling = false;
	      });
	    }
	  },
	  template: `
		<NodeSettingsRulesLayout
			:isRuleSettingsShown="isRuleSettingsShown"
			:nodeSettings="nodeSettings"
			:currentRuleId="currentRuleId"
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
									<template #default="{ actionId, activityData }">
										<EditExtandedAction
											v-if="actionId"
											:actionId="actionId"
											:activityData="activityData"
											:construction="construction"
											:documentType="documentTypeForActionSettings"
											:template="template"
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
									:scrolling="scrolling"
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
					class="add-rule-card"
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
	      const foundedItems = [...new Map(state.groups.flatMap(group => group.items.filter(item => item.title.toLowerCase().includes(preSearchText)).map(item => [item.id, {
	        ...item,
	        parentGroup: group
	      }]))).values()];
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
	      groups.forEach((group, groupIdx) => {
	        group.items.forEach((item, itemIdx) => {
	          item.defaultSettings.ports = Object.entries(item.defaultSettings.ports).reduce((portsMap, [type, ports]) => {
	            var _ports$map;
	            portsMap[type] = (_ports$map = ports == null ? void 0 : ports.map(port => ({
	              ...port,
	              type
	            }))) != null ? _ports$map : [];
	            return portsMap;
	          }, {});
	          if (item.type === 'simple' || item.type === 'trigger') {
	            groups[groupIdx].items[itemIdx].defaultSettings.width = 200;
	            groups[groupIdx].items[itemIdx].defaultSettings.height = 48;
	          } else if (item.type === 'complex') {
	            groups[groupIdx].items[itemIdx].defaultSettings.width = 200;
	            groups[groupIdx].items[itemIdx].defaultSettings.height = 176;
	          }
	        });
	      });
	      this.groups = groups;
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
	          ports: {
	            input: [],
	            output: []
	          }
	        }
	      };
	    }
	  }
	});

	const DRAG_ITEM_SLOT_NAMES = {
	  default: 'drag-item',
	  [BLOCK_TYPES.SIMPLE]: `drag-item:${BLOCK_TYPES.SIMPLE}`,
	  [BLOCK_TYPES.TRIGGER]: `drag-item:${BLOCK_TYPES.TRIGGER}`,
	  [BLOCK_TYPES.COMPLEX]: `drag-item:${BLOCK_TYPES.COMPLEX}`,
	  [BLOCK_TYPES.FRAME]: `drag-item:${BLOCK_TYPES.FRAME}`,
	  [BLOCK_TYPES.TOOL]: `drag-item:${BLOCK_TYPES.TOOL}`
	};

	function getDragItemSlotName(itemType) {
	  var _DRAG_ITEM_SLOT_NAMES;
	  return (_DRAG_ITEM_SLOT_NAMES = DRAG_ITEM_SLOT_NAMES == null ? void 0 : DRAG_ITEM_SLOT_NAMES[itemType]) != null ? _DRAG_ITEM_SLOT_NAMES : DRAG_ITEM_SLOT_NAMES.default;
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
	  base: 'editor-chart-burger-btn',
	  openend: '--opened'
	};

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
	        var _toValue;
	        (_toValue = ui_vue3.toValue(textInput)) == null ? void 0 : _toValue.focus();
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
	  active: '--active',
	  drag: '--drag'
	};
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
	const ICON_COLORS$2 = {
	  0: '#9C5CEF',
	  1: '#188AE6',
	  2: '#E08907',
	  3: '#8E96A2',
	  4: '#3CB811',
	  5: '#52BCBC',
	  6: '#B4B959',
	  7: '#FFFFFF',
	  8: '#FFFFFF'
	};
	const DEFAULT_ICON_NAME$2 = ui_iconSet_api_vue.Outline.FOLDER;

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
	      if (props.item.type === BLOCK_TYPES$1.TOOL) {
	        baseStyles['--rounded'] = true;
	      }
	      return baseStyles;
	    });
	    const dragPayload = ui_vue3.computed(() => ({
	      dragData: preparedBlock,
	      dragImage: draggedItem
	    }));
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
	        icon = DEFAULT_ICON_NAME$2,
	        defaultSettings: {
	          width,
	          height,
	          ports = {
	            input: [],
	            output: [],
	            aux: [],
	            topAux: []
	          }
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
	          type
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
	      getBackgroundImage
	    };
	  },
	  template: `
		<div
			v-drag-block="getDragPayload"
			:class="catalogItemClassNames"
			:data-test-id="$testId('catalogItem', item.id)"
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
	const ICON_CLASS_NAMES$3 = {
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
	        [ICON_CLASS_NAMES$3.base]: true,
	        [ICON_CLASS_NAMES$3.collapsed]: this.collapsed
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
	    return {
	      getMessage,
	      titleClassNames
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
						:key="item.id"
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

	const setUserSelectedBlock = (blockId = null) => {
	  RequestQueue.add(() => post('Integration.AiAssistant.Block.set', {
	    blockId
	  }));
	};
	class RequestQueue {
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
	RequestQueue.processingRequest = null;
	RequestQueue.nextRequest = null;

	// @vue/component
	const BlockDiagram$1 = {
	  name: 'BlockDiagramWidget',
	  components: {
	    BlockDiagramEntity: BlockDiagram
	  },
	  props: {
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    const showBlockSettings = ui_vue3.inject('showBlockSettings');
	    const animationQueue = ui_blockDiagram.useAnimationQueue();
	    const diagramStore$$1 = diagramStore();
	    const {
	      blocks: blocksInStore,
	      connections: connectionsInStore
	    } = ui_vue3_pinia.storeToRefs(diagramStore$$1);
	    const {
	      getMessage
	    } = useLoc();
	    const highlightedBlocks = ui_blockDiagram.useHighlightedBlocks();
	    const highlitedBlockIds = highlightedBlocks.highlitedBlockIds;
	    const {
	      isFeatureAvailable
	    } = useFeature();
	    const blocks = ui_vue3.computed({
	      get() {
	        return ui_vue3.toValue(blocksInStore);
	      },
	      set(newBlocks) {
	        diagramStore$$1.setBlocks(newBlocks);
	        fetchUpdateDiagram();
	      }
	    });
	    const connections = ui_vue3.computed({
	      get() {
	        return ui_vue3.toValue(connectionsInStore);
	      },
	      set(newConnections) {
	        diagramStore$$1.setConnections(newConnections);
	        fetchUpdateDiagram();
	      }
	    });
	    const fetchUpdateDiagram = main_core.Runtime.debounce(updateDiagramData, 700);
	    async function updateDiagramData() {
	      const maxAttempts = 3;
	      let attempt = 0;
	      while (attempt < maxAttempts) {
	        try {
	          // eslint-disable-next-line no-await-in-loop
	          await diagramStore$$1.publicDraft();
	          diagramStore$$1.updateStatus(true);
	          return;
	        } catch {
	          attempt++;
	          if (attempt >= maxAttempts) {
	            diagramStore$$1.updateStatus(false);
	            ui_notification.UI.Notification.Center.notify({
	              content: getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED_HINT'),
	              autoHideDelay: 4000
	            });
	          }
	        }
	      }
	    }
	    function onDropNewBlock(block) {
	      try {
	        diagramStore$$1.setBlockCurrentTimestamp(block);
	        diagramStore$$1.publicDraft();
	        diagramStore$$1.updateStatus(true);
	      } catch {
	        diagramStore$$1.updateStatus(false);
	      }
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
	    return {
	      blocks,
	      connections,
	      blockSlotNames: BLOCK_SLOT_NAMES,
	      connectionSlotNames: CONNECTION_SLOT_NAMES,
	      onBlockTransitionEnd,
	      onDropNewBlock,
	      highlitedBlockIds,
	      isFeatureAvailable
	    };
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
			@blockTransitionEnd="onBlockTransitionEnd"
			@dropNewBlock="onDropNewBlock"
		>
			<template #[blockSlotNames.SIMPLE]="{ block }">
				<slot
					:name="blockSlotNames.SIMPLE"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.TRIGGER]="{ block }">
				<slot
					:name="blockSlotNames.TRIGGER"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.COMPLEX]="{ block }">
				<slot
					:name="blockSlotNames.COMPLEX"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.COMPLEX]="{ block }">
				<slot
					:name="blockSlotNames.COMPLEX"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.TOOL]="{ block }">
				<slot
					:name="blockSlotNames.TOOL"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.FRAME]="{ block }">
				<slot
					:name="blockSlotNames.FRAME"
					:block="block"
				/>
			</template>

			<template #[connectionSlotNames.AUX]="{ connection }">
				<slot
					:name="connectionSlotNames.AUX"
					:connection="connection"
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
	      deleteBlockById,
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
			@click="onDeleteBlock"
		/>
	`
	};

	// @vue/component
	const UpdatePublishedStatusLabel = {
	  name: 'UpdatePublishedStatusLabel',
	  components: {
	    BlockStatusNotPublished
	  },
	  props: {
	    /** @type Block */
	    block: {
	      type: Object,
	      required: true
	    }
	  },
	  setup(props) {
	    const diagramStore$$1 = diagramStore();
	    const isPublished = ui_vue3.computed(() => {
	      const updated = diagramStore$$1.blockCurrentTimestamps[props.block.id];
	      const published = diagramStore$$1.blockSavedTimestamps[props.block.id];
	      return updated === published;
	    });
	    return {
	      isPublished
	    };
	  },
	  template: `
		<BlockStatusNotPublished v-if="!isPublished"/>
	`
	};

	const PORT_POSITIONS$1 = {
	  right: 'right'
	};
	const AddComplexBlockPort = {
	  name: 'add-complex-block-port',
	  props: {
	    position: {
	      type: String,
	      required: true
	    },
	    highlighted: {
	      type: Boolean,
	      required: true
	    }
	  },
	  computed: {
	    pointClasses() {
	      return {
	        '--right': this.position === PORT_POSITIONS$1.right,
	        '--highlighted': this.highlighted
	      };
	    }
	  },
	  template: `
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="9"
			height="9"
			viewBox="0 0 9 9"
			fill="none"
			class="complex-block-port-add-point"
			:class="pointClasses"
		>
			<circle cx="4.5" cy="4.5" r="4" fill="white" stroke="#DFE0E3"/>
			<rect x="4" y="2" width="1" height="5" rx="0.5" fill="#DFE0E3"/>
			<rect x="2" y="5" width="1" height="5" rx="0.5" transform="rotate(-90 2 5)" fill="#DFE0E3"/>
		</svg>
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
	        var _this$template$NAME, _this$template;
	        return (_this$template$NAME = (_this$template = this.template) == null ? void 0 : _this$template.NAME) != null ? _this$template$NAME : '';
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
	const PublishDropdownButton = {
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
	    ...ui_vue3_pinia.mapState(diagramStore, ['templatePublishStatus']),
	    icon() {
	      const icons = {
	        [TEMPLATE_PUBLISH_STATUSES.MAIN]: 'ui-btn-icon-workflow',
	        [TEMPLATE_PUBLISH_STATUSES.USER]: 'ui-btn-icon-person',
	        [TEMPLATE_PUBLISH_STATUSES.FULL]: 'ui-btn-icon-workflow-stop'
	      };
	      return icons[this.templatePublishStatus];
	    }
	  },
	  methods: {
	    ...ui_vue3_pinia.mapActions(diagramStore, ['publicTemplate']),
	    publishTemplate() {
	      ({
	        [TEMPLATE_PUBLISH_STATUSES.MAIN]: this.fetchPublishMainTemplate,
	        [TEMPLATE_PUBLISH_STATUSES.USER]: this.fetchPublishUserTemplate,
	        [TEMPLATE_PUBLISH_STATUSES.FULL]: this.fetchPublishFullTemplate
	      })[this.templatePublishStatus]();
	    },
	    async fetchPublishMainTemplate() {
	      this.isLoading = true;
	      try {
	        var _this$$Bitrix$Loc$get;
	        await this.publicTemplate();
	        ui_notification.UI.Notification.Center.notify({
	          content: (_this$$Bitrix$Loc$get = this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_MENU_SAVE_SUCCESS')) != null ? _this$$Bitrix$Loc$get : '',
	          autoHideDelay: 5000
	        });
	      } catch (error) {
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
	    }
	  },
	  template: `
		<DropdownMenuButton
			:text="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLISH')"
			:icon="icon"
			:loading="isLoading"
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
	        var _this$$refs$blockCont, _this$$refs$blockCont2, _this$$refs$blockCont3;
	        const {
	          width,
	          height
	        } = (_this$$refs$blockCont = (_this$$refs$blockCont2 = this.$refs.blockContainer) == null ? void 0 : (_this$$refs$blockCont3 = _this$$refs$blockCont2.$el) == null ? void 0 : _this$$refs$blockCont3.getBoundingClientRect()) != null ? _this$$refs$blockCont : {};
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

	const HIDE_SETTINGS_DELAY = 300;
	var _loc = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loc");
	var _history = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("history");
	var _appStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appStore");
	var _commonNodeSettingsStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("commonNodeSettingsStore");
	var _complexNodeSettingsStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("complexNodeSettingsStore");
	var _diagramStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("diagramStore");
	class BlockMediator {
	  constructor() {
	    Object.defineProperty(this, _loc, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _history, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _appStore, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _commonNodeSettingsStore, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _complexNodeSettingsStore, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _diagramStore, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _loc)[_loc] = useLoc();
	    babelHelpers.classPrivateFieldLooseBase(this, _history)[_history] = ui_blockDiagram.useHistory();
	    babelHelpers.classPrivateFieldLooseBase(this, _appStore)[_appStore] = useAppStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _commonNodeSettingsStore)[_commonNodeSettingsStore] = useCommonNodeSettingsStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _complexNodeSettingsStore)[_complexNodeSettingsStore] = useNodeSettingsStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _diagramStore)[_diagramStore] = diagramStore();
	  }
	  isCurrentBlock(blockId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _commonNodeSettingsStore)[_commonNodeSettingsStore].isCurrentBlock(blockId) || babelHelpers.classPrivateFieldLooseBase(this, _complexNodeSettingsStore)[_complexNodeSettingsStore].isCurrentBlock(blockId);
	  }
	  hideAllSettings() {
	    return new Promise(resolve => {
	      babelHelpers.classPrivateFieldLooseBase(this, _appStore)[_appStore].hideRightPanel();
	      babelHelpers.classPrivateFieldLooseBase(this, _commonNodeSettingsStore)[_commonNodeSettingsStore].hideSettings();
	      babelHelpers.classPrivateFieldLooseBase(this, _complexNodeSettingsStore)[_complexNodeSettingsStore].toggleVisibility(false);
	      setTimeout(() => resolve(), HIDE_SETTINGS_DELAY);
	    });
	  }
	  hideCurrentBlockSettings(blockId) {
	    if (this.isCurrentBlock(blockId)) {
	      this.hideAllSettings();
	    }
	  }
	  async showNodeSettings(block) {
	    const notReallyComplexBlock = ['ForEachActivity', 'IfElseBranchActivity'];
	    if (block.type === BLOCK_TYPES$1.COMPLEX && !notReallyComplexBlock.includes(block.activity.Type)) {
	      this.showComplexNodeSettings(block);
	      return;
	    }
	    this.showCommonNodeSettings(block);
	  }
	  async showCommonNodeSettings(block) {
	    await this.hideAllSettings();
	    babelHelpers.classPrivateFieldLooseBase(this, _appStore)[_appStore].showRightPanel();
	    babelHelpers.classPrivateFieldLooseBase(this, _commonNodeSettingsStore)[_commonNodeSettingsStore].showSettings(block);
	  }
	  async showComplexNodeSettings(block) {
	    await this.hideAllSettings();
	    babelHelpers.classPrivateFieldLooseBase(this, _appStore)[_appStore].showRightPanel();
	    babelHelpers.classPrivateFieldLooseBase(this, _complexNodeSettingsStore)[_complexNodeSettingsStore].toggleVisibility(true);
	    await babelHelpers.classPrivateFieldLooseBase(this, _complexNodeSettingsStore)[_complexNodeSettingsStore].fetchNodeSettings(block);
	  }
	  getCtxMenuItemShowSimpleSettings(block) {
	    return {
	      id: 'showSimpleSettings',
	      text: babelHelpers.classPrivateFieldLooseBase(this, _loc)[_loc].getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_OPEN'),
	      onclick: () => this.showNodeSettings(block)
	    };
	  }
	  getCtxMenuItemShowComplexSettings(block) {
	    return {
	      id: 'showComplexSettings',
	      text: babelHelpers.classPrivateFieldLooseBase(this, _loc)[_loc].getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_OPEN'),
	      onclick: () => this.showNodeSettings(block)
	    };
	  }
	  getCtxMenuItemDeleteBlock(block) {
	    return {
	      id: 'deleteBlock',
	      text: babelHelpers.classPrivateFieldLooseBase(this, _loc)[_loc].getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'),
	      onclick: () => {
	        this.hideCurrentBlockSettings(block.id);
	        babelHelpers.classPrivateFieldLooseBase(this, _diagramStore)[_diagramStore].deleteBlockById(block.id);
	        babelHelpers.classPrivateFieldLooseBase(this, _history)[_history].makeSnapshot();
	      }
	    };
	  }
	}

	// @vue/component
	const BlockSimple = {
	  name: 'BlockSimple',
	  components: {
	    MoveableBlock: ui_blockDiagram.MoveableBlock,
	    AutosizeBlockContainer,
	    BlockLayout,
	    BlockHeader,
	    BlockIcon,
	    DeleteBlockIconBtn,
	    UpdatePublishedStatusLabel,
	    IconDivider,
	    IconButton,
	    PortsInOutCenter
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
	  computed: {
	    isBlockActivated() {
	      return isBlockActivated(this.block);
	    }
	  },
	  setup(props) {
	    return {
	      iconSet: ui_iconSet_api_vue.Outline,
	      blockMediator: new BlockMediator()
	    };
	  },
	  template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated }">
				<AutosizeBlockContainer
					:blockId="block.id"
					:autosize="autosize"
					:width="block.dimensions.width"
					:height="block.dimensions.height"
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemShowSimpleSettings(block),
						blockMediator.getCtxMenuItemDeleteBlock(block),
					]"
					@dblclick.stop="blockMediator.showNodeSettings(block)"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="[
							blockMediator.getCtxMenuItemShowSimpleSettings(block),
							blockMediator.getCtxMenuItemDeleteBlock(block),
						]"
						:dragged="isDragged"
						:disabled="isDisabled"
					>
						<template #top-menu>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
						</template>

						<template #default>
							<PortsInOutCenter
								:block="block"
								:disabled="isDisabled"
							>
								<BlockHeader :block="block">
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon"
											:iconColorIndex="block.node.colorIndex"
										/>
									</template>
								</BlockHeader>
							</PortsInOutCenter>
						</template>

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
				</AutosizeBlockContainer>
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
	    BlockLayout,
	    BlockHeader,
	    BlockIcon,
	    DeleteBlockIconBtn,
	    UpdatePublishedStatusLabel,
	    IconDivider,
	    IconButton,
	    PortsInOutCenter,
	    BlockSwitcher
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
	  computed: {
	    isBlockActivated() {
	      return isBlockActivated(this.block);
	    }
	  },
	  setup(props) {
	    const onToggleBlockActivation = ui_vue3.inject('onToggleBlockActivation');
	    function toggleBlock() {
	      if (!onToggleBlockActivation) {
	        console.warn('onToggleBlockActivation is not provided');
	        return;
	      }
	      onToggleBlockActivation(props.block.id);
	    }
	    return {
	      iconSet: ui_iconSet_api_vue.Outline,
	      blockMediator: new BlockMediator(),
	      toggleBlock
	    };
	  },
	  template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled }">
				<AutosizeBlockContainer
					:blockId="block.id"
					:autosize="autosize"
					:width="block.dimensions.width"
					:height="block.dimensions.height"
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemShowSimpleSettings(block),
						blockMediator.getCtxMenuItemDeleteBlock(block),
					]"
					@dblclick.stop="blockMediator.showNodeSettings(block)"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="[
							blockMediator.getCtxMenuItemShowSimpleSettings(block),
							blockMediator.getCtxMenuItemDeleteBlock(block),
						]"
						:dragged="isDragged"
						:disabled="isDisabled"
					>
						<template #top-menu>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
						</template>

						<template #default>
							<PortsInOutCenter
								:block="block"
								:disabled="isDisabled"
								hideInputPorts
							>
								<BlockHeader :block="block">
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon"
											:iconColorIndex="block.node.colorIndex"
										/>
									</template>
								</BlockHeader>
							</PortsInOutCenter>
						</template>

						<template #left>
							<BlockSwitcher
								:on="isBlockActivated"
								@click="toggleBlock"
							/>
						</template>

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
				</AutosizeBlockContainer
					:blockId="block.id"
					:autosize="block.node.autosize"
					:width="block.dimensions.width"
					:height="block.dimensions.height">
			</template>
		</MoveableBlock>
	`
	};

	// @vue/component
	const BlockComplex = {
	  name: 'block-complex',
	  components: {
	    MoveableBlock: ui_blockDiagram.MoveableBlock,
	    BlockContainer,
	    BlockLayout,
	    BlockHeader,
	    BlockIcon,
	    DeleteBlockIconBtn,
	    IconDivider,
	    IconButton,
	    PortsInOutCenter,
	    BlockComplexContent,
	    AddComplexBlockPort,
	    UpdatePublishedStatusLabel
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
	      blockMediator: new BlockMediator()
	    };
	  },
	  methods: {
	    ...ui_vue3_pinia.mapActions(useNodeSettingsStore, ['fetchNodeSettings', 'toggleVisibility']),
	    onBlockDblClick() {
	      this.toggleVisibility(true);
	      this.fetchNodeSettings(this.block);
	    }
	  },
	  computed: {
	    isBlockActivated() {
	      return isBlockActivated(this.block);
	    }
	  },
	  template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled }">
				<BlockContainer
					:width="200"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemShowComplexSettings(block),
						blockMediator.getCtxMenuItemDeleteBlock(block),
					]"
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					@dblclick.stop="blockMediator.showNodeSettings(block)"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="[
							blockMediator.getCtxMenuItemShowComplexSettings(block),
							blockMediator.getCtxMenuItemDeleteBlock(block),
						]"
						:dragged="isDragged"
						:disabled="isDisabled"
					>
						<template #top-menu>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
						</template>

						<template #default>
							<BlockComplexContent
								:block="block"
								:disabled="isDisabled"
							>
								<template #header>
									<BlockHeader :block="block">
										<template #icon>
											<BlockIcon
												:iconName="block.node.icon"
												:iconColorIndex="block.node.colorIndex"
											/>
										</template>
									</BlockHeader>
								</template>
								<!--
								<template #addPortPoint="{ position }">
									<AddComplexBlockPort
										:position="position"
										:highlighted="isHighlighted"
									/>
								</template>
								-->
							</BlockComplexContent>
						</template>

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`
	};

	// @vue/component
	const BlockTool = {
	  name: 'BlockTool',
	  components: {
	    MoveableBlock: ui_blockDiagram.MoveableBlock,
	    BlockContainer,
	    BlockLayout,
	    BlockHeader,
	    BlockIcon,
	    DeleteBlockIconBtn,
	    UpdatePublishedStatusLabel,
	    IconDivider,
	    IconButton,
	    PortsInOutCenter
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
	      blockMediator: new BlockMediator()
	    };
	  },
	  methods: {
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
	    }
	  },
	  computed: {
	    isBlockActivated() {
	      return isBlockActivated(this.block);
	    }
	  },
	  template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled }">
				<BlockContainer
					:width="200"
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemShowSimpleSettings(block),
						blockMediator.getCtxMenuItemDeleteBlock(block),
					]"
					@dblclick.stop="blockMediator.showCommonNodeSettings(block)"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="[
							blockMediator.getCtxMenuItemShowSimpleSettings(block),
							blockMediator.getCtxMenuItemDeleteBlock(block),
						]"
						:dragged="isDragged"
						:disabled="isDisabled"
					>
						<template #top-menu>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
						</template>

						<template #default>
							<PortsInOutCenter
								:block="block"
								:disabled="isDisabled"
							>
								<BlockHeader :block="block" :subIconExternal="isUrl(block.node?.icon)">
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon === 'DATABASE' ? block.node.icon : 'MCP_LETTERS'"
											:iconColorIndex="0"
										/>
									</template>
									<template #subIcon v-if="block.node?.icon && block.node.icon !== 'DATABASE'">
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
							</PortsInOutCenter>
						</template>

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
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
	    BlockTopTitle,
	    DeleteBlockIconBtn,
	    UpdatePublishedStatusLabel,
	    IconDivider,
	    IconButton
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
	      blockMediator: new BlockMediator()
	    };
	  },
	  computed: {
	    isBlockActivated() {
	      return isBlockActivated(this.block);
	    }
	  },
	  template: `
		<ResizableBlock :block="block">
			<template #default="{ isHighlighted, isResize, isDragged, isDisabled }">
				<BlockContainer
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemDeleteBlock(block)
					]"
					colorName="orange"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="[
							blockMediator.getCtxMenuItemDeleteBlock(block)
						]"
						:dragged="isDragged"
						:resized="isResize"
						:disabled="isDisabled"
					>
						<template #top-menu-title>
							<BlockTopTitle :title="block.node.title"/>
						</template>

						<template #top-menu>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
							<IconButton :icon-name="iconSet.PAUSE_L"/>
							<IconButton :icon-name="iconSet.QUESTION"/>
						</template>

						<template #default>
						</template>

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
				</BlockContainer>
			</template>
		</ResizableBlock>
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
	    getDiagramMenu() {
	      return {
	        items: [{
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
	const AutosaveStatus$1 = {
	  name: 'AutosaveStatus',
	  components: {
	    AutosaveStatusEntity: AutosaveStatus
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
	    var _this$template$NAME, _this$template, _this$template$DESCRI, _this$template2;
	    this.localName = (_this$template$NAME = (_this$template = this.template) == null ? void 0 : _this$template.NAME) != null ? _this$template$NAME : '';
	    this.localDescription = (_this$template$DESCRI = (_this$template2 = this.template) == null ? void 0 : _this$template2.DESCRIPTION) != null ? _this$template$DESCRI : '';
	  },
	  mounted() {
	    this.getDialog().setContent(this.$refs.content);
	    this.getDialog().show();
	  },
	  unmounted() {
	    var _this$instance;
	    (_this$instance = this.instance) == null ? void 0 : _this$instance.hide();
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
	const PublishDropdownButton$1 = {
	  name: 'PublishDropdownButton',
	  components: {
	    PublishDropdownButtonFeature: PublishDropdownButton,
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

	// @vue/components
	const CommonNodeSettings = {
	  name: 'CommonNodeSettings',
	  components: {
	    CommonNodeSettingsForm,
	    BlockIcon
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(useCommonNodeSettingsStore, ['isVisible', 'block']),
	    ...ui_vue3_pinia.mapState(diagramStore, ['documentType'])
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
	    function onMouseOver() {
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
	      var _currentGroup$value;
	      return props.group.id === (currentGroup == null ? void 0 : (_currentGroup$value = currentGroup.value) == null ? void 0 : _currentGroup$value.id);
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
	const AppLayout$1 = {
	  name: 'AppLayoutWidget',
	  components: {
	    AppLayoutEntity: AppLayout
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(useAppStore, ['isShownRightPanel', 'isShownPreviewPanel'])
	  },
	  template: `
		<AppLayoutEntity
			:showSettings="isShownRightPanel"
			:showPreviewPanel="isShownPreviewPanel"
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

			<template #settings>
				<slot name="settings"/>
			</template>
		</AppLayoutEntity>
	`
	};

	// @vue/component
	const AppHeader$1 = {
	  name: 'AppHeader',
	  components: {
	    AppHeaderEntity: AppHeader,
	    AppHeaderDivider,
	    LogoLayout,
	    LogoBackBtn,
	    LogoTitle
	  },
	  setup() {
	    const diagramStore$$1 = diagramStore();
	    const {
	      companyName
	    } = ui_vue3_pinia.storeToRefs(diagramStore$$1);
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
	    AppLayout: AppLayout$1,
	    AppHeader: AppHeader$1,
	    BlockDiagram: BlockDiagram$1,
	    BlockSimple,
	    BlockTrigger,
	    BlockComplex,
	    BlockTool,
	    BlockFrame,
	    DiagramMenu,
	    AutosaveStatus: AutosaveStatus$1,
	    TemplateName,
	    PublishDropdownButton: PublishDropdownButton$1,
	    ZoomBar: ui_blockDiagram.ZoomBar,
	    ComplexNodeSettings: NodeSettings,
	    NodeSettingsRules,
	    HistoryBar: ui_blockDiagram.HistoryBar,
	    SearchBar,
	    Catalog,
	    CommonNodeSettings,
	    ConnectionAux
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
	        blockCurrentTimestamps: ui_vue3.markRaw(JSON.parse(JSON.stringify(diagramStore().blockCurrentTimestamps)))
	      };
	    };
	    const revertHandler = snapshot => {
	      commonRevertHandler(snapshot);
	      diagramStore().setBlockCurrentTimestamps(snapshot.blockCurrentTimestamps);
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
	          startTrigger: props.initStartTrigger
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
	      dragItemSlotNames: DRAG_ITEM_SLOT_NAMES
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapWritableState(diagramStore, ['documentTypeSigned', 'templateId'])
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
				<BlockDiagram :disabled="isDiagramDisabled">
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

					<template #[connectionSlotNames.AUX]="{ connection }">
						<ConnectionAux :connection="connection" />
					</template>
				</BlockDiagram>
			</template>

			<template #catalog>
				<Catalog>
					<template #[dragItemSlotNames.simple]="{ item }">
						<BlockSimple
							:block="item"
							autosize
						/>
					</template>

					<template #[dragItemSlotNames.trigger]="{ item }">
						<BlockTrigger
							:block="item"
							autosize
						/>
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
				</Catalog>
			</template>

			<template #top-right-toolbar>
				<HistoryBar/>
				<SearchBar/>
			</template>

			<template #bottom-right-toolbar>
				<ZoomBar :stepZoom="0.2"/>
			</template>

			<template #settings>
				<CommonNodeSettings/>

				<ComplexNodeSettings>
					<NodeSettingsRules />
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

}((this.BX.Bizprocdesigner.Editor = this.BX.Bizprocdesigner.Editor || {}),BX,BX.UI,BX.UI.Vue3.Components,BX.Vue3.Directives,BX,BX.UI.EntitySelector,BX.Main,BX.Event,BX.UI.Dialogs,BX.UI.Vue3.Components,BX.UI.Feedback,BX.Bizprocdesigner,BX,BX.UI,BX.Vue3.Components,BX.UI.IconSet,BX,BX.UI,BX.UI.System,BX.UI.IconSet,BX.Vue3,BX.Vue3.Pinia));
//# sourceMappingURL=chart.bundle.js.map
