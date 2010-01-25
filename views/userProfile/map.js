function(doc) {
  if (doc.type == "userProfile") {
    emit(doc.userCtx.name, doc);
  }
}
