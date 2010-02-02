function (newDoc, oldDoc, userCtx) {
  function forbidden(message) {    
    throw({forbidden : message});
  };
  
  function unauthorized(message) {
    throw({unauthorized : message});
  };

  if (userCtx.roles.indexOf('_admin') == -1) {
    // admin can edit anything, only check when not admin...
    if (newDoc._deleted) 
      forbidden("You may not delete a doc.");     
  }
};
