export class Transition
{
	static linear(progress: number): number
	{
		return progress;
	}

	static quad(progress: number): number
	{
		return progress ** 2;
	}

	static cubic(progress: number): number
	{
		return progress ** 3;
	}

	static quart(progress: number): number
	{
		return progress ** 4;
	}

	static quint(progress: number): number
	{
		return progress ** 5;
	}

	static circ(progress: number): number
	{
		return 1 - Math.sin(Math.acos(progress));
	}

	static back(progress: number): number
	{
		return (progress ** 2) * ((1.5 + 1) * progress - 1.5);
	}

	static elasti(progress: number): number
	{
		return (2 ** (10 * (progress - 1))) * Math.cos(20 * Math.PI * 1.5 / 3 * progress);
	}

	static bounce(progress: number): number
	{
		for (let a = 0, b = 1; ; a += b, b /= 2)
		{
			if (progress >= (7 - 4 * a) / 11)
			{
				return -(((11 - 6 * a - 11 * progress) / 4) ** 2) + (b ** 2);
			}
		}
	}
}
