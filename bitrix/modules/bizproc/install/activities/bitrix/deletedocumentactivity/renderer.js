/* eslint-disable */
(function (exports,main_core) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2;
	class DeleteDocumentActivityRenderer {
	  getControlRenderers() {
	    return {
	      'data-picker': field => main_core.Tag.render(_t || (_t = _`
				<div class="custom-field-wrapper">
					<label for="${0}">${0}</label>
					<input
						class="custom-input"
						type="text"
						id="${0}"
						name="${0}"
						value="${0}"
					>
				</div>
			`), field.controlId, field.property.Name, field.controlId, field.fieldName, field.value || ''),
	      'custom-select': field => main_core.Tag.render(_t2 || (_t2 = _`
				<div class="custom-field-wrapper">
					<label for="${0}">${0}</label>
					<select
						class="custom-input"
						type="text"
						id="${0}"
						name="${0}"
					>
					<option>111</option>
					</select>
				</div>
			`), field.controlId, field.property.Name, field.controlId, field.fieldName)
	    };
	  }
	}

	exports.DeleteDocumentActivityRenderer = DeleteDocumentActivityRenderer;

}((this.window = this.window || {}),BX));
//# sourceMappingURL=renderer.js.map
