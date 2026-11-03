/* eslint-disable */
type RunProcessOptions = {
	onLaunched?: (launchId: number) => void;
};

type ProcessEntry = {
	id: number;
	name: string;
	hasParameters: boolean;
};

declare namespace BX.Sign.V2.B2e {
	/**
	 * Slider of the launch of a process (TPL-10) - the single point both surfaces of the choice open. The
	 * process comes from the outside, so there is no step of the choice inside: the breadcrumb is
	 * "parameters - employees", and a process without start fields opens straight on the employees (AC-003).
	 */
	class RunProcess {
		static open(process: ProcessEntry, options?: RunProcessOptions): void;
		private constructor();
	}
}
