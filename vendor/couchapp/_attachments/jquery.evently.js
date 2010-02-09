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
    paths : [],
    changesDBs : {}
  };
  
  $.fn.evently = function(events, app, init_args) {
    var elem = $(this);

    // setup the handlers onto elem
    forIn(events, function(name, h) {
      eventlyHandler(elem, app, name, h);
    });
    
    if (events._init) {
      elem.trigger("_init");
    }
    
    if (app && events._changes) {
      $("body").bind("evently.changes."+app.db.name, function() {
        elem.trigger("_changes");        
      });
      followChanges(app);
      elem.trigger("_changes");
    }
  };
  
  // eventlyHandler applies the user's handler (h) to the 
  // elem, bound to trigger based on name.
  function eventlyHandler(elem, app, name, h) {
    if (h.path) {
      elem.pathbinder(name, h.path);
    }
    if (typeof h == "string") {
      elem.bind(name, function() {
        $(this).trigger(h, arguments);
      });
    } else if (typeof h == "function") {
      elem.bind(name, h);
    } else if ($.isArray(h)) { 
      // handle arrays recursively
      for (var i=0; i < h.length; i++) {
        eventlyHandler(elem, app, name, h[i]);
      };
    } else {
      // an object is using the evently / mustache template system
      if (h.fun) {
        elem.bind(name, h.fun);
      }
      // templates, selectors, etc are intepreted
      // when our named event is triggered.
      elem.bind(name, function() {
        var me = $(this);
        renderElement(me, app, h, arguments);
      });
    }
  };
  
  $.fn.replace = function(elem) {
    $(this).empty().append(elem);
  };
  
  // todo: ability to call this
  // to render and "prepend/append/etc" a new element to the host element (me)
  // as well as call this in a way that replaces the host elements content
  // this would be easy if there is a simple way to get at the element we just appended
  // (as html) so that we can attache the selectors
  function renderElement(me, app, h, args, qrun) {
    
    // if there's a query object we run the query,
    // and then call the data function with the response.
    if (h.query && !qrun) {
      // $.log("query before renderElement", arguments)
      runQuery(me, app, h, args)
    } else {
      // $.log("renderElement")
      // $.log(h, args, qrun)
      // otherwise we just render the template with the current args
      if (h.mustache) {
        var newElem = mustachioed(me, h, args);
        // $.log("mus",newElem)
        var act = h.render || "replace";
        me[act](newElem);
      }
      var selectors = runIfFun(me, h.selectors, args);
      if (selectors) {
        forIn(selectors, function(selector, handlers) {
          $(selector, me).evently(handlers, app, args);
        });
      }
      if (h.after) {
        h.after.apply(me, args);
      }
    }    
  };
  
  // todo this should return the new element
  function mustachioed(me, h, args) {
    return $($.mustache(
      runIfFun(me, h.mustache, args),
      runIfFun(me, h.data, args), 
      runIfFun(me, h.partials, args)));
  };
  
  function runQuery(me, app, h, args) {
    // $.log("runQuery: args", args)
    var qu = runIfFun(me, h.query, args);
    var qType = qu.type;
    var viewName = qu.view;
    var userSuccess = qu.success;
    // $.log("qType", qType)
    
    var q = {};
    forIn(qu, function(k, v) {
      q[k] = v;
    });
    
    if (qType == "newRows") {
      q.success = function(resp) {
        // $.log("runQuery newRows success", resp)
        resp.rows.reverse().forEach(function(row) {
          renderElement(me, app, h, [row], true)
        });
        userSuccess && userSuccess(resp);
      };
      newRows(app, viewName, q);
    } else {
      q.success = function(resp) {
        // $.log("runQuery success", resp)
        renderElement(me, app, h, [resp], true);
        userSuccess && userSuccess(resp);
      };
      app.view(viewName, q);      
    }
  }
  
  // function changesQuery(me, app, c, args) {
  //   $.log("setup changesQuery")
  //   var q = runIfFun(me, c.query, args);
  //   var viewName = q.view;
  //   delete q.view;
  //   var userSuccess = q.success;
  //   delete q.success;
  //   q.success = function(resp) {
  //     $.log("changesQuery success", resp)
  //     if (c.mustache) {
  // 
  //     }
  //     userSuccess && userSuccess(resp);
  //   };
  //   // todo: scope this to a db
  //   // $("body").bind("evently.changes", function() {
  //   //   // todo we can use the view to filter changes
  //   //   newRows(app, viewName, q);
  //   //   // todo delete other bindings?
  //   //   // todo make this a single callback per widget
  //   // });
  //   newRows(app, viewName, q);
  // }  

  // function setupChanges(me, app, handler, args) {
  //   $.log("setupChanges", handler)
  //   // handler has fields:
  //   // render, query, template, data
  //   var c = runIfFun(me, handler.changes, args);
  //   if (c.type == "newRows") {
  //     // todo the initial setup might want to run slightly differently (use path info)
  //     changesQuery(me, app, c, args)
  //   } else if (c.type == "document") {
  //     changesDoc(me, app, c, args)
  //   } else {
  //     // just the raw change row
  //     changesRaw(me, app, c, args)
  //   }
  // };
  
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
      thisViewId = view + (opts.startkey ? JSON.stringify(opts.startkey) : "");
    } else {
      thisViewId = view + (opts.endkey ? JSON.stringify(opts.endkey) : "");
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
  
  // only start one changes listener per db
  function followChanges(app) {
    var dbName = app.db.name;
    if (!$.evently.changesDBs[dbName]) {
      connectToChanges(app, function() {
        $("body").trigger("evently.changes."+dbName);
      });
      $.evently.changesDBs[dbName] = true;
    }
  }
  
  
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
