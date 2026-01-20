/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {};
this.BX.Bizprocdesigner.Editor = this.BX.Bizprocdesigner.Editor || {};
(function (exports,main_core) {
	'use strict';

	// @vue/component
	const AiAssistantWidget = {
	  name: 'AiAssistantWidget',
	  emits: ['ready'],
	  mounted() {
	    this.tryInitWidget();
	  },
	  methods: {
	    getSettings() {
	      var _Extension$getSetting;
	      return (_Extension$getSetting = main_core.Extension.getSettings('bizprocdesigner.editor.components.ai-assistant-widget')) != null ? _Extension$getSetting : null;
	    },
	    getParams() {
	      var _settings$params;
	      const settings = this.getSettings().params;
	      if (!main_core.Type.isPlainObject(settings)) {
	        return null;
	      }
	      return {
	        target: this.$refs.container,
	        currentUrl: settings.currentUrl,
	        botAvatarUrl: settings.botAvatarUrl,
	        botId: settings.botId,
	        params: (_settings$params = settings.params) != null ? _settings$params : {},
	        moduleName: settings.moduleName
	      };
	    },
	    tryInitWidget() {
	      var _BX, _BX$AiAssistant;
	      const params = this.getParams();
	      if (!params) {
	        return;
	      }
	      if (!((_BX = BX) != null && (_BX$AiAssistant = _BX.AiAssistant) != null && _BX$AiAssistant.Marta)) {
	        return;
	      }
	      this.instance = new BX.AiAssistant.Marta(params);
	      this.instance.init();
	      this.$emit('ready');
	    }
	  },
	  template: `
		<div 
			class="bizprocdesigner-editor-ai-assistant-widget"
			ref="container"
		></div>
	`
	};

	exports.AiAssistantWidget = AiAssistantWidget;

}((this.BX.Bizprocdesigner.Editor.Components = this.BX.Bizprocdesigner.Editor.Components || {}),BX));
//# sourceMappingURL=ai-assistant-widget.bundle.js.map
