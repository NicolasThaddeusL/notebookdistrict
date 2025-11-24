// frontend/js/contact-modal.js

document.addEventListener('DOMContentLoaded', () => {
  const CONTACT_INFO = {
    whatsapp: {
      label: 'WhatsApp',
      value: '+62 811-953-863',
      link: 'https://wa.me/62811953863'
    },
    phone: {
      label: 'Phone',
      value: '+62 811-953-863',
      link: 'tel:+62811953863'
    },
    email: {
      label: 'Email',
      value: 'ntl@notebookdistrict.com',
      link: 'mailto:ntl@notebookdistrict.com'
    },
    ig: {
      label: 'Instagram',
      value: '@notebookdistrict',
      link: 'https://instagram.com/notebookdistrict'
    }
  };

  const contactItemsHtml = Object.values(CONTACT_INFO).map(item => `
    <li class="contact-item">
      <div class="contact-item-label">${item.label}</div>
      <div class="contact-item-value">
        ${item.link
          ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.value}</a>`
          : item.value}
      </div>
    </li>
  `).join('');

  const modalHtml = `
    <div class="modal-overlay" id="contactModalOverlay">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="contactModalTitle">
        <div class="modal-header">
          <div class="modal-title" id="contactModalTitle">Contact Us</div>
          <button class="modal-close" id="closeContactModal" aria-label="Close">&times;</button>
        </div>

        <ul class="contact-list">
          ${contactItemsHtml}
        </ul>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay  = document.getElementById('contactModalOverlay');
  const closeBtn = document.getElementById('closeContactModal');
  const openBtns = document.querySelectorAll('[data-contact-modal-open]');

  function openModal() {
    // Close any other modals first (login, settings, product, other contact)
    if (window.ndCloseAllModals) window.ndCloseAllModals();

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  closeBtn?.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('show')) {
      closeModal();
    }
  });
});
