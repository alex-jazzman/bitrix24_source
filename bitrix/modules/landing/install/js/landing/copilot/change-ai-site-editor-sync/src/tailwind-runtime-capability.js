import {Env} from 'landing.env';

export const normalizeTailwindRuntimeEnabled = (value: mixed): boolean => {
	if (value === true || value === 1)
	{
		return true;
	}

	const normalized = String(value).trim().toLowerCase();

	return ['1', 'true', 'y', 'yes'].includes(normalized);
};

export const isTailwindRuntimeEnabled = (): boolean => {
	try
	{
		return normalizeTailwindRuntimeEnabled(
			Env.getInstance().getOptions()?.tailwindRuntimeEnabled,
		);
	}
	catch
	{
		return false;
	}
};
