define(function (require) {
  require('main');
  require('google_webapp_interface');
  require('standard_notice');
  require('markdowntohtml');
  require('create_element');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
