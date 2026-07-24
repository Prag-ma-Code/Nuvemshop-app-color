(function () {
  var form = document.getElementById('teste-form');
  var result = document.getElementById('resultado-form');
  if (!form || !result) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nome = document.getElementById('nome');
    result.textContent = 'Ol\u00e1, ' + (nome ? nome.value : '') + '!';
  });
})();
