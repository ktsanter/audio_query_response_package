"use strict";
//-----------------------------------------------------------------------------------
// embed and link maker for AQRP
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

const app = function () {
  const appversion = '0.01';
  const appname = 'Audio query/response package embed maker';
	const page = {};
  const settings = {};

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
  }
  
  function _renderTitle() {
    var title = CreateElement.createDiv(null, 'standard-title', appname);
    
    title.appendChild(CreateElement.createIcon('iconLink', 'fas fa-link', 'copy link to clipboard', _handleLinkClick));
    title.appendChild(CreateElement.createIcon('iconEmbedLeft', 'fas fa-angle-left', 'copy embed code to clipboard', _handleEmbedClick));
    title.appendChild(CreateElement.createIcon('iconEmbedRight', 'fas fa-angle-right', 'copy embed code to clipboard', _handleEmbedClick));
    title.appendChild(CreateElement.createDiv('appVersion', null, 'v' + appversion));
    
    return title;
  }
  
  function _renderControls() {
    var container = CreateElement.createDiv(null, 'standard-section');
    
    var contents = CreateElement.createDiv(null, 'standard-section-contents');
    container.appendChild(contents);
    
    contents.appendChild(_createSlidesLinkSpecify());
    contents.appendChild(_createInstanceSelect());
    
    return container;
  }
    
  function _createSlidesLinkSpecify() {
    var container = CreateElement.createDiv(null, 'control-container');
    
    container.appendChild(CreateElement.createDiv(null, 'control-label', 'slides link'));
    var textinput = CreateElement.createTextInput('inputSlidesLink', null);
    container.appendChild(textinput);
    textinput.size = 120;
    textinput.addEventListener('click', _handleGeneric, false);
    textinput.title = 'shared link to the Google Sheet with the configuration information';
    
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
              
	//------------------------------------------------------------------
	// data processing
	//------------------------------------------------------------------      
  function _makeAndCopyLink() {
    _copyToClipboard(_makeURL());
    page.notice.setNotice('copied link');
  }
  
  function _makeAndCopyEmbed() {
    var instance = document.getElementById('inputInstance').value;

    var embedCode = '<p>';
    embedCode += '<script type="text/javascript" src="' + resizerScript + '"></script>';
    embedCode += '</p>';
    
    embedCode += '<p>';
    embedCode += '<iframe id="iframe-aqrp' + instance + '"';
    embedCode += ' width="60%"';
    embedCode += ' height="200"';
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
  
  function _handleLinkClick() {
    _makeAndCopyLink();
  }
  
  function _handleEmbedClick() {
    _makeAndCopyEmbed();
  }
  
	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
