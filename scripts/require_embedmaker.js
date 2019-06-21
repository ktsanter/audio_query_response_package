define(function (require) {
  require('embedmaker');
  require('create_element');
  require('standard_notice');
  require('google_webapp_interface');
  require('clipboard_copy');

  document.addEventListener('DOMContentLoaded', app.init());
});