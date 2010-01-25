jQuery.fn.evently = function(events, options) {
  
  function forIn(obj, fun) {
    var name;
    for (name in obj) {
      if (obj.hasOwnProperty(name)) {
        fun(name, obj[name])
      }
    }
  };

  var self = $(this);
  
  function eventlyHandler(name, e) {
    if (e.template) {
      templated(self, name, e);
    } else if (typeof e == "function") {
      self.bind(name, e);
    } else if (e.length) { 
      for (var i=0; i < e.length; i++) {
        // handle arrays recursively
        eventlyHandler(name, e[i]);
      };
    }
  };

  function runIfFun(me, fun, args) {
    // if the field is a function, call it, bound to the widget
    if (typeof fun == "function") {
      return fun.apply(me, args);
    } else {
      return fun;
    }
  }
  
  function applySelectors(me, selectors) {
    forIn(selectors, function(selector, bindings) {
      forIn(bindings, function(name, evs) {
        // console.log("bind "+name+" to "+selector+" to trigger "+evs);
        $(selector, me).bind(name, function() {
          var ev, self = $(this);
          for (var i=0; i < evs.length; i++) {
            ev = evs[i];
            if (typeof ev == "function") {
              ev.apply(me, arguments);
            } else {
              self.trigger(ev);              
            }
          }
          return false;
        });
      });
    });
  }
  
  function templated(ctx, name, e) {
    // console.log("binding template: "+name)
    ctx.bind(name, function() {
      // console.log("running template "+name);
      var args = $.makeArray(arguments);
      var me = $(this), selectors;
      me.html($.mustache(
        runIfFun(me, e.template, args),
        runIfFun(me, e.view, args), 
        runIfFun(me, e.partials, args)));
      selectors = runIfFun(me, e.selectors, args);
      if (selectors) {
        applySelectors(me, selectors);
      }
      if (e.after) {
        e.after.apply(me, args)
      }
    });
  };
  
  // setup the handlers onto self
  forIn(events, eventlyHandler);
  
  if (events.init) {
    self.trigger("init");
  }
};