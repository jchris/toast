$.couch.app(function(app) {
  // setup the account and profile widgets
  $("#account").evently(app.ddoc.vendor.couchapp.evently.account, app);

  // extend the vendor profile widget with Toast specific code
  var profile = $.extend(true, {},
    app.ddoc.vendor.couchapp.evently.profile, 
    app.ddoc.evently.profile);
  $("#profile").evently(profile, app);  

  $.evently.connect($("#account"), $("#profile"), ["loggedIn", "loggedOut"]);

  $("#chat").evently(app.ddoc.evently.chat, app);
});