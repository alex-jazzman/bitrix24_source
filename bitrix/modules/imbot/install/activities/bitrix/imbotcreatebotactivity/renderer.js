/* eslint-disable */
(function (exports,main_core) {
	'use strict';

	let _ = t => t,
	  _t;
	var _getValueAsArray = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getValueAsArray");
	class ImBotCreateBotActivityRenderer {
	  constructor() {
	    Object.defineProperty(this, _getValueAsArray, {
	      value: _getValueAsArray2
	    });
	  }
	  getControlRenderers() {
	    return {
	      diskFile: field => {
	        const container = main_core.Tag.render(_t || (_t = _`<div></div>`));
	        const loader = new BX.Loader({
	          size: 40,
	          target: container,
	          mode: 'inline'
	        });
	        loader.show();
	        main_core.Runtime.loadExtension('ui.uploader.tile-widget').then(({
	          TileWidget
	        }) => {
	          var _field$property;
	          loader.destroy();
	          const widget = new TileWidget({
	            controller: 'disk.uf.integration.diskUploaderController',
	            hiddenFieldsContainer: container,
	            hiddenFieldName: field.fieldName,
	            files: babelHelpers.classPrivateFieldLooseBase(this, _getValueAsArray)[_getValueAsArray](field.value),
	            multiple: Boolean((_field$property = field.property) == null ? void 0 : _field$property.Multiple),
	            autoUpload: true,
	            acceptOnlyImages: true
	          });
	          widget.renderTo(container);
	        }).catch(e => {
	          loader.destroy();
	          container.textContent = e;
	        });
	        return container;
	      }
	    };
	  }
	}
	function _getValueAsArray2(value) {
	  if (main_core.Type.isArray(value)) {
	    return value.filter(item => main_core.Type.isNumber(item) || main_core.Type.isStringFilled(item));
	  }
	  if (main_core.Type.isNumber(value) || main_core.Type.isStringFilled(value)) {
	    return [value];
	  }
	  return [];
	}

	exports.ImBotCreateBotActivityRenderer = ImBotCreateBotActivityRenderer;

}((this.window = this.window || {}),BX));
//# sourceMappingURL=renderer.js.map
