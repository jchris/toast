// a login couchapp helper for CouchDB
// Apache 2.0 license

jQuery(function($) {
  function namePassForm(action) {
    return {
      template :
        '<form><label for="name">Name</label> <input type="text" name="name" value=""><label for="password">Password</label> <input type="password" name="password" value=""><input type="submit" value="{{action}}"></form>',
      view : {action : action},
      selectors : {
        form : {
          submit : [function(e) {
            e.preventDefault();
            var self = $(this), 
              name = $("input[name=name]", this).val(),
              pass = $("input[name=password]", this).val();
              
            console.log(arguments)
            console.log("name "+name +" pass "+pass)
            console.log("submit "+action);
            $(this).trigger("do"+action, [name, pass]);
            return false;
          }]
        }
      },
      after : function() {
        $("input[name=name]", this).focus();
      }
    };
  };

  // illustrate how to override just parts of it
  // for each key
  // it's either a function or a template
  // if it's a function bind it,
  // if it's not a function, make the fun and bind it
  $.couch.app = $.couch.app || {};
  $.couch.app.account = {
    loggedIn : {
      template : 'Welcome <a target="_new" href="/_utils/document.html?{{auth_db}}/org.couchdb.user%3A{{uri_name}}">{{name}}</a>! <a href="#logout">Logout?</a>',
      view : function(r) {
        console.log("logged in view")
        return {
          name : r.userCtx.name,
          uri_name : encodeURIComponent(r.userCtx.name),
          auth_db : encodeURIComponent(r.info.authentication_db)
        };
      },
      selectors : {
        'a[href=#logout]' : {click : ["doLogout"]}
      }
    },
    loggedOut : {
      template : '<a href="#signup">Signup</a> or <a href="#login">Login</a>',
      selectors : {
        "a[href=#signup]" : {click : ["signupForm"]},
         "a[href=#login]" : {click : ["loginForm"]}
      }
    },
    adminParty : function() {
      alert("Admin party! Fix this in Futon before proceeding.");
    },
    loginForm : namePassForm("Login"),
    signupForm : namePassForm("Signup"),
    doLogout : function() {
      var app = $(this);
      $.couch.logout({
        success : function() {
          app.trigger("refreshSession");
        }
      });
    },
    doLogin : function(e, name, pass) {
      console.log("doLogin")
      console.log(arguments)
      var app = $(this);
      $.couch.login({
        name : name,
        password : pass,
        success : function(r) {
          console.log(r)
          app.trigger("refreshSession")
        }
      });      
    },
    doSignup : function(name, pass) {
      $.couch.signup({
        name : name
      }, pass, {
        success : function() {
          $(this).trigger("refreshSession")
        }
      });
    },
    refresh : function() {
      console.log("run refresh")
      var app = $(this);
      $.couch.session({
        success : function(r) {
          var userCtx = r.userCtx;
          if (userCtx.name) {
            console.log("trigger loggedIn")
            app.trigger("loggedIn", [r]);
          } else if (userCtx.roles.indexOf("_admin") != -1) {
            app.trigger("adminParty");
          } else {
            console.log("trigger loggedout")
            app.trigger("loggedOut");
          };
        }
      });
    }
  };
});
