const ViewMode = {
	MODE_STAGES: 'STAGES',
	MODE_ACTIVITIES: 'ACTIVITIES',
	MODE_DEADLINES: 'DEADLINES',

	getDefault(): string
	{
		return this.MODE_STAGES;
	},

	getAll(): string[]
	{
		return [
			this.MODE_STAGES,
			this.MODE_ACTIVITIES,
			this.MODE_DEADLINES,
		];
	},

	normalize(mode: string): string
	{
		return this.getAll().includes(mode) ? mode : this.getDefault();
	},
};

Object.freeze(ViewMode);

export {
	ViewMode,
};
