/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_sidepanel) {
	'use strict';

	const sp = main_sidepanel.SidePanel != null ? main_sidepanel.SidePanel : BX.SidePanel;
	const ManagerInst = main_sidepanel.Manager != null ? main_sidepanel.Manager : BX.SidePanel.Manager;
	const SidePanelInstance = window === top ? sp.Instance : new ManagerInst();

	exports.SidePanelInstance = SidePanelInstance;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX.SidePanel));
//# sourceMappingURL=side-panel-instance.bundle.js.map
