type AddStageOptions = {
	name: string,
	sort: string | number,
	entityId: string,
	color: string,
	semantics: 'F' | 'P' | 'S',
	categoryId: string | number,
	description: string,
};

export default AddStageOptions;
