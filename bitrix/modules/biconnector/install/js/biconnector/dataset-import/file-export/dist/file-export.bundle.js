/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, main_core) {
	'use strict';

	class FileExport {
	  static #instance;
	  #exportDownloadLinks;
	  constructor() {
	    this.#exportDownloadLinks = new Map();
	  }
	  static getInstance() {
	    if (!FileExport.#instance) {
	      FileExport.#instance = new FileExport();
	    }
	    return FileExport.#instance;
	  }
	  downloadOnce(dataset) {
	    return new Promise((resolve, reject) => {
	      this.#getDownloadLink(dataset.id).then(link => {
	        this.#downloadDatasetFromLink(link, dataset);
	        URL.revokeObjectURL(link);
	        this.#exportDownloadLinks.delete(dataset.id);
	        resolve();
	      }).catch(error => {
	        reject(error);
	      });
	    });
	  }
	  download(dataset) {
	    return new Promise((resolve, reject) => {
	      this.#getDownloadLink(dataset.id).then(link => {
	        this.#downloadDatasetFromLink(link, dataset);
	        resolve();
	      }).catch(error => {
	        reject(error);
	      });
	    });
	  }
	  #getDownloadLink(datasetId) {
	    return new Promise((resolve, reject) => {
	      if (this.#exportDownloadLinks.has(datasetId)) {
	        resolve(this.#exportDownloadLinks.get(datasetId));
	      }
	      main_core.ajax.runAction('biconnector.externalsource.dataset.export', {
	        data: {
	          id: datasetId,
	          exportFormat: 'csv'
	        }
	      }).then(response => {
	        const blob = new Blob([response.data], {
	          type: 'text/csv'
	        });
	        const link = URL.createObjectURL(blob);
	        this.#exportDownloadLinks.set(datasetId, link);
	        resolve(link);
	      }).catch(error => {
	        reject(error);
	      });
	    });
	  }
	  #downloadDatasetFromLink(link, dataset) {
	    const anchorElement = document.createElement('a');
	    anchorElement.href = link;
	    anchorElement.download = `${dataset.title ?? 'csv_table'}.csv`;
	    main_core.Dom.append(anchorElement, document.body);
	    anchorElement.click();
	    main_core.Dom.remove(anchorElement);
	  }
	}

	exports.FileExport = FileExport;

})(this.BX.BIConnector.DatasetImport = this.BX.BIConnector.DatasetImport || {}, BX);
//# sourceMappingURL=file-export.bundle.js.map
