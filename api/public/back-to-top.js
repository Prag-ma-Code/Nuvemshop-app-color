(function () {
  var btn = document.createElement('button');
  btn.textContent = '\u2191';
  btn.setAttribute('aria-label', 'Voltar ao topo');
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    background: '#4f46e5',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    opacity: '0',
    transform: 'translateY(20px)',
    transition: 'opacity 0.3s, transform 0.3s',
    zIndex: '9999',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  });
  document.body.appendChild(btn);

  window.addEventListener('scroll', function () {
    var show = window.scrollY > 400;
    btn.style.opacity = show ? '1' : '0';
    btn.style.transform = show ? 'translateY(0)' : 'translateY(20px)';
    btn.style.pointerEvents = show ? 'auto' : 'none';
  });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
