function(doc) {
  if (doc.type == "task" && doc.state != "done" && doc.authorProfile && doc.authorProfile.name) {
    emit([doc.authorProfile.name, doc.created_at], doc)
  }
}
