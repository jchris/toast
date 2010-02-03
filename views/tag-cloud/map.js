function(doc) {
  if (doc.type == "task") {
    doc.body.replace(/\#([\w\-\.]+)/g, function(word) {
      emit(word.toLowerCase(), 1)
    });
  }
}
