export const createUniqueId = (): string => {
	const randomNumber = (): number => Math.floor(1000 + Math.random() * 9000);

	return `A${randomNumber()}_${randomNumber()}_${randomNumber()}_${randomNumber()}`;
};
