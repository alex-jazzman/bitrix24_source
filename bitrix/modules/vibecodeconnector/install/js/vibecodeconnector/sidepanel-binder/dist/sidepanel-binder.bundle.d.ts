/* eslint-disable */
type RootWindow = {
	[ANCHORS_BOUND_FLAG]?: boolean;
};

declare namespace BX.Vibecodeconnector {
	function bindAppPageAnchors(): boolean;

	function bindAppPageAnchorsTo(rootWindow: RootWindow | null, sliderManager: BX.SidePanel.SliderManager | null): boolean;

	const ANCHORS_BOUND_FLAG = "vibecodeconnectorAppPageAnchorsBound";
}
