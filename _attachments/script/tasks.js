$.couch.app(function(app) {

  var tasks = {
    recent : {
      path : "/",
      template : app.ddoc.templates.tasks,
      changes : { // this abstacts _changes
        template : app.ddoc.templates.task,
        render : "prepend",
        query : {
          view : "recent-tasks", // todo we can use the view to filter changes
          limit : 25,
          descending : true
        },
        data : function(row) {
          var v = row.value;
          return {
            avatar_url : v.authorProfile && v.authorProfile.gravatar_url,
            body : $.linkify($.mustache.escape(r.value.body)),
            name : v.authorProfile && v.authorProfile.name,
            name_uri : v.authorProfile && encodeURIComponent(v.authorProfile.name),
            id : r.id // todo this should be handled in dom-land / evently
          };
        },
      }
    }
  };
  
  
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
  
  $("#tasks").evently(tasks);
  
});
