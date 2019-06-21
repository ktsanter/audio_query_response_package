//-------------------------------------------------------------------
// audio query/response package tool
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------

class AudioQueryResponsePackage {
  constructor (config) {
    this._config = config;
    
    this._maincontainer = {};
    
    this._AUDIO_MIMETYPE = 'audio/webm';
    this._AUDIO_FILETYPE_EXTENSION_FIREFOX = '.ogg';
    this._AUDIO_FILETYPE_EXTENSION_CHROME = '.webm';
    
    this._NO_VALUE = '[none]';

    this._RECORD_SYMBOL = '⏺️';  
    this._PLAY_SYMBOL = '▶️';
    this._PAUSE_SYMBOL = '⏸️';
    this._STOP_SYMBOL = '⏹️';
    this._TRASH_SYMBOL = '🗑️';
    this._DOWNLOAD_SYMBOL = '⬇️';
    
    this._settings = {
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
        'start': {buttontext: this._RECORD_SYMBOL, buttonclass: 'start-recording', hovertext: 'start recording'},
        'stop': {buttontext: this._STOP_SYMBOL, buttonclass: 'stop-recording', hovertext: 'stop recording'},
        'redo': {buttontext: this._RECORD_SYMBOL, buttonclass: 'redo-recording', hovertext: 'redo recording'}
      },
      playbuttonstyling: {
        'play': {buttontext: this._PLAY_SYMBOL, buttonclass: 'play-audio', hovertext: 'play recording'},
        'pause': {buttontext: this._PAUSE_SYMBOL, buttonclass: 'pause-audio', hovertext: 'pause recording'}
      },
      recordinginprogress: -1
    };
  }  
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async render() {
    this._contents = CreateElement.createDiv(null, 'contents');
    
    this._notice = new StandardNotice(this._contents, this._contents);
    this._notice.setNotice('');
    
    await this._configureAudio();
    this._renderContents(this._contents);
    
    return this._contents;
  }  

  _renderContents(attachTo) {
    if (this._settings.streamavailable) {      
      attachTo.appendChild(this._renderTitle(this._config.title));
      attachTo.appendChild(this._renderInstructions(this._config.instructions));
      attachTo.appendChild(this._renderItems(this._config.items));  
      attachTo.appendChild(this._createPackageControl());      
    }
  }
  
  _renderTitle(title) {
    var container = CreateElement.createDiv(null, 'arp-title', title);
    return container;
  }

  _renderInstructions(instructions) {
    var container = CreateElement.createDiv(null, 'arp-instructions', MarkdownToHTML.convert(instructions));
    return container;
  }

  _renderItems(items) {
    var container = CreateElement.createDiv(null, null);
    
    for (var i = 0; i < items.length; i++) {
      container.appendChild(this._renderItem(i, items[i]))
    }
    
    return container;
  }
  
  _renderItem(index, item) {
    var container = CreateElement.createDiv(null, 'item-container');
    
    container.appendChild(this._renderPrompt(index, item));
    container.appendChild(this._renderResponse(index, item));
    
    return container;
  }
  
  _renderPrompt(index, item) {  
    var elemAudioPrompt = null;
    var elemAudioPromptPlay = null;
    
    var container = CreateElement.createDiv(null, 'item-prompt');
    
    if (item.audioprompt != this._NO_VALUE && item.audioprompt != null && item.audioprompt != '') {
      var elemAudio = document.createElement('audio');
      elemAudio.id = this._numberElementId('promptAudio', index);
      elemAudio.classList.add('audioprompt-control');
      elemAudio.innerHTML = 'HTML 5 audio control not supported by this browser';
      elemAudio.src = item.audioprompt;
      elemAudio.style.display = 'none';
      elemAudio.onended = e => this._audioPromptEndedHandler(e.target);
      container.appendChild(elemAudio);

     var playbutton = CreateElement.createButton(this._numberElementId('btnPlayPrompt', index), 'playprompt-control', null, null, e => this._playPromptButtonHandler(e.target));
      container.appendChild(playbutton);
      this._setPromptPlayButtonStyling(playbutton, 'play');
     
      this._settings.audiopromptcontrols.push(elemAudio);
      this._settings.audiopromptplaycontrols.push(playbutton);
    }
    
    if (item.textprompt != this._NO_VALUE && item.textprompt != null && item.textprompt != '') {
      var textPrompt = CreateElement.createSpan(null, null, MarkdownToHTML.convert(item.textprompt));
      container.appendChild(textPrompt);
    }

    return container;
  }
  
  _renderResponse(index, item) {
    var container = CreateElement.createDiv(null, 'item-response');
    
    var recordbutton = CreateElement.createButton(this._numberElementId('btnRecording', index), 'record-control', null, null, e => this._recordButtonHandler(e.target));
    container.appendChild(recordbutton);
    this._settings.recordcontrols.push(recordbutton);
    this._setRecordButtonStyling(recordbutton, 'start');
    
    var elemAudio = document.createElement('audio');
    container.appendChild(elemAudio);
    elemAudio.id = this._numberElementId('recordedAudio', index);
    elemAudio.classList.add('audio-control');
    elemAudio.innerHTML = 'HTML 5 audio control not supported by this browser';
    elemAudio.style.display = 'none';
    elemAudio.onended = e => this._audioEndedHandler(e.target);
    this._settings.audiocontrols.push(elemAudio);

    var playbutton = CreateElement.createButton(this._numberElementId('btnPlay', index), 'play-control', null, null, e => this._playButtonHandler(e.target));
    container.appendChild(playbutton);
    this._settings.playcontrols.push(playbutton);
    
    var deletebutton = CreateElement.createButton(this._numberElementId('btnDelete', index), 'delete-control', this._TRASH_SYMBOL, 'delete recording', e => this._deleteButtonHandler(e.target));
    container.appendChild(deletebutton);
    this._settings.deletecontrols.push(deletebutton);
    
    this._setPlayButtonStyling(playbutton, 'play');

    return container;
  }
  
  _createPackageControl() {
    var container = CreateElement.createDiv(null, null);
    
    var buttontitle = 'download recordings in a ZIP file - only available once all recordings are completed';
    var packagebutton = CreateElement.createButton(null, 'package-control', this._DOWNLOAD_SYMBOL, buttontitle, e => this._packageButtonHandler(e.target));
    container.appendChild(packagebutton)
    this._maincontainer.packagebutton = packagebutton;

    var downloadlink = CreateElement.createLink(null, null);
    container.appendChild(downloadlink);
    downloadlink.download = this._config.downloadfilename + ".zip";
    downloadlink.innerHTML = 'for downloading';
    downloadlink.href = ''; // intentionally blank
    downloadlink.style.display = 'none';    
    this._downloadelement = downloadlink;
  
   return container;
  }

	//-----------------------------------------------------------------------------
	// control styling, visibility, and enabling
	//-----------------------------------------------------------------------------  
  _setRecordButtonStyling(elemTarget, stageName) {
    var recordButtons = this._settings.recordcontrols;
    for (var i = 0; i < recordButtons.length; i++) {
      var elemButton = recordButtons[i];
      var elemNumber = this._getElementNumber(elemButton);
      if( this._settings.recordinginprogress >= 0) {
        elemButton.disabled = (elemNumber != this._settings.recordinginprogress);
      } else {
        elemButton.disabled = false;
      }
    }
    
    var buttonText = this._settings.recordbuttonstyling[stageName].buttontext;
    var buttonClass = this._settings.recordbuttonstyling[stageName].buttonclass;
    var buttonHoverText = this._settings.recordbuttonstyling[stageName].hovertext;
    
    for (var prop in this._settings.recordbuttonstyling) {
      var className = this._settings.recordbuttonstyling[prop].buttonclass;
      if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
    }
    elemTarget.innerHTML = buttonText;
    elemTarget.classList.add(buttonClass);
    elemTarget.title = buttonHoverText;
  }
    
  _setPlayButtonStyling(elemTarget, stageName) {
    var playButtons = this._settings.playcontrols;
    var deleteButtons = this._settings.deletecontrols;

    for (var i = 0; i < playButtons.length; i++) {
      var elemButton = playButtons[i];
      var elemDeleteButton = deleteButtons[i];

      if (this._settings.mp3blobs[i] == null) {
        elemButton.style.display = 'none';
        elemDeleteButton.style.display = 'none';
      } else {
        elemButton.style.display = 'inline-block';
        elemDeleteButton.style.display = 'inline-block';
      }
    }
    
    var buttonText = this._settings.playbuttonstyling[stageName].buttontext;
    var buttonClass = this._settings.playbuttonstyling[stageName].buttonclass;
    var buttonHoverText = this._settings.playbuttonstyling[stageName].hovertext;
    
    for (var prop in this._settings.playbuttonstyling) {
      var className = this._settings.playbuttonstyling[prop].buttonclass;
      if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
    }
    elemTarget.innerHTML = buttonText;
    elemTarget.classList.add(buttonClass);
    elemTarget.title = buttonHoverText;
  }
  
  _setPromptPlayButtonStyling(elemTarget, stageName) {
    var buttonText = this._settings.playbuttonstyling[stageName].buttontext;
    var buttonClass = this._settings.playbuttonstyling[stageName].buttonclass;
    var buttonHoverText = this._settings.playbuttonstyling[stageName].hovertext;
    
    for (var prop in this._settings.playbuttonstyling) {
      var className = this._settings.playbuttonstyling[prop].buttonclass;
      if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
    }
    elemTarget.innerHTML = buttonText;
    elemTarget.classList.add(buttonClass);
    elemTarget.title = buttonHoverText;
  }
  
  _enablePlayButtons(enable) {
    for (var i = 0; i < this._settings.playcontrols.length; i++) {
      this._settings.playcontrols[i].disabled = !enable;
    }
  }

  _setPackageButtonEnable() {
    var enable = (this._settings.recordinginprogress < 0);
    
    for (var i = 0; i < this._settings.mp3blobs.length && enable; i++) {
      enable = (this._settings.mp3blobs[i] != null);
    }
    this._maincontainer.packagebutton.disabled = !enable;
  }

	//-----------------------------------------------------------------------------
	// audio setup and management
	//-----------------------------------------------------------------------------  
  async _configureAudio() {    
  /*  try {*/
      var stream = await navigator.mediaDevices.getUserMedia({audio:true});
      await this._configureAudioControls(stream);
/*
    } catch (error) {
      this._settings.streamavailable = false;
      this._notice.reportError('_configureAudio', error);
    }
    */
  }
  
  _configureAudioControls(stream) {
    this._settings.streamavailable = true;
    
    for (var i = 0; i < this._config.items.length; i++) {
      var thisRecorder = new MediaRecorder(stream, {mimeType: this._AUDIO_MIMETYPE});
      var thisChunks = [];
      this._settings.mediarecorder.push(thisRecorder);
      this._settings.audiochunks.push(thisChunks);
      this._settings.mp3blobs.push(null);
      //function (me, f) { return function(e) {me._doMenuOption(f);}} (this, menuOptions[i].callback);
      var handler = function (me) { var j = i; return function(e) {me._finishRecording(e, j);}} (this);
      thisRecorder.ondataavailable = handler;
      /*
      thisRecorder.ondataavailable = (function(me, e) {
        var j = i;
        return function(e) {me._finishRecording(e, j);}
      })(this);
      */
    }
  }
  
  _startRecording(elemTarget) {
    try {
      var elemNumber = this._getElementNumber(elemTarget);
      this._settings.recordinginprogress = elemNumber;
      this._setRecordButtonStyling(elemTarget, 'stop')
      this._enablePlayButtons(false);
      this._setPackageButtonEnable();
      this._settings.audiochunks[elemNumber] = [];
      this._settings.mediarecorder[elemNumber].start();
      
    } catch(err) {
      this._notice.reportError('_startRecording', err);
    }  
  }

  _stopRecording(elemTarget) {
    try {
      var elemNumber = this._getElementNumber(elemTarget);
      this._settings.recordinginprogress = -1;
      this._setRecordButtonStyling(elemTarget, 'redo')
      this._settings.mediarecorder[elemNumber].stop();

    } catch(err) {
      this._notice.reportError('_stopRecording', err);
    }
  }

  _redoRecording(elemTarget) {
    var prompt = 'There is already a recording for this item.\nClick "OK" if you would like to make a new one';
    if (confirm(prompt)) this._startRecording(elemTarget);
  }

  _deleteRecordingOnConfirm(elemTarget) {
    var prompt = 'Are you sure you want to delete this recording?\nClick "OK" to confirm the deletion';
    if (confirm(prompt)) {
      var elemNumber = this._getElementNumber(elemTarget);
      this._settings.mp3blobs[elemNumber] = null;
      this._setRecordButtonStyling(this._settings.recordcontrols[elemNumber], 'start');
      this._setPlayButtonStyling(this._settings.playcontrols[elemNumber], 'play');
      this._setPackageButtonEnable();
    }
  }
  
  _finishRecording(e, index) {
    try {
      var elemAudio = document.getElementById(this._numberElementId('recordedAudio', index));
      var thisRecorder = this._settings.mediarecorder[index];
      var thisChunks = this._settings.audiochunks[index];
      thisChunks.push(e.data);

      if (thisRecorder.state == "inactive"){
        let blob = new Blob(thisChunks, {type: this._AUDIO_MIMETYPE} );
        elemAudio.src = URL.createObjectURL(blob);
        elemAudio.controls=true;
        elemAudio.autoplay=false;
        this._settings.mp3blobs[index] = blob;
        this._setPackageButtonEnable();
        this._enablePlayButtons(true);
        this._setPlayButtonStyling(this._settings.playcontrols[index], 'play');
      }
    } catch(err) {
      this._notice.reportError('_finishRecording', err);
    }
  }

  _playPromptRecording(elemTarget) {  
    var elemNumber = this._getElementNumber(elemTarget);
    var elemAudio = this._settings.audiopromptcontrols[elemNumber];

    var stage, nextStage;
    if (elemTarget.classList.contains(this._settings.playbuttonstyling.play.buttonclass)) {
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
 
     this._setPromptPlayButtonStyling(elemTarget, nextStage);
  }
  
  _audioPromptEnded(elemTarget) {
    var elemNumber = _getElementNumber(elemTarget);
    var elemPlayPromptButton = this._settings.audiopromptplaycontrols[elemNumber];
    this._setPromptPlayButtonStyling(elemPlayPromptButton, 'play');    
  }

  _playRecording(elemTarget) {  
    var elemNumber = this._getElementNumber(elemTarget);
    var mp3blob = this._settings.mp3blobs[elemNumber];
    
    if (mp3blob != null) {
      var elemAudio = this._settings.audiocontrols[elemNumber];
      var stage, nextStage;
      if (elemTarget.classList.contains(this._settings.playbuttonstyling.play.buttonclass)) {
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
      this._setPlayButtonStyling(elemTarget, nextStage);
    }
  }
  
  _audioEnded(elemTarget) {
    var elemNumber = this._getElementNumber(elemTarget);
    var elemPlayButton = this._settings.playcontrols[elemNumber];
    this._setPlayButtonStyling(elemPlayButton, 'play');    
  }
  
	//------------------------------------------------------------------
	// package and download recordings
	//------------------------------------------------------------------
  _packageAudioRecordings() {
    var zip = new JSZip();
    var currDate = new Date();
    var dateWithOffset = new Date(currDate.getTime() - currDate.getTimezoneOffset() * 60000);
    
    zip.file('README.txt', this._config.readme + '\n', {date: dateWithOffset});  // text must end in \n
    
    for (var i = 0; i < this._settings.mp3blobs.length; i++) {
      var blob = this._settings.mp3blobs[i];

      var filename1 = this._numberElementId('response', (i+1)) + this._AUDIO_FILETYPE_EXTENSION_CHROME; 
      var filename2 = this._numberElementId('response', (i+1)) + this._AUDIO_FILETYPE_EXTENSION_FIREFOX; 

      zip.file(filename1, blob, {date: dateWithOffset});
      zip.file(filename2, blob, {date: dateWithOffset});
    }

    var downloadelement = this._downloadelement;
    zip.generateAsync({type: "blob"})
    .then (function(content) {
      downloadelement.href = URL.createObjectURL(content);
      downloadelement.click();
    });
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
  _recordButtonHandler(elemTarget) {
    var classes = elemTarget.classList;
    
    if (classes.contains(this._settings.recordbuttonstyling['start'].buttonclass)) {
      this._startRecording(elemTarget);
    } else if (classes.contains(this._settings.recordbuttonstyling['stop'].buttonclass)) {
      this._stopRecording(elemTarget);
    } else if (classes.contains(this._settings.recordbuttonstyling['redo'].buttonclass)) {
      this._redoRecording(elemTarget);
    }
  }    
  
  _deleteButtonHandler(elemTarget) {
    this._deleteRecordingOnConfirm(elemTarget);
  }
  
  _packageButtonHandler(elemTarget) {
    this._packageAudioRecordings();
  }
  
  _playPromptButtonHandler(elemTarget) {
    this._playPromptRecording(elemTarget);
  }
  
  _audioPromptEndedHandler(elemTarget) {
    this._audioPromptEnded(elemTarget);
  }

  _playButtonHandler(elemTarget) {
    this._playRecording(elemTarget);
  }
  
  _audioEndedHandler(elemTarget) {
    this._audioEnded(elemTarget);
  }
  
	//---------------------------------------
	// utility functions
	//----------------------------------------  
  _getElementNumber(elem) {
    return parseInt(('000' + elem.id).slice(-3));
  }

  _numberElementId(base, index) {
    return  base + ('000' + index).slice(-3);
  }

}

