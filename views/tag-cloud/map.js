function(doc) {
  if (doc.type == "task") {
    doc.body.replace(/\#([\w\-\.]+)/g, function(tag, word) {
      emit([word.toLowerCase(), doc.created_at], doc)
    });
  }
}
