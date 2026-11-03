/* eslint-disable */
type EmbedProjectInfoParams = {
	projectId: number;
	/**
	 * Called at most once for this handle after its first mounted application settles and updates the DOM.
	 * Mounting the same handle again after unmount does not produce another signal.
	 */
	onReady?: () => void;
};

type EmbedProjectInfoHandle = {
	mount: (container: HTMLElement) => void;
	unmount: () => void;
};

declare namespace BX.Socialnetwork.V2.Application {
	/**
	 * Public handle of the read-only project "Information" block.
	 * The consumer mounts it into a prepared sidebar slot and unmounts on chat close.
	 * The block never throws on read failure and degrades to empty sections.
	 */
	function embedProjectInfo({ projectId, onReady }: EmbedProjectInfoParams): EmbedProjectInfoHandle;
}
