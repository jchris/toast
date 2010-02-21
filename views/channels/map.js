function(doc) {
  if (doc.type == "channel") {
    emit(doc.name, doc);
  }
}
