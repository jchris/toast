function(doc) {
  if (doc.type == "task" && doc.state != "done") {
    emit(doc.created_at, doc)
  }
}
