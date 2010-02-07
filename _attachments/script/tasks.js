$.log = function() {
  // console.log(arguments);
};
$.couch.app(function(app) {
  
  function tasksHandler(path, query) {
    return {
      path : path,
      template : app.ddoc.templates.tasks,
      changes : {
        template : app.ddoc.templates.task,
        render : "prepend",
        query : query,
        data : function(r) {
          var v = r.value;
          return {
            avatar_url : v.authorProfile && v.authorProfile.gravatar_url,
            body : $.linkify($.mustache.escape(r.value.body)),
            name : v.authorProfile && v.authorProfile.name,
            name_uri : v.authorProfile && encodeURIComponent(v.authorProfile.name),
            id : r.id // todo this should be handled in dom-land / evently
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
              $("div.reply",li).evently(reply);
              return false;            
            }
          }
        }
      }
    };
  };

  var tasks = {
    recent : tasksHandler("/", {
      view : "recent-tasks", 
      limit : 25,
      descending : true
    }),
    tags : tasksHandler("/tags/:tag", function(e, params) {
      // $.log("tags query", e, params);
      return {
        view : "tag-cloud",
        limit : 25,
        startkey : [params.tag, {}],
        endkey : [params.tag],
        reduce : false,
        descending : true
      }
    }),
    users : tasksHandler("/users/:name", function(e, params) {
      // $.log("users query", e, params);
      return {
        view : "users-tasks",
        limit : 25,
        startkey : [params.name, {}],
        endkey : [params.name],
        descending : true
      }
    }),
    mentions : tasksHandler("/mentions/:name", function(e, params) {
      // $.log("mentions query", e, params);
      return {
        view : "user-cloud",
        limit : 25,
        startkey : [params.name, {}],
        endkey : [params.name],
        descending : true,
        reduce : false
      }
    })
  };

  $("#tasks").evently(tasks, app);
  
  
  var oldtasks = {
    init : "index",
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
          body : $.linkify($.mustache.escape(r.value.body)),
          name : v.authorProfile && v.authorProfile.name,
          name_uri : v.authorProfile && encodeURIComponent(v.authorProfile.name),
          id : r.id
        }));
        ul.prepend(li);
        $('a[href=#done]', li).click();
        $('a[href=#reply]', li).click(function() {
        });
      });
    }
  };
  
  
});
