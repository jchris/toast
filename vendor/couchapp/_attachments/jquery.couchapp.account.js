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
    return this;
  };

  $.fn.couchappAccountWidget.base = {
    // signUp and logIn are triggered by events set by loggedIn
    signUp : [function(options) {
      
    }],
    logIn : [function(options) {
      
    }],
    // loggedIn and loggedOut are triggered by the session xhr response
    loggedIn : [function(options) {
      
    }],
    loggedOut : [function(options) {
      
    }],
    adminParty : [function(options) {
      
    }] ,
    // reload the session, trigger loggedIn or loggedOut
    refresh : [function(options) {
      
    }]
  };
});