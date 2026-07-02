type Field = {
	id: string | number,
	required: boolean,
	validated: boolean,
	focused: boolean,
	hint: ?string,
	valid: () => boolean,
};

const ElementType = {
	FIELD: 'field',
	LABEL: 'label',
	HINT: 'hint',
	ERROR: 'error',
};

const ARIA_ID_PREFIX = 'b24-form';

const idIndexMap = new Map();
let idCounter = 0;

const Aria = {
	ElementType,

	generateElementId(prefix: string, fieldId: Field['id'], itemIndex: ?number = null): string
	{
		if (!idIndexMap.has(fieldId))
		{
			idIndexMap.set(fieldId, ++idCounter);
		}

		const shortId = idIndexMap.get(fieldId);
		const base = `${ARIA_ID_PREFIX}-${prefix}-${shortId}`;

		return itemIndex !== null && itemIndex > 0 ? `${base}-${itemIndex}` : base;
	},

	getFormElementId(formId: string | number, suffix: string): string
	{
		if (!idIndexMap.has(formId))
		{
			idIndexMap.set(formId, ++idCounter);
		}
		const shortFormId = idIndexMap.get(formId);

		return `${ARIA_ID_PREFIX}-form-${shortFormId}-${suffix}`;
	},

	generateDescribedBy(ids: Array<string>): ?string
	{
		const filtered = ids.filter((id) => id);

		return filtered.length > 0 ? filtered.join(' ') : null;
	},

	getFieldId(field: Field, itemIndex: ?number = null): string
	{
		return this.generateElementId(ElementType.FIELD, field.id, itemIndex);
	},

	getLabelId(field: Field, itemIndex: ?number = null): string
	{
		return this.generateElementId(ElementType.LABEL, field.id, itemIndex);
	},

	getHintId(field: Field, itemIndex: ?number = null): string
	{
		return this.generateElementId(ElementType.HINT, field.id, itemIndex);
	},

	getErrorId(field: Field, itemIndex: ?number = null): string
	{
		return this.generateElementId(ElementType.ERROR, field.id, itemIndex);
	},

	getAriaRequired(field: Field): ?string
	{
		return field.required ? 'true' : null;
	},

	getAriaInvalid(field: Field): ?string
	{
		return this.hasErrors(field) ? 'true' : null;
	},

	getAriaDescribedBy(field: Field, itemIndex: ?number = null): ?string
	{
		const hasHint = Boolean(field.hint);

		const ids = [];
		if (hasHint)
		{
			ids.push(this.getHintId(field, itemIndex));
		}

		if (this.hasErrors(field))
		{
			ids.push(this.getErrorId(field, itemIndex));
		}

		return this.generateDescribedBy(ids);
	},

	hasErrors(field: Field): boolean
	{
		return field.validated && !field.focused && !field.valid();
	},
};

export {
	Aria,
	ElementType,
};
