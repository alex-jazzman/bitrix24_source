import { Tag } from 'main.core';

export class DeleteDocumentActivityRenderer
{
	getControlRenderers(): Object
	{
		return {
			'data-picker': (field: Object) => Tag.render`
				<div class="custom-field-wrapper">
					<label for="${field.controlId}">${field.property.Name}</label>
					<input
						class="custom-input"
						type="text"
						id="${field.controlId}"
						name="${field.fieldName}"
						value="${field.value || ''}"
					>
				</div>
			`,
			'custom-select': (field: Object) => Tag.render`
				<div class="custom-field-wrapper">
					<label for="${field.controlId}">${field.property.Name}</label>
					<select
						class="custom-input"
						type="text"
						id="${field.controlId}"
						name="${field.fieldName}"
					>
					<option>111</option>
					</select>
				</div>
			`,
		};
	}
}
