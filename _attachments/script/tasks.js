$.log = function() {
  console.log(arguments);
};
$.couch.app(function(app) {
  
  function tasksHandler(path, query) {
    // this is a kind of changes feed handler 
    // that works with at the row level
    // with views where the new changes we care about
    // will always appear at one end

    // type can be view, newRows, document, or info
    // if there is .query, default is view

    return {
      path : path,
      mustache : app.ddoc.templates.tasks,
      selectors : function(e, params) {
        
        var task_changes = {
          mustache : app.ddoc.templates.task,
          render : "prepend",
          // we want this query to be set during the event
          // that triggered the parent to be created,
          // not rebuilt each time based on changes as they come in
          query : query(e, params), 
          data : function(r) {
            // $.log("task data", arguments);
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
        };

        return {
          ul : {
            _changes : task_changes
          }
        } 
      }
    };
  }

  var tasks = {
    recent : tasksHandler("/", function(e, params) {
      return {
        view : "recent-tasks", 
        limit : 25,
        descending : true,
        type : "newRows"
      }
    }),
    tags : tasksHandler("/tags/:tag", function(e, params) {
      return {
        view : "tag-cloud",
        limit : 25,
        startkey : [params.tag, {}],
        endkey : [params.tag],
        reduce : false,
        descending : true,
        type : "newRows"
      };
    }),
    users : tasksHandler("/users/:name", function(e, params) {
      // $.log("users query", e, params);
      return {
        view : "users-tasks",
        limit : 25,
        startkey : [params.name, {}],
        endkey : [params.name],
        descending : true,
        type : "newRows"
      };
    }),
    mentions : tasksHandler("/mentions/:name", function(e, params) {
      // $.log("mentions query", e, params);
      return {
        view : "user-cloud",
        limit : 25,
        startkey : [params.name, {}],
        endkey : [params.name],
        descending : true,
        reduce : false,
        type : "newRows"
      };
    })
  };

  $("#tasks").evently(tasks, app);
  $.pathbinder.begin("/");
  
  var reply = {
    _init: {
      mustache : app.ddoc.templates.create_reply,
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
    _init: {
      mustache : app.ddoc.templates.replies,
      data : function(e, rows) {
        return {
          rows : rows.map(function(r) {
            // todo eliminate duplication here
            var v = r.value;
            return {
              avatar_url : v.authorProfile && v.authorProfile.gravatar_url,
              body : $.linkify($.mustache.escape(r.value.body)),
              name : v.authorProfile && v.authorProfile.name,
              name_uri : v.authorProfile && encodeURIComponent(v.authorProfile.name),
              id : r.id
            }
          })
        }
      } 
    }
  };
  
});
