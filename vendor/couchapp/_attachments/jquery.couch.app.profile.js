// builds on $.couch.app.account to add user profile info

jQuery(function($) {
  $.couch.app(function(app) {
    function profileDocId(userCtx) {
      return "couch.app.profile:"+userCtx.name;
    };
    
    $.couch.app.profile = {
      loggedIn : function(e, r) {
        var proid = profileDocId(r.userCtx), widget = $(this);
        app.db.openDoc(proid, {
          success : function(doc) {
            widget.trigger("profileReady", [doc]);
          },
          error : function() {
            widget.trigger("noProfile");
          }
        });
      },
      loggedOut : {
        template : '<p>Please log in</p>'
      },
      profileReady : {
        template : '<p><img src="{{{image_url}}}"/>Hello {{name}}</p>',
        view : function(e, profile) {
          return profile;
        }
      },
      noProfile : {
        template : '<form id="user_profile">Create a User Profile <input type="submit" value="Go &rarr;"/></form>',
        selectors : {
          "form" : {
            submit : [function() {
              alert("you created a profile")
            }]
          }
        }
      }
    };
  });
});
