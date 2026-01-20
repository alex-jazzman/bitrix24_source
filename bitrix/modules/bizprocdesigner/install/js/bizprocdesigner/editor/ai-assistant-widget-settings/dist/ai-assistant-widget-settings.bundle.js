/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {};
(function (exports,main_core) {
	'use strict';

	const AiAssistantWidgetSettings = {
	  getParams() {
	    var _Extension$getSetting, _params$params;
	    const params = (_Extension$getSetting = main_core.Extension.getSettings('bizprocdesigner.editor.ai-assistant-widget-settings')) == null ? void 0 : _Extension$getSetting.params;
	    if (!main_core.Type.isPlainObject(params)) {
	      return null;
	    }
	    return {
	      currentUrl: params.currentUrl,
	      botAvatarUrl: params.botAvatarUrl,
	      botId: params.botId,
	      params: (_params$params = params.params) != null ? _params$params : {},
	      moduleName: params.moduleName
	    };
	  }
	};

	exports.AiAssistantWidgetSettings = AiAssistantWidgetSettings;

}((this.BX.Bizprocdesigner.Editor = this.BX.Bizprocdesigner.Editor || {}),BX));
//# sourceMappingURL=ai-assistant-widget-settings.bundle.js.map
