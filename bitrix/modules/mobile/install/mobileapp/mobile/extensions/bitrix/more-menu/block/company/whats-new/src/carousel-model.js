/**
 * @module more-menu/block/company/whats-new/src/carousel-model
 */
jn.define('more-menu/block/company/whats-new/src/carousel-model', (require, exports, module) => {
	const MAX_ARTICLES = 3;

	const getCategoryName = (article, categories) => {
		const category = categories.find((item) => item.code === article.categoryCode);

		return category?.name ?? null;
	};

	const getImageUri = (article) => {
		if (article.bottomDescriptionType !== 'image' || typeof article.bottomDescription !== 'string')
		{
			return null;
		}

		const imageUri = article.bottomDescription.trim();

		return imageUri || null;
	};

	const project = (articles = [], categories = []) => {
		return articles
			.map((article, index) => ({ article, index }))
			.filter(({ article }) => typeof article.name === 'string' && article.name.trim() !== '')
			.sort((first, second) => {
				const firstTime = Number(first.article.time);
				const secondTime = Number(second.article.time);
				const timeDifference = (Number.isFinite(secondTime) ? secondTime : 0)
					- (Number.isFinite(firstTime) ? firstTime : 0);

				return timeDifference || first.index - second.index;
			})
			.slice(0, MAX_ARTICLES)
			.map(({ article }) => ({
				id: article.id,
				title: article.name,
				isNew: article.isNew,
				isRead: article.isRead,
				actionType: article.actionType,
				actionArticleId: article.actionArticleId,
				category: getCategoryName(article, categories),
				imageUri: getImageUri(article),
			}));
	};

	const isSuccessfulEmptyInitialResult = (initialResult) => {
		const initialArticles = initialResult?.data?.articles ?? initialResult?.articles;

		return initialResult?.isSuccess === true && Array.isArray(initialArticles) && initialArticles.length === 0;
	};

	const reduceSnapshot = (snapshot, status, articles = [], categories = [], initialResult = null) => {
		if (isSuccessfulEmptyInitialResult(initialResult))
		{
			return [];
		}

		const projected = project(articles, categories);

		if (status === 'success' && projected.length > 0)
		{
			return projected;
		}

		if (['idle', 'pending', 'failed'].includes(status) && snapshot?.length > 0)
		{
			return snapshot;
		}

		return [];
	};

	const shouldShowLoadingSkeleton = ({ isIdle, isLoading, initialLoadFailed }) => {
		if (initialLoadFailed)
		{
			return false;
		}

		return Boolean(isIdle || isLoading);
	};

	const resolvePageIndex = (pageIndex, snapshotLength) => Math.min(pageIndex, Math.max(snapshotLength - 1, 0));

	const isReadConfirmed = (result, articleId) => {
		const markedIds = result?.data?.markedAsReadNewsIds ?? result?.markedAsReadNewsIds;

		return Array.isArray(markedIds) && markedIds.some((id) => String(id) === String(articleId));
	};

	const createCardActionController = ({ openHelpdeskArticle, sendAnalytics, markRead, openWhatsNew }) => {
		const pendingReadIds = new Set();
		const readIds = new Set();

		const onCardTap = (article) => {
			if (article.actionType !== 'helpdeskLink' || !article.actionArticleId)
			{
				openWhatsNew();

				return Promise.resolve();
			}

			openHelpdeskArticle(article.actionArticleId);
			sendAnalytics(article.id);

			if (!article.isNew || article.isRead || pendingReadIds.has(article.id) || readIds.has(article.id))
			{
				return Promise.resolve();
			}

			pendingReadIds.add(article.id);

			let request = null;
			try
			{
				request = markRead(article.id);
			}
			catch
			{
				pendingReadIds.delete(article.id);

				return Promise.resolve();
			}

			// the shared reducer leaves isRead unset once the counter hits zero, so remember the confirmed ids
			return Promise.resolve(request)
				.then((result) => {
					if (isReadConfirmed(result, article.id))
					{
						readIds.add(article.id);

						return;
					}

					pendingReadIds.delete(article.id);
				})
				.catch(() => pendingReadIds.delete(article.id));
		};

		return {
			onCardTap,
			clear: () => {
				pendingReadIds.clear();
				readIds.clear();
			},
		};
	};

	module.exports = {
		createCardActionController,
		isReadConfirmed,
		project,
		reduceSnapshot,
		resolvePageIndex,
		shouldShowLoadingSkeleton,
	};
});
