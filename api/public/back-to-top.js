(function () {
  var wrapper = document.createElement('div');
  wrapper.style.textAlign = 'center';
  wrapper.style.padding = '8px 0';

  var btn = document.createElement('button');
  btn.textContent = 'Voltar ao topo';
  btn.setAttribute('aria-label', 'Voltar ao topo');
  Object.assign(btn.style, {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '0',
    opacity: '0',
    transform: 'translateY(10px)',
    transition: 'opacity 0.3s, transform 0.3s',
    pointerEvents: 'none',
  });

  wrapper.appendChild(btn);
  document.body.appendChild(wrapper);

  window.addEventListener('scroll', function () {
    var show = window.scrollY > 400;
    btn.style.opacity = show ? '1' : '0';
    btn.style.transform = show ? 'translateY(0)' : 'translateY(10px)';
    btn.style.pointerEvents = show ? 'auto' : 'none';
  });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
