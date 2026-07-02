import Type from '../lib/type';

export default function getWindow(element: any): Window
{
	if (Type.isElementNode(element))
	{
		return (element.ownerDocument as any).parentWindow || element.ownerDocument.defaultView || window;
	}

	if (Type.isDomNode(element))
	{
		return (element as any).parentWindow || (element as any).defaultView || window;
	}

	return window;
}
