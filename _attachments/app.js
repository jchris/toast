function escapeHTML(st) {                                       
  return(                                                                 
    st.replace(/&/g,'&amp;').                                         
      replace(/>/g,'&gt;').                                           
      replace(/</g,'&lt;').                                           
      replace(/"/g,'&quot;')                                         
  );                                                                     
};

function safeHTML(st, len) {
  return escapeHTML(st.substring(0,len));
}

function linkify(body, term) {
  return body.replace(/https?\:\/\/\S+/g,function(a) {
    return '<a target="_blank" href="'+a+'">'+a+'</a>';
  }).replace(/\@([\w\-]+)/g,function(user,name) {
    return '<a target="_blank" href="http://twitter.com/'+name+'">'+user+'</a>';
  }).replace(/\#([\w\-]+)/g,function(word,term) {
    return '<a target="_blank" href="http://search.twitter.com/search?q='+encodeURIComponent(term)+'">'+word+'</a>';
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

function joinRoom(app, name) {
  
};