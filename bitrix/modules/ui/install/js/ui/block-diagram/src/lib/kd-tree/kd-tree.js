import { Node } from './node';
import { BinaryHeap } from './binary-heap';

export class KdTree
{
	#root = null;
	#dimensions = [];
	#metric = null;
	#bestNodes = new BinaryHeap((e) => -e[1]);

	constructor(points, metric, dimensions)
	{
		this.#dimensions = dimensions;
		this.#metric = metric;

		if (Array.isArray(points))
		{
			this.#root = this.buildTree(points, 0, null);
		}
		else
		{
			this.loadTree(points, metric, dimensions);
		}
	}

	buildTree(points, depth, parent): Node | null
	{
		const dim = depth % this.#dimensions.length;
		let median = 0;
		let node = null;

		if (points.length === 0)
		{
			return null;
		}

		if (points.length === 1)
		{
			return new Node(points[0], dim, parent);
		}

		points.sort((a, b) => {
			return a[this.#dimensions[dim]] - b[this.#dimensions[dim]];
		});

		median = Math.floor(points.length / 2);
		node = new Node(points[median], dim, parent);

		node.left = this.buildTree(points.slice(0, median), depth + 1, node);
		node.right = this.buildTree(points.slice(median + 1), depth + 1, node);

		return node;
	}

	#restoreParent(parentNode: Node | null): void
	{
		if (parentNode === null)
		{
			return;
		}

		if (this.#root.left)
		{
			this.#root.left.parent = this.#root;
			this.#restoreParent(this.#root.left);
		}

		if (this.#root.right)
		{
			this.#root.right.parent = this.#root;
			this.#restoreParent(this.#root.right);
		}
	}

	loadTree(data): void
	{
		this.#root = data;
		this.#restoreParent(this.#root);
	}

	#nodeHeight(node: Node | null): number
	{
		if (node === null)
		{
			return 0;
		}

		return Math.max(this.#nodeHeight(node.left), this.#nodeHeight(node.right)) + 1;
	}

	#nodeCount(node: Node | null): number
	{
		if (node === null)
		{
			return 0;
		}

		return this.#nodeCount(node.left) + this.#nodeCount(node.right) + 1;
	}

	balanceFactor(): number
	{
		return this.#nodeHeight(this.#root) / (Math.log(this.#nodeCount(this.#root)) / Math.log(2));
	}

	#innerSearch(node: Node | null, parent, point): Node | null
	{
		if (node === null)
		{
			return parent;
		}

		const dimension = this.#dimensions[node.dimension];

		if (point[dimension] < node.obj[dimension])
		{
			return this.#innerSearch(node.left, node, point);
		}

		return this.#innerSearch(node.right, node, point);
	}

	insert(point)
	{
		const insertPosition = this.#innerSearch(this.root, null, point);

		if (insertPosition === null)
		{
			this.root = new Node(point, 0, null);

			return;
		}

		const newNode = new Node(
			point,
			(insertPosition.dimension + 1) % this.#dimensions.length,
			insertPosition,
		);
		const dimension = this.#dimensions[insertPosition.dimension];

		if (point[dimension] < insertPosition.obj[dimension])
		{
			insertPosition.left = newNode;
		}
		else
		{
			insertPosition.right = newNode;
		}
	}

	#nodeSearch(node: Node, point): Node | null
	{
		if (node === null)
		{
			return null;
		}

		if (node.obj === point)
		{
			return node;
		}

		const dimension = this.#dimensions[node.dimension];

		if (point[dimension] < node.obj[dimension])
		{
			return this.#nodeSearch(node.left, point);
		}

		return this.#nodeSearch(node.right, point);
	}

	#findMinNode(node: Node | null, dim): Node | null
	{
		if (node === null)
		{
			return null;
		}

		const dimension = this.#dimensions[dim];

		if (node.dimension === dim)
		{
			if (node.left !== null)
			{
				return this.#findMinNode(node.left, dim);
			}

			return node;
		}

		const own = node.obj[dimension];
		const left = this.#findMinNode(node.left, dim);
		const right = this.#findMinNode(node.right, dim);
		let min = node;

		if (left !== null && left.obj[dimension] < own)
		{
			min = left;
		}

		if (right !== null && right.obj[dimension] < min.obj[dimension])
		{
			min = right;
		}

		return min;
	}

	#removeNode(node: Node)
	{
		const currentNode = node;

		if (currentNode.left === null && currentNode.right === null)
		{
			if (currentNode.parent === null)
			{
				this.#root = null;

				return;
			}

			const pDimension = this.#dimensions[currentNode.parent.dimension];

			if (currentNode.obj[pDimension] < currentNode.parent.obj[pDimension])
			{
				currentNode.parent.left = null;
			}
			else
			{
				currentNode.parent.right = null;
			}

			return;
		}

		if (node.right === null)
		{
			const nextNode = this.#findMinNode(currentNode.left, node.dimension);
			const nextObj = nextNode.obj;

			this.#removeNode(nextNode);
			currentNode.right = node.left;
			currentNode.left = null;
			currentNode.obj = nextObj;
		}
		else
		{
			const nextNode = this.#findMinNode(currentNode.right, node.dimension);
			const nextObj = nextNode.obj;

			this.#removeNode(nextNode);
			currentNode.obj = nextObj;
		}
	}

	remove(point): void
	{
		const node = this.#nodeSearch(this.#root, point);

		if (node === null)
		{
			return;
		}

		this.#removeNode(node);
	}

	#saveBestNode(node, distance, maxNodes): void
	{
		this.#bestNodes.push([node, distance]);

		if (this.#bestNodes.size() > maxNodes)
		{
			this.#bestNodes.pop();
		}
	}

	#nearestSearch(node, point, maxNodes: number): void
	{
		let bestChild = null;
		const dimension = this.#dimensions[node.dimension];
		const ownDistance = this.#metric(point, node.obj);
		const linearPoint = {};
		let linearDistance = 0;
		let otherChild = null;

		for (let i = 0; i < this.#dimensions.length; i += 1)
		{
			if (i === node.dimension)
			{
				linearPoint[this.#dimensions[i]] = point[this.#dimensions[i]];
			}
			else
			{
				linearPoint[this.#dimensions[i]] = node.obj[this.#dimensions[i]];
			}
		}

		linearDistance = this.#metric(linearPoint, node.obj);

		if (node.right === null && node.left === null)
		{
			if (this.#bestNodes.size() < maxNodes || ownDistance < this.#bestNodes.peek()[1])
			{
				this.#saveBestNode(node, ownDistance, maxNodes);
			}

			return;
		}

		if (node.right === null)
		{
			bestChild = node.left;
		}
		else if (node.left === null)
		{
			bestChild = node.right;
		}
		else
		{
			bestChild = point[dimension] < node.obj[dimension]
				? node.left
				: node.right;
		}

		this.#nearestSearch(bestChild, point, maxNodes);

		if (this.#bestNodes.size() < maxNodes || ownDistance < this.#bestNodes.peek()[1])
		{
			this.#saveBestNode(node, ownDistance, maxNodes);
		}

		if (this.#bestNodes.size() < maxNodes || Math.abs(linearDistance) < this.#bestNodes.peek()[1])
		{
			if (bestChild === node.left)
			{
				otherChild = node.right;
			}
			else
			{
				otherChild = node.left;
			}

			if (otherChild !== null)
			{
				this.#nearestSearch(otherChild, point, maxNodes);
			}
		}
	}

	nearest(point, maxNodes: number, maxDistance): Node[]
	{
		const result = [];

		this.#bestNodes = new BinaryHeap((e) => -e[1]);

		if (maxDistance)
		{
			for (let i = 0; i < maxNodes; i += 1)
			{
				this.#bestNodes.push([null, maxDistance]);
			}
		}

		if (this.#root)
		{
			this.#nearestSearch(this.#root, point, maxNodes);
		}

		for (let i = 0; i < Math.min(maxNodes, this.#bestNodes.content.length); i += 1)
		{
			if (this.#bestNodes.content[i][0])
			{
				result.push([this.#bestNodes.content[i][0].obj, this.#bestNodes.content[i][1]]);
			}
		}

		return result;
	}
}
