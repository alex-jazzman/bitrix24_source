/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core) {
	'use strict';

	const showLimit = limitParams => {
	  if (!main_core.Type.isStringFilled(limitParams.featureId)) {
	    throw new Error('featureId is required');
	  }
	  const featureId = limitParams.featureId;
	  const code = main_core.Type.isStringFilled(limitParams.code) ? limitParams.code : `limit_${featureId}`;
	  const bindElement = main_core.Type.isElementNode(limitParams.bindElement) ? limitParams.bindElement : null;
	  let limitAnalyticsLabels = {};
	  if (main_core.Type.isPlainObject(limitParams.limitAnalyticsLabels)) {
	    limitAnalyticsLabels = {
	      module: 'tasks',
	      ...limitParams.limitAnalyticsLabels
	    };
	  }
	  return new Promise((resolve, reject) => {
	    main_core.Runtime.loadExtension('ui.info-helper').then(({
	      FeaturePromotersRegistry
	    }) => {
	      if (FeaturePromotersRegistry) {
	        FeaturePromotersRegistry.getPromoter({
	          featureId,
	          code,
	          bindElement
	        }).show();
	      } else {
	        BX.UI.InfoHelper.show(code, {
	          limitAnalyticsLabels,
	          isLimit: true
	        });
	      }
	      resolve();
	    }).catch(error => {
	      reject(error);
	    });
	  });
	};

	exports.showLimit = showLimit;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX));
//# sourceMappingURL=show-limit.bundle.js.map
