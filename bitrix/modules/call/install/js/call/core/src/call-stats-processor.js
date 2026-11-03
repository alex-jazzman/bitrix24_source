/**
 * Process one stats tick without allowing incomplete data or processing errors
 * to leave a pending NQE window behind.
 *
 * @param {Object} options
 * @returns {Object}
 */
export function processCallStats(options)
{
	const {
		stats,
		mediaServer,
		processPublisherStats,
		processSubscriberStats,
		onAutoQuality,
		onError,
		onStatsReceived,
	} = options;
	const processedStats = {};

	try
	{
		const isStatsIncomplete = !stats?.subscriber || (mediaServer?.isPublishing && !stats?.publisher);

		if (stats?.publisher)
		{
			processedStats.publisher = processPublisherStats(stats.publisher);
		}
		if (stats?.subscriber)
		{
			processedStats.subscriber = processSubscriberStats(stats.subscriber);
		}

		if (mediaServer?.nqe)
		{
			if (isStatsIncomplete)
			{
				mediaServer.nqe.resetPendingWindow();
			}
			else
			{
				const action = mediaServer.nqe.processStats(processedStats.publisher, processedStats.subscriber);
				if (action === 'downgrade' || action === 'upgrade')
				{
					onAutoQuality(
						mediaServer.nqe.getCurrentQuality(),
						mediaServer.nqe.getPreviousQuality(),
					);
				}
			}
		}
	}
	catch (error)
	{
		mediaServer?.nqe?.resetPendingWindow();
		onError(error);
	}
	finally
	{
		onStatsReceived(processedStats);
	}

	return processedStats;
}
