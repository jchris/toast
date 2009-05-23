function(doc, req) {
  // !code helpers/template.js
  // !json templates
  
  respondWith(req, {
    html : function() {
      var html = template(lib.templates.example, doc);
      return {body:html}
    },
    xml : function() {
      return {
        body : <xml><node value={doc.title}/></xml>
      }
    }
  })
};