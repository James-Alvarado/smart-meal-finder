document.addEventListener("DOMContentLoaded", () => {
  const floatingItems = document.querySelectorAll(".float-chip");

  floatingItems.forEach((item, index) => {
    item.style.animationDuration = `${10 + index % 4}s`;
  });
});
