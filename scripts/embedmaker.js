"use strict";
//-----------------------------------------------------------------------------------
// embed and link maker for AQRP
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

const app = function () {
  const appversion = '0.02';
  const appname = 'Audio query/response package embed maker';
	const page = {};
  const settings = {};
  
  const apiInfo = {
    apibase: 'https://script.google.com/macros/s/AKfycbxV2GBJNOReNqHyaVSOgwPkANsjM3H8ZqdnJKNx0OZhCGraj5rO/exec',
    apikey: 'MVaudioqueryresponseAPI'
  };  

  const baseURLforPacingInfo = 'https://ktsanter.github.io/audio_query_response_package/index.html';
  const resizerScript = 'https://drive.google.com/uc?id=19LNI5DrG4AMINqJ4y-o4-RUArm4jJDrL';

	//---------------------------------------
	// get things going
	//----------------------------------------
  async function init() {
    
		page.body = document.getElementsByTagName('body')[0];

    _renderPage();
  }
    
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    page.container = CreateElement.createDiv('mainContainer', null);
    page.body.appendChild(page.container);
    
    var title = _renderTitle();
    page.container.appendChild(title);
    
    page.notice = new StandardNotice(page.body, title);
    page.notice.setNotice('');

    var container = CreateElement.createDiv('contentsContainer', null);
    page.container.appendChild(container);
    
    container.appendChild(_renderControls());
    container.appendChild(_renderPreviewSection());
  }
  
  function _renderTitle() {
    var title = CreateElement.createDiv(null, 'standard-title', appname);
    
    title.appendChild(CreateElement.createIcon('iconLink', 'fas fa-link', 'copy link to clipboard', _handleLinkClick));
    
    var controlcontainer = CreateElement.createSpan('title-controls', null);
    title.appendChild(controlcontainer);
    controlcontainer.title = 'copy embed code to clipboard';
    controlcontainer.addEventListener('click', _handleEmbedClick, false);
    controlcontainer.appendChild(CreateElement.createIcon('iconEmbedLeft', 'fas fa-angle-left', 'copy embed code to clipboard', _handleEmbedClick));
    controlcontainer.appendChild(CreateElement.createIcon('iconEmbedRight', 'fas fa-angle-right', 'copy embed code to clipboard', _handleEmbedClick));
    
    title.appendChild(CreateElement.createDiv('appVersion', null, 'v' + appversion));
    
    return title;
  }
  
  function _renderControls() {
    var container = CreateElement.createDiv(null, 'standard-section');
    
    var contents = CreateElement.createDiv(null, 'standard-section-contents');
    container.appendChild(contents);
    
    contents.appendChild(_createSlidesLinkSpecify());
    contents.appendChild(_createWidthSelect());
    contents.appendChild(_createInstanceSelect());
    
    return container;
  }
    
  function _createSlidesLinkSpecify() {
    var container = CreateElement.createDiv(null, 'control-container');
    
    container.appendChild(CreateElement.createDiv(null, 'control-label', 'slides link'));
    var textinput = CreateElement.createTextInput('inputSlidesLink', null);
    container.appendChild(textinput);
    textinput.size = 80;
    textinput.addEventListener('click', _handleGeneric, false);
    textinput.title = 'shared link to the Google Sheet with the configuration information';
    textinput.addEventListener('input', _handleSlidesLinkChange, false);
    
    container.appendChild(CreateElement.createButton(null, null, 'preview', null, _handlePreviewClick));
    
    return container;
  }
  
  function _createWidthSelect() {
    var container = CreateElement.createDiv(null, 'control-container');
    
    container.appendChild(CreateElement.createDiv(null, 'control-label', 'width %'));
    var spininput = CreateElement.createSpinner('inputWidth', null, 60, 30, 100, 5)
    container.appendChild(spininput);
    spininput.addEventListener('click', _handleWidthSelectChange, false);
    
    return container;
  }
  
  function _createInstanceSelect() {
    var container = CreateElement.createDiv(null, 'control-container');
    
    container.appendChild(CreateElement.createDiv(null, 'control-label', 'instance'));
    var spininput = CreateElement.createSpinner('inputInstance', null, 1, 1, 20, 1)
    container.appendChild(spininput);
    spininput.addEventListener('click', _handleGeneric, false);
    spininput.title = 'the instance number must be unique for every dialog on a page';
    
    return container;
  }
  
  function _renderPreviewSection() {
    var container = CreateElement.createDiv('previewContainer', null, 'preview');
    
    return container;
  }
  
  async function _previewPackage() {
    var success = false;
    
    var slideslink = document.getElementById('inputSlidesLink').value;
    var widthpercent = document.getElementById('inputWidth').value;
    var container = document.getElementById('previewContainer');

    _clearPreview();
    
    page.notice.setNotice('loading preview...', true);
    page.notice.hideError();
    var slidesid = _getIdFromLink(slideslink);
    try {
      var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'config', {sourcefileid: slidesid}, page.notice);
      if (requestResult.success) {
        page.notice.setNotice('');
        var innerContainer = CreateElement.createDiv('innerPreviewContainer', null);
        container.appendChild(innerContainer);
        
        var aqrp = new AudioQueryResponsePackage(requestResult.data);
        innerContainer.appendChild(await aqrp.render());
        innerContainer.style.width = widthpercent + '%';
        
        container.style.display = 'block';
        success = true;

      } else {
        page.notice.hideError();
        page.notice.setNotice('failed to load preview');
      }
    } catch (err) {
      page.notice.hideError();
      page.notice.setNotice('failed to load preview');
      console.log(err);
    }
    _setCopyControls();
    
    return success;
  }
  
  function _clearPreview() {
    var container = document.getElementById('previewContainer');

    container.style.display = 'none';
    while (container.firstChild) container.removeChild(container.firstChild);

    _setCopyControls();
  }
  
  function _previewShowing() {
    return document.getElementById('previewContainer').firstChild != null;
  }
  
  function _setCopyControls() {
    var display = 'none';
    if (_previewShowing()) display = 'inline-block';
    
    document.getElementById('iconLink').style.display = display;
    document.getElementById('iconEmbedLeft').style.display = display;
    document.getElementById('iconEmbedRight').style.display = display;
  }
              
	//------------------------------------------------------------------
	// data processing
	//------------------------------------------------------------------      
  function _makeAndCopyLink() {
    _copyToClipboard(_makeURL());
    page.notice.setNotice('copied link');
  }
  
  function _makeAndCopyEmbed() {
    var instance = document.getElementById('inputInstance').value;
    var container = document.getElementById('innerPreviewContainer');
    var width = document.getElementById('inputWidth').value;

    var embedCode = '';
    embedCode += '<p>';
    embedCode += '<iframe id="iframe-aqrp' + instance + '"';
    embedCode += ' width="' + width + '%"';
    embedCode += ' height="' + (container.scrollHeight + 40) + '"';
    embedCode += ' src="' + _makeURL() + '"';
    embedCode += ' allowfullscreen';
    embedCode += ' allow="microphone"';
    embedCode += '>';
    embedCode += '</iframe>';
    embedCode += '</p>';
    
    _copyToClipboard(embedCode);
    page.notice.setNotice('copied embed code');
  }
  
  function _makeURL() {
    var slideslink = document.getElementById('inputSlidesLink').value;
    var instance = document.getElementById('inputInstance').value;
    
    var url = baseURLforPacingInfo;
    url += '?instance=' + instance;
    url += '&sourcefilelink=' + slideslink;
    
    return url;
  }
  
  function _getIdFromLink(strLink) {
    var id = '';
    
    var splitId = strLink.match(/\?id=([a-zA-Z0-9-_]+)/);
    if (splitId != null) {
      id = splitId[0].slice(4);
    }
    
    return id;
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	
  
	//---------------------------------------
	// handlers
	//----------------------------------------
  function _handleGeneric() {
    page.notice.setNotice('');
  }
  
  function _handleSlidesLinkChange(e) {
    _clearPreview();
  }
  
  function _handleWidthSelectChange() {
    if (_previewShowing()) {
      var width = document.getElementById('inputWidth').value;
      document.getElementById('innerPreviewContainer').style.width = width + '%';
    }
  }
  
  function _handleLinkClick() {
    _makeAndCopyLink();
  }
  
  function _handleEmbedClick() {
    _makeAndCopyEmbed();
  }
  
  function _handlePreviewClick() {
    _previewPackage();
  }
  
	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
