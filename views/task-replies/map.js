function(doc) {
  if (doc.type == "reply") {
    emit([doc.reply_to, doc.created_at], doc)
  }
}
