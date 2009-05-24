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