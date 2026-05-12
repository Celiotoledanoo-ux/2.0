// CAMBIO DE MÓDULOS
function showModule(id) {
  document.querySelectorAll('.module').forEach(m => {
    m.classList.remove('active');
  });

  document.getElementById(id).classList.add('active');
}

// TOGGLE SIDEBAR (☰)
document.getElementById('toggleBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});