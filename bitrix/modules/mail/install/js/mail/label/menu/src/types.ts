import { type LabelDto } from 'mail.label.core';

export type LabelsMenuOptions = {
	container: HTMLElement,
	labels: LabelDto[],
	onSelect: (labelId: number) => void,
	onCreate?: () => void,
};
