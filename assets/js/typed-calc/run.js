(function() {
  document.getElementById('add-lambda-btn').onclick = function() {
    document.getElementById('code').value += 'λ';
  };
  document.getElementById('add-arrow-btn').onclick = function() {
    document.getElementById('code').value += '→';
  };
  document.getElementById('eval-btn').onclick = function() {
    var code = document.getElementById('code').value;
    var ast = null;
    var result = '';
    try {
      var ast = peg$parse(code);
      var diagnostics = Check(ast).diagnostics;

      if (diagnostics.length) {
        result = diagnostics.join('. ');
      } else {
        result = Eval(ast);
      }
    } catch (e) {
      result = 'Syntax error. Unable to parse the program.';
    }
    document.getElementById('result').innerText = result;
  };
})();
