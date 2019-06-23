//-------------------------------------------------------------------
// audio query/response package tool
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------

class AudioQueryResponsePackage {
  constructor (config) {
    this._config = config;
    
    this._AUDIO_MIMETYPE = 'audio/webm';
    this._AUDIO_FILETYPE_EXTENSION_FIREFOX = '.ogg';
    this._AUDIO_FILETYPE_EXTENSION_CHROME = '.webm';
    
    this._NO_VALUE = '[none]';

    this._PLAYPROMPT_ICON = 'play-audio playprompt-control far fa-play-circle';
    this._PAUSEPROMPT_ICON = 'pause-audio pauseprompt-control far fa-pause-circle';
    this._PLAY_ICON = 'play-audio play-control far fa-play-circle';
    this._PAUSE_ICON = 'pause-audio pause-control far fa-pause-circle';
    this._RECORD_ICON = 'record-control fas fa-microphone';
    this._NO_RECORD_ICON = 'record-control fas fa-microphone-slash';
    this._STOP_RECORD_ICON = 'record-control far fa-stop-circle';
    this._STOP_SYMBOL = '⏹️';
    
    this._DELETE_ICON = 'delete-control far fa-trash-alt';
    this._DOWNLOAD_ICON = 'package-control far fa-arrow-alt-circle-down';
    
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
        'start': {buttontext: null, buttonclass: 'start-recording', hovertext: 'start recording'},
        'stop': {buttontext: null, buttonclass: 'stop-recording', hovertext: 'stop recording'},
        'redo': {buttontext: null, buttonclass: 'redo-recording', hovertext: 'redo recording'}
      },
      playbuttonstyling: {
        'playprompt': {buttontext: null, buttonclass: 'play-audio', hovertext: 'play prompt recording'},
        'pauseprompt': {buttontext: null, buttonclass: 'pause-audio', hovertext: 'pause prompt recording'},
        'play': {buttontext: null, buttonclass: 'play-audio', hovertext: 'play response recording'},
        'pause': {buttontext: null, buttonclass: 'pause-audio', hovertext: 'pause response recording'}
      },
      recordinginprogress: -1,
      tabindex: 100
    };
  }  
	
  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  async render() {
    this._contents = CreateElement.createDiv(null, 'arp-maincontents');
    
    this._notice = new StandardNotice(this._contents, this._contents);
    this._notice._normalNoticeContainer.style.display = 'none';
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
      this._setPackageButtonEnable();
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

      var playbutton = CreateElement.createIcon(this._numberElementId('btnPlayPrompt', index), this._PLAYPROMPT_ICON, null, e => this._playPromptButtonHandler(e.target));
      container.appendChild(playbutton);
      playbutton.addEventListener('keyup', e => this._iconKeyUpHandler(e), false);
      this._addTabIndex(playbutton);
      this._setPromptPlayButtonStyling(playbutton, 'play');
     
      this._settings.audiopromptcontrols.push(elemAudio);
      this._settings.audiopromptplaycontrols.push(playbutton);
    }
    
    if (item.textprompt != this._NO_VALUE && item.textprompt != null && item.textprompt != '') {
      var textPrompt = CreateElement.createSpan(null, 'item-prompt-text', MarkdownToHTML.convert(item.textprompt));
      container.appendChild(textPrompt);
    }

    return container;
  }
  
  _renderResponse(index, item) {
    var container = CreateElement.createDiv(null, 'item-response');
    
    var recordbutton = CreateElement.createIcon(this._numberElementId('btnRecording', index), this._RECORD_ICON, null, e => this._recordButtonHandler(e.target));
    container.appendChild(recordbutton);
    recordbutton.addEventListener('keyup', e => this._iconKeyUpHandler(e), false);
    this._addTabIndex(recordbutton);
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

    var playbutton = CreateElement.createIcon(this._numberElementId('btnPlay', index), this._PLAY_ICON, null, e => this._playButtonHandler(e.target));
    container.appendChild(playbutton);
    playbutton.addEventListener('keyup', e => this._iconKeyUpHandler(e), false);
    this._addTabIndex(playbutton);
    this._settings.playcontrols.push(playbutton);
    
    var title = 'delete recording #' + (index + 1);
    var deletebutton = CreateElement.createIcon(this._numberElementId('btnDelete', index), this._DELETE_ICON, title, e => this._deleteButtonHandler(e.target));
    container.appendChild(deletebutton);
    deletebutton.addEventListener('keyup', e => this._iconKeyUpHandler(e), false);
    this._addTabIndex(deletebutton);
    this._settings.deletecontrols.push(deletebutton);
    
    this._setPlayButtonStyling(playbutton, 'play');

    return container;
  }
  
  _createPackageControl() {
    var container = CreateElement.createDiv(null, null);
    
    var buttontitle = 'download recordings in a ZIP file';
    var packagebutton = CreateElement.createIcon(null, this._DOWNLOAD_ICON, buttontitle, e => this._packageButtonHandler(e.target));
    container.appendChild(packagebutton);
    packagebutton.addEventListener('keyup', e => this._iconKeyUpHandler(e), false);
    this._addTabIndex(packagebutton);
    this._packagebutton = packagebutton;

    // hidden link to trigger ZIP and download
    var downloadlink = CreateElement.createLink(null, null);
    container.appendChild(downloadlink);
    downloadlink.download = this._config.downloadfilename + ".zip";
    downloadlink.innerHTML = 'for downloading';
    downloadlink.href = '';
    downloadlink.style.display = 'none';    
    this._downloadelement = downloadlink;
  
   return container;
  }

	//-----------------------------------------------------------------------------
	// control styling, visibility, and enabling
	//-----------------------------------------------------------------------------  
  _setRecordButtonStyling(elemTarget, stageName) {
    var disableClass = 'record-control-disabled';
    var recordButtons = this._settings.recordcontrols;
    for (var i = 0; i < recordButtons.length; i++) {
      var elemButton = recordButtons[i];
      var elemNumber = this._getElementNumber(elemButton);
      if( this._settings.recordinginprogress >= 0) {
        if (elemNumber != this._settings.recordinginprogress) {
          elemButton.classList.add(disableClass);
          this._replaceClasses(elemButton, this._RECORD_ICON, this._NO_RECORD_ICON);
          elemButton.disabled = true;
        }
      } else {
        if (elemButton.classList.contains(disableClass)) {
          elemButton.classList.remove(disableClass);
        }
        this._replaceClasses(elemButton, this._NO_RECORD_ICON, this._RECORD_ICON);
        elemButton.disabled = false;
      }
    }
    
    var elemNumber = this._getElementNumber(elemTarget);
    var buttonText = this._settings.recordbuttonstyling[stageName].buttontext;
    var buttonClass = this._settings.recordbuttonstyling[stageName].buttonclass;
    var buttonHoverText = this._settings.recordbuttonstyling[stageName].hovertext + ' #' + (elemNumber + 1);

    elemTarget.innerHTML = buttonText;
    elemTarget.title = buttonHoverText;

    for (var prop in this._settings.recordbuttonstyling) {
      var className = this._settings.recordbuttonstyling[prop].buttonclass;
      if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
    }
    elemTarget.classList.add(buttonClass);
    
    if (stageName == 'stop') {
      this._replaceClasses(elemTarget, this._RECORD_ICON, this._STOP_RECORD_ICON);
    } else {
      this._replaceClasses(elemTarget, this._STOP_RECORD_ICON, this._RECORD_ICON);
    }
  }
    
  _setPlayButtonStyling(elemTarget, stageName) {
    var elemNumber = this._getElementNumber(elemTarget);
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
    var buttonHoverText = this._settings.playbuttonstyling[stageName].hovertext + ' #' + (elemNumber + 1);
    
    elemTarget.innerHTML = buttonText;
    elemTarget.title = buttonHoverText;
    if (stageName == 'play') {
      this._replaceClasses(elemTarget, this._PAUSE_ICON, this._PLAY_ICON);
    } else {
      this._replaceClasses(elemTarget, this._PLAY_ICON, this._PAUSE_ICON);
    }
  }
  
  _setPromptPlayButtonStyling(elemTarget, stageName) {
    var elemNumber = this._getElementNumber(elemTarget);
    var buttonText = this._settings.playbuttonstyling[stageName+'prompt'].buttontext;
    var buttonClass = this._settings.playbuttonstyling[stageName+'prompt'].buttonclass;
    var buttonHoverText = this._settings.playbuttonstyling[stageName+'prompt'].hovertext + ' #' + (elemNumber + 1);

    elemTarget.innerHTML = buttonText;
    elemTarget.title = buttonHoverText;
    if (stageName == 'play') {
      this._removeClasses(elemTarget, this._PAUSEPROMPT_ICON);
      CreateElement.addClassList(elemTarget, this._PLAYPROMPT_ICON);
    } else {
      this._removeClasses(elemTarget, this._PLAY_ICON);
      CreateElement.addClassList(elemTarget, this._PAUSEPROMPT_ICON);
    }
  }
  
  _enablePlayButtons(enable) {
    for (var i = 0; i < this._settings.playcontrols.length; i++) {
      this._settings.playcontrols[i].disabled = !enable;
    }
  }
  
  _hidePlayAndDeleteButtons() {
    for (var i = 0; i < this._settings.playcontrols.length; i++) {
      this._settings.playcontrols[i].style.display = 'none';
    }
    for (var i = 0; i < this._settings.deletecontrols.length; i++) {
      this._settings.deletecontrols[i].style.display = 'none';
    }
  }

  _setPackageButtonEnable() {
    var disableClass = 'package-control-disabled'
    var enable = (this._settings.recordinginprogress < 0);
    
    for (var i = 0; i < this._settings.mp3blobs.length && enable; i++) {
      enable = (this._settings.mp3blobs[i] != null);
    }
    
    this._packagebutton.disabled = !enable;
    if (enable) {
      if (this._packagebutton.classList.contains(disableClass)) {
        this._packagebutton.classList.remove(disableClass);
      }
    } else {
      this._packagebutton.classList.add(disableClass);
    }
  }

  //-----------------------------------------------------------------------------
  // audio setup and management
  //-----------------------------------------------------------------------------  
  async _configureAudio() {    
    try {
      var stream = await navigator.mediaDevices.getUserMedia({audio:true});
      await this._configureAudioControls(stream);

    } catch (error) {
      this._settings.streamavailable = false;
      this._notice.reportError('_configureAudio', error);
    }
  }
  
  _configureAudioControls(stream) {
    this._settings.streamavailable = true;
    
    for (var i = 0; i < this._config.items.length; i++) {
      var thisRecorder = new MediaRecorder(stream, {mimeType: this._AUDIO_MIMETYPE});
      var thisChunks = [];
      this._settings.mediarecorder.push(thisRecorder);
      this._settings.audiochunks.push(thisChunks);
      this._settings.mp3blobs.push(null);

      var handler = function (me) { var j = i; return function(e) {me._finishRecording(e, j);}} (this);
      thisRecorder.ondataavailable = handler;
    }
  }
  
  _startRecording(elemTarget) {
    try {
      var elemNumber = this._getElementNumber(elemTarget);
      this._settings.recordinginprogress = elemNumber;
      this._setRecordButtonStyling(elemTarget, 'stop');
      this._enablePlayButtons(false);
      this._hidePlayAndDeleteButtons();
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
    var elemNumber = this._getElementNumber(elemTarget);
    var prompt = 'There is already a recording for response #' + (elemNumber + 1) + '.\nClick "OK" if you would like to make a new one';
    if (confirm(prompt)) {
      var deletebutton = this._settings.deletecontrols[elemNumber];
      var playbutton = this._settings.playcontrols[elemNumber];
      
      playbutton.style.display = 'none';
      deletebutton.style.display = 'none';      
      
      this._startRecording(elemTarget);
    }
  }

  _deleteRecordingOnConfirm(elemTarget) {
    var elemNumber = this._getElementNumber(elemTarget);
    var prompt = 'Are you sure you want to delete response recording #' + (elemNumber + 1) + '?\nClick "OK" to confirm the deletion';
    if (confirm(prompt)) {
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
    var elemNumber = this._getElementNumber(elemTarget);
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
    if (elemTarget.disabled) return;
    
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
    if (elemTarget.disabled) return;
    this._deleteRecordingOnConfirm(elemTarget);
  }
  
  _packageButtonHandler(elemTarget) {
    if (elemTarget.disabled) return;
    this._packageAudioRecordings();
  }
  
  _playPromptButtonHandler(elemTarget) {
    if (elemTarget.disabled) return;
    this._playPromptRecording(elemTarget);
  }
  
  _audioPromptEndedHandler(elemTarget) {
    if (elemTarget.disabled) return;
    this._audioPromptEnded(elemTarget);
  }

  _playButtonHandler(elemTarget) {
    if (elemTarget.disabled) return;
    this._playRecording(elemTarget);
  }
  
  _audioEndedHandler(elemTarget) {
    if (elemTarget.disabled) return;
    this._audioEnded(elemTarget);
  }
  
  _iconKeyUpHandler(e) {
    if (e.code == 'Space') {
      e.stopPropagation();
      e.target.click();
    }
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

  _replaceClasses(elem, removeList, addList) {
    this._removeClasses(elem, removeList);
    CreateElement.addClassList(elem, addList);
  }
  
  _removeClasses(elem, removeList) {
    var splitList = removeList.split(' ');
    for (var i = 0; i < splitList.length; i++) {
      var className = splitList[i].trim();
      if (className != '' && elem.classList.contains(className)) elem.classList.remove(className);
    }
  }
  
  _addTabIndex(elem) {
    elem.tabIndex = this._settings.tabindex++;
  }  
}

