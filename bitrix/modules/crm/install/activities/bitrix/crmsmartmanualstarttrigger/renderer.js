/* eslint-disable */
(function (exports,main_core) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3;
	class CrmSmartManualStartTriggerRenderer {
	  getControlRenderers() {
	    return {
	      // eslint-disable-next-line sonarjs/cognitive-complexity
	      'crm-smart-category-select': field => {
	        var _field$property, _field$property$Setti;
	        const categoriesBySmart = main_core.Type.isPlainObject(field == null ? void 0 : (_field$property = field.property) == null ? void 0 : (_field$property$Setti = _field$property.Settings) == null ? void 0 : _field$property$Setti.categoriesBySmartType) ? field.property.Settings.categoriesBySmartType : {};
	        const select = main_core.Tag.render(_t || (_t = _`
					<select class="ui-ctl-element" id="id_${0}" name="${0}"></select>
				`), field.controlId, field.fieldName);
	        const wrapper = main_core.Tag.render(_t2 || (_t2 = _`
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
							${0}
					</div>
				`), select);
	        const smartField = 'id_smartTypeId';
	        let isBound = false;
	        const fillOptions = () => {
	          var _document$getElementB;
	          const smartValue = ((_document$getElementB = document.getElementById(smartField)) == null ? void 0 : _document$getElementB.value) || '';
	          const optionsMap = main_core.Type.isPlainObject(categoriesBySmart[smartValue]) ? categoriesBySmart[smartValue] : {};
	          const prev = select.value;
	          main_core.Dom.clean(select);
	          const keys = Object.keys(optionsMap);
	          keys.forEach(id => {
	            const opt = main_core.Tag.render(_t3 || (_t3 = _`<option value="${0}">${0}</option>`), id, optionsMap[id]);
	            // eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
	            select.appendChild(opt);
	          });
	          let chosen = '';
	          if (prev && optionsMap[prev]) {
	            chosen = prev;
	          } else if (field != null && field.value && optionsMap[field.value]) {
	            chosen = field.value;
	          } else if (keys.length > 0) {
	            chosen = keys[0];
	          }
	          select.value = chosen;
	          if (keys.length > 0) {
	            select.removeAttribute('disabled');
	          } else {
	            select.setAttribute('disabled', 'disabled');
	          }
	          if (chosen && chosen !== prev) {
	            main_core.Event.fire(select, 'change');
	          }
	        };
	        const tryBind = () => {
	          const smartSelect = document.getElementById(smartField);
	          if (!smartSelect || isBound) {
	            return isBound;
	          }
	          main_core.Event.bind(smartSelect, 'change', fillOptions);
	          fillOptions();
	          isBound = true;
	          return true;
	        };
	        if (!tryBind()) {
	          const onReady = () => {
	            if (tryBind()) {
	              main_core.Event.unbind(document, 'DOMContentLoaded', onReady);
	            }
	          };
	          if (document.readyState === 'loading') {
	            main_core.Event.bind(document, 'DOMContentLoaded', onReady);
	          }
	          const observer = new MutationObserver(() => {
	            if (tryBind()) {
	              observer.disconnect();
	            }
	          });
	          observer.observe(document.documentElement, {
	            childList: true,
	            subtree: true
	          });
	        }
	        return wrapper;
	      }
	    };
	  }
	}

	exports.CrmSmartManualStartTriggerRenderer = CrmSmartManualStartTriggerRenderer;

}((this.window = this.window || {}),BX));
//# sourceMappingURL=renderer.js.map
