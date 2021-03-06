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
  var config = {};  // loaded via Google web API using apiInfo
  
	const page = {};
  
  const AUDIO_MIMETYPE = 'audio/webm';
  const AUDIO_FILETYPE_EXTENSION_FIREFOX = '.ogg';
  const AUDIO_FILETYPE_EXTENSION_CHROME = '.webm';
  
  const NO_VALUE = '[none]';

  const RECORD_SYMBOL = '⏺️';  
  const PLAY_SYMBOL = '▶️';
  const PAUSE_SYMBOL = '⏸️';
  const STOP_SYMBOL = '⏹️';
  const TRASH_SYMBOL = '🗑️';
  const DOWNLOAD_SYMBOL = '⬇️';
	
	const settings = {
    sourcefileid: null,
    streamavailable: false,
    mediarecorder: [],
    audiochunks: [],
    mp3blobs: [],
    recordcontrols: [],
    audiocontrols: [],
    playcontrols: [],
    audiopromptcontrols: [],
    audiopromptplaycontrols: [],
    deletecontrols: [],
    recordbuttonstyling: {
      'start': {buttontext: RECORD_SYMBOL, buttonclass: 'start-recording', hovertext: 'start recording'},
      'stop': {buttontext: STOP_SYMBOL, buttonclass: 'stop-recording', hovertext: 'stop recording'},
      'redo': {buttontext: RECORD_SYMBOL, buttonclass: 'redo-recording', hovertext: 'redo recording'}
    },
    playbuttonstyling: {
      'play': {buttontext: PLAY_SYMBOL, buttonclass: 'play-audio', hovertext: 'play recording'},
      'pause': {buttontext: PAUSE_SYMBOL, buttonclass: 'pause-audio', hovertext: 'pause recording'}
    },
    recordinginprogress: -1
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (navmode) {
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('arp-colorscheme');
    _renderStandardElements();

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
        config = requestResult.data;
        await _configureAudio();
        _renderPage();
        _postHeightChangeMessage();
      } 
		}
	}
  
  function _renderStandardElements() {
    page.notice = new StandardNotice(page.body, page.body);
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
  function _renderPage() {
    if (settings.streamavailable) {
      page.notice.setNotice('');

      page.contents = CreateElement.createDiv(null, 'contents');
      page.body.appendChild(page.contents);
      
      page.contents.appendChild(_renderTitle(config.title));
      page.contents.appendChild(_renderInstructions(config.instructions));
      page.contents.appendChild(_renderItems(config.items));  
      page.contents.appendChild(_createPackageControl());      
    }
  }
  
  function _renderTitle(title) {
    var container = CreateElement.createDiv(null, 'arp-title', title);
    return container;
  }

  function _renderInstructions(instructions) {
    var container = CreateElement.createDiv(null, 'arp-instructions', MarkdownToHTML.convert(instructions));
    return container;
  }

  function _renderItems(items) {
    var container = CreateElement.createDiv(null, null);
    
    for (var i = 0; i < items.length; i++) {
      container.appendChild(_renderItem(i, items[i]))
    }
    
    return container;
  }
  
  function _renderItem(index, item) {
    var container = CreateElement.createDiv(null, 'item-container');
    
    container.appendChild(_renderPrompt(index, item));
    container.appendChild(_renderResponse(index, item));
    
    return container;
  }
  
  function _renderPrompt(index, item) {  
    var elemAudioPrompt = null;
    var elemAudioPromptPlay = null;
    
    var container = CreateElement.createDiv(null, 'item-prompt');
    
    if (item.audioprompt != NO_VALUE && item.audioprompt != null && item.audioprompt != '') {
      var elemAudio = document.createElement('audio');
      elemAudio.id = _numberElementId('promptAudio', index);
      elemAudio.classList.add('audioprompt-control');
      elemAudio.innerHTML = 'HTML 5 audio control not supported by this browser';
      elemAudio.src = item.audioprompt;
      elemAudio.style.display = 'none';
      elemAudio.onended = e => _audioPromptEndedHandler(e.target);
      container.appendChild(elemAudio);

      playbutton = CreateElement.createButton(_numberElementId('btnPlayPrompt', index), 'playprompt-control', null, null, e => _playPromptButtonHandler(e.target));
      container.appendChild(playbutton);
      _setPromptPlayButtonStyling(playbutton, 'play');
     
      settings.audiopromptcontrols.push(elemAudio);
      settings.audiopromptplaycontrols.push(playbutton);
    }
    
    if (item.textprompt != NO_VALUE && item.textprompt != null && item.textprompt != '') {
      var textPrompt = CreateElement.createSpan(null, null, MarkdownToHTML.convert(item.textprompt));
      container.appendChild(textPrompt);
    }

    return container;
  }
  
  function _renderResponse(index, item) {
    var container = CreateElement.createDiv(null, 'item-response');
    
    var recordbutton = CreateElement.createButton(_numberElementId('btnRecording', index), 'record-control', null, null, e => _recordButtonHandler(e.target));
    container.appendChild(recordbutton);
    settings.recordcontrols.push(recordbutton);
    _setRecordButtonStyling(recordbutton, 'start');
    
    var elemAudio = document.createElement('audio');
    container.appendChild(elemAudio);
    elemAudio.id = _numberElementId('recordedAudio', index);
    elemAudio.classList.add('audio-control');
    elemAudio.innerHTML = 'HTML 5 audio control not supported by this browser';
    elemAudio.style.display = 'none';
    elemAudio.onended = e => _audioEndedHandler(e.target);
    settings.audiocontrols.push(elemAudio);

    var playbutton = CreateElement.createButton(_numberElementId('btnPlay', index), 'play-control', null, null, e => _playButtonHandler(e.target));
    container.appendChild(playbutton);
    settings.playcontrols.push(playbutton);
    
    var deletebutton = CreateElement.createButton(_numberElementId('btnDelete', index), 'delete-control', TRASH_SYMBOL, 'delete recording', e => _deleteButtonHandler(e.target));
    container.appendChild(deletebutton);
    settings.deletecontrols.push(deletebutton);
    
    _setPlayButtonStyling(playbutton, 'play');

    return container;
  }
  
  function _createPackageControl() {
    //var elemContainer = document.createElement('div');
    var container = CreateElement.createDiv(null, null);
    
    var buttontitle = 'download recordings in a ZIP file - only available once all recordings are completed';
    var packagebutton = CreateElement.createButton(null, 'package-control', DOWNLOAD_SYMBOL, buttontitle, e => _packageButtonHandler(e.target));
    container.appendChild(packagebutton)
    page.packagebutton = packagebutton;

    var downloadlink = CreateElement.createLink(null, null);
    container.appendChild(downloadlink);
    downloadlink.download = config.downloadfilename + ".zip";
    downloadlink.innerHTML = 'for downloading';
    downloadlink.href = ''; // intentionally blank
    downloadlink.style.display = 'none';    
    page.downloadelement = downloadlink;
  
   return container;
  }

	//-----------------------------------------------------------------------------
	// control styling, visibility, and enabling
	//-----------------------------------------------------------------------------  
  function _setRecordButtonStyling(elemTarget, stageName) {
    var recordButtons = settings.recordcontrols;
    for (var i = 0; i < recordButtons.length; i++) {
      var elemButton = recordButtons[i];
      var elemNumber = _getElementNumber(elemButton);
      if( settings.recordinginprogress >= 0) {
        elemButton.disabled = (elemNumber != settings.recordinginprogress);
      } else {
        elemButton.disabled = false;
      }
    }
    
    var buttonText = settings.recordbuttonstyling[stageName].buttontext;
    var buttonClass = settings.recordbuttonstyling[stageName].buttonclass;
    var buttonHoverText = settings.recordbuttonstyling[stageName].hovertext;
    
    for (var prop in settings.recordbuttonstyling) {
      var className = settings.recordbuttonstyling[prop].buttonclass;
      if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
    }
    elemTarget.innerHTML = buttonText;
    elemTarget.classList.add(buttonClass);
    elemTarget.title = buttonHoverText;
  }
    
  function _setPlayButtonStyling(elemTarget, stageName) {
    var playButtons = settings.playcontrols;
    var deleteButtons = settings.deletecontrols;

    for (var i = 0; i < playButtons.length; i++) {
      var elemButton = playButtons[i];
      var elemDeleteButton = deleteButtons[i];

      if (settings.mp3blobs[i] == null) {
        elemButton.style.display = 'none';
        elemDeleteButton.style.display = 'none';
      } else {
        elemButton.style.display = 'inline-block';
        elemDeleteButton.style.display = 'inline-block';
      }
    }
    
    var buttonText = settings.playbuttonstyling[stageName].buttontext;
    var buttonClass = settings.playbuttonstyling[stageName].buttonclass;
    var buttonHoverText = settings.playbuttonstyling[stageName].hovertext;
    
    for (var prop in settings.playbuttonstyling) {
      var className = settings.playbuttonstyling[prop].buttonclass;
      if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
    }
    elemTarget.innerHTML = buttonText;
    elemTarget.classList.add(buttonClass);
    elemTarget.title = buttonHoverText;
  }
  
  function _setPromptPlayButtonStyling(elemTarget, stageName) {
    var buttonText = settings.playbuttonstyling[stageName].buttontext;
    var buttonClass = settings.playbuttonstyling[stageName].buttonclass;
    var buttonHoverText = settings.playbuttonstyling[stageName].hovertext;
    
    for (var prop in settings.playbuttonstyling) {
      var className = settings.playbuttonstyling[prop].buttonclass;
      if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
    }
    elemTarget.innerHTML = buttonText;
    elemTarget.classList.add(buttonClass);
    elemTarget.title = buttonHoverText;
  }
  
  function _enablePlayButtons(enable) {
    for (var i = 0; i < settings.playcontrols.length; i++) {
      settings.playcontrols[i].disabled = !enable;
    }
  }

  function _setPackageButtonEnable() {
    var enable = (settings.recordinginprogress < 0);
    
    for (var i = 0; i < settings.mp3blobs.length && enable; i++) {
      enable = (settings.mp3blobs[i] != null);
    }
    page.packagebutton.disabled = !enable;
  }

	//-----------------------------------------------------------------------------
	// audio setup and management
	//-----------------------------------------------------------------------------  
  async function _configureAudio() {    
    try {
      var stream = await navigator.mediaDevices.getUserMedia({audio:true});
      await _configureAudioControls(stream);

    } catch (error) {
      settings.streamavailable = false;
      page.notice.reportError('_configureAudio', error);
    }
  }
  
  function _configureAudioControls(stream) {
    settings.streamavailable = true;
    
    for (var i = 0; i < config.items.length; i++) {
      var thisRecorder = new MediaRecorder(stream, {mimeType: AUDIO_MIMETYPE});
      var thisChunks = [];
      settings.mediarecorder.push(thisRecorder);
      settings.audiochunks.push(thisChunks);
      settings.mp3blobs.push(null);
      thisRecorder.ondataavailable = (function(e) {
        var j = i;
        return function(e) {_finishRecording(e, j);}
      })();
    }
  }
  
  function _startRecording(elemTarget) {
    try {
      var elemNumber = _getElementNumber(elemTarget);
      settings.recordinginprogress = elemNumber;
      _setRecordButtonStyling(elemTarget, 'stop')
      _enablePlayButtons(false);
      _setPackageButtonEnable();
      settings.audiochunks[elemNumber] = [];
      settings.mediarecorder[elemNumber].start();
      
    } catch(err) {
      _reportError('_startRecording', err);
    }  
  }

  function _stopRecording(elemTarget) {
    try {
      var elemNumber = _getElementNumber(elemTarget);
      settings.recordinginprogress = -1;
      _setRecordButtonStyling(elemTarget, 'redo')
      settings.mediarecorder[elemNumber].stop();

    } catch(err) {
      _reportError('_stopRecording', err);
    }
  }

  function _redoRecording(elemTarget) {
    var prompt = 'There is already a recording for this item.\nClick "OK" if you would like to make a new one';
    if (confirm(prompt)) _startRecording(elemTarget);
  }

  function _deleteRecordingOnConfirm(elemTarget) {
    var prompt = 'Are you sure you want to delete this recording?\nClick "OK" to confirm the deletion';
    if (confirm(prompt)) {
      var elemNumber = _getElementNumber(elemTarget);
      settings.mp3blobs[elemNumber] = null;
      _setRecordButtonStyling(settings.recordcontrols[elemNumber], 'start');
      _setPlayButtonStyling(settings.playcontrols[elemNumber], 'play');
      _setPackageButtonEnable();
    }
  }
  
  function _finishRecording(e, index) {
    try {
      var elemAudio = document.getElementById(_numberElementId('recordedAudio', index));
      var thisRecorder = settings.mediarecorder[index];
      var thisChunks = settings.audiochunks[index];
      thisChunks.push(e.data);

      if (thisRecorder.state == "inactive"){
        let blob = new Blob(thisChunks, {type: AUDIO_MIMETYPE} );
        elemAudio.src = URL.createObjectURL(blob);
        elemAudio.controls=true;
        elemAudio.autoplay=false;
        settings.mp3blobs[index] = blob;
        _setPackageButtonEnable();
        _enablePlayButtons(true);
        _setPlayButtonStyling(settings.playcontrols[index], 'play');
      }
    } catch(err) {
      _reportError('_finishRecording', err);
    }
  }

  function _playPromptRecording(elemTarget) {  
    var elemNumber = _getElementNumber(elemTarget);
    var elemAudio = settings.audiopromptcontrols[elemNumber];

    var stage, nextStage;
    if (elemTarget.classList.contains(settings.playbuttonstyling.play.buttonclass)) {
      stage = 'play';
      nextStage = 'pause';
    } else {
      stage = 'pause';
      nextStage = 'play';
    }

    if (stage == 'play') {
      elemAudio.play();
    } else {
      elemAudio.pause();
    }
 
     _setPromptPlayButtonStyling(elemTarget, nextStage);
  }
  
  function _audioPromptEnded(elemTarget) {
    var elemNumber = _getElementNumber(elemTarget);
    var elemPlayPromptButton = settings.audiopromptplaycontrols[elemNumber];
    _setPromptPlayButtonStyling(elemPlayPromptButton, 'play');    
  }

  function _playRecording(elemTarget) {  
    var elemNumber = _getElementNumber(elemTarget);
    var mp3blob = settings.mp3blobs[elemNumber];
    
    if (mp3blob != null) {
      var elemAudio = settings.audiocontrols[elemNumber];
      var stage, nextStage;
      if (elemTarget.classList.contains(settings.playbuttonstyling.play.buttonclass)) {
        stage = 'play';
        nextStage = 'pause';
      } else {
        stage = 'pause';
        nextStage = 'play';
      }

      if (stage == 'play') {
        elemAudio.play();
      } else {
        elemAudio.pause();
      }
      _setPlayButtonStyling(elemTarget, nextStage);
    }
  }
  
  function _audioEnded(elemTarget) {
    var elemNumber = _getElementNumber(elemTarget);
    var elemPlayButton = settings.playcontrols[elemNumber];
    _setPlayButtonStyling(elemPlayButton, 'play');    
  }
  
	//------------------------------------------------------------------
	// package and download recordings
	//------------------------------------------------------------------
  function _packageAudioRecordings() {
    var zip = new JSZip();
    var currDate = new Date();
    var dateWithOffset = new Date(currDate.getTime() - currDate.getTimezoneOffset() * 60000);
    
    zip.file('README.txt', config.readme + '\n', {date: dateWithOffset});  // text must end in \n
    
    for (var i = 0; i < settings.mp3blobs.length; i++) {
      var blob = settings.mp3blobs[i];

      var filename1 = _numberElementId('response', (i+1)) + AUDIO_FILETYPE_EXTENSION_CHROME; 
      var filename2 = _numberElementId('response', (i+1)) + AUDIO_FILETYPE_EXTENSION_FIREFOX; 

      zip.file(filename1, blob, {date: dateWithOffset});
      zip.file(filename2, blob, {date: dateWithOffset});
    }

    zip.generateAsync({type:"blob"})
    .then(function(content) { 
      page.downloadelement.href = URL.createObjectURL(content);
      page.downloadelement.click();
    });
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
  function _recordButtonHandler(elemTarget) {
    var classes = elemTarget.classList;
    
    if (classes.contains(settings.recordbuttonstyling['start'].buttonclass)) {
      _startRecording(elemTarget);
    } else if (classes.contains(settings.recordbuttonstyling['stop'].buttonclass)) {
      _stopRecording(elemTarget);
    } else if (classes.contains(settings.recordbuttonstyling['redo'].buttonclass)) {
      _redoRecording(elemTarget);
    }
  }    
  
  function _deleteButtonHandler(elemTarget) {
    _deleteRecordingOnConfirm(elemTarget);
  }
  
  function _packageButtonHandler(elemTarget) {
    _packageAudioRecordings();
  }
  
  function _playPromptButtonHandler(elemTarget) {
    _playPromptRecording(elemTarget);
  }
  
  function _audioPromptEndedHandler(elemTarget) {
    _audioPromptEnded(elemTarget);
  }

  function _playButtonHandler(elemTarget) {
    _playRecording(elemTarget);
  }
  
  function _audioEndedHandler(elemTarget) {
    _audioEnded(elemTarget);
  }
  
	//---------------------------------------
	// utility functions
	//----------------------------------------  
  function _getElementNumber(elem) {
    return parseInt(('000' + elem.id).slice(-3));
  }

  function _numberElementId(base, index) {
    return  base + ('000' + index).slice(-3);
  }

	//-----------------------------------------------------------------------------------
	// iframe responsive height - post message to parent (if in an iframe) to resizeBy
	//-----------------------------------------------------------------------------------
	function _postHeightChangeMessage() {
    var height = page.contents.scrollHeight + 10;
    var msg = height + '-' + 'AQRP' + '-' + settings.instance;
		console.log('posting to parent: ' + msg);
		window.parent.postMessage(msg, "*");
	}
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
