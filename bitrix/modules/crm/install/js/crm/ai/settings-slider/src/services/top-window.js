export function getTopBX(): ?Object
{
	try
	{
		return window.top.BX ?? window.BX;
	}
	catch (error)
	{
		return window.BX;
	}
}
