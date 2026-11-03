export const singleFlight = (task) => {
	let inFlight = null;
	let rerunRequested = false;
	const run = () => {
		if (inFlight)
		{
			rerunRequested = true;

			return;
		}

		inFlight = (async () => {
			try
			{
				await task();
			}
			finally
			{
				inFlight = null;
				if (rerunRequested)
				{
					rerunRequested = false;
					run();
				}
			}
		})();
	};

	return run;
};
