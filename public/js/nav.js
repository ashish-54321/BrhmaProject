// ************* [ NavBar Logic For Up And Down Behavior  ]
const navEl = document.querySelector('.navbar');
const input = document.getElementById('myInput');

window.addEventListener('scroll', () => {
    if (window.scrollY >= 56) {
        navEl.classList.add('navbar-scrolled');
        input.focus();
    } else if (window.scrollY < 56) {
        navEl.classList.remove('navbar-scrolled');
    }
});