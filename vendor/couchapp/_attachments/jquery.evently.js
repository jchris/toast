(function($) {
  // utility functions used in the implementation

  // thanks @wycats: http://yehudakatz.com/2009/04/20/evented-programming-with-jquery/
  var $$ = function(param) {
    var node = $(param)[0];
    var id = $.data(node);
    $.cache[id] = $.cache[id] || {};
    $.cache[id].node = node;
    return $.cache[id];
  };
  
  function forIn(obj, fun) {
    var name;
    for (name in obj) {
      if (obj.hasOwnProperty(name)) {
        fun(name, obj[name]);
      }
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

  $.evently = {
    connect : function(source, target, events) {
      events.forEach(function(e) {
        source.bind(e, function() {
          var args = $.makeArray(arguments);
          args.shift();
          target.trigger(e, args);
        });
      });
    },
    paths : []
  };
  
  $.fn.evently = function(events, app, init_args) {
    var elem = $(this);

    // setup the handlers onto elem
    forIn(events, function(name, h) {
      eventlyHandler(elem, app, name, h);
    });
    
    if (events.init) {
      elem.trigger("init", init_args);
    }
    
    // if the widget has a changes listener, 
    // connect it to the listener for its db
    
    app && connectToChanges(app, function() {
      // $.log('chnge')
      $("body").trigger("evently.changes");    
    });
  };
  
  // eventlyHandler applies the user's handler (h) to the 
  // elem, bound to trigger based on name.
  function eventlyHandler(elem, app, name, h) {
    if (h.path) {
      elem.pathbinder(name, h.path);
    }
    
    // templates, selectors, etc are intepreted
    // when our named event is triggered.
    elem.bind(name, function() {
      var args = $.makeArray(arguments);
      var me = $(this);
      var template = runIfFun(me, h.template, args);
      if (template) {
        templated(me, name, h);
      }
      var selectors = runIfFun(me, h.selectors, args);
      if (selectors) {
        applySelectors(me, selectors);
      }
      if (e.after) {
        e.after.apply(me, args);
      }
      if (e.changes) {
        setupChanges(me, app, e.changes, args);
      }
    });
    
    
    


    // 
    } else if (h.fun) {
      elem.bind(name, h.fun);        
    } else if (typeof h == "string") {
      elem.bind(name, function() {
        $(this).trigger(h);
      });
    } else if (typeof h == "function") {
      elem.bind(name, h);
    } else if ($.isArray(h)) { 
      // handle arrays recursively
      for (var i=0; i < h.length; i++) {
        eventlyHandler(elem, app, name, h[i]);
      };
    }
  };
  
  function templated(ctx, name, e) {
    $.log("template triggered", name, ctx)
    
    var args = $.makeArray(arguments);
    var me = $(this), selectors;
    if (e.template) {
      me.html($.mustache(
        runIfFun(me, e.template, args),
        runIfFun(me, e.data, args), 
        runIfFun(me, e.partials, args)));
    }
  };
  
  function applySelectors(me, selectors) {
    forIn(selectors, function(selector, bindings) {
      forIn(bindings, function(name, evs) {
        // $.log("bind "+name+" to "+selector);
        $(selector, me).bind(name, function() {
          var ev, self = $(this);
          if ($.isArray(evs)) {
            for (var i=0; i < evs.length; i++) {
              ev = evs[i];
              if (typeof ev == "function") {
                ev.apply(self, arguments);
              } else {
                self.trigger(ev);              
              }
            }
          } else {
            if (typeof evs == "function") {
              evs.apply(self, arguments);
            } else {
              self.trigger(evs);              
            }
          }
          return false;
        });
      });
    });
  };
  
  function changesQuery(me, app, c, args) {
    // $.log("changesQuery")
    var q = runIfFun(me, c.query, args);
    // $.log(q)
    var viewName = q.view;
    delete q.view;
    var userSuccess = q.success;
    delete q.success;
    q.success = function(resp) {
      // $.log("q.suc", resp)
      // here is where we handle the per-row templates
      var act = c.render || "append";
      if (c.template) {
        resp.rows.reverse().forEach(function(row) {
          var item = $($.mustache(
            runIfFun(me, c.template, [row]),
            runIfFun(me, c.data, [row]), 
            runIfFun(me, c.partials, [row])));
          selectors = runIfFun(me, c.selectors, [row]);
          if (selectors) {
            applySelectors(item, selectors);
          }
          me[act](item);
        });
      }
      userSuccess && userSuccess(resp);
    };
    // todo: scope this to a db
    $("body").bind("evently.changes", function() {
      // todo we can use the view to filter changes
      newRows(app, viewName, q);
      // todo delete other bindings?
      // todo make this a single callback per widget
    });
    newRows(app, viewName, q);
  }  

  function setupChanges(me, app, handler, args) {
    // $.log("setupChanges")
    // handler has fields:
    // render, query, template, data
    var c = runIfFun(me, handler, args);
    if (c.query) {
      // todo the initial setup might want to run slightly differently (use path info)
      changesQuery(me, app, c, args)
    } else {
      // just render the template with the data (which might be a fun)
    }
  };
  
  // this is for the items handler
  var lastViewId, highKey, inFlight;
  function newRows(app, view, opts) {
    // $.log(["newRows", arguments])
    // on success we'll set the top key
    var thisViewId, successCallback = opts.success, full = false;
    function successFun(resp) {
      inFlight = false;
      resp.rows = resp.rows.filter(function(r) {
        return r.key != highKey;
      });
      if (resp.rows.length > 0) {
        if (opts.descending) {
          highKey = resp.rows[0].key;
        } else {
          highKey = resp.rows[resp.rows.length -1].key;
        }
      };
      if (successCallback) successCallback(resp, full);
    };
    opts.success = successFun;
    
    if (opts.descending) {
      thisViewId = view + (opts.startkey ? opts.startkey.toSource() : "");
    } else {
      thisViewId = view + (opts.endkey ? opts.endkey.toSource() : "");
    }
    // $.log(["thisViewId",thisViewId])
    // for query we'll set keys
    if (thisViewId == lastViewId) {
      // we only want the rows newer than changesKey
      if (opts.descending) {
        opts.endkey = highKey;
        // opts.inclusive_end = false;
      } else {
        opts.startkey = highKey;
      }
      // $.log("more view stuff")
      if (!inFlight) {
        inFlight = true;
        app.view(view, opts);
      }
    } else {
      // full refresh
      // $.log("new view stuff")
      full = true;
      lastViewId = thisViewId;
      highKey = null;
      inFlight = true;
      app.view(view, opts);
    }
  };
  
  function connectToChanges(app, fun) {
    function resetHXR(x) {
      x.abort();
      connectToChanges(app, fun);    
    };
    app.db.info({success: function(db_info) {  
      var c_xhr = jQuery.ajaxSettings.xhr();
      c_xhr.open("GET", app.db.uri+"_changes?feed=continuous&since="+db_info.update_seq, true);
      c_xhr.send("");
      // todo use a timeout to prevent rapid triggers
      c_xhr.onreadystatechange = fun;
      setTimeout(function() {
        resetHXR(c_xhr);      
      }, 1000 * 60);
    }});
  };
  
})(jQuery);
