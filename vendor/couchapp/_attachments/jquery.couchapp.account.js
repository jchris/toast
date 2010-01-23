jQuery.fn.setupExtras = function(setup, options) {
  for(extra in setup) {
    var self = this;
    if(setup[extra] instanceof Array) {
      for(var i=0; i<setup[extra].length; i++) 
        setup[extra][i].call(self, options);
    } else {
      setup[extra].call(self, options);
    }
  }
};

jQuery(function($) {  
  var $$ = function(param) {
    var id = $.data($(param)[0]);
    return $.cache[id];
  };
  
  $.fn.couchappAccountWidget = function(options) {
    options = options || {};
    
    this.setupExtras(options.setup || $.fn.couchappAccountWidget.base, options);
    
    // Initialize
    this.each(function() {
      // setup the div on the dom element
    });

    // trigger the session refresh event
    this.trigger("org.couchapp.account.refreshSession");
    
    return this;
  };



  function namePassForm(action) {
    return {
      template :
        '<form><label for="name">Name</label> <input type="text" name="name" value=""><label for="password">Password</label> <input type="password" name="password" value=""><input type="submit" value="{{action}}"></form>',
      view : {action : action},
      selectors : {
        'form' : {
          "submit" : [function() {
            app.trigger("do"+action, [
              $("input[name=name]", this).val(),
              $("input[name=password]", this).val()]);
            return false;
          }]
        }
      },
      setup : function() {
        $("input[name=name]", this).focus();
      }
    };
  };

  // illustrate how to override just parts of it
  // for each key
  // it's either a function or a template
  // if it's a function bind it,
  // if it's not a function, make the fun and bind it
  $.couch.app.account = {
    loggedIn : {
      template : 'Welcome <a target="_new" href="/_utils/document.html?{{auth_db}}/org.couchdb.user%3A{{name}}">{{name}}</a>! <a href="#logout">Logout?</a>',
      view : {},
      events : {
        'a[href=#logout]' : {click : ["doLogout"]}
      }
    },
    loggedOut : {
      template : '<a href="#signup">Signup</a> or <a href="#login">Login</a>',
      view : {},
      div.html($.mustache($.CouchApp.account.templates.loggedIn, {
        name : r.userCtx.name,
        uri_name : encodeURIComponent(r.userCtx.name),
        auth_db : encodeURIComponent(r.info.authentication_db)
      }));
      selectors : {
        // on click, trigger these events
        // events are autoscoped by couchapp
        "a[href=#login]" : {"click" : ["loginForm"]},
        "a[href=#signup]" : {"click" : ["signupForm"]}
      }
    },
    adminParty : function() {
      alert("Admin party! Fix this in Futon before proceeding.");
    },
    loginForm : namePassForm("Login"),
    signupForm : namePassForm("Signup"),
    doLogout : function() {
      $.couch.logout({
        success : function() {
          app.trigger("refreshSession");
        }
      });
    },
    doLogin : function(name, pass) {
      $.couch.login({
        name : name,
        password : pass,
        success : function() {
          app.trigger("refreshSession")
        }
      });      
    },
    doSignup : function(name, pass) {
      $.couch.signup({
        name : name
      }, pass, {
        success : function() {
          app.trigger("refreshSession")
        }
      });
    },
    refresh : function() {
      $.couch.session({
        success : function(r) {
          var userCtx = r.userCtx;
          if (userCtx.name) {
            app.trigger("loggedIn");
          } else if (userCtx.roles.indexOf("_admin") != -1) {
            app.trigger("adminParty");
          } else {
            app.trigger("loggedOut");
          };
        }
      });
    }
  };

  $.couch.app.account

});