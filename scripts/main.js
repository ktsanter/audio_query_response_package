//-------------------------------------------------------------------
// audio query/response package toolbar
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------

const app = function () {
  const apiInfo = {
    apibase: 'https://script.google.com/macros/s/AKfycbxV2GBJNOReNqHyaVSOgwPkANsjM3H8ZqdnJKNx0OZhCGraj5rO/exec',
    apikey: 'MVaudioqueryresponseAPI'
  };
  
  const baseURLforPacingInfo = 'https://ktsanter.github.io/audio_query_response_package/index.html';

	const page = {};
	const settings = {};
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (navmode) {
		page.body = document.getElementsByTagName('body')[0];
    
    page.notice = new StandardNotice(page.body, page.body);

    var expectedQueryParams = [
      {key: 'sourcefilelink', required: true},
      {key: 'instance', required: true}
    ];
        
    if (_initializeSettings(expectedQueryParams)) {
			page.notice.setNotice('loading configuration data...', true);
      
      var splitId = settings.sourcefilelink.match(/\?id=([a-zA-Z0-9-_]+)/);
      if (splitId == null) {
        settings.sourcefileid = '';
      } else {
        settings.sourcefileid = splitId[0].slice(4);
      }
      
      var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'config', {sourcefileid: settings.sourcefileid}, page.notice);
      if (requestResult.success) {
        page.notice.setNotice('');
        var config = requestResult.data;
        config.openInFullWindowCallback = _fullWindowCallback;
        _renderPage(config);
      } 
		}
	}
	
	//-------------------------------------------------------------------------------------
	// process query params
	//-------------------------------------------------------------------------------------
	function _initializeSettings(expectedParams) {
    var result = false;

    var urlParams = new URLSearchParams(window.location.search);
    for (var i = 0; i < expectedParams.length; i++) {
      var key = expectedParams[i].key;
      settings[key] = urlParams.has(key) ? urlParams.get(key) : null;
    }

    var receivedRequiredParams = true;
    for (var i = 0; i < expectedParams.length && receivedRequiredParams; i++) {
      var key = expectedParams[i].key;
      if (expectedParams[i].required) receivedRequiredParams = (settings[key] != null);
    }
    
    if (receivedRequiredParams) {
			result = true;

    } else {   
      page.notice.setNotice('failed to initialize: invalid parameters');
    }
    
    return result;
  }  
  	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async function _renderPage(config) {
    page.aqrp = new AudioQueryResponsePackage(config);
    
    page.body.append(await page.aqrp.render());
  }
  
  function _fullWindowCallback() {
    var url = _makeURL();
    window.open(url, '_blank');
  }
  
  function _makeURL() {
    var slideslink = settings.sourcefilelink;
    var instance = settings.instance;
    
    var url = baseURLforPacingInfo;
    url += '?instance=' + instance;
    url += '&sourcefilelink=' + slideslink;

    return url;
  }

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
