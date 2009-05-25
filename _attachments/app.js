function escapeHTML(st) {                                       
  return(                                                                 
    st && st.replace(/&/g,'&amp;').                                         
      replace(/>/g,'&gt;').                                           
      replace(/</g,'&lt;').                                           
      replace(/"/g,'&quot;')                                         
  );                                                                     
};

function safeHTML(st, len) {
  return st ? escapeHTML(st.substring(0,len)) : '';
}

function linkify(body, term) {
  return body.replace(/https?\:\/\/\S+/g,function(a) {
    return '<a target="_blank" href="'+a+'">'+a+'</a>';
  }).replace(/\@([\w\-]+)/g,function(user,name) {
    return '<a target="_blank" href="http://twitter.com/'+name+'">'+user+'</a>';
  }).replace(/\#([\w\-]+)/g,function(word,term) {
    return '<a href="#'+encodeURIComponent(term)+'">'+word+'</a>';
  });
};

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

  $("#author-name").val($.cookies.get("name"));
  $("#author-email").val($.cookies.get("email"));
  var authorRand =  $.cookies.get("rand") || Math.random().toString();
  $("#author-url").val($.cookies.get("url"));
  $("#new_message").submit(function() {
    var name, email, url, body;
    name = $("#author-name").val();
    email = $("#author-email").val();
    url = $("#author-url").val();
    $.cookies.set("name", name);
    $.cookies.set("email", email);
    $.cookies.set("url", url);
    $.cookies.set("rand", authorRand);
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
  app.db.info({success: function(db_info) {
    c_xhr = jQuery.ajaxSettings.xhr();
    c_xhr.open("GET", app.db.uri+"_changes?continuous=true&since="+db_info.update_seq, true);
    c_xhr.send("");
    c_xhr.onreadystatechange = function() {
      refreshView(app, cname);
    };        
  }});
};