$.couch.app(function(app) {
  var since_seq = 0;
  var userProfile;
  // todo, use the templates ddoc object for this.
  
  $.couch.app.profile.loggedOut.template = app.ddoc.templates.logged_out;
  
  $.couch.app.profile.profileReady.template = app.ddoc.templates.create_task;

  $.couch.app.profile.profileReady.selectors = {
    form : {
      submit : function() {
        var texta = $("textarea[name=body]", this);
        var newTask = {
          body : texta.val(),
          type : "task",
          created_at : new Date(),
          authorProfile : userProfile
        };
        app.db.saveDoc(newTask, {
          success : function() {
            texta.val('');
          }
        });
        return false;
      }
    }
  };

  $.couch.app.profile.profileReady.after = function(e, profile) {
    // userProfile is in the outer closure
    userProfile = profile;
  };
  
  $("#profile").evently($.couch.app.profile);

  // link the widgets
  $.evently.connect($("#account"), $("#profile"), ["loggedIn", "loggedOut"]);
  
  // setup the account widget
  $("#account").evently($.couch.app.account);
  
  // todo move to a plugin somewhere
  function linkify(body) {
    return body.replace(/((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/gi,function(a) {
      return '<a target="_blank" href="'+a+'">'+a+'</a>';
    }).replace(/\@([\w\-]+)/g,function(user,name) {
      return '<a href="#/mentions/'+encodeURIComponent(name)+'">'+user+'</a>';
    }).replace(/\#([\w\-\.]+)/g,function(word,tag) {
      return '<a href="#/tags/'+encodeURIComponent(tag)+'">'+word+'</a>';
    });
  };
  
  var reply = {
    init : {
      template : app.ddoc.templates.create_reply,
      selectors : {
        form : {
          submit : function() {
            var texta = $("textarea[name=body]", this);
            var li = $(this).parents("li");
            var task_id = li.attr("data-id");
            // todo extract to model layer?
            var newReply = {
              reply_to : task_id,
              body : texta.val(),
              type : "reply",
              created_at : new Date(),
              authorProfile : userProfile
            };
            app.db.saveDoc(newReply, {
              success : function() {
                texta.val('');
              }
            });            
            return false;
          }
        }
      }
    }
  };
  
  var replies = {
    init : {
      template : app.ddoc.templates.replies,
      view : function(e, rows) {
        return {
          rows : rows.map(function(r) {
            // todo eliminate duplication here
            var v = r.value;
            return {
              avatar_url : v.authorProfile && v.authorProfile.gravatar_url,
              body : linkify($.mustache.escape(r.value.body)),
              name : v.authorProfile && v.authorProfile.name,
              name_uri : v.authorProfile && encodeURIComponent(v.authorProfile.name),
              id : r.id
            }
          })
        }
      } 
    }
  };
  
  var lastViewId, highKey, inFlight;
  function newRows(view, opts) {
    console.log(["newRows", arguments])
    // on success we'll set the top key
    var thisViewId, successCallback = opts.success, full = false;
    function successFun(resp) {
      inFlight = false;
      if (resp.rows.length > 0) {
        if (opts.descending) {
          highKey = resp.rows[0].key;
        } else {
          highKey = resp.rows[resp.rows.length -1].key;
        }
      };
      resp.rows = resp.rows.filter(function(a,b) {
        return a.key != b.key;
      });
      if (successCallback) successCallback(resp, full);
    };
    opts.success = successFun;
    
    if (opts.descending) {
      thisViewId = view + (opts.startkey ? opts.startkey.toSource() : "");
    } else {
      thisViewId = view + (opts.endkey ? opts.endkey.toSource() : "");
    }
    console.log(["thisViewId",thisViewId])
    // for query we'll set keys
    if (thisViewId == lastViewId) {
      // we only want the rows newer than changesKey
      if (opts.descending) {
        opts.endkey = highKey;
        // opts.inclusive_end = false;
      } else {
        opts.startkey = highKey;
      }
      console.log("more view stuff")
      if (!inFlight) {
        inFlight = true;
        app.view(view, opts);
      }
    } else {
      // full refresh
      console.log("new view stuff")
      full = true;
      lastViewId = thisViewId;
      highKey = null;
      inFlight = true;
      app.view(view, opts);
    }
  };
  
  var tasks = {
    // init : "index",
    refresh : "index",
    index : {
      path : "/",
      fun: function() {
        var widget = $(this);
        // query from highest key        
        newRows("new-tasks", {
          limit : 25,
          descending : true,
          success : function(resp, full) {
            widget.trigger("redraw", [resp.rows, full]);              
          }
        });
      }
    },
    by_tag : {
      path : "/tags/:tag",
      fun : function(e, params) {
        var widget = $(this);
        app.view("tag-cloud", {
          limit : 25,
          startkey : [params.tag, {}],
          endkey : [params.tag],
          reduce : false,
          descending : true,
          success : function(resp) {
            widget.trigger("redraw",[resp.rows]); 
          }
        });
      }
    },
    by_user : {
      path : "/users/:name",
      fun : function(e, params) {
        var widget = $(this);
        // var name = $("#account").attr("data-name");
        app.view("users-tasks", {
          limit : 25,
          startkey : [params.name, {}],
          endkey : [params.name],
          descending : true,
          success : function(resp) {
            widget.trigger("redraw",[resp.rows]); 
          }
        });
      }
    },
    by_mentions : {
      path : "/mentions/:name",
      fun : function(e, params) {
        var widget = $(this);
        app.view("user-cloud", {
          limit : 25,
          startkey : [params.name, {}],
          endkey : [params.name],
          reduce : false,
          descending : true,
          success : function(resp) {
            widget.trigger("redraw", [resp.rows]); 
          }
        });
      }
    },
    redraw : function(e, rows, full) {
      if (full) {
        $(this).html($.mustache(app.ddoc.templates.tasks));
      }
      var ul = $("ul", this);
      rows.reverse().forEach(function(r) {
        var v = r.value;        
        var li = $($.mustache(app.ddoc.templates.task,{
          avatar_url : v.authorProfile && v.authorProfile.gravatar_url,
          body : linkify($.mustache.escape(r.value.body)),
          name : v.authorProfile && v.authorProfile.name,
          name_uri : v.authorProfile && encodeURIComponent(v.authorProfile.name),
          id : r.id
        }));
        ul.prepend(li);
        $('a[href=#done]', li).click(function() {
          var li = $(this).parents("li");
          var task_id = li.attr("data-id");
          app.db.openDoc(task_id, {
            success : function(doc) {
              doc.state = "done";
              doc.done_by = $("#account").attr("data-name");
              doc.done_at = new Date();
              app.db.saveDoc(doc, {
                success : function() {
                  li.addClass("done");
                  li.slideUp("slow");
                }
              });
            }
          });
          return false;
        });
        $('a[href=#reply]', li).click(function() {
          var li = $(this).parents("li");
          $("div.reply",li).evently(reply);
          return false;
        });
      });
    }
  };
  
  var tagcloud = {
    init : "refresh",
    refresh : function() {
      var tagcloud = $(this);
      app.view("tag-cloud", {
        group_level : 1,
        success : function(resp) {
          tagcloud.trigger("redraw", [resp.rows]);
        }
      });
    },
    redraw : {
      template : app.ddoc.templates.tag_cloud,
      view : function(e, rows) {
        var tags =  rows.map(function(r) {
          return {
            tag : r.key,
            // todo use a new mustache delimiter for this
            tag_uri : encodeURIComponent(r.key),
            count : r.value * 10
          }
        });
        return {tags:tags};
      }
    }
  };

  var usercloud = {
    init : "refresh",
    refresh : function() {
      var usercloud = $(this);
      app.view("user-cloud", {
        group_level : 1,
        success : function(resp) {
          usercloud.trigger("redraw", [resp.rows]);
        }
      });
    },
    redraw : {
      template : app.ddoc.templates.user_cloud,
      view : function(e, rows) {
        var users =  rows.map(function(r) {
          return {
            user : r.key,
            // todo use a new mustache delimiter for this
            user_uri : encodeURIComponent(r.key),
            count : r.value * 10
          }
        });
        return {users:users};
      }
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
  
  $("#tasks").evently(tasks);
  $("#tagcloud").evently(tagcloud);
  $("#usercloud").evently(usercloud);
  
  connectToChanges(app, function() {
    $("#tasks").trigger("refresh");
    $("#tagcloud").trigger("refresh");
    $("#usercloud").trigger("refresh");
  });
  
});
