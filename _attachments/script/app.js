$.couch.app(function(app) {
  // setup the account and profile widgets
  $("#account").evently(app.ddoc.vendor.couchapp.evently.account, app);  
  $("#profile").evently(app.ddoc.vendor.couchapp.evently.profile, app);  
  $.evently.connect($("#account"), $("#profile"), ["loggedIn", "loggedOut"]);
  
});