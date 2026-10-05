// показую товари з масиву
const grid = document.getElementById("grid");

PRODUCTS.forEach(p => {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML =
    '<img src="' + p.img + '" alt="' + p.name + '">' +
    "<b>" + p.name + "</b>" +
    "<p>" + p.desc + "</p>" +
    '<p class="price">' + p.price + " ₴</p>";
  grid.appendChild(div);
});
