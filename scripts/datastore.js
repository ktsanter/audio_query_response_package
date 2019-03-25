"use strict";

//---------------------------------------------------------------
// Google Web API for retrieving audio query/response package configuration
//---------------------------------------------------------------

const API_BASE = 'https://script.google.com/macros/s/AKfycbxV2GBJNOReNqHyaVSOgwPkANsjM3H8ZqdnJKNx0OZhCGraj5rO/exec';
const API_KEY = 'MVaudioqueryresponseAPI';

//--------------------------------------------------------------
// build URL for use with Google sheet web API
//--------------------------------------------------------------
	function _buildApiUrl (datasetname, params) {
    let url = API_BASE;
    url += '?key=' + API_KEY;
    url += datasetname && datasetname !== null ? '&dataset=' + datasetname : '';

    for (var param in params) {
      url += '&' + param + '=' + params[param].replace(/ /g, '%20');
    }

    //console.log('buildApiUrl: url=' + url);
    
    return url;
  }
  
//--------------------------------------------------------------
// use Google Sheet web API to get tag and comment data
//--------------------------------------------------------------
function _getConfigData (sourceFileId, reportErr, callback1) {
 //console.log('loading config data...');
  var urlParams = {
    sourcefileid: sourceFileId
  };

	fetch(_buildApiUrl('config', urlParams))
		.then((response) => response.json())
		.then((json) => {
			//console.log('json.status=' + json.status);
			//console.log('json.data: ' + JSON.stringify(json.data));
			if (json.status !== 'success') {
				console.log('json.message=' + json.message);
        reportErr('_getConfigData', json.message);
			} else {
				callback1(json.data);
			}
		})
		.catch((error) => {
			console.log('Unexpected error loading config data');
			console.log(error);
      reportErr('_getConfigData', error);
		});
}
