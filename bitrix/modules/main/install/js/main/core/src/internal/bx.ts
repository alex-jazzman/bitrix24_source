const bxTmp = (window as any).BX;

(window as any).BX = function(node: any)
{
	if ((window as any).BX.type.isNotEmptyString(node))
	{
		return document.getElementById(node);
	}

	if ((window as any).BX.type.isDomNode(node))
	{
		return node;
	}

	if ((window as any).BX.type.isFunction(node))
	{
		return (window as any).BX.ready(node);
	}

	return null;
};

if (bxTmp)
{
	Object.keys(bxTmp).forEach((key) => {
		(window as any).BX[key] = bxTmp[key];
	});
}

// @ts-ignore: reassign rollup IIFE exports to window.BX
exports = (window as any).BX;
