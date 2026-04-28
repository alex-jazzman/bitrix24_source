/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Ai = this.BX.Bizproc.Ai || {};
(function (exports,bizproc_aiAgents_grid,main_popup,main_sidepanel,ui_entitySelector,im_public,humanresources_companyStructure_public,ui_avatar,main_date,ui_buttons,ui_infoHelper,ui_system_typography,main_core_events,bizproc_setupTemplate,main_core,ui_dialogs_messagebox) {
	'use strict';

	var _fieldId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldId");
	var _gridId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("gridId");
	var _fieldNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldNode");
	class BaseField {
	  constructor(params) {
	    Object.defineProperty(this, _fieldId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _gridId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _fieldNode, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldId)[_fieldId] = params == null ? void 0 : params.fieldId;
	    babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId] = params == null ? void 0 : params.gridId;
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldNode)[_fieldNode] = params == null ? void 0 : params.fieldNode;
	  }
	  setFieldNode(node) {
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldNode)[_fieldNode] = node;
	  }
	  getGridId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId];
	  }
	  getFieldId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _fieldId)[_fieldId];
	  }
	  getGridManager() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId]) {
	      return null;
	    }
	    return bizproc_aiAgents_grid.GridManager.getInstance(babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId]);
	  }
	  getFieldNode() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _fieldNode)[_fieldNode]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _fieldNode)[_fieldNode] = document.getElementById(this.getFieldId());
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _fieldNode)[_fieldNode];
	  }
	  appendToFieldNode(element) {
	    main_core.Dom.append(element, this.getFieldNode());
	  }
	}

	class AgentInfoField extends BaseField {
	  render(params) {
	    var _params$name, _params$description;
	    const agentName = (_params$name = params.name) != null ? _params$name : '';
	    const agentDescription = (_params$description = params.description) != null ? _params$description : '';
	    const nameNode = this.createAgentNameNode(agentName);
	    main_core.Dom.attr(nameNode, 'data-test-id', 'bizproc-ai-agents-grid-agent-title');
	    main_core.Dom.attr(nameNode, 'title', agentName);
	    const descriptionNode = this.createAgentDescriptionNode(agentDescription);
	    main_core.Dom.attr(descriptionNode, 'title', agentDescription);
	    this.appendToFieldNode(nameNode);
	    this.appendToFieldNode(descriptionNode);
	  }
	  createAgentNameNode(agentName) {
	    return ui_system_typography.Text.render(agentName, {
	      size: 'md',
	      accent: true,
	      tag: 'div',
	      className: 'bizproc-ai-agents-grid-agent-name bizproc-ai-agents-one-line-height'
	    });
	  }
	  createAgentDescriptionNode(agentDescription) {
	    return ui_system_typography.Text.render(agentDescription, {
	      size: 'xs',
	      accent: false,
	      tag: 'div',
	      className: 'bizproc-ai-agents-grid-agent-description bizproc-ai-agents-two-lines-height'
	    });
	  }
	}

	class GridIcons {}
	GridIcons.LOAD = `
		<svg class="agent-grid-load-icon" width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clip-path="url(#clip0_762_45517)">
				<rect class="agent-grid-load-bar" y="16" width="4" height="5"/>
			</g>
			<g clip-path="url(#clip1_762_45517)">
				<rect class="agent-grid-load-bar" x="6" y="12" width="4" height="10"/>
			</g>
			<g clip-path="url(#clip2_762_45517)">
				<rect class="agent-grid-load-bar" x="12" y="8" width="4" height="20"/>
			</g>
			<g clip-path="url(#clip3_762_45517)">
				<rect class="agent-grid-load-bar" x="18" y="-8" width="4" height="28"/>
			</g>
			<g clip-path="url(#clip4_762_45517)">
				<rect class="agent-grid-load-bar" x="24" width="4" height="38"/>
			</g>
			<defs>
				<clipPath id="clip0_762_45517">
				<path d="M0 18C0 16.8954 0.895431 16 2 16C3.10457 16 4 16.8954 4 18V20H0V18Z" fill="white" />
				</clipPath>
				<clipPath id="clip1_762_45517">
				<path d="M6 14C6 12.8954 6.89543 12 8 12C9.10457 12 10 12.8954 10 14V20H6V14Z" fill="white" />
				</clipPath>
				<clipPath id="clip2_762_45517">
				<path d="M12 10C12 8.89543 12.8954 8 14 8C15.1046 8 16 8.89543 16 10V20H12V10Z" fill="white" />
				</clipPath>
				<clipPath id="clip3_762_45517">
				<path d="M18 6C18 4.89543 18.8954 4 20 4C21.1046 4 22 4.89543 22 6V20H18V6Z" fill="white" />
				</clipPath>
				<clipPath id="clip4_762_45517">
				<path d="M24 2C24 0.895431 24.8954 0 26 0C27.1046 0 28 0.895431 28 2V20H24V2Z" fill="white" />
				</clipPath>
			</defs>
		</svg>
	`;
	GridIcons.AGENT_CHAT = `
		<svg class="agent-grid-chat-icon-img" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
			d="M10.1064 3.64648C11.349 3.64655 12.3564 4.65388 12.3564 5.89648V6.49707H13.0693C14.229 6.49707 15.1697 7.43706 15.1699 8.59668V11.3604C15.1699 12.1141 14.7723 12.7751 14.1758 13.1455V13.7129C14.1756 14.6424 13.0518 15.1075 12.3945 14.4502L11.4043 13.4609H8.83984C7.6802 13.4608 6.74023 12.52 6.74023 11.3604V8.59668C6.74045 7.43718 7.68033 6.49726 8.83984 6.49707H11.3066V5.89648C11.3066 5.23378 10.7691 4.69635 10.1064 4.69629H5.08008C4.41751 4.69649 3.88086 5.23386 3.88086 5.89648V8.82227C3.8809 9.26438 4.11903 9.65203 4.47949 9.86133L5.00293 10.165V11.6611L5.89355 10.7715V11.3203C5.89355 11.5894 5.96379 11.8422 6.08789 12.0605L5.73438 12.415C5.07702 13.0724 3.95312 12.6064 3.95312 11.6768V10.7695C3.28205 10.3802 2.83012 9.65397 2.83008 8.82227V5.89648C2.83008 4.65397 3.83761 3.64668 5.08008 3.64648H10.1064ZM8.83984 7.54688C8.26023 7.54706 7.79025 8.01707 7.79004 8.59668V11.3604C7.79004 11.9401 8.2601 12.41 8.83984 12.4102H11.8389L13.126 13.6973V12.5615L13.6221 12.2539C13.923 12.067 14.1191 11.7361 14.1191 11.3604V8.59668C14.1189 8.01696 13.6491 7.54688 13.0693 7.54688H8.83984Z"
			fill="#525C69"/>
		</svg>
	`;
	GridIcons.DEPARTMENT = `
			<svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
		    <path fill-rule="evenodd" clip-rule="evenodd"
		        d="M1.95676 6.28648C2.77587 5.81165 3.78874 5.66414 4.70642 5.66414C5.62411 5.66414 6.63698 5.81165 7.45609 6.28648C8.29896 6.77509 8.90893 7.59628 9.0059 8.85475C9.03899 9.28426 8.68791 9.61043 8.29506 9.61043H1.11778C0.724933 9.61043 0.373856 9.28426 0.406952 8.85474C0.503923 7.59628 1.11389 6.77509 1.95676 6.28648ZM1.20349 8.82018H8.20935C8.11169 7.88548 7.66355 7.32017 7.05977 6.97016C6.41198 6.59465 5.55879 6.45438 4.70642 6.45438C3.85406 6.45438 3.00086 6.59465 2.35308 6.97016C1.7493 7.32017 1.30116 7.88548 1.20349 8.82018Z"
		        fill="white" />
		    <path fill-rule="evenodd" clip-rule="evenodd"
		        d="M4.27024 0.867925C4.10176 0.923778 3.97998 0.989802 3.92655 1.02913C3.41436 1.40617 3.16091 2.22309 3.34019 3.03986C3.51311 3.82762 4.00839 4.31314 4.70162 4.31314C5.1431 4.31314 5.46803 4.12537 5.70647 3.81951C5.95916 3.49536 6.11633 3.02833 6.12825 2.53082C6.14018 2.03261 6.00512 1.58104 5.77044 1.2737C5.5543 0.990653 5.22474 0.786338 4.70165 0.786338C4.59177 0.786338 4.43616 0.812924 4.27024 0.867925ZM3.45807 0.392728C1.78723 1.62268 2.34174 5.10338 4.70162 5.10338C7.53484 5.10338 7.77944 -0.00390625 4.70165 -0.00390625C4.2688 -0.00390625 3.73551 0.188492 3.45807 0.392728Z"
		        fill="white" />
		    <path fill-rule="evenodd" clip-rule="evenodd"
		        d="M7.35878 0.787574C7.84175 0.804938 8.15155 1.00343 8.35793 1.2737C8.59262 1.58104 8.72768 2.03261 8.71574 2.53082C8.70383 3.02833 8.54666 3.49536 8.29396 3.81951C8.05552 4.12537 7.73059 4.31314 7.28912 4.31314C7.25733 4.31314 7.22596 4.31212 7.19502 4.31009L6.67579 5.01706C6.86428 5.07305 7.06883 5.10338 7.28912 5.10338C10.1223 5.10338 10.3669 -0.00390625 7.28914 -0.00390625C7.10718 -0.00390625 6.90747 0.0300948 6.71648 0.084683L7.35878 0.787574ZM9.66755 9.61073H10.8825C11.2754 9.61073 11.6265 9.28456 11.5934 8.85505C11.4964 7.59658 10.8864 6.77539 10.0436 6.28678C9.43126 5.93184 8.71069 5.75979 8.00254 5.69554L9.00673 6.691C9.2353 6.76427 9.45073 6.85654 9.64725 6.97046C10.251 7.32047 10.6992 7.88578 10.7968 8.82049H9.66755V9.61073Z"
		        fill="white" />
		    <path fill-rule="evenodd" clip-rule="evenodd"
		        d="M1.95676 6.28648C2.77587 5.81165 3.78874 5.66414 4.70642 5.66414C5.62411 5.66414 6.63698 5.81165 7.45609 6.28648C8.29896 6.77509 8.90893 7.59628 9.0059 8.85475C9.03899 9.28426 8.68791 9.61043 8.29506 9.61043H1.11778C0.724933 9.61043 0.373856 9.28426 0.406952 8.85474C0.503923 7.59628 1.11389 6.77509 1.95676 6.28648ZM1.20349 8.82018H8.20935C8.11169 7.88548 7.66355 7.32017 7.05977 6.97016C6.41198 6.59465 5.55879 6.45438 4.70642 6.45438C3.85406 6.45438 3.00086 6.59465 2.35308 6.97016C1.7493 7.32017 1.30116 7.88548 1.20349 8.82018Z"
		        fill="white" />
		    <path fill-rule="evenodd" clip-rule="evenodd"
		        d="M4.27024 0.867925C4.10176 0.923778 3.97998 0.989802 3.92655 1.02913C3.41436 1.40617 3.16091 2.22309 3.34019 3.03986C3.51311 3.82762 4.00839 4.31314 4.70162 4.31314C5.1431 4.31314 5.46803 4.12537 5.70647 3.81951C5.95916 3.49536 6.11633 3.02833 6.12825 2.53082C6.14018 2.03261 6.00512 1.58104 5.77044 1.2737C5.5543 0.990653 5.22474 0.786338 4.70165 0.786338C4.59177 0.786338 4.43616 0.812924 4.27024 0.867925ZM3.45807 0.392728C1.78723 1.62268 2.34174 5.10338 4.70162 5.10338C7.53484 5.10338 7.77944 -0.00390625 4.70165 -0.00390625C4.2688 -0.00390625 3.73551 0.188492 3.45807 0.392728Z"
		        fill="white" />
		    <path fill-rule="evenodd" clip-rule="evenodd"
		        d="M7.35878 0.787574C7.84175 0.804938 8.15155 1.00343 8.35793 1.2737C8.59262 1.58104 8.72768 2.03261 8.71574 2.53082C8.70383 3.02833 8.54666 3.49536 8.29396 3.81951C8.05552 4.12537 7.73059 4.31314 7.28912 4.31314C7.25733 4.31314 7.22596 4.31212 7.19502 4.31009L6.67579 5.01706C6.86428 5.07305 7.06883 5.10338 7.28912 5.10338C10.1223 5.10338 10.3669 -0.00390625 7.28914 -0.00390625C7.10718 -0.00390625 6.90747 0.0300948 6.71648 0.084683L7.35878 0.787574ZM9.66755 9.61073H10.8825C11.2754 9.61073 11.6265 9.28456 11.5934 8.85505C11.4964 7.59658 10.8864 6.77539 10.0436 6.28678C9.43126 5.93184 8.71069 5.75979 8.00254 5.69554L9.00673 6.691C9.2353 6.76427 9.45073 6.85654 9.64725 6.97046C10.251 7.32047 10.6992 7.88578 10.7968 8.82049H9.66755V9.61073Z"
		        fill="white" />
		</svg>
	`;

	const AJAX_REQUEST_TYPE = {
	  COMPONENT: 'component',
	  CONTROLLER: 'controller'
	};
	const ACTION_TYPE = {
	  DELETE: 'delete',
	  GROUP_DELETE: 'group-delete',
	  EDIT: 'edit',
	  RESTART: 'restart'
	};
	const TEMPLATE_SETUP_EVENT_NAME = {
	  SUCCESS: 'Bizproc.AiAgentsGrid.TemplateSetup:success'
	};
	const USER_MINI_PROFILE_ATTRIBUTES = {
	  USER_ID: 'bx-tooltip-user-id',
	  CONTEXT: 'bx-tooltip-context'
	};
	const USER_MINI_PROFILE_CONTEXT = {
	  B24: 'b24'
	};
	const GRID_API_ACTION = {
	  START_TEMPLATE: 'Integration.AiAgent.Template.start',
	  COPY_AND_START_TEMPLATE: 'Integration.AiAgent.Template.copyAndStart',
	  FETCH_ROW: 'Integration.AiAgent.Template.fetchRow',
	  DELETE: 'Integration.AiAgent.Template.delete',
	  RESTART: 'Integration.AiAgent.Template.start'
	};

	class PhotoField extends BaseField {
	  render(params) {
	    var _params$user, _params$user2;
	    const avatarOptions = {
	      size: 24,
	      userpicPath: params == null ? void 0 : (_params$user = params.user) == null ? void 0 : _params$user.photoUrl
	    };
	    const avatar = new ui_avatar.AvatarRound(avatarOptions);
	    this.addMiniProfile(params);
	    avatar == null ? void 0 : avatar.renderTo(this.getFieldNode());
	    main_core.Dom.addClass(this.getFieldNode(), 'agent-grid_user-photo');
	    if (!(params != null && (_params$user2 = params.user) != null && _params$user2.id)) {
	      main_core.Dom.addClass(this.getFieldNode(), 'agent-grid_user-photo-stub');
	    }
	  }
	  addMiniProfile(params) {
	    var _params$user3;
	    main_core.Dom.attr(this.getFieldNode(), 'bx-tooltip-user-id', params == null ? void 0 : (_params$user3 = params.user) == null ? void 0 : _params$user3.id);
	    main_core.Dom.attr(this.getFieldNode(), 'bx-tooltip-context', 'b24');
	  }
	}

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6,
	  _t7,
	  _t8,
	  _t9,
	  _t10,
	  _t11;
	var _chatsPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("chatsPopup");
	var _renderCombinedView = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCombinedView");
	var _renderUsersOnlyView = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderUsersOnlyView");
	var _renderDepartmentsOnlyView = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderDepartmentsOnlyView");
	var _createAvatarsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createAvatarsContainer");
	var _createDepartmentsCounter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDepartmentsCounter");
	var _createDepartmentsNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDepartmentsNode");
	var _getDepartmentNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDepartmentNode");
	var _getDisplayedNumber = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDisplayedNumber");
	var _createCounterNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createCounterNode");
	var _createChatNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createChatNode");
	var _getChatNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatNode");
	var _getChatsCounterNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatsCounterNode");
	var _toggleChatsListPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toggleChatsListPopup");
	var _openChatsListPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openChatsListPopup");
	var _fillChatsListContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillChatsListContent");
	var _openCombinedPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openCombinedPopup");
	var _fillDepartmentsListContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillDepartmentsListContent");
	var _fillUsersListContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillUsersListContent");
	var _openUserProfile = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openUserProfile");
	var _handleBeforeSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleBeforeSelect");
	var _handleSelectDepartment = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSelectDepartment");
	var _handleSelectUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSelectUser");
	class UsedByField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _handleSelectUser, {
	      value: _handleSelectUser2
	    });
	    Object.defineProperty(this, _handleSelectDepartment, {
	      value: _handleSelectDepartment2
	    });
	    Object.defineProperty(this, _handleBeforeSelect, {
	      value: _handleBeforeSelect2
	    });
	    Object.defineProperty(this, _openUserProfile, {
	      value: _openUserProfile2
	    });
	    Object.defineProperty(this, _fillUsersListContent, {
	      value: _fillUsersListContent2
	    });
	    Object.defineProperty(this, _fillDepartmentsListContent, {
	      value: _fillDepartmentsListContent2
	    });
	    Object.defineProperty(this, _openCombinedPopup, {
	      value: _openCombinedPopup2
	    });
	    Object.defineProperty(this, _fillChatsListContent, {
	      value: _fillChatsListContent2
	    });
	    Object.defineProperty(this, _openChatsListPopup, {
	      value: _openChatsListPopup2
	    });
	    Object.defineProperty(this, _toggleChatsListPopup, {
	      value: _toggleChatsListPopup2
	    });
	    Object.defineProperty(this, _getChatsCounterNode, {
	      value: _getChatsCounterNode2
	    });
	    Object.defineProperty(this, _getChatNode, {
	      value: _getChatNode2
	    });
	    Object.defineProperty(this, _createChatNode, {
	      value: _createChatNode2
	    });
	    Object.defineProperty(this, _createCounterNode, {
	      value: _createCounterNode2
	    });
	    Object.defineProperty(this, _getDisplayedNumber, {
	      value: _getDisplayedNumber2
	    });
	    Object.defineProperty(this, _getDepartmentNode, {
	      value: _getDepartmentNode2
	    });
	    Object.defineProperty(this, _createDepartmentsNode, {
	      value: _createDepartmentsNode2
	    });
	    Object.defineProperty(this, _createDepartmentsCounter, {
	      value: _createDepartmentsCounter2
	    });
	    Object.defineProperty(this, _createAvatarsContainer, {
	      value: _createAvatarsContainer2
	    });
	    Object.defineProperty(this, _renderDepartmentsOnlyView, {
	      value: _renderDepartmentsOnlyView2
	    });
	    Object.defineProperty(this, _renderUsersOnlyView, {
	      value: _renderUsersOnlyView2
	    });
	    Object.defineProperty(this, _renderCombinedView, {
	      value: _renderCombinedView2
	    });
	    Object.defineProperty(this, _chatsPopup, {
	      writable: true,
	      value: void 0
	    });
	  }
	  render(params) {
	    const {
	      users = [],
	      chats = [],
	      departments = {}
	    } = params;
	    const container = main_core.Tag.render(_t || (_t = _`
			<div class="agent-grid-used-by-container"></div>
		`));
	    const hasUsers = users && users.length > 0;
	    const hasDepartments = departments && Object.keys(departments).length > 0;
	    if (hasUsers && hasDepartments) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderCombinedView)[_renderCombinedView](container, departments, users);
	    } else if (hasDepartments) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderDepartmentsOnlyView)[_renderDepartmentsOnlyView](container, departments, users);
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderUsersOnlyView)[_renderUsersOnlyView](container, departments, users);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _createChatNode)[_createChatNode](container, chats);
	    this.appendToFieldNode(container);
	  }
	  openChat(chatId) {
	    if (!chatId) {
	      return;
	    }
	    im_public.Messenger.openChat(chatId);
	  }
	}
	function _renderCombinedView2(container, departments, users) {
	  const combinedViewWrapper = main_core.Tag.render(_t2 || (_t2 = _`
			<div class="agent-grid-used-by-container-with-users-and-departments"></div>
		`));
	  main_core.Dom.append(combinedViewWrapper, container);
	  babelHelpers.classPrivateFieldLooseBase(this, _createDepartmentsCounter)[_createDepartmentsCounter](combinedViewWrapper, departments, users, UsedByField.MAX_VISIBLE_AVATARS_COMBINED);
	  babelHelpers.classPrivateFieldLooseBase(this, _createAvatarsContainer)[_createAvatarsContainer](combinedViewWrapper, departments, users, UsedByField.MAX_VISIBLE_AVATARS_COMBINED);
	}
	function _renderUsersOnlyView2(container, departments, users) {
	  babelHelpers.classPrivateFieldLooseBase(this, _createAvatarsContainer)[_createAvatarsContainer](container, departments, users, UsedByField.MAX_VISIBLE_AVATARS_USERS_ONLY);
	}
	function _renderDepartmentsOnlyView2(container, departments, users) {
	  babelHelpers.classPrivateFieldLooseBase(this, _createDepartmentsNode)[_createDepartmentsNode](container, departments, users);
	}
	function _createAvatarsContainer2(container, departments, users, maxVisibleAvatars) {
	  const placeholderAvatarsCount = 3;
	  const avatarsContainer = main_core.Tag.render(_t3 || (_t3 = _`<div data-test-id="bizproc-ai-agents-grid-used-by-avatars-container" class="agent-grid-user-avatars"></div>`));
	  if (!users || users.length === 0) {
	    for (let i = 0; i < placeholderAvatarsCount; i++) {
	      const avatarContainer = main_core.Tag.render(_t4 || (_t4 = _`<span></span>`));
	      main_core.Dom.append(avatarContainer, avatarsContainer);
	      new PhotoField({
	        fieldNode: avatarContainer
	      }).render({});
	    }
	    main_core.Dom.append(avatarsContainer, container);
	    return;
	  }
	  users.slice(0, maxVisibleAvatars).forEach(user => {
	    const avatarContainer = main_core.Tag.render(_t5 || (_t5 = _`<span></span>`));
	    main_core.Dom.append(avatarContainer, avatarsContainer);
	    new PhotoField({
	      fieldNode: avatarContainer
	    }).render({
	      user
	    });
	  });
	  if (users.length > maxVisibleAvatars) {
	    const remainingCount = users.length - maxVisibleAvatars;
	    const counterClass = 'agent-grid-avatar-counter-number';
	    const counterWrapperClass = 'agent-grid-avatar-counter';
	    const counter = babelHelpers.classPrivateFieldLooseBase(this, _createCounterNode)[_createCounterNode](remainingCount, departments, users, counterClass, counterWrapperClass);
	    main_core.Dom.append(counter, avatarsContainer);
	  }
	  main_core.Dom.append(avatarsContainer, container);
	}
	function _createDepartmentsCounter2(container, departments, users, maxVisibleAvatars) {
	  const departmentsCount = Object.keys(departments).length;
	  if (departmentsCount === 0) {
	    return;
	  }
	  let withOpenPopupEvent = true;
	  if (maxVisibleAvatars && (users == null ? void 0 : users.length) > maxVisibleAvatars) {
	    withOpenPopupEvent = false;
	  }
	  const counterClass = 'agent-grid-department-counter agent-grid-department-counter-with-users';
	  const counterWrapperClass = '';
	  const withPlusPrefix = false;
	  const counterNode = babelHelpers.classPrivateFieldLooseBase(this, _createCounterNode)[_createCounterNode](departmentsCount, departments, users, counterClass, counterWrapperClass, withPlusPrefix, withOpenPopupEvent);
	  if (counterNode) {
	    main_core.Dom.append(counterNode, container);
	  }
	}
	function _createDepartmentsNode2(container, departments, users) {
	  var _departments$firstDep;
	  if (!departments) {
	    return;
	  }
	  const departmentIds = Object.keys(departments);
	  const departmentsCount = departmentIds.length;
	  if (departmentsCount === 0) {
	    return;
	  }
	  const firstDepartmentId = main_core.Text.toInteger(departmentIds[0]);
	  const firstDepartmentName = (_departments$firstDep = departments[firstDepartmentId]) != null ? _departments$firstDep : '';
	  const departmentNode = babelHelpers.classPrivateFieldLooseBase(this, _getDepartmentNode)[_getDepartmentNode](firstDepartmentName, firstDepartmentId);
	  if (departmentsCount > 1) {
	    const remainingCount = departmentsCount - 1;
	    const counterClass = 'agent-grid-department-counter-number';
	    const counterWrapperClass = 'agent-grid-department-counter';
	    const counterNode = babelHelpers.classPrivateFieldLooseBase(this, _createCounterNode)[_createCounterNode](remainingCount, departments, users, counterClass, counterWrapperClass);
	    if (counterNode) {
	      main_core.Dom.append(counterNode, departmentNode);
	    }
	  }
	  main_core.Dom.append(departmentNode, container);
	}
	function _getDepartmentNode2(department, nodeId, shouldAddHover = false) {
	  const departmentWrapper = main_core.Tag.render(_t6 || (_t6 = _`
			<div class="${0}"></div>
		`), shouldAddHover ? 'agent-grid-department-in-list' : 'agent-grid-department');
	  const circle = main_core.Tag.render(_t7 || (_t7 = _`<div class="agent-grid-department-circle">${0}</div>`), GridIcons.DEPARTMENT);
	  const label = ui_system_typography.Text.render(department, {
	    size: 'xs',
	    accent: false,
	    tag: 'span',
	    className: 'agent-grid-department-label'
	  });
	  main_core.Dom.attr(label, 'title', department);
	  main_core.Dom.append(circle, departmentWrapper);
	  main_core.Dom.append(label, departmentWrapper);
	  main_core.Event.bind(departmentWrapper, 'click', event => {
	    event.stopPropagation();
	    humanresources_companyStructure_public.Structure == null ? void 0 : humanresources_companyStructure_public.Structure.open({
	      focusNodeId: nodeId
	    });
	  });
	  return departmentWrapper;
	}
	function _getDisplayedNumber2(remainingCount) {
	  return remainingCount > UsedByField.MAX_COUNTER_VALUE ? UsedByField.MAX_COUNTER_VALUE : remainingCount;
	}
	function _createCounterNode2(count, departments, users, counterClassName = '', counterWrapperClassName = '', withPlusPrefix = true, withOpenPopupEvent = true) {
	  if (count <= 0) {
	    return null;
	  }
	  const counterWrapper = main_core.Tag.render(_t8 || (_t8 = _`<div class="${0}"></div>`), counterWrapperClassName);
	  const displayedNumber = babelHelpers.classPrivateFieldLooseBase(this, _getDisplayedNumber)[_getDisplayedNumber](count);
	  let counterText = String(displayedNumber);
	  if (withPlusPrefix) {
	    counterText = `+${counterText}`;
	  }
	  const numberNode = ui_system_typography.Text.render(counterText, {
	    size: '3xs',
	    accent: false,
	    tag: 'span',
	    className: counterClassName
	  });
	  main_core.Dom.append(numberNode, counterWrapper);
	  if (withOpenPopupEvent) {
	    main_core.Event.bind(counterWrapper, 'click', event => {
	      event.stopPropagation();
	      babelHelpers.classPrivateFieldLooseBase(this, _openCombinedPopup)[_openCombinedPopup](departments, users, counterWrapper);
	    });
	  } else {
	    main_core.Dom.addClass(numberNode, 'agent-grid-counter-default-cursor');
	  }
	  return counterWrapper;
	}
	function _createChatNode2(container, chats) {
	  var _chats$length, _chats$;
	  const chatsCount = (_chats$length = chats == null ? void 0 : chats.length) != null ? _chats$length : 0;
	  if (chatsCount === 0) {
	    return;
	  }
	  const firstChat = (_chats$ = chats[0]) != null ? _chats$ : '';
	  const chatNode = babelHelpers.classPrivateFieldLooseBase(this, _getChatNode)[_getChatNode](firstChat);
	  if (chatsCount > 1) {
	    const remainingCount = chatsCount - 1;
	    const counterNode = babelHelpers.classPrivateFieldLooseBase(this, _getChatsCounterNode)[_getChatsCounterNode](remainingCount, chats);
	    main_core.Dom.append(counterNode, chatNode);
	  }
	  main_core.Dom.append(chatNode, container);
	}
	function _getChatNode2(chat, shouldAddHover = false) {
	  var _chat$chatName;
	  const chatName = (_chat$chatName = chat.chatName) != null ? _chat$chatName : '';
	  const chatNameNode = ui_system_typography.Text.render(chatName, {
	    size: '2xs',
	    accent: false,
	    tag: 'span',
	    className: 'agent-grid-chat-name'
	  });
	  const encodedChatName = main_core.Text.encode(chatName);
	  const containerClass = shouldAddHover ? 'agent-grid-chats-in-list' : 'agent-grid-chat-container';
	  const chatContainer = main_core.Tag.render(_t9 || (_t9 = _`
			<div class="${0}" title="${0}">
				${0}
				<a href="#" class="agent-grid-chat-link">
					${0}
				</a>
			</div>
		`), containerClass, encodedChatName, GridIcons.AGENT_CHAT, chatNameNode);
	  main_core.Event.bind(chatContainer, 'click', event => {
	    event.preventDefault();
	    this.openChat(chat.chatId);
	  });
	  return chatContainer;
	}
	function _getChatsCounterNode2(remainingCount, chats) {
	  const counterWrapper = main_core.Tag.render(_t10 || (_t10 = _`<div class="ai-agents-chats-counter-wrapper"></div>`));
	  const counterClassName = 'ai-agents-chats-counter';
	  const displayedNumber = babelHelpers.classPrivateFieldLooseBase(this, _getDisplayedNumber)[_getDisplayedNumber](remainingCount);
	  const counterText = `+${displayedNumber}`;
	  const numberNode = ui_system_typography.Text.render(counterText, {
	    size: '3xs',
	    accent: true,
	    tag: 'span',
	    className: counterClassName
	  });
	  main_core.Dom.append(numberNode, counterWrapper);
	  main_core.Event.bind(counterWrapper, 'click', event => {
	    event.stopPropagation();
	    babelHelpers.classPrivateFieldLooseBase(this, _toggleChatsListPopup)[_toggleChatsListPopup](chats, counterWrapper);
	  });
	  return counterWrapper;
	}
	function _toggleChatsListPopup2(chats, counterNode) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _chatsPopup)[_chatsPopup] && babelHelpers.classPrivateFieldLooseBase(this, _chatsPopup)[_chatsPopup].isShown()) {
	    babelHelpers.classPrivateFieldLooseBase(this, _chatsPopup)[_chatsPopup].close();
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _openChatsListPopup)[_openChatsListPopup](chats, counterNode);
	  }
	}
	function _openChatsListPopup2(chats, bindElement) {
	  const contentNode = main_core.Tag.render(_t11 || (_t11 = _`<div class="agent-grid-chats-list-wrapper"></div>`));
	  babelHelpers.classPrivateFieldLooseBase(this, _fillChatsListContent)[_fillChatsListContent](chats, contentNode);
	  babelHelpers.classPrivateFieldLooseBase(this, _chatsPopup)[_chatsPopup] = new main_popup.Popup({
	    content: contentNode,
	    bindElement,
	    cacheable: false,
	    minHeight: 50,
	    maxWidth: 400,
	    maxHeight: 200,
	    padding: 0,
	    autoHide: true,
	    className: 'agents-grid-popup'
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _chatsPopup)[_chatsPopup].show();
	  babelHelpers.classPrivateFieldLooseBase(this, _chatsPopup)[_chatsPopup].subscribe('onClose', () => {
	    babelHelpers.classPrivateFieldLooseBase(this, _chatsPopup)[_chatsPopup] = null;
	  });
	}
	function _fillChatsListContent2(chats, contentNode) {
	  if (!chats || chats.length === 0) {
	    return contentNode;
	  }
	  chats.forEach(chat => {
	    const shouldAddHover = true;
	    const chatNode = babelHelpers.classPrivateFieldLooseBase(this, _getChatNode)[_getChatNode](chat, shouldAddHover);
	    main_core.Dom.append(chatNode, contentNode);
	  });
	  return contentNode;
	}
	function _openCombinedPopup2(departments, users, bindElement) {
	  const items = [];
	  babelHelpers.classPrivateFieldLooseBase(this, _fillDepartmentsListContent)[_fillDepartmentsListContent](departments, items);
	  babelHelpers.classPrivateFieldLooseBase(this, _fillUsersListContent)[_fillUsersListContent](users, items);
	  const entities = [{
	    id: UsedByField.ENTITY_USER,
	    dynamicLoad: false
	  }, {
	    id: UsedByField.ENTITY_DEPARTMENT,
	    dynamicLoad: false
	  }];
	  const dialog = new ui_entitySelector.Dialog({
	    targetNode: bindElement,
	    width: 306,
	    height: 309,
	    dropdownMode: true,
	    showAvatars: true,
	    autoHide: true,
	    multiple: false,
	    hideOnSelect: false,
	    focusOnFirst: false,
	    showDefaultFooter: false,
	    searchTabOptions: {
	      visible: false
	    },
	    recentTabOptions: {
	      visible: false
	    },
	    events: {
	      'Item:onBeforeSelect': babelHelpers.classPrivateFieldLooseBase(this, _handleBeforeSelect)[_handleBeforeSelect].bind(this)
	    },
	    entities,
	    items
	  });
	  dialog.show();
	}
	function _fillDepartmentsListContent2(departments, items) {
	  if (!departments || Object.keys(departments).length === 0) {
	    return items;
	  }
	  Object.entries(departments).forEach(([id, name]) => {
	    items.push({
	      id: main_core.Text.toInteger(id),
	      title: name,
	      entityId: UsedByField.ENTITY_DEPARTMENT,
	      tabs: 'recents'
	    });
	  });
	  return items;
	}
	function _fillUsersListContent2(users, items) {
	  if (!users || users.length === 0) {
	    return items;
	  }
	  users.forEach(user => {
	    const itemOptions = {
	      id: user.id,
	      title: user.fullName,
	      entityId: UsedByField.ENTITY_USER,
	      tabs: 'recents',
	      avatarOptions: {
	        bgSize: 'cover'
	      }
	    };
	    if (user != null && user.photoUrl) {
	      itemOptions.avatar = decodeURIComponent(user.photoUrl);
	    }
	    if (user != null && user.profileLink) {
	      itemOptions.link = user.profileLink;
	    }
	    items.push(itemOptions);
	  });
	  return items;
	}
	function _openUserProfile2(profileLink) {
	  if (main_core.Type.isStringFilled(profileLink)) {
	    main_sidepanel.SidePanel.Instance.open(profileLink);
	  }
	}
	function _handleBeforeSelect2(event) {
	  const item = event.getData().item;
	  event.preventDefault();
	  if (item.getEntityId() === UsedByField.ENTITY_DEPARTMENT) {
	    babelHelpers.classPrivateFieldLooseBase(this, _handleSelectDepartment)[_handleSelectDepartment](item);
	    return;
	  }
	  if (item.getEntityId() === UsedByField.ENTITY_USER) {
	    babelHelpers.classPrivateFieldLooseBase(this, _handleSelectUser)[_handleSelectUser](item);
	  }
	}
	function _handleSelectDepartment2(item) {
	  humanresources_companyStructure_public.Structure == null ? void 0 : humanresources_companyStructure_public.Structure.open({
	    focusNodeId: item.id
	  });
	}
	function _handleSelectUser2(item) {
	  babelHelpers.classPrivateFieldLooseBase(this, _openUserProfile)[_openUserProfile](item == null ? void 0 : item.link);
	}
	UsedByField.MAX_VISIBLE_AVATARS_COMBINED = 3;
	UsedByField.MAX_VISIBLE_AVATARS_USERS_ONLY = 5;
	UsedByField.MAX_COUNTER_VALUE = 99;
	UsedByField.ENTITY_DEPARTMENT = 'department';
	UsedByField.ENTITY_USER = 'user';

	let _$1 = t => t,
	  _t$1,
	  _t2$1;
	var _createFullNameElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createFullNameElement");
	class FullNameField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _createFullNameElement, {
	      value: _createFullNameElement2
	    });
	  }
	  render(params) {
	    var _params$user, _user$fullName, _user$profileLink, _user$id;
	    const user = (_params$user = params == null ? void 0 : params.user) != null ? _params$user : {};
	    const fullName = (_user$fullName = user.fullName) != null ? _user$fullName : main_core.Loc.getMessage('BIZPROC_AI_AGENTS_LAUNCHED_BY_PLACEHOLDER');
	    const profileLink = (_user$profileLink = user.profileLink) != null ? _user$profileLink : null;
	    const userId = (_user$id = user.id) != null ? _user$id : null;
	    const fullNameElement = babelHelpers.classPrivateFieldLooseBase(this, _createFullNameElement)[_createFullNameElement](fullName, userId, profileLink);
	    const container = main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<div class="agent-grid_full-name-container">${0}</div>
		`), fullNameElement);
	    this.appendToFieldNode(container);
	  }
	}
	function _createFullNameElement2(fullName, userId, profileLink) {
	  const typographyOptions = {
	    size: 'xs',
	    accent: false,
	    tag: 'span',
	    className: 'agent-grid_full-name-label'
	  };
	  const nameNode = ui_system_typography.Text.render(fullName, typographyOptions);
	  main_core.Dom.attr(nameNode, USER_MINI_PROFILE_ATTRIBUTES.USER_ID, userId);
	  main_core.Dom.attr(nameNode, USER_MINI_PROFILE_ATTRIBUTES.CONTEXT, USER_MINI_PROFILE_CONTEXT.B24);
	  if (!profileLink) {
	    main_core.Dom.addClass(nameNode, 'agent-grid_full-name-label-placeholder');
	    return nameNode;
	  }
	  return main_core.Tag.render(_t2$1 || (_t2$1 = _$1`
			<a href="${0}" class="agent-grid_full-name-link">
				${0}
			</a>
		`), profileLink, nameNode);
	}

	let _$2 = t => t,
	  _t$2,
	  _t2$2;
	class EmployeeField extends BaseField {
	  render(params) {
	    const photoFieldId = main_core.Text.getRandom(6);
	    const fullNameFieldId = main_core.Text.getRandom(6);
	    this.appendToFieldNode(main_core.Tag.render(_t$2 || (_t$2 = _$2`<span id="${0}"></span>`), photoFieldId));
	    this.appendToFieldNode(main_core.Tag.render(_t2$2 || (_t2$2 = _$2`<span class="agent-grid_full-name-wrapper" id="${0}"></span>`), fullNameFieldId));
	    new PhotoField({
	      fieldId: photoFieldId
	    }).render(params);
	    new FullNameField({
	      fieldId: fullNameFieldId
	    }).render(params);
	    main_core.Dom.addClass(this.getFieldNode(), 'agent-grid_employee-card-container');
	    main_core.Dom.attr(this.getFieldNode(), 'data-test-id', 'bizproc-ai-agents-grid-started-by-employee-card');
	  }
	}

	const ErrorCode = {
	  TARIFF_LIMIT: 'AI_AGENTS_UNAVAILABLE_BY_TARIFF'
	};

	class TariffLimit {
	  handle(error) {
	    var _error$customData;
	    const tariffSliderCode = error == null ? void 0 : (_error$customData = error.customData) == null ? void 0 : _error$customData.tariffSliderCode;
	    TariffLimit.showFeatureSlider(tariffSliderCode);
	  }
	  static showFeatureSlider(tariffSliderCode) {
	    if (!tariffSliderCode) {
	      return;
	    }
	    ui_infoHelper.FeaturePromotersRegistry.getPromoter({
	      code: tariffSliderCode
	    }).show();
	  }
	}

	class Base {
	  handle(error) {
	    this.notifyUser(error);
	  }
	  notifyUser(error) {
	    BX.UI.Notification.Center.notify({
	      content: this.getErrorMessageFromResult(error)
	    });
	  }
	  getErrorMessageFromResult(error) {
	    var _error$message;
	    return main_core.Text.encode((_error$message = error.message) != null ? _error$message : main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_AJAX_ERROR'));
	  }
	}

	class UndefinedError extends Base {}

	class AjaxErrorHandler {
	  /**
	  * Tries to handle by code, if code empty, tries handle by message
	  */
	  handle(action, response) {
	    const errors = response.errors;
	    if (!(errors != null && errors.length) || (errors == null ? void 0 : errors.length) === 0) {
	      return;
	    }
	    errors.forEach(error => {
	      const errorCode = error == null ? void 0 : error.code;
	      const errorMessage = error == null ? void 0 : error.message;
	      if (errorCode) {
	        this.getHandlerByCode(errorCode).handle(error);
	        return;
	      }
	      this.getHandlerByMessage(errorMessage).handle(error);
	    });
	  }
	  getHandlerByCode(errorCode) {
	    switch (errorCode) {
	      case ErrorCode.TARIFF_LIMIT:
	        {
	          return new TariffLimit();
	        }
	      default:
	        {
	          return new UndefinedError();
	        }
	    }
	  }
	  getHandlerByMessage(errorMessage) {
	    return new Base();
	  }
	}

	const post = async (action, data) => {
	  try {
	    const response = await main_core.ajax.runAction(`bizproc.v2.${action}`, {
	      method: 'POST',
	      json: data || {}
	    });
	    return response.data;
	  } catch (error) {
	    const ajaxErrorHandler = new AjaxErrorHandler();
	    ajaxErrorHandler.handle(action, error);
	  }
	  return null;
	};
	const gridApi = {
	  startTemplate: templateId => {
	    return post(GRID_API_ACTION.START_TEMPLATE, {
	      templateId
	    });
	  },
	  copyAndStartTemplate: templateId => {
	    return post(GRID_API_ACTION.COPY_AND_START_TEMPLATE, {
	      templateId
	    });
	  },
	  fetchRow: templateId => {
	    return post(GRID_API_ACTION.FETCH_ROW, {
	      templateId
	    });
	  }
	};

	var _grid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("grid");
	class RowHelper {
	  constructor(grid) {
	    Object.defineProperty(this, _grid, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid] = grid;
	  }
	  setGrid(grid) {
	    babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid] = grid;
	  }
	  static prepareNewRowParams(columns, rowActions) {
	    return {
	      id: columns == null ? void 0 : columns.ID,
	      columns,
	      actions: rowActions,
	      prepend: true,
	      animation: true
	    };
	  }
	  getByTemplateId(templateId) {
	    var _babelHelpers$classPr;
	    const rowsCollectionWrapper = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid]) == null ? void 0 : _babelHelpers$classPr.getRows();
	    return rowsCollectionWrapper == null ? void 0 : rowsCollectionWrapper.getById(templateId);
	  }
	  markAsLoading(row) {
	    if (!row) {
	      return;
	    }
	    row.stateLoad();
	  }
	  markAsLoaded(row) {
	    if (!row) {
	      return;
	    }
	    row.stateUnload();
	  }
	  addToGrid(addRowOptions) {
	    var _babelHelpers$classPr2, _babelHelpers$classPr3;
	    (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid]) == null ? void 0 : (_babelHelpers$classPr3 = _babelHelpers$classPr2.getRealtime()) == null ? void 0 : _babelHelpers$classPr3.addRow(addRowOptions);
	  }
	  update(row, updateColumns) {
	    if (!row) {
	      return;
	    }
	    row.setCellsContent(updateColumns);
	  }
	  highlight(row) {
	    if (!row) {
	      return;
	    }
	    main_core.Dom.addClass(row.getNode(), 'ai-agents-grid-row-highlighted');
	    setTimeout(() => {
	      main_core.Dom.removeClass(row, 'ai-agents-grid-row-highlighted');
	    }, 2500);
	  }
	}

	let _$3 = t => t,
	  _t$3,
	  _t2$3;
	var _renderLaunchButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderLaunchButton");
	var _handleLaunchButtonClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleLaunchButtonClick");
	var _renderLaunchedDate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderLaunchedDate");
	var _renderLaunchedRagFilesStatuses = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderLaunchedRagFilesStatuses");
	class LaunchControlField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _renderLaunchedRagFilesStatuses, {
	      value: _renderLaunchedRagFilesStatuses2
	    });
	    Object.defineProperty(this, _renderLaunchedDate, {
	      value: _renderLaunchedDate2
	    });
	    Object.defineProperty(this, _handleLaunchButtonClick, {
	      value: _handleLaunchButtonClick2
	    });
	    Object.defineProperty(this, _renderLaunchButton, {
	      value: _renderLaunchButton2
	    });
	  }
	  render(params) {
	    if (params.ragFilesStatuses && params.ragFilesStatuses.status) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderLaunchedRagFilesStatuses)[_renderLaunchedRagFilesStatuses](params.ragFilesStatuses);
	    } else if (main_core.Type.isNumber(params.launchedAt) && params.launchedAt > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderLaunchedDate)[_renderLaunchedDate](params.launchedAt);
	    } else if (main_core.Type.isNumber(params.agentId)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderLaunchButton)[_renderLaunchButton](params);
	    }
	  }
	}
	function _renderLaunchButton2(params) {
	  const button = new ui_buttons.Button({
	    text: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH'),
	    size: ui_buttons.ButtonSize.SMALL,
	    tag: ui_buttons.Button.Tag.DIV,
	    useAirDesign: true,
	    onclick: async (buttonInstance, event) => {
	      await babelHelpers.classPrivateFieldLooseBase(this, _handleLaunchButtonClick)[_handleLaunchButtonClick](params.agentId, buttonInstance, event);
	    }
	  });
	  main_core.Dom.attr(button.getContainer(), 'data-test-id', 'bizproc-ai-agents-grid-action-start-button');
	  this.appendToFieldNode(button.render());
	}
	async function _handleLaunchButtonClick2(agentId, buttonInstance, event) {
	  event.stopPropagation();
	  buttonInstance.setWaiting(true);
	  const gridManager = this.getGridManager();
	  if (!(gridManager != null && gridManager.validateAiAgentsAvailableByTariff())) {
	    buttonInstance.setWaiting(false);
	    return;
	  }
	  const grid = gridManager.getGrid();
	  grid == null ? void 0 : grid.tableFade();
	  try {
	    const result = await gridApi.copyAndStartTemplate(agentId);
	    if (!result) {
	      buttonInstance.setWaiting(false);
	      grid == null ? void 0 : grid.tableUnfade();
	      return;
	    }
	    buttonInstance.setWaiting(false);
	    const columns = result == null ? void 0 : result.columns;
	    const actions = result == null ? void 0 : result.actions;
	    const newRowFields = RowHelper.prepareNewRowParams(columns, actions);
	    grid == null ? void 0 : grid.tableUnfade();
	    new RowHelper(grid).addToGrid(newRowFields);
	    const setupTemplate = result == null ? void 0 : result.setupTemplateData;
	    if (setupTemplate && main_core.Type.isObjectLike(setupTemplate)) {
	      bizproc_setupTemplate.SetupTemplate.showSidePanel(setupTemplate);
	    }
	  } catch (error) {
	    var _error$errors, _error$errors$;
	    buttonInstance.setWaiting(false);
	    let message = error == null ? void 0 : (_error$errors = error.errors) == null ? void 0 : (_error$errors$ = _error$errors[0]) == null ? void 0 : _error$errors$.message;
	    if (!message) {
	      message = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH_ERROR');
	    }
	    grid == null ? void 0 : grid.tableUnfade();
	    BX.UI.Notification.Center.notify({
	      content: message
	    });
	  }
	}
	function _renderLaunchedDate2(timestamp) {
	  const formattedDate = main_date.DateTimeFormat.format('j F, G:i', timestamp);
	  const dateNode = ui_system_typography.Text.render(formattedDate, {
	    size: 'xs',
	    tag: 'div',
	    className: 'launch-control-field-date'
	  });
	  main_core.Dom.attr(dateNode, 'data-test-id', 'bizproc-ai-agents-grid-started-at');
	  this.appendToFieldNode(dateNode);
	}
	function _renderLaunchedRagFilesStatuses2(ragFilesStatuses) {
	  if (!ragFilesStatuses || !ragFilesStatuses.status) {
	    return;
	  }
	  const statusNode = ui_system_typography.Text.render(main_core.Text.encode(ragFilesStatuses.statusMessage), {
	    size: 'xs',
	    tag: 'span',
	    className: 'launch-control-field-rag-files-status'
	  });
	  const container = main_core.Tag.render(_t$3 || (_t$3 = _$3`<div class="ui-icon-set__scope launch-control-field-rag-files-statuses ${0}"></div>`), main_core.Text.encode(ragFilesStatuses.iconClass));
	  main_core.Dom.append(main_core.Tag.render(_t2$3 || (_t2$3 = _$3`<span class="main-grid-rag-status-icon"></span>`)), container);
	  main_core.Dom.append(statusNode, container);
	  if (ragFilesStatuses.descriptionMessage) {
	    const fileDesc = ragFilesStatuses.files.map(function (file) {
	      return `<div style="display: flex; align-items: center; justify-content: space-between;">` + `<div style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;" title="${main_core.Text.encode(file.fileName)}">` + main_core.Text.encode(file.fileName) + `</div>` + `<i class="ui-icon-set ${main_core.Text.encode(file.iconClass)}" title="${main_core.Text.encode(file.statusMessage)}" style="fill:white; background-color:white"></i>` + `</div>`;
	    }).join('');
	    const statusHintNode = document.createElement('span');
	    main_core.Dom.attr(statusHintNode, 'class', 'launch-control-field-rag-files-hint');
	    statusHintNode.dataset.hintHtml = true;
	    statusHintNode.dataset.hintInteractivity = true;
	    statusHintNode.dataset.hint = `<div class=" --ui-context-content-light">` + `<h4>${main_core.Text.encode(ragFilesStatuses.statusMessage)}</h4>` + `<div>${fileDesc}</div>` + `<br><hr><br>` + `<div>${main_core.Text.encode(ragFilesStatuses.descriptionMessage)}</div>` + `</div>`;
	    main_core.Dom.append(statusHintNode, container);
	  }
	  this.appendToFieldNode(container);
	  BX.UI.Hint.init(this.getFieldNode());
	}

	let _$4 = t => t,
	  _t$4,
	  _t2$4;
	class LoadIndicatorField extends BaseField {
	  render(params) {
	    var _percentageNode;
	    const percentage = Number.isFinite(params == null ? void 0 : params.percentage) ? params.percentage : 0;
	    const showPercentage = percentage > 0;
	    let percentageNode = null;
	    const percentPerBar = 20;
	    const activeBarsCount = Math.ceil(percentage / percentPerBar);
	    const svgNode = main_core.Tag.render(_t$4 || (_t$4 = _$4`<div>${0}</div>`), GridIcons.LOAD);
	    const bars = svgNode.querySelectorAll('.agent-grid-load-bar');
	    bars.forEach((bar, index) => {
	      const currentBarIndex = index + 1;
	      if (currentBarIndex <= activeBarsCount && percentage > 0) {
	        main_core.Dom.addClass(bar, '--active');
	      }
	      main_core.Dom.style(bar, '--level', currentBarIndex);
	    });
	    if (showPercentage) {
	      const percentageNodeText = `${percentage}%`;
	      percentageNode = ui_system_typography.Text.render(percentageNodeText, {
	        size: 'xs',
	        accent: false,
	        tag: 'div',
	        className: 'agent-grid-load-percentage'
	      });
	    }
	    const container = main_core.Tag.render(_t2$4 || (_t2$4 = _$4`
			<div class="agent-grid-load-indicator">
			  ${0}
			  <div
				class="agent-grid-load-container"
			  >
				${0}
			  </div>
			</div>
		`), (_percentageNode = percentageNode) != null ? _percentageNode : '', svgNode);
	    this.appendToFieldNode(container);
	  }
	}

	/**
	 * @abstract
	 */
	var _ajaxErrorHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ajaxErrorHandler");
	class BaseAction {
	  constructor() {
	    Object.defineProperty(this, _ajaxErrorHandler, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _ajaxErrorHandler)[_ajaxErrorHandler] = new AjaxErrorHandler();
	  }

	  /**
	   * @abstract
	   */
	  static getActionId() {
	    throw new Error('not implemented');
	  }

	  /**
	   * @returns {ActionConfig}
	   */
	  getActionConfig() {
	    throw new Error('not implemented');
	  }
	  setActionParams(params) {
	    var _params$showPopups;
	    this.filter = params == null ? void 0 : params.filter;
	    this.showPopups = (_params$showPopups = params == null ? void 0 : params.showPopups) != null ? _params$showPopups : true;
	  }
	  setGrid(grid) {
	    this.grid = grid;
	  }
	  getActionData() {
	    return {};
	  }
	  async execute() {
	    await this.onBeforeActionRequest();
	    const confirmationPopup = this.showPopups ? this.getConfirmationPopup() : null;
	    if (confirmationPopup) {
	      confirmationPopup.setOkCallback(async () => {
	        confirmationPopup.close();
	        await this.run();
	      });
	      confirmationPopup.show();
	    } else {
	      await this.run();
	    }
	  }
	  async run() {}
	  async onBeforeActionRequest() {}
	  onAfterActionRequest() {
	    this.grid.reload(() => {
	      this.grid.tableUnfade();
	    });
	  }
	  async sendActionRequest() {
	    const actionConfig = this.getActionConfig();
	    try {
	      this.grid.tableFade();
	      const actionData = this.getActionData();
	      const ajaxOptions = {
	        ...actionConfig.options,
	        json: actionData,
	        method: 'POST'
	      };
	      let result = null;
	      switch (actionConfig.type) {
	        case AJAX_REQUEST_TYPE.CONTROLLER:
	          result = await BX.ajax.runAction(`bizproc.v2.${actionConfig.name}`, ajaxOptions);
	          break;
	        case AJAX_REQUEST_TYPE.COMPONENT:
	          result = await BX.ajax.runComponentAction(actionConfig.component, actionConfig.name, ajaxOptions);
	          break;
	        default:
	          {
	            const errorMessage = `Unknown action type: ${actionConfig.type}`;
	            this.handleErrorByMessage(actionConfig.name, {
	              errors: [{
	                message: errorMessage
	              }]
	            });
	          }
	      }
	      this.handleSuccess(result);
	    } catch (result) {
	      this.handleError(actionConfig.name, result);
	    } finally {
	      await this.onAfterActionRequest();
	    }
	  }
	  handleSuccess(result) {}
	  handleError(action, response) {
	    if (!(response != null && response.errors) || response.errors.length === 0) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _ajaxErrorHandler)[_ajaxErrorHandler].handle(action, response);
	  }
	  handleErrorByMessage(action, message) {
	    const errorMessage = message != null ? message : main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR');
	    this.handleError(action, {
	      errors: [{
	        message: errorMessage
	      }]
	    });
	  }
	  getConfirmationPopup() {
	    return null;
	  }
	}

	var _openDesigner = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openDesigner");
	class EditAction extends BaseAction {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _openDesigner, {
	      value: _openDesigner2
	    });
	  }
	  static getActionId() {
	    return ACTION_TYPE.EDIT;
	  }
	  async run() {
	    await super.run();
	    babelHelpers.classPrivateFieldLooseBase(this, _openDesigner)[_openDesigner]();
	  }
	  setActionParams(params) {
	    super.setActionParams(params);
	    this.editUri = params.editUri;
	  }
	}
	function _openDesigner2() {
	  if (!this.editUri) {
	    return;
	  }
	  window.open(this.editUri, '_blank');
	}

	class DeleteAction extends BaseAction {
	  static getActionId() {
	    return ACTION_TYPE.DELETE;
	  }
	  async run() {
	    await this.sendActionRequest();
	  }
	  setActionParams(params) {
	    super.setActionParams(params);
	    this.templateId = Number.parseInt(params.templateId, 10);
	  }
	  getActionConfig() {
	    return {
	      type: AJAX_REQUEST_TYPE.CONTROLLER,
	      name: GRID_API_ACTION.DELETE
	    };
	  }
	  getActionData() {
	    const data = {
	      ...super.getActionData()
	    };
	    if (!this.templateId || !main_core.Type.isNumber(this.templateId)) {
	      return data;
	    }
	    data.agentIds = [this.templateId];
	    return data;
	  }
	  getConfirmationPopup() {
	    const message = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_CONFIRM_MESSAGE');
	    const title = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_CONFIRM_TITLE');
	    const buttons = ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL;
	    const okCaption = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_OK');
	    const cancelCaption = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_CANCEL');
	    return new ui_dialogs_messagebox.MessageBox({
	      message,
	      title,
	      buttons,
	      okCaption,
	      onCancel: messageBox => {
	        messageBox.close();
	      },
	      cancelCaption
	    });
	  }
	}

	class RestartAction extends BaseAction {
	  static getActionId() {
	    return ACTION_TYPE.RESTART;
	  }
	  async run() {
	    await this.sendActionRequest();
	  }
	  setActionParams(params) {
	    super.setActionParams(params);
	    this.templateId = Number.parseInt(params.templateId, 10);
	  }
	  getActionConfig() {
	    return {
	      type: AJAX_REQUEST_TYPE.CONTROLLER,
	      name: GRID_API_ACTION.RESTART
	    };
	  }
	  getActionData() {
	    const data = {
	      ...super.getActionData()
	    };
	    if (!this.templateId || !main_core.Type.isNumber(this.templateId)) {
	      return data;
	    }
	    data.templateId = this.templateId;
	    return data;
	  }
	  handleSuccess(result) {
	    var _result$data;
	    const setupTemplate = result == null ? void 0 : (_result$data = result.data) == null ? void 0 : _result$data.setupTemplateData;
	    if (setupTemplate && main_core.Type.isObjectLike(setupTemplate)) {
	      bizproc_setupTemplate.SetupTemplate.showSidePanel(setupTemplate);
	      return;
	    }
	    BX.UI.Notification.Center.notify({
	      content: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_RESTART_ACTION_NOTIFICATION_TITLE')
	    });
	  }
	}

	class GroupDeleteAction extends DeleteAction {
	  static getActionId() {
	    return ACTION_TYPE.GROUP_DELETE;
	  }
	  getSelectedIds() {
	    return this.grid.getRows().getSelectedIds();
	  }
	  getActionData() {
	    const data = {
	      ...super.getActionData()
	    };
	    data.agentIds = this.getSelectedIds();
	    return data;
	  }
	  getConfirmationPopup() {
	    var _this$getSelectedIds;
	    if (((_this$getSelectedIds = this.getSelectedIds()) == null ? void 0 : _this$getSelectedIds.length) === 1) {
	      return super.getConfirmationPopup();
	    }
	    const message = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_GROUP_DELETE_ACTION_CONFIRM_MESSAGE');
	    const title = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_GROUP_DELETE_ACTION_CONFIRM_TITLE');
	    const buttons = ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL;
	    const okCaption = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_OK');
	    const cancelCaption = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_CANCEL');
	    return new ui_dialogs_messagebox.MessageBox({
	      message,
	      title,
	      buttons,
	      okCaption,
	      onCancel: messageBox => {
	        messageBox.close();
	      },
	      cancelCaption
	    });
	  }
	}

	const actionMap = new Map([[EditAction.getActionId(), EditAction], [DeleteAction.getActionId(), DeleteAction], [RestartAction.getActionId(), RestartAction]]);
	const groupActionMap = new Map([[GroupDeleteAction.getActionId(), GroupDeleteAction]]);

	class ActionFactory {
	  static createFromMap(actionMapping, actionId) {
	    const ActionClass = actionMapping.get(actionId);
	    return ActionClass ? new ActionClass() : null;
	  }
	  static create(actionId) {
	    return this.createFromMap(actionMap, actionId);
	  }
	  static createGroupAction(actionId) {
	    return this.createFromMap(groupActionMap, actionId);
	  }
	}

	var _grid$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("grid");
	class TemplateSetupHandler {
	  constructor(grid) {
	    Object.defineProperty(this, _grid$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _grid$1)[_grid$1] = grid;
	  }
	  async handle(event) {
	    const eventData = event.getData();
	    const templateId = eventData == null ? void 0 : eventData.templateId;
	    if (!templateId) {
	      return;
	    }
	    const rowHelper = new RowHelper(babelHelpers.classPrivateFieldLooseBase(this, _grid$1)[_grid$1]);
	    const row = rowHelper.getByTemplateId(templateId);
	    if (!row) {
	      return;
	    }
	    rowHelper.markAsLoading(row);
	    const updatedTemplateRow = await gridApi.fetchRow(templateId);
	    if (!updatedTemplateRow) {
	      rowHelper.markAsLoaded(row);
	      babelHelpers.classPrivateFieldLooseBase(this, _grid$1)[_grid$1].reload();
	      return;
	    }
	    rowHelper.update(row, updatedTemplateRow.columns);
	    rowHelper.markAsLoaded(row);
	    rowHelper.highlight(row);
	  }
	}

	var _settings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("settings");
	var _grid$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("grid");
	var _subscribeToEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeToEvents");
	class GridManager {
	  constructor(gridId) {
	    var _BX$Main$gridManager$;
	    Object.defineProperty(this, _subscribeToEvents, {
	      value: _subscribeToEvents2
	    });
	    Object.defineProperty(this, _settings, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _grid$2, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _grid$2)[_grid$2] = (_BX$Main$gridManager$ = BX.Main.gridManager.getById(gridId)) == null ? void 0 : _BX$Main$gridManager$.instance;
	    babelHelpers.classPrivateFieldLooseBase(this, _settings)[_settings] = main_core.Extension.getSettings('bizproc.ai-agents.grid');
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribeToEvents)[_subscribeToEvents]();
	  }
	  static getInstance(gridId) {
	    if (!this.instances[gridId]) {
	      this.instances[gridId] = new GridManager(gridId);
	    }
	    return this.instances[gridId];
	  }
	  static setSort(options) {
	    var _BX$Main$gridManager$2;
	    const grid = (_BX$Main$gridManager$2 = BX.Main.gridManager.getById(options.gridId)) == null ? void 0 : _BX$Main$gridManager$2.instance;
	    if (main_core.Type.isObject(grid)) {
	      grid.tableFade();
	      grid.getUserOptions().setSort(options.sortBy, options.order, () => {
	        grid.reload();
	      });
	    }
	  }
	  static setFilter(options) {
	    var _BX$Main$gridManager$3;
	    const grid = (_BX$Main$gridManager$3 = BX.Main.gridManager.getById(options.gridId)) == null ? void 0 : _BX$Main$gridManager$3.instance;
	    const filter = BX.Main.filterManager.getById(options.gridId);
	    if (main_core.Type.isObject(grid) && main_core.Type.isObject(filter)) {
	      filter.getApi().extendFilter(options.filter);
	    }
	  }
	  getGrid() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _grid$2)[_grid$2];
	  }
	  runAction(actionConfig) {
	    var _actionConfig$isGroup;
	    if (!this.validateAiAgentsAvailableByTariff()) {
	      return;
	    }
	    const action = ((_actionConfig$isGroup = actionConfig.isGroupAction) != null ? _actionConfig$isGroup : false) ? ActionFactory.createGroupAction(actionConfig.actionId) : ActionFactory.create(actionConfig.actionId);
	    if (action) {
	      action.setGrid(babelHelpers.classPrivateFieldLooseBase(this, _grid$2)[_grid$2]);
	      action.setActionParams(actionConfig.params);
	      action.execute();
	    }
	  }
	  reload() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _grid$2)[_grid$2]) == null ? void 0 : _babelHelpers$classPr.reload();
	  }
	  validateAiAgentsAvailableByTariff() {
	    var _babelHelpers$classPr2;
	    const tariffInfo = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _settings)[_settings]) == null ? void 0 : _babelHelpers$classPr2.tariffInfo;
	    if (!(tariffInfo != null && tariffInfo.isAiAgentsAvailable)) {
	      TariffLimit.showFeatureSlider(tariffInfo == null ? void 0 : tariffInfo.aiAgentsTariffSliderCode);
	      return false;
	    }
	    return true;
	  }
	}
	function _subscribeToEvents2() {
	  main_core_events.EventEmitter.subscribe(TEMPLATE_SETUP_EVENT_NAME.SUCCESS, event => new TemplateSetupHandler(babelHelpers.classPrivateFieldLooseBase(this, _grid$2)[_grid$2]).handle(event));
	}
	GridManager.instances = [];

	exports.BaseField = BaseField;
	exports.AgentInfoField = AgentInfoField;
	exports.UsedByField = UsedByField;
	exports.EmployeeField = EmployeeField;
	exports.LaunchControlField = LaunchControlField;
	exports.LoadIndicatorField = LoadIndicatorField;
	exports.GridManager = GridManager;

}((this.BX.Bizproc.Ai.Agents = this.BX.Bizproc.Ai.Agents || {}),BX.Bizproc.Ai.Agents,BX.Main,BX.SidePanel,BX.UI.EntitySelector,BX.Messenger.v2.Lib,BX.Humanresources.CompanyStructure,BX.UI,BX.Main,BX.UI,BX.UI,BX.UI.System.Typography,BX.Event,BX.Bizproc,BX,BX.UI.Dialogs));
//# sourceMappingURL=grid.bundle.js.map
