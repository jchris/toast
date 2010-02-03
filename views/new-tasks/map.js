function(doc) {
  if (doc.type == "task") {
    emit(doc.created_at, doc)
  }
}
