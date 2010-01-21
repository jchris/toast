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
      // setup the widget on the dom element
    });

    // trigger the session refresh event
    this.trigger("org.couchapp.account.refreshSession");
    
    return this;
  };

  $.fn.couchappAccountWidget.base = {
    // signupForm and loginForm are triggered by events set by loggedOut
    signupForm : [function(options) {
      this.bind("org.couchapp.account.signupForm", function(e, selector) {
        var div = $(this);
        div.html('<form><label for="name">Name</label><input type="text" name="name" value=""><label for="password">Password</label><input type="password" name="password" value=""><input type="submit" value="Signup"></form>');
        $("input[name=name]", div).focus();
        $('form', div).submit(function() {
          var form = $(this);
          div.trigger("org.couchapp.account.doSignup", options, $("input[name=name]", form).val(), $("input[name=password]", form).val())
          return false;
        });
      });
    }],
    loginForm : [function(options) {
      this.bind("org.couchapp.account.loginForm", function(e, selector) {
        var widget = $(this);
        widget.html('<form><label for="name">Name</label> <input type="text" name="name" value=""><label for="password">Password</label> <input type="password" name="password" value=""><input type="submit" value="Login"></form>');
        $("input[name=name]", widget).focus();
        $('form', widget).submit(function() {
          var form = $(this);
          $.couch.login({
            name : $("input[name=name]", form).val(),
            password : $("input[name=password]", form).val(),
            success : function() {
              widget.trigger("org.couchapp.account.refreshSession");
            }
          });
          return false;
        });
      });
    }],
    // loggedIn loggedOut and adminParty are triggered by the session xhr response
    loggedIn : [function(options) {
      this.bind("org.couchapp.account.loggedIn", function(e, r) {
        // draw the welcome template
        var div = $(this);
        
        div.html('Welcome <a target="_new" href="/_utils/document.html?'+
          encodeURIComponent(r.info.authentication_db) +
          '/org.couchdb.user%3A' + 
          encodeURIComponent(r.userCtx.name)+'">' +
          r.userCtx.name +
          '</a>! <a href="#logout">Logout?</a>');
        // setup the logout callback
        $('a[href=#logout]', div).click(function() {
          $.couch.logout({
            success : function() {
              widget.trigger("org.couchapp.account.refreshSession");
            }
          });
          return false;
        });
      });
    }],
    loggedOut : [function(options, userCtx) {
      this.bind("org.couchapp.account.loggedOut", function(e, selector) {
        var widget = $(this);
        widget.html('<a href="#signup">Signup</a> or <a href="#login">Login</a>');
         $('a[href=#login]', this).click(function() {
           widget.trigger("org.couchapp.account.loginForm", userCtx);
           return false;
         });
         $('a[href=#signup]', this).click(function() {
           widget.trigger("org.couchapp.account.signupForm", userCtx);
           return false;
         });
      });
    }],
    adminParty : [function(options, userCtx) {
      this.bind("org.couchapp.account.adminParty", function(e, selector) {
        alert("Admin party! Fix this in Futon before proceeding.");
      });
    }],
    // reload the session, trigger loggedIn or loggedOut
    refresh : [function(options) {
      this.bind("org.couchapp.account.refreshSession", function(e, selector) {
        var widget = $(this);
        $.couch.session({
          success : function(r) {
            var userCtx = r.userCtx;
            if (userCtx.name) {
              widget.trigger("org.couchapp.account.loggedIn", r);
            } else if (userCtx.roles.indexOf("_admin") != -1) {
              widget.trigger("org.couchapp.account.adminParty", r);
            } else {
              widget.trigger("org.couchapp.account.loggedOut", r);
            };
          }
        });
      });
    }],
    doSignup : [function(options) {
      this.bind("org.couchapp.account.doSignup", function(e, name, pass) {
        $.couch.signup({
          name : name
        }, pass, {
          success : function() {
            $.couch.login({
              name : name,
              password : pass,
              success : function() {
                widget.trigger("org.couchapp.account.refreshSession");
              }
            });
          }
        });
      });
    }]
  };
});