export type AutoHideUnfreeze = () => void;

export type AutoHideContext = {
	freeze: () => AutoHideUnfreeze,
};
