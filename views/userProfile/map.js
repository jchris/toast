function(doc) {
  if (doc.type == "userProfile") {
    emit(doc.name, doc);
  }
}
