export type ModuleData = Map<string, any>;

export type ContextLayer = Map<string, ModuleData>;

export type CustomData = { [moduleId: string]: { [key: string]: any } };

export type SystemData = {
	url: string,
	module: string | null,
};

export type ContextSnapshot = {
	system: SystemData,
	custom: CustomData,
};
