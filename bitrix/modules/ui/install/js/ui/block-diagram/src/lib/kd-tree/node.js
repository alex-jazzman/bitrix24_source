export class Node
{
	constructor(obj: {...}, dimension: number, parent: Node | null)
	{
		this.obj = obj;
		this.left = null;
		this.right = null;
		this.parent = parent;
		this.dimension = dimension;
	}
}
