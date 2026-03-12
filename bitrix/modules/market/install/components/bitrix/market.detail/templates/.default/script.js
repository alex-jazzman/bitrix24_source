/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core) {
	'use strict';

	class Error {
	  constructor() {
	    main_core.Event.ready(() => {
	      this.bindEvents();
	    });
	  }
	  bindEvents() {
	    const catalogButton = document.getElementById('market-detail-go-to-catalog');
	    if (catalogButton) {
	      main_core.Event.bind(catalogButton, 'click', this.handleCatalogClick.bind(this));
	    }
	  }
	  handleCatalogClick() {
	    top.location.href = '/market/?openCatalog=Y';
	  }
	}

	main_core.Event.ready(() => {
	  new Error();
	});

}((this.BX.Market = this.BX.Market || {}),BX));
//# sourceMappingURL=script.js.map
