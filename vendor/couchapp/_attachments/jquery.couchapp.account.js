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
    // signUp and logIn are triggered by events set by loggedIn
    signUp : [function(options) {

    }],
    logIn : [function(options) {
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
    }],
    // loggedIn loggedOut and adminParty are triggered by the session xhr response
    loggedIn : [function(options, userCtx) {
      this.bind("org.couchapp.account.loggedIn", function(e, selector) {
        // draw the welcome template
        console.log("loggedIn")
      });
    }],
    loggedOut : [function(options, userCtx) {
      this.bind("org.couchapp.account.loggedOut", function(e, selector) {
        // draw the loggedOut template
        console.log("loggedOut")
        $(this).html('<a href="#signup">Signup</a> or <a href="#login">Login</a>');
        // setup login and signup callbacks
         $('a[href=#login]', this).click(function() {
           widget.trigger("org.couchapp.account.logIn", options, userCtx);
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
              widget.trigger("org.couchapp.account.loggedIn", options, userCtx);
            } else if (userCtx.roles.indexOf("_admin") != -1) {
              widget.trigger("org.couchapp.account.adminParty", userCtx);
            } else {
              widget.trigger("org.couchapp.account.loggedOut", userCtx);
            };
          }
        });
      });
    }]
  };
});