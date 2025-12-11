// Lightweight JS for billing toggle, modal, and order form
document.addEventListener("DOMContentLoaded", () => {
  // Helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Populate year
  $("#year").textContent = new Date().getFullYear();

  const billingToggle = $("#billing-toggle");
  const priceElements = $$(".price");

  // Update prices based on billing toggle
  function updatePrices() {
    const annual = billingToggle.checked;
    priceElements.forEach((el) => {
      const monthly = Number(el.dataset.monthly);
      const annualVal = Number(el.dataset.annual);
      const value = annual ? annualVal : monthly;
      el.querySelector(".price-value").textContent = value;
      el.querySelector(".per").textContent = annual ? "/yr" : "/mo";
    });
    // Also update any open modal billing select
    const billingSelect = $("#billing");
    if (billingSelect)
      billingSelect.value = billingToggle.checked ? "annual" : "monthly";
  }
  billingToggle.addEventListener("change", updatePrices);
  updatePrices();

  // Modal logic
  const modal = $("#order-modal");
  const modalClose = $("#modal-close");
  const backdrop = $("#backdrop");
  const orderBtns = $$(".order-btn");
  let activeTrigger = null;

  function openModal(plan, unitMonthly, unitAnnual) {
    activeTrigger = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $("#order-plan").textContent = plan;
    $(
      "#order-description"
    ).textContent = `${plan} — choose billing and quantity, then place your order.`;
    // Set default billing based on toggle
    $("#billing").value = billingToggle.checked ? "annual" : "monthly";
    // store prices on the form element for calculation
    const form = $("#order-form");
    form.dataset.plan = plan;
    form.dataset.monthly = unitMonthly;
    form.dataset.annual = unitAnnual;
    // set unit price display
    recalcSummary();
    modal.querySelector("#customer-name").focus();
    // trap focus
    trapFocus(modal);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (activeTrigger) activeTrigger.focus();
    releaseFocusTrap();
  }

  orderBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const plan = btn.dataset.plan;
      const monthly = Number(btn.dataset.monthly);
      const annual = Number(btn.dataset.annual);
      openModal(plan, monthly, annual);
    });
  });
  modalClose.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  // Order form calculation & submission
  const orderForm = $("#order-form");
  const qtyInput = $("#quantity");
  const billingSelect = $("#billing");
  const promoInput = $("#promo");
  const summaryUnit = $("#summary-unit");
  const summaryQty = $("#summary-qty");
  const summaryTotal = $("#summary-total");
  const orderMessage = $("#order-message");

  function recalcSummary() {
    const monthly = Number(orderForm.dataset.monthly || 0);
    const annual = Number(orderForm.dataset.annual || 0);
    const qty = Number(qtyInput.value || 1);
    const billing = billingSelect.value;
    const unit = billing === "annual" ? annual : monthly;
    let total = unit * qty;
    // Very simple promo handling (PROMO10 = 10% off)
    const promo = promoInput.value.trim().toUpperCase();
    if (promo === "PROMO10") total = Math.round(total * 0.9);
    summaryUnit.textContent = `$${unit}`;
    summaryQty.textContent = qty;
    summaryTotal.textContent = `$${total}`;
  }

  qtyInput.addEventListener("input", recalcSummary);
  billingSelect.addEventListener("change", recalcSummary);
  promoInput.addEventListener("input", recalcSummary);

  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    orderMessage.textContent = "";
    const name = $("#customer-name").value.trim();
    const email = $("#customer-email").value.trim();
    const qty = Number(qtyInput.value || 0);
    if (!name || !email || qty < 1) {
      orderMessage.textContent = "Please complete the form correctly.";
      return;
    }
    // Fake submit: in real site, send to server or payment API (Stripe, etc.)
    const payload = {
      plan: orderForm.dataset.plan,
      billing: billingSelect.value,
      qty,
      promo: promoInput.value.trim(),
    };
    // Simulate network delay
    orderMessage.textContent = "Placing your order...";
    setTimeout(() => {
      orderMessage.textContent = `Order received! ${payload.qty}× ${payload.plan} (${payload.billing}). A confirmation was sent to ${email}.`;
      orderForm.reset();
      recalcSummary();
      // In real life, redirect to payment or show payment widget
    }, 900);
  });

  // Accessibility: simple focus trap for modal
  let focusable = [];
  let firstFocusable = null;
  let lastFocusable = null;
  function trapFocus(node) {
    focusable = Array.from(
      node.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((n) => n.offsetParent !== null);
    firstFocusable = focusable[0];
    lastFocusable = focusable[focusable.length - 1];
    node.addEventListener("keydown", handleKeydown);
  }
  function releaseFocusTrap() {
    modal.removeEventListener("keydown", handleKeydown);
  }
  function handleKeydown(e) {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  // Initialize summary values
  recalcSummary();
});
