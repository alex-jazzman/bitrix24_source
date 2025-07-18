/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports,main_core) {
	'use strict';

	class Logo {
	  constructor(parent) {
	    this.ajaxPath = parent.ajaxPath;
	    if (BX("configLogoPostForm") && BX("configLogoPostForm").client_logo) {
	      BX.bind(BX("configLogoPostForm").client_logo, "change", () => {
	        this.LogoChange();
	      });
	    }
	    if (BX("configDeleteLogo")) {
	      BX.bind(BX("configDeleteLogo"), "click", () => {
	        this.LogoDelete(BX("configDeleteLogo"));
	      });
	    }
	    if (BX("configLogoRetinaPostForm") && BX("configLogoRetinaPostForm").client_logo_retina) {
	      BX.bind(BX("configLogoRetinaPostForm").client_logo_retina, "change", () => {
	        this.LogoChange("retina");
	      });
	    }
	    if (BX("configDeleteLogoretina")) {
	      BX.bind(BX("configDeleteLogoretina"), "click", () => {
	        this.LogoDelete(BX("configDeleteLogoretina"), "retina");
	      });
	    }
	  }
	  LogoChange(mode) {
	    mode = mode == "retina" ? "retina" : "";
	    BX('configWaitLogo' + mode).style.display = 'inline-block';
	    BX.ajax.submit(BX(mode == "retina" ? 'configLogoRetinaPostForm' : 'configLogoPostForm'), function (reply) {
	      try {
	        var json = JSON.parse(reply);
	        if (json.error) {
	          BX('config_logo_error_block').style.display = 'block';
	          var error_block = BX.findChild(BX('config_logo_error_block'), {
	            class: 'content-edit-form-notice-text'
	          }, true, false);
	          error_block.innerHTML = '<span class=\'content-edit-form-notice-icon\'></span>' + json.error;
	        } else if (json.path) {
	          BX('config_logo_error_block').style.display = 'none';
	          BX('configImgLogo' + mode).src = json.path;
	          BX('configBlockLogo' + mode).style.display = 'inline-block';
	          BX('configDeleteLogo' + mode).style.display = 'inline-block';
	        }
	        BX('configWaitLogo' + mode).style.display = 'none';
	      } catch (e) {
	        BX('configWaitLogo' + mode).style.display = 'none';
	        return false;
	      }
	    });
	  }
	  LogoDelete(curLink, mode) {
	    mode = mode == "retina" ? "retina" : "";
	    if (confirm(BX.message("LogoDeleteConfirm"))) {
	      BX('configWaitLogo' + mode).style.display = 'inline-block';
	      BX.ajax.post(this.ajaxPath, {
	        client_delete_logo: 'Y',
	        sessid: BX.bitrix_sessid(),
	        mode: mode
	      }, function () {
	        BX('configBlockLogo' + mode).style.display = 'none';
	        curLink.style.display = 'none';
	        BX('config_error_block').style.display = 'none';
	        BX('configWaitLogo' + mode).style.display = 'none';
	      });
	    }
	  }
	}

	class Culture {
	  constructor(parent) {
	    this.cultureList = parent.cultureList;
	    this.selectorNode = document.querySelector("[data-role='culture-selector']");
	    this.shortDateNode = document.querySelector("[data-role='culture-short-date-format']");
	    this.longDateNode = document.querySelector("[data-role='culture-long-date-format']");
	    if (main_core.Type.isDomNode(this.selectorNode)) {
	      main_core.Event.bind(this.selectorNode, 'change', () => {
	        this.changeFormatExample(this.selectorNode.value);
	      });
	    }
	  }
	  changeFormatExample(cultureId) {
	    if (!main_core.Type.isDomNode(this.shortDateNode) || !main_core.Type.isDomNode(this.longDateNode)) {
	      return;
	    }
	    this.shortDateNode.textContent = this.cultureList[cultureId].SHORT_DATE_FORMAT;
	    this.longDateNode.textContent = this.cultureList[cultureId].LONG_DATE_FORMAT;
	  }
	}

	let _ = t => t,
	  _t,
	  _t2;
	const namespace = main_core.Reflection.namespace('BX.Intranet.Configs');
	class IpSettingsClass {
	  constructor(arCurIpRights) {
	    this.arCurIpRights = arCurIpRights;
	    var deleteButtons = document.querySelectorAll("[data-role='ip-right-delete']");
	    deleteButtons.forEach(function (button) {
	      BX.bind(button, "click", function () {
	        this.DeleteIpAccessRow(button);
	      }.bind(this));
	    }.bind(this));
	  }
	  DeleteIpAccessRow(ob) {
	    var tdObj = ob.parentNode.parentNode;
	    BX.remove(ob.parentNode);
	    var allInputBlocks = BX.findChildren(tdObj, {
	      tagName: 'div'
	    }, true);
	    if (allInputBlocks.length <= 0) {
	      var deleteRight = tdObj.parentNode.getAttribute("data-bx-right");
	      var arCurIpRightsNew = [];
	      for (var i = 0; i < this.arCurIpRights.length; i++) if (this.arCurIpRights[i] != deleteRight) arCurIpRightsNew.push(this.arCurIpRights[i]);
	      this.arCurIpRights = arCurIpRightsNew;
	      BX.remove(tdObj.parentNode);
	    }
	  }
	  ShowIpAccessPopup(val) {
	    val = val || [];
	    BX.Access.Init({
	      other: {
	        disabled: false,
	        disabled_g2: true,
	        disabled_cr: true
	      },
	      groups: {
	        disabled: true
	      },
	      socnetgroups: {
	        disabled: true
	      }
	    });
	    var startValue = {};
	    for (var i = 0; i < val.length; i++) startValue[val[i]] = true;
	    BX.Access.SetSelected(startValue);
	    BX.Access.ShowForm({
	      callback: arRights => {
	        var pr = false;
	        for (var provider in arRights) {
	          pr = BX.Access.GetProviderName(provider);
	          for (var right in arRights[provider]) {
	            const onInputClickHandler = event => {
	              this.addInputForIp(childBlockInput);
	            };
	            const childBlockInput = main_core.Tag.render(_t || (_t = _`
							<input type="text" name="ip_access_rights_${0}[]" size="30"
								onclick="${0}"
							>	
						`), right, onInputClickHandler);
	            const onCloseClickHandler = event => {
	              this.DeleteIpAccessRow(childBlockClose);
	            };
	            const childBlockClose = main_core.Tag.render(_t2 || (_t2 = _`
							<a 
								class="access-delete" 
								title="${0}" 
								href="javascript:void(0);"
								onclick="${0}"
							></a>		
						`), BX.message('SLToAllDel'), onCloseClickHandler);
	            const insertBlock = BX.create('tr', {
	              attrs: {
	                "data-bx-right": right
	              },
	              children: [BX.create('td', {
	                html: (pr.length > 0 ? pr + ': ' : '') + BX.util.htmlspecialchars(arRights[provider][right].name) + '&nbsp;',
	                props: {
	                  'className': 'content-edit-form-field-name'
	                }
	              }), BX.create('td', {
	                props: {
	                  'className': 'content-edit-form-field-input',
	                  'colspan': 2
	                },
	                children: [BX.create('div', {
	                  children: [childBlockInput, childBlockClose]
	                })]
	              })]
	            });
	            BX('ip_add_right_button').parentNode.insertBefore(insertBlock, BX('ip_add_right_button'));
	            this.arCurIpRights.push(right);
	          }
	        }
	      }
	    });
	  }
	  addInputForIp(input) {
	    var inputParent = input.parentNode;
	    if (BX.nextSibling(inputParent)) return;
	    var newInputBlock = BX.clone(inputParent);
	    var newInput = BX.firstChild(newInputBlock);
	    newInput.value = "";
	    newInput.onclick = () => {
	      this.addInputForIp(newInput);
	    };
	    const nextInput = BX.nextSibling(newInput);
	    nextInput.onclick = () => {
	      this.DeleteIpAccessRow(nextInput);
	    };
	    inputParent.parentNode.appendChild(newInputBlock);
	  }
	}
	namespace.IpSettingsClass = IpSettingsClass;
	class Functions {
	  constructor(params) {
	    this.ajaxPath = params.ajaxPath || '';
	    this.addressFormatList = params.addressFormatList || {};
	    this.cultureList = params.cultureList || {};
	    new Logo(this);
	    new Culture(this);
	    var toAllCheckBox = BX('allow_livefeed_toall');
	    var defaultCont = BX('DEFAULT_all');
	    if (toAllCheckBox && defaultCont) {
	      BX.bind(toAllCheckBox, 'click', BX.delegate(function (e) {
	        defaultCont.style.display = this.checked ? '' : 'none';
	      }, toAllCheckBox));
	    }
	    var rightsCont = BX('RIGHTS_all');
	    if (toAllCheckBox && rightsCont) {
	      BX.bind(toAllCheckBox, 'click', BX.delegate(function (e) {
	        rightsCont.style.display = this.checked ? '' : 'none';
	      }, toAllCheckBox));
	    }

	    //im chat
	    var toChatAllCheckBox = BX('allow_general_chat_toall');
	    var chatRightsCont = BX('chat_rights_all');
	    if (toChatAllCheckBox && chatRightsCont) {
	      BX.bind(toChatAllCheckBox, 'click', function () {
	        chatRightsCont.style.display = this.checked ? '' : 'none';
	      });
	    }
	    var mpUserInstallChechBox = BX('mp_allow_user_install');
	    var mpUserInstallCont = BX('mp_user_install');
	    if (mpUserInstallChechBox && mpUserInstallCont) {
	      BX.bind(mpUserInstallChechBox, 'click', function () {
	        mpUserInstallCont.style.display = this.checked ? '' : 'none';
	      });
	    }
	    var addressFormatSelect = BX('location_address_format_select');
	    if (addressFormatSelect) {
	      BX.bind(addressFormatSelect, 'change', () => {
	        var addressFormatDescription = BX('location_address_format_description');
	        addressFormatDescription.innerHTML = this.addressFormatList[addressFormatSelect.value];
	      });
	    }
	    if (BX.type.isDomNode(BX('smtp_use_auth'))) {
	      BX.bind(BX('smtp_use_auth'), 'change', BX.proxy(function () {
	        this.showHideSmtpAuth();
	      }, this));
	    }
	  }
	  submitForm(button) {
	    BX.addClass(button, 'webform-button-wait webform-button-active');
	    BX.submit(BX('configPostForm'));
	  }
	  otpSwitchOffInfo(elem) {
	    if (!elem.checked) {
	      BX.PopupWindowManager.create('otpSwitchOffInfo', elem, {
	        autoHide: true,
	        offsetLeft: -100,
	        offsetTop: 15,
	        overlay: false,
	        draggable: {
	          restrict: true
	        },
	        closeByEsc: true,
	        closeIcon: {
	          right: '12px',
	          top: '10px'
	        },
	        content: '<div style="padding: 15px; width: 300px; font-size: 13px">' + BX.message('CONFIG_OTP_SECURITY_SWITCH_OFF_INFO') + '</div>'
	      }).show();
	    }
	  }
	  onGdprChange(element) {
	    var items = document.querySelectorAll("[data-role='gdpr-data']");
	    for (var i = 0; i < items.length; i++) {
	      items[i].style.visibility = element.checked ? 'visible' : 'collapse';
	    }
	  }
	  adminOtpIsRequiredInfo(elem) {
	    BX.PopupWindowManager.create('adminOtpIsRequiredInfo', elem, {
	      autoHide: true,
	      offsetLeft: -100,
	      offsetTop: 15,
	      overlay: false,
	      draggable: {
	        restrict: true
	      },
	      closeByEsc: true,
	      closeIcon: {
	        right: '12px',
	        top: '10px'
	      },
	      content: '<div style="padding: 15px; width: 300px; font-size: 13px">' + BX.message('CONFIG_OTP_ADMIN_IS_REQUIRED_INFO') + '</div>'
	    }).show();
	  }
	  showDiskExtendedFullTextInfo(event, elem) {
	    event.stopPropagation;
	    event.preventDefault();
	    BX.PopupWindowManager.create('diskExtendedFullTextInfo', elem, {
	      autoHide: true,
	      offsetLeft: -100,
	      offsetTop: 15,
	      overlay: false,
	      draggable: {
	        restrict: true
	      },
	      closeByEsc: true,
	      closeIcon: {
	        right: '12px',
	        top: '10px'
	      },
	      content: '<div style="padding: 15px; width: 300px; font-size: 13px">' + BX.message('CONFIG_DISK_EXTENDED_FULLTEXT_INFO') + '</div>'
	    }).show();
	  }
	  geoDataSwitch(element) {
	    if (element.checked) {
	      element.checked = false;
	      BX.UI.Dialogs.MessageBox.show({
	        'modal': true,
	        'minWidth': BX.message('CONFIG_COLLECT_GEO_DATA_CONFIRM').length > 400 ? 640 : 480,
	        'title': BX.message('CONFIG_COLLECT_GEO_DATA'),
	        'message': BX.message('CONFIG_COLLECT_GEO_DATA_CONFIRM'),
	        'buttons': BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
	        'okCaption': BX.message('CONFIG_COLLECT_GEO_DATA_OK'),
	        'onOk': function () {
	          element.checked = true;
	          return true;
	        }
	      });
	    }
	  }
	}
	namespace.Functions = Functions;

}((this.BX.Intranet.Configs = this.BX.Intranet.Configs || {}),BX));
//# sourceMappingURL=script.js.map
