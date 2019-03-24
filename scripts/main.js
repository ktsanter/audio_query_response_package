var rec = [];
var audioChunks = [];

var recordButtonStyling = {
  'start': {buttontext: 'start', buttonclass: 'start-recording'},
  'stop': {buttontext: 'stop', buttonclass: 'stop-recording'},
  'redo': {buttontext: 'redo', buttonclass: 'redo-recording'}
};

navigator.mediaDevices.getUserMedia({audio:true})
  .then((stream) => handlerFunction(stream))
  .catch((err) => _reportError('getUserMedia', err));


function handlerFunction(stream) {
  var audioElements = document.getElementsByClassName('audio-control');
  for (var i = 0; i < audioElements.length; i++) {
    var elemAudio = audioElements[i];
    var thisRec = new MediaRecorder(stream);
    var thisChunks = [];
    rec.push(thisRec);
    audioChunks.push(thisChunks);
    thisRec.ondataavailable = (function(e) {
      var j = i;
      return function(e) {_finishRecording(e, j);}
    })();
  }
}

function sendData(data) {
  console.log('implement sendData');
}

var recordingButtons = document.getElementsByClassName('button-record');
for (var i = 0; i < recordingButtons.length; i++) {
  recordingButtons[i].onclick = e => _recordButtonHandler(e.target);
}

function _recordButtonHandler(elemTarget) {
  var classes = elemTarget.classList;
  
  if (classes.contains(recordButtonStyling['start'].buttonclass)) {
    _startRecording(elemTarget);
  } else if (classes.contains(recordButtonStyling['stop'].buttonclass)) {
    _stopRecording(elemTarget);
  } else if (classes.contains(recordButtonStyling['redo'].buttonclass)) {
    _redoRecording(elemTarget);
  }
}
  
function _startRecording(elemTarget) {
  try {
    var elemNumber = _getElementNumber(elemTarget);
    console.log('start was clicked for #' + elemNumber);
    console.log(elemNumber);
    _setRecordButtonStyling(elemTarget, 'stop')
    audioChunks[elemNumber] = [];
    rec[elemNumber].start();
    
  } catch(err) {
    _reportError('_startRecording', err);
  }  
}

function _stopRecording(elemTarget) {
  try {
    var elemNumber = _getElementNumber(elemTarget);
    console.log('stop was clicked for ' + elemNumber);
    _setRecordButtonStyling(elemTarget, 'redo')
    rec[elemNumber].stop();

  } catch(err) {
    _reportError('_stopRecording', err);
  }
}

function _redoRecording(elemTarget) {
  var prompt = 'There is already a recording for this item.  \nClick "OK" if you would like to make a new one';
  if (confirm(prompt)) _startRecording(elemTarget);
}

function _finishRecording(e, index) {
  console.log('_finishRecording: index=' + index);
  console.log(e);
  var elemAudio = document.getElementById(_numberElementId('recordedAudio', index));
  var thisChunks = audioChunks[index];
  var thisRec = rec[index];
  thisChunks.push(e.data);
  if (thisRec.state == "inactive"){
    console.log(elemAudio);
    let blob = new Blob(thisChunks,{type:'audio/mpeg-3'});
    elemAudio.src = URL.createObjectURL(blob);
    elemAudio.controls=true;
    elemAudio.autoplay=false;
    sendData(blob)
  }
}

function _setRecordButtonStyling(elemTarget, stageName) {
  var buttonText = recordButtonStyling[stageName].buttontext;
  var buttonClass = recordButtonStyling[stageName].buttonclass;
  
  for (var prop in recordButtonStyling) {
    var className = recordButtonStyling[prop].buttonclass;
    if (elemTarget.classList.contains(className)) elemTarget.classList.remove(className);
  }
  elemTarget.innerHTML = buttonText;
  elemTarget.classList.add(buttonClass);
}

function _getElementNumber(elem) {
  return parseInt(('000' + elem.id).slice(-3));
}

function _numberElementId(base, index) {
  return  base + ('000' + index).slice(-3);
}

function _reportError(src, err) {
  console.log('Error in ' + src + ': \n  ' + err.name + '\n  ' + err.message);
}
