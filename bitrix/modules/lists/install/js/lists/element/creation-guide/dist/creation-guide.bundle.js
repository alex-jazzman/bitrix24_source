/* eslint-disable */
this.BX = this.BX || {};
this.BX.Lists = this.BX.Lists || {};
(function (exports,main_core) {
	'use strict';

	var _getFillConstantsUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFillConstantsUrl");
	class CreationGuide {
	  static open(params) {
	    if (!main_core.Type.isPlainObject(params) || !main_core.Type.isStringFilled(params.iBlockTypeId) || !main_core.Type.isInteger(params.iBlockId)) {
	      throw new TypeError('invalid params');
	    }
	    const url = main_core.Uri.addParam('/bitrix/components/bitrix/lists.element.creation_guide/', {
	      iBlockTypeId: encodeURIComponent(params.iBlockTypeId),
	      iBlockId: encodeURIComponent(params.iBlockId),
	      fillConstantsUrl: encodeURIComponent(babelHelpers.classPrivateFieldLooseBase(this, _getFillConstantsUrl)[_getFillConstantsUrl](params))
	    });
	    BX.SidePanel.Instance.open(url, {
	      width: 900,
	      cacheable: false,
	      allowChangeHistory: false,
	      events: {
	        onCloseComplete: () => {
	          if (main_core.Type.isFunction(params.onClose)) {
	            params.onClose();
	          }
	        }
	      }
	    });
	  }
	}
	function _getFillConstantsUrl2(params) {
	  if (main_core.Type.isStringFilled(params.fillConstantsUrl)) {
	    return params.fillConstantsUrl;
	  }
	  return main_core.Uri.addParam('/bizproc/userprocesses/', {
	    iBlockId: params.iBlockId
	  });
	}
	Object.defineProperty(CreationGuide, _getFillConstantsUrl, {
	  value: _getFillConstantsUrl2
	});

	exports.CreationGuide = CreationGuide;

}((this.BX.Lists.Element = this.BX.Lists.Element || {}),BX));
//# sourceMappingURL=creation-guide.bundle.js.map
