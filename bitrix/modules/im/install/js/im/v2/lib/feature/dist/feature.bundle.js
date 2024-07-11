/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_application_core) {
	'use strict';

	const Feature = {
	  chatV2: 'chatV2',
	  chatDepartments: 'chatDepartments',
	  copilot: 'copilot',
	  sidebarLinks: 'sidebarLinks',
	  sidebarFiles: 'sidebarFiles',
	  sidebarBriefs: 'sidebarBriefs',
	  zoomActive: 'zoomActive',
	  zoomAvailable: 'zoomAvailable',
	  giphyAvailable: 'giphyAvailable'
	};
	const FeatureManager = {
	  isFeatureAvailable(featureName) {
	    var _featureOptions$featu;
	    const {
	      featureOptions = {}
	    } = im_v2_application_core.Core.getApplicationData();
	    return (_featureOptions$featu = featureOptions[featureName]) != null ? _featureOptions$featu : false;
	  }
	};

	exports.Feature = Feature;
	exports.FeatureManager = FeatureManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Messenger.v2.Application));
//# sourceMappingURL=feature.bundle.js.map
