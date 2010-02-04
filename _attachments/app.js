$.couch.app(function(app) {
  var since_seq = 0;

  // todo, use the templates ddoc object for this.
  
  $.couch.app.profile.loggedOut.template = '<p>Please log in to add tasks.</p>';
  
  $.couch.app.profile.profileReady.template = 
  [ '<div class="avatar"><img src="{{{avatar_url}}}"/><div class="name">{{nickname}}</div></div>',
    '<form><textarea name="body" cols="80" rows="3"></textarea><br/>',
    '<input type="submit" value="New Task &rarr;"></form><br class="clear"/>'
  ].join(' ');

  // we use a custom callback to handle the form submission
  $.couch.app.profile.profileReady.after = function(e, profile) {
    // todo use evently here
    $("form", this).submit(function() {
      var texta =  $("textarea[name=body]", this);
      var newTask = {
        body : texta.val(),
        type : "task",
        created_at : new Date(),
        authorProfile : profile
      };
      app.db.saveDoc(newTask, {
        success : function() {
          texta.val('');
          $("#tasks").trigger("refresh");
        }
      });
      return false;
    });
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
      return '<a href="#/users/'+encodeURIComponent(name)+'">'+user+'</a>';
    }).replace(/\#([\w\-\.]+)/g,function(word,tag) {
      return '<a href="#/tags/'+encodeURIComponent(tag)+'">'+word+'</a>';
    });
  };
  
  // todo move this to ddoc templates
  var task_li = [
  '<ul>{{#tasks}}<li data-id="{{{id}}}">',
  '<div class="avatar"><img src="{{{avatar_url}}}"/><a class="name">{{name}}</a></div>',
  '<div class="body">{{{body}}}</div><div class="react">',
  '<a href="#reply">reply</a> <a href="#mute">mute</a> <a href="#done">done!</a></div>',
  '<br class="clear"/></li>{{/tasks}}</ul>'].join(' ');
  
  var tasks = {
    init : "refresh",
    refresh : {
      path : "/",
      fun: function() {
        var widget = $(this);
        app.view("new-tasks", {
          limit : 25,
          descending : true,
          success : function(resp) {
            widget.trigger("redraw",[resp.rows]); 
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
    redraw : {
      template : task_li,
      view : function(e, rows) {
        return {
          tasks : rows.map(function(r) {
            var v = r.value;
            return {
              avatar_url : v.authorProfile && v.authorProfile.gravatar_url,
              body : linkify($.mustache.escape(r.value.body)),
              name : v.authorProfile && v.authorProfile.name,
              id : r.id
            }
          })
        };
      },
      selectors : {
        'a[href=#done]' : {
          click : function() {
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
          }
        },
        'a[href=#reply]' : {
          click : function() {
            var li = $(this).parents("li");
            // append the reply form to the li
            li.append("<p>Leave a reply:</p>")
          }
        }
      }
    }
  };
  
  var browse = {
    init : "refresh",
    refresh : function() {
      var browse = $(this);
      app.view("tag-cloud", {
        group_level : 1,
        success : function(resp) {
          browse.trigger("redraw", [resp.rows]);
        }
      });
    },
    redraw : {
      template :
      '{{#tags}}<a style="font-size:{{{count}}}px;" href="#/tags/{{{tag_uri}}}">#{{tag}}</a> {{/tags}}',
      view : function(e, rows) {
        var tags =  rows.map(function(r) {
          return {
            tag : r.key,
            tag_uri : encodeURIComponent(r.key),
            count : r.value * 10
          }
        });
        return {tags:tags};
      }
    }
  }
  
  $.evently.connect($("#tasks"), $("#browse"), ["refresh"]);
  $("#tasks").evently(tasks);
  $("#browse").evently(browse);
  
  function connectToChanges(app, fun) {
    function resetHXR(x) {
      x.abort();
      connectToChanges(app, fun);    
    };
    app.db.info({success: function(db_info) {  
      var c_xhr = jQuery.ajaxSettings.xhr();
      c_xhr.open("GET", app.db.uri+"_changes?feed=continuous&since="+db_info.update_seq, true);
      c_xhr.send("");
      c_xhr.onreadystatechange = fun;
      setTimeout(function() {
        resetHXR(c_xhr);      
      }, 1000 * 60);
    }});
  };
  
  connectToChanges(app, function() {
    $("#tasks").trigger("refresh");
  });
  
});
