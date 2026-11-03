import Type from '../lib/type';

export default function getElement(element: string | HTMLElement): HTMLElement | null
{
	if (Type.isString(element))
	{
		return document.getElementById(element);
	}

	return element;
}
