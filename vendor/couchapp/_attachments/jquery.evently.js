(function($) {

  // functions for handling the path
  // thanks sammy.js
  var PATH_REPLACER = "([^\/]+)",
      PATH_NAME_MATCHER = /:([\w\d]+)/g,
      QUERY_STRING_MATCHER = /\?([^#]*)$/,
      _currentPath,
      _lastPath,
      _pathInterval;

  function pollPath(every) {
    function hashCheck() {        
      _currentPath = getPath();
      // path changed if _currentPath != _lastPath
      if (_lastPath != _currentPath) {
        setTimeout(function() {
          $(window).trigger('hashchange');
        }, 1);
      }
    };
    hashCheck();
    _pathInterval = setInterval(hashCheck, every);
    $(window).bind('unload', function() {
      clearInterval(_pathInterval);
    });
  }

  function triggerOnPath(path) {
    var pathSpec, path_params, params = {};
    for (var i=0; i < $.evently.paths.length; i++) {
      pathSpec = $.evently.paths[i];
      if ((path_params = pathSpec.matcher.exec(path)) != null) {
        path_params.shift();
        for (var i=0; i < path_params.length; i++) {
          params[pathSpec.param_names[i]] = decodeURIComponent(path_params[i])
        };
        pathSpec.callback(params);
        return;
      }
    };
  };

  function hashChanged() {
    _currentPath = getPath();
    // if path is actually changed from what we thought it was, then react
    if (_lastPath != _currentPath) {
      triggerOnPath(_currentPath);
    }
  }

  // bind the event
  $(function() {
    if ('onhashchange' in window) {
      // we have a native event
    } else {
      pollPath(10);
    }
    setTimeout(hashChanged,50);
    $(window).bind('hashchange', hashChanged);
  });

  function registerPath(pathSpec) {
    $.evently.paths.push(pathSpec);
  };

  function setPath(pathSpec, params) {
    var newPath = $.mustache(pathSpec.template, params);
    window.location = '#'+newPath;
    _lastPath = getPath();
  };
  
  function getPath() {
    var matches = window.location.toString().match(/^[^#]*(#.+)$/);
    return matches ? matches[1] : '';
  };

  function makePathSpec(self, name, path) {
    var param_names = []
    var template = ""
    
    PATH_NAME_MATCHER.lastIndex = 0;
    
    while ((path_match = PATH_NAME_MATCHER.exec(path)) != null) {
      param_names.push(path_match[1]);
    }

    return {
      param_names : param_names,
      matcher : new RegExp(path.replace(PATH_NAME_MATCHER, PATH_REPLACER) + "$"),
      template : path.replace(PATH_NAME_MATCHER, function(a, b) {
        return '{{'+b+'}}';
      }),
      callback : function(params) {
        self.trigger(name, [params]);
      }
    };
  };

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
  
  $.fn.evently = function(events, options) {

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
      if (e.path) {
        var pathSpec = makePathSpec(self, name, e.path);
        self.bind(name, function(ev, params) {
          // set the path when triggered
          setPath(pathSpec, params);
        });
        // trigger when the path matches
        registerPath(pathSpec);
      }
      if (e.template) {
        templated(self, name, e);
      } else if (e.fun) {
        self.bind(name, e.fun);        
      } else if (typeof e == "string") {
        self.bind(name, function() {
          $(this).trigger(e);
        });
      } else if (typeof e == "function") {
        self.bind(name, e);
      } else if ($.isArray(e)) { 
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

    function templated(ctx, name, e) {
      ctx.bind(name, function() {
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
})(jQuery);
