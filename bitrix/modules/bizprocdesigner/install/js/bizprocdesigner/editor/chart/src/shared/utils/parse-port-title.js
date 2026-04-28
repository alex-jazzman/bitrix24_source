type ParsedTitle = {
	label: string;
	id: number;
};

export const parsePortTitle = (title: ?string): ParsedTitle | null => {
	if (!title)
	{
		return null;
	}

	const [label, num] = title.split(/(\d+)/);

	return {
		label,
		id: Number(num),
	};
};
