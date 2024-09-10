/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports,main_core,sign_v2_api,sign_v2_b2e_companySelector,sign_v2_b2e_documentSend,sign_v2_b2e_documentSetup,sign_v2_b2e_parties,sign_v2_b2e_userParty,sign_v2_editor,sign_v2_signSettings) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2;
	var _companyParty = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("companyParty");
	var _userParty = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("userParty");
	var _api = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("api");
	var _setupParties = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setupParties");
	var _getAssignee = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAssignee");
	var _getSigner = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSigner");
	var _reflowLayout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("reflowLayout");
	var _wrapContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("wrapContent");
	var _parseMembers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseMembers");
	class B2ESignSettings extends sign_v2_signSettings.SignSettings {
	  constructor(containerId, signOptions) {
	    super(containerId, signOptions, {
	      next: {
	        className: 'ui-btn-success'
	      },
	      complete: {
	        className: 'ui-btn-success'
	      },
	      swapButtons: true
	    });
	    Object.defineProperty(this, _parseMembers, {
	      value: _parseMembers2
	    });
	    Object.defineProperty(this, _wrapContent, {
	      value: _wrapContent2
	    });
	    Object.defineProperty(this, _reflowLayout, {
	      value: _reflowLayout2
	    });
	    Object.defineProperty(this, _getSigner, {
	      value: _getSigner2
	    });
	    Object.defineProperty(this, _getAssignee, {
	      value: _getAssignee2
	    });
	    Object.defineProperty(this, _setupParties, {
	      value: _setupParties2
	    });
	    Object.defineProperty(this, _companyParty, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _userParty, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _api, {
	      writable: true,
	      value: void 0
	    });
	    const {
	      config
	    } = signOptions;
	    const {
	      blankSelectorConfig,
	      documentSendConfig,
	      userPartyConfig
	    } = config;
	    this.documentSetup = new sign_v2_b2e_documentSetup.DocumentSetup(blankSelectorConfig);
	    this.documentSend = new sign_v2_b2e_documentSend.DocumentSend(documentSendConfig);
	    babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty] = new sign_v2_b2e_parties.Parties(blankSelectorConfig.region);
	    babelHelpers.classPrivateFieldLooseBase(this, _api)[_api] = new sign_v2_api.Api();
	    babelHelpers.classPrivateFieldLooseBase(this, _userParty)[_userParty] = new sign_v2_b2e_userParty.UserParty({
	      mode: 'edit',
	      ...userPartyConfig
	    });
	    this.subscribeOnEvents();
	  }
	  subscribeOnEvents() {
	    super.subscribeOnEvents();
	    this.documentSend.subscribe('changeTitle', ({
	      data
	    }) => {
	      this.documentSetup.setDocumentTitle(data.title);
	    });
	    this.documentSend.subscribe('disableBack', () => {
	      this.wizard.toggleBtnActiveState('back', true);
	    });
	    this.documentSend.subscribe('enableBack', () => {
	      this.wizard.toggleBtnActiveState('back', false);
	    });
	  }
	  async applyDocumentData(uid) {
	    const setupData = await this.setupDocument(uid, true);
	    if (!setupData) {
	      return false;
	    }
	    const {
	      entityId,
	      representativeId,
	      companyUid
	    } = setupData;
	    this.documentSend.documentData = setupData;
	    this.editor.documentData = setupData;
	    babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].setEntityId(entityId);
	    if (companyUid) {
	      babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].loadCompany(companyUid);
	    }
	    if (representativeId) {
	      babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].loadRepresentative(representativeId);
	    }
	    const members = await babelHelpers.classPrivateFieldLooseBase(this, _api)[_api].loadMembers(uid);
	    const parsedMembers = babelHelpers.classPrivateFieldLooseBase(this, _parseMembers)[_parseMembers](members);
	    const {
	      signers = [],
	      reviewers = [],
	      editors = []
	    } = parsedMembers;
	    if (signers.length > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _userParty)[_userParty].load(signers);
	    }
	    if (reviewers.length > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].loadValidator(reviewers[0], sign_v2_api.MemberRole.reviewer);
	    }
	    if (editors.length > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].loadValidator(editors[0], sign_v2_api.MemberRole.editor);
	    }
	    return true;
	  }
	  getStepsMetadata() {
	    const signSettings = this;
	    return {
	      setup: {
	        get content() {
	          const layout = signSettings.documentSetup.layout;
	          babelHelpers.classPrivateFieldLooseBase(signSettings, _reflowLayout)[_reflowLayout](layout);
	          return layout;
	        },
	        title: main_core.Loc.getMessage('SIGN_SETTINGS_B2B_LOAD_DOCUMENT'),
	        beforeCompletion: async () => {
	          const isValid = this.documentSetup.validate();
	          if (!isValid) {
	            return false;
	          }
	          const setupData = await this.setupDocument();
	          if (!setupData) {
	            return false;
	          }
	          babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].setEntityId(setupData.entityId);
	          return true;
	        }
	      },
	      company: {
	        get content() {
	          const layout = babelHelpers.classPrivateFieldLooseBase(signSettings, _companyParty)[_companyParty].getLayout();
	          babelHelpers.classPrivateFieldLooseBase(signSettings, _reflowLayout)[_reflowLayout](layout);
	          return layout;
	        },
	        title: main_core.Loc.getMessage('SIGN_SETTINGS_B2E_COMPANY'),
	        beforeCompletion: async () => {
	          const {
	            uid
	          } = this.documentSetup.setupData;
	          try {
	            await babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].save(uid);
	          } catch {
	            return false;
	          }
	          return true;
	        }
	      },
	      employees: {
	        title: main_core.Loc.getMessage('SIGN_SETTINGS_B2E_EMPLOYEES'),
	        get content() {
	          const layout = babelHelpers.classPrivateFieldLooseBase(signSettings, _userParty)[_userParty].getLayout();
	          babelHelpers.classPrivateFieldLooseBase(signSettings, _reflowLayout)[_reflowLayout](layout);
	          return layout;
	        },
	        beforeCompletion: async () => {
	          try {
	            const isValid = babelHelpers.classPrivateFieldLooseBase(this, _userParty)[_userParty].validate();
	            if (!isValid) {
	              return isValid;
	            }
	            const entityData = await babelHelpers.classPrivateFieldLooseBase(this, _setupParties)[_setupParties]();
	            const {
	              uid,
	              title,
	              isTemplate,
	              externalId,
	              entityId
	            } = this.documentSetup.setupData;
	            const blocks = await this.documentSetup.loadBlocks(uid);
	            const partiesData = babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].getParties();
	            const selectedProvider = babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].getSelectedProvider();
	            this.editor.setSectionVisibilityByType(sign_v2_editor.SectionType.SecondParty, selectedProvider.code !== sign_v2_b2e_companySelector.ProviderCode.sesRu);
	            Object.assign(partiesData, {
	              employees: babelHelpers.classPrivateFieldLooseBase(this, _userParty)[_userParty].getUserIds().map(userId => {
	                return {
	                  entityType: 'user',
	                  entityId: userId
	                };
	              })
	            });
	            this.documentSend.documentData = {
	              uid,
	              title,
	              blocks,
	              externalId
	            };
	            this.documentSend.setPartiesData(partiesData);
	            this.documentSend.members = entityData;
	            this.editor.documentData = {
	              isTemplate,
	              uid,
	              blocks,
	              entityId
	            };
	            this.editor.entityData = entityData;
	            await this.editor.waitForPagesUrls();
	            await this.editor.renderDocument();
	            this.wizard.toggleBtnLoadingState('next', false);
	            await this.editor.show();
	            return true;
	          } catch (e) {
	            console.error(e);
	            return false;
	          }
	        }
	      },
	      send: {
	        get content() {
	          const layout = signSettings.documentSend.getLayout();
	          babelHelpers.classPrivateFieldLooseBase(signSettings, _reflowLayout)[_reflowLayout](layout);
	          return layout;
	        },
	        title: main_core.Loc.getMessage('SIGN_SETTINGS_SEND_DOCUMENT'),
	        beforeCompletion: () => {
	          return this.documentSend.sendForSign();
	        }
	      }
	    };
	  }
	}
	async function _setupParties2() {
	  const {
	    uid
	  } = this.documentSetup.setupData;
	  const companyData = babelHelpers.classPrivateFieldLooseBase(this, _companyParty)[_companyParty].getParties();
	  const {
	    representative,
	    company,
	    validation
	  } = companyData;
	  const {
	    entityId: companyId
	  } = company;
	  const {
	    entityId: representativeId
	  } = representative;
	  const userPartyIds = babelHelpers.classPrivateFieldLooseBase(this, _userParty)[_userParty].getUserIds();
	  let currentParty = 1;
	  const members = validation.map(item => ({
	    ...item,
	    party: currentParty++
	  }));
	  members.push(babelHelpers.classPrivateFieldLooseBase(this, _getAssignee)[_getAssignee](currentParty, companyId));
	  currentParty++;
	  members.push(...userPartyIds.map(userId => babelHelpers.classPrivateFieldLooseBase(this, _getSigner)[_getSigner](currentParty, userId)));
	  try {
	    await babelHelpers.classPrivateFieldLooseBase(this, _api)[_api].setupB2eParties(uid, representativeId, members);
	  } catch (ex) {
	    throw ex;
	  }
	  const membersData = await babelHelpers.classPrivateFieldLooseBase(this, _api)[_api].loadMembers(uid);
	  if (!main_core.Type.isArrayFilled(membersData)) {
	    throw new Error();
	  }
	  return membersData.map(memberData => {
	    var _memberData$entityTyp, _memberData$entityId, _memberData$role;
	    return {
	      presetId: memberData == null ? void 0 : memberData.presetId,
	      part: memberData == null ? void 0 : memberData.party,
	      uid: memberData == null ? void 0 : memberData.uid,
	      entityTypeId: (_memberData$entityTyp = memberData == null ? void 0 : memberData.entityTypeId) != null ? _memberData$entityTyp : null,
	      entityId: (_memberData$entityId = memberData == null ? void 0 : memberData.entityId) != null ? _memberData$entityId : null,
	      role: (_memberData$role = memberData == null ? void 0 : memberData.role) != null ? _memberData$role : null
	    };
	  });
	}
	function _getAssignee2(currentParty, companyId) {
	  return {
	    entityType: 'company',
	    entityId: companyId,
	    party: currentParty,
	    role: sign_v2_api.MemberRole.assignee
	  };
	}
	function _getSigner2(currentParty, userId) {
	  return {
	    entityType: 'user',
	    entityId: userId,
	    party: currentParty,
	    role: sign_v2_api.MemberRole.signer
	  };
	}
	function _reflowLayout2(layout) {
	  babelHelpers.classPrivateFieldLooseBase(this, _wrapContent)[_wrapContent](layout);
	  document.documentElement.scrollTop = 0;
	}
	function _wrapContent2(layout) {
	  const layoutItems = [...layout.children].filter(child => {
	    return main_core.Dom.hasClass(child, 'sign-b2e-settings__item');
	  });
	  const hasCounter = layoutItems.some(node => {
	    return main_core.Dom.hasClass(node.firstElementChild, 'sign-b2e-settings__counter');
	  });
	  if (hasCounter) {
	    return;
	  }
	  layoutItems.forEach((node, index) => {
	    const connectionNode = index === layoutItems.length - 1 ? main_core.Tag.render(_t || (_t = _`<span class="sign-b2e-settings__counter_connect">`)) : null;
	    const counter = main_core.Tag.render(_t2 || (_t2 = _`
				<div class="sign-b2e-settings__counter">
					<span class="sign-b2e-settings__counter_num" data-num="${0}"></span>
					${0}
				</div>
			`), index + 1, connectionNode);
	    main_core.Dom.prepend(counter, node);
	  });
	}
	function _parseMembers2(loadedMembers) {
	  return loadedMembers.reduce((acc, member) => {
	    var _acc$role;
	    const {
	      entityType,
	      entityId
	    } = member;
	    if (entityType !== 'user') {
	      return acc;
	    }
	    const role = `${member.role}s`;
	    return {
	      ...acc,
	      [role]: [...((_acc$role = acc[role]) != null ? _acc$role : []), entityId]
	    };
	  }, {});
	}

	exports.B2ESignSettings = B2ESignSettings;

}((this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}),BX,BX.Sign.V2,BX.Sign.V2.B2e,BX.Sign.V2.B2e,BX.Sign.V2.B2e,BX.Sign.V2.B2e,BX.Sign.V2.B2e,BX.Sign.V2,BX.Sign.V2));
//# sourceMappingURL=sign-settings.bundle.js.map
