/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core,main_core_events,im_v2_lib_logger,im_v2_application_core,im_v2_const,ui_dexie,im_v2_lib_localStorage) {
	'use strict';

	const DB_NAME = 'bx-im-drafts';
	const recentDraftLocalStorageKey = 'recentDraft';
	const copilotDraftLocalStorageKey = 'copilotDraft';
	class IndexedDbManager {
	  static getInstance() {
	    if (!this.instance) {
	      this.instance = new this();
	    }
	    return this.instance;
	  }
	  constructor() {
	    this.db = new ui_dexie.Dexie(DB_NAME);
	    this.db.version(1).stores({
	      drafts: ''
	    });
	  }
	  async migrateFromLocalStorage() {
	    const migrationStatus = await this.db.drafts.get('migration_status');
	    if (migrationStatus) {
	      return;
	    }
	    const recentDrafts = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(recentDraftLocalStorageKey, {});
	    this.set(recentDraftLocalStorageKey, recentDrafts);
	    im_v2_lib_localStorage.LocalStorageManager.getInstance().remove(recentDraftLocalStorageKey);
	    const copilotDrafts = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(copilotDraftLocalStorageKey, {});
	    this.set(copilotDraftLocalStorageKey, copilotDrafts);
	    im_v2_lib_localStorage.LocalStorageManager.getInstance().remove(copilotDraftLocalStorageKey);
	    this.setMigrationFinished();
	  }
	  set(key, value) {
	    this.db.drafts.put(value, key);
	  }
	  setMigrationFinished() {
	    const result = {
	      [recentDraftLocalStorageKey]: true,
	      [copilotDraftLocalStorageKey]: true
	    };
	    this.db.drafts.put(result, 'migration_status');
	  }
	  async get(key, defaultValue = null) {
	    await this.migrateFromLocalStorage();
	    const value = await this.db.drafts.get(key);
	    return value || defaultValue;
	  }
	}

	const WRITE_TO_STORAGE_TIMEOUT = 1000;
	const SHOW_DRAFT_IN_RECENT_TIMEOUT = 1500;
	const STORAGE_KEY = 'recentDraft';
	const NOT_AVAILABLE_CHAT_TYPES = new Set([im_v2_const.ChatType.comment]);
	const STANDALONE_SECTION_CHAT_TYPES = new Set([im_v2_const.ChatType.taskComments]);
	var _fillDraftsFromStorage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillDraftsFromStorage");
	var _setRecentListDraftText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setRecentListDraftText");
	var _setRecentItemDraftText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setRecentItemDraftText");
	var _onLayoutChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onLayoutChange");
	var _refreshSaveTimeout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refreshSaveTimeout");
	var _saveToIndexedDb = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveToIndexedDb");
	var _prepareDrafts = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareDrafts");
	var _canSetRecentItemDraftText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canSetRecentItemDraftText");
	var _getChat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChat");
	var _isValidDialogId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isValidDialogId");
	class DraftManager {
	  static getInstance() {
	    if (!DraftManager.instance) {
	      DraftManager.instance = new DraftManager();
	    }
	    return DraftManager.instance;
	  }
	  constructor() {
	    Object.defineProperty(this, _isValidDialogId, {
	      value: _isValidDialogId2
	    });
	    Object.defineProperty(this, _getChat, {
	      value: _getChat2
	    });
	    Object.defineProperty(this, _canSetRecentItemDraftText, {
	      value: _canSetRecentItemDraftText2
	    });
	    Object.defineProperty(this, _prepareDrafts, {
	      value: _prepareDrafts2
	    });
	    Object.defineProperty(this, _saveToIndexedDb, {
	      value: _saveToIndexedDb2
	    });
	    Object.defineProperty(this, _refreshSaveTimeout, {
	      value: _refreshSaveTimeout2
	    });
	    Object.defineProperty(this, _onLayoutChange, {
	      value: _onLayoutChange2
	    });
	    Object.defineProperty(this, _setRecentItemDraftText, {
	      value: _setRecentItemDraftText2
	    });
	    Object.defineProperty(this, _setRecentListDraftText, {
	      value: _setRecentListDraftText2
	    });
	    Object.defineProperty(this, _fillDraftsFromStorage, {
	      value: _fillDraftsFromStorage2
	    });
	    this.inited = false;
	    this.drafts = {};
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.layout.onLayoutChange, babelHelpers.classPrivateFieldLooseBase(this, _onLayoutChange)[_onLayoutChange].bind(this));
	  }
	  async initDraftHistory() {
	    let draftHistory = null;
	    try {
	      draftHistory = await IndexedDbManager.getInstance().get(STORAGE_KEY, {});
	    } catch (error) {
	      // eslint-disable-next-line no-console
	      console.error('DraftManager: error initing draft history', error);
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _fillDraftsFromStorage)[_fillDraftsFromStorage](draftHistory);
	    im_v2_lib_logger.Logger.warn('DraftManager: initDrafts:', this.drafts);
	    babelHelpers.classPrivateFieldLooseBase(this, _setRecentListDraftText)[_setRecentListDraftText]();
	    this.inited = true;
	  }
	  setDraftText(dialogId, text) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidDialogId)[_isValidDialogId](dialogId)) {
	      return;
	    }
	    if (!this.drafts[dialogId]) {
	      this.drafts[dialogId] = {};
	    }
	    this.drafts[dialogId].text = text.trim();
	    babelHelpers.classPrivateFieldLooseBase(this, _refreshSaveTimeout)[_refreshSaveTimeout]();
	  }
	  setDraftPanel(dialogId, panelType, panelContext) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidDialogId)[_isValidDialogId](dialogId)) {
	      return;
	    }
	    if (!this.drafts[dialogId]) {
	      this.drafts[dialogId] = {};
	    }
	    this.drafts[dialogId].panelType = panelType;
	    this.drafts[dialogId].panelContext = panelContext;
	    babelHelpers.classPrivateFieldLooseBase(this, _refreshSaveTimeout)[_refreshSaveTimeout]();
	  }
	  setDraftMentions(dialogId, mentions) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidDialogId)[_isValidDialogId](dialogId)) {
	      return;
	    }
	    if (!this.drafts[dialogId]) {
	      this.drafts[dialogId] = {};
	    }
	    this.drafts[dialogId].mentions = mentions;
	    babelHelpers.classPrivateFieldLooseBase(this, _refreshSaveTimeout)[_refreshSaveTimeout]();
	  }
	  async getDraft(dialogId) {
	    var _this$drafts$dialogId;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidDialogId)[_isValidDialogId](dialogId)) {
	      return {};
	    }
	    if (!this.inited) {
	      await this.initDraftHistory();
	    }
	    return (_this$drafts$dialogId = this.drafts[dialogId]) != null ? _this$drafts$dialogId : {};
	  }
	  clearDraft(dialogId) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidDialogId)[_isValidDialogId](dialogId)) {
	      return;
	    }
	    delete this.drafts[dialogId];
	    babelHelpers.classPrivateFieldLooseBase(this, _setRecentItemDraftText)[_setRecentItemDraftText](dialogId, '');
	  }
	}
	function _fillDraftsFromStorage2(draftHistory) {
	  if (!main_core.Type.isPlainObject(draftHistory)) {
	    return;
	  }
	  Object.entries(draftHistory).forEach(([dialogId, draft]) => {
	    if (!main_core.Type.isPlainObject(draft) || !babelHelpers.classPrivateFieldLooseBase(this, _isValidDialogId)[_isValidDialogId](dialogId)) {
	      return;
	    }
	    this.drafts[dialogId] = draft;
	  });
	}
	function _setRecentListDraftText2() {
	  Object.entries(this.drafts).forEach(([dialogId, draft]) => {
	    var _draft$text;
	    babelHelpers.classPrivateFieldLooseBase(this, _setRecentItemDraftText)[_setRecentItemDraftText](dialogId, (_draft$text = draft.text) != null ? _draft$text : '');
	  });
	}
	function _setRecentItemDraftText2(dialogId, text) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _canSetRecentItemDraftText)[_canSetRecentItemDraftText](dialogId)) {
	    return;
	  }
	  const {
	    type: chatType
	  } = babelHelpers.classPrivateFieldLooseBase(this, _getChat)[_getChat](dialogId);
	  void im_v2_application_core.Core.getStore().dispatch('recent/setDraft', {
	    dialogId,
	    text,
	    addFakeItems: !STANDALONE_SECTION_CHAT_TYPES.has(chatType)
	  });
	}
	function _onLayoutChange2(event) {
	  const {
	    from
	  } = event.getData();
	  const dialogId = from.entityId;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidDialogId)[_isValidDialogId](dialogId)) {
	    return;
	  }
	  setTimeout(async () => {
	    const {
	      text = ''
	    } = await this.getDraft(dialogId);
	    babelHelpers.classPrivateFieldLooseBase(this, _setRecentItemDraftText)[_setRecentItemDraftText](dialogId, text);
	  }, SHOW_DRAFT_IN_RECENT_TIMEOUT);
	}
	function _refreshSaveTimeout2() {
	  clearTimeout(this.writeToStorageTimeout);
	  this.writeToStorageTimeout = setTimeout(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _saveToIndexedDb)[_saveToIndexedDb]();
	  }, WRITE_TO_STORAGE_TIMEOUT);
	}
	function _saveToIndexedDb2() {
	  IndexedDbManager.getInstance().set(STORAGE_KEY, babelHelpers.classPrivateFieldLooseBase(this, _prepareDrafts)[_prepareDrafts]());
	}
	function _prepareDrafts2() {
	  const result = {};
	  Object.entries(this.drafts).forEach(([dialogId, draft]) => {
	    if (!draft.text && !draft.panelType) {
	      return;
	    }
	    if (draft.panelType === im_v2_const.TextareaPanelType.edit) {
	      return;
	    }
	    result[dialogId] = {
	      text: draft.text,
	      mentions: draft.mentions
	    };
	  });
	  return result;
	}
	function _canSetRecentItemDraftText2(dialogId) {
	  const chat = babelHelpers.classPrivateFieldLooseBase(this, _getChat)[_getChat](dialogId);
	  if (!chat) {
	    return false;
	  }
	  return !NOT_AVAILABLE_CHAT_TYPES.has(chat.type);
	}
	function _getChat2(dialogId) {
	  return im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	}
	function _isValidDialogId2(dialogId) {
	  return main_core.Type.isStringFilled(dialogId) && dialogId !== '0';
	}
	DraftManager.instance = null;

	exports.DraftManager = DraftManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX,BX.Event,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Messenger.v2.Const,BX.DexieExport,BX.Messenger.v2.Lib));
//# sourceMappingURL=draft.bundle.js.map
