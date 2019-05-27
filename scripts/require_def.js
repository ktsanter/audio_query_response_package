define(function (require) {
  require('main');
  require('google_webapp_interface');
  //require('commonmarkmin');
  require('jszip_min');
  require('markdown_alt');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
