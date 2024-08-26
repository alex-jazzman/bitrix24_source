/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports) {
	'use strict';

	class BBCodeEncoder {
	  encodeText(source) {
	    return String(source).replaceAll('[', '&#91;').replaceAll(']', '&#93;');

	    // return String(source)
	    // 	.replaceAll('&', '&amp;')
	    // 	.replaceAll('[', '&#91;')
	    // 	.replaceAll(']', '&#93;')
	    // 	.replaceAll('\'', '&#39;')
	    // 	.replaceAll('"', '&quot;')
	    // 	.replaceAll('<', '&lt;')
	    // 	.replaceAll('>', '&gt;');
	  }

	  decodeText(source) {
	    return String(source).replaceAll('&#91;', '[').replaceAll('&#93;', ']');

	    // return String(source)
	    // 	.replaceAll('&#91;', '[')
	    // 	.replaceAll('&#93;', ']')
	    // 	.replaceAll('&#39;', '\'')
	    // 	.replaceAll('&quot;', '"')
	    // 	.replaceAll('&lt;', '<')
	    // 	.replaceAll('&gt;', '>')
	    // 	.replaceAll('&amp;', '&');
	  }

	  encodeAttribute(source) {
	    return this.encodeText(source);
	  }
	  decodeAttribute(source) {
	    return this.decodeText(source);
	  }
	}

	exports.BBCodeEncoder = BBCodeEncoder;

}((this.BX.UI.BBCode = this.BX.UI.BBCode || {})));
//# sourceMappingURL=encoder.bundle.js.map
