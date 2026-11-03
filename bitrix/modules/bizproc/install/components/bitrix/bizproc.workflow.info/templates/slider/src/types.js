export type TaskField = {
	Id: string,
	Name: string,
	FieldId: string,
	Type: string,
	// the type of `Bitrix\Bizproc\BaseType` the control is drawn by; empty for a type the server cannot resolve
	BaseType?: ?string,
	Required: boolean,
	Multiple: boolean,
	Description?: string,
};

export type TaskFieldError = {
	fieldId: ?string,
	message: string,
};
