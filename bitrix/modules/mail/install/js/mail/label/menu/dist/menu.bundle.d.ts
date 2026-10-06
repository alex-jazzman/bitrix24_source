/* eslint-disable */
type LabelsMenuOptions = {
	container: HTMLElement;
	labels: BX.Mail.Label.Core.LabelDto[];
	onSelect: (labelId: number) => void;
	onCreate?: () => void;
};

declare namespace BX.Mail.Label.Menu {
	class LabelsMenu {
		constructor(options: LabelsMenuOptions);
		render(): HTMLElement;
		setLabels(labels: BX.Mail.Label.Core.LabelDto[]): void;
		updateCounters(counters: BX.Mail.Label.Core.LabelCounters): void;
		setActive(labelId: number | null): void;
		destroy(): void;
	}
}
