$.couch.app(function(app) {

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

  // var tasks = {
  //   recent : {
  //     path : "/",
  //     template : app.ddoc.templates.tasks,
  //     items : { // this abstacts changes
  //       render : "prepend",
  //       view : "recent-tasks", // todo we can use the view to filter changes
  //       query : {
  //         limit : 25,
  //         descending : true
  //       },
  //       template : app.ddoc.templates.task,
  //       data : function(row) {
  //         var v = row.value;
  //         return {
  //           avatar_url : v.authorProfile && v.authorProfile.gravatar_url,
  //           body : $.linkify($.mustache.escape(r.value.body)),
  //           name : v.authorProfile && v.authorProfile.name,
  //           name_uri : v.authorProfile && encodeURIComponent(v.authorProfile.name),
  //           id : r.id
  //         };
  //       },
  //     }
  //   }
  // };
  
  
  var tasks = {
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
