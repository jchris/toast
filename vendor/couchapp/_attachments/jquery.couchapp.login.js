(function($) {
  // this creates a login/signup form
  // this handles the login / signup process. you can style the form with CSS.
  $.couch.app.login = {};
  $.couch.app.login.session = function(opts) {
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

  $.couch.app.login.widget = function(divSelector, opts) {
    var div = $(divSelector);
    // render the widget
    div.html('');
    
    function refreshWidget() {
      $.couch.app.login.session({
        loggedIn : function(r) {
          div.html('Welcome <a target="_new" href="/_utils/document.html?'+
            encodeURIComponent(r.info.authentication_db) +
            '/org.couchdb.user%3A' + 
            encodeURIComponent(r.userCtx.name)+'">' +
            r.userCtx.name +
            '</a>! <a href="#logout">Logout?</a>');
          // setup the logout callback
          $('a[href=#logout]', div).click(function() {
            $.couch.logout({
              success : refreshWidget
            });
            return false;
          });
          if (opts.loggedIn) opts.loggedIn(r);
        },
        loggedOut : function() {
          div.html('<a href="#signup">Signup</a> or <a href="#login">Login</a>')

          // setup login and signup callbacks
          $('a[href=#login]', div).click(function() {
            div.html('<form><label for="name">Name</label> <input type="text" name="name" value=""><label for="password">Password</label> <input type="password" name="password" value=""><input type="submit" value="Login"></form>');
            $("input[name=name]", div).focus();
            $('form', div).submit(function() {
              var form = $(this);
              $.couch.login({
                name : $("input[name=name]", form).val(),
                password : $("input[name=password]", form).val(),
                success : refreshWidget
              });
              return false;
            });
            return false;
          });
          
          $('a[href=#signup]', div).click(function() {
            div.html('<form><label for="name">Name</label><input type="text" name="name" value=""><label for="password">Password</label><input type="password" name="password" value=""><input type="submit" value="Signup"></form>');
            $("input[name=name]", div).focus();
            $('form', div).submit(function() {
              var form = $(this);
              var name = $("input[name=name]", form).val();
              var password = $("input[name=password]", form).val();
              $.couch.signup({
                name : name
              }, password, {
                success : function() {
                  $.couch.login({
                    name : name,
                    password : password,
                    success : refreshWidget
                  });
                }
              });
              return false;
            });
            return false;
          });
          if (opts.loggedOut) opts.loggedOut(r);
        }
      });      
    }
    refreshWidget();
  };
})(jQuery);