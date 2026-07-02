import Type from '../type';

function isOptionSupported(name: string): boolean
{
	let isSupported = false;

	try
	{
		const options = Object.defineProperty({}, name, {
			get()
			{
				isSupported = true;
			},
		});

		window.addEventListener('test', null as any, options);
	}
	catch
	{
		// intentionally empty
	}

	return isSupported;
}

export default function fetchSupportedListenerOptions(
	options?: AddEventListenerOptions | boolean,
): AddEventListenerOptions | boolean
{
	if (!Type.isPlainObject(options))
	{
		return options as boolean;
	}

	return Object.keys(options as Record<string, unknown>).reduce((acc: Record<string, any>, name) => {
		if (isOptionSupported(name))
		{
			acc[name] = (options as Record<string, any>)[name];
		}

		return acc;
	}, {});
}
