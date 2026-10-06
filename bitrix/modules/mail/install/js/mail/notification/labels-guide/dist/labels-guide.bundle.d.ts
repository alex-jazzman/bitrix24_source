/* eslint-disable */
type LabelsGuideOptions = {
	id: string;
	bindElement: HTMLElement;
	userOptionName: string;
	onCreate: () => void;
};

declare namespace BX.Mail {
	class LabelsGuide {
		constructor(options: LabelsGuideOptions);
		show(): void;
	}
}
