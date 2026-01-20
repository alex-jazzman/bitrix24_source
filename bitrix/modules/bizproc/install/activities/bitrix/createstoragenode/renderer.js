/* eslint-disable */
(function (exports,main_core,main_popup) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2;
	var _storageFieldsWrapper = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageFieldsWrapper");
	var _getField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getField");
	class CreateStorageNodeRenderer {
	  constructor() {
	    Object.defineProperty(this, _getField, {
	      value: _getField2
	    });
	    Object.defineProperty(this, _storageFieldsWrapper, {
	      writable: true,
	      value: void 0
	    });
	  }
	  getControlRenderers() {
	    return {
	      'storage-fields': field => {
	        const element = main_core.Tag.render(_t || (_t = _`
					<div class="storage-fields">
						<a ref="addField" class="custom-fields__add-button" href="#" id="add_field">${0}</a>
					</div>
				`), main_core.Text.encode(field.property.Name));
	        babelHelpers.classPrivateFieldLooseBase(this, _storageFieldsWrapper)[_storageFieldsWrapper] = element.root;
	        main_core.Event.bind(element.addField, 'click', this.handleAddFieldClick.bind(this));
	        if (main_core.Type.isArrayFilled(field.value)) {
	          field.value.forEach(field => {
	            main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField](field), babelHelpers.classPrivateFieldLooseBase(this, _storageFieldsWrapper)[_storageFieldsWrapper]);
	          });
	        }
	        return element.root;
	      }
	    };
	  }
	  handleAddFieldClick(event) {
	    event.preventDefault();
	    main_core.Runtime.loadExtension('bizproc.router').then(({
	      Router
	    }) => {
	      Router.openStorageFieldEdit({
	        events: {
	          onCloseComplete: event => {
	            const slider = event.getSlider();
	            const dictionary = slider ? slider.getData() : null;
	            let data = null;
	            if (dictionary && dictionary.has('data')) {
	              data = dictionary.get('data');
	              main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField](data), babelHelpers.classPrivateFieldLooseBase(this, _storageFieldsWrapper)[_storageFieldsWrapper]);
	            }
	          }
	        },
	        requestMethod: 'get',
	        requestParams: {
	          storageId: 0,
	          fieldId: null,
	          skipSave: true
	        }
	      });
	    }).catch(e => {
	      console.error(e);
	    });
	  }
	}
	function _getField2(field) {
	  const jsonValue = JSON.stringify(field);
	  const fieldItem = main_core.Tag.render(_t2 || (_t2 = _`
			<div class="storage-fields__item">
				<input type="hidden" name="SelectedFields[]" value="${0}">
				<div class="storage-fields__item-content">
					<span class="storage-fields__item-name">
						${0}:${0}
					</span>
					<a ref="deleteField" class="storage-fields__delete-button" href="#">
						<div class="ui-icon-set --cross-m"></div>
					</a>
				</div>
			</div>
		`), main_core.Text.encode(jsonValue), main_core.Text.encode(field.name), main_core.Text.encode(field.code));
	  main_core.Event.bind(fieldItem.deleteField, 'click', event => {
	    event.preventDefault();
	    main_core.Dom.remove(fieldItem.root);
	  });
	  return fieldItem.root;
	}

	exports.CreateStorageNodeRenderer = CreateStorageNodeRenderer;

}((this.window = this.window || {}),BX,BX.Main));
//# sourceMappingURL=renderer.js.map
