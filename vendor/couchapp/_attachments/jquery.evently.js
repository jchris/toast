
jQuery.fn.evently = function(events, options) {

  function eventField(me, field, args) {
    // if the field is a function, call it, bound to the widget
    if (typeof field == "function") {
      return field.call(me, args);
    } else {
      return field;
    }
  }
  
  function forIn(obj, fun) {
    var name;
    for (name in obj) {
      if (obj.hasOwnProperty(name)) {
        fun(name, obj[name])
      }
    }
  };
  
  function applySelectors(me, selectors) {
    forIn(selectors, function(selector, bindings) {
      forIn(bindings, function(name, evs) {
        console.log("bind "+name+" to "+selector+" to trigger "+evs);
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
  
  var self = $(this);
  var templateFun = $.mustache;

  forIn(events, function(name, action) {
    if (action.template) {
      self.bind(name, function(ev, args) {
        var e = events[name];
        console.log("templating "+name);
        var me = $(this), selectors;
        me.html(templateFun(eventField(me, e.template, args), eventField(me, e.view, args), eventField(me, e.partials, args)));
        selectors = eventField(me, e.selectors)
        if (selectors) {
          applySelectors(me, selectors);
        }
        if (e.after) {
          e.after.call(me) // todo we should send more args?
        }
      });
    } else if (typeof action == "function") {
      // if it's a function...
      self.bind(name, action);
    } // else if (action.length) {
     //      // an array
     //      var act;
     //      for (var i=0; i < action.length; i++) {
     //        act = action[i]
     //        // handle recursively
     //      };
     //      
     //    }
  });
};