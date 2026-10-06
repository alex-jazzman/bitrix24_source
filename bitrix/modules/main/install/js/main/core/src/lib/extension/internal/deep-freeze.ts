import Type from '../../type';

export default function deepFreeze<T>(target: T): Readonly<T>
{
	if (Type.isObject(target))
	{
		Object.values(target).forEach((value) => {
			deepFreeze(value);
		});

		return Object.freeze(target);
	}

	return target;
}
