document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-offerte-form]');
  const submitButton = form?.querySelector('[data-offerte-submit]');
  const popup = document.querySelector('[data-thank-you-popup]');
  const popupOverlay = popup?.querySelector('[data-popup-overlay]');
  const popupCloseButtons = popup?.querySelectorAll('[data-popup-close]');
  const popupMessage = popup?.querySelector('[data-thank-you-message]');

  if (!form || !submitButton || !popup || !popupOverlay || !popupCloseButtons?.length || !popupMessage) {
    return;
  }

  const defaultSubmitLabel = submitButton.textContent;
   const defaultCheckedServiceValue = form.querySelector('input[name="service"]:checked')?.value;
   const successMessage =
     form.getAttribute('data-success-message') ||
     'We hebben uw aanvraag ontvangen. U hoort meestal binnen 1 werkdag van ons.';
   const errorMessage =
     form.getAttribute('data-error-message') ||
     'Verzenden is niet gelukt. Probeer het opnieuw of neem direct contact met ons op.';
  let isSubmitting = false;

  const openPopup = (message) => {
    popupMessage.textContent = message;
    popup.setAttribute('aria-hidden', 'false');
    popup.classList.remove('opacity-0', 'pointer-events-none');
    document.body.classList.add('overflow-hidden');
  };

  const closePopup = () => {
    popup.setAttribute('aria-hidden', 'true');
    popup.classList.add('opacity-0', 'pointer-events-none');
    document.body.classList.remove('overflow-hidden');
  };

  popupCloseButtons.forEach((button) => {
    button.addEventListener('click', closePopup);
  });

  popupOverlay.addEventListener('click', closePopup);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && popup.getAttribute('aria-hidden') === 'false') {
      closePopup();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Bezig met verzenden...';

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const payload = await response.json();
      const isSuccess = response.ok && payload?.success;

      if (!isSuccess) {
        throw new Error(payload?.message || 'Er is iets misgegaan bij het verzenden.');
      }

      form.reset();

        const defaultService = defaultCheckedServiceValue
         ? form.querySelector(`input[name="service"][value="${defaultCheckedServiceValue}"]`)
         : form.querySelector('input[name="service"]');
        if (defaultService instanceof HTMLInputElement) {
        defaultService.checked = true;
      }

        openPopup(successMessage);
    } catch (error) {
        openPopup(errorMessage);
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = defaultSubmitLabel;
    }
  });
});
