type UpdateStageOptions = {
	statusId: string,
	stageId: string | number,
	entityId: string,
	name: string,
	sort: string | number,
	color: string,
	categoryId: string | number,
	description?: string,
};

export default UpdateStageOptions;
