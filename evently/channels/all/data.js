function(resp) {
  return {
    channels : resp.rows.map(function(r) {
      var v = r.value;
      v.name_uri = encodeURIComponent(v.name);
      return v;
    })
  };
};
