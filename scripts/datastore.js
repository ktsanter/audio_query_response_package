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
async function _getConfigData(sourceFileId, reportErr) {
  var urlParams = {
    sourcefileid: sourceFileId
  };
  var url = _buildApiUrl('config', urlParams);
  
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    return json.data;
    
  } catch (error) {
    console.log('error in _getConfigData: ' + error);
    reportErr('_getConfigData', error);
  }
}

//--------------------------------------------------------------
// use GitHub Developer Markdown API
//--------------------------------------------------------------
function _convertMarkdownToHTML(data, notice, callback, elemToSet) {
  if (true) {  // alternative until I figure out rate limiting from GitHub
    callback(_alternativeConvertMarkdownToHTML(data), elemToSet);
  }
  /*
	var postData = {
    "text": data,
    "mode": "markdown"
	};
  
  var url = 'https://api.github.com/markdown/raw';
	
	fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: data,
      mode: 'cors'
		})
    .then( (results) => results.text() )
		.then( (textdata) => callback(textdata, elemToSet) )

		.catch((error) => {
			notice('Unexpected error using markdown API');
			console.log(error);
		})
    */
}
