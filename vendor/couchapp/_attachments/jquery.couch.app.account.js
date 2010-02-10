// Thank you for using $.couch.app.account
// An $.evently-based login and signup helper for CouchDB.
// 
// Usage: (see Toast's index.html)
// 
//   $("#userCtx").evently($.couch.app.account);
//   $("#userCtx").trigger("refresh");
// 
$.couch.app(function(app) {
  var t = app.ddoc.vendor.couchapp.templates.account;
  
  function makeLoginOrSignupFormHandler(action) {
    // A tiny bit of metaprogramming to set up the evently handlers (with
    // mustache) for the signup and login forms. The evently template is
    // returned as a static object, and interpreted when triggered (like 
    // the other evently templates stored in $.couch.app.account).
    return {
      mustache : t.login_signup_form,
      data : {action : action},
      selectors : {
        form : {
          submit : [function(e) {
            var name = $("input[name=name]", this).val(),
              pass = $("input[name=password]", this).val();              
            $(this).trigger("do"+action, [name, pass]);
            return false;
          }]
        },
        "a[href=#back]" : {click : ["loggedOut"]}
      },
      after : function() {
        $("input[name=name]", this).focus();
      }
    };
  };

  // The evently widget is defined as a (mostly) declarative structure. See 
  // the Toast app's index.html for an example of how to override an evently
  // handler.
  $.couch.app = $.couch.app || {};
  $.couch.app.account = {
    _init: "refresh",
    loggedOut : {
      mustache : t.logged_out,
      selectors : {
        "a[href=#signup]" : {click : ["signupForm"]},
         "a[href=#login]" : {click : ["loginForm"]}
      }
    },
    loggedIn : {
      mustache : t.logged_in,
      data : function(e, r) {
        return {
          name : r.userCtx.name,
          uri_name : encodeURIComponent(r.userCtx.name),
          auth_db : encodeURIComponent(r.info.authentication_db)
        };
      },
      selectors : {
        'a[href=#logout]' : {click : ["doLogout"]}
      },
      after : function(e, r) {
        $(this).attr("data-name", r.userCtx.name);
      }
    },
    adminParty : function() {
      alert("Admin party! Fix this in Futon before proceeding.");
    },
    // these are called onload, so once this plugin is loaded,
    // they can be modified as declarative structures
    loginForm : makeLoginOrSignupFormHandler("Login"),
    signupForm : makeLoginOrSignupFormHandler("Signup"),
    doLogout : function() {
      var app = $(this);
      $.couch.logout({
        success : function() {
          app.trigger("refresh");
        }
      });
    },
    doLogin : function(e, name, pass) {
      var app = $(this);
      $.couch.login({
        name : name,
        password : pass,
        success : function(r) {
          app.trigger("refresh")
        }
      });      
    },
    doSignup : function(e, name, pass) {
      var app = $(this);
      $.couch.signup({
        name : name
      }, pass, {
        success : function() {
          app.trigger("doLogin", [name, pass]);
        }
      });
    },
    refresh : function() {
      var app = $(this);
      $.couch.session({
        success : function(r) {
          var userCtx = r.userCtx;
          if (userCtx.name) {
            app.trigger("loggedIn", [r]);
          } else if (userCtx.roles.indexOf("_admin") != -1) {
            app.trigger("adminParty");
          } else {
            app.trigger("loggedOut");
          };
        }
      });
    }
  };
});
