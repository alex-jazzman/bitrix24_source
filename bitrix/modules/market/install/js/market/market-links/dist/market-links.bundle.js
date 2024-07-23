this.BX = this.BX || {};
(function (exports,main_core) {
	'use strict';

	const MAIN_DIR = '/market/';
	class MarketLinks {
	  static mainLink() {
	    return MAIN_DIR;
	  }
	  static favoritesLink() {
	    return MAIN_DIR + 'favorites/';
	  }
	  static installedLink() {
	    return MAIN_DIR + 'installed/';
	  }
	  static categoryLink(categoryCode) {
	    return MAIN_DIR + 'category/' + categoryCode + '/';
	  }
	  static collectionLink(collectionId, showOnPage) {
	    if (showOnPage === 'Y') {
	      return MarketLinks.collectionPageLink(collectionId);
	    }
	    return MAIN_DIR + 'collection/' + collectionId + '/';
	  }
	  static collectionPageLink(collectionId) {
	    return MAIN_DIR + 'collection/page/' + collectionId + '/';
	  }
	  static appDetail(appCode, isSiteTemplate = false, queryParams = {}) {
	    if (isSiteTemplate) {
	      return MarketLinks.siteDetailLink(appCode, queryParams);
	    }
	    const params = new URLSearchParams(queryParams).toString();
	    const query = params.length ? '?' + params : '';
	    return MAIN_DIR + 'detail/' + appCode + '/' + query;
	  }
	  static siteDetailLink(appCode, queryParams) {
	    var _queryParams$from;
	    const from = (_queryParams$from = queryParams.from) != null ? _queryParams$from : '';
	    let path = '/sites/site/edit/0/?IS_FRAME=Y&tpl=market/' + appCode + '&from=' + from;
	    if (MarketLinks.siteTemplateUrn === false) {
	      MarketLinks.siteTemplateUrn = new URLSearchParams(document.location.search).get("create_uri");
	      if (!main_core.Type.isString(MarketLinks.siteTemplateUrn)) {
	        MarketLinks.siteTemplateUrn = '';
	      }
	    }
	    if (MarketLinks.siteTemplateUrn.length > 0) {
	      let uri = new URL(MarketLinks.siteTemplateUrn, window.location.href);
	      uri.searchParams.append('IS_FRAME', 'Y');
	      uri.searchParams.append('tpl', 'market/' + appCode);
	      path = uri.pathname + uri.search;
	    }
	    return path;
	  }
	  static openSiteTemplate(event, isSiteTemplate) {
	    if (isSiteTemplate) {
	      event.preventDefault();
	      BX.SidePanel.Instance.open(event.currentTarget.href, {
	        customLeftBoundary: 60
	      });
	    }
	  }
	}
	MarketLinks.siteTemplateUrn = false;

	exports.MarketLinks = MarketLinks;

}((this.BX.Market = this.BX.Market || {}),BX));
