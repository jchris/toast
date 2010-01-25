$.couch.app(function(app) {
  var userProfile = {}, currentChannel = null;  
  
  function loggedIn(e, resp) {
    // get the user profile doc
    app.view("user-profiles", {
      key : resp.userCtx.name, success : function(view) {
        if (view.rows.length == 0) {
          // no profile yet        
          userProfile = {
            authorRand :  Math.random().toString(),
            userCtx : resp.userCtx
          };
          $("#new_message").trigger("newProfile");
        } else if (view.rows.length == 1) {
          // populate the form with the profile
          userProfile = view.rows[0].value;
          $("#new_message").trigger("newProfile");
        } else {
          // some kind of collision
          // todo create a ui for picking your profile
          // from the available list
          userProfile = {};
          $("#new_message").trigger("newProfile");
          alert("More than one profile for "+resp.userCtx.name+". Please resolve.")
        }
    }});
    // prefill the form
    // preview gravatar
    // copy gravatar to profile doc:
    // http://stackoverflow.com/questions/934012/get-image-data-in-javascript
  };
  
  
  function loggedOut(e) {
    userProfile = {};
    $("#new_message").trigger("newProfile");
  };
  // setup the account widget
  // first we customize a template for Toast
  $.couch.app.account.loggedIn.template = 'Toasty ' + $.couch.app.account.loggedIn.template;
  // now launch the evently widget.
  $.couch.app.account.loggedIn = [$.couch.app.account.loggedIn, loggedIn]
  
  $("#userCtx").evently($.couch.app.account);
  
  // todo move this to an evently handler
  $("#new_channel").submit(function() {
    var cname = $('#name').val();
    // return false;
    $('body').append('<a href="channel.html#'+encodeURIComponent(cname)+'">redirect</a>');
    var absurl = $('body a:last')[0].href;
    document.location = absurl;
    return false;
  });
  
  $("#new_message").evently({
    submit : [function(e) {
      e.preventDefault();
      // maybe update userProfile doc
      // create doc if needed
      var name, email, url;
      name = $("#author-name").val();
      email = $("#author-email").val();
      url = $("#author-url").val();
      if (name == userProfile.name &&
        email == userProfile.email &&
        url == userProfile.url) {
          // no changes, ignore
      } else {
        userProfile.name = name;
        userProfile.email = email;
        userProfile.url = url;
        app.db.saveDoc(userProfile);
      }
      return false;
    },
    function() {
      // post new_message
      var name, email, url, body;
      name = $("#author-name").val();
      email = $("#author-email").val();
      url = $("#author-url").val();
      body = $("#message").val();
      if (body) {
        var message = {
          author: {
            name : name,
            email : email,
            url :url,
            authorRand : userProfile.authorRand
          },
          date : new Date(),
          body : body
        };
        app.db.saveDoc({
          channel : currentChannel,
          message : message
        }, { 
          success : function() {
            $("#message").val('');          
          }
        });
      }
      return false;
    }],
    newProfile : function(e) {
      // update the form with the new profile info
      // setup the channel form based on the user profile
      $("#author-name", this).val(userProfile.name);
      $("#author-email", this).val(userProfile.email);
      $("#author-url", this).val(userProfile.url);
    }
  });
  
  var templates = {
    channel_list : '<ul id="channels"></ul>', // todo use partial
    li_channel : '<li><a href="{{link}}">{{name}}</a> {{count}} messages</li>',
    index : {
      title : 
      '<a href="#/">Toast</a> Chat, powered by <a href="http://apache.couchdb.org">Apache CouchDB</a>',
      title_tag : "Toast Chat powered by Apache CouchDB"
      
    },
    channel : {
      title : 
      '<a href="#/">Toast</a> :: {{channel}}'
    }
  }
  
  var chatApp = $.sammy(function() {
    this.debug = true;
    this.element_selector = '#chat';
    this.use(Sammy.Mustache, 'mustache');
    

    // populate the default channel list
    // link to channels

    this.helpers({
      listChannels : function(fun) {
        app.view("channels", {group_level: 1, success: function(json) {
          fun(json);
        }});
      }
    })

    this.get("#/", function(e) {
      $('h1').html($.mustache(templates.index.title));
      document.title = templates.index.title_tag;
      
      this.listChannels(function(json) {
        e.channels = json.rows.map(function(row) {
          return {
            link : "#/channel/" + encodeURIComponent(row.key[0]),
            name : row.key[0],
            count : row.value
          };
        });
        
        e.partial('templates/channels.html.mustache', e, function(t) {
          this.app.swap(t);
        });
      });

      // setup footer
      $("#new_message").hide();
      $("#new_channel").show();
    });

    this.get("#/channel/:channel", function(e) {
      var channel = this.params.channel;
      currentChannel = channel;
      $('h1').html($.mustache(templates.channel.title, {
        channel : channel
      }));
      document.title = "Toast :: "+channel;
      
      // setup the channel viewer      
      e.partial('templates/channel.html.mustache', e, function(t) {
        this.app.swap(t);
      });
      // view channel and append new junks
      // setup changes consumer to keep doing that
      
      joinChannel(app, this.params.channel);
      // setup footer
      $("#new_channel").hide();
      $("#new_message").show();
    });

    function joinChannel(app, cname) {

    // let's keep this stuff in a user preference document
      // $("#author-name").val($.cookies.get("name"));
      // $("#author-email").val($.cookies.get("email"));
      // var authorRand =  $.cookies.get("rand") || Math.random().toString();
      // $("#author-url").val($.cookies.get("url"));

      // attach 2 events to this form submit,
      // the sender but first save some data
      // to the profile doc


      // this is where we hang on the continuous _changes api
      // get the raw xhr
      refreshView(app, cname);
      connectToChanges(app, function() {
        refreshView(app, cname);
      });
    };

  });
  
  chatApp.run('#/');
  
});


function refreshView(app, cname) {
  app.view("channels",{
    reduce: false, 
    startkey : [cname,{}],
    endkey : [cname],
    descending: true,
    limit : 25,
    success: function(json) {
    $("#messages").html(json.rows.map(function(row) {
      var m = row.value;
      return '<li>'
        + '<img class="gravatar" src="http://www.gravatar.com/avatar/'+row.value.author.gravatar+'.jpg?s=40&d=identicon"/><span class="say"><strong>'
        + (m.author.url ? 
          '<a href="'+
          escapeHTML(m.author.url) 
          +'">'+
          m.author.name
          +'</a>'
          : m.author.name)
        + "</strong>: "
        + linkify(m.body)
        + '</span> <br/><a class="perma" href="'+app.showPath('toast',row.id)+'">'+( m.date || 'perma')+'</a><br class="clear"/></li>';
    }).join(''));
  }});
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
    c_xhr.onreadystatechange = fun;
    setTimeout(function() {
      resetHXR(c_xhr);      
    }, 1000 * 60);
  }});
};

