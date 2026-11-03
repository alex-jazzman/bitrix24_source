const DIVIDER_SELECTOR = '.bx-im-message-list-date-group-title__container[data-date]';
// the browser can hold a sticky element a fraction of a pixel away from its own place
const DISPLACEMENT_THRESHOLD = 1;

/**
 * The divider is sticky at the top of the scrollport, so a group already scrolled past keeps its
 * divider pushed up by its own group, while a group still below holds the divider at rest.
 */
const isDisplacedFromGroup = (divider: HTMLElement): boolean => {
	const group = divider.parentElement;
	if (!group)
	{
		return false;
	}

	const displacement = divider.getBoundingClientRect().top - group.getBoundingClientRect().top;

	return displacement > DISPLACEMENT_THRESHOLD;
};

/**
 * The day of the topmost visible group of the list, empty when the list has no day to report.
 *
 * The group the user is looking at is the last displaced one: everything above it is displaced too,
 * everything below is not. Nothing displaced means the list is not scrolled at all, and then the
 * group on screen is the first one.
 */
export const getTopVisibleDate = (container: HTMLElement): string => {
	let firstDate = '';
	let topVisibleDate = '';

	container.querySelectorAll(DIVIDER_SELECTOR).forEach((divider: HTMLElement) => {
		const { date } = divider.dataset;
		if (!date)
		{
			return;
		}

		if (firstDate === '')
		{
			firstDate = date;
		}

		if (isDisplacedFromGroup(divider))
		{
			topVisibleDate = date;
		}
	});

	return topVisibleDate === '' ? firstDate : topVisibleDate;
};
