let locked = false;

export const tryAcquirePopupLock = (): boolean => {
	if (locked)
	{
		return false;
	}
	locked = true;

	return true;
};

export const releasePopupLock = (): void => {
	locked = false;
};

export const isPopupLocked = (): boolean => locked;
