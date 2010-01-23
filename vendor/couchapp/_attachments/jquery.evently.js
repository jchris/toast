
jQuery.fn.evently = function(events, options) {

  function eventField(me, field, args) {
    // if the field is a function, call it, bound to the widget
    if (typeof field == "function") {
      return field.call(me, args);
    } else {
      return field;
    }
  }
  
  function applySelectors(me, selectors) {
    var s, evs;
    for (var selector in selectors) {
      s = selectors[selector];
      for (var name in s) {
        evs = s[name];
        $(s, me).bind(name, function() {
          for (var i=0; i < evs.length; i++) {
            this.trigger(evs[i]);
          }
        });
      }
    }
  }
  
  var self = $(this);
  var templateFun = $.mustache;

  // TODO switch these for loops to forEach calls
  for(var event in events) {
    if (events[event].template) {
      // render the template with the options
      self.bind(event, function(ev, args) {
        var ename = ev.type;
        var e = events[ename];
        console.log("templating "+ename);
        var me = $(this), 
          selectors = eventField(me, e.selectors);
        me.html(templateFun(eventField(me, e.template, args), eventField(me, e.view, args), eventField(me, e.partials, args)));
        if (selectors) {
          applySelectors(me, selectors);
        }
      });
    } else if (typeof events[event] == "function") {
      self.bind(event, events[event]);
    }
  }
};