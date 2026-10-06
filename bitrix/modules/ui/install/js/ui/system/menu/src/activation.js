/**
 * Enter and Space activate a control the way a mouse click does, so a consumer
 * handler always receives a real MouseEvent. Returns whether the key was an
 * activation one.
 */
export const activateByKey = (event: KeyboardEvent, target: HTMLElement): boolean => {
	if (event.key !== 'Enter' && event.key !== ' ')
	{
		return false;
	}

	event.preventDefault();
	target.click();

	return true;
};
