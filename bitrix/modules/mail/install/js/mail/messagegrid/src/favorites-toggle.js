export function resolveFavoriteTarget(star)
{
	return star.getAttribute('aria-pressed') !== 'true';
}

export function toggleFavoriteOnServer({ star, ajax, applyToStar, announce, messages = {} })
{
	const id = star.getAttribute('data-favorite-id');
	if (!id)
	{
		return Promise.resolve();
	}

	const target = resolveFavoriteTarget(star);
	const say = (text) => {
		if (text)
		{
			announce(text);
		}
	};

	applyToStar(star, target);
	say(target ? messages.added : messages.removed);

	return ajax.runAction('mail.api.message.setFavoriteState', {
		data: { id, isFavorite: target ? 'Y' : 'N' },
	}).catch(() => {
		applyToStar(star, !target);
		say(messages.error);
	});
}
