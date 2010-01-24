$.couch.app(function(app) {
  // setup the account widget
  // first we customize a template for Toast
  $.couch.app.account.loggedIn.template = 'Toasty ' + $.couch.app.account.loggedIn.template;
  // now launch the evently widget.
  $("#userCtx").evently($.couch.app.account);
  $("#userCtx").trigger("refresh");
  
  $("#new_channel").submit(function() {
    var cname = $('#name').val();
    // return false;
    $('body').append('<a href="channel.html#'+encodeURIComponent(cname)+'">redirect</a>');
    var absurl = $('body a:last')[0].href;
    document.location = absurl;
    return false;
  });
  var chatApp = $.sammy(function() {
    this.debug = true;
    this.element_selector = '#chat';

    // populate the default channel list
    // link to channels

    this.get("#/", function() {
      this.log("fucking a")
      // todo use mustache.js for partials
      app.view("channels",{group_level: 1, success: function(json) {
        $("#chat").append('<ul id="channels"></ul>');
        $("#chat #channels").html(json.rows.map(function(row) {
          return '<li><a href="#/channel/'+ 
          encodeURIComponent(row.key[0])
          +'">'+escapeHTML(row.key[0])+'</a> '+row.value+' messages</li>';
        }).join(''));
      }});
    });

    // this.get('#/', function(e) {
    //   showLoader();
    //   this.partial('templates/index.html.erb', function(t) {
    //     this.app.swap(t);
    //     Preso.all(function(presos) {
    //       e.presos = presos;
    //       e.partial('templates/_presos.html.erb', function(p) {
    //         $('#presos').append(p);
    //         Slide.setCSS({width: 300, height: 300});
    //       });
    //     });
    //   });
    // });

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

function joinChannel(app, cname) {
  $('h1').text('Toast - ' + cname);

// let's keep this stuff in a user preference document
  // $("#author-name").val($.cookies.get("name"));
  // $("#author-email").val($.cookies.get("email"));
  // var authorRand =  $.cookies.get("rand") || Math.random().toString();
  // $("#author-url").val($.cookies.get("url"));
  var authorRand =  Math.random().toString();
  
  $("#new_message").submit(function() {
    var name, email, url, body;
    name = $("#author-name").val();
    email = $("#author-email").val();
    url = $("#author-url").val();
    // $.cookies.set("name", name);
    // $.cookies.set("email", email);
    // $.cookies.set("url", url);
    // $.cookies.set("rand", authorRand);
    body = $("#message").val();
    if (body) {
      var message = {
        author: {
          name : name,
          email :(email||authorRand),
          url :url
        },
        date : new Date(),
        body : body
      };
      app.db.saveDoc({channel:cname,message:message});
      $("#message").val('');
    }
    return false;
  });
  // this is where we hang on the continuous _changes api
  // get the raw xhr
  refreshView(app, cname);
  connectToChanges(app, function() {
    refreshView(app, cname);
  });
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

