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
