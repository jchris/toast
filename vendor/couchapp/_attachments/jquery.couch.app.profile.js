// builds on $.couch.app.account to add user profile info

$.couch.app(function(app) {
  var t = app.ddoc.vendor.couchapp.templates.profile;
  
  function profileDocId(userCtx) {
    return "couch.app.profile:"+userCtx.name;
  };
  var userCtx; // we save this state in a closure when it's available
  $.couch.app.profile = {
    loggedIn : function(e, r) {
      userCtx = r.userCtx;
      var proid = profileDocId(userCtx), widget = $(this);
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
      template : t.logged_out
    },
    profileReady : {
      template : t.profile,
      view : function(e, p) {
        return {
          nickname : p.nickname,
          name : p.name,
          avatar_url : p.gravatar_url
        };
      }
    },
    
    noProfile : {
      template : t.no_profile,
      view : function() {
        return userCtx;
      },
      selectors : {
        "form" : {
          submit : [function() {
            // TODO this can be cleaned up with docForm
            var proid = profileDocId(userCtx), 
            newProfile = {
              _id : proid,
              type : "couch.app.profile",
              rand : Math.random().toString(),
              name : userCtx.name, 
              nickname : $("input[name=nickname]",this).val(),
              email : $("input[name=email]",this).val(),
              url : $("input[name=url]",this).val()
            }, widget = $(this);

            // setup gravatar_url
            if (typeof hex_md5 == "undefined") {
              alert("creating a profile requires md5.js to be loaded in the page");
              return;
            }
            
            newProfile.gravatar_url = 'http://www.gravatar.com/avatar/'+hex_md5(newProfile.email || newProfile.rand)+'.jpg?s=40&d=identicon'
            app.db.saveDoc(newProfile, {
              success : function() {
                app.db.openDoc(proid, {
                  success : function(doc) {
                    widget.trigger("profileReady", [doc]);
                  }
                });
              }
            })

          }]
        }
      }
    }
  };
});

