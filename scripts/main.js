//
// TODO:
//
const app = function () {
	const page = {};
	
	const settings = {
    streamavailable: false,
    mediarecorder: [],
    audiochunks: [],
    mp3blobs: [],
    recordbuttonstyling: {
      'start': {buttontext: 'record', buttonclass: 'start-recording'},
      'stop': {buttontext: 'stop', buttonclass: 'stop-recording'},
      'redo': {buttontext: 'redo', buttonclass: 'redo-recording'}
    }
  };
  
  const config = {  // this should be made from query params
    title: "Title of query/response package",
    readme: "This comment should describe the package",
    downloadfilename: "arp_package000",
    items: [
      { textprompt: "text prompt #1", audioprompt: null },
      { textprompt: "text prompt #2", audioprompt: null },
      { textprompt: "text prompt #3", audioprompt: null }
    ]
  }
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init (navmode) {
    page.header = document.getElementById('header');       
    page.notice = document.getElementById('notice');       
		page.body = document.getElementsByTagName('body')[0];
    page.contents = document.getElementById('contents');
		
		_setNotice('initializing...');
		if (!_initializeSettings()) {
			_setNotice('Failed to initialize - invalid parameters');
		
    } else {
			_setNotice('');
      _configureAudio();
		}
	}
	
	//-------------------------------------------------------------------------------------
	// query params:
	//-------------------------------------------------------------------------------------
	function _initializeSettings() {
		var result = true;

		return result;
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    if (settings.streamavailable) {
      page.contents.appendChild(_renderTitle(config.title));
      page.contents.appendChild(_renderItems(config.items));  
      page.contents.appendChild(_createPackageControl());
    }
  }
  
  function _renderTitle(title) {
    var elemContainer = document.createElement('div');
    elemContainer.classList.add('arp-title');
    elemContainer.innerHTML = title;
    
    return elemContainer;
  }

  function _renderItems(items) {
    var elemContainer = document.createElement('div');

    for (var i = 0; i < items.length; i++) {
        elemContainer.appendChild(_createItem(i, items[i]));
    }
    
    return elemContainer;
  }
  
  function _createItem(index, item) {
    var elemContainer = document.createElement('div');
    elemContainer.classList.add('response-container');
    
    var elemPrompt = document.createElement('div');
    elemPrompt.innerHTML = item.textprompt;
    elemContainer.appendChild(elemPrompt);
    
    var elemButton = document.createElement('button');
    elemButton.id = _numberElementId('btnRecording', index);
    elemButton.classList.add('record-control');
    _setRecordButtonStyling(elemButton, 'start');
    elemButton.onclick = e => _recordButtonHandler(e.target);
    elemContainer.appendChild(elemButton);
    
    var elemAudio = document.createElement('audio');
    elemAudio.id = _numberElementId('recordedAudio', index);
    elemAudio.classList.add('audio-control');
    elemAudio.innerHTML = 'HTML 5 audio control not supported by this browser';
    elemContainer.appendChild(elemAudio);
    
    return elemContainer;
  }
  
  function _createPackageControl() {
    var elemContainer = document.createElement('div');
    
    var elemButton = document.createElement('button');
    elemButton.class = 'package-control';
    elemButton.disabled = true;
    elemButton.innerHTML = 'package';
    elemButton.onclick = e => _packageButtonHandler(e.target);
    
    page.packagebutton = elemButton;
    elemContainer.appendChild(elemButton);
    
    return elemContainer;
  }

  function _setRecordButtonStyling(elemTarget, stageName) {
    var buttonText = settings.recordbuttonstyling[stageName].buttontext;
    var buttonClass = settings.recordbuttonstyling[stageName].buttonclass;
    
    for (var prop in settings.recordbuttonstyling) {
      var className = settings.recordbuttonstyling[prop].buttonclass;
      if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
    }
    elemTarget.innerHTML = buttonText;
    elemTarget.classList.add(buttonClass);
  }
    
  function _setPackageButtonEnable() {
    var enable = true;
    
    for (var i = 0; i < settings.mp3blobs.length && enable; i++) {
      enable = (settings.mp3blobs[i] != null);
    }
    page.packagebutton.disabled = !enable;
  }

	//-----------------------------------------------------------------------------
	// audio setup and management
	//-----------------------------------------------------------------------------  
  function _configureAudio() {
    navigator.mediaDevices.getUserMedia({audio:true})
    .then((stream) => _configureAudioControls(stream))
    .catch((err) => _audioConfigureError(err))
    .then(() =>  _renderPage());
  }
  
  function _configureAudioControls(stream) {
    settings.streamavailable = true;
    
    for (var i = 0; i < config.items.length; i++) {
      //var elemAudio = audioElements[i];
      var thisRecorder = new MediaRecorder(stream);
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
  
  function _audioConfigureError(err) {
    settings.streamavailable = false;
    _reportError('getUserMedia', err);
  }

  function _startRecording(elemTarget) {
    try {
      var elemNumber = _getElementNumber(elemTarget);
      _setRecordButtonStyling(elemTarget, 'stop')
      settings.audiochunks[elemNumber] = [];
      settings.mediarecorder[elemNumber].start();
      
    } catch(err) {
      _reportError('_startRecording', err);
    }  
  }

  function _stopRecording(elemTarget) {
    try {
      var elemNumber = _getElementNumber(elemTarget);
      _setRecordButtonStyling(elemTarget, 'redo')
      settings.mediarecorder[elemNumber].stop();

    } catch(err) {
      _reportError('_stopRecording', err);
    }
  }

  function _redoRecording(elemTarget) {
    var prompt = 'There is already a recording for this item.  \nClick "OK" if you would like to make a new one';
    if (confirm(prompt)) _startRecording(elemTarget);
  }

  function _finishRecording(e, index) {
    try {
      var elemAudio = document.getElementById(_numberElementId('recordedAudio', index));
      var thisRecorder = settings.mediarecorder[index];
      var thisChunks = settings.audiochunks[index];
      thisChunks.push(e.data);

      if (thisRecorder.state == "inactive"){
        let blob = new Blob(thisChunks,{type:'audio/mpeg-3'});
        elemAudio.src = URL.createObjectURL(blob);
        elemAudio.controls=true;
        elemAudio.autoplay=false;
        settings.mp3blobs[index] = blob;
        _setPackageButtonEnable();
      }
    } catch(err) {
      _reportError('_finishRecording', err);
    }
  }
  
  function _packageAudioRecordings() {
    var zip = new JSZip();
    
    zip.file('README.txt', config.readme + '\n');  // text must end in \n
    
    for (var i = 0; i < settings.mp3blobs.length; i++) {
      var blob = settings.mp3blobs[i];
      var blobname = _numberElementId('response', (i+1)) + '.mp3';
      zip.file(blobname, blob);
    }

    zip.generateAsync({type:"blob"})
    .then(function(content) {
      saveAs(content, config.downloadfilename + ".zip");
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
  
  function _packageButtonHandler(elemTarget) {
    _packageAudioRecordings();
  }

	//---------------------------------------
	// utility functions
	//----------------------------------------
	function _setNotice (label) {
		page.notice.innerHTML = label;

		if (label == '') {
			page.notice.style.display = 'none'; 
			page.notice.style.visibility = 'hidden';
		} else {
			page.notice.style.display = 'block';
			page.notice.style.visibility = 'visible';
		}
	}
  
  function _reportError(src, err) {
    _setNotice('Error in ' + src + ': ' + err.name + ' "' + err.message + '"');
  }

  function _getElementNumber(elem) {
    return parseInt(('000' + elem.id).slice(-3));
  }

  function _numberElementId(base, index) {
    return  base + ('000' + index).slice(-3);
  }

	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
