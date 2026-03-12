/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports,ui_cnt,main_date,ui_notification,ui_system_chip,main_popup,ui_avatar,ui_icons_b24,ui_icon,ui_buttons,ui_analytics,main_core) {
	'use strict';

	var _fieldId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldId");
	var _gridId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("gridId");
	class BaseField {
	  constructor(params) {
	    var _params$gridId;
	    Object.defineProperty(this, _fieldId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _gridId, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldId)[_fieldId] = params.fieldId;
	    babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId] = (_params$gridId = params.gridId) != null ? _params$gridId : null;
	  }
	  getGridId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId];
	  }
	  getFieldId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _fieldId)[_fieldId];
	  }
	  getGrid() {
	    var _grid;
	    let grid = null;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId]) {
	      grid = BX.Main.gridManager.getById(babelHelpers.classPrivateFieldLooseBase(this, _gridId)[_gridId]);
	    }
	    return (_grid = grid) == null ? void 0 : _grid.instance;
	  }
	  getFieldNode() {
	    return document.getElementById(this.getFieldId());
	  }
	  appendToFieldNode(element) {
	    main_core.Dom.append(element, this.getFieldNode());
	  }
	}

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4;
	var _renderAvatar = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderAvatar");
	var _renderFullName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderFullName");
	var _getFullNameLink = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFullNameLink");
	var _getPositionLabelContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPositionLabelContainer");
	class EmployeeField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getPositionLabelContainer, {
	      value: _getPositionLabelContainer2
	    });
	    Object.defineProperty(this, _getFullNameLink, {
	      value: _getFullNameLink2
	    });
	    Object.defineProperty(this, _renderFullName, {
	      value: _renderFullName2
	    });
	    Object.defineProperty(this, _renderAvatar, {
	      value: _renderAvatar2
	    });
	  }
	  render(params) {
	    var _params$avatar;
	    const employeeFieldContainer = main_core.Tag.render(_t || (_t = _`
			<div class="mailbox-grid_employee-card-container"></div>
		`));
	    const avatar = babelHelpers.classPrivateFieldLooseBase(this, _renderAvatar)[_renderAvatar]((_params$avatar = params.avatar) == null ? void 0 : _params$avatar.src);
	    main_core.Dom.append(avatar, employeeFieldContainer);
	    const fullName = babelHelpers.classPrivateFieldLooseBase(this, _renderFullName)[_renderFullName](params);
	    main_core.Dom.append(fullName, employeeFieldContainer);
	    this.appendToFieldNode(employeeFieldContainer);
	  }
	}
	function _renderAvatar2(avatarPath) {
	  const avatarOptions = {
	    size: 28
	  };
	  if (avatarPath) {
	    avatarOptions.userpicPath = encodeURI(avatarPath);
	  }
	  const avatar = new ui_avatar.AvatarRound(avatarOptions);
	  const avatarNode = avatar.getContainer();
	  main_core.Dom.addClass(avatarNode, 'mailbox-grid_owner-photo');
	  return avatarNode;
	}
	function _renderFullName2(params) {
	  const fullNameContainer = main_core.Tag.render(_t2 || (_t2 = _`
			<div class="mailbox-grid_full-name-container">${0}</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getFullNameLink)[_getFullNameLink](params.name, params.pathToProfile));
	  if (params.position !== '') {
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getPositionLabelContainer)[_getPositionLabelContainer](main_core.Text.encode(params.position)), fullNameContainer);
	  }
	  return fullNameContainer;
	}
	function _getFullNameLink2(fullName, profileLink) {
	  return main_core.Tag.render(_t3 || (_t3 = _`
			<a class="mailbox-grid_full-name-label" href="${0}">
				${0}
			</a>
		`), profileLink, main_core.Text.encode(fullName));
	}
	function _getPositionLabelContainer2(position) {
	  return main_core.Tag.render(_t4 || (_t4 = _`
			<div class="mailbox-grid_position-label">
				${0}
			</div>
		`), main_core.Text.encode(position));
	}

	let _$1 = t => t,
	  _t$1,
	  _t2$1;
	var _senderName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("senderName");
	var _renderEmpty = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderEmpty");
	var _renderSenderName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSenderName");
	class SenderNameField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _renderSenderName, {
	      value: _renderSenderName2
	    });
	    Object.defineProperty(this, _renderEmpty, {
	      value: _renderEmpty2
	    });
	    Object.defineProperty(this, _senderName, {
	      writable: true,
	      value: void 0
	    });
	  }
	  render(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _senderName)[_senderName] = params.senderName;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _senderName)[_senderName] === '') {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderEmpty)[_renderEmpty]();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _renderSenderName)[_renderSenderName]();
	  }
	}
	function _renderEmpty2() {
	  const emptyContainer = main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<div class="mailbox-grid_sender-name --empty">
			</div>
		`));
	  this.appendToFieldNode(emptyContainer);
	}
	function _renderSenderName2() {
	  const senderNameContainer = main_core.Tag.render(_t2$1 || (_t2$1 = _$1`
			<div class="mailbox-grid_sender-name-container mailbox-grid_single-line_field">
				${0}
			</div>
		`), main_core.Text.encode(babelHelpers.classPrivateFieldLooseBase(this, _senderName)[_senderName]));
	  this.appendToFieldNode(senderNameContainer);
	}

	let _$2 = t => t,
	  _t$2,
	  _t2$2,
	  _t3$1;
	var _renderProviderIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderProviderIcon");
	var _getProviderKey = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getProviderKey");
	var _getProviderImgSrcClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getProviderImgSrcClass");
	class EmailWithCounterField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getProviderImgSrcClass, {
	      value: _getProviderImgSrcClass2
	    });
	    Object.defineProperty(this, _getProviderKey, {
	      value: _getProviderKey2
	    });
	    Object.defineProperty(this, _renderProviderIcon, {
	      value: _renderProviderIcon2
	    });
	  }
	  render(params) {
	    const counterNode = this.renderCounter(params.count, params.isOverLimit, params.counterHintText);
	    const iconNode = babelHelpers.classPrivateFieldLooseBase(this, _renderProviderIcon)[_renderProviderIcon](params.serviceName);
	    const emailContainer = main_core.Tag.render(_t$2 || (_t$2 = _$2`
			<div class="mailbox-grid_email-container">
				${0}
				<span class="mailbox-grid_email-text">${0}</span>
				${0}
			</div>
		`), iconNode, main_core.Text.encode(params.email), counterNode);
	    this.appendToFieldNode(emailContainer);
	    BX.UI.Hint.init(this.getFieldNode());
	  }
	  renderCounter(count, isOverLimit, hintText) {
	    if (!(main_core.Type.isNumber(count) && count > 0)) {
	      return null;
	    }
	    const maxValue = count;
	    const value = isOverLimit ? count + 1 : count;
	    const counter = new ui_cnt.Counter({
	      value,
	      maxValue,
	      useAirDesign: true,
	      style: ui_cnt.CounterStyle.FILLED_NO_ACCENT
	    });
	    const counterNode = main_core.Tag.render(_t2$2 || (_t2$2 = _$2`
			<div class="mailbox-grid_counter-container">
				${0}
			</div>
		`), counter.getContainer());
	    if (main_core.Type.isStringFilled(hintText)) {
	      main_core.Dom.attr(counterNode, {
	        'data-hint': hintText,
	        'data-hint-no-icon': 'true'
	      });
	    }
	    return counterNode;
	  }
	}
	function _renderProviderIcon2(serviceName) {
	  if (!main_core.Type.isStringFilled(serviceName)) {
	    return null;
	  }
	  const iconKey = babelHelpers.classPrivateFieldLooseBase(this, _getProviderKey)[_getProviderKey](serviceName);
	  const iconClass = babelHelpers.classPrivateFieldLooseBase(this, _getProviderImgSrcClass)[_getProviderImgSrcClass](iconKey);
	  return main_core.Tag.render(_t3$1 || (_t3$1 = _$2`
			<div class="mail-provider-img-container --grid-view">
				<div class="mailbox-grid_email-icon">
					<div class="mail-provider-img ${0}"></div>
				</div>
			</div>
		`), iconClass);
	}
	function _getProviderKey2(name) {
	  switch (name) {
	    case 'aol':
	      return 'aol';
	    case 'gmail':
	      return 'gmail';
	    case 'yahoo':
	      return 'yahoo';
	    case 'mail.ru':
	    case 'mailru':
	      return 'mailru';
	    case 'icloud':
	      return 'icloud';
	    case 'outlook.com':
	    case 'outlook':
	      return 'outlook';
	    case 'office365':
	      return 'office365';
	    case 'exchangeOnline':
	    case 'exchange':
	      return 'exchange';
	    case 'yandex':
	      return 'yandex';
	    case 'ukr.net':
	      return 'ukrnet';
	    case 'other':
	    case 'imap':
	      return 'other';
	    default:
	      return '';
	  }
	}
	function _getProviderImgSrcClass2(name) {
	  return `mail-provider-${name}-img`;
	}

	/**
	 * @abstract
	 */
	class BaseAction {
	  /**
	   * @abstract
	   */
	  static getActionId() {
	    throw new Error('not implemented');
	  }

	  /**
	   * @abstract
	   * @returns {ActionConfig}
	   */
	  getActionConfig() {
	    throw new Error('not implemented');
	  }
	  constructor(params) {
	    this.grid = params.grid;
	  }
	  setActionParams(params) {}
	  getActionData() {
	    return {};
	  }
	  async execute() {
	    this.onBeforeActionRequest();
	    await this.sendActionRequest();
	    this.onAfterActionRequest();
	  }
	  onBeforeActionRequest() {}
	  async sendActionRequest() {
	    try {
	      const result = await new Promise((resolve, reject) => {
	        const actionConfig = this.getActionConfig();
	        const actionData = this.getActionData();
	        const ajaxOptions = {
	          ...actionConfig.options,
	          data: actionData
	        };
	        let ajaxPromise = null;
	        switch (actionConfig.type) {
	          case 'controller':
	            ajaxPromise = BX.ajax.runAction(actionConfig.name, ajaxOptions);
	            break;
	          case 'component':
	            ajaxPromise = BX.ajax.runComponentAction(actionConfig.component, actionConfig.name, ajaxOptions);
	            break;
	          default:
	            {
	              const errorMessage = `Unknown action type: ${actionConfig.type}`;
	              const error = new Error(errorMessage);
	              error.errors = [{
	                message: errorMessage
	              }];
	              reject(error);
	              return;
	            }
	        }
	        ajaxPromise.then(resolve, reject);
	      });
	      this.handleSuccess(result);
	    } catch (result) {
	      this.handleError(result);
	    }
	  }
	  onAfterActionRequest() {}
	  handleSuccess(result) {}
	  handleError(result) {}
	}

	class SyncAction extends BaseAction {
	  static getActionId() {
	    return 'syncAction';
	  }
	  getActionConfig() {
	    return {
	      type: 'controller',
	      name: 'mail.mailboxconnecting.syncMailbox'
	    };
	  }
	  getActionData() {
	    return {
	      id: this.mailboxId,
	      onlySyncCurrent: 1
	    };
	  }
	  setActionParams(params) {
	    this.mailboxId = params.mailboxId;
	  }
	  onBeforeActionRequest() {
	    this.grid.tableFade();
	    const toastMessage = String(main_core.Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_SYNC_START'));
	    BX.UI.Notification.Center.notify({
	      content: toastMessage,
	      position: 'top-right',
	      autoHideDelay: 3000
	    });
	  }
	  onAfterActionRequest() {
	    this.grid.reload(() => {
	      this.grid.tableUnfade();
	    });
	  }
	}

	class OpenSettingsAction extends BaseAction {
	  static getActionId() {
	    return 'openSettingsAction';
	  }
	  setActionParams(params) {
	    this.mailboxId = params.mailboxId;
	  }
	  async execute() {
	    this.sendAnalytics();
	    const url = `/mail/config/edit?id=${this.mailboxId}`;
	    BX.SidePanel.Instance.open(url);
	  }
	  sendAnalytics() {
	    BX.UI.Analytics.sendData({
	      tool: 'mail',
	      event: 'mailbox_grid_edit',
	      category: 'mail_mass_ops',
	      c_element: 'context_menu'
	    });
	  }
	}

	const actionMap = new Map([[SyncAction.getActionId(), SyncAction], [OpenSettingsAction.getActionId(), OpenSettingsAction]]);
	class ActionFactory {
	  static create(actionId, options) {
	    const ActionClass = actionMap.get(actionId);
	    if (ActionClass) {
	      return new ActionClass(options);
	    }
	    return null;
	  }
	}

	var _grid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("grid");
	class GridManager {
	  constructor(gridId) {
	    var _BX$Main$gridManager$;
	    Object.defineProperty(this, _grid, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid] = (_BX$Main$gridManager$ = BX.Main.gridManager.getById(gridId)) == null ? void 0 : _BX$Main$gridManager$.instance;
	  }
	  static getInstance(gridId) {
	    if (!this.instances[gridId]) {
	      this.instances[gridId] = new GridManager(gridId);
	    }
	    return this.instances[gridId];
	  }
	  getGrid() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid];
	  }
	  runAction(config) {
	    const actionId = config.actionId;
	    const options = config.options;
	    options.grid = babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid];
	    const action = ActionFactory.create(actionId, options);
	    if (action) {
	      const params = config.params;
	      action.setActionParams(params);
	      action.execute();
	    }
	  }
	}
	GridManager.instances = [];

	let _$3 = t => t,
	  _t$3,
	  _t2$3,
	  _t3$2,
	  _t4$1,
	  _t5;
	var _getLastSyncContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLastSyncContainer");
	var _getLastSyncRightNowContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLastSyncRightNowContainer");
	var _getLastSyncButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLastSyncButton");
	var _getErrorMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getErrorMessage");
	class LastSyncField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getErrorMessage, {
	      value: _getErrorMessage2
	    });
	    Object.defineProperty(this, _getLastSyncButton, {
	      value: _getLastSyncButton2
	    });
	    Object.defineProperty(this, _getLastSyncRightNowContainer, {
	      value: _getLastSyncRightNowContainer2
	    });
	    Object.defineProperty(this, _getLastSyncContainer, {
	      value: _getLastSyncContainer2
	    });
	  }
	  render(params) {
	    const lastSyncContainer = main_core.Tag.render(_t$3 || (_t$3 = _$3`
			<div class="mailbox-grid_last-sync-container mailbox-grid_single-line_field"></div>
		`));
	    if (params.hasError) {
	      main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getErrorMessage)[_getErrorMessage](), lastSyncContainer);
	    } else {
	      if (params.lastSync) {
	        main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getLastSyncContainer)[_getLastSyncContainer](params.lastSync), lastSyncContainer);
	      } else {
	        main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getLastSyncRightNowContainer)[_getLastSyncRightNowContainer](), lastSyncContainer);
	      }
	      if (params.mailboxId && params.canEdit) {
	        main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getLastSyncButton)[_getLastSyncButton](params.mailboxId), lastSyncContainer);
	      }
	    }
	    this.appendToFieldNode(lastSyncContainer);
	  }
	}
	function _getLastSyncContainer2(lastSync) {
	  let formattedTime = lastSync;
	  if (/^\d+$/.test(lastSync)) {
	    const timestamp = parseInt(lastSync, 10);
	    formattedTime = main_date.DateTimeFormat.formatLastActivityDate(timestamp);
	  }
	  return main_core.Tag.render(_t2$3 || (_t2$3 = _$3`
			<span class="mailbox-grid_last-sync-text">${0}</span>
		`), main_core.Text.encode(formattedTime));
	}
	function _getLastSyncRightNowContainer2() {
	  return main_core.Tag.render(_t3$2 || (_t3$2 = _$3`
			<span class="mailbox-grid_last-sync-text">${0}</span>
		`), main_core.Loc.getMessage('MAIL_MAILBOX_LIST_LAST_SYNC_NEW_CONNECT'));
	}
	function _getLastSyncButton2(mailboxId) {
	  const button = main_core.Tag.render(_t4$1 || (_t4$1 = _$3`
			<div class="mailbox-grid_last-sync-button ui-icon-set --o-refresh" data-test-id="mailbox-grid_refresh-button"></div>
		`));
	  main_core.Event.bind(button, 'click', () => {
	    GridManager.getInstance(this.getGrid().containerId).runAction({
	      actionId: 'syncAction',
	      options: {},
	      params: {
	        mailboxId
	      }
	    });
	  });
	  return button;
	}
	function _getErrorMessage2() {
	  return main_core.Tag.render(_t5 || (_t5 = _$3`
			<span class="mailbox-grid_last-sync-error-message">
				${0}
			</span>
		`), main_core.Loc.getMessage('MAIL_MAILBOX_LIST_LAST_SYNC_ERROR_MESSAGE'));
	}

	let _$4 = t => t,
	  _t$4;
	var _getStatusLabel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStatusLabel");
	class CRMStatusField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getStatusLabel, {
	      value: _getStatusLabel2
	    });
	  }
	  render(params) {
	    const crmStatusContainer = main_core.Tag.render(_t$4 || (_t$4 = _$4`
			<div class="mailbox-grid_active-status-container">
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getStatusLabel)[_getStatusLabel](params.enabled));
	    this.appendToFieldNode(crmStatusContainer);
	  }
	}
	function _getStatusLabel2(active) {
	  const text = active ? main_core.Loc.getMessage('MAIL_MAILBOX_LIST_FIELD_CRM_STATUS_ENABLED') : main_core.Loc.getMessage('MAIL_MAILBOX_LIST_FIELD_CRM_STATUS_DISABLED');
	  const design = active ? ui_system_chip.ChipDesign.OutlineSuccess : ui_system_chip.ChipDesign.Outline;
	  return new ui_system_chip.Chip({
	    size: ui_system_chip.ChipSize.Sm,
	    rounded: true,
	    text,
	    design
	  }).render();
	}

	const EntityTypes = Object.freeze({
	  USER: 'USER',
	  DEPARTMENT: 'DEPARTMENT'
	});

	let _$5 = t => t,
	  _t$5,
	  _t2$4,
	  _t3$3,
	  _t4$2,
	  _t5$1,
	  _t6;
	var _entities = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entities");
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _targetNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetNode");
	var _renderEntity = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderEntity");
	var _getContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	class EntityListPopup {
	  constructor(params) {
	    Object.defineProperty(this, _getContent, {
	      value: _getContent2
	    });
	    Object.defineProperty(this, _renderEntity, {
	      value: _renderEntity2
	    });
	    Object.defineProperty(this, _entities, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _targetNode, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _entities)[_entities] = params.entities;
	    babelHelpers.classPrivateFieldLooseBase(this, _targetNode)[_targetNode] = params.targetNode;
	  }
	  show() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = new main_popup.Popup({
	      id: `entities-with-avatars-popup-${main_core.Text.getRandom()}`,
	      bindElement: babelHelpers.classPrivateFieldLooseBase(this, _targetNode)[_targetNode],
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getContent)[_getContent](),
	      lightShadow: true,
	      autoHide: true,
	      closeByEsc: true,
	      className: 'popup-window-mailbox-entity-list',
	      bindOptions: {
	        position: 'top'
	      },
	      animationOptions: {
	        show: {
	          type: 'opacity-transform'
	        },
	        close: {
	          type: 'opacity'
	        }
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	  }
	}
	function _renderEntity2(entity) {
	  if (entity.type === EntityTypes.USER) {
	    var _entity$avatar;
	    const userpicSize = 20;
	    let avatarNode = null;
	    if (main_core.Type.isStringFilled((_entity$avatar = entity.avatar) == null ? void 0 : _entity$avatar.src)) {
	      const avatar = new BX.UI.AvatarRound({
	        size: userpicSize,
	        userName: entity.name,
	        userpicPath: encodeURI(entity.avatar.src)
	      });
	      avatarNode = avatar.getContainer();
	    } else {
	      const avatar = new BX.UI.AvatarRound({
	        size: userpicSize
	      });
	      avatarNode = avatar.getContainer();
	    }
	    if (main_core.Type.isStringFilled(entity.pathToProfile)) {
	      return main_core.Tag.render(_t$5 || (_t$5 = _$5`
					<a
						href="${0}"
						target="_blank"
						title="${0}"
						class="mailbox-grid_user-list-popup-popup-img"
					>
						<span class="mailbox-grid_user-list-popup-popup-avatar-new">${0}</span>
						<span class="mailbox-grid_user-list-popup-popup-name-link">${0}</span>
					</a>
				`), entity.pathToProfile, main_core.Text.encode(entity.name), avatarNode, main_core.Text.encode(entity.name));
	    }
	    return main_core.Tag.render(_t2$4 || (_t2$4 = _$5`
				<div
					class="mailbox-grid_user-list-popup-popup-img"
					title="${0}"
				>
					<span class="mailbox-grid_user-list-popup-popup-avatar-new">${0}</span>
					<span class="mailbox-grid_user-list-popup-popup-name">${0}</span>
				</div>
			`), main_core.Text.encode(entity.name), avatarNode, main_core.Text.encode(entity.name));
	  }
	  if (entity.type === EntityTypes.DEPARTMENT) {
	    const iconNode = main_core.Tag.render(_t3$3 || (_t3$3 = _$5`<div class="ui-icon ui-icon-common-company"><i></i></div>`));
	    if (main_core.Type.isStringFilled(entity.pathToStructure)) {
	      return main_core.Tag.render(_t4$2 || (_t4$2 = _$5`
					<a
						href="${0}"
						target="_blank"
						title="${0}"
						class="mailbox-grid_user-list-popup-popup-img --icon"
					>
						<span class="mailbox-grid_user-list-popup-popup-avatar-new --icon">${0}</span>
						<span class="mailbox-grid_user-list-popup-popup-name-link">${0}</span>
					</a>
				`), entity.pathToStructure, main_core.Text.encode(entity.name), iconNode, main_core.Text.encode(entity.name));
	    }
	    return main_core.Tag.render(_t5$1 || (_t5$1 = _$5`
				<div
					class="mailbox-grid_user-list-popup-popup-img --icon"
					title="${0}"
				>
					<span class="mailbox-grid_user-list-popup-popup-avatar-new --icon">${0}</span>
					<span class="mailbox-grid_user-list-popup-popup-name">${0}</span>
				</div>
			`), main_core.Text.encode(entity.name), iconNode, main_core.Text.encode(entity.name));
	  }
	  return null;
	}
	function _getContent2() {
	  const entityNodes = document.createDocumentFragment();
	  babelHelpers.classPrivateFieldLooseBase(this, _entities)[_entities].forEach(entity => {
	    const entityNode = babelHelpers.classPrivateFieldLooseBase(this, _renderEntity)[_renderEntity](entity);
	    if (entityNode) {
	      main_core.Dom.append(entityNode, entityNodes);
	    }
	  });
	  return main_core.Tag.render(_t6 || (_t6 = _$5`
			<div class="mailbox-grid_user-list-popup-wrap-block">
				<div class="mailbox-grid_user-list-popup-popup-outer">
					<div class="mailbox-grid_user-list-popup-popup">
						${0}
					</div>
				</div>
			</div>
		`), entityNodes);
	}

	let _$6 = t => t,
	  _t$6,
	  _t2$5,
	  _t3$4,
	  _t4$3,
	  _t5$2,
	  _t6$1,
	  _t7,
	  _t8;
	var _entities$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entities");
	var _popup$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _renderEmpty$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderEmpty");
	var _renderEntities = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderEntities");
	var _renderSingleEntityLayout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSingleEntityLayout");
	var _renderMultipleEntitiesLayout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderMultipleEntitiesLayout");
	var _renderEntityIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderEntityIcon");
	var _showPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showPopup");
	var _renderUserAvatar = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderUserAvatar");
	var _renderDepartmentIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderDepartmentIcon");
	var _renderCounter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCounter");
	class EntitiesWithAvatarsField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _renderCounter, {
	      value: _renderCounter2
	    });
	    Object.defineProperty(this, _renderDepartmentIcon, {
	      value: _renderDepartmentIcon2
	    });
	    Object.defineProperty(this, _renderUserAvatar, {
	      value: _renderUserAvatar2
	    });
	    Object.defineProperty(this, _showPopup, {
	      value: _showPopup2
	    });
	    Object.defineProperty(this, _renderEntityIcon, {
	      value: _renderEntityIcon2
	    });
	    Object.defineProperty(this, _renderMultipleEntitiesLayout, {
	      value: _renderMultipleEntitiesLayout2
	    });
	    Object.defineProperty(this, _renderSingleEntityLayout, {
	      value: _renderSingleEntityLayout2
	    });
	    Object.defineProperty(this, _renderEntities, {
	      value: _renderEntities2
	    });
	    Object.defineProperty(this, _renderEmpty$1, {
	      value: _renderEmpty2$1
	    });
	    Object.defineProperty(this, _entities$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _popup$1, {
	      writable: true,
	      value: void 0
	    });
	  }
	  render(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _entities$1)[_entities$1] = main_core.Type.isArray(params.entities) ? params.entities : [];
	    if (babelHelpers.classPrivateFieldLooseBase(this, _entities$1)[_entities$1].length === 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderEmpty$1)[_renderEmpty$1]();
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _renderEntities)[_renderEntities]();
	  }
	}
	function _renderEmpty2$1() {
	  const emptyContainer = main_core.Tag.render(_t$6 || (_t$6 = _$6`
			<div class="mailbox-grid_list-members --empty"></div>
		`));
	  this.appendToFieldNode(emptyContainer);
	}
	function _renderEntities2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _entities$1)[_entities$1].length === 1) {
	    const entityNode = babelHelpers.classPrivateFieldLooseBase(this, _renderSingleEntityLayout)[_renderSingleEntityLayout]();
	    this.appendToFieldNode(entityNode);
	  } else {
	    const entitiesNode = babelHelpers.classPrivateFieldLooseBase(this, _renderMultipleEntitiesLayout)[_renderMultipleEntitiesLayout]();
	    main_core.Event.bind(entitiesNode, 'click', () => babelHelpers.classPrivateFieldLooseBase(this, _showPopup)[_showPopup](entitiesNode));
	    this.appendToFieldNode(entitiesNode);
	  }
	}
	function _renderSingleEntityLayout2() {
	  const entity = babelHelpers.classPrivateFieldLooseBase(this, _entities$1)[_entities$1][0];
	  const name = main_core.Text.encode(entity.name) || '';
	  const nameNode = main_core.Tag.render(_t2$5 || (_t2$5 = _$6`<span class="mailbox-grid_list-members-name">${0}</span>`), name);
	  if (entity.type === EntityTypes.USER) {
	    const container = main_core.Tag.render(_t3$4 || (_t3$4 = _$6`
				<a href="${0}" class="mailbox-grid_list-members --single-member --link"></a>
			`), entity.pathToProfile);
	    const avatar = babelHelpers.classPrivateFieldLooseBase(this, _renderUserAvatar)[_renderUserAvatar](entity);
	    main_core.Dom.append(avatar, container);
	    main_core.Dom.append(nameNode, container);
	    return container;
	  }
	  const icon = babelHelpers.classPrivateFieldLooseBase(this, _renderDepartmentIcon)[_renderDepartmentIcon]();
	  let container = main_core.Tag.render(_t4$3 || (_t4$3 = _$6`
			<div class="mailbox-grid_list-members --single-member"></div>
		`));
	  if (main_core.Type.isStringFilled(entity.pathToStructure)) {
	    container = main_core.Tag.render(_t5$2 || (_t5$2 = _$6`
				<a href="${0}" class="mailbox-grid_list-members --single-member --link"></a>
			`), entity.pathToStructure);
	  }
	  main_core.Dom.append(icon, container);
	  main_core.Dom.append(nameNode, container);
	  return container;
	}
	function _renderMultipleEntitiesLayout2() {
	  const maxVisibleIcons = 3;
	  const visibleEntities = babelHelpers.classPrivateFieldLooseBase(this, _entities$1)[_entities$1].slice(0, maxVisibleIcons);
	  const remainingCount = babelHelpers.classPrivateFieldLooseBase(this, _entities$1)[_entities$1].length - visibleEntities.length;
	  const iconsContainer = main_core.Tag.render(_t6$1 || (_t6$1 = _$6`<div class="mailbox-grid_list-members"></div>`));
	  visibleEntities.forEach(entity => {
	    const icon = babelHelpers.classPrivateFieldLooseBase(this, _renderEntityIcon)[_renderEntityIcon](entity);
	    if (icon) {
	      main_core.Dom.append(icon, iconsContainer);
	    }
	  });
	  if (remainingCount > 0) {
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _renderCounter)[_renderCounter](remainingCount), iconsContainer);
	  }
	  return iconsContainer;
	}
	function _renderEntityIcon2(entity) {
	  switch (entity.type) {
	    case EntityTypes.USER:
	      return babelHelpers.classPrivateFieldLooseBase(this, _renderUserAvatar)[_renderUserAvatar](entity);
	    case EntityTypes.DEPARTMENT:
	      return babelHelpers.classPrivateFieldLooseBase(this, _renderDepartmentIcon)[_renderDepartmentIcon]();
	    default:
	      return null;
	  }
	}
	function _showPopup2(targetElement) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1] = new EntityListPopup({
	      entities: babelHelpers.classPrivateFieldLooseBase(this, _entities$1)[_entities$1],
	      targetNode: targetElement
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1].show();
	}
	function _renderUserAvatar2(user) {
	  var _user$avatar, _user$avatar2;
	  const avatarSrc = encodeURI((_user$avatar = user.avatar) == null ? void 0 : _user$avatar.src) || '';
	  const userName = main_core.Text.encode(user.name) || '';
	  const userpicSize = 28;
	  let avatar = null;
	  if (main_core.Type.isStringFilled((_user$avatar2 = user.avatar) == null ? void 0 : _user$avatar2.src)) {
	    avatar = new ui_avatar.AvatarRound({
	      size: userpicSize,
	      userName,
	      userpicPath: avatarSrc
	    });
	  } else {
	    avatar = new ui_avatar.AvatarRound({
	      size: userpicSize
	    });
	  }
	  const avatarNode = avatar.getContainer();
	  main_core.Dom.addClass(avatarNode, 'mailbox-grid_list-members-icon_element');
	  return avatarNode;
	}
	function _renderDepartmentIcon2() {
	  return main_core.Tag.render(_t7 || (_t7 = _$6`
			<div class="mailbox-grid_list-members-icon_element">
				<div class="ui-icon ui-icon-common-company"><i></i></div> 
			</div>
		`));
	}
	function _renderCounter2(count) {
	  return main_core.Tag.render(_t8 || (_t8 = _$6`
			<div class="mailbox-grid_list-members-icon_element --count">
				<span class="mailbox-grid_warning-icon_element-plus">+</span>
				<span class="mailbox-grid_warning-icon_element-number">${0}</span>
			</div>
		`), count);
	}

	let _$7 = t => t,
	  _t$7,
	  _t2$6;
	var _renderCountWithLimit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCountWithLimit");
	var _renderCount = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCount");
	class DailySentCountField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _renderCount, {
	      value: _renderCount2
	    });
	    Object.defineProperty(this, _renderCountWithLimit, {
	      value: _renderCountWithLimit2
	    });
	  }
	  render(params) {
	    if (main_core.Type.isNull(params.dailySentLimit)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderCount)[_renderCount](params.dailySentCount);
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _renderCountWithLimit)[_renderCountWithLimit](params.dailySentCount, params.dailySentLimit);
	  }
	}
	function _renderCountWithLimit2(dailySentCount, dailySentLimit) {
	  const dailySentContainer = main_core.Tag.render(_t$7 || (_t$7 = _$7`
			<div class="mailbox-grid_daily-sent-count-container">
				${0}/${0}
			</div>
		`), dailySentCount, dailySentLimit);
	  this.appendToFieldNode(dailySentContainer);
	}
	function _renderCount2(dailySentCount) {
	  const dailySentContainer = main_core.Tag.render(_t2$6 || (_t2$6 = _$7`
			<div class="mailbox-grid_daily-sent-count-container">
				${0}
			</div>
		`), dailySentCount);
	  this.appendToFieldNode(dailySentContainer);
	}

	let _$8 = t => t,
	  _t$8,
	  _t2$7;
	var _renderCountWithLimit$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCountWithLimit");
	var _renderCount$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCount");
	class MonthlySentCountField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _renderCount$1, {
	      value: _renderCount2$1
	    });
	    Object.defineProperty(this, _renderCountWithLimit$1, {
	      value: _renderCountWithLimit2$1
	    });
	  }
	  render(params) {
	    if (main_core.Type.isNull(params.monthlySentLimit) || !params.monthlySentLimit > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderCount$1)[_renderCount$1](params.monthlySentCount);
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _renderCountWithLimit$1)[_renderCountWithLimit$1](params.monthlySentCount, params.monthlySentLimit);
	  }
	}
	function _renderCountWithLimit2$1(monthlySentCount, monthlySentLimit) {
	  const percentagePrecision = 2;
	  const percentageMultiplier = 100;
	  const percent = (monthlySentCount / monthlySentLimit * percentageMultiplier).toFixed(percentagePrecision);
	  const dailySentContainer = main_core.Tag.render(_t$8 || (_t$8 = _$8`
			<div class="mailbox-grid_daily-sent-count-container">
				${0}/${0} (${0}%)
			</div>
		`), monthlySentCount, monthlySentLimit, percent);
	  this.appendToFieldNode(dailySentContainer);
	}
	function _renderCount2$1(monthlySentCount) {
	  const monthlySentContainer = main_core.Tag.render(_t2$7 || (_t2$7 = _$8`
			<div class="mailbox-grid_monthly-sent-count-container">
				${0}
			</div>
		`), monthlySentCount);
	  this.appendToFieldNode(monthlySentContainer);
	}

	let _$9 = t => t,
	  _t$9;
	var _sendAnalytics = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendAnalytics");
	var _handleClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleClick");
	var _getState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getState");
	class ActionField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getState, {
	      value: _getState2
	    });
	    Object.defineProperty(this, _handleClick, {
	      value: _handleClick2
	    });
	    Object.defineProperty(this, _sendAnalytics, {
	      value: _sendAnalytics2
	    });
	  }
	  render(params) {
	    var _params$canEdit;
	    const actionContainer = main_core.Tag.render(_t$9 || (_t$9 = _$9`
			<div class="mailbox-grid_action-field-container"></div>
		`));
	    let button = null;
	    let buttonNode = null;
	    const state = babelHelpers.classPrivateFieldLooseBase(this, _getState)[_getState]((_params$canEdit = params.canEdit) != null ? _params$canEdit : false);
	    if (params.hasError) {
	      button = new ui_buttons.Button({
	        size: ui_buttons.Button.Size.MEDIUM,
	        text: main_core.Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_ERROR_ACTION'),
	        useAirDesign: true,
	        noCaps: true,
	        wide: false,
	        state,
	        onclick: () => {
	          if (params.canEdit) {
	            const source = 'error_button';
	            babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytics)[_sendAnalytics](source);
	            babelHelpers.classPrivateFieldLooseBase(this, _handleClick)[_handleClick](params.url);
	          }
	        },
	        className: 'mailbox-grid_action-button',
	        dataset: {
	          id: 'mailbox-grid_action-button-error-action'
	        }
	      });
	      buttonNode = button.render();
	      main_core.Dom.append(buttonNode, actionContainer);
	    } else {
	      button = new ui_buttons.Button({
	        size: ui_buttons.Button.Size.MEDIUM,
	        text: main_core.Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_TITLE'),
	        useAirDesign: true,
	        style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
	        noCaps: true,
	        wide: false,
	        state,
	        onclick: () => {
	          if (params.canEdit) {
	            const source = 'edit_button';
	            babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytics)[_sendAnalytics](source);
	            babelHelpers.classPrivateFieldLooseBase(this, _handleClick)[_handleClick](params.url);
	          }
	        },
	        className: 'mailbox-grid_action-button',
	        dataset: {
	          id: 'mailbox-grid_action-button-default-action'
	        }
	      });
	      buttonNode = button.render();
	      main_core.Dom.append(buttonNode, actionContainer);
	    }
	    this.appendToFieldNode(actionContainer);
	    if (!params.canEdit) {
	      main_core.Dom.attr(buttonNode, {
	        'data-hint': main_core.Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_ACCESS_LOCK'),
	        'data-hint-no-icon': 'true'
	      });
	      BX.UI.Hint.init(this.getFieldNode());
	    }
	  }
	}
	function _sendAnalytics2(source) {
	  ui_analytics.sendData({
	    tool: 'mail',
	    event: 'mailbox_grid_edit',
	    category: 'mail_mass_ops',
	    c_element: source
	  });
	}
	function _handleClick2(url) {
	  BX.SidePanel.Instance.open(url);
	}
	function _getState2(canEdit) {
	  return canEdit ? null : ui_buttons.Button.State.DISABLED;
	}

	let _$a = t => t,
	  _t$a,
	  _t2$8;
	var _mailboxName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mailboxName");
	var _renderEmpty$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderEmpty");
	var _renderMailboxName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderMailboxName");
	class MailboxNameField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _renderMailboxName, {
	      value: _renderMailboxName2
	    });
	    Object.defineProperty(this, _renderEmpty$2, {
	      value: _renderEmpty2$2
	    });
	    Object.defineProperty(this, _mailboxName, {
	      writable: true,
	      value: void 0
	    });
	  }
	  render(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _mailboxName)[_mailboxName] = params.mailboxName;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _mailboxName)[_mailboxName] === '') {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderEmpty$2)[_renderEmpty$2]();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _renderMailboxName)[_renderMailboxName]();
	  }
	}
	function _renderEmpty2$2() {
	  const emptyContainer = main_core.Tag.render(_t$a || (_t$a = _$a`
			<div class="mailbox-grid_mailbox-name --empty">
			</div>
		`));
	  this.appendToFieldNode(emptyContainer);
	}
	function _renderMailboxName2() {
	  const mailboxNameContainer = main_core.Tag.render(_t2$8 || (_t2$8 = _$a`
			<div class="mailbox-grid_mailbox-name-container mailbox-grid_single-line_field">
				${0}
			</div>
		`), main_core.Text.encode(babelHelpers.classPrivateFieldLooseBase(this, _mailboxName)[_mailboxName]));
	  this.appendToFieldNode(mailboxNameContainer);
	}

	let _$b = t => t,
	  _t$b,
	  _t2$9;
	var _diskAmount = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("diskAmount");
	var _renderEmpty$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderEmpty");
	var _renderMailboxName$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderMailboxName");
	class DiskAmountField extends BaseField {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _renderMailboxName$1, {
	      value: _renderMailboxName2$1
	    });
	    Object.defineProperty(this, _renderEmpty$3, {
	      value: _renderEmpty2$3
	    });
	    Object.defineProperty(this, _diskAmount, {
	      writable: true,
	      value: void 0
	    });
	  }
	  render(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _diskAmount)[_diskAmount] = params.diskAmount;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _diskAmount)[_diskAmount] === '') {
	      babelHelpers.classPrivateFieldLooseBase(this, _renderEmpty$3)[_renderEmpty$3]();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _renderMailboxName$1)[_renderMailboxName$1]();
	  }
	}
	function _renderEmpty2$3() {
	  const emptyContainer = main_core.Tag.render(_t$b || (_t$b = _$b`
			<div class="mailbox-grid_disk-amount --empty">
			</div>
		`));
	  this.appendToFieldNode(emptyContainer);
	}
	function _renderMailboxName2$1() {
	  const diskAmountContainer = main_core.Tag.render(_t2$9 || (_t2$9 = _$b`
			<div class="mailbox-grid_disk-amount-container mailbox-grid_single-line_field">
				${0}
			</div>
		`), main_core.Text.encode(babelHelpers.classPrivateFieldLooseBase(this, _diskAmount)[_diskAmount]));
	  this.appendToFieldNode(diskAmountContainer);
	}

	exports.BaseField = BaseField;
	exports.EmployeeField = EmployeeField;
	exports.SenderNameField = SenderNameField;
	exports.EmailWithCounterField = EmailWithCounterField;
	exports.LastSyncField = LastSyncField;
	exports.CRMStatusField = CRMStatusField;
	exports.EntitiesWithAvatarsField = EntitiesWithAvatarsField;
	exports.DailySentCountField = DailySentCountField;
	exports.MonthlySentCountField = MonthlySentCountField;
	exports.ActionField = ActionField;
	exports.MailboxNameField = MailboxNameField;
	exports.DiskAmountField = DiskAmountField;
	exports.GridManager = GridManager;

}((this.BX.Mail.MailboxList = this.BX.Mail.MailboxList || {}),BX.UI,BX.Main,BX,BX.UI.System.Chip,BX.Main,BX.UI,BX,BX,BX.UI,BX.UI.Analytics,BX));
//# sourceMappingURL=grid.bundle.js.map
