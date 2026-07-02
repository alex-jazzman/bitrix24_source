export class BinaryHeap
{
	content = [];
	scoreFunction = null;

	constructor(scoreFunction)
	{
		this.scoreFunction = scoreFunction;
	}

	push(element): void
	{
		this.content.push(element);
		this.bubbleUp(this.content.length - 1);
	}

	pop(): {...}
	{
		const result = this.content[0];
		const end = this.content.pop();

		if (this.content.length > 0)
		{
			this.content[0] = end;
			this.sinkDown(0);
		}

		return result;
	}

	peek(): any
	{
		return this.content[0];
	}

	remove(node): void
	{
		const len = this.content.length;

		for (let i = 0; i < len; i++)
		{
			if (this.content[i] === node)
			{
				const end = this.content.pop();

				if (i !== (len - 1))
				{
					this.content[i] = end;

					if (this.scoreFunction(end) < this.scoreFunction(node))
					{
						this.bubbleUp(i);
					}
					else
					{
						this.sinkDown(i);
					}
				}

				return;
			}
		}

		throw new Error('Node not found.');
	}

	size(): number
	{
		return this.content.length;
	}

	bubbleUp(n: number): void
	{
		const element = this.content[n];

		while (n > 0)
		{
			const parentN = Math.floor((n + 1) / 2) - 1;
			const parent = this.content[parentN];

			if (this.scoreFunction(element) < this.scoreFunction(parent))
			{
				this.content[parentN] = element;
				this.content[n] = parent;
				n = parentN;
			}
			else
			{
				break;
			}
		}
	}

	sinkDown(n: number): void
	{
		const length = this.content.length;
		const element = this.content[n];
		const elemScore = this.scoreFunction(element);

		while (true)
		{
			const child2N = (n + 1) * 2;
			const child1N = child2N - 1;
			let swap = null;

			if (child1N < length)
			{
				const child1 = this.content[child1N];
				const child1Score = this.scoreFunction(child1);

				if (child1Score < elemScore)
				{
					swap = child1N;
				}
			}

			if (child2N < length)
			{
				const child2 = this.content[child2N];
				const child2Score = this.scoreFunction(child2);

				if (child2Score < (swap === null ? elemScore : child1Score))
				{
					swap = child2N;
				}
			}

			if (swap === null)
			{
				break;
			}
			else
			{
				this.content[n] = this.content[swap];
				this.content[swap] = element;
				n = swap;
			}
		}
	}
}
