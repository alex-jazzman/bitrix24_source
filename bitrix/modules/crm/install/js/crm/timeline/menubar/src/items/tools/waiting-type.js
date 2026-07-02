const WaitingType = {
	undefined: 0,
	after: 1,
	before: 2,

	names:
	{
		after: 'after',
		before: 'before',
	},
	resolveTypeId(name)
	{
		if (name === this.names.after)
		{
			return this.after;
		}
		else if (name === this.names.before)
		{
			return this.before;
		}

		return this.undefined;
	},
};

export default WaitingType;
