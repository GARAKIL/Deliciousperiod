// наші товари
const PRODUCTS = [
  { id: 1, name: "Подвійний Фірмовий", desc: "Дві яловичі котлети, сир чедер, огірок і фірмовий соус", price: 189, cat: "Бургери", img: "assets/img/menu-burger.jpg", badge: "Хіт" },
  { id: 2, name: "Чікен Кранч", desc: "Хрустке куряче філе, свіжий салат, томат і соус BBQ", price: 169, cat: "Бургери", img: "assets/img/hero-burger.jpg", badge: "Новинка" },
  { id: 3, name: "Картопля фрі", desc: "Золотиста, хрустка та з дрібкою солі", price: 69, cat: "Снеки", img: "assets/img/menu-fries.jpg" },
  { id: 4, name: "Нагетси, 6 шт.", desc: "Соковите куряче філе у хрусткій паніровці", price: 119, cat: "Снеки", img: "assets/img/menu-nuggets.jpg" },
  { id: 5, name: "Бургер Меню", desc: "Подвійний Фірмовий, велика картопля та напій", price: 269, cat: "Комбо", img: "assets/img/menu-burger.jpg", badge: "−15%" },
  { id: 6, name: "Чікен Меню", desc: "Чікен Кранч, нагетси та напій на вибір", price: 249, cat: "Комбо", img: "assets/img/hero-burger.jpg" },
];

// ресторани розкидаємо по різних селах навколо гостя (не всі в одній точці)
const REST_DEFS = [
  { name: "Центральний", hours: "10:00–23:00", dLat: 0.004, dLon: 0.003 },
  { name: "Зарічний", hours: "10:00–22:00", dLat: -0.024, dLon: 0.02 },
  { name: "Лісовий", hours: "11:00–23:00", dLat: 0.03, dLon: -0.026 },
];
// якщо місце не визначилось — показуємо Київ
const FALLBACK_POS = { lat: 50.4501, lon: 30.5234 };

// доставка 49 грн, а від 400 — безкоштовно
const DELIVERY_FEE = 49;
const FREE_FROM = 400;
