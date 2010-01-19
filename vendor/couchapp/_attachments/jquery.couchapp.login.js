(function($) {
  // this creates a login/signup form
  // this handles the login / signup process. you can style the form with CSS.

  $.CouchApp.app.login = function(opts) {
    $.couch.session({
      success : function(r) {
        var userCtx = r.userCtx;
        var body = $("body");  
        if (userCtx.name) {
          if (opts.loggedIn) opts.loggedIn(r);
        } else if (userCtx.roles.indexOf("_admin") != -1) {
          alert("Admin party! Fix this in Futon.");
        } else {
          if (opts.loggedOut) opts.loggedOut(r);
        };
      }
    });
  };
  
  $.CouchApp.app.loginWidget = function(divSelector, opts) {
    var div = $(divSelector);
    // render the widget
    div.html('');
    
    $.CouchApp.app.login({
      loggedIn : function(r) {
        div.html('Welcome <a target="_new" href="/_utils/document.html?'+
          encodeURIComponent(r.info.user_db) +
          '/org.couchdb.user%3A' + 
          encodeURIComponent(r.userCtx.name)+'">' +
          r.userCtx.name +
          '</a>! <a href="#logout">Logout?</a>');
        // setup the logout callback
        if (opts.loggedIn) opts.loggedIn(r);
        
      },
      loggedOut : function() {
        div.html('<a href="#signup">Signup</a> or <a href="#login">Login</a>')
        // setup login and signup callbacks
        if (opts.loggedOut) opts.loggedOut(r);
        
      }
    })

    
    // get the current session and draw the login form.
    // yield the userctx
    // have optional callbacks for
    // loggedin
    // loggedout
    // adminparty
  };

})(jQuery);