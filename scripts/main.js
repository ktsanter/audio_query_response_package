//
// TODO:
//
const app = function () {
	const page = {};
	
	const settings = {
    streamavailable: false,
    mediarecorder: [],
    audiochunks: [],
    recordbuttonstyling: {
      'start': {buttontext: 'record', buttonclass: 'start-recording'},
      'stop': {buttontext: 'stop', buttonclass: 'stop-recording'},
      'redo': {buttontext: 'redo', buttonclass: 'redo-recording'}
    }
  };
  
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
    _enableRecordButtons(settings.streamavailable);
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
  
  function _enableRecordButtons(enable) {
    var recordingButtons = document.getElementsByClassName('record-control');
    for (var i = 0; i < recordingButtons.length; i++) {
      recordingButtons[i].disabled = !enable;
    }
  }

	//-----------------------------------------------------------------------------
	// audio setup and management
	//-----------------------------------------------------------------------------  
  function _configureAudio() {
    var recordingButtons = document.getElementsByClassName('record-control');
    for (var i = 0; i < recordingButtons.length; i++) {
      recordingButtons[i].onclick = e => _recordButtonHandler(e.target);
    }

    navigator.mediaDevices.getUserMedia({audio:true})
    .then((stream) => _configureAudioControls(stream))
    .catch((err) => _audioConfigureError(err))
    .then(() =>  _renderPage());
  }
  
  function _configureAudioControls(stream) {
    settings.streamavailable = true;
    var audioElements = document.getElementsByClassName('audio-control');
    for (var i = 0; i < audioElements.length; i++) {
      var elemAudio = audioElements[i];
      var thisRecorder = new MediaRecorder(stream);
      var thisChunks = [];
      settings.mediarecorder.push(thisRecorder);
      settings.audiochunks.push(thisChunks);
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
        sendData(blob)
      }
    } catch(err) {
      _reportError('_finishRecording', err);
    }
  }

  function sendData(data) {
    console.log('implement sendData');
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
