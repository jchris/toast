function(doc) {
  if (doc.type == "user-profile") {
    emit(doc.userCtx.name, doc);
  }
}
