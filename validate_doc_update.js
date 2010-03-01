function (newDoc, oldDoc, userCtx) {
  function forbidden(message) {    
    throw({forbidden : message});
  };
  
  function unauthorized(message) {
    throw({unauthorized : message});
  };

  if (userCtx.roles.indexOf('_admin') == -1) {
    // admin can edit anything, only check when not admin...
    if (!newDoc.author || !newDoc.author.name) {      
      forbidden("Docs must have an author with a name");     
    }
    // you can't lie about authorship
    if (newDoc.author.name != userCtx.name) {
      forbidden("You may only update your own docs.");     
    }
    // you can only update your own docs
    
    if (newDoc._deleted) 
      forbidden("You may not delete a doc.");     
  }
};
