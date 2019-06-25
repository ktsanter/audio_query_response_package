define(function (require) {
  require('embedmaker');
  require('audio_query_response_package');
  require('create_element');
  require('standard_notice');
  require('google_webapp_interface');
  require('clipboard_copy');
  require('markdowntohtml');
  //require('concatenate_blobs');
  require('crunker');

  document.addEventListener('DOMContentLoaded', app.init());
});